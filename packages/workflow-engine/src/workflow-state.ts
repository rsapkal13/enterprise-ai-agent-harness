export type WorkflowStatus =
  | "pending"
  | "running"
  | "waiting_for_approval"
  | "completed"
  | "failed"
  | "compensating";

export interface WorkflowState {
  workflowId: string;
  runId: string;
  status: WorkflowStatus;
  currentStepId?: string;
  updatedAt: string;
}

// TODO: Add typed state data, history, and compensation metadata.
