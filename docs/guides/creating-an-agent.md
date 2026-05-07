# Creating An Agent

An agent record defines identity, ownership, purpose, risk tier, lifecycle state, approved skills, channels, and boundaries.

## Steps

1. Name the agent and assign an owner.
2. Describe its purpose.
3. Choose a risk tier.
4. Declare supported channels.
5. Add allowed skills.
6. Declare context scopes and data classes.
7. Reference runbooks, rollback plans, and evaluation packs where useful.
8. Keep provider-specific prompt details out of the registry unless they are portable metadata.

## Example

```yaml
id: customer-service-agent
version: 0.1.0
status: active
name: Customer Service Agent
owner: customer-care-platform
purpose: Assist with fictional customer-care journeys.
riskTier: T2
channels:
  - web
  - contact-center
allowedSkills:
  - customer.change_plan
contextScopes:
  - customer.summary
  - account.entitlements
dataClasses:
  - confidential
evaluationPacks:
  - customer-care-regression
retirementStatus: not_retired
```

## Design Checks

- Can a reviewer understand what the agent is for?
- Are allowed skills explicit?
- Is the risk tier justified?
- Is the workload identity scope clear enough for future runtime enforcement?
- Is there a retirement path?
