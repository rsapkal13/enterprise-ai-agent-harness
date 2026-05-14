import type { MockToolHandler } from "../../../../packages/tool-gateway/src/adapters/mock-adapter";

/**
 * Fictional tool handlers for the Telco Plan Change journey.
 * Returns realistic-looking data without calling any real systems.
 */

export const telcoPlanChangeHandlers: Record<string, MockToolHandler> = {
  fetch_customer_profile: async (input) => ({
    id: input["customerId"],
    name: "Alex Morgan",
    currentPlanId: "PLAN-UNLIM-50",
    currentPlanName: "Unlimited 50GB",
    monthlyRecurringCharge: 49.99,
    contractEndDate: "2026-01-15",
    accountStatus: "active",
    usageHistory: {
      avgDataGb: 18.4,
      avgCallMinutes: 210,
      avgSmsCount: 85,
    },
    loyaltyYears: 3,
  }),

  check_plan_eligibility: async (input) => {
    // Simulate contract lock-out for a specific plan pair
    const requestedPlan = input["requestedPlanId"] as string;
    const eligible = requestedPlan !== "PLAN-BASIC-10";
    return {
      eligible,
      reason: eligible
        ? "Customer is out of contract and has no unpaid balance."
        : "Plan PLAN-BASIC-10 is not available for upgrade-path customers with 3+ loyalty years.",
      checkedAt: new Date().toISOString(),
    };
  },

  recommend_plan_options: async (input) => {
    const customer = input["customer"] as Record<string, unknown>;
    const usage = customer["usageHistory"] as Record<string, unknown>;
    const avgData = (usage?.["avgDataGb"] as number) ?? 0;
    return {
      recommendedPlanId: avgData > 15 ? "PLAN-UNLIM-100" : "PLAN-MID-30",
      summary:
        `Based on ${avgData}GB average monthly usage, we recommend upgrading to a higher data tier ` +
        `for headroom. The requested plan change is within acceptable bounds.`,
      alternativePlans: ["PLAN-UNLIM-100", "PLAN-MID-30", "PLAN-VALUE-20"],
    };
  },

  calculate_proration: async (input) => {
    const toPlanId = input["toPlanId"] as string;
    // Downgrade scenario produces negative revenue impact
    const isDowngrade = (toPlanId ?? "").includes("BASIC");
    return {
      ref: `PROR-${Date.now()}`,
      creditAmount: isDowngrade ? 12.50 : 4.17,
      currency: "GBP",
      revenueImpact: isDowngrade ? -38 : 5,
      effectiveDate: input["effectiveDate"] ?? new Date().toISOString(),
    };
  },

  provision_plan_change: async (input) => ({
    ref: `PROV-${Date.now()}`,
    customerId: input["customerId"],
    fromPlanId: input["fromPlanId"],
    toPlanId: input["toPlanId"],
    status: "provisioned",
    provisionedAt: new Date().toISOString(),
    activatesAt: input["effectiveDate"] ?? new Date().toISOString(),
  }),

  rollback_plan_change: async (input) => ({
    ref: input["provisioningRef"],
    status: "rolled_back",
    rolledBackAt: new Date().toISOString(),
  }),

  apply_proration_credit: async (input) => ({
    creditRef: `CRED-${Date.now()}`,
    customerId: input["customerId"],
    amount: input["amount"],
    currency: input["currency"],
    status: "applied",
    appliedAt: new Date().toISOString(),
  }),

  reverse_proration_credit: async (input) => ({
    creditRef: input["creditRef"],
    status: "reversed",
    reversedAt: new Date().toISOString(),
  }),

  send_notification: async (input) => ({
    notificationRef: `NOTIF-${Date.now()}`,
    customerId: input["customerId"],
    templateId: input["templateId"],
    channel: "email",
    sentAt: new Date().toISOString(),
    status: "delivered",
  }),

  create_audit_record: async (input) => ({
    auditId: `AUDIT-${Date.now()}`,
    workflowId: input["workflowId"],
    fields: Object.keys(input),
    recordedAt: new Date().toISOString(),
  }),
};
