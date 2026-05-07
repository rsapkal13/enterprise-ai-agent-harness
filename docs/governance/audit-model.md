# Audit Model

Audit records are governance evidence. They should be structured enough to reconstruct a journey without exposing unnecessary sensitive data.

## Structural Audit Events

Audit events should capture the structure of execution:

- Agent request
- Skill selected
- Policy decision
- Context access decision
- Tool call
- Workflow state change
- System interaction
- Human approval
- Output or side effect
- Evaluation reference
- Final outcome

## Engineering Trace vs Governance Audit

Engineering traces help operators debug and understand runtime behaviour. Governance audit records preserve evidence for review, accountability, and certification.

They should be correlated, but they are not the same thing. A trace can include detailed execution timing. An audit event should focus on decision evidence, actor, references, side effects, and outcome.

## What Should Be Captured

- Trace ID or correlation ID
- Timestamp
- Actor type and identifier
- Agent, skill, policy, tool, workflow, system, and evaluation references
- Policy outcome and obligations
- Approval status and approver role where applicable
- Tool side-effect category
- Workflow step and state
- Outcome and failure reason
- Kill-switch activation or override evidence when relevant

## What Should Be Opt-In Due To Privacy

Some data should only be captured when there is a clear need and an approved retention policy:

- Full prompts and model responses
- Raw user input
- Personal data
- Sensitive business data
- Full tool payloads
- Long-lived memory contents
- Attachments or documents

Prefer references, hashes, summaries, classifications, and evidence IDs over raw sensitive content.

## Trace ID Correlation

Audit events should include a trace or correlation ID so the full journey can be reconstructed across agent request, skill selection, policy checks, tool calls, workflow state, system interactions, approvals, and evaluations.

## Kill-Switch Evidence

If a capability is disabled or blocked, audit should preserve:

- Who or what triggered the kill switch
- Trigger reason
- Affected agents, skills, tools, workflows, or systems
- Effective time
- Outcome
- Required follow-up

## Retention Considerations

Retention should depend on risk tier, data class, regulatory exposure, and operational need. Public examples should not encode organisation-specific retention periods. They should show the pattern and leave exact policies to private implementation.
