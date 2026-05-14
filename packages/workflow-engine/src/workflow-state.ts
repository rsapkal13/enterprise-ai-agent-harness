export type WorkflowStatus =
  | "pending"
  | "running"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "compensating";

export interface StepRecord {
  stepId: string;
  startedAt: string;
  completedAt?: string;
  outcome: "completed" | "failed" | "skipped" | "rejected" | "compensated";
  policyDecisionId: string;
  traceSpanId: string;
  error?: string;
}

export interface CompensationEntry {
  stepId: string;
  compensationToolId: string;
  /** Input captured at step-completion time for safe, deterministic undo. */
  input: Record<string, unknown>;
}

export interface WorkflowState {
  workflowId: string;
  runId: string;
  status: WorkflowStatus;
  currentStepId?: string;
  /** Accumulated step outputs — the shared context passed into every subsequent step. */
  context: Record<string, unknown>;
  history: StepRecord[];
  /** LIFO stack of compensation entries for completed steps that have a compensationToolId. */
  compensationStack: CompensationEntry[];
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}
