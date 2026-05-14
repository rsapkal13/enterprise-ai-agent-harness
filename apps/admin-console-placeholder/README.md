# Admin Console (Control Plane Dashboard)

Operator-facing console for inspecting registries, policy decisions, journey execution,
audit trails, approval queues, certification status, and evaluation outcomes.

## v0.2 Prototype

The first read-only dashboard prototype is available at:

```text
apps/admin-console-placeholder/admin-dashboard.html
```

Open it directly in a browser or serve the repository root locally:

```bash
python -m http.server 8765
```

Then open:

```text
http://127.0.0.1:8765/apps/admin-console-placeholder/admin-dashboard.html
```

The prototype uses fictional local sample data only. It does not call production
systems, perform writes, or require new dependencies.

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

Read-only static prototype started for v0.2 to align with the local runtime preview.
The original phased plan still applies for deeper schema-driven loading, runtime
connection, evaluation trends, and write-enabled approval actions.
