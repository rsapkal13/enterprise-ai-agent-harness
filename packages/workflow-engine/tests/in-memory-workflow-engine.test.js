/**
 * in-memory-workflow-engine.test.js
 *
 * Unit tests for packages/workflow-engine/src/in-memory-workflow-engine.js
 * Tests step execution, approval pause/resume, and the full telco journey.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot  = path.resolve(__dirname, "../../..");
const moduleUrl = (...segments) => pathToFileURL(path.join(repoRoot, ...segments)).href;

const { InMemoryWorkflowEngine } = await import(moduleUrl("packages/workflow-engine/src/in-memory-workflow-engine.js"));
const { callMockTool } = await import(moduleUrl("packages/tool-gateway/src/adapters/mock-adapter.js"));
const { loadExampleManifests } = await import(moduleUrl("packages/core/src/loader.js"));
const { buildRegistries } = await import(moduleUrl("packages/registries/src/in-memory-registry.js"));

// ── Shared fixtures ───────────────────────────────────────────────────────────

const exampleDir  = path.join(repoRoot, "examples/telco-customer-care");
const manifests   = await loadExampleManifests(exampleDir);
const registries  = buildRegistries(manifests);
const gateway     = { callTool: (req) => callMockTool(req) };

function makeEngine() {
  return new InMemoryWorkflowEngine({
    toolGateway:     gateway,
    toolRegistry:    registries.tools,
    policyRegistry:  registries.policies,
  });
}

/** Build a minimal single-tool workflow for focused tests. */
function singleToolWorkflow(toolRef, onSuccess = "complete") {
  return {
    id: "test.workflow",
    version: "0.1.0",
    name: "Test Workflow",
    status: "active",
    steps: ["step1", onSuccess],
    _rawSteps: [
      { id: "step1", type: "tool", tool_ref: toolRef, on_success: onSuccess, on_failure: "stop" },
      { id: "complete", type: "completion" },
    ],
  };
}

function singlePolicyWorkflow(policyRef) {
  return {
    id: "test.policy.workflow",
    version: "0.1.0",
    name: "Test Policy Workflow",
    status: "active",
    steps: ["step1", "complete"],
    _rawSteps: [
      { id: "step1", type: "policy", policy_ref: policyRef, on_success: "complete", on_failure: "stop" },
      { id: "complete", type: "completion" },
    ],
  };
}

function approvalWorkflow() {
  return {
    id: "test.approval.workflow",
    version: "0.1.0",
    name: "Test Approval Workflow",
    status: "active",
    steps: ["approve", "do_work", "complete"],
    _rawSteps: [
      {
        id: "approve", type: "approval",
        approval: { required: true, approver_role: "manager" },
        on_success: "do_work",
        on_failure: "stop",
      },
      { id: "do_work", type: "tool", tool_ref: "customer.read_limited_profile", on_success: "complete", on_failure: "stop" },
      { id: "complete", type: "completion" },
    ],
  };
}

// ── Basic engine behaviour ────────────────────────────────────────────────────

describe("InMemoryWorkflowEngine — basic", () => {
  test("start() returns a state with a runId", async () => {
    const engine = makeEngine();
    const state  = await engine.start({ workflow: singleToolWorkflow("customer.read_limited_profile"), input: {} });
    assert.ok(typeof state.runId === "string" && state.runId.length > 0, "runId should be a non-empty string");
  });

  test("empty workflow (_rawSteps=[]) completes immediately", async () => {
    const engine = makeEngine();
    const wf = { id: "empty", version: "1", name: "Empty", status: "active", steps: [], _rawSteps: [] };
    const state = await engine.start({ workflow: wf, input: {} });
    assert.equal(state.status, "completed");
    assert.equal(state.history.length, 0);
  });

  test("getState() retrieves run by runId", async () => {
    const engine = makeEngine();
    const state  = await engine.start({ workflow: singleToolWorkflow("customer.read_limited_profile"), input: {} });
    const found  = await engine.getState(state.runId);
    assert.ok(found, "getState should return the run");
    assert.equal(found.runId, state.runId);
  });

  test("getState() returns undefined for unknown runId", async () => {
    const engine = makeEngine();
    const found  = await engine.getState("nonexistent-id");
    assert.equal(found, undefined);
  });
});

// ── Tool steps ────────────────────────────────────────────────────────────────

describe("tool steps", () => {
  test("tool step completes and records output", async () => {
    const engine = makeEngine();
    const state  = await engine.start({
      workflow: singleToolWorkflow("billing.calculate_price_delta"),
      input:    { current_plan_id: "PLAN-BASIC-001", requested_plan_id: "PLAN-PREMIUM-002" },
    });
    assert.equal(state.status, "completed");
    const toolResult = state.stepOutputs["step1"];
    assert.ok(toolResult, "step1 output should be recorded");
    assert.equal(toolResult.monthly_price_delta, 20);
  });

  test("tool step failure (unknown tool) routes to on_failure", async () => {
    const engine = makeEngine();
    // "nonexistent.tool" not in registry → step fails → on_failure=stop → failed/completed
    const wf = {
      id: "fail-test", version: "1", name: "Fail", status: "active", steps: ["s1"],
      _rawSteps: [
        { id: "s1", type: "tool", tool_ref: "nonexistent.tool", on_success: "complete", on_failure: "stop" },
        { id: "complete", type: "completion" },
      ],
    };
    const state = await engine.start({ workflow: wf, input: {} });
    assert.equal(state.history[0].outcome, "failed");
  });

  test("workflow input is passed to tool as base input", async () => {
    const engine = makeEngine();
    const wf = singleToolWorkflow("customer.read_limited_profile");
    const state = await engine.start({ workflow: wf, input: { customer_reference: "CUST-TEST-007" } });
    // The tool fixture uses input.customer_reference
    const out = state.stepOutputs["step1"];
    assert.equal(out.customer_reference, "CUST-TEST-007");
  });
});

// ── Policy steps ──────────────────────────────────────────────────────────────

describe("policy steps", () => {
  test("known policy step completes in v0.2 demo mode", async () => {
    const engine = makeEngine();
    const state  = await engine.start({ workflow: singlePolicyWorkflow("customer_data.access"), input: {} });
    assert.equal(state.status, "completed");
    const policyResult = state.stepOutputs["step1"];
    assert.equal(policyResult.decision, "completed");
  });

  test("unknown policy step fails and routes to on_failure", async () => {
    const engine = makeEngine();
    const wf = {
      id: "policy-fail", version: "1", name: "Policy Fail", status: "active", steps: ["s1"],
      _rawSteps: [
        { id: "s1", type: "policy", policy_ref: "nonexistent.policy", on_success: "complete", on_failure: "stop" },
        { id: "complete", type: "completion" },
      ],
    };
    const state = await engine.start({ workflow: wf, input: {} });
    assert.equal(state.history[0].outcome, "failed");
  });
});

// ── Approval steps ────────────────────────────────────────────────────────────

describe("approval steps", () => {
  test("approval step pauses workflow", async () => {
    const engine = makeEngine();
    const state  = await engine.start({ workflow: approvalWorkflow(), input: {} });
    assert.equal(state.status, "waiting_for_approval");
    assert.equal(state.pendingApprovalStepId, "approve");
  });

  test("resume(approved=true) continues workflow to completion", async () => {
    const engine = makeEngine();
    let state    = await engine.start({ workflow: approvalWorkflow(), input: {} });
    assert.equal(state.status, "waiting_for_approval");

    state = await engine.resume(state.runId, true, { approved_by: "test" });
    assert.equal(state.status, "completed");
    assert.equal(state.history.find((h) => h.stepId === "approve").outcome, "completed");
  });

  test("resume(approved=false) stops workflow as failed", async () => {
    const engine = makeEngine();
    let state    = await engine.start({ workflow: approvalWorkflow(), input: {} });
    state = await engine.resume(state.runId, false);
    assert.equal(state.status, "failed");
  });

  test("resume() on non-paused run throws", async () => {
    const engine = makeEngine();
    const state  = await engine.start({ workflow: singleToolWorkflow("customer.read_limited_profile"), input: {} });
    assert.equal(state.status, "completed");
    await assert.rejects(
      () => engine.resume(state.runId, true),
      /not waiting for approval/i,
    );
  });

  test("resume() records evidence in stepOutputs", async () => {
    const engine   = makeEngine();
    let state      = await engine.start({ workflow: approvalWorkflow(), input: {} });
    const evidence = { consent_version: "v1.0", approved_by: "supervisor" };
    state          = await engine.resume(state.runId, true, evidence);
    const out      = state.stepOutputs["approve"];
    assert.equal(out.consent_version, "v1.0");
    assert.equal(out.approved_by,     "supervisor");
    assert.equal(out.approved,        true);
  });
});

// ── Full telco journey ────────────────────────────────────────────────────────

describe("full telco plan-change journey", () => {
  // Load and attach raw steps the same way the demo runner does
  const wf = manifests.workflows.find((w) => w.id === "customer.change_plan.workflow");
  // _rawSteps already attached by the loader (mapWorkflow stores them)

  test("journey runs all 9 steps to completion with auto-approval", async () => {
    const engine = makeEngine();
    let state = await engine.start({
      workflow: wf,
      input: { customer_reference: "CUST-TEST-001", requested_plan_id: "PLAN-PREMIUM-002" },
    });

    // Auto-approve any approval steps
    let safetyBreak = 0;
    while (state.status === "waiting_for_approval") {
      assert.ok(++safetyBreak < 5, "too many approval steps");
      state = await engine.resume(state.runId, true, {
        demo_auto_approved: true,
        consent_statement_version: "v1.0",
        approval_reference: "TEST-AUTO",
      });
    }

    assert.equal(state.status, "completed");
    assert.equal(state.history.length, 9, `expected 9 steps, got ${state.history.length}`);
  });

  test("profile output contains customer_reference", async () => {
    const engine = makeEngine();
    let state = await engine.start({
      workflow: wf,
      input: { customer_reference: "CUST-PROFILE-TEST", requested_plan_id: "PLAN-PREMIUM-002" },
    });
    while (state.status === "waiting_for_approval") {
      state = await engine.resume(state.runId, true, { consent_statement_version: "v1.0", approval_reference: "A" });
    }
    const profileOut = state.stepOutputs["read_limited_profile"];
    assert.ok(profileOut, "read_limited_profile output not found");
    assert.equal(profileOut.customer_reference, "CUST-PROFILE-TEST");
  });

  test("price delta is $20 for BASIC-001 → PREMIUM-002", async () => {
    const engine = makeEngine();
    let state = await engine.start({
      workflow: wf,
      input: { customer_reference: "CUST-PRICE-TEST", requested_plan_id: "PLAN-PREMIUM-002" },
    });
    while (state.status === "waiting_for_approval") {
      state = await engine.resume(state.runId, true, { consent_statement_version: "v1.0", approval_reference: "A" });
    }
    const deltaOut = state.stepOutputs["calculate_price_delta"];
    assert.ok(deltaOut, "calculate_price_delta output not found");
    assert.equal(deltaOut.monthly_price_delta, 20);
  });

  test("prepared_request_id is set in final output", async () => {
    const engine = makeEngine();
    let state = await engine.start({
      workflow: wf,
      input: { customer_reference: "CUST-ORDER-TEST", requested_plan_id: "PLAN-PREMIUM-002" },
    });
    while (state.status === "waiting_for_approval") {
      state = await engine.resume(state.runId, true, { consent_statement_version: "v1.0", approval_reference: "A" });
    }
    const orderOut = state.stepOutputs["prepare_change_request"];
    assert.ok(orderOut, "prepare_change_request output not found");
    assert.match(String(orderOut.prepared_request_id), /^REQ-\d+$/);
    assert.equal(orderOut.prepared_request_status, "prepared");
  });
});
