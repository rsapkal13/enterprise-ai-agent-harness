# Admin Console (Control Plane Dashboard)

Operator-facing console for inspecting registries, policy decisions, journey execution,
audit trails, and evaluation outcomes.

## Design

See [`docs/architecture/control-plane-dashboard.md`](../../docs/architecture/control-plane-dashboard.md)
for surfaces, phases, and design principles.

## Backlog

See [`backlog/control-plane-dashboard.md`](../../backlog/control-plane-dashboard.md)
for the full story backlog organized by phase.

## Phases

| Phase | Milestone | Scope |
|-------|-----------|-------|
| A     | v0.5      | Static registry browser from local YAML/JSON |
| B     | v0.5      | Policy inspector and audit trail (static) |
| C     | v0.6      | Journey monitor connected to local runtime |
| D     | v0.6      | Evaluation console |
| E     | v0.7      | Approval queue with write model |

## Status

Placeholder. Implementation begins at v0.5 after the local runtime preview (v0.2) and
policy and workflow execution (v0.3) milestones are stable.
