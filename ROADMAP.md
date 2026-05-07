# Roadmap

AgentHarness is intentionally staged. The project starts as a public specification and grows toward
local validation, runtime enforcement, observability, demo experiences, and eventually richer
control-plane surfaces.

The current operating model remains:

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

## v0.1 - Spec Release

- Public documentation foundation
- Core architecture and concept pages
- Draft JSON schemas
- System, context, audit event, and evaluation schema placeholders
- Fictional telco customer-care journey
- Initial backlog and milestone structure
- Lightweight schema and example validation

Out of scope for v0.1:

- Production runtime
- CLI scaffolding as an available product
- Live tool calls or real system integrations
- Docker, Helm, or hosted deployment patterns
- Agent-to-agent delegation runtime

## v0.2 - Local Runtime Preview

- Local schema validation
- In-memory registries
- Basic policy decision contract
- Mock tool gateway
- Simple workflow state runner
- CLI scope proposal for manifest validation and local fixture loading

## v0.3 - Governance and Workflow

- Policy composition model
- Human approval checkpoints
- Workflow compensation patterns
- Audit event contract
- Approval review evidence model
- Rejection and returned-for-changes outcomes

## v0.4 - Observability and Evaluation

- Trace model
- Evaluation result model
- Local reporting examples
- Improvement loop guidance
- Trace-linked audit event examples
- Certification evidence guidance

## v0.5 - Demo Experiences

- Demo runner
- Admin console prototype
- UI manifest rendering examples
- Additional enterprise journeys
- Website alignment with the v0.1 specification and future-state roadmap

## v0.6 - Runtime-Connected Dashboard

- Journey monitor connected to the local runtime
- Evaluation console connected to local result fixtures
- Trace-linked audit event navigation
- Runtime package naming and publishing strategy

## v0.7 - Human Approval Operations

- Human-in-the-loop approval queue
- Approval write model via policy engine API
- Approval audit log
- Scope-change and recertification workflow design

## v0.8 - Agent Directory and Controlled Delegation

- Agent capability card proposal
- Allow-listed agent discovery
- Policy-gated handoff between agents
- Audit model for agent-to-agent delegation
- Governance guidance for agent mesh maturity

## Later Consideration

- Deployment model for local, self-hosted, and managed environments
- Authentication and role-based access for control-plane surfaces
- Multi-tenant control-plane design
- Production-grade adapters and enterprise integration packs
