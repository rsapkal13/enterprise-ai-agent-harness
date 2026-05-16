#!/usr/bin/env node
import { createServer } from "node:http";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const exampleRoot = path.join(repoRoot, "examples/telco-customer-care");
const storeDir = path.join(repoRoot, "apps/admin-api/.data");
const storePath = path.join(storeDir, "admin-store.json");
const port = Number(process.env.PORT ?? process.env.ADMIN_API_PORT ?? 4180);
const host = process.env.HOST ?? "127.0.0.1";
const reviewEvents = [];
const defaultPublicSkillsRepo = "https://github.com/anthropics/skills.git";

const demoObjects = [
  {
    id: "refund-iphone-device",
    type: "skill",
    name: "Refund iPhone Device",
    version: "0.0.1",
    description: "Uncertified example skill used to demonstrate a blocked refund path.",
    owner: "unknown",
    riskTier: "T3",
    lifecycleState: "blocked",
    environment: "test",
    aiHarnessCertified: false,
    certificationEvidence: "Missing registry approval, evaluation pack, and policy review.",
    approvalState: "not_certified",
    sourcePath: "demo-only/generated-scenario-d",
    dataClasses: ["confidential", "financial"],
    policies: ["certification-required-policy"],
    relationships: ["iphone-refund-issue-payment"],
    inputs: ["customer_reference", "device_identifier", "refund_reason"],
    outputs: ["refund_reference"],
  },
  {
    id: "iphone-refund-issue-payment",
    type: "tool",
    name: "Issue iPhone Refund",
    version: "0.0.1",
    description: "Uncertified irreversible refund tool used to demonstrate governance blocking.",
    owner: "unknown",
    riskTier: "T3",
    lifecycleState: "blocked",
    environment: "test",
    aiHarnessCertified: false,
    certificationEvidence: "Missing owner, policy approval, evaluation pack, and audit obligation.",
    approvalState: "blocked",
    sourcePath: "demo-only/generated-scenario-d",
    dataClasses: ["confidential", "financial"],
    policies: ["certification-required-policy"],
    relationships: ["refund-iphone-device"],
    sideEffects: "irreversible_write",
    targetSystem: "unknown-refund-system",
    inputs: ["customer_reference", "device_identifier", "refund_amount"],
    outputs: ["refund_reference", "financial_adjustment_id"],
  },
];

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { ok: true, service: "admin-api" });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/registry") {
      const objects = await loadRegistryObjects();
      sendJson(response, 200, { objects, generatedAt: new Date().toISOString() });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/public-skills") {
      const repo = url.searchParams.get("repo") ?? defaultPublicSkillsRepo;
      const skills = await discoverPublicSkills(repo);
      sendJson(response, 200, { repo, skills, generatedAt: new Date().toISOString() });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/public-skills/import") {
      const body = await readJsonBody(request);
      const repo = body.repo ?? defaultPublicSkillsRepo;
      const skillIds = Array.isArray(body.skillIds) ? body.skillIds.map(String) : [];
      const imported = await importPublicSkills(repo, skillIds);
      sendJson(response, 201, { imported, count: imported.length });
      return;
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/registry/")) {
      const id = decodeURIComponent(url.pathname.replace("/api/registry/", ""));
      const object = (await loadRegistryObjects()).find((item) => item.id === id);
      sendJson(response, object ? 200 : 404, object ? { object } : { error: "Registry object not found" });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/source") {
      const sourcePath = url.searchParams.get("path") ?? "";
      const source = await readSafeSource(sourcePath);
      sendJson(response, source ? 200 : 404, source ?? { error: "Source not found" });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/reviews") {
      sendJson(response, 200, { events: reviewEvents });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/reviews") {
      const event = await readJsonBody(request);
      reviewEvents.unshift(event);
      sendJson(response, 201, { event });
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, host, () => {
  console.log(`Admin API listening at http://${host}:${port}`);
});

async function loadRegistryObjects() {
  const [agents, skills, tools] = await Promise.all([
    loadManifestFolder("agents", mapAgent),
    loadManifestFolder("skills", mapSkill),
    loadManifestFolder("tools", mapTool),
  ]);
  const store = await readStore();
  return Promise.all([...agents, ...skills, ...store.importedSkills, ...demoObjects, ...tools].map(async (item) => {
    const sourceAvailable = item.sourcePath.startsWith("examples/");
    if (item.sourceContent) {
      return { ...item, sourceAvailable: item.sourceAvailable ?? sourceAvailable };
    }
    if (sourceAvailable) {
      const source = await readSafeSource(item.sourcePath);
      return { ...item, sourceAvailable, sourceContent: source?.content ?? sourceSnapshot(item) };
    }
    return { ...item, sourceAvailable, sourceContent: sourceSnapshot(item) };
  }));
}

async function discoverPublicSkills(repoUrl) {
  const repo = parseGitHubRepo(repoUrl);
  const repoMeta = await fetchJson(`https://api.github.com/repos/${repo.owner}/${repo.name}`);
  const branch = repoMeta.default_branch ?? "main";
  const entries = await fetchJson(`https://api.github.com/repos/${repo.owner}/${repo.name}/contents/skills?ref=${encodeURIComponent(branch)}`);
  if (!Array.isArray(entries)) return [];

  const folders = entries.filter((entry) => entry.type === "dir").sort((a, b) => a.name.localeCompare(b.name));
  const skills = await Promise.all(folders.map(async (entry) => {
    const skillPath = `skills/${entry.name}/SKILL.md`;
    const rawUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${branch}/${skillPath}`;
    const sourceContent = await fetchText(rawUrl);
    const frontmatter = parseSkillFrontmatter(sourceContent);
    const name = frontmatter.name ?? entry.name;
    return {
      id: entry.name,
      name,
      description: frontmatter.description ?? firstParagraph(sourceContent) ?? "No description declared.",
      license: frontmatter.license ?? "Not declared",
      repo: repoUrl,
      sourcePath: `github://${repo.owner}/${repo.name}/${skillPath}`,
      rawUrl,
      sourceContent,
    };
  }));

  return skills;
}

async function importPublicSkills(repoUrl, skillIds) {
  if (!skillIds.length) return [];
  const available = await discoverPublicSkills(repoUrl);
  const selected = available.filter((skill) => skillIds.includes(skill.id));
  const store = await readStore();
  const importedAt = new Date().toISOString();
  const imported = selected.map((skill) => mapPublicSkill(skill, importedAt));
  const byId = new Map(store.importedSkills.map((skill) => [skill.id, skill]));
  for (const skill of imported) byId.set(skill.id, skill);
  store.importedSkills = Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id));
  await writeStore(store);
  return imported;
}

function mapPublicSkill(skill, importedAt) {
  const namespace = skill.repo.includes("anthropics/skills") ? "anthropic" : "external";
  const id = `public.${namespace}.${normalizeId(skill.id)}`;
  return {
    id,
    type: "skill",
    name: skill.name,
    version: "imported",
    description: skill.description,
    owner: "public-repo-import",
    riskTier: "T1",
    lifecycleState: "draft",
    environment: "test",
    aiHarnessCertified: false,
    certificationEvidence: `Imported from ${skill.repo} at ${importedAt}. Awaiting local owner, policy, linkage, and evaluation review.`,
    approvalState: "pending",
    sourcePath: skill.sourcePath,
    sourceAvailable: true,
    sourceContent: skill.sourceContent,
    dataClasses: ["external"],
    policies: ["import.review_required", "license.review_required"],
    relationships: [],
    inputs: ["to_be_mapped"],
    outputs: ["to_be_mapped"],
  };
}

async function readStore() {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      importedSkills: Array.isArray(parsed.importedSkills) ? parsed.importedSkills : [],
    };
  } catch {
    return { importedSkills: [] };
  }
}

async function writeStore(store) {
  await mkdir(storeDir, { recursive: true });
  await writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function parseGitHubRepo(repoUrl) {
  const url = new URL(repoUrl.replace(/\.git$/, ""));
  if (url.hostname !== "github.com") throw new Error("Only github.com public skill repositories are supported.");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) throw new Error("GitHub repository URL must include owner and repo.");
  return { owner: parts[0], name: parts[1] };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "agentharness-admin-api" } });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status}) for ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": "agentharness-admin-api" } });
  if (!response.ok) throw new Error(`GitHub raw request failed (${response.status}) for ${url}`);
  return response.text();
}

function parseSkillFrontmatter(sourceContent) {
  if (!sourceContent.startsWith("---")) return {};
  const end = sourceContent.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = sourceContent.slice(3, end).trim();
  try {
    return YAML.parse(block) ?? {};
  } catch {
    return {};
  }
}

function firstParagraph(sourceContent) {
  return sourceContent
    .replace(/^---[\s\S]*?\n---/, "")
    .split(/\n\s*\n/)
    .map((part) => part.replace(/^#+\s*/, "").trim())
    .find(Boolean);
}

async function loadManifestFolder(folder, mapper) {
  const dir = path.join(exampleRoot, folder);
  const names = await readdir(dir);
  const yamlFiles = names.filter((name) => /\.(yaml|yml)$/.test(name)).sort();
  const items = [];
  for (const name of yamlFiles) {
    const fullPath = path.join(dir, name);
    const sourceContent = await readFile(fullPath, "utf8");
    const raw = YAML.parse(sourceContent);
    items.push(mapper(raw, `examples/telco-customer-care/${folder}/${name}`));
  }
  return items;
}

function mapAgent(raw, sourcePath) {
  return {
    id: raw.id,
    type: "agent",
    name: raw.name,
    version: raw.version,
    description: raw.description ?? raw.purpose ?? "",
    owner: raw.owner ?? "unknown",
    riskTier: raw.risk_tier ?? "T0",
    lifecycleState: raw.lifecycle_state ?? "draft",
    environment: raw.environment ?? "test",
    aiHarnessCertified: true,
    certificationEvidence: (raw.evaluation_refs ?? []).join(" + ") || raw.evaluation_pack_ref || "No evaluation evidence declared.",
    approvalState: "approved",
    sourcePath,
    dataClasses: raw.data_classes ?? [],
    policies: ["customer_data.access", "consent.required", "high_risk.action"],
    relationships: [...(raw.approved_skills ?? []), ...(raw.approved_tools ?? [])],
  };
}

function mapSkill(raw, sourcePath) {
  return {
    id: raw.id,
    type: "skill",
    name: raw.name,
    version: raw.version,
    description: raw.description ?? "",
    owner: raw.owner ?? "unknown",
    riskTier: raw.risk_tier ?? "T0",
    lifecycleState: raw.lifecycle_state ?? "draft",
    environment: raw.environment ?? "test",
    aiHarnessCertified: true,
    certificationEvidence: certificationEvidence(raw),
    approvalState: "approved",
    sourcePath,
    dataClasses: raw.data_classes ?? ["confidential"],
    policies: raw.policies ?? [],
    relationships: raw.tool_bindings ?? [],
    inputs: raw.input_contract?.required_fields ?? [],
    outputs: raw.output_contract?.fields ?? [],
  };
}

function mapTool(raw, sourcePath) {
  return {
    id: raw.id,
    type: "tool",
    name: raw.name,
    version: raw.version,
    description: raw.description ?? "",
    owner: raw.owner ?? "unknown",
    riskTier: raw.risk_tier ?? "T0",
    lifecycleState: raw.lifecycle_state ?? "draft",
    environment: raw.environment ?? "test",
    aiHarnessCertified: true,
    certificationEvidence: certificationEvidence(raw),
    approvalState: "approved",
    sourcePath,
    dataClasses: raw.data_classification ?? raw.data_classes ?? [],
    policies: raw.policy_refs ?? [],
    relationships: [raw.target_system, ...(referencingSkills(raw.id))].filter(Boolean),
    sideEffects: raw.side_effects,
    targetSystem: raw.target_system,
    inputs: raw.input_schema ? [raw.input_schema] : [],
    outputs: raw.output_schema ? [raw.output_schema] : [],
  };
}

function certificationEvidence(raw) {
  const refs = raw.evaluation_refs ?? raw.evaluation_requirements ?? [];
  return refs.length ? refs.join(" + ") : "Schema validated and loaded from backend manifests.";
}

function referencingSkills(toolId) {
  const map = {
    "customer.read_limited_profile": ["customer.change_plan", "customer.check_balance", "customer.replace_sim"],
    "eligibility.check_plan_change": ["customer.change_plan"],
    "billing.calculate_price_delta": ["customer.change_plan"],
    "order.prepare_plan_change_request": ["customer.change_plan"],
  };
  return map[toolId] ?? [];
}

async function readSafeSource(sourcePath) {
  if (!sourcePath || !sourcePath.startsWith("examples/")) return null;
  const resolved = path.resolve(repoRoot, sourcePath);
  if (!resolved.startsWith(path.join(repoRoot, "examples"))) return null;
  try {
    return { path: sourcePath, content: await readFile(resolved, "utf8") };
  } catch {
    return null;
  }
}

function sourceSnapshot(item) {
  return [
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
  ].filter(Boolean).join("\n");
}

function normalizeId(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "");
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}
