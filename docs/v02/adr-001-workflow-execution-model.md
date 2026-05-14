# ADR-001: Workflow Execution Model & State Persistence

**Status:** Accepted  
**Date:** 2026-05-14  
**Deciders:** Transformation Lead (Ravi)  
**Affected packages:** `workflow-engine`, `observability`, `policy-engine`

---

## Context

The enterprise-ai-harness Workflow Engine needs a concrete execution model for v0.2. Two primary decisions must be made:

1. **Orchestration vs. Choreography** — how steps are coordinated
2. **State persistence strategy** — where workflow state lives

These decisions shape the testability, debuggability, and upgrade path of the entire harness.

---

## Decision 1: Orchestration over Choreography

### Options Considered

**Option A — Orchestration (centralised runner)**  
A single `WorkflowRunner` class drives step execution. It knows the full `WorkflowDefinition`, calls each step in order, manages state transitions, invokes PolicyEngine, and handles compensation. All logic lives in one place.

**Option B — Choreography (event-driven)**  
Steps are independent event handlers. Each step listens for a "step N complete" event and emits a "step N+1 start" event. No central coordinator. Steps are decoupled by design.

### Decision

**Option A — Orchestration.**

### Rationale

- **Enterprise compliance requires auditability of the full journey.** A central runner can enforce policy checkpoints at every step without relying on each independent handler to do so. With choreography, a missed event subscription silently skips a policy check.
- **Human approval gates need a coordinator.** Pausing and resuming a workflow across an async human decision is straightforward with a central runner (park the state, resume on `approve()`). With choreography this requires a stateful saga coordinator — essentially reimplementing orchestration with more complexity.
- **Compensation (undo) is simpler.** The runner holds the `compensationStack` and can unwind it deterministically. Choreographed compensation requires each step to know about prior steps' undo operations.
- **Debuggability for a small team.** Transformation programs run by a small team benefit from being able to set a breakpoint in one place and trace the entire journey. Distributed event handlers scatter the execution path.
- **Choreography upgrade path is preserved.** The `WorkflowEngine` interface is stable. In v0.3+, the orchestrator can publish to an event bus internally while keeping the same external contract.

### Consequences

- All step sequencing logic lives in `WorkflowRunner` — it becomes the most critical class in the harness.
- Parallel step groups require explicit support (v0.3 work); v0.2 is sequential only.
- The runner is the single point of failure — mitigated in v0.2 by keeping it stateless (state lives in `StateStore`).

---

## Decision 2: In-Memory StateStore with Pluggable Interface

### Options Considered

**Option A — In-memory Map (v0.2)**  
`WorkflowState` stored in a `Map<string, WorkflowState>` inside the runner process. Zero dependencies, instant setup, works for demos and tests.

**Option B — SQLite file-backed store**  
Durable across restarts. Still zero external dependencies for local dev. More complex to set up; requires schema migrations.

**Option C — Postgres/Redis from day one**  
Production-grade. Requires infrastructure to be running for any local work. Too heavyweight for v0.2.

### Decision

**Option A — In-memory Map for v0.2, behind a `StateStore` interface.**

### Rationale

- **v0.2 goal is a working demo**, not production hardening. Restartability is not a v0.2 requirement.
- **Abstracting behind `StateStore`** means the switch to Postgres in v0.3 is a single implementation swap with zero changes to `WorkflowRunner`.
- **Tests remain fast and dependency-free.** No database spin-up needed in CI.
- **The Banking Card Dispute example runs in a single process.** In-memory is sufficient for the full journey end-to-end.

### StateStore Interface (to be introduced in v0.2)

```typescript
interface StateStore {
  save(state: WorkflowState): Promise<void>;
  get(runId: string): Promise<WorkflowState | undefined>;
  listActive(): Promise<WorkflowState[]>;
}

class InMemoryStateStore implements StateStore {
  private store = new Map<string, WorkflowState>();
  async save(state: WorkflowState) { this.store.set(state.runId, state); }
  async get(runId: string) { return this.store.get(runId); }
  async listActive() { return [...this.store.values()].filter(s => s.status === "running" || s.status === "waiting_for_approval"); }
}
```

### Consequences

- State is lost on process restart — acceptable for v0.2, documented clearly in README.
- `WorkflowRunner` is injected with `StateStore` at construction (dependency injection) — makes tests trivially simple.
- v0.3 introduces `PostgresStateStore` implementing the same interface.

---

## Decision 3: Retry Strategy

### Decision

**Per-step configurable retry with exponential backoff, max 3 attempts, v0.2 default.**

```typescript
interface RetryPolicy {
  maxAttempts: number;       // default: 3
  initialDelayMs: number;    // default: 200
  backoffMultiplier: number; // default: 2
  retryOn: "tool_error" | "timeout" | "any"; // default: "tool_error"
}
```

### Rationale

- Tool calls to external systems (fetch_transaction, initiate_credit) can fail transiently. Retrying before triggering compensation avoids unnecessary undo of prior steps.
- Policy denials are **not retried** — a deny is a business decision, not an error.
- Human approval timeouts are **not retried** — they trigger the reject path.
- Exponential backoff prevents thundering herd against downstream systems.

---

## Summary

| Decision | Choice | Key Reason |
|----------|--------|------------|
| Execution model | Orchestration | Policy compliance, approval gates, compensation control |
| State persistence v0.2 | In-memory Map | Fast, testable, demo-ready; StateStore interface enables v0.3 upgrade |
| Retry strategy | Per-step, exp. backoff, max 3 | Transient tool errors without triggering unnecessary compensation |

---

## Links

- System Design: `docs/v02/system-design-workflow-engine.md`
- Workflow Engine interfaces: `packages/workflow-engine/src/`
- Policy Engine interfaces: `packages/policy-engine/src/`
