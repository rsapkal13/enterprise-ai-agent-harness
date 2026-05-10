/**
 * mock-adapter.ts
 *
 * Deterministic mock tool adapter for the telco customer-care demo journey.
 *
 * Each fictional tool returns a realistic but fully synthetic fixture response
 * so that `npm run demo:telco` can run end-to-end without any real systems.
 *
 * Supported tool IDs (matching telco-customer-care example manifests):
 *   customer.read_limited_profile       — read-only CRM profile stub
 *   eligibility.check_plan_change       — eligibility gate (always eligible)
 *   billing.calculate_price_delta       — before/after price comparison stub
 *   order.prepare_plan_change_request   — order stub (always succeeds)
 *
 * Any other tool ID returns a generic empty-output fixture so that new tools
 * added to future examples don't cause hard failures during local demos.
 *
 * Part of: v0.2 local runtime — Issue #56
 */

import type { ToolCallRequest, ToolCallResult } from "../tool-gateway.js";

// ── Fixture definitions ───────────────────────────────────────────────────────

/**
 * customer.read_limited_profile
 *
 * Returns a minimal customer record sufficient for the plan-change journey.
 */
function fixtureReadLimitedProfile(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const customerRef =
    (input["customer_reference"] as string) ?? "CUST-DEMO-0001";
  return {
    customer_reference: customerRef,
    full_name: "Alex Fictional",
    account_status: "active",
    current_plan_id: "PLAN-BASIC-001",
    data_classification: "confidential",
    contact_preferences: {
      preferred_channel: "contact-center",
      consent_on_file: true,
    },
  };
}

/**
 * eligibility.check_plan_change
 *
 * Always returns eligible for demo purposes. A future fixture variant could
 * return `ineligible` to exercise the stop-path through the workflow.
 */
function fixtureCheckPlanChange(
  input: Record<string, unknown>,
): Record<string, unknown> {
  return {
    customer_reference:
      input["customer_reference"] ?? "CUST-DEMO-0001",
    requested_plan_id:
      input["requested_plan_id"] ?? "PLAN-PREMIUM-002",
    eligibility_status: "eligible",
    eligibility_reason:
      "Account is in good standing and the requested plan is available in the customer's region.",
    checked_at: new Date().toISOString(),
  };
}

/**
 * billing.calculate_price_delta
 *
 * Returns a synthetic monthly price comparison.
 * current: $29.99 / month (PLAN-BASIC-001)
 * requested: $49.99 / month (PLAN-PREMIUM-002)
 * delta: +$20.00
 */
function fixtureCalculatePriceDelta(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const currentPlan =
    (input["current_plan_id"] as string) ?? "PLAN-BASIC-001";
  const requestedPlan =
    (input["requested_plan_id"] as string) ?? "PLAN-PREMIUM-002";

  const prices: Record<string, number> = {
    "PLAN-BASIC-001":   29.99,
    "PLAN-PREMIUM-002": 49.99,
    "PLAN-VALUE-003":   19.99,
  };

  const currentPrice   = prices[currentPlan]   ?? 29.99;
  const requestedPrice = prices[requestedPlan] ?? 49.99;
  const delta          = requestedPrice - currentPrice;

  return {
    current_plan_id:   currentPlan,
    requested_plan_id: requestedPlan,
    current_monthly_price:   currentPrice,
    requested_monthly_price: requestedPrice,
    monthly_price_delta: parseFloat(delta.toFixed(2)),
    currency: "AUD",
    effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    price_delta_summary: `Plan change from ${currentPlan} to ${requestedPlan} will ${
      delta >= 0 ? "increase" : "decrease"
    } monthly cost by $${Math.abs(delta).toFixed(2)} AUD.`,
  };
}

/**
 * order.prepare_plan_change_request
 *
 * Generates a synthetic prepared-request record.
 * Status is always "prepared" — ready for downstream submission.
 */
function fixturePreparePlanChangeRequest(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const customerRef =
    (input["customer_reference"] as string) ?? "CUST-DEMO-0001";
  const requestedPlan =
    (input["requested_plan_id"] as string) ?? "PLAN-PREMIUM-002";
  const requestId = `REQ-${Date.now()}`;

  return {
    prepared_request_id: requestId,
    customer_reference: customerRef,
    requested_plan_id: requestedPlan,
    prepared_request_status: "prepared",
    prepared_at: new Date().toISOString(),
    expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    reference_note:
      "Fictional prepared request for demo purposes only. No real plan change occurs.",
    consent_statement_version:
      (input["consent_statement_version"] as string) ?? "v1.0",
    approval_reference:
      (input["approval_reference"] as string) ?? "APPROVAL-DEMO",
  };
}

// ── Fixture dispatch table ────────────────────────────────────────────────────

const FIXTURES: Record<
  string,
  (input: Record<string, unknown>) => Record<string, unknown>
> = {
  "customer.read_limited_profile":     fixtureReadLimitedProfile,
  "eligibility.check_plan_change":     fixtureCheckPlanChange,
  "billing.calculate_price_delta":     fixtureCalculatePriceDelta,
  "order.prepare_plan_change_request": fixturePreparePlanChangeRequest,
};

// ── Public adapter function ───────────────────────────────────────────────────

/**
 * Call a mock tool and return a deterministic fixture response.
 *
 * Falls back to an empty-output result for unknown tool IDs so that
 * new examples can run without requiring fixture additions.
 */
export async function callMockTool(
  request: ToolCallRequest,
): Promise<ToolCallResult> {
  const fixture = FIXTURES[request.tool.id];

  const output = fixture
    ? fixture(request.input)
    : {
        _note: `No fixture defined for tool "${request.tool.id}". Add one in mock-adapter.ts.`,
      };

  return {
    toolId: request.tool.id,
    output,
    completedAt: new Date().toISOString(),
  };
}
