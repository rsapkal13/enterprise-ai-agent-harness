# Experience Manifest

## What it is

An Experience Manifest provides structured UI and channel guidance for agent-led journeys. It binds agents to approved components, channel behaviours, and interaction patterns rather than letting models freely generate arbitrary UI.

## Why it matters

User-facing AI journeys often require consent prompts, confirmations, approval panels, status views, and review screens. If those surfaces are generated ad hoc, governance and user experience become inconsistent.

## How it works

A manifest describes approved surfaces for a journey, such as confirmation, approval, review, and status. It can define fields, labels, required evidence, channel behaviour, and interaction constraints without requiring a specific frontend framework.

The manifest should guide rendering and interaction, not become a prompt for unrestricted UI generation.

## Manifest shape

```yaml
id: confirm-plan-change
version: 0.1.0
status: active
name: Confirm Plan Change
journeyId: customer.change_plan.workflow
surfaces:
  - id: customer_confirmation
    type: confirmation
    title: Confirm requested plan change
    fields:
      - current_plan
      - proposed_plan
      - monthly_price_delta
      - consent_statement
  - id: agent_review
    type: review
    title: Review policy and eligibility results
    fields:
      - eligibility_status
      - policy_decisions
      - audit_reference
```

## Relationships

- Workflows can reference UI manifests for approval, confirmation, review, and status steps.
- Policies can require specific consent or approval surfaces.
- Skills can declare expected user-facing interactions.
- Audit events can reference UI confirmation and approval evidence.
- Evaluations can check whether required surfaces appeared in the journey.

## Design rules

- Use approved components and interaction patterns.
- Keep manifests framework-neutral.
- Bind surfaces to workflows and policies.
- Make confirmation and approval evidence explicit.
- Avoid exposing sensitive data beyond what the surface requires.

## Anti-patterns

- Letting models generate arbitrary production UI.
- Hiding consent language in free-form prompts.
- Building approval screens that do not create audit evidence.
- Using one generic surface for every journey.
- Hard-coding channel-specific behaviour into public examples.

## v0.1 scope

v0.1 defines the experience manifest concept, starter UI manifest schema, and a fictional confirmation/review manifest. Rendering engines, component libraries, and production channel integrations are deferred to later releases.
