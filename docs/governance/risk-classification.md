# Risk Classification

AgentHarness uses risk classification to decide which governance controls are required before and during execution.

The principle is simple: governance scales with risk, not bureaucracy. Low-impact informational capabilities should be easy to register and evaluate. High-impact transactional capabilities should require deeper approval, stronger identity controls, human oversight, and more complete audit evidence.

## Risk Tiers

| Tier | Name | Description |
| --- | --- | --- |
| `T0` | Informational | Reads or summarizes approved information without changing state. |
| `T1` | Bounded operational | Performs limited operational actions with low blast radius and clear rollback. |
| `T2` | Transactional | Changes business or customer state, submits requests, or triggers workflow actions. |
| `T3` | High impact | Can materially affect financial, legal, safety, access, security, or customer outcomes. |

## Assessment Dimensions

Use these dimensions when assigning a tier:

- Action reversibility: Can the action be undone quickly and safely?
- Data sensitivity: What classification of data is accessed or produced?
- Blast radius: How many users, customers, systems, or processes could be affected?
- Autonomy level: Is the agent recommending, drafting, executing with approval, or executing independently?
- Regulatory exposure: Could the action affect regulated obligations, legal rights, safety, or compliance duties?

## Controls That Scale By Tier

| Control | T0 | T1 | T2 | T3 |
| --- | --- | --- | --- | --- |
| Approval depth | Lightweight review | Owner approval | Governance review | Executive or senior risk escalation where required |
| Evaluation depth | Basic examples | Scenario checks | Tool and policy path tests | Adversarial, regression, and approval-path certification |
| Identity controls | Read-scoped identity | Bounded action identity | Transaction-scoped identity | Strict scoped identity with additional controls |
| Human oversight | Optional | On exception | Required for selected actions | Required before high-impact execution |
| Observability requirements | Trace basic request | Trace tool usage | Trace and audit decisions | Full trace, audit, approval, and side-effect evidence |
| Recertification requirements | On major change | Periodic or scope change | Periodic and policy/tool change | Frequent, plus model/tool/workflow/context changes |

## Design Notes

- Risk tier should apply to agents, skills, tools, workflows, and system interactions.
- The highest-risk link in a journey should influence the required controls.
- Tiering should be explainable in registry records.
- Scope changes should trigger re-review when they increase risk.
