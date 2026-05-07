# Defining A Skill

A skill is a reusable business capability that an agent can request. It should describe what the agent can do, which controls apply, and how success is evaluated.

## Steps

1. Choose a stable ID.
2. Define the business purpose.
3. Assign an owner and lifecycle status.
4. Classify the risk tier.
5. Declare required context scopes.
6. Attach policies.
7. Bind approved tools.
8. Reference a workflow if the capability is multi-step.
9. Add evaluation requirements.

## Example

```yaml
id: customer.change_plan
version: 0.1.0
status: active
name: Change Customer Plan
owner: customer-care-platform
riskTier: T2
description: Change a fictional customer's plan after consent and eligibility checks.
allowedAgents:
  - customer-service-agent
contextScopes:
  - customer.summary
  - account.entitlements
policies:
  - consent.required
  - high_risk.action
tools:
  - eligibility.check_plan_change
  - billing.calculate_price_delta
workflow: customer.change_plan.workflow
evaluations:
  - plan_change_completed
```

## Design Checks

- Is this a business capability rather than a raw tool?
- Is the owner clear?
- Does the risk tier match the action?
- Are policy checks explicit?
- Are tool bindings narrow?
- Can the skill be evaluated before production?
