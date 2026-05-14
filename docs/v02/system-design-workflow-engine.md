# System Design: Workflow Engine (v0.2)

**Status:** Draft  
**Version:** 0.2  
**Date:** 2026-05-14  
**Scope:** `packages/workflow-engine`, integrations with `policy-engine`, `tool-gateway`, `observability`

---

## 1. Context & Goals

The enterprise-ai-harness needs a Workflow Engine that can coordinate multi-step, AI-enabled business journeys in a governed, auditable way. The canonical v0.2 use case is the **Banking Card Dispute** journey, which requires:

- Sequential and conditional step execution
- Policy checkpoints before sensitive actions (risk classification, fund reversals)
- Human-in-the-loop approval gates (fraud analyst review)
- Compensation (undo) when a step fails after prior steps have committed side effects
- A full audit trail for compliance

The engine must be **synchronous-first** for v0.2 (in-process, in-memory state) with a clear upgrade path to durable/async execution in v0.3+.

---

## 2. Functional Requirements

| ID  | Requirement |
|-----|-------------|
| FR1 | Execute a `WorkflowDefinition` as an ordered sequence of steps |
| FR2 | Each step can invoke a tool (via `ToolGateway`) or an AI skill |
| FR3 | Policy checkpoint before each step — deny halts execution, require_approval parks the workflow |
| FR4 | Workflow pauses at `HumanApprovalStep` and resumes when `approve(runId)` or `reject(runId)` is called |
| FR5 | Failed steps trigger compensation in reverse order for already-completed steps |
| FR6 | Every state transition emits a `TraceEvent` to the Observability package |
| FR7 | `getState(runId)` returns the current `WorkflowState` including step history |
| FR8 | Callers can inject a timeout per step |

---

## 3. Non-Functional Requirements

| Concern | v0.2 Target | v0.3+ Path |
|---------|-------------|------------|
| Durability | In-memory (restarts lose state) | Pluggable `StateStore` interface (Redis, Postgres) |
| Concurrency | Single-threaded, sequential steps | Parallel step groups via `Promise.all` |
| Latency | < 50ms overhead per step (excl. tool call) | Async/event-driven with queuing |
| Observability | TraceEvents emitted per transition | OpenTelemetry spans |
| Scale | Single instance | Distributed workers consuming from a queue |

---

## 4. High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        WorkflowRunner                           │
│                                                                 │
│  start(request)                                                 │
│       │                                                         │
│       ▼                                                         │
│  ┌────────────┐    policy check    ┌─────────────────┐          │
│  │ StepExecutor│ ─────────────────▶│  PolicyEngine   │          │
│  │            │◀─ allow/deny/gate ─│                 │          │
│  └─────┬──────┘                    └─────────────────┘          │
│        │                                                        │
│        │ tool call                                              │
│        ▼                                                        │
│  ┌─────────────┐                   ┌─────────────────┐          │
│  │ ToolGateway │                   │  ApprovalGate   │          │
│  └─────────────┘                   │  (parked runs)  │          │
│        │                           └────────┬────────┘          │
│        │ trace event                        │ approve/reject     │
│        ▼                                    ▼                   │
│  ┌─────────────┐                   ┌─────────────────┐          │
│  │Observability│                   │  StateStore     │          │
│  │(TraceEvent) │                   │  (in-memory     │          │
│  └─────────────┘                   │   Map, v0.2)    │          │
│                                    └─────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Model

### 5.1 WorkflowDefinition (extends core)

```typescript
interface WorkflowDefinition {
  id: string;
  version: string;
  policyId: string;            // policy applied at every step
  steps: StepDefinition[];
}

type StepDefinition =
  | ToolStepDefinition
  | SkillStepDefinition
  | HumanApprovalStepDefinition
  | ConditionalStepDefinition;

interface ToolStepDefinition {
  kind: "tool";
  id: string;
  toolId: string;
  inputMapping: Record<string, string>; // maps workflow context keys to tool inputs
  outputKey: string;                    // writes result to workflow context under this key
  compensationToolId?: string;          // tool to call if compensation is triggered
  timeoutMs?: number;
}

interface SkillStepDefinition {
  kind: "skill";
  id: string;
  skillId: string;
  inputMapping: Record<string, string>;
  outputKey: string;
  timeoutMs?: number;
}

interface HumanApprovalStepDefinition {
  kind: "human_approval";
  id: string;
  prompt: string;              // shown to the approver
  requiredRole: string;        // e.g. "fraud_analyst"
  timeoutMs?: number;          // auto-reject if exceeded
}

interface ConditionalStepDefinition {
  kind: "conditional";
  id: string;
  condition: string;           // expression evaluated against workflow context
  ifTrue: StepDefinition[];
  ifFalse?: StepDefinition[];
}
```

### 5.2 WorkflowState (expanded)

```typescript
interface WorkflowState {
  workflowId: string;
  runId: string;
  status: WorkflowStatus;      // existing: pending | running | waiting_for_approval | completed | failed | compensating
  currentStepId?: string;
  context: Record<string, unknown>;   // accumulated step outputs
  history: StepRecord[];
  compensationStack: CompensationEntry[];
  updatedAt: string;
  startedAt: string;
  completedAt?: string;
}

interface StepRecord {
  stepId: string;
  startedAt: string;
  completedAt?: string;
  outcome: "completed" | "failed" | "skipped" | "rejected" | "compensated";
  policyDecisionId: string;
  traceSpanId: string;
  error?: string;
}

interface CompensationEntry {
  stepId: string;
  compensationToolId: string;
  input: Record<string, unknown>;  // captured at step completion for safe undo
}
```

---

## 6. API Design

### WorkflowEngine Interface (expanded)

```typescript
interface WorkflowEngine {
  // Start a new workflow run
  start(request: WorkflowStartRequest): Promise<WorkflowState>;

  // Fetch current state (used by polling clients and UI)
  getState(runId: string): Promise<WorkflowState | undefined>;

  // Resume a workflow parked at a human approval gate
  approve(runId: string, approverId: string, notes?: string): Promise<WorkflowState>;
  reject(runId: string, approverId: string, reason: string): Promise<WorkflowState>;

  // List all active runs (for monitoring)
  listActive(): Promise<WorkflowState[]>;
}
```

### Internal StepExecutor

```typescript
interface StepExecutor {
  execute(
    step: StepDefinition,
    context: Record<string, unknown>,
    runId: string,
    traceId: string,
  ): Promise<StepExecutionResult>;
}

interface StepExecutionResult {
  outcome: "completed" | "failed" | "requires_approval";
  outputKey?: string;
  outputValue?: unknown;
  error?: string;
  policyDecisionId: string;
}
```

---

## 7. Step Execution Flow

```
For each step:

1. Emit TraceEvent: step_started
2. Call PolicyEngine.evaluate(policy, { agentId, skillId/toolId, context })
   ├─ deny       → emit step_denied, trigger compensation, set status=failed
   ├─ require_approval → park run, set status=waiting_for_approval, emit step_parked
   └─ allow      → proceed

3. Execute step action (tool call / skill call / conditional eval)
   ├─ success    → write outputKey to context, push to compensationStack if tool has compensation
   │               emit step_completed
   └─ error      → emit step_failed, trigger compensation sequence

4. Emit TraceEvent: step_completed | step_failed

5. Advance to next step or mark workflow completed/failed
```

### Compensation Sequence

```
Triggered when any step fails after ≥1 completed steps:

1. Set status = compensating
2. Pop CompensationEntry stack (LIFO)
3. For each entry: call compensationToolId with captured input
4. Emit compensation_step_completed per entry
5. Set final status = failed (compensation complete)
```

---

## 8. Integration Points

### 8.1 PolicyEngine

- Called before **every** step execution
- `agentId` = workflow owner, `skillId`/`toolId` = step target
- `context` includes current workflow context (risk scores, claim amounts, etc.)
- `require_approval` outcome → workflow parks; does **not** call the step

### 8.2 ToolGateway

- All `ToolStepDefinition` and compensation steps route through `ToolGateway.callTool()`
- `traceId` is propagated for end-to-end observability
- v0.2: synchronous call with timeout via `Promise.race`

### 8.3 Observability

Events emitted at every state transition:

| Event Type | When |
|------------|------|
| `workflow.started` | `start()` called |
| `step.started` | Step execution begins |
| `step.policy_checked` | PolicyDecision received |
| `step.parked` | Human approval required |
| `step.completed` | Step succeeded |
| `step.failed` | Step threw or timed out |
| `step.compensated` | Compensation tool ran |
| `workflow.completed` | All steps done |
| `workflow.failed` | Unrecoverable failure |
| `workflow.compensated` | Compensation complete |

---

## 9. Banking Card Dispute — Workflow Sketch

```
Steps:
1. [tool]           fetch_transaction_details    → context.transaction
2. [tool]           classify_risk                → context.riskScore
3. [conditional]    if riskScore >= 0.7
   ├─ ifTrue:  [human_approval] fraud_analyst_review  (role: fraud_analyst)
   └─ ifFalse: (continue)
4. [tool]           gather_evidence              → context.evidence
5. [skill]          generate_dispute_summary     → context.summary
6. [tool]           initiate_provisional_credit  → context.creditRef
   compensationTool: reverse_provisional_credit
7. [tool]           create_audit_record          → context.auditId
```

Policy applied at every step ensures that:
- Risk classification cannot be bypassed
- Provisional credit cannot be issued without completed evidence gathering
- Audit record creation always runs (no policy deny on step 7)

---

## 10. Trade-off Analysis

| Decision | Choice | Trade-off |
|----------|--------|-----------|
| In-memory state store | Simple Map<runId, WorkflowState> | Fast to build; lost on restart. Acceptable for v0.2 demo. Pluggable StateStore abstracts this away for v0.3 |
| Synchronous step execution | Sequential Promise chain | Predictable, easy to debug. No parallel steps in v0.2 — add step groups in v0.3 |
| Policy check per step | Every step, no caching | Correct and safe. Slight latency cost per step — add short-lived decision caching in v0.3 |
| Compensation is best-effort | Errors during compensation are logged, not re-tried | Avoids infinite loops. For production: add compensation retry with idempotency keys |
| Condition expressions as strings | Simple key-path evaluation (e.g. `context.riskScore >= 0.7`) | Low complexity. Not Turing-complete — deliberate. Replace with OPA or CEL in v0.3 |

---

## 11. What to Revisit as the System Grows

- **Durable execution:** Introduce a `StateStore` interface in v0.3 backed by Postgres or Redis so workflows survive restarts.
- **Parallel steps:** Add `ParallelStepGroup` to `StepDefinition` for concurrent tool calls.
- **Event bus:** Decouple step execution from the runner with an internal event bus — enables async human approvals via webhook/SSE.
- **Policy caching:** Cache `PolicyDecision` results with a TTL keyed on `(policyId, agentId, toolId, contextHash)`.
- **Compensation idempotency:** Add `idempotencyKey` to compensation entries; use it in tool calls to prevent double-reversals.
- **Expression engine:** Replace string condition evaluation with OPA (Open Policy Agent) or Google CEL for safe, auditable conditional logic.
