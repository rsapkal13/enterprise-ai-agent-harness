# Vision

Enterprise AI Agent Harness is an open-source specification and execution-harness project for defining, registering, governing, executing, observing, and improving AI capabilities across enterprise ecosystems.

It is not another multi-agent framework. It is the enterprise control plane around AI agents: capability registration, policy decisions, workload identity, workflow boundaries, context access, auditability, evaluation, and lifecycle governance.

## Mission

Make enterprise AI capabilities governable, reusable, observable, and improvable without forcing organisations into one model provider, agent framework, workflow engine, or integration platform.

The project exists to help teams turn AI behaviours into registered business capabilities with clear ownership, policy boundaries, system access, workflow state, audit evidence, and evaluation requirements.

## Problem Statement

Enterprise AI often moves from prototype to production before the operating model is ready.

Common gaps include:

- Agents call tools before capabilities are registered.
- Business owners cannot see what an agent is allowed to do.
- Policies are documented but not enforced at runtime.
- Tools touch systems without clear identity, risk, or audit boundaries.
- Workflows lack approval, retry, rollback, and escalation paths.
- Observability captures logs, but not structured governance evidence.
- Evaluation happens after release rather than before and during operation.

AgentHarness addresses these gaps by treating governance as part of the execution model, not as a separate checklist.

## Why Agent Frameworks Are Not Enough

Agent frameworks help build reasoning loops, tool calls, memory patterns, prompts, and orchestration behaviours. Those are valuable, but they are not the whole enterprise control plane.

Enterprise deployment also needs:

- Capability registration
- Scoped workload identity
- Risk tiering
- Policy decisions
- Tool and system governance
- Workflow boundaries
- Approval checkpoints
- Audit evidence
- Evaluation and certification
- Lifecycle controls

AgentHarness is designed to complement agent frameworks, model SDKs, workflow engines, and integration platforms by defining the governance and execution envelope around them.

## One Control Plane. Two Surfaces.

### Surface 1: Business Control Plane Portal

A business-facing control plane for registering, approving, monitoring, certifying, and retiring AI capabilities.

This surface is for governance, architecture, risk, product, and operations stakeholders who need to understand what capabilities exist, who owns them, which systems they touch, what risk tier they carry, and whether they are approved for use.

### Surface 2: Open-Source Engineering Codebase

An open-source engineering codebase that makes those governance decisions enforceable at runtime through schemas, SDKs, registries, policy, identity, tool gateways, workflows, evaluation, and observability.

This repository is the public foundation for that engineering surface.

## Core Operating Model

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

The model is intentionally simple:

- Agents request registered skills.
- Skills describe business capabilities.
- Policies decide whether execution is allowed, denied, or requires approval.
- Tools provide governed access to systems.
- Workflows coordinate stateful journeys.
- Systems are registered operational boundaries.
- Audit records preserve structured evidence.

## Design Goals

- Registry-first: make capabilities explicit before execution.
- Deny by default: require policy and identity boundaries before action.
- Skills before tools: expose business capabilities, not raw system actions.
- Evaluation before production: certify behaviour before and after release.
- Trace everything structurally: preserve evidence across the full journey.
- Human oversight scales with risk: apply review where impact requires it.
- Vendor-neutral by design: work across model providers and runtime stacks.
- Incremental adoption: start with schemas and examples, then add runtime enforcement.

## Non-Goals

- Building a complete production runtime in the v0.1 spec release
- Replacing model providers, agent SDKs, workflow engines, integration platforms, or MCP servers
- Encoding private enterprise architecture into the public repository
- Publishing customer-specific examples, credentials, or internal approval thresholds
- Optimizing for impressive demos at the expense of governance clarity

## Public vs Private Boundary

Public GitHub should contain reusable open-source patterns, schemas, examples, docs, backlog, and code.

Private tools such as Notion should hold organisation-specific strategy, internal approval thresholds, sensitive architecture notes, customer-specific examples, real system names, credentials, legal interpretations, and operational contacts.
