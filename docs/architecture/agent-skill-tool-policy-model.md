# Agent, Skill, Policy, Tool, Workflow, System, and Audit Model

The core operating model is:

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

This model keeps business capability, governance, execution, system access, and evidence connected.

## Agent

An agent is an AI actor with a business purpose, owner, lifecycle state, risk tier, approved channels, allowed skills, and scoped workload identity.

Agents should not be granted direct access to raw enterprise systems. They should operate through registered skills and governed runtime controls.

## Skill

A skill is a reusable business capability that an agent can request.

Skills define what the agent can do, expected inputs and outputs, required context, policy constraints, tool bindings, workflow requirements, and evaluation expectations. A skill is not just a prompt; it is a governed capability contract.

## Policy

A policy is a decision contract that evaluates whether an action is allowed, denied, or requires consent or approval.

Policies can consider subject, resource, action, risk tier, context, data classification, channel, identity, and workflow state. Policy outcomes should produce explanations, obligations, and audit evidence.

## Tool

A tool is a governed wrapper around a system action, lookup, data access path, workflow command, API, or MCP tool.

Tools should declare their target system, input and output schemas, side-effect profile, data classification, risk level, rate limits, policy requirements, and audit requirements.

## Workflow

A workflow coordinates a multi-step journey.

Workflows define state, step order, policy checkpoints, tool calls, approvals, retries, compensation, escalation paths, completion criteria, and customer-visible status where relevant.

## System

A system is a registered enterprise platform, data source, service, workflow tool, knowledge store, or operational boundary.

System records should describe ownership, trust level, integration type, data classification, and lifecycle state without exposing private architecture details in the public repository.

## Audit

Audit is structured evidence of what happened.

Audit events should capture agent requests, skill selections, policy decisions, tool calls, workflow states, system interactions, approvals, outputs, side effects, outcomes, and evaluation references. Audit is governance evidence, not just debugging output.

## How They Link Together

- Agents reference approved skills.
- Skills reference policies, tools, workflows, context scopes, and evaluations.
- Policies evaluate whether execution can proceed and what obligations apply.
- Tools reference systems and schemas.
- Workflows reference policy steps, tool steps, approval steps, UI manifests, and evaluation requirements.
- Systems define the operational boundary of tool calls.
- Audit events reference the agent, skill, policy, tool, workflow, system, and outcome where applicable.

The linkages make it possible to answer practical governance questions:

- Who owns this capability?
- Which agent can use it?
- Which policy allowed or blocked it?
- Which system was touched?
- What side effect occurred?
- Was human approval required?
- What evidence proves the journey outcome?

## Example Fictional Customer-Care Flow

```text
Customer Service Agent
-> customer.change_plan skill
-> consent.required and high_risk.action policies
-> eligibility, billing, and order tools
-> change-plan workflow
-> mock eligibility, billing, and order systems
-> policy decision, tool call, workflow state, and outcome audit events
```

In this flow:

1. A customer-service agent requests the `customer.change_plan` skill.
2. The skill declares required policies, tools, context scopes, workflow, and evaluations.
3. Consent and high-risk policies decide whether execution can continue.
4. Governed tools check eligibility, calculate price delta, and submit the order.
5. A workflow coordinates confirmation, approval, tool execution, and completion.
6. Tools interact with registered fictional systems.
7. Audit events preserve evidence of policy decisions, tool calls, and outcomes.

The example is deliberately fictional and public-safe.

## Common Anti-Patterns

- Giving agents direct credentials to enterprise systems
- Treating prompts as the only governance boundary
- Registering tools without business capabilities
- Calling high-impact tools without policy checks
- Treating approval as informal permission instead of runtime constraints
- Logging text output without structured audit evidence
- Evaluating only after production incidents
- Hard-coding private system names or approval thresholds into public examples
- Building demos that bypass identity, policy, workflow, and audit controls
