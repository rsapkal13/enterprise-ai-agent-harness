/**
 * Banking Card Dispute — Demo Runner
 *
 * Runs two scenarios through the full Workflow Engine:
 *   Scenario A: Low-risk dispute, auto-completed
 *   Scenario B: High-risk dispute, parks for analyst review, then rejected → compensation triggered
 *
 * Run with: npx tsx examples/banking-card-dispute/src/run-dispute.ts
 */

import { WorkflowRunner } from "../../../packages/workflow-engine/src/workflow-engine";
import { cardDisputeWorkflow } from "./dispute-workflow";
import { DisputeMockToolGateway } from "./mock-tools";
import { DisputeMockPolicyEngine } from "./mock-policy-engine";
import type { TraceEvent } from "../../../packages/observability/src/trace-model";

const traceLog: TraceEvent[] = [];

const runner = new WorkflowRunner({
  policyEngine: new DisputeMockPolicyEngine(),
  toolGateway: new DisputeMockToolGateway(),
  emitTrace: (event) => {
    traceLog.push(event);
    console.log(`  [TRACE] ${event.eventType}`);
  },
});

const mockPolicy = { id: "banking-dispute-policy" } as never;

// ─── Scenario A: Low-risk (amount < $200) — auto-completes ──────────────────

async function runScenarioA() {
  console.log("\n═══════════════════════════════════════════════");
  console.log("  Scenario A: Low-risk dispute (auto-complete)");
  console.log("═══════════════════════════════════════════════");

  const state = await runner.start({
    workflow: cardDisputeWorkflow,
    policy: mockPolicy,
    agentId: "dispute-agent",
    input: {
      transactionId: "TXN-LOW-001",
      customerId: "CUST-001",
      workflowId: cardDisputeWorkflow.id,
    },
  });

  console.log(`\n  Status:    ${state.status}`);
  console.log(`  Run ID:    ${state.runId}`);
  console.log(`  Steps:     ${state.history.length} completed`);
  console.log(`  Audit ID:  ${(state.context["auditId"] as Record<string,unknown>)?.["auditId"] ?? state.context["auditId"]}`);
  console.log(`  Credit Ref: ${(state.context["creditRef"] as Record<string,unknown>)?.["creditRef"] ?? state.context["creditRef"]}`);
  console.log(`  Trace events: ${traceLog.filter(e => e.attributes["runId"] === state.runId).length}`);

  console.log("\n  Step history:");
  for (const record of state.history) {
    console.log(`    ✓ ${record.stepId} — ${record.outcome}`);
  }
}

// ─── Scenario B: High-risk (amount > $200) — parks, then rejected ───────────

async function runScenarioB() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Scenario B: High-risk dispute (analyst review → reject)");
  console.log("═══════════════════════════════════════════════════════");

  const initialState = await runner.start({
    workflow: cardDisputeWorkflow,
    policy: mockPolicy,
    agentId: "dispute-agent",
    input: {
      transactionId: "TXN-HIGH-002",
      customerId: "CUST-002",
      workflowId: cardDisputeWorkflow.id,
    },
  });

  console.log(`\n  Status after start: ${initialState.status}`);
  console.log(`  Run ID:             ${initialState.runId}`);
  console.log(`  Parked at step:     ${initialState.currentStepId}`);
  console.log(`  Risk score:         ${initialState.context["riskScore"]}`);

  // Simulate analyst rejecting the dispute
  console.log("\n  → Analyst rejects: suspected synthetic fraud");

  const finalState = await runner.reject({
    runId: initialState.runId,
    approverId: "analyst-1",
    reason: "Suspected synthetic fraud — transaction pattern matches known scheme.",
  });

  console.log(`\n  Status after rejection: ${finalState.status}`);
  console.log(`  Compensation stack:     ${finalState.compensationStack.length} entries remaining`);

  console.log("\n  Step history:");
  for (const record of finalState.history) {
    const icon = record.outcome === "compensated" ? "↩" : record.outcome === "completed" ? "✓" : "✗";
    console.log(`    ${icon} ${record.stepId} — ${record.outcome}`);
  }

  console.log(`\n  Total trace events: ${traceLog.length}`);
}

// ─── Run both scenarios ──────────────────────────────────────────────────────

(async () => {
  try {
    await runScenarioA();
    await runScenarioB();
    console.log("\n  ✅ Both scenarios completed.\n");
  } catch (err) {
    console.error("  ❌ Error:", err);
    process.exit(1);
  }
})();
