import type { ToolGateway, ToolCallRequest, ToolCallResult } from "../../../packages/tool-gateway/src/tool-gateway";

/**
 * Mock ToolGateway for the Banking Card Dispute example.
 *
 * Returns realistic fictional responses for each tool in the workflow.
 * No real bank systems are called.
 */
export class DisputeMockToolGateway implements ToolGateway {
  async callTool(request: ToolCallRequest): Promise<ToolCallResult> {
    const toolId = request.tool.id;
    const input = request.input;
    const completedAt = new Date().toISOString();

    switch (toolId) {
      case "fetch_transaction_details":
        return {
          toolId,
          output: {
            id: input["transactionId"] ?? "TXN-001",
            customerId: input["customerId"] ?? "CUST-001",
            merchantName: "TechStore Online",
            amount: 249.99,
            currency: "USD",
            transactionDate: "2026-05-10T14:32:00Z",
            status: "posted",
            cardLast4: "4242",
          },
          completedAt,
        };

      case "classify_risk":
        // Derive a fictional risk score from transaction amount
        const amount = (input["transaction"] as Record<string, unknown>)?.["amount"] as number ?? 0;
        const riskScore = amount > 200 ? 0.75 : 0.32;
        return {
          toolId,
          output: riskScore,
          completedAt,
        };

      case "gather_evidence":
        return {
          toolId,
          output: {
            chargebackEligible: true,
            priorDisputeCount: 0,
            merchantResponseDeadline: "2026-05-24T00:00:00Z",
            evidenceDocuments: ["transaction_receipt.pdf", "merchant_tos.pdf"],
          },
          completedAt,
        };

      case "generate_dispute_summary":
        return {
          toolId,
          output:
            "Customer disputes charge of $249.99 from TechStore Online on 2026-05-10. " +
            "Risk score: 0.75. No prior disputes on account. Chargeback eligible. " +
            "Provisional credit recommended pending merchant response by 2026-05-24.",
          completedAt,
        };

      case "initiate_provisional_credit":
        return {
          toolId,
          output: {
            creditRef: `CRED-${Date.now()}`,
            amount: input["amount"],
            currency: input["currency"],
            status: "provisioned",
            expiresAt: "2026-06-14T00:00:00Z",
          },
          completedAt,
        };

      case "reverse_provisional_credit":
        return {
          toolId,
          output: {
            creditRef: input["creditRef"],
            status: "reversed",
            reversedAt: completedAt,
          },
          completedAt,
        };

      case "create_audit_record":
        return {
          toolId,
          output: {
            auditId: `AUDIT-${Date.now()}`,
            workflowId: input["workflowId"],
            recordedAt: completedAt,
            fields: Object.keys(input),
          },
          completedAt,
        };

      default:
        throw new Error(`Unknown tool: ${toolId}`);
    }
  }
}
