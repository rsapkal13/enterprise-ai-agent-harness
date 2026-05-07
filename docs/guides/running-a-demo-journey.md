# Running A Demo Journey

The v0.1 release does not include a runtime. Demo journeys are specification examples only.

## Current v0.1 Approach

For now, read the YAML files in `examples/telco-customer-care/` as a complete fictional journey.

Recommended reading order:

1. `examples/telco-customer-care/README.md`
2. `agents/customer-service-agent.yaml`
3. `skills/customer-change-plan.yaml`
4. `policies/consent-required.yaml`
5. `tools/billing-calculate-price-delta.yaml`
6. `workflows/change-plan.workflow.yaml`
7. `systems/mock-billing-system.yaml`
8. `audit-events/plan-change-tool-call.yaml`
9. `evaluations/plan-change-completed.yaml`
10. `ui-manifests/confirm-plan-change.yaml`

## What To Look For

- How the agent references skills
- How the skill references policies, tools, context, workflow, and evaluations
- How tools reference systems and schemas
- How the workflow coordinates policy and tool steps
- How audit events preserve evidence

## Future Runtime Scope

Future releases should add a local runner that can load, validate, and simulate the flow using mock tools. It should not call real systems or require credentials.

## Public Safety

Demo journeys must remain fictional. Do not add real customer data, private system names, credentials, legal interpretations, or internal operational contacts.
