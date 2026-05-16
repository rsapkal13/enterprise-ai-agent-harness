import type { PolicyDefinition } from "../../core/src";
import type { PolicyDecision } from "./policy-decision";

export interface PolicyEvaluationRequest {
  agentId: string;
  skillId: string;
  toolId?: string;
  workflowId?: string;
  contextScopeId?: string;
  context: Record<string, unknown>;
}

export interface PolicyEngine {
  evaluate(
    policy: PolicyDefinition,
    request: PolicyEvaluationRequest,
  ): Promise<PolicyDecision>;
}

type RuleCondition = {
  subject?: {
    agent_id?: string;
    skill_id?: string;
  };
  resource?: {
    tool_id?: string;
    skill_id?: string;
    workflow_id?: string;
    tools?: string[];
    workflows?: string[];
    context_scopes?: string[];
  };
  context?: Record<string, unknown>;
};

type PolicyRule = {
  id?: string;
  description?: string;
  condition?: RuleCondition | null;
  decision?: PolicyDecision["outcome"];
  obligations?: Array<string | { type?: string }>;
};

export class RuleBasedPolicyEvaluator implements PolicyEngine {
  async evaluate(
    policy: PolicyDefinition,
    request: PolicyEvaluationRequest,
  ): Promise<PolicyDecision> {
    const evaluatedAt = new Date().toISOString();
    const status = policy.status ?? "active";

    if (status !== "active") {
      return this.decision(policy.id, "deny", evaluatedAt, {
        reason: `Policy ${policy.id} is not active (status: ${status})`,
        obligations: [],
      });
    }

    for (const rule of (policy._rules ?? []) as PolicyRule[]) {
      if (this.matchesCondition(rule.condition, request)) {
        return this.decision(
          policy.id,
          this.normalizeOutcome(rule.decision),
          evaluatedAt,
          {
            reason: `[${rule.id}] ${rule.description ?? "matched"}`,
            obligations: extractObligationTypes(rule.obligations),
          },
        );
      }
    }

    const applicableTiers = policy._applicableRiskTiers ?? [];
    if (applicableTiers.length > 0) {
      const requestTier = String(request.context?.risk_tier ?? "T1");
      if (!applicableTiers.includes(requestTier)) {
        return this.decision(policy.id, "deny", evaluatedAt, {
          reason: `Risk tier "${requestTier}" not in applicable tiers [${applicableTiers.join(", ")}]`,
          obligations: [],
        });
      }
    }

    const defaultOutcome = this.normalizeOutcome(policy.decisionType ?? "deny");
    return this.decision(policy.id, defaultOutcome, evaluatedAt, {
      reason: `Default decision applied (${defaultOutcome})`,
      obligations: [],
    });
  }

  private decision(
    policyId: string,
    outcome: PolicyDecision["outcome"],
    evaluatedAt: string,
    details: { reason: string; obligations: string[] },
  ): PolicyDecision {
    return { policyId, outcome, reason: details.reason, obligations: details.obligations, evaluatedAt };
  }

  private matchesCondition(
    condition: RuleCondition | null | undefined,
    request: PolicyEvaluationRequest,
  ): boolean {
    if (!condition) return true;

    const subject = condition.subject;
    if (subject) {
      if (subject.agent_id !== undefined && subject.agent_id !== request.agentId) return false;
      if (subject.skill_id !== undefined && subject.skill_id !== request.skillId) return false;
    }

    const resource = condition.resource;
    if (resource) {
      if (resource.tool_id !== undefined && resource.tool_id !== request.toolId) return false;
      if (resource.skill_id !== undefined && resource.skill_id !== request.skillId) return false;
      if (resource.workflow_id !== undefined && resource.workflow_id !== request.workflowId) return false;
      if (Array.isArray(resource.tools) && !resource.tools.includes(request.toolId ?? "")) return false;
      if (Array.isArray(resource.workflows) && !resource.workflows.includes(request.workflowId ?? "")) return false;
      if (Array.isArray(resource.context_scopes) && !resource.context_scopes.includes(request.contextScopeId ?? "")) return false;
    }

    if (condition.context) {
      for (const [key, expected] of Object.entries(condition.context)) {
        const actual = request.context?.[key];
        if (Array.isArray(expected)) {
          if (!expected.includes(actual)) return false;
        } else if (actual !== expected) {
          return false;
        }
      }
    }

    return true;
  }

  private normalizeOutcome(raw: unknown): PolicyDecision["outcome"] {
    return (
      raw === "allow" ||
      raw === "deny" ||
      raw === "require_approval" ||
      raw === "require_consent"
    ) ? raw : "deny";
  }
}

function extractObligationTypes(obligations: PolicyRule["obligations"]): string[] {
  if (!Array.isArray(obligations)) return [];
  return obligations.map((obligation) =>
    typeof obligation === "string" ? obligation : (obligation.type ?? String(obligation)),
  );
}

export function createPolicyEvaluator(): RuleBasedPolicyEvaluator {
  return new RuleBasedPolicyEvaluator();
}
