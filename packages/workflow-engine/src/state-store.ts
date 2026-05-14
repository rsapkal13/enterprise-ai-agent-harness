import type { WorkflowState } from "./workflow-state";

/**
 * Pluggable state persistence interface.
 * v0.2: InMemoryStateStore. v0.3+: swap in PostgresStateStore or RedisStateStore.
 */
export interface StateStore {
  save(state: WorkflowState): Promise<void>;
  get(runId: string): Promise<WorkflowState | undefined>;
  listActive(): Promise<WorkflowState[]>;
}

export class InMemoryStateStore implements StateStore {
  private readonly store = new Map<string, WorkflowState>();

  async save(state: WorkflowState): Promise<void> {
    this.store.set(state.runId, { ...state });
  }

  async get(runId: string): Promise<WorkflowState | undefined> {
    const state = this.store.get(runId);
    return state ? { ...state } : undefined;
  }

  async listActive(): Promise<WorkflowState[]> {
    return [...this.store.values()].filter(
      (s) => s.status === "running" || s.status === "waiting_for_approval",
    );
  }
}
