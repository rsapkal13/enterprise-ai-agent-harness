# Context Layer

## What it is

The Context Layer provides safe access to enterprise context. It controls business, user, session, memory, system, and entitlement context that an agent can use during execution.

## Why it matters

Agents often need context to act usefully, but unbounded context creates privacy, security, and correctness risks. Context scopes make access explicit, limited, policy-aware, and auditable.

## How it works

Context is described as named scopes such as `customer.summary`, `account.entitlements`, or `active.case`. Agents and skills request scopes. Policies decide whether those scopes are allowed for the current identity, channel, risk tier, purpose, and workflow state.

Context records should describe access boundaries and data classifications, not store raw sensitive data in public examples.

## Manifest shape

```yaml
id: account.entitlements
version: 0.1.0
status: active
name: Account Entitlements
owner: customer-care-platform
dataClassification: confidential
allowedPurpose:
  - customer-care
  - plan-change
sourceSystems:
  - mock.eligibility-system
retention:
  mode: session
```

## Relationships

- Agents can be approved for context scopes.
- Skills declare required context scopes.
- Policies decide whether context access is allowed.
- Tools may receive context-derived inputs after validation.
- Workflows can request context at specific steps.
- Systems can be sources of context.
- Audit events should record context access decisions without exposing unnecessary sensitive data.

## Design rules

- Request the minimum context needed for a skill.
- Classify context by sensitivity.
- Separate context access from raw data storage.
- Audit access decisions and high-risk context use.
- Use purpose and channel as policy inputs.

## Anti-patterns

- Giving agents broad memory or data access by default.
- Storing raw sensitive data in public manifests.
- Passing context into tools without policy checks.
- Reusing context across unrelated purposes.
- Treating context access as a prompt concern only.

## v0.1 scope

v0.1 defines context scope concepts, starter schema, and fictional context examples. Runtime context retrieval, memory systems, entitlement checks, and production data integration are deferred to later releases.
