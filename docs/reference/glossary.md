# Glossary

Core terms used across the Enterprise AI Agent Harness specification, schemas, examples, and documentation.

---

### Agent

An AI actor with a registered business identity, workload identity, approved skills, allowed channels,
risk tier, and lifecycle state. Agents do not call enterprise systems directly — they invoke registered
skills that are governed by policies, tools, workflows, and audit requirements.

See [`docs/concepts/agent-registry.md`](../concepts/agent-registry.md).

---

### Approval

A governed decision made by a human reviewer or a review board that allows a capability to advance
to the next lifecycle state (e.g. from `draft` to `active`). Approval is not a form — it creates
binding runtime constraints including allowed skills, identity scope, context access, and audit obligations.

See [`docs/governance/approval-workflow.md`](../governance/approval-workflow.md).

---

### Audit Event

A structured record of a meaningful decision or action that occurred during execution. Audit events
capture the actor, outcome, evidence payload, timestamps, and trace correlation. They are generated
at runtime and are not pre-registered.

See [`docs/concepts/audit.md`](../concepts/audit.md).

---

### Context Scope

A declared bundle of business or session data that an agent is permitted to access during execution.
Context scopes carry data classification, source systems, and access policy requirements. Agents do not
read enterprise data directly — they request context scopes that are resolved and filtered by the
context layer.

See [`docs/concepts/context-layer.md`](../concepts/context-layer.md).

---

### Evidence

The set of facts, records, and artefacts attached to a policy decision or audit event to demonstrate
that the decision was correct and that obligations were fulfilled. Examples include consent timestamps,
approval records, tool call responses, and evaluation results.

---

### Evaluation

A structured measurement of how an agent, skill, tool, workflow, or journey performed against defined
criteria. Evaluation types include completion, compliance, quality, latency, reliability, and business
outcome. Evaluation records are produced at runtime and are not pre-registered.

See [`docs/concepts/evaluation.md`](../concepts/evaluation.md).

---

### Obligation

An action required when a policy is triggered. Obligations are declared on policies and may include
recording consent, writing an audit event, notifying a reviewer, redacting sensitive output, or
requiring step-up authentication. Obligations must be fulfilled before or after the governed action proceeds.

---

### Policy

A governance rule evaluated at a defined enforcement point in the execution chain. A policy produces
a decision: `allow`, `deny`, `require_approval`, or `require_consent`. Policies carry conditions,
obligations, evidence requirements, and audit flags. They are evaluated by the policy engine against
the current subject, resource, action, and context.

See [`docs/concepts/policy-engine.md`](../concepts/policy-engine.md).

---

### Enforcement Point

The location in the execution chain where a policy is evaluated. Enforcement points include:
`agent_request`, `skill_invocation`, `tool_call`, `workflow_step`, `context_access`, and
`system_interaction`.

---

### Risk Tier

A classification of potential impact used to calibrate governance requirements. The harness uses
four tiers:

- `T0` — Informational: read-only, low-sensitivity lookups
- `T1` — Bounded operational: writes within tight guardrails
- `T2` — Transactional: account-affecting changes
- `T3` — High impact: irreversible, high-value, or sensitive actions

Governance requirements — approval depth, evaluation coverage, human oversight, audit obligations —
scale with the risk tier.

---

### Skill

A registered business capability that an agent can invoke. Skills declare their business purpose,
owner, risk level, required tools, required policies, context scopes, and evaluation expectations.
Agents reference skills by `id`; they do not call tools or systems directly.

See [`docs/concepts/skill-registry.md`](../concepts/skill-registry.md).

---

### System

A registered enterprise platform, data source, service, or operational boundary that tools interact
with. Systems declare their owner, type, trust level, and data classification. Every tool must reference
the system it targets.

See [`docs/concepts/system-registry.md`](../concepts/system-registry.md).

---

### Tool

A governed wrapper around a system action or data lookup. Tools declare their adapter type (REST, MCP,
mock, data, workflow), target system, risk level, input schema, and output schema. Agents invoke tools
through the tool gateway, which enforces policy, validates schemas, and writes audit records.

See [`docs/concepts/tool-registry.md`](../concepts/tool-registry.md).

---

### Trace

A correlated sequence of runtime events — tool calls, policy decisions, context accesses, workflow
steps, and audit events — belonging to a single execution journey. Traces are the primary unit of
observability for a governed AI interaction.

See [`docs/concepts/observability.md`](../concepts/observability.md).

---

### UI Manifest

A structured declaration of the information, decisions, and actions that an agent-led journey needs
to surface to a human through a user interface. UI manifests are registry objects — they describe
the intent and required data of a screen without coupling to a specific frontend framework.

See [`docs/concepts/experience-manifest.md`](../concepts/experience-manifest.md).

---

### Workflow

A registered, stateful coordination of multiple steps — tool calls, policy gates, human approvals,
context lookups — that together complete a business journey. Workflows carry explicit state transitions,
rollback strategies, and evaluation expectations. They are executed by the workflow engine.

See [`docs/concepts/workflow-orchestration.md`](../concepts/workflow-orchestration.md).
