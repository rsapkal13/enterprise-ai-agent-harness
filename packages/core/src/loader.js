/**
 * loader.js
 *
 * YAML manifest loader for the Enterprise AI Agent Harness local runtime.
 * Reads YAML from a structured example directory and converts to typed objects.
 *
 * snake_case → camelCase field mapping:
 *   lifecycle_state  → status
 *   risk_tier T1–T4  → riskLevel low/medium/high/restricted
 *   approved_skills  → allowedSkills   (agent)
 *   allowed_channels → channels        (agent)
 *   tool_bindings    → tools           (skill)
 *   adapter_type     → adapter         (tool)
 *   target_system    → systemId        (tool)
 *   trust_level      → trustLevel      (system)
 *   source_systems   → sourceSystems   (context-scope)
 *
 * Part of: v0.2 local runtime — Issue #54
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

// ── Field converters ──────────────────────────────────────────────────────────

function toLifecycleStatus(raw) {
  const valid = new Set(["draft", "active", "deprecated", "retired"]);
  return valid.has(raw) ? raw : "draft";
}

function toRiskLevel(raw) {
  switch (raw) {
    case "T1": return "low";
    case "T2": return "medium";
    case "T3": return "high";
    case "T4": return "restricted";
    default:   return "low";
  }
}

function toAdapter(raw) {
  const valid = new Set(["rest", "mcp", "mock", "workflow", "data"]);
  return valid.has(raw) ? raw : "mock";
}

function toPolicyDecisionType(raw) {
  const valid = new Set(["allow", "deny", "require_approval", "require_consent"]);
  return valid.has(raw) ? raw : "deny";
}

// ── Object mappers ────────────────────────────────────────────────────────────

function mapAgent(raw) {
  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    allowedSkills: raw.approved_skills ?? [],
    channels: raw.allowed_channels ?? [],
  };
}

function mapSkill(raw) {
  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    description: raw.description ?? "",
    owner: raw.owner ?? "",
    status: toLifecycleStatus(raw.lifecycle_state),
    riskLevel: toRiskLevel(raw.risk_tier),
    tools: raw.tool_bindings ?? [],
    policies: raw.policies ?? [],
    contextScopes: raw.required_context ?? [],
  };
}

function mapTool(raw) {
  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    adapter: toAdapter(raw.adapter_type),
    riskLevel: toRiskLevel(raw.risk_tier),
    systemId: raw.target_system ?? "",
  };
}

function mapPolicy(raw) {
  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    decisionType: toPolicyDecisionType(raw.default_decision),
  };
}

function mapWorkflow(raw) {
  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    steps: (raw.steps ?? []).map((s) => s.id),
    // Keep raw step objects for the workflow engine
    _rawSteps: raw.steps ?? [],
  };
}

function mapSystem(raw) {
  const trustLevels = new Set(["trusted_internal", "controlled_external", "mock", "unknown"]);
  const trustLevel = trustLevels.has(raw.trust_level) ? raw.trust_level : "unknown";

  const cls = raw.data_classifications ?? [];
  const dataClassification =
    ["restricted", "confidential", "internal", "public"].find((c) => cls.includes(c)) ?? "internal";

  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    owner: raw.owner ?? "",
    systemType: "backend",
    trustLevel,
    dataClassification,
  };
}

function mapContextScope(raw) {
  const valid = new Set(["public", "internal", "confidential", "restricted"]);
  const rawCls = raw.data_classification ?? (raw.data_classifications ?? [])[0] ?? "internal";
  const dataClassification = valid.has(rawCls) ? rawCls : "internal";

  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    owner: raw.owner ?? "",
    dataClassification,
    sourceSystems: raw.source_systems ?? [],
  };
}

function mapAuditEvent(raw) {
  const actorTypes = new Set(["agent", "user", "system", "policy_engine", "workflow_engine"]);
  const outcomes = new Set(["started", "allowed", "denied", "requires_action", "completed", "failed"]);

  return {
    id: raw.event_id,
    version: raw.version,
    timestamp: raw.timestamp ?? new Date().toISOString(),
    eventType: raw.event_type ?? "",
    actor: {
      type: actorTypes.has(raw.actor?.type) ? raw.actor.type : "system",
      id: raw.actor?.id ?? "",
    },
    outcome: outcomes.has(raw.outcome) ? raw.outcome : "started",
  };
}

function mapEvaluation(raw) {
  const targetTypes = new Set(["agent", "skill", "tool", "workflow", "policy", "journey"]);
  const metricTypes = new Set([
    "completion", "compliance", "quality", "latency", "reliability", "business_outcome",
  ]);

  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    targetType: targetTypes.has(raw.target_type) ? raw.target_type : "journey",
    metricType: metricTypes.has(raw.metric_type) ? raw.metric_type : "completion",
  };
}

// ── File system helpers ───────────────────────────────────────────────────────

async function listYamlFiles(dir) {
  let files = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await listYamlFiles(full));
    } else if (entry.isFile() && /\.(yaml|yml)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function loadAll(exampleDir, subdirectory, mapper, idField = "id") {
  const dir = path.join(exampleDir, subdirectory);
  const files = await listYamlFiles(dir);
  const results = [];
  for (const file of files) {
    try {
      const raw = YAML.parse(await readFile(file, "utf8"));
      if (raw && raw[idField]) {
        results.push(mapper(raw));
      }
    } catch {
      // parse errors handled by validate-examples.js
    }
  }
  return results;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function loadExampleManifests(exampleDir) {
  const [
    agents, skills, tools, policies, workflows,
    systems, contextScopes, auditEvents, evaluations,
  ] = await Promise.all([
    loadAll(exampleDir, "agents",         mapAgent),
    loadAll(exampleDir, "skills",         mapSkill),
    loadAll(exampleDir, "tools",          mapTool),
    loadAll(exampleDir, "policies",       mapPolicy),
    loadAll(exampleDir, "workflows",      mapWorkflow),
    loadAll(exampleDir, "systems",        mapSystem),
    loadAll(exampleDir, "context-scopes", mapContextScope),
    loadAll(exampleDir, "audit-events",   mapAuditEvent, "event_id"),
    loadAll(exampleDir, "evaluations",    mapEvaluation),
  ]);

  return { agents, skills, tools, policies, workflows, systems, contextScopes, auditEvents, evaluations };
}
