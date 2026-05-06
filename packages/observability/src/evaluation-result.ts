export interface EvaluationResult {
  id: string;
  targetType: "agent" | "skill" | "tool" | "workflow";
  targetId: string;
  metric: string;
  score?: number;
  outcome: "pass" | "fail" | "needs_review";
  evaluatedAt: string;
}

// TODO: Add evaluator metadata and evidence links.
