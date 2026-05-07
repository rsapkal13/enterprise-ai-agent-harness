# Architecture Overview

AgentHarness separates AI intent from governed business execution.

An agent should not call raw enterprise systems directly. It should request a registered skill, pass through policy and identity controls, use governed tools, execute inside workflow boundaries, interact with registered systems, and produce structured audit evidence.

## Architecture Summary

The architecture is registry-driven and evidence-oriented:

- Registries define what exists and who owns it.
- Policies decide what is allowed.
- Identity scopes what can act.
- Tools provide governed system access.
- Workflows control multi-step execution.
- Context scopes limit what information is available.
- Observability, audit, and evaluation prove what happened and improve what happens next.

## Layered Architecture

```text
Channels and Experiences
  Web, mobile, chat, voice, contact center, internal tools

Agent Runtime
  Agents, assistants, planners, orchestrators, model SDKs

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

Runtime Enforcement Plane
  Workload Identity
  Policy Engine
  Tool Gateway
  Workflow Engine
  Context Layer

Evidence Layer
  Traces
  Audit Events
  Policy Decisions
  Tool Calls
  Workflow State
  Evaluation Results
```

## Core Flow

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

1. An agent requests or is assigned a registered skill.
2. The skill declares purpose, risk, required context, policies, tools, workflow, and evaluations.
3. Policies evaluate whether execution is allowed, denied, or requires approval.
4. Tools provide governed access to registered systems.
5. Workflows coordinate state, approvals, retries, and compensation.
6. Systems define operational boundaries, ownership, trust level, and data classification.
7. Audit events preserve evidence of decisions, actions, side effects, and outcomes.

## Control Plane vs Runtime Plane

The control plane defines and governs capabilities. It answers:

- What agents exist?
- What skills are approved?
- Which tools and systems may be used?
- Which policies apply?
- What context is allowed?
- What evaluations are required?
- What lifecycle state is each capability in?

The runtime plane enforces those decisions. It answers:

- Is this agent allowed to invoke this skill?
- Which workload identity is used?
- Which policies must be evaluated?
- Which tool calls are allowed?
- Which workflow step is active?
- Which audit and trace events must be emitted?

## Registry-Driven Governance

AgentHarness treats registries as the source of control-plane truth.

Registries should be reviewed and versioned before runtime execution. Runtime components should use registry records to enforce policy, identity, tool, workflow, context, audit, and evaluation requirements.

This keeps governance close to execution without hard-coding organisation-specific decisions into public code.

## Evidence Layer

The evidence layer includes observability, audit, and evaluation.

- Observability helps operators understand runtime behaviour.
- Audit preserves structured governance evidence.
- Evaluation measures quality, compliance, regression, and readiness.

These records should connect back to agents, skills, policies, tools, workflows, systems, and outcomes.

## Adoption Model

AgentHarness is designed for incremental adoption.

- v0.1: public specification, schemas, examples, and validation
- v0.2: local runtime preview with registries and mock execution
- v0.3: policy decisions, approval checkpoints, and workflow state
- v0.4: observability, audit, evaluation, and local reporting
- v0.5: demo experiences, admin-console direction, and additional journeys

Organisations can start by using the schemas and examples to describe capabilities before adopting runtime enforcement.
