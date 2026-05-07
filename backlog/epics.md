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

## Epic 9: Website Alignment

Keep the public website aligned with the repository's current release state and future roadmap.

The website may describe the long-term control-plane vision, but it must clearly separate:

- Available in `v0.1`
- Planned for local runtime releases
- Planned for dashboard and approval operations
- Future-state ideas that are not yet committed runtime capabilities

See [`backlog/website-alignment.md`](website-alignment.md).

## Epic 10: Runtime CLI, Packaging, and Deployment Strategy

Define the future developer experience for validation, manifest scaffolding, local runtime preview,
package publishing, and deployment guidance.

This epic captures website ideas such as CLI commands, package names, Docker, and Helm as future
work rather than current product capability.

See [`backlog/runtime-cli-packaging-deployment.md`](runtime-cli-packaging-deployment.md).

## Epic 11: Agent Directory and Controlled Delegation

Define the future agent directory and controlled handoff model.

This is the repo home for future-state ideas such as capability cards, allow-listed discovery,
policy-gated delegation, and audited agent-to-agent collaboration. It is not part of `v0.1`.

See [`backlog/agent-directory-and-delegation.md`](agent-directory-and-delegation.md).
