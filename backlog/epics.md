# Epics

## Epic 1: Specification Foundation

Define the public vocabulary, architecture, schemas, examples, and contributor structure.

## Epic 2: Registry Contracts

Create stable contracts for skills, tools, agents, policies, workflows, systems, context scopes, UI manifests, audit events, and evaluations.

## Epic 3: Local Runtime Preview

Add a local in-memory runtime that can load, validate, and simulate example journeys.

## Epic 4: Governance Execution

Implement policy evaluation, approvals, consent checks, and audit obligations.

## Epic 5: Workflow and Tool Gateway

Coordinate multi-step journeys and execute mock, REST, MCP, workflow, and data adapters.

## Epic 6: Observability and Evaluation

Capture traces, audit logs, evaluation results, and improvement signals.

## Epic 7: Demo Experiences

Build a documentation website, admin console prototype, and demo runner.

## Epic 8: Control Plane Dashboard

Build the operator-facing console for inspecting registries, policy decisions, journey execution,
audit trails, and evaluation outcomes. Phases A–B are static (local files). Phases C–D connect to
the local runtime. Phase E adds the human-in-the-loop approval queue.

See [`backlog/control-plane-dashboard.md`](control-plane-dashboard.md) for the full story backlog
and [`docs/architecture/control-plane-dashboard.md`](../docs/architecture/control-plane-dashboard.md)
for the design rationale.
