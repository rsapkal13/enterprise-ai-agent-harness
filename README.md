# Enterprise AI Agent Harness

![Validate](https://github.com/rsapkal13/enterprise-ai-agent-harness/actions/workflows/validate.yml/badge.svg)

AgentHarness is an open-source specification and execution-harness project for defining, registering, governing, executing, observing, and improving AI capabilities across enterprise ecosystems.

It is not another multi-agent framework. It is the enterprise control plane around AI agents: capability registration, policy decisions, workload identity, workflow boundaries, context access, auditability, evaluation, and lifecycle governance.

## Operating Model

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

Agents should not call raw enterprise systems directly. They should execute registered skills through governed tools, policy checks, scoped identity, workflow orchestration, controlled context, and auditable traces.

## One Control Plane. Two Surfaces.

### Surface 1: Business Control Plane Portal

A business-facing control plane for registering, approving, monitoring, certifying, and retiring AI capabilities.

This surface helps governance, architecture, risk, product, and operations teams understand what AI capabilities exist, who owns them, which systems they touch, what risk tier they carry, and whether they are approved for use.

### Surface 2: Open-Source Engineering Codebase

An open-source engineering codebase that makes governance decisions enforceable at runtime through schemas, SDKs, registries, policy, identity, tool gateways, workflows, evaluation, and observability.

This repository is the public foundation for that codebase.

## Core Capabilities

### 1. Agent Registry

The authoritative record for every agent. Defines ownership, purpose, risk tier, lifecycle state, approved skills, approved tools, channels, data classes, runbooks, and retirement status.

### 2. Skill Registry

Reusable business capabilities for agents. Defines what an agent can do, expected inputs and outputs, required context, policy constraints, tool bindings, and evaluation requirements.

### 3. Tool Gateway

Governed access to enterprise systems. Wraps APIs, MCP tools, data access, workflow actions, and system integrations with schema validation, policy checks, rate limits, and audit logging.

### 4. Identity and Policy

Deny-by-default runtime control. Binds each agent to a scoped workload identity and evaluates whether each action is allowed, denied, or requires approval.

### 5. Workflow Engine

Controlled multi-step execution. Coordinates journeys with state, approvals, retries, compensating actions, escalation paths, and customer-visible status.

### 6. Context Layer

Safe access to enterprise context. Controls what business, user, session, memory, system, and entitlement context an agent can use during execution.

### 7. UI Manifest Registry

Structured intent for agent-led screens. Declares the information, decisions, and actions a journey must surface to a human without coupling to a specific frontend framework. Manifests are registry objects — approved, versioned, and referenced by workflow steps.

### 8. Evaluation Service

Certification before production. Tests agent behaviour across scenarios, tool-use paths, policy boundaries, adversarial inputs, and regression cases before and after release.

### 9. Observability and Audit

Proof of what happened. Captures traces, audit events, policy decisions, tool calls, approvals, outputs, side effects, cost, latency, and drift signals.

## Risk Tiers

AgentHarness uses four risk tiers:

- `T0` - Informational
- `T1` - Bounded operational
- `T2` - Transactional
- `T3` - High impact

Governance scales with risk, not bureaucracy. Approval requirements, evaluation depth, identity controls, human oversight, and observability depend on the risk tier of the agent, skill, workflow, and system interaction.

## Approval Workflow

```text
Registration request
-> Intake gate
-> Risk tiering
-> Privacy / Security / Legal / Architecture review
-> Agent Review Board
-> T3 escalation where required
-> Pre-production certification
-> Registered and active
-> Continuous observability
```

Approval creates binding runtime constraints, not just permission. A registered capability should carry enforceable policy, identity, workflow, context, audit, and evaluation requirements.

## Agent Lifecycle

1. Intake
2. Register
3. Build
4. Certify
5. Operate
6. Retire

The lifecycle is designed to make AI capabilities reviewable before production, observable during operation, and retireable when they are no longer safe, useful, or supported.

## Current Release Focus

### v0.1 - Spec Release

The current release focuses on:

- Public documentation foundation
- Draft schemas
- Fictional enterprise journeys
- Backlog and milestones
- Contribution structure
- Package boundaries

Runtime implementation is intentionally out of scope for v0.1. The TypeScript files in `packages/` are placeholders that describe package boundaries and future contracts.

## Future Product Direction

The long-term product direction includes a business-facing control plane portal, local runtime
preview, human approval operations, runtime-connected dashboard views, package publishing strategy,
deployment guidance, and controlled agent directory/delegation.

These are roadmap items, not v0.1 runtime capabilities. Public website and documentation copy should
separate what exists in the current spec release from future-state capabilities.

## Repository Layout

```text
docs/       Public documentation and specification narrative
packages/   Future TypeScript package boundaries
schemas/    Draft JSON Schemas for registry objects
examples/   Fictional reusable enterprise journeys
apps/       Placeholder app surfaces for future releases
backlog/    Epics, milestones, and phased build order
```

## Getting Started

```bash
git clone https://github.com/rsapkal13/enterprise-ai-agent-harness.git
cd enterprise-ai-agent-harness
```

Start with:

- [docs/index.md](docs/index.md)
- [docs/vision.md](docs/vision.md)
- [docs/architecture/overview.md](docs/architecture/overview.md)
- [examples/telco-customer-care/README.md](examples/telco-customer-care/README.md)
- [backlog/README.md](backlog/README.md)

## Local Validation

The v0.1 repository includes lightweight validation for schemas and fictional example manifests.

```bash
npm install
npm run validate:schemas
npm run validate:examples
npm run validate
```

Validation checks that JSON Schemas under `schemas/` compile, YAML files under `examples/` parse, telco example manifests match their v0.1 schemas, and the telco customer-care sample has basic cross-reference integrity.

## Example Journey

The first sample journey is a generic telco customer-care plan-change flow. It includes a fictional agent, skills, tools, policies, workflow, system records, context scopes, audit events, evaluation records, and UI manifest.

The example is deliberately organisation-neutral and contains no real customer data, private APIs, credentials, or private architecture details.

## What This Is Not

Enterprise AI Agent Harness does not replace model providers, agent SDKs, orchestration libraries, workflow engines, integration platforms, or MCP servers.

It defines the governance and execution envelope that lets those technologies operate inside controlled business journeys.

## Contributing

Good first contribution areas:

- Docs
- Schemas
- Examples
- Backlog
- Validation tooling
- CI checks

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## Public vs Private

Public GitHub should contain reusable open-source patterns, schemas, examples, docs, backlog, and code.

Private tools such as Notion should hold organisation-specific strategy, internal approval thresholds, sensitive architecture notes, customer-specific examples, real system names, credentials, legal interpretations, and operational contacts.

## License

MIT License. See [LICENSE](LICENSE).
