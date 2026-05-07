# Defining A Policy

A policy describes a decision rule or control requirement. It should explain when an action is allowed, denied, or requires consent or approval.

## Steps

1. Define the enforcement point.
2. Identify the subject, resource, and action.
3. Add conditions.
4. Define decision outcome.
5. List evidence requirements.
6. Add obligations.
7. Ensure the policy decision can be audited.

## Example

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

## Design Checks

- Is the policy explainable to both technical and governance reviewers?
- Does it specify what evidence is required?
- Does it create runtime obligations?
- Does it avoid hidden exceptions?
- Can decisions be audited?
