# Approval Workflow

Approval in AgentHarness is a governed process, not a form. Every agent earns its right to run, and approval creates binding runtime constraints.

## Flow

```text
Registration request
-> Intake gate
-> Risk tiering
-> Privacy / Security / Legal / Architecture review
-> Review decision gate
-> Agent Review Board
-> T3 executive escalation where required
-> Pre-production certification
-> Registered and active
-> Continuous observability
```

## Principles

## Every Agent Earns Its Right To Run

An agent should not become active because it exists in code. It should become active because its purpose, owner, skills, tools, context, policies, evaluation results, and audit obligations are clear enough to govern.

## Approval Is A Governed Process, Not A Form

Approval should consider risk tier, data access, system access, autonomy level, lifecycle state, policy requirements, and evidence from evaluation.

## Approval Creates Binding Runtime Constraints

Approval should produce constraints that runtime components can enforce, including allowed skills, allowed tools, identity scope, context access, workflow boundaries, approval requirements, and audit obligations.

## Rejection Is A First-Class Governance Outcome

Not every request should proceed. Rejection should be recorded with a reason and next steps, such as reducing scope, changing risk controls, adding evaluations, or redesigning the workflow.

## Scope Changes Require Re-Approval

Changes to skills, tools, systems, context scopes, autonomy level, channel, risk tier, workflow side effects, or data class should trigger re-review.

## Certification Is Required Before Active State

Pre-production certification should confirm that the registered capability behaves as expected across required scenarios, policy boundaries, tool-use paths, and failure cases.

## Observability Continues After Approval

Approval is not the end of governance. Active capabilities should produce traces, audit events, evaluation results, drift signals, and operational evidence.
