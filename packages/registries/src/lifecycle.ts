/**
 * Object lifecycle states for registry-managed objects.
 * Applies to agents, skills, tools, policies, and workflows.
 *
 * draft      → proposed, not yet approved for execution
 * active     → approved and available for use in journeys
 * deprecated → still executable but should not be used for new journeys
 * retired    → unavailable for execution
 */
export type LifecycleState = "draft" | "active" | "deprecated" | "retired";

export interface LifecycleMetadata {
  state: LifecycleState;
  createdAt: string;
  updatedAt: string;
  /** Who approved the transition to 'active'. */
  approvedBy?: string;
  /** Reason for deprecation or retirement. */
  stateReason?: string;
}

export function initialLifecycle(): LifecycleMetadata {
  const now = new Date().toISOString();
  return { state: "draft", createdAt: now, updatedAt: now };
}

export function transitionLifecycle(
  meta: LifecycleMetadata,
  to: LifecycleState,
  opts?: { approvedBy?: string; reason?: string },
): LifecycleMetadata {
  const validTransitions: Record<LifecycleState, LifecycleState[]> = {
    draft: ["active"],
    active: ["deprecated", "retired"],
    deprecated: ["retired"],
    retired: [],
  };

  if (!validTransitions[meta.state].includes(to)) {
    throw new Error(
      `Invalid lifecycle transition: ${meta.state} → ${to}`,
    );
  }

  return {
    ...meta,
    state: to,
    updatedAt: new Date().toISOString(),
    approvedBy: opts?.approvedBy ?? meta.approvedBy,
    stateReason: opts?.reason ?? meta.stateReason,
  };
}
