/**
 * loader.ts
 *
 * YAML manifest loader for the Enterprise AI Agent Harness local runtime.
 *
 * Reads YAML files from a structured example directory and converts them to
 * typed TypeScript objects. Handles the snake_case → camelCase field mapping
 * between YAML manifests and the core TypeScript types.
 *
 * Mapping notes:
 *   lifecycle_state  → status
 *   risk_tier (T1–T4) → riskLevel (low/medium/high/restricted)
 *   approved_skills  → allowedSkills    (AgentDefinition)
 *   allowed_channels → channels         (AgentDefinition)
 *   tool_bindings    → tools            (SkillDefinition)
 *   adapter_type     → adapter          (ToolDefinition)
 *   target_system    → systemId         (ToolDefinition)
 *   trust_level      → trustLevel       (SystemDefinition)
 *   source_systems   → sourceSystems    (ContextScopeDefinition)
 *
 * Part of: v0.2 local runtime — Issue #54
 */

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import type {
  AgentDefinition,
  AuditEvent,
  ContextScopeDefinition,
  EvaluationDefinition,
  LifecycleStatus,
  PolicyDefinition,
  RiskLevel,
  SkillDefinition,
  SystemDefinition,
  ToolDefinition,
  WorkflowDefinition,
} from "./types.js";

// ── Raw YAML shapes (snake_case) ──────────────────────────────────────────────
// These mirror the YAML manifest fields. Only the fields we actually read are
// listed — extra YAML fields are silently ignored.

interface RawAgent {
  id: string;
  version: string;
  name: string;
  lifecycle_state: string;
  approved_skills?: string[];
  approved_tools?: string[];
  allowed_channels?: string[];
  context_scopes?: string[];
  risk_tier?: string;
}

interface RawSkill {
  id: string;
  version: string;
  name: string;
  lifecycle_state: string;
  owner: string;
  risk_tier?: string;
  tool_bindings?: string[];
  policies?: string[];
  required_context?: string[];
}

interface RawTool {
  id: string;
  version: string;
  name: string;
  lifecycle_state: string;
  adapter_type: string;
  risk_tier?: string;
  target_system: string;
}

interface RawPolicy {
  id: string;
  version: string;
  name: string;
  lifecycle_state: string;
  default_decision?: string;
  rules?: unknown[];
  applicable_risk_tiers?: string[];
  scope?: Record<string, unknown>;
}

interface RawWorkflow {
  id: string;
  version: string;
  name: string;
  lifecycle_state: string;
  owner?: string;
  risk_tier?: string;
  environment?: string;
  steps?: Array<{ id: string; [key: string]: unknown }>;
}

interface RawSystem {
  id: string;
  version: string;
  name: string;
  lifecycle_state: string;
  owner: string;
  trust_level: string;
  data_classifications?: string[];
}

interface RawContextScope {
  id: string;
  version: string;
  name: string;
  lifecycle_state: string;
  owner: string;
  data_classification?: string;
  data_classifications?: string[];
  source_systems?: string[];
}

interface RawAuditEvent {
  event_id: string;
  version: string;
  event_type: string;
  timestamp?: string;
  actor?: {
    type: string;
    id: string;
  };
  outcome?: string;
}

interface RawEvaluation {
  id: string;
  version: string;
  name: string;
  lifecycle_state: string;
  target_type?: string;
  metric_type?: string;
}

// ── Field converters ──────────────────────────────────────────────────────────

function toLifecycleStatus(raw: string | undefined): LifecycleStatus {
  const valid = new Set<string>(["draft", "active", "deprecated", "retired"]);
  return valid.has(raw ?? "") ? (raw as LifecycleStatus) : "draft";
}

/**
 * Maps the tier string used in YAML (T1–T4) to the RiskLevel union.
 * Tiers without a numeric suffix (e.g. from free-text fields) are mapped
 * to "low" as a safe default.
 */
function toRiskLevel(raw: string | undefined): RiskLevel {
  switch (raw) {
    case "T1": return "low";
    case "T2": return "medium";
    case "T3": return "high";
    case "T4": return "restricted";
    default:   return "low";
  }
}

function toAdapter(
  raw: string | undefined,
): AgentDefinition extends never ? never : ToolDefinition["adapter"] {
  const valid = new Set<string>(["rest", "mcp", "mock", "workflow", "data"]);
  return (valid.has(raw ?? "") ? raw : "mock") as ToolDefinition["adapter"];
}

function toPolicyDecisionType(
  raw: string | undefined,
): PolicyDefinition["decisionType"] {
  const valid = new Set<string>([
    "allow", "deny", "require_approval", "require_consent",
  ]);
  return (valid.has(raw ?? "") ? raw : "deny") as PolicyDefinition["decisionType"];
}

// ── Object mappers ────────────────────────────────────────────────────────────

function mapAgent(raw: RawAgent): AgentDefinition {
  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    allowedSkills: raw.approved_skills ?? [],
    channels: raw.allowed_channels ?? [],
  };
}

function mapSkill(raw: RawSkill): SkillDefinition {
  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    description: "",
    owner: raw.owner ?? "",
    status: toLifecycleStatus(raw.lifecycle_state),
    riskLevel: toRiskLevel(raw.risk_tier),
    tools: raw.tool_bindings ?? [],
    policies: raw.policies ?? [],
    contextScopes: raw.required_context ?? [],
  };
}

function mapTool(raw: RawTool): ToolDefinition {
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

function mapPolicy(raw: RawPolicy): PolicyDefinition {
  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    decisionType: toPolicyDecisionType(raw.default_decision),
    _rules: raw.rules ?? [],
    _applicableRiskTiers: raw.applicable_risk_tiers ?? [],
    _scope: raw.scope ?? {},
  };
}

function mapWorkflow(raw: RawWorkflow): WorkflowDefinition {
  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    steps: (raw.steps ?? []).map((s) => s.id),
    _rawSteps: raw.steps ?? [],
    _owner: raw.owner,
    _riskTier: raw.risk_tier,
    _environment: raw.environment,
  };
}

function mapSystem(raw: RawSystem): SystemDefinition {
  const trustLevels = new Set<string>([
    "trusted_internal", "controlled_external", "mock", "unknown",
  ]);
  const trustLevel = trustLevels.has(raw.trust_level)
    ? (raw.trust_level as SystemDefinition["trustLevel"])
    : "unknown";

  const classifications = ["public", "internal", "confidential", "restricted"];
  const cls = raw.data_classifications ?? [];
  // Pick the most restrictive classification present, defaulting to internal.
  const dataClassification = (
    ["restricted", "confidential", "internal", "public"].find((c) =>
      cls.includes(c),
    ) ?? "internal"
  ) as SystemDefinition["dataClassification"];

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

function mapContextScope(raw: RawContextScope): ContextScopeDefinition {
  const classifications = ["public", "internal", "confidential", "restricted"];
  const rawCls =
    raw.data_classification ??
    (raw.data_classifications ?? [])[0] ??
    "internal";
  const dataClassification = (
    classifications.includes(rawCls) ? rawCls : "internal"
  ) as ContextScopeDefinition["dataClassification"];

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

function mapAuditEvent(raw: RawAuditEvent): AuditEvent {
  const actorTypes = new Set<string>([
    "agent", "user", "system", "policy_engine", "workflow_engine",
  ]);
  const outcomes = new Set<string>([
    "started", "allowed", "denied", "requires_action", "completed", "failed",
  ]);

  return {
    id: raw.event_id,
    version: raw.version,
    timestamp: raw.timestamp ?? new Date().toISOString(),
    eventType: raw.event_type ?? "",
    actor: {
      type: actorTypes.has(raw.actor?.type ?? "")
        ? (raw.actor!.type as AuditEvent["actor"]["type"])
        : "system",
      id: raw.actor?.id ?? "",
    },
    outcome: outcomes.has(raw.outcome ?? "")
      ? (raw.outcome as AuditEvent["outcome"])
      : "started",
  };
}

function mapEvaluation(raw: RawEvaluation): EvaluationDefinition {
  const targetTypes = new Set<string>([
    "agent", "skill", "tool", "workflow", "policy", "journey",
  ]);
  const metricTypes = new Set<string>([
    "completion", "compliance", "quality", "latency", "reliability",
    "business_outcome",
  ]);

  return {
    id: raw.id,
    version: raw.version,
    name: raw.name,
    status: toLifecycleStatus(raw.lifecycle_state),
    targetType: targetTypes.has(raw.target_type ?? "")
      ? (raw.target_type as EvaluationDefinition["targetType"])
      : "journey",
    metricType: metricTypes.has(raw.metric_type ?? "")
      ? (raw.metric_type as EvaluationDefinition["metricType"])
      : "completion",
  };
}

// ── File system helpers ───────────────────────────────────────────────────────

async function listYamlFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
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

async function loadAll<R, T>(
  exampleDir: string,
  subdirectory: string,
  mapper: (raw: R) => T,
  idField: keyof R = "id" as keyof R,
): Promise<T[]> {
  const dir = path.join(exampleDir, subdirectory);
  const files = await listYamlFiles(dir);
  const results: T[] = [];
  for (const file of files) {
    try {
      const raw = YAML.parse(await readFile(file, "utf8")) as R;
      if (raw && raw[idField]) {
        results.push(mapper(raw));
      }
    } catch {
      // parse errors are handled by validate-examples.js; skip silently here
    }
  }
  return results;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface ExampleManifests {
  agents: AgentDefinition[];
  skills: SkillDefinition[];
  tools: ToolDefinition[];
  policies: PolicyDefinition[];
  workflows: WorkflowDefinition[];
  systems: SystemDefinition[];
  contextScopes: ContextScopeDefinition[];
  auditEvents: AuditEvent[];
  evaluations: EvaluationDefinition[];
}

/**
 * Load all manifests from a single example directory.
 *
 * @param exampleDir Absolute path to the example folder
 *   (e.g. `examples/telco-customer-care`)
 */
export async function loadExampleManifests(
  exampleDir: string,
): Promise<ExampleManifests> {
  const [
    agents, skills, tools, policies, workflows,
    systems, contextScopes, auditEvents, evaluations,
  ] = await Promise.all([
    loadAll<RawAgent, AgentDefinition>(exampleDir, "agents", mapAgent),
    loadAll<RawSkill, SkillDefinition>(exampleDir, "skills", mapSkill),
    loadAll<RawTool, ToolDefinition>(exampleDir, "tools", mapTool),
    loadAll<RawPolicy, PolicyDefinition>(exampleDir, "policies", mapPolicy),
    loadAll<RawWorkflow, WorkflowDefinition>(exampleDir, "workflows", mapWorkflow),
    loadAll<RawSystem, SystemDefinition>(exampleDir, "systems", mapSystem),
    loadAll<RawContextScope, ContextScopeDefinition>(
      exampleDir, "context-scopes", mapContextScope,
    ),
    loadAll<RawAuditEvent, AuditEvent>(
      exampleDir, "audit-events", mapAuditEvent, "event_id" as keyof RawAuditEvent,
    ),
    loadAll<RawEvaluation, EvaluationDefinition>(
      exampleDir, "evaluations", mapEvaluation,
    ),
  ]);

  return {
    agents, skills, tools, policies, workflows,
    systems, contextScopes, auditEvents, evaluations,
  };
}
