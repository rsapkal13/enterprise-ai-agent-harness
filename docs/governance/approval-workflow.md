# Approval Workflow

Approval in AgentHarness is a governed process, not a form. Every agent earns its right to run, and approval creates binding runtime constraints.

## Flow

```text
┌─────────────────────────┐
│   Registration Request  │
│  (team submits agent,   │
│   skills, tools, scope) │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      Intake Gate        │  ← Is the request complete?
│                         │    Does it have owner, risk tier, skills declared?
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      Risk Tiering       │  ← T0 / T1 / T2 / T3
│                         │    Drives review depth and approval thresholds
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Domain Reviews        │  ← Privacy · Security · Legal · Architecture
│   (parallel or staged)  │    Each review produces approve / conditions / reject
└────────────┬────────────┘
             │
        ┌────┴─────┐
        │          │
        ▼          ▼
  Approved     Conditions
  (continue)   (return to team)
        │
        ▼
┌─────────────────────────┐
│   Agent Review Board    │  ← Cross-functional sign-off
│                         │    Required for T2 and T3 capabilities
└────────────┬────────────┘
             │
        ┌────┴─────────┐
        │              │
        ▼              ▼
     T0 / T1       T2 / T3
   (continue)   Executive Escalation
                       │
                       ▼
             ┌─────────────────────┐
             │  T3 Escalation Gate │
             └──────────┬──────────┘
                        │
                        ▼
┌─────────────────────────────────────┐
│    Pre-Production Certification     │  ← Evaluation against required scenarios
│                                     │    Tool-use paths, policy boundaries,
│                                     │    adversarial inputs, failure cases
└────────────────────┬────────────────┘
                     │
              ┌──────┴───────┐
              │              │
              ▼              ▼
         Certified       Not Certified
              │          (return to team)
              ▼
┌─────────────────────────┐
│   Registered & Active   │  ← Runtime constraints enforced:
│                         │    skills, tools, identity, context,
│                         │    audit obligations, eval requirements
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Continuous Observability│  ← Traces, audit events, evaluations,
│                         │    drift signals, operational evidence
└─────────────────────────┘
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
