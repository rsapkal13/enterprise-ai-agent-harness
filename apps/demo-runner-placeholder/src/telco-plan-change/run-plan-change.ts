/**
 * Telco Plan Change — Demo Runner
 *
 * Executes two scenarios through the full harness runtime:
 *
 *   Scenario A: Standard upgrade (auto-completes)
 *   Scenario B: High-value downgrade (parks for team-lead approval → approved → completes)
 *
 * Run with: npx tsx apps/demo-runner-placeholder/src/telco-plan-change/run-plan-change.ts
 */

import { createRuntime } from "../runtime";
import { planChangeWorkflow } from "./plan-change-workflow";
import { telcoPlanChangeHandlers } from "./plan-change-tools";
import type { PolicyEngine, PolicyEvaluationRequest } from "../../../../packages/policy-engine/src/policy-engine";
import type { PolicyDefinition } from "../../../../packages/core/src";
import type { PolicyDecision } from "../../../../packages/policy-engine/src/policy-decision";
import type { TraceEvent } from "../../../../packages/observability/src/trace-model";

// ─── Policy Engine ───────────────────────────────────────────────────────────

const telcoPolicy: PolicyEngine = {
  async evaluate(
    _policy: PolicyDefinition,
    request: PolicyEvaluationRequest,
  ): Promise<PolicyDecision> {
    const now = new Date().toISOString();
    const ctx = request.context as Record<string, unknown>;

    // Block provisioning for suspended accounts
    if (
      request.toolId === "provision_plan_change" &&
      (ctx["customer"] as Record<string, unknown>)?.["accountStatus"] === "suspended"
    ) {
      return {
        policyId: "telco-care-policy",
        outcome: "deny",
        reason: "Plan changes are blocked for suspended accounts.",
        obligations: [],
        evaluatedAt: now,
      };
    }

    return {
      policyId: "telco-care-policy",
      outcome: "allow",
      reason: "Request satisfies all telco care policy rules.",
      obligations: [],
      evaluatedAt: now,
    };
  },
};

const mockPolicy = { id: "telco-care-policy" } as never;

// ─── Trace collector ─────────────────────────────────────────────────────────

const traceLog: TraceEvent[] = [];
const emitTrace = (event: TraceEvent) => {
  traceLog.push(event);
  console.log(`  [TRACE] ${event.eventType}`);
};

// ─── Tool IDs ────────────────────────────────────────────────────────────────

const toolIds = Object.keys(telcoPlanChangeHandlers);

// ─── Scenario A: Standard upgrade ────────────────────────────────────────────

async function runScenarioA() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  Scenario A: Standard plan upgrade (auto-complete)");
  console.log("══════════════════════════════════════════════════════");

  const rt = await createRuntime({
    policyEngine: telcoPolicy,
    defaultPolicy: mockPolicy,
    mockToolHandlers: telcoPlanChangeHandlers,
    toolIds,
    agent: { id: "care-agent", name: "Telco Care Agent" },
    agentSkillIds: ["recommend_plan_options"],
    emitTrace,
  });

  const state = await rt.workflowRunner.start({
    workflow: planChangeWorkflow,
    policy: mockPolicy,
    agentId: "care-agent",
    input: {
      customerId: "CUST-001",
      requestedPlanId: "PLAN-UNLIM-100",
      effectiveDate: new Date().toISOString(),
      channel: "web",
      workflowId: planChangeWorkflow.id,
    },
  });

  console.log(`\n  Status:          ${state.status}`);
  console.log(`  Run ID:          ${state.runId}`);
  console.log(`  Steps completed: ${state.history.length}`);
  console.log(`  Provisioning:    ${(state.context["provisioningRef"] as Record<string,unknown>)?.["ref"] ?? state.context["provisioningRef"]}`);
  console.log(`  Audit ID:        ${(state.context["auditId"] as Record<string,unknown>)?.["auditId"] ?? "recorded"}`);

  console.log("\n  Step history:");
  for (const record of state.history) {
    console.log(`    ✓ ${record.stepId}`);
  }

  // Show active tools from registry
  const activeTools = await rt.toolRegistry.list("active");
  console.log(`\n  Active tools in registry: ${activeTools.length}`);
}

// ─── Scenario B: High-value downgrade → approval → complete ──────────────────

async function runScenarioB() {
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log("  Scenario B: High-value downgrade (parks → team-lead approves)");
  console.log("══════════════════════════════════════════════════════════════════");

  // Override proration handler to force a high-impact downgrade
  const downgradedHandlers = {
    ...telcoPlanChangeHandlers,
    calculate_proration: async () => ({
      ref: `PROR-DOWNGRADE-${Date.now()}`,
      creditAmount: 28.00,
      currency: "GBP",
      revenueImpact: -38, // triggers approval gate (< -30)
      effectiveDate: new Date().toISOString(),
    }),
  };

  const rt = await createRuntime({
    policyEngine: telcoPolicy,
    defaultPolicy: mockPolicy,
    mockToolHandlers: downgradedHandlers,
    toolIds,
    agent: { id: "care-agent", name: "Telco Care Agent" },
    agentSkillIds: ["recommend_plan_options"],
    emitTrace,
  });

  const parkedState = await rt.workflowRunner.start({
    workflow: planChangeWorkflow,
    policy: mockPolicy,
    agentId: "care-agent",
    input: {
      customerId: "CUST-002",
      requestedPlanId: "PLAN-VALUE-20",
      effectiveDate: new Date().toISOString(),
      channel: "ivr",
      workflowId: planChangeWorkflow.id,
    },
  });

  console.log(`\n  Status after start:  ${parkedState.status}`);
  console.log(`  Parked at step:      ${parkedState.currentStepId}`);
  console.log(`  Revenue impact:      ${(parkedState.context["proration"] as Record<string,unknown>)?.["revenueImpact"]}%`);

  // Team lead approves
  console.log("\n  → Team lead approves the downgrade");

  const finalState = await rt.workflowRunner.approve({
    runId: parkedState.runId,
    approverId: "lead-sarah",
    notes: "Customer has 3 years loyalty — approve as a goodwill gesture.",
  });

  console.log(`\n  Status after approval: ${finalState.status}`);
  console.log(`  Steps completed:       ${finalState.history.length}`);

  console.log("\n  Step history:");
  for (const record of finalState.history) {
    const icon = record.outcome === "completed" ? "✓" : "↩";
    console.log(`    ${icon} ${record.stepId} — ${record.outcome}`);
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

(async () => {
  try {
    await runScenarioA();
    await runScenarioB();

    console.log(`\n  ✅ Runtime demo complete.`);
    console.log(`  Total trace events emitted: ${traceLog.length}\n`);
  } catch (err) {
    console.error("  ❌ Runtime error:", err);
    process.exit(1);
  }
})();
