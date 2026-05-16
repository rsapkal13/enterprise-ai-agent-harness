/**
 * in-memory-workflow-engine.js
 *
 * Sequential workflow step runner for the Enterprise AI Agent Harness demo.
 *
 * Supports four step types:
 *   tool       — calls tool gateway, stores output
 *   policy     — evaluates policy (demo: allow unless default_decision=deny)
 *   approval   — pauses (status → waiting_for_approval); resume() to continue
 *   completion — marks workflow completed
 *
 * Part of: v0.2 local runtime — Issue #57
 */

import { randomUUID } from "node:crypto";
import { RuleBasedPolicyEvaluator } from "../../policy-engine/src/policy-engine.js";

export class InMemoryWorkflowEngine {
  constructor(opts) {
    // opts: { toolGateway, toolRegistry, policyRegistry }
    this.opts = opts;
    this.runs = new Map();
    this.policyEvaluator = opts.policyEvaluator ?? new RuleBasedPolicyEvaluator();
  }

  // ── Public interface ────────────────────────────────────────────────────────

  async start(request) {
    const { workflow, input } = request;
    const runId = randomUUID();
    const steps = workflow._rawSteps ?? [];

    const state = {
      workflowId: workflow.id,
      runId,
      status: "running",
      updatedAt: new Date().toISOString(),
      stepOutputs: {},
      history: [],
      pendingApprovalStepId: undefined,
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

    await this._executeFrom(state, steps[0].id);
    return state;
  }

  async getState(runId) {
    return this.runs.get(runId);
  }

  /**
   * Resume a paused workflow after an approval step.
   * @param {string}  runId    The run to resume
   * @param {boolean} approved Whether the approval was granted
   * @param {object}  evidence Evidence recorded with the approval decision
   */
  async resume(runId, approved, evidence = {}) {
    const state = this.runs.get(runId);
    if (!state) throw new Error(`No workflow run found for runId "${runId}"`);
    if (state.status !== "waiting_for_approval") {
      throw new Error(`Workflow ${runId} is not waiting for approval (status: ${state.status})`);
    }

    const approvalStepId = state.pendingApprovalStepId;
    const approvalStep   = state._steps.find((s) => s.id === approvalStepId);

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
      output: state.stepOutputs[approvalStepId],
      executedAt: new Date().toISOString(),
    });

    state.pendingApprovalStepId = undefined;
    state.status = "running";

    const nextId = approved ? approvalStep?.on_success : approvalStep?.on_failure;
    if (!nextId || nextId === "stop") {
      state.status = approved ? "completed" : "failed";
      state.updatedAt = new Date().toISOString();
      return state;
    }

    await this._executeFrom(state, nextId);
    return state;
  }

  // ── Execution ───────────────────────────────────────────────────────────────

  async _executeFrom(state, stepId) {
    let currentId = stepId;

    while (currentId && currentId !== "stop") {
      const step = state._steps.find((s) => s.id === currentId);
      if (!step) {
        state.status = "completed";
        state.updatedAt = new Date().toISOString();
        return;
      }

      state.currentStepId = step.id;
      state.updatedAt = new Date().toISOString();

      if (step.type === "tool") {
        currentId = await this._toolStep(state, step);
      } else if (step.type === "policy") {
        currentId = await this._policyStep(state, step);
      } else if (step.type === "approval") {
        await this._approvalStep(state, step);
        return; // pause — resumes via resume()
      } else if (step.type === "completion") {
        state.status = "completed";
        state.updatedAt = new Date().toISOString();
        state.history.push({ stepId: step.id, type: "completion", outcome: "completed", output: {}, executedAt: new Date().toISOString() });
        return;
      } else {
        state.status = "failed";
        state.updatedAt = new Date().toISOString();
        return;
      }
    }

    if (!currentId || currentId === "stop") {
      if (state.status === "running") state.status = "completed";
      state.updatedAt = new Date().toISOString();
    }
  }

  async _toolStep(state, step) {
    if (!step.tool_ref) return step.on_failure;
    const tool = await this.opts.toolRegistry.getTool(step.tool_ref);
    if (!tool) {
      state.history.push({ stepId: step.id, type: "tool", outcome: "failed",
        output: { error: `Tool "${step.tool_ref}" not found` }, executedAt: new Date().toISOString() });
      return step.on_failure ?? "stop";
    }

    const input = this._gatherInputs(state, step);
    try {
      const result = await this.opts.toolGateway.callTool({ tool, input, traceId: state.runId });
      state.stepOutputs[step.id] = result.output;
      state.history.push({ stepId: step.id, type: "tool", outcome: "completed", output: result.output, executedAt: result.completedAt });
      return step.on_success;
    } catch (err) {
      state.history.push({ stepId: step.id, type: "tool", outcome: "failed",
        output: { error: err instanceof Error ? err.message : String(err) }, executedAt: new Date().toISOString() });
      return step.on_failure ?? "stop";
    }
  }

  async _policyStep(state, step) {
    if (!step.policy_ref) return step.on_success;
    const policy = await this.opts.policyRegistry.getPolicy(step.policy_ref);
    if (!policy) {
      state.history.push({ stepId: step.id, type: "policy", outcome: "failed",
        output: { error: `Policy "${step.policy_ref}" not found` }, executedAt: new Date().toISOString() });
      if (!step.on_failure || step.on_failure === "stop") state.status = "failed";
      return step.on_failure ?? "stop";
    }

    const decision = await this.policyEvaluator.evaluate(policy, this._policyRequest(state, step, policy));
    const output = {
      policy_id: decision.policyId,
      decision: decision.outcome,
      reason: decision.reason,
      obligations: decision.obligations,
      evaluated_at: decision.evaluatedAt,
    };
    state.stepOutputs[step.id] = output;

    if (decision.outcome === "allow") {
      state.history.push({ stepId: step.id, type: "policy", outcome: "completed",
        output, executedAt: decision.evaluatedAt });
      return step.on_success;
    }

    if (decision.outcome === "require_approval") {
      state.history.push({ stepId: step.id, type: "policy", outcome: "waiting",
        output, executedAt: decision.evaluatedAt });
      await this._approvalStep(state, {
        ...step,
        approval: {
          ...(step.approval ?? {}),
          approver_role: step.approval?.approver_role ?? "policy-reviewer",
        },
      });
      state.stepOutputs[step.id] = { ...state.stepOutputs[step.id], ...output };
      return undefined;
    }

    state.history.push({ stepId: step.id, type: "policy", outcome: "denied",
      output, executedAt: decision.evaluatedAt });
    if (!step.on_failure || step.on_failure === "stop") state.status = "failed";
    return step.on_failure ?? "stop";
  }

  async _approvalStep(state, step) {
    state.status = "waiting_for_approval";
    state.pendingApprovalStepId = step.id;
    state.currentStepId = step.id;
    state.updatedAt = new Date().toISOString();
    state.stepOutputs[step.id] = {
      ui_manifest_ref: step.ui_manifest_ref ?? null,
      approver_role:   step.approval?.approver_role ?? "unknown",
      waiting_since:   new Date().toISOString(),
    };
  }

  _gatherInputs(state, step) {
    const merged = { ...state._input };
    for (const fromStepId of step.inputs?.from_steps ?? []) {
      const prior = state.stepOutputs[fromStepId] ?? {};
      const fields = step.inputs?.fields;
      if (fields && fields.length > 0) {
        for (const f of fields) { if (f in prior) merged[f] = prior[f]; }
      } else {
        Object.assign(merged, prior);
      }
    }
    return merged;
  }

  _policyRequest(state, step, policy) {
    const context = this._policyContext(state);
    return {
      agentId: String(context.agent_id ?? context.agentId ?? policy._scope?.agents?.[0] ?? ""),
      skillId: String(context.skill_id ?? context.skillId ?? policy._scope?.skills?.[0] ?? ""),
      toolId: String(step.tool_ref ?? context.tool_id ?? context.toolId ?? policy._scope?.tools?.[0] ?? ""),
      workflowId: state.workflowId,
      contextScopeId: String(context.context_scope_id ?? context.contextScopeId ?? policy._scope?.context_scopes?.[0] ?? ""),
      context,
    };
  }

  _policyContext(state) {
    const workflow = state._workflow ?? {};
    const merged = {
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
