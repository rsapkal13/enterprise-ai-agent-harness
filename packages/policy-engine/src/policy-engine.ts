import type { PolicyDefinition } from "../../core/src";
import type { PolicyDecision } from "./policy-decision";

export interface PolicyEvaluationRequest {
  agentId: string;
  skillId: string;
  toolId?: string;
  context: Record<string, unknown>;
}

export interface PolicyEngine {
  evaluate(
    policy: PolicyDefinition,
    request: PolicyEvaluationRequest,
  ): Promise<PolicyDecision>;
}

// TODO: Implement a composable policy evaluator in a later runtime release.
