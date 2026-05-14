# Backlog

The backlog is organized around the build order for a scalable open-source harness.

AgentHarness starts as a specification release and grows toward runtime enforcement, observability,
demo experiences, approval operations, and controlled agent collaboration. Future-state ideas should
be captured here before the website presents them as available capabilities.

## Build Order

1. Foundation and public specification
2. Schema release and example journey validation
3. Local runtime preview
4. Policy and workflow execution
5. Observability and evaluation
6. Demo experiences and admin surfaces
7. Runtime-connected dashboard
8. Human approval operations
9. Agent directory and controlled delegation

The project should avoid heavy dependencies until the specification has enough shape to justify runtime choices.

## Current Release Boundary

`v0.1 - Spec Release` includes public docs, schemas, fictional examples, package boundaries, backlog,
and lightweight validation.

`v0.1` does not include a production runtime, CLI scaffolding product, Docker or Helm deployment,
live tool calls, production policy execution, or agent-to-agent delegation.

Track alpha readiness in the [v0.1.0-alpha readiness checklist](v0.1-readiness.md).
Track local runtime preview readiness in the [v0.2 readiness checklist](v0.2-readiness.md).

## Future-State Backlog Areas

- [Control plane dashboard](control-plane-dashboard.md)
- [Website alignment](website-alignment.md)
- [Runtime CLI, packaging, and deployment](runtime-cli-packaging-deployment.md)
- [Agent directory and controlled delegation](agent-directory-and-delegation.md)

## Release Phase Backlogs

- [v0.1 Spec Release](phase-1-spec-release.md)
- [v0.2 Local Runtime Preview](phase-2-local-runtime.md)
- [v0.3 Policy and Workflow](phase-3-policy-and-workflow.md)
- [v0.4 Observability and Evaluation](phase-4-observability.md)
- [v0.5 Demo Experiences](phase-5-demo-experiences.md)
- [v0.6 Runtime-Connected Dashboard](phase-6-runtime-connected-dashboard.md)
- [v0.7 Human Approval Operations](phase-7-human-approval-operations.md)
- [v0.8 Agent Directory and Controlled Delegation](phase-8-agent-directory-and-delegation.md)

## Issue Readiness

Each backlog item should be small enough for Codex or a contributor to work on. Good issues include:

- A clear user story
- Acceptance criteria
- Suggested labels
- Suggested release milestone
- Suggested priority

## Public vs Private

Keep public backlog items reusable and organisation-neutral. Private tools should hold internal
approval thresholds, sensitive architecture, real system names, legal interpretations, operational
contacts, and customer-specific examples.
