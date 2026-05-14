import type { PolicyEngine, PolicyEvaluationRequest } from "../../../packages/policy-engine/src/policy-engine";
import type { PolicyDefinition } from "../../../packages/core/src";
import type { PolicyDecision } from "../../../packages/policy-engine/src/policy-decision";

/**
 * Mock PolicyEngine for the Banking Card Dispute example.
 *
 * Implements a simple allow-all policy with two exceptions:
 * - initiate_provisional_credit requires approval if riskScore >= 0.85 (very high risk)
 * - Any tool called with a blocked customerId is denied
 */
export class DisputeMockPolicyEngine implements PolicyEngine {
  async evaluate(
    _policy: PolicyDefinition,
    request: PolicyEvaluationRequest,
  ): Promise<PolicyDecision> {
    const now = new Date().toISOString();
    const context = request.context as Record<string, unknown>;

    // Deny blocked customers
    if (context["customerId"] === "CUST-BLOCKED") {
      return {
        policyId: _policy.id ?? "banking-dispute-policy",
        outcome: "deny",
        reason: "Customer account is flagged and blocked from dispute resolution.",
        obligations: [],
        evaluatedAt: now,
      };
    }

    // Require additional approval for very high-risk credit issuance
    if (
      request.toolId === "initiate_provisional_credit" &&
      typeof context["riskScore"] === "number" &&
      context["riskScore"] >= 0.85
    ) {
      return {
        policyId: _policy.id ?? "banking-dispute-policy",
        outcome: "require_approval",
        reason: "Risk score exceeds 0.85 — provisional credit requires senior approval.",
        obligations: ["log_high_risk_credit_event"],
        evaluatedAt: now,
      };
    }

    // Default: allow
    return {
      policyId: _policy.id ?? "banking-dispute-policy",
      outcome: "allow",
      reason: "Request satisfies all policy rules.",
      obligations: [],
      evaluatedAt: now,
    };
  }
}
