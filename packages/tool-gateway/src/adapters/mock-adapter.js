/**
 * mock-adapter.js
 *
 * Deterministic mock tool adapter for the telco customer-care demo journey.
 * Each fictional tool returns a realistic synthetic fixture — no real systems called.
 *
 * Supported tool IDs (telco-customer-care example):
 *   customer.read_limited_profile
 *   eligibility.check_plan_change
 *   billing.calculate_price_delta
 *   order.prepare_plan_change_request
 *
 * Part of: v0.2 local runtime — Issue #56
 */

function fixtureReadLimitedProfile(input) {
  const customerRef = input["customer_reference"] ?? "CUST-DEMO-0001";
  return {
    customer_reference: customerRef,
    full_name: "Alex Fictional",
    account_status: "active",
    current_plan_id: "PLAN-BASIC-001",
    data_classification: "confidential",
    contact_preferences: { preferred_channel: "contact-center", consent_on_file: true },
  };
}

function fixtureCheckPlanChange(input) {
  return {
    customer_reference: input["customer_reference"] ?? "CUST-DEMO-0001",
    requested_plan_id:  input["requested_plan_id"]  ?? "PLAN-PREMIUM-002",
    eligibility_status: "eligible",
    eligibility_reason: "Account is in good standing and the requested plan is available in the customer's region.",
    checked_at: new Date().toISOString(),
  };
}

function fixtureCalculatePriceDelta(input) {
  const currentPlan   = input["current_plan_id"]   ?? "PLAN-BASIC-001";
  const requestedPlan = input["requested_plan_id"]  ?? "PLAN-PREMIUM-002";
  const prices = { "PLAN-BASIC-001": 29.99, "PLAN-PREMIUM-002": 49.99, "PLAN-VALUE-003": 19.99 };
  const currentPrice   = prices[currentPlan]   ?? 29.99;
  const requestedPrice = prices[requestedPlan] ?? 49.99;
  const delta = requestedPrice - currentPrice;
  return {
    current_plan_id:        currentPlan,
    requested_plan_id:      requestedPlan,
    current_monthly_price:  currentPrice,
    requested_monthly_price: requestedPrice,
    monthly_price_delta:    parseFloat(delta.toFixed(2)),
    currency: "AUD",
    effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    price_delta_summary: `Plan change from ${currentPlan} to ${requestedPlan} will ${
      delta >= 0 ? "increase" : "decrease"
    } monthly cost by $${Math.abs(delta).toFixed(2)} AUD.`,
  };
}

function fixturePreparePlanChangeRequest(input) {
  return {
    prepared_request_id:     `REQ-${Date.now()}`,
    customer_reference:      input["customer_reference"]       ?? "CUST-DEMO-0001",
    requested_plan_id:       input["requested_plan_id"]        ?? "PLAN-PREMIUM-002",
    prepared_request_status: "prepared",
    prepared_at:             new Date().toISOString(),
    expiry:                  new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    reference_note:          "Fictional prepared request for demo purposes only.",
    consent_statement_version: input["consent_statement_version"] ?? "v1.0",
    approval_reference:      input["approval_reference"]        ?? "APPROVAL-DEMO",
  };
}

const FIXTURES = {
  "customer.read_limited_profile":     fixtureReadLimitedProfile,
  "eligibility.check_plan_change":     fixtureCheckPlanChange,
  "billing.calculate_price_delta":     fixtureCalculatePriceDelta,
  "order.prepare_plan_change_request": fixturePreparePlanChangeRequest,
};

export async function callMockTool(request) {
  const fixture = FIXTURES[request.tool.id];
  const output = fixture
    ? fixture(request.input)
    : { _note: `No fixture defined for tool "${request.tool.id}". Add one in mock-adapter.js.` };
  return { toolId: request.tool.id, output, completedAt: new Date().toISOString() };
}
