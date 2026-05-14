import type { WorkflowV2Definition } from "../../../packages/workflow-engine/src/step-definitions";

/**
 * Banking Card Dispute Workflow Definition
 *
 * A fictional end-to-end dispute journey demonstrating:
 * - Tool step execution with input/output mapping
 * - Risk-based conditional routing
 * - Human approval gate for high-risk cases
 * - Compensation (reverse provisional credit on failure)
 * - Full audit trail
 *
 * No real bank data or private operating procedures are used.
 */
export const cardDisputeWorkflow: WorkflowV2Definition = {
  id: "banking-card-dispute",
  version: "0.2.0",
  policyId: "banking-dispute-policy",
  steps: [
    {
      kind: "tool",
      id: "fetch_transaction_details",
      toolId: "fetch_transaction_details",
      inputMapping: {
        transactionId: "transactionId",
        customerId: "customerId",
      },
      outputKey: "transaction",
      timeoutMs: 5000,
    },
    {
      kind: "tool",
      id: "classify_risk",
      toolId: "classify_risk",
      inputMapping: {
        transaction: "transaction",
        customerId: "customerId",
      },
      outputKey: "riskScore",
      timeoutMs: 3000,
    },
    {
      kind: "conditional",
      id: "risk_routing",
      condition: "context.riskScore >= 0.7",
      ifTrue: [
        {
          kind: "human_approval",
          id: "fraud_analyst_review",
          prompt:
            "High-risk card dispute requires analyst review. Transaction: {{transaction.merchantName}}, Amount: {{transaction.amount}}. Risk score: {{riskScore}}.",
          requiredRole: "fraud_analyst",
          timeoutMs: 86_400_000, // 24 hours
        },
      ],
      ifFalse: [],
    },
    {
      kind: "tool",
      id: "gather_evidence",
      toolId: "gather_evidence",
      inputMapping: {
        transactionId: "transaction.id",
        riskScore: "riskScore",
      },
      outputKey: "evidence",
      timeoutMs: 8000,
    },
    {
      kind: "skill",
      id: "generate_dispute_summary",
      skillId: "generate_dispute_summary",
      inputMapping: {
        transaction: "transaction",
        evidence: "evidence",
        riskScore: "riskScore",
      },
      outputKey: "summary",
      timeoutMs: 10_000,
    },
    {
      kind: "tool",
      id: "initiate_provisional_credit",
      toolId: "initiate_provisional_credit",
      inputMapping: {
        customerId: "customerId",
        amount: "transaction.amount",
        currency: "transaction.currency",
        reason: "summary",
      },
      outputKey: "creditRef",
      compensationToolId: "reverse_provisional_credit",
      timeoutMs: 5000,
    },
    {
      kind: "tool",
      id: "create_audit_record",
      toolId: "create_audit_record",
      inputMapping: {
        workflowId: "workflowId",
        customerId: "customerId",
        transactionId: "transaction.id",
        creditRef: "creditRef",
        riskScore: "riskScore",
        summary: "summary",
      },
      outputKey: "auditId",
      timeoutMs: 3000,
    },
  ],
};
