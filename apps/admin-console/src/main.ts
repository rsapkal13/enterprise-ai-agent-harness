import "./styles.css";
import { registryObjects as seedRegistryObjects, type RegistryObject, type RegistryType } from "./registry-data";

type FilterState = {
  type: RegistryType | "all";
  risk: string;
  certification: "all" | "certified" | "not_certified";
  query: string;
};

type ChecklistItem = {
  label: string;
  passed: boolean;
  detail: string;
};

type ReviewAction = "intake" | "certify" | "block";

type ReviewEvent = {
  id: string;
  objectId: string;
  objectName: string;
  objectType: RegistryType;
  action: ReviewAction;
  decision: "approved" | "blocked" | "pending";
  reviewer: string;
  reason: string;
  timestamp: string;
  auditEventId: string;
};

type FormErrors = Record<string, string>;
type RegistryApiResponse = {
  objects: RegistryObject[];
  generatedAt: string;
};

type PublicSkill = {
  id: string;
  name: string;
  description: string;
  license: string;
  repo: string;
  sourcePath: string;
};

const DRAFT_STORAGE_KEY = "agentharness.adminConsole.localDrafts.v1";
const REVIEW_STORAGE_KEY = "agentharness.adminConsole.reviewEvents.v1";
const DEFAULT_PUBLIC_SKILLS_REPO = "https://github.com/anthropics/skills.git";
let seedIds = new Set(seedRegistryObjects.map((item) => item.id));
let registryObjects: RegistryObject[] = [...loadDrafts(), ...seedRegistryObjects];
let reviewEvents: ReviewEvent[] = loadReviewEvents();
let backendStatus = "Using bundled frontend fallback";
let publicSkills: PublicSkill[] = [];
let selectedPublicSkillIds = new Set<string>();
let publicSkillStatus = "Lookup available public skills from a GitHub repo before importing them into local governance.";

const state: FilterState & { selectedId: string; showRegistration: boolean; showImport: boolean; publicRepoUrl: string; notice: string; formErrors: FormErrors } = {
  type: "agent",
  risk: "all",
  certification: "all",
  query: "",
  selectedId: registryObjects[0]?.id ?? "customer-service-agent",
  showRegistration: false,
  showImport: false,
  publicRepoUrl: DEFAULT_PUBLIC_SKILLS_REPO,
  notice: "",
  formErrors: {},
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

function tone(value: string): string {
  const normal = value.toLowerCase();
  if (["active", "approved", "certified", "t1", "high", "ready"].includes(normal)) return "green";
  if (["t2", "pending_approval", "pending", "reversible_write", "draft"].includes(normal)) return "amber";
  if (["blocked", "not_certified", "irreversible_write", "t3", "low", "needs evidence"].includes(normal)) return "red";
  if (["skill", "tool"].includes(normal)) return "violet";
  return "cyan";
}

function chip(label: string, explicitTone?: string): string {
  return `<span class="chip ${explicitTone ?? tone(label)}">${escapeHtml(label)}</span>`;
}

function escapeHtml(value: unknown): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(value).replace(/[&<>"']/g, (char) => entities[char]);
}

function byType(type: RegistryType): RegistryObject[] {
  return registryObjects.filter((item) => item.type === type);
}

function selected(): RegistryObject {
  return registryObjects.find((item) => item.id === state.selectedId) ?? registryObjects[0];
}

function filtered(): RegistryObject[] {
  const query = state.query.toLowerCase();
  return registryObjects.filter((item) => {
    if (state.type !== "all" && item.type !== state.type) return false;
    if (state.risk !== "all" && item.riskTier !== state.risk) return false;
    if (state.certification === "certified" && !item.aiHarnessCertified) return false;
    if (state.certification === "not_certified" && item.aiHarnessCertified) return false;
    if (!query) return true;
    return [
      item.id,
      item.name,
      item.type,
      item.owner,
      item.description,
      item.relationships.join(" "),
      item.policies.join(" "),
    ].join(" ").toLowerCase().includes(query);
  });
}

function metrics(): Array<[string, number, string, string]> {
  return [
    ["Agents", byType("agent").length, "registered capability owners", "agent"],
    ["Skills", byType("skill").length, "business capabilities", "skill"],
    ["Tools", byType("tool").length, "governed system access", "tool"],
    ["Approval queue", approvalQueueItems().length, "awaiting decision", "approval-panel"],
    ["Review events", reviewEvents.length, "local audit evidence", "evidence-panel"],
    ["Local drafts", localDraftCount(), "stored in this browser", "drafts"],
    ["Certification gaps", registryObjects.filter((item) => !item.aiHarnessCertified).length, "blocked until reviewed", "gaps"],
  ];
}

function render(): void {
  const current = selected();
  const list = filtered();

  app.innerHTML = `
    <div class="ms-root">
      <nav class="ms-topnav">
        <button class="ms-waffle" type="button" aria-label="App launcher">
          <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
            <circle cx="4" cy="4" r="1.5"/><circle cx="10" cy="4" r="1.5"/><circle cx="16" cy="4" r="1.5"/>
            <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
            <circle cx="4" cy="16" r="1.5"/><circle cx="10" cy="16" r="1.5"/><circle cx="16" cy="16" r="1.5"/>
          </svg>
        </button>
        <span class="ms-topnav-brand">AgentHarness</span>
        <span class="ms-topnav-sep"></span>
        <span class="ms-topnav-product">Governance Portal</span>
        <div class="ms-topnav-section">
          <span class="ms-env-chip">TEST</span>
          <button class="ms-nav-icon-btn" type="button" aria-label="Help">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 11.5v-.5c0-.9.5-1.4 1.1-1.9.7-.5 1.1-1.1 1.1-1.8A2.2 2.2 0 0 0 10 5.2 2.2 2.2 0 0 0 7.8 7.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="10" cy="14.2" r=".9" fill="currentColor"/>
            </svg>
          </button>
          <button class="ms-nav-icon-btn" type="button" aria-label="Settings">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="ms-avatar" aria-label="User account">AH</div>
        </div>
      </nav>

      <div class="app-shell">
        <aside class="sidebar">
          <div class="sidebar-app-header">
            <div class="sidebar-app-name">Governance Portal</div>
            <div class="sidebar-app-org">AgentHarness · v0.2</div>
          </div>

          <div class="sidebar-search-wrap">
            <svg class="sidebar-search-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <span class="sidebar-search-placeholder">Search</span>
          </div>

          <nav class="sidebar-nav">
            <div class="nav-section">
              <div class="nav-section-label">Registry</div>
              ${renderTab("agent", "Agent Registry", byType("agent").length)}
              ${renderTab("skill", "Skill Registry", byType("skill").length)}
              ${renderTab("tool", "Tool Registry", byType("tool").length)}
              ${renderTab("all", "All Objects", registryObjects.length)}
            </div>

            <div class="nav-section">
              <div class="nav-section-label">Govern</div>
              <button class="nav-item-static" data-scroll="approval-panel" type="button">
                <!-- Inbox tray with down-arrow — approval queue / items waiting for decision -->
                <svg class="tab-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2.5" y="12" width="15" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M10 2.5v7M7 6.5l3 3.5 3-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="tab-label">Approval Queue</span>
                <span class="nav-badge">${approvalQueueItems().length}</span>
              </button>
              <button class="nav-item-static" disabled type="button">
                <!-- Shield — policy enforcement -->
                <svg class="tab-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2.5L16.5 5v5c0 3.5-2.7 6.4-6.5 7.5C6.2 16.4 3.5 13.5 3.5 10V5L10 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M7.5 10l2 2 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="tab-label">Policy Engine</span>
                <span class="nav-badge coming">v0.3</span>
              </button>
            </div>

            <div class="nav-section">
              <div class="nav-section-label">Certify &amp; Audit</div>
              <button class="nav-item-static" data-scroll="evidence-panel" type="button">
                <!-- Scroll / log — ordered audit trail -->
                <svg class="tab-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 3.5h8a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 17V5A1.5 1.5 0 0 1 6 3.5z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M7.5 8h5M7.5 11h5M7.5 14h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="tab-label">Evidence Trail</span>
                <span class="nav-badge">${reviewEvents.length}</span>
              </button>
              <button class="nav-item-static" data-scroll="graph-panel" type="button">
                <!-- Connected nodes — dependency relationships -->
                <svg class="tab-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
                  <circle cx="3.5" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/>
                  <circle cx="16.5" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/>
                  <circle cx="10" cy="17.5" r="2" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M5.2 5.6L8 8M14.8 5.6L12 8M10 12.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="tab-label">Dependency Graph</span>
              </button>
              <button class="nav-item-static" disabled type="button">
                <!-- Bar chart — compliance scoring -->
                <svg class="tab-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 16.5h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <rect x="4" y="10" width="3" height="6.5" rx="0.5" stroke="currentColor" stroke-width="1.3"/>
                  <rect x="8.5" y="6" width="3" height="10.5" rx="0.5" stroke="currentColor" stroke-width="1.3"/>
                  <rect x="13" y="3" width="3" height="13.5" rx="0.5" stroke="currentColor" stroke-width="1.3"/>
                </svg>
                <span class="tab-label">Compliance Scores</span>
                <span class="nav-badge coming">v0.3</span>
              </button>
            </div>
          </nav>

          <div class="sidebar-note">v0.2 local runtime preview · fictional telco example data</div>
        </aside>

        <main>
          <header class="topbar">
            <input id="search" class="search" type="search" value="${escapeHtml(state.query)}" placeholder="Search registry objects, relationships, policies..." />
            <select id="riskFilter" class="select">
              ${option("all", "All risk tiers", state.risk)}
              ${option("T0", "T0", state.risk)}
              ${option("T1", "T1", state.risk)}
              ${option("T2", "T2", state.risk)}
              ${option("T3", "T3", state.risk)}
            </select>
            <select id="certFilter" class="select">
              ${option("all", "All certification states", state.certification)}
              ${option("certified", "AI Harness Certified", state.certification)}
              ${option("not_certified", "Not certified", state.certification)}
            </select>
            ${localDraftCount() ? '<button id="clearDrafts" class="secondary-action" type="button">Clear drafts</button>' : ""}
            <button id="importSkills" class="secondary-action" type="button">Import skills</button>
            <button id="newRegistration" class="primary-action" type="button">Register new</button>
          </header>

          <div class="main-layout">
            <section class="content">
              <div class="hero">
                <div class="hero-card">
                  <div class="eyebrow"><span class="eyebrow-text">v0.2 · Governance portal</span></div>
                  <h1>Agent Governance overview</h1>
                  <p>
                    Register, certify, and govern agents, skills, and tools across your telco platform.
                    Inspect risk tiers, certification readiness, policy coverage, and dependency relationships
                    before approving any registry change.
                  </p>
                </div>
                <div class="hero-card">
                  <div class="eyebrow"><span class="eyebrow-text">Build status</span></div>
                  <div class="release-list">
                    <div class="release-row"><span>Mode</span><b>Local draft registration</b></div>
                    <div class="release-row"><span>Source</span><b>${escapeHtml(backendStatus)}</b></div>
                    <div class="release-row"><span>Persistence</span><b>Browser local storage</b></div>
                    <div class="release-row"><span>Review</span><b>Approval evidence trail</b></div>
                  </div>
                </div>
              </div>

            ${state.notice ? `<div class="notice">${escapeHtml(state.notice)}</div>` : ""}
            ${state.showImport ? renderPublicSkillImportPanel() : ""}
            ${state.showRegistration ? renderRegistrationForm() : ""}

            <div class="kpi-grid">
              ${metrics().map(([label, value, note, action]) => `
                <button class="kpi" data-kpi="${escapeHtml(action)}" type="button">
                  <div class="kpi-label">${label}</div>
                  <div class="kpi-value">${value}</div>
                  <div class="kpi-note">${note}</div>
                </button>
              `).join("")}
            </div>

            ${renderRelationshipGraph()}
            ${renderApprovalQueue()}
            ${renderEvidencePanel()}

            <div class="workspace">
              <section class="panel">
                <div class="panel-head">
                  <div>
                    <div class="eyebrow">${state.type === "all" ? "Registry explorer" : `${state.type} registry`}</div>
                    <div class="panel-title">${list.length} object${list.length === 1 ? "" : "s"} shown</div>
                    <div class="panel-subtitle">Click an object to inspect certification, policies, contracts, and relationships.</div>
                  </div>
                  ${chip(state.type === "all" ? "all" : state.type)}
                </div>
                <div class="registry-list">
                  ${list.length ? list.map(renderRegistryCard).join("") : '<div class="empty">No registry objects match the current filters.</div>'}
                </div>
              </section>
            </div>
          </section>
          <aside class="detail-rail" aria-label="Selected object details">
            ${renderDetail(current)}
          </aside>
          </div>
        </main>
      </div>
    </div>
  `;

  bindEvents();
}

function renderTab(type: RegistryType | "all", label: string, count: number): string {
  const icons: Record<RegistryType | "all", string> = {
    // Person silhouette — represents an AI agent
    agent: `<svg class="tab-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="6.5" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M3.5 17c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    // Lightning bolt — reusable business capability
    skill: `<svg class="tab-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 2.5L5 11h6l-2 6.5L18 8.5h-6l1.5-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    // Wrench — system tool / governed integration
    tool: `<svg class="tab-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.8 2.2a3.5 3.5 0 0 0-4.6 4.6L3.5 13.5a1.5 1.5 0 1 0 2.1 2.1l6.7-6.7A3.5 3.5 0 0 0 14.8 2.2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    // 2×2 grid — all object types
    all: `<svg class="tab-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11.5" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>`,
  };
  return `
    <button class="tab ${state.type === type ? "active" : ""}" data-type="${type}">
      ${icons[type] ?? ""}
      <span class="tab-label">${label}</span>
      <span class="tab-count">${count}</span>
    </button>
  `;
}

function option(value: string, label: string, selected: string): string {
  return `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`;
}

function renderRegistrationForm(): string {
  const type = state.type === "all" ? "agent" : state.type;
  return `
    <section class="registration-panel">
      <div class="panel-head">
        <div>
          <div class="eyebrow">New registry request</div>
          <div class="panel-title">Register an agent, skill, or tool</div>
          <div class="panel-subtitle">Creates a local draft only after schema-style validation passes.</div>
        </div>
        ${chip("draft registration", "amber")}
      </div>
      ${renderValidationSummary()}
      <form id="registrationForm" class="registration-form">
        <label>
          <span>Object type</span>
          <select name="type" class="field">
            ${option("agent", "Agent", type)}
            ${option("skill", "Skill", type)}
            ${option("tool", "Tool", type)}
          </select>
        </label>
        <label>
          <span>Registry ID</span>
          <input name="id" class="field" required placeholder="customer.handle_refund" />
          ${fieldError("id")}
        </label>
        <label>
          <span>Name</span>
          <input name="name" class="field" required placeholder="Customer Refund Handler" />
          ${fieldError("name")}
        </label>
        <label>
          <span>Owner</span>
          <input name="owner" class="field" required placeholder="customer-care-platform" />
          ${fieldError("owner")}
        </label>
        <label>
          <span>Risk tier</span>
          <select name="riskTier" class="field">
            ${option("T0", "T0 - Informational", "T2")}
            ${option("T1", "T1 - Bounded operational", "T2")}
            ${option("T2", "T2 - Transactional", "T2")}
            ${option("T3", "T3 - High impact", "T2")}
          </select>
        </label>
        <label>
          <span>Side effects</span>
          <select name="sideEffects" class="field">
            ${option("", "Not applicable", "")}
            ${option("read_only", "Read only", "")}
            ${option("reversible_write", "Reversible write", "")}
            ${option("irreversible_write", "Irreversible write", "")}
          </select>
          ${fieldError("sideEffects")}
        </label>
        <label>
          <span>Target system</span>
          <input name="targetSystem" class="field" placeholder="fictional-order-system" />
          ${fieldError("targetSystem")}
        </label>
        <label class="span-2">
          <span>Description</span>
          <textarea name="description" class="field" required placeholder="Describe purpose, scope, and expected governance boundaries."></textarea>
          ${fieldError("description")}
        </label>
        <label class="span-2">
          <span>Policies</span>
          <input name="policies" class="field" placeholder="customer_data.access, consent.required" />
          ${fieldError("policies")}
        </label>
        <div class="span-2 relationship-field">
          <span class="form-label">Relationships</span>
          ${renderRelationshipPicker()}
          <input name="relationships" class="field" placeholder="Add other object IDs, comma separated" />
          ${fieldError("relationships")}
        </div>
        <div class="form-actions span-2">
          <button class="secondary-action" id="cancelRegistration" type="button">Cancel</button>
          <button class="primary-action" type="submit">Create draft registration</button>
        </div>
      </form>
    </section>
  `;
}

function renderPublicSkillImportPanel(): string {
  return `
    <section class="import-panel">
      <div class="panel-head">
        <div>
          <div class="eyebrow">Public skill lookup</div>
          <div class="panel-title">Import skills from GitHub</div>
          <div class="panel-subtitle">Discover public Skill folders, review their SKILL.md source, then import selected skills into the local governance store.</div>
        </div>
        ${chip("persistent API store", "cyan")}
      </div>
      <div class="import-controls">
        <label>
          <span>Public repository</span>
          <input id="publicSkillRepo" class="field" value="${escapeHtml(state.publicRepoUrl)}" placeholder="https://github.com/anthropics/skills.git" />
        </label>
        <div class="import-actions">
          <button id="loadPublicSkills" class="secondary-action" type="button">Lookup skills</button>
          <button id="importSelectedSkills" class="primary-action" type="button" ${selectedPublicSkillIds.size ? "" : "disabled"}>Import selected</button>
          <button id="cancelImportSkills" class="secondary-action" type="button">Close</button>
        </div>
      </div>
      <div class="import-status">${escapeHtml(publicSkillStatus)}</div>
      <div class="public-skill-list">
        ${publicSkills.length ? publicSkills.map(renderPublicSkillCard).join("") : '<div class="empty">No public skills loaded yet.</div>'}
      </div>
    </section>
  `;
}

function renderPublicSkillCard(skill: PublicSkill): string {
  const importId = publicSkillRegistryId(skill);
  const alreadyImported = registryObjects.some((item) => item.id === importId);
  const checked = selectedPublicSkillIds.has(skill.id) ? "checked" : "";
  return `
    <label class="public-skill-card">
      <input type="checkbox" data-public-skill-id="${escapeHtml(skill.id)}" ${checked} />
      <span>
        <b>${escapeHtml(skill.name)}</b>
        <small>${escapeHtml(skill.id)} · ${escapeHtml(skill.license)}${alreadyImported ? " · already imported" : ""}</small>
        <p>${escapeHtml(skill.description)}</p>
      </span>
    </label>
  `;
}

function renderValidationSummary(): string {
  const errors = Object.values(state.formErrors);
  if (!errors.length) {
    return `
      <div class="validation-summary neutral">
        ${chip("schema-style checks", "cyan")}
        <span>Required fields, duplicate IDs, policy coverage, relationships, and tool side effects are checked before draft creation.</span>
      </div>
    `;
  }
  return `
    <div class="validation-summary error">
      ${chip(`${errors.length} validation issue${errors.length === 1 ? "" : "s"}`, "red")}
      <ul>
        ${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function fieldError(field: string): string {
  const error = state.formErrors[field];
  return error ? `<small class="field-error">${escapeHtml(error)}</small>` : "";
}

function renderRelationshipPicker(): string {
  const candidates = registryObjects.filter((item) => seedIds.has(item.id));
  return `
    <div class="relationship-picker">
      ${candidates.map((item) => `
        <label class="check-row">
          <input type="checkbox" name="relationshipRefs" value="${escapeHtml(item.id)}" />
          <span>
            <b>${escapeHtml(item.id)}</b>
            <small>${escapeHtml(item.type)} / ${escapeHtml(item.riskTier)} / ${item.aiHarnessCertified ? "certified" : "not certified"}</small>
          </span>
        </label>
      `).join("")}
    </div>
  `;
}

function renderRelationshipGraph(): string {
  const agents = byType("agent");
  const graphGaps = relationshipGaps();
  return `
    <section class="graph-panel" id="graph-panel">
      <div class="panel-head">
        <div>
          <div class="eyebrow">Dependency graph</div>
          <div class="panel-title">Agent to skill to tool relationships</div>
          <div class="panel-subtitle">Review certified and blocked dependencies before approving registry changes.</div>
        </div>
        <div class="graph-summary">
          ${chip(`${graphGaps.uncertified} uncertified`, graphGaps.uncertified ? "red" : "green")}
          ${chip(`${graphGaps.unknown} unknown`, graphGaps.unknown ? "red" : "green")}
        </div>
      </div>
      <div class="graph-canvas">
        ${agents.map(renderAgentGraphLane).join("")}
      </div>
    </section>
  `;
}

function renderAgentGraphLane(agent: RegistryObject): string {
  const skills = agent.relationships
    .map(findRegistryObject)
    .filter((item): item is RegistryObject => Boolean(item && item.type === "skill"));
  const directTools = agent.relationships
    .map(findRegistryObject)
    .filter((item): item is RegistryObject => Boolean(item && item.type === "tool"));
  const missing = agent.relationships.filter((id) => !findRegistryObject(id));
  return `
    <div class="graph-lane">
      <div class="graph-column">
        <div class="graph-label">Agent</div>
        ${renderGraphNode(agent)}
      </div>
      <div class="graph-connector" aria-hidden="true"></div>
      <div class="graph-column wide">
        <div class="graph-label">Skills</div>
        <div class="graph-node-stack">
          ${skills.length ? skills.map(renderGraphNode).join("") : renderGraphEmpty("No skill links")}
        </div>
      </div>
      <div class="graph-connector" aria-hidden="true"></div>
      <div class="graph-column wide">
        <div class="graph-label">Tools</div>
        <div class="graph-node-stack">
          ${renderToolsForSkills(skills, directTools)}
        </div>
      </div>
      ${missing.length ? `
        <div class="graph-warning">
          ${chip("missing links", "red")}
          <span>${escapeHtml(missing.join(", "))}</span>
        </div>
      ` : ""}
    </div>
  `;
}

function renderToolsForSkills(skills: RegistryObject[], directTools: RegistryObject[]): string {
  const tools = new Map<string, RegistryObject>();
  directTools.forEach((tool) => tools.set(tool.id, tool));
  skills.forEach((skill) => {
    skill.relationships
      .map(findRegistryObject)
      .filter((item): item is RegistryObject => Boolean(item && item.type === "tool"))
      .forEach((tool) => tools.set(tool.id, tool));
  });
  const values = Array.from(tools.values());
  return values.length ? values.map(renderGraphNode).join("") : renderGraphEmpty("No tool links");
}

function renderGraphNode(item: RegistryObject): string {
  const status = item.aiHarnessCertified ? "certified" : item.lifecycleState === "blocked" ? "blocked" : "not certified";
  return `
    <button class="graph-node ${item.id === state.selectedId ? "selected" : ""} ${item.aiHarnessCertified ? "certified" : "gap"}" data-select="${escapeHtml(item.id)}" type="button">
      <span class="graph-node-title">${escapeHtml(item.name)}</span>
      <span class="graph-node-id">${escapeHtml(item.id)}</span>
      <span class="graph-node-meta">
        ${chip(item.type)}
        ${chip(item.riskTier)}
        ${chip(status, item.aiHarnessCertified ? "green" : "red")}
      </span>
    </button>
  `;
}

function renderGraphEmpty(label: string): string {
  return `<div class="graph-empty">${escapeHtml(label)}</div>`;
}

function renderApprovalQueue(): string {
  const queue = approvalQueueItems();
  return `
    <section class="approval-panel" id="approval-panel">
      <div class="panel-head">
        <div>
          <div class="eyebrow">Approval queue</div>
          <div class="panel-title">${queue.length} review item${queue.length === 1 ? "" : "s"}</div>
          <div class="panel-subtitle">Approve intake, certify ready objects, or block registrations that should not run.</div>
        </div>
        ${chip("local workflow", "cyan")}
      </div>
      <div class="approval-list">
        ${queue.length ? queue.map(renderApprovalItem).join("") : '<div class="empty">No registry objects are waiting for approval.</div>'}
      </div>
    </section>
  `;
}

function renderApprovalItem(item: RegistryObject): string {
  const score = checklistScore(item);
  const localLabel = seedIds.has(item.id) ? "sample" : "local draft";
  return `
    <article class="approval-card">
      <button class="approval-main" data-select="${escapeHtml(item.id)}" type="button">
        <span class="object-id">${escapeHtml(item.id)}</span>
        <span class="object-name">${escapeHtml(item.name)}</span>
        <span class="card-meta">
          ${chip(item.type)}
          ${chip(item.riskTier)}
          ${chip(item.lifecycleState)}
          ${chip(reviewRecommendation(item), tone(reviewRecommendation(item)))}
          ${chip(`${score.passed}/${score.total} checks`, score.passed === score.total ? "green" : "amber")}
          ${chip(localLabel, seedIds.has(item.id) ? "violet" : "cyan")}
        </span>
      </button>
      <div class="approval-actions">
        <input class="review-note compact-field" data-review-note="${escapeHtml(item.id)}" placeholder="Decision note" />
        <button class="secondary-action compact" data-review-action="intake" data-review-id="${escapeHtml(item.id)}" type="button" ${item.lifecycleState !== "draft" ? "disabled" : ""}>Approve intake</button>
        <button class="primary-action compact" data-review-action="certify" data-review-id="${escapeHtml(item.id)}" type="button" ${canCertify(item) ? "" : "disabled"}>Certify</button>
        <button class="danger-action compact" data-review-action="block" data-review-id="${escapeHtml(item.id)}" type="button">Block</button>
      </div>
    </article>
  `;
}

function renderEvidencePanel(): string {
  const recentEvents = reviewEvents.slice(0, 5);
  return `
    <section class="evidence-panel" id="evidence-panel">
      <div class="panel-head">
        <div>
          <div class="eyebrow">Evidence trail</div>
          <div class="panel-title">${reviewEvents.length} local review event${reviewEvents.length === 1 ? "" : "s"}</div>
          <div class="panel-subtitle">Every local approval action creates a simulated audit-event preview for reviewability.</div>
        </div>
        ${chip("audit preview", "violet")}
      </div>
      <div class="evidence-list">
        ${recentEvents.length ? recentEvents.map(renderEvidenceEvent).join("") : '<div class="empty">No approval evidence has been created yet.</div>'}
      </div>
    </section>
  `;
}

function renderEvidenceEvent(event: ReviewEvent): string {
  return `
    <article class="evidence-card">
      <div>
        <div class="object-id">${escapeHtml(event.auditEventId)}</div>
        <div class="object-name">${escapeHtml(event.objectName)}</div>
        <div class="card-meta">
          ${chip(event.action)}
          ${chip(event.decision, event.decision === "blocked" ? "red" : event.decision === "approved" ? "green" : "amber")}
          ${chip(event.objectType)}
        </div>
      </div>
      <div class="evidence-copy">
        <b>${escapeHtml(event.reviewer)}</b>
        <span>${escapeHtml(formatTimestamp(event.timestamp))}</span>
        <p>${escapeHtml(event.reason)}</p>
      </div>
    </article>
  `;
}

function renderRegistryCard(item: RegistryObject): string {
  const selectedClass = item.id === state.selectedId ? "selected" : "";
  const score = checklistScore(item);
  return `
    <article class="registry-card ${selectedClass}">
      <button data-select="${escapeHtml(item.id)}">
        <div class="object-id">${escapeHtml(item.id)}</div>
        <div class="object-name">${escapeHtml(item.name)}</div>
        <div class="card-meta">
          ${chip(item.type)}
          ${chip(item.riskTier)}
          ${chip(item.lifecycleState)}
          ${chip(item.aiHarnessCertified ? "certified" : "not_certified", item.aiHarnessCertified ? "green" : "red")}
          ${chip(`${score.passed}/${score.total} checks`, score.passed === score.total ? "green" : "amber")}
          ${item.sideEffects ? chip(item.sideEffects) : ""}
        </div>
      </button>
      <div class="card-meta">
        ${chip(item.approvalState, tone(item.approvalState))}
      </div>
    </article>
  `;
}

function renderDetail(item: RegistryObject): string {
  return `
    <section class="detail-panel">
      <div class="eyebrow">${item.type} detail</div>
      <h2>${escapeHtml(item.name)}</h2>
      <p class="detail-description">${escapeHtml(item.description)}</p>
      <div class="detail-meta">
        ${chip(item.id, "cyan")}
        ${chip(item.riskTier)}
        ${chip(item.lifecycleState)}
        ${chip(item.aiHarnessCertified ? "AI Harness Certified" : "Not Certified", item.aiHarnessCertified ? "green" : "red")}
      </div>
      ${kv("Source", item.sourcePath)}
      ${renderSourceReview(item)}
      ${kv("Version", item.version)}
      ${kv("Owner", item.owner)}
      ${kv("Environment", item.environment)}
      ${kv("Approval", item.approvalState)}
      ${kv("Certification", item.certificationEvidence)}
      ${kv("Readiness", renderChecklist(item))}
      ${kv("Decision note", renderDecisionNote(item))}
      ${kv("Review actions", renderReviewActions(item))}
      ${kv("Review history", renderObjectHistory(item))}
      ${kv("Data classes", item.dataClasses.map((value) => chip(value)).join(" "))}
      ${kv("Policies", item.policies.map((value) => chip(value)).join(" "))}
      ${item.inputs ? kv("Inputs", item.inputs.map((value) => chip(value)).join(" ")) : ""}
      ${item.outputs ? kv("Outputs", item.outputs.map((value) => chip(value)).join(" ")) : ""}
      ${item.sideEffects ? kv("Side effects", chip(item.sideEffects)) : ""}
      ${item.targetSystem ? kv("Target system", item.targetSystem) : ""}
      ${kv("Relationships", `<div class="relationship-list">${item.relationships.map((value) => chip(value)).join("") || chip("none", "red")}</div>`)}
    </section>
  `;
}

function renderSourceReview(item: RegistryObject): string {
  const source = sourceFor(item);
  const extension = item.sourcePath.split(".").pop() || "txt";
  const language = source.available ? extension : "yaml";
  return `
    <section class="source-review">
      <div class="source-review-head">
        <div>
          <div class="source-review-title">Source review</div>
          <div class="source-review-path">${escapeHtml(item.sourcePath)}</div>
        </div>
        ${chip(language)}
      </div>
      <pre class="source-code" tabindex="0"><code>${escapeHtml(source.content)}</code></pre>
    </section>
  `;
}

function sourceFor(item: RegistryObject): { available: boolean; content: string } {
  if (item.sourceContent) {
    return { available: item.sourceAvailable ?? true, content: item.sourceContent.trimEnd() };
  }

  return {
    available: false,
    content: [
      `id: ${item.id}`,
      `type: ${item.type}`,
      `name: ${item.name}`,
      `version: ${item.version}`,
      `owner: ${item.owner}`,
      `risk_tier: ${item.riskTier}`,
      `lifecycle_state: ${item.lifecycleState}`,
      `environment: ${item.environment}`,
      `source: ${item.sourcePath}`,
      "policies:",
      ...item.policies.map((policy) => `  - ${policy}`),
      "relationships:",
      ...item.relationships.map((relationship) => `  - ${relationship}`),
      item.inputs?.length ? "inputs:" : "",
      ...(item.inputs ?? []).map((input) => `  - ${input}`),
      item.outputs?.length ? "outputs:" : "",
      ...(item.outputs ?? []).map((output) => `  - ${output}`),
      item.sideEffects ? `side_effects: ${item.sideEffects}` : "",
      item.targetSystem ? `target_system: ${item.targetSystem}` : "",
      "review_note: Source file is not bundled; showing registry snapshot for review.",
    ].filter(Boolean).join("\n"),
  };
}

function kv(key: string, value: string): string {
  return `
    <div class="kv">
      <div class="kv-key">${escapeHtml(key)}</div>
      <div class="kv-value">${value}</div>
    </div>
  `;
}

function renderChecklist(item: RegistryObject): string {
  return `
    <div class="checklist">
      ${certificationChecklist(item).map((check) => `
        <div class="checklist-item ${check.passed ? "passed" : "failed"}">
          <span class="check-icon">${check.passed ? "OK" : "!"}</span>
          <span class="check-copy">
            <b>${escapeHtml(check.label)}</b>
            <small>${escapeHtml(check.detail)}</small>
          </span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderReviewActions(item: RegistryObject): string {
  return `
    <div class="detail-actions">
      <button class="secondary-action compact" data-review-action="intake" data-review-id="${escapeHtml(item.id)}" type="button" ${item.lifecycleState !== "draft" ? "disabled" : ""}>Approve intake</button>
      <button class="primary-action compact" data-review-action="certify" data-review-id="${escapeHtml(item.id)}" type="button" ${canCertify(item) ? "" : "disabled"}>Certify</button>
      <button class="danger-action compact" data-review-action="block" data-review-id="${escapeHtml(item.id)}" type="button">Block</button>
    </div>
  `;
}

function renderDecisionNote(item: RegistryObject): string {
  return `<textarea class="field decision-note" data-review-note="${escapeHtml(item.id)}" placeholder="Add a review reason before approving, certifying, or blocking."></textarea>`;
}

function renderObjectHistory(item: RegistryObject): string {
  const history = reviewEvents.filter((event) => event.objectId === item.id).slice(0, 4);
  if (!history.length) return '<div class="history-empty">No review events recorded yet.</div>';
  return `
    <div class="history-list">
      ${history.map((event) => `
        <div class="history-item">
          <div>
            <b>${escapeHtml(event.action)}</b>
            <span>${escapeHtml(event.auditEventId)}</span>
          </div>
          <small>${escapeHtml(formatTimestamp(event.timestamp))} by ${escapeHtml(event.reviewer)}</small>
          <p>${escapeHtml(event.reason)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function certificationChecklist(item: RegistryObject): ChecklistItem[] {
  const checks: ChecklistItem[] = [
    {
      label: "Owner assigned",
      passed: Boolean(item.owner && item.owner !== "unknown"),
      detail: item.owner || "Missing owner",
    },
    {
      label: "Risk tier declared",
      passed: ["T0", "T1", "T2", "T3"].includes(item.riskTier),
      detail: item.riskTier,
    },
    {
      label: "Policy coverage",
      passed: item.policies.length > 0 && !item.policies.includes("policy-review-required"),
      detail: item.policies.length ? item.policies.join(", ") : "No policies attached",
    },
    {
      label: "Relationships mapped",
      passed: item.relationships.length > 0,
      detail: item.relationships.length ? `${item.relationships.length} linked object(s)` : "No linked objects",
    },
    {
      label: "Certification evidence",
      passed: item.aiHarnessCertified || !item.certificationEvidence.toLowerCase().includes("requires review"),
      detail: item.certificationEvidence,
    },
  ];

  if (item.type !== "agent") {
    checks.push({
      label: "Contract declared",
      passed: Boolean(item.inputs?.length && item.outputs?.length && !item.inputs.includes("to_be_defined") && !item.outputs.includes("to_be_defined")),
      detail: `${item.inputs?.length ?? 0} inputs, ${item.outputs?.length ?? 0} outputs`,
    });
  }

  if (item.type === "tool") {
    checks.push(
      {
        label: "Side effects declared",
        passed: Boolean(item.sideEffects),
        detail: item.sideEffects ?? "Missing side-effect classification",
      },
      {
        label: "Target system declared",
        passed: Boolean(item.targetSystem),
        detail: item.targetSystem ?? "Missing target system",
      },
    );
  }

  return checks;
}

function checklistScore(item: RegistryObject): { passed: number; total: number } {
  const checks = certificationChecklist(item);
  return {
    passed: checks.filter((check) => check.passed).length,
    total: checks.length,
  };
}

function approvalQueueItems(): RegistryObject[] {
  return registryObjects.filter((item) => item.approvalState !== "approved" || !item.aiHarnessCertified || item.lifecycleState === "draft");
}

function reviewRecommendation(item: RegistryObject): string {
  if (item.approvalState === "blocked" || item.lifecycleState === "blocked") return "blocked";
  if (canCertify(item)) return "ready";
  if (item.lifecycleState === "draft") return "draft";
  return "needs evidence";
}

function canCertify(item: RegistryObject): boolean {
  const blockingChecks = certificationChecklist(item).filter((check) => check.label !== "Certification evidence");
  return blockingChecks.every((check) => check.passed);
}

function findRegistryObject(id: string): RegistryObject | undefined {
  return registryObjects.find((item) => item.id === id);
}

function relationshipGaps(): { uncertified: number; unknown: number } {
  const linkedIds = new Set(registryObjects.flatMap((item) => item.relationships));
  let uncertified = 0;
  let unknown = 0;
  linkedIds.forEach((id) => {
    const item = findRegistryObject(id);
    if (!item) {
      unknown += 1;
    } else if (!item.aiHarnessCertified) {
      uncertified += 1;
    }
  });
  return { uncertified, unknown };
}

function applyReviewDecision(id: string, action: ReviewAction, reason: string): void {
  const item = registryObjects.find((candidate) => candidate.id === id);
  if (!item) return;

  const decisionReason = reason.trim() || defaultReviewReason(action, item);

  if (action === "intake") {
    item.lifecycleState = "pending_approval";
    item.approvalState = "pending";
    item.certificationEvidence = "Intake approved in local portal. Certification still requires readiness checks and review evidence.";
    state.notice = `${item.name} passed intake review and remains pending certification.`;
  }

  if (action === "certify") {
    if (!canCertify(item)) {
      state.notice = `${item.name} cannot be certified until readiness gaps are resolved.`;
      render();
      return;
    }
    item.lifecycleState = "active";
    item.approvalState = "approved";
    item.aiHarnessCertified = true;
    item.certificationEvidence = "AI Harness Certified through local approval queue prototype.";
    state.notice = `${item.name} is now approved and AI Harness Certified in this local portal.`;
  }

  if (action === "block") {
    item.lifecycleState = "blocked";
    item.approvalState = "blocked";
    item.aiHarnessCertified = false;
    item.certificationEvidence = "Blocked in local approval queue prototype. Requires remediation before activation.";
    state.notice = `${item.name} was blocked and removed from active certification eligibility.`;
  }

  const reviewEvent = createReviewEvent(item, action, decisionReason);
  reviewEvents.unshift(reviewEvent);
  persistBackendReview(reviewEvent);
  state.selectedId = item.id;
  saveDrafts();
  saveReviewEvents();
  render();
}

function createReviewEvent(item: RegistryObject, action: ReviewAction, reason: string): ReviewEvent {
  const timestamp = new Date().toISOString();
  const decision = action === "block" ? "blocked" : action === "certify" ? "approved" : "pending";
  const compactTime = timestamp.replace(/[-:.TZ]/g, "").slice(0, 14);
  return {
    id: `review-${compactTime}-${item.id}`,
    objectId: item.id,
    objectName: item.name,
    objectType: item.type,
    action,
    decision,
    reviewer: "local-reviewer",
    reason,
    timestamp,
    auditEventId: `audit.${compactTime}.${item.id}.${action}`,
  };
}

function defaultReviewReason(action: ReviewAction, item: RegistryObject): string {
  if (action === "intake") return `${item.id} intake approved for deeper certification review.`;
  if (action === "certify") return `${item.id} readiness checks passed and object was certified in the local portal.`;
  return `${item.id} blocked pending remediation.`;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function validateRegistrationForm(input: {
  type: RegistryType;
  id: string;
  name: string;
  owner: string;
  description: string;
  sideEffects: RegistryObject["sideEffects"] | "";
  targetSystem: string;
  policies: string[];
  relationships: string[];
}): FormErrors {
  const errors: FormErrors = {};
  const trimmedName = input.name.trim();
  const trimmedOwner = input.owner.trim();
  const trimmedDescription = input.description.trim();

  if (!input.id) {
    errors.id = "Registry ID is required.";
  } else if (!/^[a-z0-9][a-z0-9_.-]*$/.test(input.id)) {
    errors.id = "Registry ID must use lowercase letters, numbers, dots, underscores, or hyphens.";
  } else if (registryObjects.some((item) => item.id === input.id)) {
    errors.id = "Registry ID must be unique.";
  }

  if (!trimmedName) errors.name = "Name is required.";
  if (!trimmedOwner || trimmedOwner === "unknown") errors.owner = "Owner is required and cannot be unknown.";
  if (trimmedDescription.length < 24) errors.description = "Description should explain purpose and governance boundary.";

  if (!input.policies.length) {
    errors.policies = "At least one policy reference is required.";
  }

  if (!input.relationships.length) {
    errors.relationships = "At least one relationship to an agent, skill, tool, policy, or system is required.";
  } else {
    const unknownRelationships = input.relationships.filter((id) => !registryObjects.some((item) => item.id === id));
    if (unknownRelationships.length) {
      errors.relationships = `Unknown relationship ID: ${unknownRelationships.join(", ")}.`;
    }
  }

  if (input.type === "tool") {
    if (!input.sideEffects) errors.sideEffects = "Tool registrations must declare side effects.";
    if (!input.targetSystem) errors.targetSystem = "Tool registrations must declare a target system.";
  }

  if (input.type === "agent") {
    const hasSkillRelationship = input.relationships.some((id) => registryObjects.some((item) => item.id === id && item.type === "skill"));
    if (!hasSkillRelationship) errors.relationships = "Agent registrations must link to at least one approved skill.";
  }

  if (input.type === "skill") {
    const hasToolRelationship = input.relationships.some((id) => registryObjects.some((item) => item.id === id && item.type === "tool"));
    if (!hasToolRelationship) errors.relationships = "Skill registrations must link to at least one governed tool.";
  }

  return errors;
}

function bindEvents(): void {
  document.querySelector<HTMLButtonElement>("#newRegistration")?.addEventListener("click", () => {
    state.notice = "";
    state.formErrors = {};
    state.showRegistration = !state.showRegistration;
    if (state.showRegistration) state.showImport = false;
    render();
  });

  document.querySelector<HTMLButtonElement>("#importSkills")?.addEventListener("click", () => {
    state.notice = "";
    state.showImport = !state.showImport;
    if (state.showImport) state.showRegistration = false;
    render();
  });

  document.querySelector<HTMLButtonElement>("#cancelImportSkills")?.addEventListener("click", () => {
    state.showImport = false;
    render();
  });

  document.querySelector<HTMLInputElement>("#publicSkillRepo")?.addEventListener("input", (event) => {
    state.publicRepoUrl = (event.target as HTMLInputElement).value;
  });

  document.querySelector<HTMLButtonElement>("#loadPublicSkills")?.addEventListener("click", () => {
    void lookupPublicSkills();
  });

  document.querySelector<HTMLButtonElement>("#importSelectedSkills")?.addEventListener("click", () => {
    void importSelectedPublicSkills();
  });

  document.querySelectorAll<HTMLInputElement>("[data-public-skill-id]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const id = checkbox.dataset.publicSkillId;
      if (!id) return;
      if (checkbox.checked) selectedPublicSkillIds.add(id);
      else selectedPublicSkillIds.delete(id);
      render();
    });
  });

  document.querySelector<HTMLButtonElement>("#clearDrafts")?.addEventListener("click", () => {
    const draftIds = new Set(registryObjects.filter((item) => !seedIds.has(item.id)).map((item) => item.id));
    for (let index = registryObjects.length - 1; index >= 0; index -= 1) {
      if (!seedIds.has(registryObjects[index].id)) {
        registryObjects.splice(index, 1);
      }
    }
    for (let index = reviewEvents.length - 1; index >= 0; index -= 1) {
      if (draftIds.has(reviewEvents[index].objectId)) {
        reviewEvents.splice(index, 1);
      }
    }
    saveDrafts();
    saveReviewEvents();
    state.selectedId = filtered()[0]?.id ?? registryObjects[0].id;
    state.notice = "Local draft registrations were cleared.";
    render();
  });

  document.querySelector<HTMLButtonElement>("#cancelRegistration")?.addEventListener("click", () => {
    state.showRegistration = false;
    state.formErrors = {};
    render();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-review-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.reviewId;
      const action = button.dataset.reviewAction as ReviewAction | undefined;
      if (!id || !action) return;
      const note = document.querySelector<HTMLTextAreaElement | HTMLInputElement>(`[data-review-note="${CSS.escape(id)}"]`)?.value ?? "";
      applyReviewDecision(id, action, note);
    });
  });

  document.querySelector<HTMLFormElement>("#registrationForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type")) as RegistryType;
    const id = normalizeId(String(form.get("id") ?? ""));
    const sideEffects = String(form.get("sideEffects") ?? "") as RegistryObject["sideEffects"] | "";
    const targetSystem = String(form.get("targetSystem") ?? "").trim();
    const policies = splitList(String(form.get("policies") ?? ""));
    const pickedRelationships = form.getAll("relationshipRefs").map(String);
    const typedRelationships = splitList(String(form.get("relationships") ?? ""));
    const relationships = Array.from(new Set([...pickedRelationships, ...typedRelationships]));

    const validation = validateRegistrationForm({
      type,
      id,
      name: String(form.get("name") ?? ""),
      owner: String(form.get("owner") ?? ""),
      description: String(form.get("description") ?? ""),
      sideEffects,
      targetSystem,
      policies,
      relationships,
    });

    if (Object.keys(validation).length) {
      state.formErrors = validation;
      state.notice = "Draft registration was not created because validation failed.";
      state.showRegistration = true;
      render();
      return;
    }

    const newObject: RegistryObject = {
      id,
      type,
      name: String(form.get("name") ?? "").trim(),
      version: "0.1.0-draft",
      description: String(form.get("description") ?? "").trim(),
      owner: String(form.get("owner") ?? "").trim(),
      riskTier: String(form.get("riskTier") ?? "T2") as RegistryObject["riskTier"],
      lifecycleState: "draft",
      environment: "test",
      aiHarnessCertified: false,
      certificationEvidence: "Draft registration created in portal. Requires review, schema validation, policy coverage, and evaluation evidence.",
      approvalState: "pending",
      sourcePath: "local-draft/admin-console",
      dataClasses: type === "tool" ? ["internal"] : ["internal", "confidential"],
      policies: policies.length ? policies : ["policy-review-required"],
      relationships,
      ...(type === "tool" && sideEffects ? { sideEffects } : {}),
      ...(type === "tool" && targetSystem ? { targetSystem } : {}),
      ...(type !== "agent" ? { inputs: ["to_be_defined"], outputs: ["to_be_defined"] } : {}),
    };

    registryObjects.unshift(newObject);
    saveDrafts();
    state.type = type;
    state.certification = "all";
    state.risk = "all";
    state.query = "";
    state.selectedId = id;
    state.showRegistration = false;
    state.formErrors = {};
    state.notice = `${newObject.name} was saved as a local draft registration.`;
    render();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-type]").forEach((button) => {
    button.addEventListener("click", () => {
      state.type = button.dataset.type as RegistryType | "all";
      const first = filtered()[0] ?? registryObjects[0];
      state.selectedId = first.id;
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-select]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.select ?? state.selectedId;
      render();
    });
  });

  document.querySelector<HTMLInputElement>("#search")?.addEventListener("input", (event) => {
    state.query = (event.target as HTMLInputElement).value;
    const first = filtered()[0];
    if (first) state.selectedId = first.id;
    render();
  });

  document.querySelector<HTMLSelectElement>("#riskFilter")?.addEventListener("change", (event) => {
    state.risk = (event.target as HTMLSelectElement).value;
    const first = filtered()[0];
    if (first) state.selectedId = first.id;
    render();
  });

  document.querySelector<HTMLSelectElement>("#certFilter")?.addEventListener("change", (event) => {
    state.certification = (event.target as HTMLSelectElement).value as FilterState["certification"];
    const first = filtered()[0];
    if (first) state.selectedId = first.id;
    render();
  });

  document.querySelectorAll<HTMLButtonElement>("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.dataset.scroll;
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-kpi]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.kpi;
      if (!action) return;
      if (action === "agent" || action === "skill" || action === "tool") {
        state.type = action;
        state.query = "";
        state.risk = "all";
        state.certification = "all";
        state.selectedId = byType(action)[0]?.id ?? state.selectedId;
        render();
        document.querySelector(".workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (action === "drafts") {
        const draft = registryObjects.find((item) => !seedIds.has(item.id));
        state.type = "all";
        state.query = draft?.id ?? "";
        state.risk = "all";
        state.certification = "all";
        if (draft) state.selectedId = draft.id;
        render();
        document.querySelector(".workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (action === "gaps") {
        const gap = registryObjects.find((item) => !item.aiHarnessCertified);
        state.type = "all";
        state.query = "";
        state.risk = "all";
        state.certification = "not_certified";
        if (gap) state.selectedId = gap.id;
        render();
        document.querySelector(".workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      document.getElementById(action)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function normalizeId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "");
}

function publicSkillRegistryId(skill: PublicSkill): string {
  const namespace = skill.repo.includes("anthropics/skills") ? "anthropic" : "external";
  return `public.${namespace}.${normalizeId(skill.id)}`;
}

async function lookupPublicSkills(): Promise<void> {
  try {
    publicSkillStatus = "Looking up public skills...";
    selectedPublicSkillIds = new Set();
    render();

    const response = await fetch(`/api/public-skills?repo=${encodeURIComponent(state.publicRepoUrl)}`);
    if (!response.ok) throw new Error(`Public skill lookup returned ${response.status}`);
    const payload = await response.json() as { skills?: PublicSkill[] };
    publicSkills = Array.isArray(payload.skills) ? payload.skills : [];
    publicSkillStatus = `Found ${publicSkills.length} public skill${publicSkills.length === 1 ? "" : "s"} in ${state.publicRepoUrl}. Select skills to import into the local governance store.`;
  } catch (error) {
    publicSkills = [];
    publicSkillStatus = `Public skill lookup failed. ${error instanceof Error ? error.message : ""}`.trim();
  }
  render();
}

async function importSelectedPublicSkills(): Promise<void> {
  try {
    const skillIds = Array.from(selectedPublicSkillIds);
    publicSkillStatus = `Importing ${skillIds.length} selected skill${skillIds.length === 1 ? "" : "s"}...`;
    render();

    const response = await fetch("/api/public-skills/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo: state.publicRepoUrl, skillIds }),
    });
    if (!response.ok) throw new Error(`Public skill import returned ${response.status}`);
    const payload = await response.json() as { count?: number; imported?: RegistryObject[] };
    selectedPublicSkillIds = new Set();
    await loadBackendRegistry();
    publicSkillStatus = `Imported ${payload.count ?? payload.imported?.length ?? 0} skill${(payload.count ?? 0) === 1 ? "" : "s"} into the local governance store.`;
    state.type = "skill";
    state.certification = "all";
    state.risk = "all";
    state.query = "public.";
    state.selectedId = payload.imported?.[0]?.id ?? filtered()[0]?.id ?? state.selectedId;
  } catch (error) {
    publicSkillStatus = `Public skill import failed. ${error instanceof Error ? error.message : ""}`.trim();
  }
  render();
}

function splitList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function localDraftCount(): number {
  return registryObjects.filter((item) => !seedIds.has(item.id)).length;
}

function loadDrafts(): RegistryObject[] {
  if (!storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRegistryObject);
  } catch {
    return [];
  }
}

function saveDrafts(): void {
  if (!storageAvailable()) return;
  const drafts = registryObjects.filter((item) => !seedIds.has(item.id));
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

function loadReviewEvents(): ReviewEvent[] {
  if (!storageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isReviewEvent);
  } catch {
    return [];
  }
}

function saveReviewEvents(): void {
  if (!storageAvailable()) return;
  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviewEvents));
}

function persistBackendReview(event: ReviewEvent): void {
  fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {
    // Local storage is the offline write-through fallback for review evidence.
  });
}

function storageAvailable(): boolean {
  return typeof window !== "undefined" && "localStorage" in window;
}

function isRegistryObject(value: unknown): value is RegistryObject {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Partial<RegistryObject>;
  return Boolean(maybe.id && maybe.type && maybe.name && maybe.owner && maybe.riskTier && maybe.lifecycleState);
}

function isReviewEvent(value: unknown): value is ReviewEvent {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Partial<ReviewEvent>;
  return Boolean(maybe.id && maybe.objectId && maybe.action && maybe.timestamp && maybe.auditEventId);
}

async function initialize(): Promise<void> {
  await Promise.all([loadBackendRegistry(), loadBackendReviews()]);
  render();
}

async function loadBackendRegistry(): Promise<void> {
  try {
    const response = await fetch("/api/registry");
    if (!response.ok) throw new Error(`Registry API returned ${response.status}`);
    const payload = await response.json() as RegistryApiResponse;
    if (!Array.isArray(payload.objects)) throw new Error("Registry API returned an invalid payload");

    seedIds = new Set(payload.objects.map((item) => item.id));
    registryObjects = [...loadDrafts(), ...payload.objects];
    backendStatus = `Backend API · ${payload.objects.length} manifest objects`;
    state.selectedId = registryObjects.find((item) => item.id === state.selectedId)?.id ?? registryObjects[0]?.id ?? "";
  } catch (error) {
    backendStatus = "Frontend fallback · backend unavailable";
    state.notice = `Backend API unavailable, using bundled fallback data. ${error instanceof Error ? error.message : ""}`.trim();
  }
}

async function loadBackendReviews(): Promise<void> {
  try {
    const response = await fetch("/api/reviews");
    if (!response.ok) return;
    const payload = await response.json() as { events?: ReviewEvent[] };
    if (Array.isArray(payload.events)) {
      reviewEvents = [...loadReviewEvents(), ...payload.events].filter(isReviewEvent);
    }
  } catch {
    // Local storage remains the offline review-event fallback.
  }
}

initialize();
