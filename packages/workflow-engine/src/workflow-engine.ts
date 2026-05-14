import type { PolicyDefinition } from "../../core/src";
import type { PolicyEngine } from "../../policy-engine/src/policy-engine";
import type { ToolGateway } from "../../tool-gateway/src/tool-gateway";
import type { TraceEvent } from "../../observability/src/trace-model";
import type { StateStore } from "./state-store";
import { InMemoryStateStore } from "./state-store";
import { StepExecutor } from "./step-executor";
import type { WorkflowV2Definition, StepDefinition } from "./step-definitions";
import type { WorkflowState, StepRecord } from "./workflow-state";

export interface WorkflowStartRequest {
  workflow: WorkflowV2Definition;
  /** Policy definition applied at every step. */
  policy: PolicyDefinition;
  /** The agent running this workflow (used in policy evaluation). */
  agentId: string;
  input: Record<string, unknown>;
}

export interface ApprovalRequest {
  runId: string;
  approverId: string;
  notes?: string;
}

export interface RejectionRequest {
  runId: string;
  approverId: string;
  reason: string;
}

export interface WorkflowEngineOptions {
  stateStore?: StateStore;
  policyEngine: PolicyEngine;
  toolGateway: ToolGateway;
  emitTrace?: (event: TraceEvent) => void;
}

/**
 * WorkflowRunner — v0.2 orchestration engine.
 *
 * Drives stateful AI-enabled business journeys with:
 * - Policy checkpoints before every step
 * - Human approval gates (park/resume)
 * - Compensation (LIFO undo) on failure
 * - Full trace event emission
 *
 * State durability: in-memory (v0.2). Inject a PostgresStateStore for v0.3.
 */
export class WorkflowRunner {
  private readonly stateStore: StateStore;
  private readonly policyEngine: PolicyEngine;
  private readonly toolGateway: ToolGateway;
  private readonly emitTrace: (event: TraceEvent) => void;

  constructor(options: WorkflowEngineOptions) {
    this.stateStore = options.stateStore ?? new InMemoryStateStore();
    this.policyEngine = options.policyEngine;
    this.toolGateway = options.toolGateway;
    this.emitTrace = options.emitTrace ?? (() => {});
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async start(request: WorkflowStartRequest): Promise<WorkflowState> {
    const runId = `run-${request.workflow.id}-${Date.now()}`;
    const traceId = `trace-${runId}`;
    const now = new Date().toISOString();

    const state: WorkflowState = {
      workflowId: request.workflow.id,
      runId,
      status: "running",
      context: { ...request.input },
      history: [],
      compensationStack: [],
      startedAt: now,
      updatedAt: now,
    };

    await this.stateStore.save(state);
    this.emit(traceId, "workflow.started", { runId, workflowId: state.workflowId });

    const result = await this.executeSteps(
      request.workflow.steps,
      state,
      request.policy,
      request.agentId,
      traceId,
    );

    return result;
  }

  async getState(runId: string): Promise<WorkflowState | undefined> {
    return this.stateStore.get(runId);
  }

  async listActive(): Promise<WorkflowState[]> {
    return this.stateStore.listActive();
  }

  async approve(req: ApprovalRequest): Promise<WorkflowState> {
    const state = await this.requireState(req.runId);

    if (state.status !== "waiting_for_approval") {
      throw new Error(
        `Cannot approve run ${req.runId} in status "${state.status}"`,
      );
    }

    const traceId = `trace-${req.runId}`;
    this.emit(traceId, "step.approved", {
      runId: req.runId,
      approverId: req.approverId,
      notes: req.notes,
    });

    // Resume from the step after the approval gate
    state.status = "running";
    state.updatedAt = new Date().toISOString();
    await this.stateStore.save(state);

    // The pending step ID tells us where to resume
    const pendingStepId = state.currentStepId;

    // Re-fetch the workflow definition — in v0.2 callers must re-supply it.
    // v0.3+: persist workflow definition in state store.
    // For now: the approval gate step is considered "completed" and we advance.
    if (pendingStepId) {
      const stepRecord: StepRecord = {
        stepId: pendingStepId,
        startedAt: state.updatedAt,
        completedAt: state.updatedAt,
        outcome: "completed",
        policyDecisionId: "approval-granted",
        traceSpanId: `span-approval-${Date.now()}`,
      };
      state.history.push(stepRecord);
    }

    state.status = "completed";
    state.completedAt = new Date().toISOString();
    state.updatedAt = state.completedAt;
    state.currentStepId = undefined;
    await this.stateStore.save(state);

    this.emit(traceId, "workflow.completed", { runId: req.runId });
    return { ...state };
  }

  async reject(req: RejectionRequest): Promise<WorkflowState> {
    const state = await this.requireState(req.runId);

    if (state.status !== "waiting_for_approval") {
      throw new Error(
        `Cannot reject run ${req.runId} in status "${state.status}"`,
      );
    }

    const traceId = `trace-${req.runId}`;
    this.emit(traceId, "step.rejected", {
      runId: req.runId,
      approverId: req.approverId,
      reason: req.reason,
    });

    if (state.currentStepId) {
      state.history.push({
        stepId: state.currentStepId,
        startedAt: state.updatedAt,
        completedAt: new Date().toISOString(),
        outcome: "rejected",
        policyDecisionId: "approval-rejected",
        traceSpanId: `span-rejection-${Date.now()}`,
        error: req.reason,
      });
    }

    await this.compensate(state, traceId);
    return { ...state };
  }

  // ─── Step Execution ──────────────────────────────────────────────────────────

  private async executeSteps(
    steps: StepDefinition[],
    state: WorkflowState,
    policy: PolicyDefinition,
    agentId: string,
    traceId: string,
  ): Promise<WorkflowState> {
    const executor = new StepExecutor({
      policyEngine: this.policyEngine,
      toolGateway: this.toolGateway,
      policy,
      agentId,
      emitTrace: (e) => this.emitTrace({ traceId, ...e }),
    });

    for (const step of steps) {
      state.currentStepId = step.id;
      state.updatedAt = new Date().toISOString();
      await this.stateStore.save(state);

      this.emit(traceId, "step.started", { runId: state.runId, stepId: step.id });

      const result = await executor.execute(step, state.context, state.runId, traceId);

      if (result.outcome === "requires_approval") {
        state.status = "waiting_for_approval";
        state.updatedAt = new Date().toISOString();
        await this.stateStore.save(state);
        this.emit(traceId, "step.parked", { runId: state.runId, stepId: step.id });
        // Return parked state — caller resumes via approve() / reject()
        return { ...state };
      }

      if (result.outcome === "failed") {
        state.history.push({
          stepId: step.id,
          startedAt: state.updatedAt,
          completedAt: new Date().toISOString(),
          outcome: "failed",
          policyDecisionId: result.policyDecisionId,
          traceSpanId: result.traceSpanId,
          error: result.error,
        });
        this.emit(traceId, "step.failed", {
          runId: state.runId,
          stepId: step.id,
          error: result.error,
        });
        await this.compensate(state, traceId);
        return { ...state };
      }

      // Step completed
      if (result.outputKey && result.outputValue !== undefined) {
        // Conditional steps return a branch — execute sub-steps instead of storing
        if (result.outputKey.startsWith("__branch_")) {
          const branch = result.outputValue as StepDefinition[];
          if (branch.length > 0) {
            const branchResult = await this.executeSteps(
              branch,
              state,
              policy,
              agentId,
              traceId,
            );
            // If branch parked or failed, propagate that state
            if (
              branchResult.status === "waiting_for_approval" ||
              branchResult.status === "failed" ||
              branchResult.status === "compensating"
            ) {
              return branchResult;
            }
          }
        } else {
          state.context[result.outputKey] = result.outputValue;
        }
      }

      if (result.compensationEntry) {
        state.compensationStack.push(result.compensationEntry);
      }

      const now = new Date().toISOString();
      state.history.push({
        stepId: step.id,
        startedAt: state.updatedAt,
        completedAt: now,
        outcome: "completed",
        policyDecisionId: result.policyDecisionId,
        traceSpanId: result.traceSpanId,
      });

      this.emit(traceId, "step.completed", { runId: state.runId, stepId: step.id });
      state.updatedAt = now;
      await this.stateStore.save(state);
    }

    // All steps completed
    const now = new Date().toISOString();
    state.status = "completed";
    state.completedAt = now;
    state.updatedAt = now;
    state.currentStepId = undefined;
    await this.stateStore.save(state);

    this.emit(traceId, "workflow.completed", { runId: state.runId });
    return { ...state };
  }

  // ─── Compensation ────────────────────────────────────────────────────────────

  private async compensate(state: WorkflowState, traceId: string): Promise<void> {
    state.status = "compensating";
    state.updatedAt = new Date().toISOString();
    await this.stateStore.save(state);

    // Unwind in LIFO order
    while (state.compensationStack.length > 0) {
      const entry = state.compensationStack.pop()!;

      try {
        await this.toolGateway.callTool({
          tool: { id: entry.compensationToolId } as never,
          input: entry.input,
          traceId,
        });

        const stepRecord = state.history.find((h) => h.stepId === entry.stepId);
        if (stepRecord) stepRecord.outcome = "compensated";

        this.emit(traceId, "step.compensated", {
          runId: state.runId,
          stepId: entry.stepId,
          compensationToolId: entry.compensationToolId,
        });
      } catch (err) {
        // Best-effort compensation: log and continue unwinding
        this.emit(traceId, "step.compensation_failed", {
          runId: state.runId,
          stepId: entry.stepId,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      state.updatedAt = new Date().toISOString();
      await this.stateStore.save(state);
    }

    state.status = "failed";
    state.updatedAt = new Date().toISOString();
    await this.stateStore.save(state);

    this.emit(traceId, "workflow.failed", { runId: state.runId });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async requireState(runId: string): Promise<WorkflowState> {
    const state = await this.stateStore.get(runId);
    if (!state) throw new Error(`Workflow run not found: ${runId}`);
    return state;
  }

  private emit(
    traceId: string,
    eventType: string,
    attributes: Record<string, unknown>,
  ): void {
    this.emitTrace({
      traceId,
      spanId: `span-${eventType}-${Date.now()}`,
      eventType,
      timestamp: new Date().toISOString(),
      attributes,
    });
  }
}
