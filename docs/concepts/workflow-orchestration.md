# Workflow Orchestration

## What it is

Workflow Orchestration provides controlled multi-step execution. It coordinates journeys with state, approvals, retries, compensation, escalation paths, and customer-visible status.

## Why it matters

Many enterprise AI actions are not single tool calls. They involve checks, approvals, state changes, fallbacks, rollback, and evidence collection. Workflows make those journeys explicit and governable.

## How it works

A workflow defines ordered steps such as policy checks, tool calls, decisions, approvals, and completion. Each step can describe inputs, outputs, success and failure transitions, approval requirements, and compensation guidance.

AgentHarness can integrate with existing workflow engines later. The public specification defines the portable journey shape first.

## Manifest shape

```yaml
id: customer.change_plan.workflow
version: 0.1.0
status: active
name: Customer Plan Change Workflow
steps:
  - id: confirm_consent
    type: policy
    policy: consent.required
    onSuccess: check_eligibility
    onFailure: stop
  - id: check_eligibility
    type: tool
    tool: eligibility.check_plan_change
    failureBehavior: manual_review
  - id: submit_order
    type: tool
    tool: order.submit_plan_change
    compensation:
      strategy: manual_review
  - id: complete
    type: completion
evaluations:
  - plan_change_completed
```

## Relationships

- Skills can reference workflows.
- Workflows contain policy, tool, approval, decision, and completion steps.
- Tools interact with systems inside workflow boundaries.
- Policies can pause or redirect workflow execution.
- UI manifests can define confirmation and approval surfaces.
- Audit events should record workflow state changes.
- Evaluations can measure workflow completion and compliance.

## Design rules

- Use workflows for multi-step or state-changing journeys.
- Make approval and failure paths explicit.
- Define compensation for high-impact side effects.
- Keep workflow state auditable.
- Avoid binding the public spec to one workflow vendor.

## Anti-patterns

- Hiding multi-step journeys in one tool call.
- Treating retries and rollback as afterthoughts.
- Letting agents decide approval paths dynamically without policy.
- Skipping audit events for workflow transitions.
- Building demos that bypass workflow state for high-impact actions.

## v0.1 scope

v0.1 defines workflow concepts, starter schema, and a fictional customer-care workflow. Durable execution, timers, queues, workflow engine adapters, and production compensation logic are deferred to later releases.
