export type RiskLevel = "low" | "medium" | "high" | "restricted";
export type LifecycleStatus = "draft" | "active" | "deprecated" | "retired";
export type DataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted";

export interface SkillDefinition {
  id: string;
  version: string;
  status: LifecycleStatus;
  name: string;
  description: string;
  owner: string;
  riskLevel: RiskLevel;
  tools: string[];
  policies: string[];
  contextScopes?: string[];
  // TODO: Align with the final skill JSON schema before runtime use.
}

export interface ToolDefinition {
  id: string;
  version: string;
  status: LifecycleStatus;
  name: string;
  adapter: "rest" | "mcp" | "mock" | "workflow" | "data";
  riskLevel: RiskLevel;
  systemId: string;
  // TODO: Add input and output schema references.
}

export interface AgentDefinition {
  id: string;
  version: string;
  status: LifecycleStatus;
  name: string;
  allowedSkills: string[];
  channels: string[];
  // TODO: Add technical identity and context scopes.
}

export interface PolicyDefinition {
  id: string;
  version: string;
  status: LifecycleStatus;
  name: string;
  decisionType: "allow" | "deny" | "require_approval" | "require_consent";
  _rules?: unknown[];
  _applicableRiskTiers?: string[];
  _scope?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  version: string;
  status: LifecycleStatus;
  name: string;
  steps: string[];
  _rawSteps?: Array<{ id: string; [key: string]: unknown }>;
  _owner?: string;
  _riskTier?: string;
  _environment?: string;
}

export interface SystemDefinition {
  id: string;
  version: string;
  status: LifecycleStatus;
  name: string;
  owner: string;
  systemType: string;
  trustLevel: "trusted_internal" | "controlled_external" | "mock" | "unknown";
  dataClassification: DataClassification;
  // TODO: Align system categories with the final system JSON schema.
}

export interface ContextScopeDefinition {
  id: string;
  version: string;
  status: LifecycleStatus;
  name: string;
  owner: string;
  dataClassification: DataClassification;
  sourceSystems: string[];
  // TODO: Add policy-aware access requirements.
}

export interface AuditEvent {
  id: string;
  version: string;
  timestamp: string;
  eventType: string;
  actor: {
    type: "agent" | "user" | "system" | "policy_engine" | "workflow_engine";
    id: string;
  };
  outcome:
    | "started"
    | "allowed"
    | "denied"
    | "requires_action"
    | "completed"
    | "failed";
  // TODO: Add trace correlation and evidence payload fields.
}

export interface EvaluationDefinition {
  id: string;
  version: string;
  status: LifecycleStatus;
  name: string;
  targetType: "agent" | "skill" | "tool" | "workflow" | "policy" | "journey";
  metricType:
    | "completion"
    | "compliance"
    | "quality"
    | "latency"
    | "reliability"
    | "business_outcome";
  // TODO: Add result shape and evidence references.
}
