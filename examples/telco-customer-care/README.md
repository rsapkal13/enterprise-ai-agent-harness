# Telco Customer Care Example

This fictional example shows how Enterprise AI Agent Harness can describe a governed customer-care plan-change journey.

The example is intentionally generic. It uses fictional systems, mock tools, public-safe identifiers, and reusable governance concepts. It does not contain real customer data, real APIs, credentials, private architecture details, or organisation-specific approval rules.

## Journey Flow

```text
customer-service-agent
-> customer.change_plan skill
-> consent.required, customer_data.access, high_risk.action policies
-> profile, eligibility, price-delta, and change-request tools
-> customer.change_plan.workflow
-> fictional CRM, product catalogue, billing, and order systems
-> audit events and evaluation evidence
```

## What The Journey Demonstrates

1. A customer-service agent with approved skills and tools.
2. A plan-change skill that binds context, policies, tools, workflow, and evaluations.
3. Governed tools for reading limited profile data, checking eligibility, calculating price delta, and preparing a change request.
4. Policies for consent, high-risk actions, and customer data access.
5. A workflow with eligibility, price delta, customer confirmation, approval where required, and final request preparation.
6. System records for fictional CRM, billing, product catalogue, and order systems.
7. Context scopes for customer, session, and entitlement context.
8. Audit event examples showing allowed, blocked, and approval-required outcomes.
9. Evaluation examples showing scenario packs and trajectory checks.
10. A UI manifest for customer confirmation.

## Files

- `agents/customer-service-agent.yaml`
- `skills/customer-change-plan.yaml`
- `skills/customer-check-balance.yaml`
- `skills/customer-replace-sim.yaml`
- `tools/customer-read-limited-profile.yaml`
- `tools/eligibility-check-plan-change.yaml`
- `tools/billing-calculate-price-delta.yaml`
- `tools/order-prepare-plan-change-request.yaml`
- `policies/consent-required.yaml`
- `policies/customer-data-access.yaml`
- `policies/high-risk-action.yaml`
- `workflows/change-plan.workflow.yaml`
- `systems/fictional-crm-system.yaml`
- `systems/fictional-billing-system.yaml`
- `systems/fictional-product-catalogue-system.yaml`
- `systems/fictional-order-system.yaml`
- `context-scopes/customer-summary.yaml`
- `context-scopes/session-context.yaml`
- `context-scopes/account-entitlements.yaml`
- `audit-events/plan-change-allowed.yaml`
- `audit-events/plan-change-blocked.yaml`
- `audit-events/plan-change-approval-required.yaml`
- `evaluations/plan-change-evaluation-pack.yaml`
- `evaluations/plan-change-trajectory-checks.yaml`
- `ui-manifests/confirm-plan-change.yaml`

## v0.1 Scope

This is a specification example only. It does not execute tools, run workflows, call systems, or evaluate policies at runtime.
