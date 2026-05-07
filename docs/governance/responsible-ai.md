# Responsible AI

AgentHarness treats responsible AI as part of the execution model. The goal is to make AI capabilities explicit, reviewable, enforceable, observable, and improvable.

## Responsible AI Controls

- Ownership: Every agent, skill, policy, tool, workflow, system, and evaluation should have an accountable owner.
- Risk classification: Governance should scale from `T0` informational to `T3` high impact.
- Policy enforcement: Approval requirements should become runtime constraints.
- Human oversight: Human involvement should match the action's risk tier and blast radius.
- Privacy by design: Context should be limited to the minimum necessary scope.
- Auditability: Decisions, side effects, approvals, and outcomes should produce structured evidence.
- Evaluation: Behaviour should be certified before production and re-evaluated after meaningful changes.
- Lifecycle governance: Capabilities should move through intake, register, build, certify, operate, and retire.

## Public Specification Boundary

The public repository should define reusable governance patterns, schemas, examples, and code. It should not contain internal thresholds, legal interpretations, real customer data, credentials, private system names, or sensitive architecture details.

## Practical Questions

Responsible AI review should be able to answer:

- What can this agent do?
- Who owns it?
- What risk tier applies?
- Which policies are enforced?
- What data can it access?
- Which systems can it touch?
- What happens when a tool call fails?
- What evidence proves what happened?
- How is behaviour evaluated before and after release?
