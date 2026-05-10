# Documentation

Enterprise AI Agent Harness, also called AgentHarness, is an open-source specification and execution-harness project for defining, registering, governing, executing, observing, and improving AI capabilities across enterprise ecosystems.

This documentation is the public starting point for the v0.1 specification release. It explains the operating model, registry objects, governance concepts, fictional examples, and build roadmap.

## Start Here

If you are new to the project, read these first:

1. [Vision](vision.md)
2. [Architecture overview](architecture/overview.md)
3. [Agent, skill, tool, and policy model](architecture/agent-skill-tool-policy-model.md)
4. [Quickstart guide](guides/quickstart.md)
5. [Telco customer-care example](../examples/telco-customer-care/README.md)

## What AgentHarness Is

AgentHarness is not another multi-agent framework. It is the enterprise control plane around AI agents: capability registration, policy decisions, workload identity, workflow boundaries, context access, auditability, evaluation, and lifecycle governance.

It helps teams describe what an AI capability is allowed to do before runtime and prove what happened after execution.

## Core Operating Model

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

Agents should not call raw enterprise systems directly. They should execute registered skills through governed tools, policy checks, scoped identity, workflow orchestration, controlled context, and auditable traces.

## Recommended Reading Paths

### Enterprise Architects

- [Vision](vision.md)
- [Architecture overview](architecture/overview.md)
- [Reference architecture](architecture/reference-architecture.md)
- [Design principles](architecture/design-principles.md)
- [Agent, skill, tool, and policy model](architecture/agent-skill-tool-policy-model.md)

### Developers

- [Quickstart guide](guides/quickstart.md)
- [Defining a skill](guides/defining-a-skill.md)
- [Registering a tool](guides/registering-a-tool.md)
- [Creating an agent](guides/creating-an-agent.md)
- [Creating a workflow](guides/creating-a-workflow.md)
- [Telco customer-care example](../examples/telco-customer-care/README.md)

### Governance, Risk, Privacy, and Security Teams

- [Risk classification](governance/risk-classification.md)
- [Approval workflow](governance/approval-workflow.md)
- [Responsible AI](governance/responsible-ai.md)
- [Audit model](governance/audit-model.md)
- [Human in the loop](governance/human-in-the-loop.md)
- [Data and privacy](governance/data-and-privacy.md)

### Open-Source Contributors

- [Quickstart guide](guides/quickstart.md)
- [Concepts](concepts/)
- [Roadmap](../ROADMAP.md)
- [Backlog](../backlog/README.md)
- [Telco customer-care example](../examples/telco-customer-care/README.md)

### Product and Technology Leaders

- [Vision](vision.md)
- [Architecture overview](architecture/overview.md)
- [Risk classification](governance/risk-classification.md)
- [Approval workflow](governance/approval-workflow.md)
- [Roadmap](../ROADMAP.md)

## Specification Objects

The v0.1 specification uses registry objects to describe governed AI capabilities:

- Agent Registry
- Skill Registry
- Tool Gateway
- Policy Engine
- Workflow Engine
- System Registry
- Context Layer
- Experience Manifest
- Evaluation Service
- Observability and Audit

Start with the [concept documentation](concepts/) for business and technical explanations, then review the schema notes in [schemas](schemas/) and the JSON Schema files in the repository root `schemas/` directory.

## Governance Model

AgentHarness uses governance that scales with risk, not bureaucracy.

The main governance entry points are:

- [Risk classification](governance/risk-classification.md)
- [Approval workflow](governance/approval-workflow.md)
- [Audit model](governance/audit-model.md)
- [Human in the loop](governance/human-in-the-loop.md)
- [Data and privacy](governance/data-and-privacy.md)

Risk tiers are:

- `T0` - Informational
- `T1` - Bounded operational
- `T2` - Transactional
- `T3` - High impact

Approval creates binding runtime constraints. It is not just permission.

## Example Journey

The first complete sample is a fictional telco customer-care plan-change journey:

- [Telco customer-care example](../examples/telco-customer-care/README.md)

It demonstrates:

- A customer-service agent with approved skills and tools
- A plan-change skill
- Consent, customer data access, and high-risk action policies
- Governed tools for profile, eligibility, price delta, and request preparation
- A workflow with confirmation and approval steps
- Fictional systems, context scopes, audit events, evaluations, and a UI manifest

The example is organisation-neutral and contains no real customer data, private APIs, credentials, or sensitive architecture details.

## Current v0.1 Scope

`v0.1 - Spec Release` focuses on:

- Public documentation foundation
- Draft schemas
- Fictional enterprise journeys
- Backlog and milestones
- Contribution structure
- Package boundaries
- Lightweight validation tooling

Use the quickstart to validate the repository locally:

```bash
npm install
npm run validate
```

## What Is Not Included Yet

v0.1 is not a production runtime release.

The following are future roadmap items:

- Production policy execution
- Live tool gateway integrations
- Durable workflow runtime
- CLI scaffolding product
- Docker, Helm, or hosted deployment guidance
- Runtime-connected dashboard
- Human approval queue
- Agent directory and controlled delegation

See the [Roadmap](../ROADMAP.md) and [Backlog](../backlog/README.md) for planned work.

## How To Contribute

Good first contribution areas include:

- Documentation
- Schemas
- Fictional examples
- Backlog items
- Validation tooling
- CI checks

Start by reading the [Quickstart guide](guides/quickstart.md), then review the [Backlog](../backlog/README.md). Keep all contributions vendor-neutral, organisation-neutral, and safe for a public open-source repository.
