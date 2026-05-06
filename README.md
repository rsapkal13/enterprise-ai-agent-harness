# Enterprise AI Agent Harness

Enterprise AI Agent Harness is an open-source specification and execution-harness project for defining, registering, governing, executing, observing, and improving AI capabilities across enterprise ecosystems.

It is not another multi-agent framework. The project focuses on the enterprise control layer around AI systems: capability registration, policy decisions, workflow boundaries, context access, auditability, and evaluation.

## Core Model

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

Agents should not call raw enterprise systems directly. They should execute registered skills through governed tools, policy checks, workflow orchestration, enterprise context, and auditable traces.

## v0.1 Spec Release Target

The first release is a public specification foundation:

- Public README and contribution documents
- Vision and architecture documentation
- Initial folder structure
- JSON schema placeholders for agents, skills, policies, tools, workflows, systems, context scopes, audit events, evaluations, and UI manifests
- One fictional telco customer-care journey
- Initial backlog, epics, and milestones

Runtime implementation is intentionally out of scope for v0.1. The TypeScript files in `packages/` are placeholders that describe package boundaries and future contracts.

## Key Capabilities

- Skill Registry: reusable business capabilities with risk, ownership, tools, and evaluation metadata
- Tool Registry: governed wrappers around APIs, MCP tools, data access, queues, and workflow actions
- Agent Registry: agent identities, channels, allowed skills, and operating boundaries
- Policy Engine: authorization, consent, risk, privacy, human approval, and audit requirements
- Workflow Orchestration: durable multi-step journeys with state, rollback, and approvals
- System Registry: enterprise system boundaries, ownership, trust level, and data classification
- Enterprise Context Layer: controlled access to business, user, session, and system context
- Experience/UI Manifest Registry: structured UI requirements for agent-led journeys
- Observability and Evaluation: traces, audit logs, policy outcomes, and improvement feedback loops

## Repository Layout

```text
docs/       Public documentation and specification narrative
packages/   Future TypeScript package boundaries
schemas/    Draft JSON Schemas for registry objects
examples/   Fictional reusable enterprise journeys
apps/       Placeholder app surfaces for future releases
backlog/    Epics, milestones, and phased build order
```

## Example Journey

The first sample journey is a generic telco customer-care plan-change flow. It includes a fictional agent, skills, tools, policies, workflow, system records, context scopes, audit events, evaluation records, and UI manifest. It is deliberately organisation-neutral and contains no real customer data, private APIs, or credentials.

Start with [examples/telco-customer-care/README.md](examples/telco-customer-care/README.md).

## What This Is Not

Enterprise AI Agent Harness does not replace model providers, agent SDKs, orchestration libraries, workflow engines, or MCP servers. It defines the governance and execution envelope that lets those technologies operate inside controlled business journeys.

## Project Status

Early foundation. The repository is being prepared for `v0.1 - Spec Release`.

See [ROADMAP.md](ROADMAP.md) and [backlog/README.md](backlog/README.md) for the build order.

## License

MIT License. See [LICENSE](LICENSE).
