# Milestones

## v0.1 - Spec Release

- Repository foundation
- Public docs and draft schemas
- Telco customer-care sample journey
- System, context, audit, evaluation, and UI manifest object coverage
- Architecture and governance documentation
- Cross-reference validation tooling

Status: tagged as `v0.1.0-alpha`.

## v0.2 - Local Runtime Preview

- YAML manifest loader
- In-memory registries
- Mock tool gateway
- Basic policy decision contract
- In-memory workflow state runner
- Trace emitter and in-memory audit sink
- Banking card-dispute fictional journey
- Admin console prototype for registry, approval, evidence, and relationship graph review

Status: not ready to tag until the latest `Validate` workflow is green and `npm test` reliably
executes package tests. See [v0.2 readiness](v0.2-readiness.md).

## v0.3 - Policy and Workflow

- Policy evaluation request contract
- Structured policy decision object
- Workflow approval pause and resume
- Compensation stack
- Retry and timeout model
- Audit obligations connected to policy and workflow steps

See [Phase 3: Policy and Workflow](phase-3-policy-and-workflow.md).

## v0.4 - Observability and Evaluation

- Trace event contract
- In-memory trace emitter
- Audit writer interface
- Evaluation result coverage model
- Local evidence report
- Trace-linked audit event examples

See [Phase 4: Observability and Evaluation](phase-4-observability.md).

## v0.5 - Demo Experiences

- Demo runner journey selector
- Approval-required walkthrough
- Rejected-action walkthrough
- Admin console static registry browser expansion
- UI manifest rendering example
- Website alignment with current scope and future roadmap

See [Phase 5: Demo Experiences](phase-5-demo-experiences.md).

## v0.6 - Runtime-Connected Dashboard

- Runtime status contract
- Journey monitor view
- Evaluation console
- Trace-linked audit events
- Runtime package naming and publishing strategy
- CLI scope for validation and local fixture workflows

See [Phase 6: Runtime-Connected Dashboard](phase-6-runtime-connected-dashboard.md).

## v0.7 - Human Approval Operations

- Approval request object
- Approval decision API
- Approval audit log view
- Scope-change and recertification flow
- Reviewer role and decision evidence model

See [Phase 7: Human Approval Operations](phase-7-human-approval-operations.md).

## v0.8 - Agent Directory and Controlled Delegation

- Agent capability card schema
- Allow-listed discovery model
- Policy-gated handoff
- Delegation audit event
- Maturity guidance for controlled agent collaboration

See [Phase 8: Agent Directory and Controlled Delegation](phase-8-agent-directory-and-delegation.md).

## Post-v0.8 - Deployment and Managed Operations

- Self-hosted deployment guidance
- Managed control-plane considerations
- Authentication and role-based access model
- Multi-tenant operating model
