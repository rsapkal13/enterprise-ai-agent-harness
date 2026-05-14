# Banking Card Dispute Example (v0.2)

A fictional end-to-end card dispute journey running through the enterprise-ai-harness Workflow Engine.

Demonstrates risk classification, evidence gathering, human review gates, provisional credit with compensation, and a full audit trail — using no real bank data or private operating procedures.

## Scenarios

**Scenario A — Low-risk (auto-complete)**
Transaction amount < $200 → risk score 0.32 → skips human review → provisional credit issued → audit record created.

**Scenario B — High-risk (park → reject → compensate)**
Transaction amount > $200 → risk score 0.75 → parks at `fraud_analyst_review` → analyst rejects → provisional credit reversed via compensation.

## Run

```bash
npx tsx examples/banking-card-dispute/src/run-dispute.ts
```

## Files

```
src/
  dispute-workflow.ts     # WorkflowV2Definition with all 7 steps
  mock-tools.ts           # Mock ToolGateway (no real bank systems)
  mock-policy-engine.ts   # Mock PolicyEngine with allow/deny/require_approval rules
  run-dispute.ts          # Demo runner — executes both scenarios
```

## Related Docs

- System Design: `docs/v02/system-design-workflow-engine.md`
- ADR-001: `docs/v02/adr-001-workflow-execution-model.md`
- Testing Strategy: `docs/v02/testing-strategy.md`
