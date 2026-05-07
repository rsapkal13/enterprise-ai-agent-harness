# Human in the Loop

Human oversight should be modeled as a first-class governance control. The right pattern depends on risk tier, reversibility, data sensitivity, blast radius, autonomy level, and regulatory exposure.

## Oversight Modes

## Human-Led

A human performs the action. The agent may assist by summarizing, drafting, recommending, or preparing evidence.

## Human-In-The-Loop

The agent can prepare or progress a journey, but a human must approve before a specific action or side effect occurs.

## Human-On-The-Loop

The agent can act within approved boundaries while a human monitors, reviews exceptions, and can intervene or stop execution.

## Fully Autonomous

The agent can execute within pre-approved policy, identity, tool, context, and workflow boundaries without per-action human review. This should be limited to well-bounded, evaluated, and observable capabilities.

## HIL Thresholds By Risk Tier

| Tier | Typical oversight |
| --- | --- |
| `T0` | Human-led or autonomous read-only assistance |
| `T1` | Human-on-the-loop, with approval for exceptions |
| `T2` | Human-in-the-loop for selected transactional steps |
| `T3` | Human-in-the-loop before high-impact execution, with escalation where required |

## Actions That Should Require Approval

- State-changing transactions with meaningful customer, financial, legal, safety, or access impact
- Actions that cannot be easily reversed
- Use of sensitive context beyond normal scope
- High-blast-radius operations
- Policy exceptions or overrides
- Kill-switch deactivation
- Escalation from recommendation to execution

## Auditing Approval Interrupts

Approval interrupts should produce audit evidence:

- Workflow step and trace ID
- Policy that required approval
- Action being approved
- Approver role or reviewer group
- Decision outcome
- Timestamp
- Evidence reviewed
- Obligations created

Public examples should use fictional roles and evidence references rather than real contacts or operational groups.
