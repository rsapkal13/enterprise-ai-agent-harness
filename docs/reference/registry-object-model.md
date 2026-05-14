# Registry Object Model

All registry objects in the Enterprise AI Agent Harness share a common shape.
This page explains that shared shape before you read individual schema pages.

## Common Fields

Every registry object has the following fields:

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `id` | string | yes | Stable unique identifier. Never changes after `active`. See [identifier conventions](identifier-conventions.md). |
| `version` | string | yes | Spec version of this object definition (e.g. `0.1.0`). |
| `status` | enum | yes | Lifecycle state. See [lifecycle states](#lifecycle-states). |
| `name` | string | yes | Human-readable display name. May change; `id` must not. |
| `description` | string | yes | Business description of the object's purpose. |
| `owner` | string | most | Owning team or accountable group. Required on agents, skills, systems, and context scopes. |
| `tags` | string[] | no | Search and classification labels. |

## Lifecycle States

All registry objects share the same four lifecycle states:

| State | Meaning |
|-------|---------|
| `draft` | Proposed. Not yet approved for use. Visible in registries but not executable. |
| `active` | Approved and available for use in journeys. |
| `deprecated` | Still available but should not be used in new journeys. |
| `retired` | Unavailable. Execution should be blocked at runtime. |

Lifecycle transitions are documented in [`docs/reference/object-lifecycle.md`](object-lifecycle.md).

## Classification Fields

Several object types carry additional classification fields that drive governance behaviour:

| Field | Type | Used by |
|-------|------|---------|
| `riskLevel` | `low \| medium \| high \| restricted` | Skill, Tool, Agent |
| `dataClassification` | `public \| internal \| confidential \| restricted` | System, Context Scope |
| `trustLevel` | `trusted_internal \| controlled_external \| mock \| unknown` | System |

These fields are not decorative. Policy evaluation, approval thresholds, audit requirements, and
evaluation depth all depend on them.

## Registry Objects vs Event and Result Records

The harness has two categories of structured object:

### Registry Objects

Pre-registered definitions that describe what is allowed to exist and how it must behave.
These are authored by governance teams, approved through a review process, and stored in registries.

| Object | Schema |
|--------|--------|
| Agent | [`schemas/agent.schema.json`](../../schemas/agent.schema.json) |
| Skill | [`schemas/skill.schema.json`](../../schemas/skill.schema.json) |
| Tool | [`schemas/tool.schema.json`](../../schemas/tool.schema.json) |
| Policy | [`schemas/policy.schema.json`](../../schemas/policy.schema.json) |
| Workflow | [`schemas/workflow.schema.json`](../../schemas/workflow.schema.json) |
| System | [`schemas/system.schema.json`](../../schemas/system.schema.json) |
| Context Scope | [`schemas/context-scope.schema.json`](../../schemas/context-scope.schema.json) |
| UI Manifest | [`schemas/ui-manifest.schema.json`](../../schemas/ui-manifest.schema.json) |

### Event and Result Records

Runtime-generated records that capture what happened during execution.
These are produced by the runtime and stored in audit and observability systems.

| Record | Schema |
|--------|--------|
| Audit Event | [`schemas/audit-event.schema.json`](../../schemas/audit-event.schema.json) |
| Evaluation | [`schemas/evaluation.schema.json`](../../schemas/evaluation.schema.json) |

Event and result records reference registry objects by `id` but are not pre-registered themselves.

## Object Relationships

Registry objects reference each other by `id`. The full reference chain is:

```text
Agent -> Skill -> Tool -> System
              -> Policy
              -> Context Scope
              -> Workflow -> Tool
                          -> Policy
                          -> UI Manifest
              -> Evaluation
```

Cross-reference rules are documented in [`docs/reference/cross-reference-rules.md`](cross-reference-rules.md).

## Versioning

Every object carries a `version` field. Versioning conventions are documented in
[`docs/reference/versioning.md`](versioning.md).

Key rules for v0.1:
- Version follows semver (`MAJOR.MINOR.PATCH`).
- Changing an object's `id` is always a breaking change regardless of version.
- A `deprecated` object should remain accessible at its versioned identifier for audit reproducibility.
