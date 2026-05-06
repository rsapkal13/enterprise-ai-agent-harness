# Agent, Skill, Tool, and Policy Model

The harness uses a simple relationship:

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

- Agent: an AI actor with a business identity, technical identity, channels, and allowed skills
- Skill: a registered business capability with inputs, risk, ownership, and tool dependencies
- Policy: a rule or decision contract that evaluates whether execution may continue
- Tool: a governed wrapper around a system action or data lookup
- Workflow: a stateful journey that coordinates steps, approvals, retries, and compensation
- System: a registered external platform, data source, service, or operational boundary used by tools
- Audit: structured evidence of requests, decisions, actions, system interactions, outcomes, and evaluations

## Relationship Rules

- Agents should reference skills rather than raw tools.
- Skills should declare tools, policies, risk, ownership, and evaluation expectations.
- Policies should produce auditable decisions and obligations.
- Tools should declare their target systems and side-effect profile.
- Workflows should make state transitions, approvals, and completion criteria explicit.
- Systems should declare ownership, trust level, integration type, and data classification.
- Audit events should preserve the evidence needed to reconstruct the journey.
