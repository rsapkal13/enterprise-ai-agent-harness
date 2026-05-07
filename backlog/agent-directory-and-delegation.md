# Backlog: Agent Directory and Controlled Delegation

Goal: define a future governance model for controlled agent collaboration.

This backlog captures future-state ideas sometimes described as an agent mesh or directory. It is
not part of `v0.1`.

## Story D1: Define Agent Capability Card

As an orchestrator, I want each discoverable agent to publish a capability card so that delegation
can be reviewed before runtime.

Acceptance criteria:

- Capability card proposal includes:
  - agent ID
  - purpose
  - owner
  - risk tier
  - accepted task types
  - required context scopes
  - approved input and output contracts
  - handoff conditions
  - terminal states
  - audit obligations
- Capability cards reference existing agent, skill, policy, tool, workflow, system, and audit
  concepts.
- The proposal avoids uncontrolled peer-to-peer discovery.

Suggested labels: `area:schema`, `area:runtime`, `type:design`, `priority:p1`, `release:v0.8`

Suggested milestone: `v0.8`

## Story D2: Define Allow-Listed Discovery

As a platform owner, I want agent discovery to be allow-listed so that agents cannot delegate to
unknown or uncertified agents.

Acceptance criteria:

- Discovery proposal requires registry approval before an agent is discoverable.
- Delegating agents can only see agents allowed by policy and workflow context.
- Discovery results include risk tier, lifecycle state, certification status, and allowed handoff
  types.
- Blocked discovery attempts produce audit evidence.

Suggested labels: `area:runtime`, `area:policy`, `type:design`, `priority:p1`, `release:v0.8`

Suggested milestone: `v0.8`

## Story D3: Define Policy-Gated Handoff

As a governance reviewer, I want handoffs between agents to pass policy checks so that delegation
does not bypass approved operating boundaries.

Acceptance criteria:

- Handoff proposal defines required policy inputs:
  - source agent
  - target agent
  - skill requested
  - risk tier
  - context scopes
  - data classes
  - requester
  - workflow state
- Policy decision outcomes are `allow`, `deny`, or `require_approval`.
- Handoff evidence is linked to the parent workflow trace.

Suggested labels: `area:policy`, `area:workflow`, `type:design`, `priority:p1`, `release:v0.8`

Suggested milestone: `v0.8`

## Story D4: Define Delegation Audit Model

As an auditor, I want agent-to-agent delegation to produce structural audit evidence so that every
handoff can be reconstructed.

Acceptance criteria:

- Audit proposal includes source agent, target agent, requested skill, policy decision, context
  shared, workflow ID, trace ID, outcome, and side effects.
- Delegation audit events link to existing audit-event schema concepts.
- Sensitive context payloads are not captured by default; references or hashes are preferred.

Suggested labels: `area:observability`, `area:schema`, `type:design`, `priority:p2`, `release:v0.8`

Suggested milestone: `v0.8`
