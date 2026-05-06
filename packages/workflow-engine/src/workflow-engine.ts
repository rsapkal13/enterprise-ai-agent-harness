import type { WorkflowDefinition } from "../../core/src";
import type { WorkflowState } from "./workflow-state";

export interface WorkflowStartRequest {
  workflow: WorkflowDefinition;
  input: Record<string, unknown>;
}

export interface WorkflowEngine {
  start(request: WorkflowStartRequest): Promise<WorkflowState>;
  getState(runId: string): Promise<WorkflowState | undefined>;
}

// TODO: Add step execution and policy checkpoint integration.
