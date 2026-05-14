# Phase 7: Human Approval Operations

Goal: turn human-in-the-loop approval from a demo concept into an operational control-plane model.

## Scope

- Human approval queue
- Approval write model via policy engine API
- Approval audit log
- Scope-change and recertification workflow design
- Reviewer roles and decision evidence model

## Exit Criteria

- Approval requests can be represented as first-class objects.
- Approval decisions are auditable.
- Reject and return-for-changes outcomes are modeled.
- Scope changes trigger recertification requirements.
- Security and identity assumptions are documented without implementing production auth.

## Issue-Ready Stories

### Story 7.1: Define Approval Request Object

As a policy engine, I want approval requests to be structured so that human decisions are
reconstructable.

Acceptance criteria:

- Approval request includes request ID, trace ID, agent, skill, tool, workflow, policy decision,
  requester, required role, risk tier, evidence references, and expiry.
- Request states include pending, approved, rejected, expired, and cancelled.
- Sensitive context payloads are referenced rather than embedded by default.

Suggested labels: `area:policy`, `area:schema`, `type:design`, `priority:p0`, `release:v0.7`

Suggested milestone: `v0.7`

### Story 7.2: Define Approval Decision API

As an approval UI, I want a stable decision API so that approve and reject actions create policy and
audit evidence.

Acceptance criteria:

- API supports approve, reject, and return-for-changes.
- Decision requires reviewer, timestamp, reason, and request ID.
- Decision output links to audit event ID and trace ID.
- Repeated decisions are rejected or treated idempotently.

Suggested labels: `area:policy`, `area:runtime`, `type:design`, `priority:p0`, `release:v0.7`

Suggested milestone: `v0.7`

### Story 7.3: Add Approval Audit Log View

As an auditor, I want a list of approval decisions so that oversight can review who approved what
and why.

Acceptance criteria:

- View lists approval request ID, decision, reviewer, timestamp, risk tier, and linked journey.
- Detail view shows evidence references and policy decision.
- Audit events are linked by trace ID.
- Rejection and expiry are visible, not hidden as errors.

Suggested labels: `area:observability`, `area:website`, `type:feature`, `priority:p1`, `release:v0.7`

Suggested milestone: `v0.7`

### Story 7.4: Define Scope Change and Recertification Flow

As a governance owner, I want scope changes to trigger recertification so that approved capabilities
cannot drift silently.

Acceptance criteria:

- Scope-changing fields are identified for agents, skills, tools, policies, workflows, systems, and
  context scopes.
- Change states include draft change, pending review, approved, rejected, and retired.
- Recertification evidence requirements are documented by risk tier.

Suggested labels: `area:policy`, `area:docs`, `type:design`, `priority:p1`, `release:v0.7`

Suggested milestone: `v0.7`
