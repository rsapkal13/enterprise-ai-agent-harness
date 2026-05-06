export type PolicyDecisionOutcome =
  | "allow"
  | "deny"
  | "require_approval"
  | "require_consent";

export interface PolicyDecision {
  policyId: string;
  outcome: PolicyDecisionOutcome;
  reason: string;
  obligations: string[];
  evaluatedAt: string;
}

// TODO: Add evidence references and trace correlation fields.
