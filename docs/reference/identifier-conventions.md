# Identifier Conventions

Every registry object in the Enterprise AI Agent Harness has a stable `id` field.
This page explains the naming rules contributors should follow so identifiers remain
consistent, predictable, and safe to reference across registry objects and example journeys.

## General Rules

- Identifiers are lowercase.
- Words are separated by dots (`.`) for namespace segments or hyphens (`-`) within a segment.
- No spaces, uppercase letters, or special characters.
- Identifiers are stable once an object enters `active` status. Changing an identifier is a breaking change.
- Display names (the `name` field) are separate from identifiers. Display names may change; identifiers must not.
- Identifiers must be unique within their object type.

## Patterns by Object Type

### Agent

```
{role}-agent
```

Agents represent a business role or service identity. Use a short role descriptor followed by `-agent`.

| Example | Meaning |
|---------|---------|
| `customer-service-agent` | Agent serving customer-care journeys |
| `fraud-review-agent` | Agent reviewing suspected fraud cases |
| `onboarding-agent` | Agent running new customer onboarding |

### Skill

```
{domain}.{action}
```

Skills are business capabilities. Use a business domain prefix and a verb-noun action.

| Example | Meaning |
|---------|---------|
| `customer.change_plan` | Capability to change a customer's plan |
| `customer.check_balance` | Capability to check a customer's balance |
| `customer.replace_sim` | Capability to replace a customer's SIM |
| `fraud.submit_review` | Capability to submit a fraud review case |

### Tool

```
{system}.{action}
```

Tools are governed wrappers around system operations. Use the system name prefix and a verb-noun action.

| Example | Meaning |
|---------|---------|
| `eligibility.check_plan_change` | Eligibility system call to check plan change |
| `billing.calculate_price_delta` | Billing system call to compute a price difference |
| `order.prepare_plan_change_request` | Order system call to prepare a plan change |
| `customer.read_limited_profile` | CRM system call to read a limited customer profile |

### Policy

```
{category}.{rule}
```

Policies are governance rules. Use a short category prefix and a descriptive rule name.

| Example | Meaning |
|---------|---------|
| `consent.required` | Requires consent before account-affecting actions |
| `high_risk.action` | Controls required for high-risk skill invocations |
| `customer_data.access` | Data access controls for customer records |

### Workflow

```
{domain}.{action}.workflow
```

Workflows coordinate multi-step journeys. Append `.workflow` to make the type explicit.

| Example | Meaning |
|---------|---------|
| `customer.change_plan.workflow` | End-to-end journey for changing a customer plan |
| `customer.replace_sim.workflow` | End-to-end journey for replacing a customer SIM |
| `fraud.review_case.workflow` | End-to-end journey for reviewing a fraud case |

### System

```
{adjective}-{domain}-system
```

Systems are enterprise platform boundaries. In fictional examples, prefix with `fictional-`
to make it clear the system is not a real endpoint.

| Example | Meaning |
|---------|---------|
| `fictional-billing-system` | Fictional billing platform (example only) |
| `fictional-crm-system` | Fictional CRM platform (example only) |
| `fictional-order-system` | Fictional order management platform (example only) |

In non-fictional registries, use a short descriptive name without the `fictional-` prefix.

### Context Scope

```
context.{domain}.{scope}
```

Context scopes identify bounded data bundles. Use a `context.` prefix to distinguish them
from skill or tool identifiers.

| Example | Meaning |
|---------|---------|
| `context.customer.summary` | Summary profile of the active customer |
| `context.account.entitlements` | Entitlements on the customer's account |
| `context.session.current` | Active session metadata |

### Audit Event

```
{event-type}.{YYYY-MM-DD}.{sequence}
```

Audit event IDs are runtime-generated records, not pre-registered identifiers.
The convention is: event type slug, ISO date, and a sequence or UUID suffix.

| Example | Meaning |
|---------|---------|
| `plan-change-allowed.2024-11-01.001` | First plan-change allowed event on that date |
| `tool-call.2024-11-01.7f3a` | Tool call event with a short UUID suffix |

### Evaluation

```
eval.{domain}.{metric}
```

Evaluations measure outcomes for a specific target. Use an `eval.` prefix, the domain,
and a short metric descriptor.

| Example | Meaning |
|---------|---------|
| `eval.plan_change.completed` | Completion rate evaluation for plan-change journeys |
| `eval.plan_change.policy_compliance` | Policy compliance evaluation for plan-change journeys |
| `eval.plan_change.price_delta_explained` | Quality check: was price delta explained to customer |

### UI Manifest

```
{screen-name}
```

UI manifests describe agent-led screens. Use a short kebab-case name describing the screen purpose.

| Example | Meaning |
|---------|---------|
| `confirm-plan-change` | Confirmation screen for a plan change |
| `review-fraud-case` | Review screen for a fraud case |
| `sim-replacement-complete` | Completion screen for SIM replacement |

## Referencing Identifiers Across Objects

When one object references another (e.g. a skill listing its tools), use the exact `id`
value from the referenced object. Do not abbreviate, alias, or partially match identifiers.

Cross-reference rules are documented in
[`docs/reference/cross-reference-rules.md`](cross-reference-rules.md).
