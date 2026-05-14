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

const DRAFT_STORAGE_KEY = "agentharness.adminConsole.localDrafts.v1";
const REVIEW_STORAGE_KEY = "agentharness.adminConsole.reviewEvents.v1";
const seedIds = new Set(seedRegistryObjects.map((item) => item.id));

const registryObjects: RegistryObject[] = [...loadDrafts(), ...seedRegistryObjects];
const reviewEvents: ReviewEvent[] = loadReviewEvents();

const state: FilterState & { selectedId: string; showRegistration: boolean; notice: string; formErrors: FormErrors } = {
  type: "agent",
  risk: "all",
  certification: "all",
  query: "",
  selectedId: registryObjects[0]?.id ?? "customer-service-agent",
  showRegistration: false,
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

function metrics(): Array<[string, number, string]> {
  return [
    ["Agents", byType("agent").length, "registered capability owners"],
    ["Skills", byType("skill").length, "business capabilities"],
    ["Tools", byType("tool").length, "governed system access"],
    ["Approval queue", approvalQueueItems().length, "awaiting decision"],
    ["Review events", reviewEvents.length, "local audit evidence"],
    ["Local drafts", localDraftCount(), "stored in this browser"],
    ["Certification gaps", registryObjects.filter((item) => !item.aiHarnessCertified).length, "blocked until reviewed"],
  ];
}

function render(): void {
  const current = selected();
  const list = filtered();

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">AH</div>
          <div>
            <div class="brand-title">AgentHarness</div>
            <div class="brand-subtitle">Governance Portal</div>
          </div>
        </div>
        <div class="side-label">Registry scope</div>
        <div class="tabs">
          ${renderTab("agent", "Agent Registry", byType("agent").length)}
          ${renderTab("skill", "Skill Registry", byType("skill").length)}
          ${renderTab("tool", "Tool Registry", byType("tool").length)}
          ${renderTab("all", "All Objects", registryObjects.length)}
        </div>
        <div class="sidebar-note">
          v0.2 portal slice: local registration, certification readiness, and relationship-aware registry review.
        </div>
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
          <button id="newRegistration" class="primary-action" type="button">Register new</button>
        </header>

        <section class="content">
          <div class="hero">
            <div class="hero-card">
              <div class="eyebrow">Governance portal application</div>
              <h1>Register and inspect <span class="gradient-text">agents, skills, and tools</span>.</h1>
              <p>
                This v0.2 portal slice gives governance, architecture, and platform teams a working local surface:
                ownership, risk tier, lifecycle state, certification evidence, approved relationships, and blocked gaps.
              </p>
            </div>
            <div class="hero-card">
              <div class="eyebrow">Current build slice</div>
              <div class="release-list">
                <div class="release-row"><span>Mode</span><b>Local draft registration</b></div>
                <div class="release-row"><span>Source</span><b>Fictional telco manifests</b></div>
                <div class="release-row"><span>Persistence</span><b>Browser local storage</b></div>
                <div class="release-row"><span>Review</span><b>Approval evidence trail</b></div>
              </div>
            </div>
          </div>

          ${state.notice ? `<div class="notice">${escapeHtml(state.notice)}</div>` : ""}
          ${state.showRegistration ? renderRegistrationForm() : ""}

          <div class="kpi-grid">
            ${metrics().map(([label, value, note]) => `
              <div class="kpi">
                <div class="kpi-value">${value}</div>
                <div class="kpi-label">${label}</div>
                <div class="kpi-note">${note}</div>
              </div>
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
            ${renderDetail(current)}
          </div>
        </section>
      </main>
    </div>
  `;

  bindEvents();
}

function renderTab(type: RegistryType | "all", label: string, count: number): string {
  return `
    <button class="tab ${state.type === type ? "active" : ""}" data-type="${type}">
      <span>${label}</span>
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
    <section class="graph-panel">
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
    <section class="approval-panel">
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
    <section class="evidence-panel">
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
    <aside class="detail-panel">
      <div class="eyebrow">${item.type} detail</div>
      <h2>${escapeHtml(item.name)}</h2>
      <p class="detail-description">${escapeHtml(item.description)}</p>
      <div class="detail-meta">
        ${chip(item.id, "cyan")}
        ${chip(item.riskTier)}
        ${chip(item.lifecycleState)}
        ${chip(item.aiHarnessCertified ? "AI Harness Certified" : "Not Certified", item.aiHarnessCertified ? "green" : "red")}
      </div>
      ${kv("Version", item.version)}
      ${kv("Owner", item.owner)}
      ${kv("Environment", item.environment)}
      ${kv("Approval", item.approvalState)}
      ${kv("Certification", item.certificationEvidence)}
      ${kv("Readiness", renderChecklist(item))}
      ${kv("Decision note", renderDecisionNote(item))}
      ${kv("Review actions", renderReviewActions(item))}
      ${kv("Review history", renderObjectHistory(item))}
      ${kv("Source", item.sourcePath)}
      ${kv("Data classes", item.dataClasses.map((value) => chip(value)).join(" "))}
      ${kv("Policies", item.policies.map((value) => chip(value)).join(" "))}
      ${item.inputs ? kv("Inputs", item.inputs.map((value) => chip(value)).join(" ")) : ""}
      ${item.outputs ? kv("Outputs", item.outputs.map((value) => chip(value)).join(" ")) : ""}
      ${item.sideEffects ? kv("Side effects", chip(item.sideEffects)) : ""}
      ${item.targetSystem ? kv("Target system", item.targetSystem) : ""}
      ${kv("Relationships", `<div class="relationship-list">${item.relationships.map((value) => chip(value)).join("") || chip("none", "red")}</div>`)}
    </aside>
  `;
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

  reviewEvents.unshift(createReviewEvent(item, action, decisionReason));
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
    render();
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
}

function normalizeId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "");
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

render();
