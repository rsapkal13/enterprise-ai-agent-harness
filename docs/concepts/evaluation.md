# Evaluation

## What it is

Evaluation is certification before production and continuous checking after release. It tests agent behaviour across scenarios, tool-use paths, policy boundaries, adversarial inputs, and regression cases.

## Why it matters

Enterprise AI capabilities should not rely on a single happy-path demo. Teams need evidence that an agent can use approved skills, respect policies, handle tool failures, avoid unsafe actions, and continue meeting quality expectations over time.

## How it works

Evaluation definitions describe what should be tested and what success looks like. Evaluation results record whether a specific agent, skill, tool, workflow, policy, or journey passed, failed, or needs review.

Evaluations should run before production and after meaningful changes to prompts, models, policies, tools, workflows, context, or system integrations.

## Manifest shape

```yaml
id: policy_compliance
version: 0.1.0
status: active
name: Policy Compliance
description: Check whether required policies produce evidence before tool execution.
targetType: journey
metricType: compliance
successCriteria: Consent and high-risk policy decisions are present before order submission.
evidence:
  - policy_decision_event
  - workflow_state_event
```

## Relationships

- Agents reference evaluation packs or required evaluations.
- Skills declare evaluation requirements.
- Policies should be tested for allow, deny, consent, and approval paths.
- Tools should be tested for schema compliance and safe failure behaviour.
- Workflows should be tested for completion, rollback, and approval paths.
- Audit and trace records provide evidence for evaluation results.

## Design rules

- Evaluate before production and after significant changes.
- Include policy boundary and tool-use scenarios.
- Include adversarial and regression cases.
- Make success criteria explicit.
- Connect evaluation results to traces and audit evidence.

## Anti-patterns

- Treating one demo as certification.
- Evaluating only model output text while ignoring tool use.
- Skipping deny and approval scenarios.
- Running evaluations that do not map to business or governance outcomes.
- Failing to re-evaluate after policy, tool, workflow, or model changes.

## v0.1 scope

v0.1 defines evaluation concepts, starter evaluation schema, and fictional evaluation examples. Automated evaluation runners, scoring engines, certification workflows, and production regression suites are deferred to later releases.
