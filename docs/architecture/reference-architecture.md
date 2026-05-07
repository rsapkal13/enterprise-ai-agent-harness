# Reference Architecture

The reference architecture shows how AgentHarness can sit around existing agent runtimes and enterprise systems without replacing them.

## High-Level Diagram

```text
Channels / Experience Layer
  Web apps
  Mobile apps
  Chat
  Voice
  Contact center
  Internal tools
  UI manifests

Agent Runtime Layer
  Agents
  Assistants
  Planners
  Orchestrators
  Model SDKs
  Agent frameworks

AgentHarness Control Plane
  Agent Registry
  Skill Registry
  Tool Registry
  Policy Registry
  Workflow Registry
  System Registry
  Context Scope Registry
  UI Manifest Registry
  Evaluation Registry
  Lifecycle Governance

Governance and Policy Layer
  Workload Identity
  Policy Engine
  Risk Tiering
  Consent Requirements
  Human Approval
  Obligations

Execution and Workflow Layer
  Tool Gateway
  Workflow Engine
  Context Layer
  Schema Validation
  Rate Limits
  Retry and Compensation

Enterprise Systems Layer
  CRM
  Billing
  Identity
  Case Management
  Knowledge Stores
  Data Platforms
  Workflow Tools
  Operational APIs

Evidence and Audit Layer
  Traces
  Audit Events
  Policy Decisions
  Tool Call Records
  Workflow State
  Evaluation Results
  Drift and Quality Signals
```

## Channels / Experience Layer

Channels are where users, agents, and operators interact with AI capabilities.

This layer may include web apps, mobile apps, chat, voice, contact center tools, internal portals, or future UI manifest renderers. AgentHarness does not require a specific channel. It defines the control and evidence model behind the experience.

## Agent Runtime Layer

The agent runtime layer contains agents, assistants, planners, orchestrators, prompts, model SDKs, and agent frameworks.

AgentHarness does not replace this layer. It provides the governance boundary around it. Agents should request registered skills instead of calling raw tools or systems directly.

## AgentHarness Control Plane

The control plane defines approved capabilities and their lifecycle.

It includes registries for agents, skills, tools, policies, workflows, systems, context scopes, UI manifests, and evaluations. It also captures ownership, risk tier, lifecycle state, and approval status.

## Governance and Policy Layer

The governance layer turns approval into runtime constraints.

It binds agents to scoped workload identities, evaluates policy decisions, applies risk-tier controls, requires consent or human approval where needed, and emits obligations that runtime components must satisfy.

## Execution and Workflow Layer

The execution layer performs governed work.

The Tool Gateway wraps system interactions. The Workflow Engine coordinates multi-step journeys. The Context Layer controls what information is available. Schema validation, rate limits, retries, and compensation patterns keep execution bounded.

## Enterprise Systems Layer

Enterprise systems are registered operational boundaries.

They may include CRM, billing, identity, case management, data platforms, knowledge stores, workflow tools, or APIs. Public examples should use fictional mock systems rather than real names or private architecture details.

## Evidence and Audit Layer

The evidence layer proves what happened.

It captures traces, audit events, policy decisions, tool calls, workflow states, approvals, outputs, side effects, evaluation results, cost, latency, and quality signals. These records should be structured enough to reconstruct the journey.

## Integration Principles

- Integrate with existing agent runtimes rather than replacing them.
- Govern skills before exposing tools.
- Treat workload identity as a runtime boundary.
- Use registered systems instead of embedding private system details.
- Keep public examples fictional and reusable.
- Emit structured evidence for decisions and side effects.
- Let governance depth scale with risk tier.
- Avoid provider-specific assumptions in public schemas and docs.
