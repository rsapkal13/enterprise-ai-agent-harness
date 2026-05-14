# Testing Strategy: Workflow Engine & Policy Engine (v0.2)

**Status:** Accepted  
**Date:** 2026-05-14  
**Scope:** `packages/workflow-engine`, `packages/policy-engine`, integration with `tool-gateway` and `observability`

---

## Guiding Principles

These packages are safety-critical. A bug in the policy engine could allow an unauthorised tool call. A bug in compensation could leave a customer account in an inconsistent state after a failed dispute. Tests must be:

- **Fast and dependency-free** — no external services, no database spin-up; every test runs in CI in under 10 seconds total.
- **Behaviour-focused** — test what the system does, not how it's structured internally. Refactoring internals should not break tests.
- **Explicit about failure modes** — every error path (policy deny, tool timeout, compensation failure) has a test.
- **Traceable** — each test maps to a system design requirement (FR1–FR8 from the system design doc).

---

## Testing Pyramid

```
         ┌──────────────────┐
         │    E2E / Example  │  1–2 tests: full Banking Card Dispute journey
         ├──────────────────┤
         │   Integration     │  ~15 tests: WorkflowRunner + real StateStore + mock tools
         ├──────────────────┤
         │   Unit Tests      │  ~40 tests: StepExecutor, PolicyEngine, CompensationStack
         └──────────────────┘
```

**Tooling:** Vitest (fast, native ESM, excellent TypeScript support). No Jest — avoids CJS/ESM friction with the existing TS config.

---

## 1. Unit Tests

### 1.1 PolicyEngine

**Location:** `packages/policy-engine/tests/policy-engine.test.ts`

| Test | What it covers | Requirement |
|------|----------------|-------------|
| Returns `allow` for a request matching a permissive rule | Happy path | FR3 |
| Returns `deny` for a request that violates a constraint | Deny path | FR3 |
| Returns `require_approval` when policy mandates human review | Approval gate trigger | FR4 |
| Returns `require_consent` when consent obligation is present | Consent path | FR3 |
| `evaluatedAt` is always a valid ISO timestamp | Data integrity | — |
| `obligations` is always an array (never undefined) | Contract safety | — |
| Evaluates correctly with an empty context | Edge case | FR3 |

**Example:**

```typescript
describe("PolicyEngine", () => {
  it("denies a tool call that exceeds risk threshold", async () => {
    const engine = new PolicyEngineImpl();
    const decision = await engine.evaluate(highRiskPolicy, {
      agentId: "dispute-agent",
      toolId: "initiate_provisional_credit",
      context: { riskScore: 0.95 },
    });
    expect(decision.outcome).toBe("deny");
    expect(decision.reason).toBeTruthy();
  });

  it("requires approval when riskScore is in review band", async () => {
    const decision = await engine.evaluate(reviewBandPolicy, {
      agentId: "dispute-agent",
      toolId: "initiate_provisional_credit",
      context: { riskScore: 0.72 },
    });
    expect(decision.outcome).toBe("require_approval");
  });
});
```

---

### 1.2 StepExecutor

**Location:** `packages/workflow-engine/tests/step-executor.test.ts`

| Test | What it covers | Requirement |
|------|----------------|-------------|
| Executes a tool step and writes output to context | Happy path | FR1, FR2 |
| Propagates `traceId` to ToolGateway call | Observability wiring | FR6 |
| Times out after `timeoutMs` and returns `failed` | Timeout handling | FR8 |
| Skips execution and returns `requires_approval` when policy says so | Policy gate | FR3, FR4 |
| Returns `failed` when policy denies | Deny path | FR3 |
| Returns `failed` when tool call throws | Error path | FR5 |
| Evaluates `conditional` step — takes ifTrue branch | Branching | FR1 |
| Evaluates `conditional` step — takes ifFalse branch | Branching | FR1 |
| `kind: "human_approval"` step returns `requires_approval` immediately | Approval step | FR4 |
| Writes nothing to context when step fails | State integrity | FR1 |

**Mocking approach:** Inject a mock `PolicyEngine` and mock `ToolGateway` via constructor. No module-level mocking.

---

### 1.3 CompensationStack

**Location:** `packages/workflow-engine/tests/compensation.test.ts`

| Test | What it covers | Requirement |
|------|----------------|-------------|
| Calls compensation tools in reverse order | LIFO unwinding | FR5 |
| Captures input at step completion time (not at compensation time) | Snapshot correctness | FR5 |
| Emits a `step.compensated` trace event per entry | Observability | FR6 |
| Continues compensating if one compensation tool errors (logs, does not rethrow) | Best-effort compensation | FR5 |
| Sets workflow status to `failed` after compensation completes | Status transition | FR5 |
| No-ops when compensationStack is empty | Edge case | FR5 |

---

### 1.4 InMemoryStateStore

**Location:** `packages/workflow-engine/tests/state-store.test.ts`

| Test | What it covers |
|------|----------------|
| `save` + `get` round-trips correctly | Basic persistence |
| `get` returns `undefined` for unknown runId | Missing state |
| `listActive` returns only running and waiting_for_approval states | Filter correctness |
| `save` overwrites existing state by runId | Idempotent update |
| Concurrent saves to different runIds do not interfere | Isolation |

---

## 2. Integration Tests

**Location:** `packages/workflow-engine/tests/workflow-runner.integration.test.ts`

These tests use a real `WorkflowRunner` with `InMemoryStateStore`, mock `ToolGateway` (returns controlled responses), and a real `PolicyEngineImpl`.

| Test | What it covers | Requirement |
|------|----------------|-------------|
| Runs a 3-step linear workflow to completion | Happy path end-to-end | FR1, FR2 |
| `getState()` reflects correct status at each step | State visibility | FR7 |
| Workflow parks at `HumanApprovalStep` and status becomes `waiting_for_approval` | Approval gate | FR4 |
| `approve()` resumes a parked workflow and completes it | Approval resume | FR4 |
| `reject()` on a parked workflow triggers compensation and sets status=failed | Rejection + compensation | FR4, FR5 |
| Tool failure mid-workflow triggers compensation of completed steps | Compensation trigger | FR5 |
| Policy `deny` on step 3 of 5 compensates steps 1–2 | Mid-journey deny | FR3, FR5 |
| `listActive()` returns the running workflow | Monitoring | FR7 |
| Step timeout triggers compensation | Timeout handling | FR8 |
| All steps emit `TraceEvent`s with correct `traceId` | Observability | FR6 |
| Conditional step routes correctly based on context value | Branching | FR1 |
| Retry: tool fails once then succeeds on second attempt | Retry logic | FR2 |
| Retry: tool fails all 3 attempts → triggers compensation | Retry exhaustion | FR5 |
| Second call to `approve()` on an already-completed run returns error | Idempotency guard | FR4 |

---

## 3. End-to-End Test: Banking Card Dispute

**Location:** `examples/banking-card-dispute/tests/card-dispute.e2e.test.ts`

Two scenarios, fully wired up with the complete harness (real WorkflowRunner, real PolicyEngine, mock external tools):

**Scenario A — Low risk, auto-approved:**
1. `fetch_transaction_details` → returns low-risk transaction
2. `classify_risk` → returns `riskScore: 0.3`
3. Conditional: skips human approval
4. `gather_evidence` → returns evidence bundle
5. `generate_dispute_summary` → returns summary
6. `initiate_provisional_credit` → returns creditRef
7. `create_audit_record` → returns auditId
8. Assert: status = `completed`, all step records in history, audit trace intact

**Scenario B — High risk, analyst rejects:**
1–3. Same as above but `riskScore: 0.82` → parks at `fraud_analyst_review`
4. Assert: status = `waiting_for_approval`
5. Call `reject(runId, "analyst-1", "suspected synthetic fraud")`
6. Assert: `initiate_provisional_credit` compensation called (`reverse_provisional_credit`)
7. Assert: status = `failed`, compensationStack empty, all trace events present

---

## 4. Coverage Targets

| Package | Line Coverage Target | Branch Coverage Target |
|---------|---------------------|----------------------|
| `policy-engine` | 90% | 85% |
| `workflow-engine` | 85% | 80% |
| `examples/banking-card-dispute` | 70% (E2E focus) | 60% |

Coverage is enforced in CI via Vitest's built-in `--coverage` flag. PRs below target are blocked.

---

## 5. What NOT to Test

- `InMemoryStateStore` performance — it's a v0.2 shim; do not add load tests against it.
- TypeScript compilation correctness — the compiler handles this; do not write tests that just check types exist.
- Framework internals — do not test that `Promise.race` works; test that step timeout behaviour is correct.
- Trivial getters on interface implementations.

---

## 6. Test File Layout

```
packages/
  policy-engine/
    tests/
      policy-engine.test.ts
  workflow-engine/
    tests/
      step-executor.test.ts
      compensation.test.ts
      state-store.test.ts
      workflow-runner.integration.test.ts
examples/
  banking-card-dispute/
    tests/
      card-dispute.e2e.test.ts
```

---

## 7. CI Pipeline

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - run: npm ci
    - run: npx vitest run --coverage
  timeout-minutes: 5
```

No external services. No Docker. Runs in under 10 seconds on cold CI.

---

## Links

- System Design: `docs/v02/system-design-workflow-engine.md`
- ADR-001: `docs/v02/adr-001-workflow-execution-model.md`
