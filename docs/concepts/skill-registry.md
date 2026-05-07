# Skill Registry

## What it is

The Skill Registry defines reusable business capabilities for agents. A skill describes what an agent can do, expected inputs and outputs, required context, policy constraints, tool bindings, workflow requirements, and evaluation requirements.

## Why it matters

Skills create a business-level control point between agents and tools. Instead of approving raw tool access, an organisation can approve a capability such as changing a plan, checking eligibility, opening a case, or summarising an account.

## How it works

An agent requests a registered skill. The skill record declares the policies, context scopes, tools, workflow, and evaluations that apply. Runtime components can use the skill record to decide what checks and evidence are required before any system interaction occurs.

Skills are not prompts. They are governed capability contracts.

## Manifest shape

```yaml
id: customer.change_plan
version: 0.1.0
status: active
name: Change Customer Plan
owner: customer-care-platform
riskTier: T2
description: Change a fictional customer's plan after consent and eligibility checks.
inputs:
  - accountReference
  - requestedPlanId
outputs:
  - orderReference
  - status
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

## Relationships

- Agents are approved to use specific skills.
- Skills reference policies, tools, workflows, context scopes, and evaluations.
- Policies decide whether a skill invocation can proceed.
- Tools provide the governed system interactions required by the skill.
- Workflows coordinate multi-step execution for the skill.
- Audit records should reference the skill selected and the outcome.

## Design rules

- Model skills as business capabilities, not technical functions.
- Declare required context explicitly.
- Bind tools through skills instead of granting tools directly to agents.
- Attach policy and evaluation requirements to each meaningful skill.
- Assign ownership and risk tier to every skill.

## Anti-patterns

- Creating one generic skill that can do anything.
- Hiding tool bindings inside prompts.
- Allowing high-impact skills without policy checks.
- Treating skill success as completion without evaluation.
- Omitting owner, lifecycle status, or risk tier.

## v0.1 scope

v0.1 defines the skill registry concept, starter schema, and fictional customer-care skill examples. Runtime skill resolution, dynamic planning, and production registry storage are deferred to later releases.
