# Phase 8: Agent Directory and Controlled Delegation

Goal: define controlled agent collaboration without introducing uncontrolled agent mesh behavior.

This phase is explicitly future-state. It should not be marketed as an available runtime capability
until earlier governance, policy, workflow, and audit foundations are stable.

## Scope

- Agent capability card specification
- Allow-listed agent discovery
- Policy-gated handoff between agents
- Delegation audit events
- Maturity guidance for controlled agent collaboration

## Exit Criteria

- Agents can describe delegable capabilities through reviewed capability cards.
- Discovery is allow-listed and policy-gated.
- Handoffs include source agent, target agent, requested skill, context scope, policy decision, and
  audit evidence.
- Unapproved or uncertified delegation attempts are denied and auditable.

## Issue-Ready Stories

### Story 8.1: Define Agent Capability Card Schema

As a delegating agent, I want target agents to publish reviewed capability cards so that handoff
options are explicit.

Acceptance criteria:

- Capability card includes agent ID, owner, purpose, risk tier, accepted task types, approved
  skills, input/output contracts, context scopes, handoff conditions, terminal states, and audit
  obligations.
- Capability card references existing registry object IDs.
- Cards have lifecycle state and certification status.

Suggested labels: `area:schema`, `area:runtime`, `type:design`, `priority:p1`, `release:v0.8`

Suggested milestone: `v0.8`

### Story 8.2: Define Allow-Listed Discovery Model

As a platform owner, I want agent discovery to be allow-listed so that agents cannot discover or
delegate to unknown capabilities.

Acceptance criteria:

- Discovery only returns registered, active, certified, and policy-visible agents.
- Results include risk tier, owner, lifecycle state, supported skills, and handoff constraints.
- Denied discovery attempts create audit evidence.

Suggested labels: `area:runtime`, `area:policy`, `type:design`, `priority:p1`, `release:v0.8`

Suggested milestone: `v0.8`

### Story 8.3: Define Policy-Gated Handoff

As a governance reviewer, I want every agent-to-agent handoff to pass policy checks so that
delegation cannot bypass approved boundaries.

Acceptance criteria:

- Handoff policy input includes source agent, target agent, requested skill, workflow ID, trace ID,
  requester, data classes, context scopes, and risk tier.
- Outcomes are allow, deny, or require approval.
- Handoff decisions link to parent workflow trace and audit event.

Suggested labels: `area:policy`, `area:workflow`, `type:design`, `priority:p1`, `release:v0.8`

Suggested milestone: `v0.8`

### Story 8.4: Define Delegation Audit Event

As an auditor, I want delegation events to be structural so that handoffs can be reconstructed.

Acceptance criteria:

- Audit event records source agent, target agent, requested skill, policy decision, context shared,
  workflow ID, trace ID, outcome, and side effects.
- Sensitive context is referenced or hashed by default.
- Denied and approval-required handoffs are captured.

Suggested labels: `area:observability`, `area:schema`, `type:design`, `priority:p2`, `release:v0.8`

Suggested milestone: `v0.8`
