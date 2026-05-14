/**
 * Step definition types for v0.2 Workflow Engine.
 * Extends the core WorkflowDefinition with concrete step shapes.
 */

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  /** Defaults to "tool_error". Policy denies and approval gates are never retried. */
  retryOn: "tool_error" | "timeout" | "any";
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 200,
  backoffMultiplier: 2,
  retryOn: "tool_error",
};

export interface ToolStepDefinition {
  kind: "tool";
  id: string;
  toolId: string;
  /** Maps workflow context keys to tool input keys. */
  inputMapping: Record<string, string>;
  /** Key under which the tool output is written to workflow context. */
  outputKey: string;
  /** Tool to call during compensation (undo). Input is captured at completion time. */
  compensationToolId?: string;
  timeoutMs?: number;
  retry?: Partial<RetryPolicy>;
}

export interface SkillStepDefinition {
  kind: "skill";
  id: string;
  skillId: string;
  inputMapping: Record<string, string>;
  outputKey: string;
  timeoutMs?: number;
  retry?: Partial<RetryPolicy>;
}

export interface HumanApprovalStepDefinition {
  kind: "human_approval";
  id: string;
  /** Prompt text shown to the approver in a UI or notification. */
  prompt: string;
  /** Role required to approve — checked by callers of WorkflowEngine.approve(). */
  requiredRole: string;
  /** Auto-reject the workflow if no approval within this window (ms). */
  timeoutMs?: number;
}

export interface ConditionalStepDefinition {
  kind: "conditional";
  id: string;
  /**
   * Simple dot-path expression evaluated against workflow context.
   * Supports: "context.riskScore >= 0.7", "context.status === 'flagged'"
   * Full expression engine (CEL/OPA) is a v0.3 upgrade.
   */
  condition: string;
  ifTrue: StepDefinition[];
  ifFalse?: StepDefinition[];
}

export type StepDefinition =
  | ToolStepDefinition
  | SkillStepDefinition
  | HumanApprovalStepDefinition
  | ConditionalStepDefinition;

export interface WorkflowV2Definition {
  id: string;
  version: string;
  /** Policy applied at every step via PolicyEngine.evaluate(). */
  policyId: string;
  steps: StepDefinition[];
}
