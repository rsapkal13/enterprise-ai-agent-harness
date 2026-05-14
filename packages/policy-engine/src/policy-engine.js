/**
 * policy-engine.js
 *
 * Rule-based policy evaluator for the Enterprise AI Agent Harness.
 *
 * Evaluation order
 * ────────────────
 *   1. Inactive policies → deny immediately (lifecycle guard)
 *   2. Rules are evaluated in declaration order; first matching rule wins
 *   3. Risk-tier ceiling check (if applicable_risk_tiers populated)
 *   4. Fall back to the policy's default_decision / decisionType
 *
 * Condition matching (AND semantics across all fields)
 * ────────────────────────────────────────────────────
 *   subject.agent_id          agentId must equal value
 *   subject.skill_id          skillId must equal value
 *   resource.tool_id          toolId must equal value
 *   resource.tools            toolId must be included in array
 *   context.<key>             request.context[key] must equal value OR be
 *                             included in value (when value is an array)
 *
 * Extended policy fields (optional, populated by rich loader or tests)
 * ────────────────────────────────────────────────────────────────────
 *   _rules              — raw YAML rules array
 *   _applicableRiskTiers — applicable_risk_tiers string[]
 *
 * Part of: v0.2 local runtime — Issue #60 (Policy Engine)
 */

// ── Risk tier ordering ────────────────────────────────────────────────────────

const TIER_ORDER = { T1: 1, T2: 2, T3: 3, T4: 4 };

// ── RuleBasedPolicyEvaluator ──────────────────────────────────────────────────

export class RuleBasedPolicyEvaluator {
  /**
   * Evaluate a policy against an agent request.
   *
   * @param {object} policy  - PolicyDefinition (mapped from registry / loader)
   *                           May carry optional _rules and _applicableRiskTiers.
   * @param {object} request - PolicyEvaluationRequest
   *   { agentId, skillId, toolId?, context }
   * @returns {Promise<PolicyDecision>}
   */
  async evaluate(policy, request) {
    const evaluatedAt = new Date().toISOString();

    // ── 1. Lifecycle guard ───────────────────────────────────────────────────
    const status = policy.status ?? "active";
    if (status !== "active") {
      return this.#decision(policy.id, "deny", evaluatedAt, {
        reason: `Policy ${policy.id} is not active (status: ${status})`,
        obligations: [],
      });
    }

    // ── 2. Rule evaluation ───────────────────────────────────────────────────
    const rules = policy._rules ?? [];
    for (const rule of rules) {
      if (this.#matchesCondition(rule.condition, request)) {
        return this.#decision(policy.id, this.#normalizeOutcome(rule.decision), evaluatedAt, {
          reason: `[${rule.id}] ${rule.description ?? "matched"}`,
          obligations: extractObligationTypes(rule.obligations),
        });
      }
    }

    // ── 3. Risk-tier ceiling ─────────────────────────────────────────────────
    const applicableTiers = policy._applicableRiskTiers ?? [];
    if (applicableTiers.length > 0) {
      const requestTier = String(request.context?.risk_tier ?? "T1");
      if (!applicableTiers.includes(requestTier)) {
        return this.#decision(policy.id, "deny", evaluatedAt, {
          reason: `Risk tier "${requestTier}" not in applicable tiers [${applicableTiers.join(", ")}]`,
          obligations: [],
        });
      }
    }

    // ── 4. Default decision ──────────────────────────────────────────────────
    const defaultOutcome = this.#normalizeOutcome(policy.decisionType ?? "deny");
    return this.#decision(policy.id, defaultOutcome, evaluatedAt, {
      reason: `Default decision applied (${defaultOutcome})`,
      obligations: [],
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  #decision(policyId, outcome, evaluatedAt, { reason, obligations }) {
    return { policyId, outcome, reason, obligations, evaluatedAt };
  }

  /**
   * Match request against a rule condition using AND semantics.
   * Any undefined/null condition field is treated as "match all".
   */
  #matchesCondition(condition, request) {
    if (!condition) return true;

    // subject
    const sub = condition.subject;
    if (sub) {
      if (sub.agent_id !== undefined && sub.agent_id !== request.agentId) return false;
      if (sub.skill_id !== undefined && sub.skill_id !== request.skillId) return false;
    }

    // resource
    const res = condition.resource;
    if (res) {
      if (res.tool_id !== undefined && res.tool_id !== request.toolId) return false;
      if (Array.isArray(res.tools) && !res.tools.includes(request.toolId)) return false;
    }

    // context — flat key/value with array‐include support
    if (condition.context) {
      for (const [key, expected] of Object.entries(condition.context)) {
        const actual = request.context?.[key];
        if (Array.isArray(expected)) {
          if (!expected.includes(actual)) return false;
        } else {
          if (actual !== expected) return false;
        }
      }
    }

    return true;
  }

  /**
   * Normalise a YAML decision string → PolicyDecisionOutcome.
   */
  #normalizeOutcome(raw) {
    const valid = new Set(["allow", "deny", "require_approval", "require_consent"]);
    return valid.has(raw) ? raw : "deny";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extract obligation type strings from a rule's obligations array.
 * Each obligation may be a string or an object with a `type` field.
 */
function extractObligationTypes(obligations) {
  if (!Array.isArray(obligations)) return [];
  return obligations.map((o) => (typeof o === "string" ? o : (o?.type ?? String(o))));
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a new RuleBasedPolicyEvaluator instance.
 */
export function createPolicyEvaluator() {
  return new RuleBasedPolicyEvaluator();
}
