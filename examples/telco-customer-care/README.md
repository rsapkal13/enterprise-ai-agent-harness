# Telco Customer Care Example

This fictional example shows how the harness can describe a customer-care plan-change journey.

The journey is intentionally generic. It uses fictional identifiers, mock tools, and reusable governance concepts. It does not contain real customer data, private APIs, credentials, or organisation-specific architecture.

## Journey

1. A customer-service agent requests the `customer.change_plan` skill.
2. Consent and risk policies are evaluated.
3. Eligibility and price-delta tools are called.
4. A confirmation UI manifest presents the proposed change.
5. The workflow submits the plan change through a governed tool.
6. Audit and evaluation events are recorded by future runtime components.

## Files

- `agents/customer-service-agent.yaml`
- `skills/customer-check-balance.yaml`
- `skills/customer-change-plan.yaml`
- `skills/customer-replace-sim.yaml`
- `tools/eligibility-check-plan-change.yaml`
- `tools/billing-calculate-price-delta.yaml`
- `tools/order-submit-plan-change.yaml`
- `systems/mock-billing-system.yaml`
- `systems/mock-order-system.yaml`
- `systems/mock-eligibility-system.yaml`
- `context/customer-summary.yaml`
- `context/account-entitlements.yaml`
- `context/active-case.yaml`
- `policies/consent-required.yaml`
- `policies/high-risk-action.yaml`
- `workflows/change-plan.workflow.yaml`
- `audit-events/plan-change-policy-decision.yaml`
- `audit-events/plan-change-tool-call.yaml`
- `evaluations/plan-change-completed.yaml`
- `ui-manifests/confirm-plan-change.yaml`
