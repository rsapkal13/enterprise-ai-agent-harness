# Agent Registry

## What it is

The Agent Registry is the authoritative record for every agent. It defines ownership, purpose, risk tier, lifecycle state, approved skills, approved tools, channels, data classes, runbooks, rollback plans, evaluation pack references, and retirement status.

## Why it matters

Enterprise teams need to know which agents exist, who owns them, what they are allowed to do, and when they should be retired. Without an agent registry, permissions tend to live in prompts, code, or informal documents that are difficult to govern.

## How it works

An agent record describes the agent as a governed business and technical actor. Runtime systems can use the record to check allowed skills, permitted channels, workload identity, risk tier, context scopes, and lifecycle status before execution.

The registry should be reviewed before production use and updated as an agent changes scope.

## Manifest shape

```yaml
id: customer-service-agent
version: 0.1.0
status: active
name: Customer Service Agent
owner: customer-care-platform
purpose: Assist with fictional customer-care journeys
riskTier: T2
channels:
  - web
  - contact-center
allowedSkills:
  - customer.change_plan
approvedTools:
  - eligibility.check_plan_change
  - billing.calculate_price_delta
dataClasses:
  - confidential
runbooks:
  - customer-care-agent-operations
rollbackPlans:
  - manual-review
evaluationPacks:
  - customer-care-regression
retirementStatus: not_retired
```

## Relationships

- Agents request skills.
- Skills constrain which tools, policies, workflows, context scopes, and evaluations apply.
- Policies evaluate whether the agent can act.
- Tools execute through scoped identity and system boundaries.
- Workflows coordinate the agent's multi-step journeys.
- Audit events record agent requests, decisions, approvals, and outcomes.

## Design rules

- Register agents before they can execute governed skills.
- Assign an owner and lifecycle state to every agent.
- Bind agents to scoped workload identity rather than broad shared credentials.
- Declare allowed skills explicitly.
- Make risk tier and data classes visible to governance and runtime checks.
- Define retirement status so inactive agents can be removed safely.

## Anti-patterns

- Letting an agent call tools directly without approved skills.
- Treating prompt text as the agent's permission model.
- Using shared credentials across multiple agents.
- Running agents without an owner or retirement path.
- Hiding allowed channels, data classes, or risk tier in code.

## v0.1 scope

v0.1 defines the agent registry concept, starter schema, documentation, and fictional examples. Runtime identity enforcement, production registry storage, and lifecycle automation are deferred to later releases.
