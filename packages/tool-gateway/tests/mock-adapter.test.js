/**
 * mock-adapter.test.js
 *
 * Unit tests for packages/tool-gateway/src/adapters/mock-adapter.js
 * Verifies deterministic fixture responses for all four telco tools.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot  = path.resolve(__dirname, "../../..");
const moduleUrl = (...segments) => pathToFileURL(path.join(repoRoot, ...segments)).href;

const { callMockTool } = await import(moduleUrl("packages/tool-gateway/src/adapters/mock-adapter.js"));

/** Helper: build a minimal ToolCallRequest */
function req(toolId, input = {}) {
  return {
    tool:    { id: toolId, version: "0.1.0", name: toolId, status: "active", adapter: "mock", riskLevel: "low", systemId: "test" },
    input,
    traceId: "trace-test-001",
  };
}

// ── customer.read_limited_profile ─────────────────────────────────────────────

describe("customer.read_limited_profile", () => {
  test("returns a result with toolId set", async () => {
    const result = await callMockTool(req("customer.read_limited_profile"));
    assert.equal(result.toolId, "customer.read_limited_profile");
  });

  test("output contains expected fields", async () => {
    const { output } = await callMockTool(req("customer.read_limited_profile"));
    assert.ok(output.customer_reference, "customer_reference missing");
    assert.ok(output.full_name,          "full_name missing");
    assert.ok(output.current_plan_id,    "current_plan_id missing");
    assert.ok(output.account_status,     "account_status missing");
  });

  test("uses customer_reference from input when provided", async () => {
    const { output } = await callMockTool(req("customer.read_limited_profile", { customer_reference: "CUST-XYZ" }));
    assert.equal(output.customer_reference, "CUST-XYZ");
  });

  test("falls back to default customer_reference when not provided", async () => {
    const { output } = await callMockTool(req("customer.read_limited_profile", {}));
    assert.equal(output.customer_reference, "CUST-DEMO-0001");
  });

  test("completedAt is a valid ISO timestamp", async () => {
    const result = await callMockTool(req("customer.read_limited_profile"));
    assert.ok(!isNaN(Date.parse(result.completedAt)), "completedAt should be ISO date");
  });
});

// ── eligibility.check_plan_change ─────────────────────────────────────────────

describe("eligibility.check_plan_change", () => {
  test("returns eligibility_status: eligible", async () => {
    const { output } = await callMockTool(req("eligibility.check_plan_change"));
    assert.equal(output.eligibility_status, "eligible");
  });

  test("echoes requested_plan_id from input", async () => {
    const { output } = await callMockTool(req("eligibility.check_plan_change", {
      requested_plan_id: "PLAN-VALUE-003",
    }));
    assert.equal(output.requested_plan_id, "PLAN-VALUE-003");
  });

  test("includes an eligibility_reason string", async () => {
    const { output } = await callMockTool(req("eligibility.check_plan_change"));
    assert.equal(typeof output.eligibility_reason, "string");
    assert.ok(output.eligibility_reason.length > 0);
  });
});

// ── billing.calculate_price_delta ─────────────────────────────────────────────

describe("billing.calculate_price_delta", () => {
  test("returns expected $20 delta for BASIC-001 → PREMIUM-002", async () => {
    const { output } = await callMockTool(req("billing.calculate_price_delta", {
      current_plan_id:   "PLAN-BASIC-001",
      requested_plan_id: "PLAN-PREMIUM-002",
    }));
    assert.equal(output.monthly_price_delta, 20);
    assert.equal(output.currency, "AUD");
  });

  test("returns negative delta for downgrade", async () => {
    const { output } = await callMockTool(req("billing.calculate_price_delta", {
      current_plan_id:   "PLAN-PREMIUM-002",
      requested_plan_id: "PLAN-VALUE-003",
    }));
    assert.ok(output.monthly_price_delta < 0, "downgrade should have negative delta");
  });

  test("price_delta_summary is a non-empty string", async () => {
    const { output } = await callMockTool(req("billing.calculate_price_delta"));
    assert.equal(typeof output.price_delta_summary, "string");
    assert.ok(output.price_delta_summary.length > 0);
  });

  test("effective_date is a date string (YYYY-MM-DD)", async () => {
    const { output } = await callMockTool(req("billing.calculate_price_delta"));
    assert.match(String(output.effective_date), /^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── order.prepare_plan_change_request ─────────────────────────────────────────

describe("order.prepare_plan_change_request", () => {
  test("returns prepared_request_id starting with REQ-", async () => {
    const { output } = await callMockTool(req("order.prepare_plan_change_request"));
    assert.match(String(output.prepared_request_id), /^REQ-\d+$/);
  });

  test("prepared_request_status is prepared", async () => {
    const { output } = await callMockTool(req("order.prepare_plan_change_request"));
    assert.equal(output.prepared_request_status, "prepared");
  });

  test("echoes customer_reference and requested_plan_id from input", async () => {
    const { output } = await callMockTool(req("order.prepare_plan_change_request", {
      customer_reference: "CUST-99",
      requested_plan_id:  "PLAN-PREMIUM-002",
    }));
    assert.equal(output.customer_reference, "CUST-99");
    assert.equal(output.requested_plan_id,  "PLAN-PREMIUM-002");
  });
});

// ── Unknown tool fallback ─────────────────────────────────────────────────────

describe("unknown tool", () => {
  test("returns _note field explaining missing fixture", async () => {
    const { output } = await callMockTool(req("some.unknown.tool"));
    assert.ok(typeof output._note === "string", "_note field should be present");
    assert.ok(output._note.includes("some.unknown.tool"), "_note should name the tool");
  });

  test("toolId matches the requested tool", async () => {
    const result = await callMockTool(req("some.unknown.tool"));
    assert.equal(result.toolId, "some.unknown.tool");
  });
});
