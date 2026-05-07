# Creating A Workflow

A workflow coordinates a multi-step business journey across policies, tools, approvals, state transitions, and audit evidence.

## Steps

1. Define the journey objective.
2. Add policy checkpoints.
3. Add tool steps.
4. Add approval or confirmation steps.
5. Define success and failure transitions.
6. Add retry or compensation guidance.
7. Attach evaluations.
8. Ensure state changes are auditable.

## Example

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

## Design Checks

- Is every state-changing step explicit?
- Are approval and failure paths defined?
- Are tool calls governed by policy?
- Is compensation required for side effects?
- Can audit reconstruct the journey?
