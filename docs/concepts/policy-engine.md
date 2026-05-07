# Policy Engine

## What it is

The Policy Engine provides deny-by-default runtime control. It evaluates whether actions are allowed, denied, or require approval based on identity, risk tier, data class, tool, channel, consent, and business context.

## Why it matters

Enterprise AI needs enforceable controls, not just written guidance. Policies turn approval requirements, privacy constraints, risk rules, and human oversight into runtime decisions that can be explained and audited.

## How it works

A policy defines where it is enforced, which subjects and resources it applies to, which actions it governs, which conditions matter, what evidence is required, and what obligations follow from the decision.

Policy decisions should produce an outcome, reason, evidence references, and obligations such as consent capture, approval, redaction, notification, or audit logging.

## Manifest shape

```yaml
id: consent.required
version: 0.1.0
status: active
name: Consent Required
enforcementPoint: skill_invocation
decisionType: require_consent
appliesTo:
  - customer.change_plan
subject:
  types:
    - agent
resource:
  types:
    - skill
actions:
  - invoke
conditions:
  - field: context.consent.present
    operator: not_equals
    value: true
evidence:
  - consent_timestamp
  - consent_channel
obligations:
  - id: record_consent
    type: consent
    description: Record consent evidence before execution.
```

## Relationships

- Agents are subjects in policy decisions.
- Skills, tools, workflows, context scopes, systems, and UI manifests can be resources.
- Policies gate skill invocation, tool calls, workflow steps, context access, and system interactions.
- Workflows can pause for approval based on policy outcomes.
- Audit events should preserve policy decisions and obligations.
- Evaluations should test policy boundaries.

## Design rules

- Default to deny when policy is missing or ambiguous.
- Keep policy conditions declarative and explainable.
- Require evidence for high-impact decisions.
- Treat approval as a runtime obligation, not informal permission.
- Audit policy decisions, especially denials and approvals.

## Anti-patterns

- Encoding policy only in prompts.
- Treating approval as a comment rather than an enforceable state.
- Allowing broad bypass rules.
- Making policy decisions that cannot be explained.
- Skipping policy evaluation for mock or demo journeys.

## v0.1 scope

v0.1 defines policy concepts, starter policy schema, and fictional consent/high-risk examples. A full policy evaluation runtime, policy language, identity provider integration, and production approval system are deferred to later releases.
