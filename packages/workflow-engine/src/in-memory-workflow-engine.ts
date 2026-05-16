/**
 * in-memory-workflow-engine.ts
 *
 * Local, synchronous-step workflow engine for the Enterprise AI Agent Harness
 * demo runner.
 *
 * Execution model
 * ───────────────
 * Steps are executed sequentially following the `on_success` / `on_failure`
 * chain defined in each workflow's YAML manifest. The engine supports four
 * step types:
 *
 *   tool       — calls the mock tool gateway and stores the output
 *   policy     — evaluates the policy and decides allow / deny
 *   approval   — pauses execution (status → waiting_for_approval) until
 *                resume() is called
 *   completion — marks the workflow completed
 *
 * State is held in memory. Each run is identified by a unique `runId` (UUID).
 *
 * Part of: v0.2 local runtime — Issue #57
 */

import { randomUUID } from "node:crypto";
import type { WorkflowDefinition } from "../../core/src/index.js";
import { RuleBasedPolicyEvaluator } from "../../policy-engine/src/policy-engine.js";
import type { ToolGateway } from "../../tool-gateway/src/tool-gateway.js";
import type { InMemoryToolRegistry, InMemoryPolicyRegistry } from "../../registries/src/in-memory-registry.js";
import type { WorkflowEngine, WorkflowStartRequest } from "./workflow-engine.js";
import type { WorkflowState, WorkflowStatus } from "./workflow-state.js";

// ── Raw YAML step shape (subset we need for execution) ────────────────────────

interface RawStep {
  id: string;
  type: "tool" | "policy" | "approval" | "completion";
  tool_ref?: string;
  policy_ref?: string;
  ui_manifest_ref?: string;
  on_success?: string;
  on_failure?: string;
  inputs?: {
    from_steps?: string[];
    fields?: string[];
  };
  outputs?: {
    fields?: string[];
  };
  approval?: {
    required?: boolean;
    approver_role?: string;
  };
}

// ── Extended workflow state with step history ─────────────────────────────────

export interface StepResult {
  stepId: string;
  type: RawStep["type"];
  outcome: "completed" | "denied" | "waiting" | "failed";
  output: Record<string, unknown>;
  executedAt: string;
}

export interface ExtendedWorkflowState extends WorkflowState {
  /** Accumulated outputs from all completed steps, keyed by stepId. */
  stepOutputs: Record<string, Record<string, unknown>>;
  /** Ordered history of step results. */
  history: StepResult[];
  /** Pending approval step ID, set when status === waiting_for_approval. */
  pendingApprovalStepId?: string;
  /** Steps remaining to execute after an approval is resolved. */
  nextStepId?: string;
  /** Raw step definitions from the workflow YAML (needed for resume). */
  _steps: RawStep[];
  /** Initial input provided to start(). */
  _input: Record<string, unknown>;
  /** Workflow metadata used when constructing policy evaluation context. */
  _workflow: WorkflowDefinition;
}

// ── Engine dependencies ───────────────────────────────────────────────────────

export interface WorkflowEngineOptions {
  toolGateway: ToolGateway;
  toolRegistry: InMemoryToolRegistry;
  policyRegistry: InMemoryPolicyRegistry;
  policyEvaluator?: RuleBasedPolicyEvaluator;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class InMemoryWorkflowEngine implements WorkflowEngine {
  private readonly runs = new Map<string, ExtendedWorkflowState>();
  private readonly policyEvaluator: RuleBasedPolicyEvaluator;

  constructor(private readonly opts: WorkflowEngineOptions) {
    this.policyEvaluator = opts.policyEvaluator ?? new RuleBasedPolicyEvaluator();
  }

  // ── WorkflowEngine interface ────────────────────────────────────────────────

  async start(request: WorkflowStartRequest): Promise<ExtendedWorkflowState> {
    const { workflow, input } = request;
    const runId = randomUUID();

    // The WorkflowDefinition.steps is a list of step IDs (strings).
    // We need the raw YAML step objects for execution. The WorkflowDefinition
    // type stores only IDs — the full step objects come from the raw YAML
    // stored on the definition. We access them via the _rawSteps extension
    // if present, otherwise fall back to executing based on IDs only.
    const steps = (workflow as WorkflowDefinition & { _rawSteps?: RawStep[] })
      ._rawSteps ?? [];

    const state: ExtendedWorkflowState = {
      workflowId: workflow.id,
      runId,
      status: "running",
      updatedAt: new Date().toISOString(),
      stepOutputs: {},
      history: [],
      _steps: steps,
      _input: input,
      _workflow: workflow,
    };

    this.runs.set(runId, state);

    if (steps.length === 0) {
      state.status = "completed";
      state.updatedAt = new Date().toISOString();
      return state;
    }

    await this.executeFrom(state, steps[0]!.id);
    return state;
  }

  async getState(runId: string): Promise<ExtendedWorkflowState | undefined> {
    return this.runs.get(runId);
  }

  /**
   * Resume a workflow paused at an approval step.
   *
   * @param runId    The run to resume
   * @param approved Whether the approval was granted
   * @param evidence Key-value evidence recorded with the approval decision
   */
  async resume(
    runId: string,
    approved: boolean,
    evidence: Record<string, unknown> = {},
  ): Promise<ExtendedWorkflowState> {
    const state = this.runs.get(runId);
    if (!state) {
      throw new Error(`No workflow run found for runId "${runId}"`);
    }
    if (state.status !== "waiting_for_approval") {
      throw new Error(
        `Workflow ${runId} is not waiting for approval (current status: ${state.status})`,
      );
    }

    const approvalStepId = state.pendingApprovalStepId!;
    const approvalStep = state._steps.find((s) => s.id === approvalStepId);

    // Record the approval decision in step outputs
    state.stepOutputs[approvalStepId] = {
      ...state.stepOutputs[approvalStepId],
      ...evidence,
      approved,
      resolved_at: new Date().toISOString(),
    };

    state.history.push({
      stepId: approvalStepId,
      type: "approval",
      outcome: approved ? "completed" : "denied",
      output: state.stepOutputs[approvalStepId]!,
      executedAt: new Date().toISOString(),
    });

    state.pendingApprovalStepId = undefined;
    state.status = "running";

    const nextId = approved
      ? approvalStep?.on_success
      : approvalStep?.on_failure;

    if (!nextId || nextId === "stop") {
      state.status = approved ? "completed" : "failed";
      state.updatedAt = new Date().toISOString();
      return state;
    }

    await this.executeFrom(state, nextId);
    return state;
  }

  // ── Step execution ──────────────────────────────────────────────────────────

  private async executeFrom(
    state: ExtendedWorkflowState,
    stepId: string,
  ): Promise<void> {
    let currentId: string | undefined = stepId;

    while (currentId && currentId !== "stop") {
      const step = state._steps.find((s) => s.id === currentId);
      if (!step) {
        // Unknown step — treat as completion
        state.status = "completed";
        state.updatedAt = new Date().toISOString();
        return;
      }

      state.currentStepId = step.id;
      state.updatedAt = new Date().toISOString();

      switch (step.type) {
        case "tool":
          currentId = await this.executeToolStep(state, step);
          break;
        case "policy":
          currentId = await this.executePolicyStep(state, step);
          break;
        case "approval":
          await this.executeApprovalStep(state, step);
          return; // pause — execution continues after resume()
        case "completion":
          state.status = "completed";
          state.currentStepId = step.id;
          state.updatedAt = new Date().toISOString();
          state.history.push({
            stepId: step.id,
            type: "completion",
            outcome: "completed",
            output: {},
            executedAt: new Date().toISOString(),
          });
          return;
        default:
          // Unknown step type — stop safely
          state.status = "failed";
          state.updatedAt = new Date().toISOString();
          return;
      }
    }

    if (currentId === "stop" || !currentId) {
      // Workflow ended without a completion step — mark completed if running,
      // failed if the last step returned on_failure → stop.
      if (state.status === "running") {
        state.status = "completed";
      }
      state.updatedAt = new Date().toISOString();
    }
  }

  private async executeToolStep(
    state: ExtendedWorkflowState,
    step: RawStep,
  ): Promise<string | undefined> {
    if (!step.tool_ref) {
      return step.on_failure;
    }

    const tool = await this.opts.toolRegistry.getTool(step.tool_ref);
    if (!tool) {
      state.history.push({
        stepId: step.id,
        type: "tool",
        outcome: "failed",
        output: { error: `Tool "${step.tool_ref}" not found in registry` },
        executedAt: new Date().toISOString(),
      });
      return step.on_failure ?? "stop";
    }

    // Gather inputs from prior step outputs and the initial workflow input
    const input = this.gatherInputs(state, step);

    try {
      const result = await this.opts.toolGateway.callTool({
        tool,
        input,
        traceId: state.runId,
      });

      state.stepOutputs[step.id] = result.output;
      state.history.push({
        stepId: step.id,
        type: "tool",
        outcome: "completed",
        output: result.output,
        executedAt: result.completedAt,
      });

      return step.on_success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      state.history.push({
        stepId: step.id,
        type: "tool",
        outcome: "failed",
        output: { error: errorMsg },
        executedAt: new Date().toISOString(),
      });
      return step.on_failure ?? "stop";
    }
  }

  private async executePolicyStep(
    state: ExtendedWorkflowState,
    step: RawStep,
  ): Promise<string | undefined> {
    if (!step.policy_ref) {
      return step.on_success;
    }

    const policy = await this.opts.policyRegistry.getPolicy(step.policy_ref);
    if (!policy) {
      state.history.push({
        stepId: step.id,
        type: "policy",
        outcome: "failed",
        output: { error: `Policy "${step.policy_ref}" not found in registry` },
        executedAt: new Date().toISOString(),
      });
      if (!step.on_failure || step.on_failure === "stop") {
        state.status = "failed";
      }
      return step.on_failure ?? "stop";
    }

    const decision = await this.policyEvaluator.evaluate(
      policy,
      this.policyRequest(state, step, policy),
    );
    const output = {
      policy_id: decision.policyId,
      decision: decision.outcome,
      reason: decision.reason,
      obligations: decision.obligations,
      evaluated_at: decision.evaluatedAt,
    };
    state.stepOutputs[step.id] = output;

    if (decision.outcome === "allow") {
      state.history.push({
        stepId: step.id,
        type: "policy",
        outcome: "completed",
        output,
        executedAt: decision.evaluatedAt,
      });
      return step.on_success;
    }

    if (decision.outcome === "require_approval") {
      state.history.push({
        stepId: step.id,
        type: "policy",
        outcome: "waiting",
        output,
        executedAt: decision.evaluatedAt,
      });
      await this.executeApprovalStep(state, {
        ...step,
        approval: {
          ...(step.approval ?? {}),
          approver_role: step.approval?.approver_role ?? "policy-reviewer",
        },
      });
      state.stepOutputs[step.id] = { ...state.stepOutputs[step.id], ...output };
      return undefined;
    }

    state.history.push({
      stepId: step.id,
      type: "policy",
      outcome: "denied",
      output,
      executedAt: decision.evaluatedAt,
    });
    if (!step.on_failure || step.on_failure === "stop") {
      state.status = "failed";
    }
    return step.on_failure ?? "stop";
  }

  private async executeApprovalStep(
    state: ExtendedWorkflowState,
    step: RawStep,
  ): Promise<void> {
    // Record the pending approval and pause.
    state.status = "waiting_for_approval";
    state.pendingApprovalStepId = step.id;
    state.currentStepId = step.id;
    state.updatedAt = new Date().toISOString();

    // Pre-populate step outputs with the UI manifest reference if present.
    state.stepOutputs[step.id] = {
      ui_manifest_ref: step.ui_manifest_ref ?? null,
      approver_role: step.approval?.approver_role ?? "unknown",
      waiting_since: new Date().toISOString(),
    };

    // Note: history entry is added when resume() is called, so we have
    // the final approved/denied outcome.
  }

  // ── Input gathering ─────────────────────────────────────────────────────────

  /**
   * Build the input map for a tool step by merging:
   *   1. The initial workflow input
   *   2. Outputs from prior steps listed in step.inputs.from_steps
   *
   * Only fields listed in step.inputs.fields are included from prior steps
   * (if specified); otherwise all output fields from those steps are merged.
   */
  private gatherInputs(
    state: ExtendedWorkflowState,
    step: RawStep,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...state._input };

    for (const fromStepId of step.inputs?.from_steps ?? []) {
      const priorOutput = state.stepOutputs[fromStepId] ?? {};
      const fields = step.inputs?.fields;

      if (fields && fields.length > 0) {
        for (const field of fields) {
          if (field in priorOutput) {
            merged[field] = priorOutput[field];
          }
        }
      } else {
        Object.assign(merged, priorOutput);
      }
    }

    return merged;
  }

  private policyRequest(
    state: ExtendedWorkflowState,
    step: RawStep,
    policy: Record<string, any>,
  ): Record<string, unknown> {
    const context = this.policyContext(state);
    const scope = policy._scope ?? {};
    return {
      agentId: String(context.agent_id ?? context.agentId ?? scope.agents?.[0] ?? ""),
      skillId: String(context.skill_id ?? context.skillId ?? scope.skills?.[0] ?? ""),
      toolId: String(step.tool_ref ?? context.tool_id ?? context.toolId ?? scope.tools?.[0] ?? ""),
      workflowId: state.workflowId,
      contextScopeId: String(context.context_scope_id ?? context.contextScopeId ?? scope.context_scopes?.[0] ?? ""),
      context,
    };
  }

  private policyContext(state: ExtendedWorkflowState): Record<string, unknown> {
    const workflow = state._workflow as WorkflowDefinition;
    const merged: Record<string, unknown> = {
      workflow_id: state.workflowId,
      risk_tier: workflow._riskTier,
      environment: workflow._environment,
      ...state._input,
    };

    for (const [stepId, output] of Object.entries(state.stepOutputs)) {
      merged[stepId] = output;
      Object.assign(merged, output);
    }

    return merged;
  }
}

// ── Factory helper ────────────────────────────────────────────────────────────

/**
 * Convenience factory — creates an InMemoryWorkflowEngine wired to a
 * caller-supplied ToolGateway.
 *
 * Example (demo runner):
 *   import { callMockTool } from "../../tool-gateway/src/adapters/mock-adapter.js";
 *   const engine = createWorkflowEngine(
 *     { callTool: callMockTool },
 *     toolRegistry,
 *     policyRegistry,
 *   );
 *
 * @param toolGateway     Tool gateway implementation (e.g. mock adapter)
 * @param toolRegistry    Populated tool registry
 * @param policyRegistry  Populated policy registry
 */
export function createWorkflowEngine(
  toolGateway: ToolGateway,
  toolRegistry: InMemoryToolRegistry,
  policyRegistry: InMemoryPolicyRegistry,
): InMemoryWorkflowEngine {
  return new InMemoryWorkflowEngine({ toolGateway, toolRegistry, policyRegistry });
}
