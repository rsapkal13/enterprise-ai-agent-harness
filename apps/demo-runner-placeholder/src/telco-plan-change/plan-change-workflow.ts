import type { WorkflowV2Definition } from "../../../../packages/workflow-engine/src/step-definitions";

/**
 * Telco Customer-Care Plan Change Workflow
 *
 * A fictional customer journey for changing a mobile plan via an AI-assisted
 * care agent. Demonstrates:
 *
 * - Eligibility and contract lock-out checks
 * - AI-driven plan recommendation (skill step)
 * - Prorated billing calculation with compensation on failure
 * - Human approval gate for high-value plan downgrades (revenue protection)
 * - Provisioning with automatic rollback
 * - Notification dispatch and audit record
 *
 * No real telco systems, customer data, or operating procedures are used.
 */
export const planChangeWorkflow: WorkflowV2Definition = {
  id: "telco-plan-change",
  version: "0.2.0",
  policyId: "telco-care-policy",
  steps: [
    {
      kind: "tool",
      id: "fetch_customer_profile",
      toolId: "fetch_customer_profile",
      inputMapping: {
        customerId: "customerId",
        channel: "channel",
      },
      outputKey: "customer",
      timeoutMs: 5000,
    },
    {
      kind: "tool",
      id: "check_plan_eligibility",
      toolId: "check_plan_eligibility",
      inputMapping: {
        customerId: "customerId",
        currentPlanId: "customer.currentPlanId",
        requestedPlanId: "requestedPlanId",
      },
      outputKey: "eligibility",
      timeoutMs: 4000,
    },
    {
      // Block if customer is in contract lock-out period or has unpaid balance
      kind: "conditional",
      id: "eligibility_gate",
      condition: "context.eligibility.eligible === true",
      ifTrue: [],
      ifFalse: [
        {
          kind: "tool",
          id: "send_ineligibility_notice",
          toolId: "send_notification",
          inputMapping: {
            customerId: "customerId",
            templateId: "plan_change_ineligible",
            reason: "eligibility.reason",
          },
          outputKey: "noticeRef",
          timeoutMs: 3000,
        },
      ],
    },
    {
      kind: "skill",
      id: "recommend_plan_options",
      skillId: "recommend_plan_options",
      inputMapping: {
        customer: "customer",
        requestedPlanId: "requestedPlanId",
        usageHistory: "customer.usageHistory",
      },
      outputKey: "recommendation",
      timeoutMs: 10_000,
    },
    {
      kind: "tool",
      id: "calculate_proration",
      toolId: "calculate_proration",
      inputMapping: {
        customerId: "customerId",
        fromPlanId: "customer.currentPlanId",
        toPlanId: "requestedPlanId",
        effectiveDate: "effectiveDate",
      },
      outputKey: "proration",
      timeoutMs: 4000,
    },
    {
      // High-value downgrades (significant revenue drop) require team-lead approval
      kind: "conditional",
      id: "downgrade_approval_gate",
      condition: "context.proration.revenueImpact < -30",
      ifTrue: [
        {
          kind: "human_approval",
          id: "team_lead_approval",
          prompt:
            "Plan downgrade requested for customer {{customer.name}} ({{customerId}}). " +
            "Revenue impact: {{proration.revenueImpact}}% MRC change. " +
            "Requested: {{customer.currentPlanId}} → {{requestedPlanId}}. " +
            "AI recommendation: {{recommendation.summary}}",
          requiredRole: "care_team_lead",
          timeoutMs: 14_400_000, // 4 hours
        },
      ],
      ifFalse: [],
    },
    {
      kind: "tool",
      id: "provision_plan_change",
      toolId: "provision_plan_change",
      inputMapping: {
        customerId: "customerId",
        fromPlanId: "customer.currentPlanId",
        toPlanId: "requestedPlanId",
        effectiveDate: "effectiveDate",
        prorationRef: "proration.ref",
      },
      outputKey: "provisioningRef",
      compensationToolId: "rollback_plan_change",
      timeoutMs: 8000,
    },
    {
      kind: "tool",
      id: "apply_proration_credit",
      toolId: "apply_proration_credit",
      inputMapping: {
        customerId: "customerId",
        amount: "proration.creditAmount",
        currency: "proration.currency",
        provisioningRef: "provisioningRef",
      },
      outputKey: "creditRef",
      compensationToolId: "reverse_proration_credit",
      timeoutMs: 5000,
    },
    {
      kind: "tool",
      id: "send_confirmation",
      toolId: "send_notification",
      inputMapping: {
        customerId: "customerId",
        templateId: "plan_change_confirmed",
        newPlanId: "requestedPlanId",
        effectiveDate: "effectiveDate",
        creditRef: "creditRef",
      },
      outputKey: "confirmationRef",
      timeoutMs: 3000,
    },
    {
      kind: "tool",
      id: "create_audit_record",
      toolId: "create_audit_record",
      inputMapping: {
        workflowId: "workflowId",
        customerId: "customerId",
        fromPlanId: "customer.currentPlanId",
        toPlanId: "requestedPlanId",
        provisioningRef: "provisioningRef",
        creditRef: "creditRef",
        channel: "channel",
      },
      outputKey: "auditId",
      timeoutMs: 3000,
    },
  ],
};
