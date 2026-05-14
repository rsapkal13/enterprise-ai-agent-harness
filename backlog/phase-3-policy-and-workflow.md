# Phase 3: Policy Execution & Context Layer

Goal: wire the delivered policy engine and audit sink into the workflow engine and implement the
context layer runtime so that governance is end-to-end executable.

## What was already delivered in v0.2 (closed — no longer in scope here)

- `RuleBasedPolicyEvaluator` — condition matching on subject / resource / context / risk-tier ceiling ✅
- `InMemoryAuditSink` — append-only, findByTraceId / Actor / TimeRange / Outcome ✅
- `TraceEmitter` — correlation IDs, child emitters, sink write integration ✅
- `InMemoryWorkflowEngine` — tool / policy / approval / completion steps ✅
- Human approval gates: park (`waiting_for_approval`) and resume with evidence ✅
- LIFO compensation stack (saga-style undo on failure) ✅
- Per-step retry with exponential backoff ✅
- Policy decision object: `{ policyId, outcome, reason, obligations, evaluatedAt }` ✅

## Scope

### Story 3.1 — Wire policy engine into workflow engine step execution

The workflow engine evaluates policy steps using only `policy.decisionType` (a simple string check).
Replace this with a real call to `RuleBasedPolicyEvaluator` so YAML `rules[]` blocks are evaluated
against the step's execution context.

File to change: `packages/workflow-engine/src/in-memory-workflow-engine.js`, `executePolicyStep()`
(line ~178).

Acceptance criteria:
- `executePolicyStep()` calls `RuleBasedPolicyEvaluator.evaluate(policy, request)` passing
  `agentId`, `skillId`, `toolId`, and a context bag merged from `state._input` and `state.stepOutputs`
- Outcome `allow` → follow `on_success`
- Outcome `deny` → follow `on_failure`
- Outcome `require_approval` → park workflow identically to an approval-type step
- Outcome `require_consent` → treat as deny for now (logged to audit)
- Policy evaluation result written to `state.stepOutputs[step.id]` and `state.history`
- New tests in `in-memory-workflow-engine.test.js`: rule-matched allow, rule-matched deny,
  require_approval triggers park, policy not found stays as failure

Suggested labels: `area:policy`, `area:workflow`, `type:feature`, `priority:p0`, `release:v0.3`

### Story 3.2 — Wire trace emitter into demo runner

`TraceEmitter` is fully built but not connected to the workflow engine or demo runner.

Acceptance criteria:
- `InMemoryWorkflowEngine` accepts an optional `TraceEmitter` in `WorkflowEngineOptions`
- Every step start emits `workflow.step.started` with `stepId`, `stepType`
- Every step end emits `workflow.step.completed` or `workflow.step.failed` with `outcome`
- Approval park emits `workflow.approval.waiting` with `approverRole` and `uiManifestRef`
- Approval resume emits `workflow.approval.resolved` with `approved`, `evidence`
- Policy decisions emit `policy.evaluated` with `policyId`, `outcome`, `obligations`
- Demo runner banner shows: `Run ID: <uuid>  Steps: N  Audit events: M`
- At end of run, print chronological audit trail from `sink.findByTraceId(runId)`

Suggested labels: `area:observability`, `area:workflow`, `type:feature`, `priority:p0`, `release:v0.3`

### Story 3.3 — Context layer runtime

`packages/context-layer/` contains type stubs only. Implement the runtime so agents can be
granted or denied access to context scopes under policy control.

Acceptance criteria:
- `ContextScopeRegistry` extends `InMemoryStore<ContextScopeDefinition>` (consistent with other registries)
- `ContextGrant` model: `{ scopeId, agentId, sessionId, grantedAt, expiresAt?, evidence }`
- `ContextAccessEvaluator` accepts a grant request and runs `RuleBasedPolicyEvaluator` against the
  relevant policy; returns `allow` or `deny`
- Every grant decision writes an audit event to `InMemoryAuditSink`
- `packages/context-layer/tests/context-layer.test.js` — minimum 12 tests covering:
  - Grant allowed by policy
  - Grant denied by policy
  - Expired grant rejected
  - Unknown scope rejected
  - Audit events written for both outcomes

Suggested labels: `area:context`, `area:policy`, `type:feature`, `priority:p1`, `release:v0.3`

### Story 3.4 — UI Manifest validator

`packages/ui-manifest/src/manifest-validator.ts` is a stub (`// TODO`).

Acceptance criteria:
- `validateUiManifest(raw)` validates a parsed YAML object against `schemas/ui-manifest.schema.json`
- Returns `{ valid: boolean, errors: string[] }`
- Called by the demo runner before rendering a confirmation step; non-valid manifests log a warning
  but do not halt execution (graceful degradation)
- Tests: valid manifest passes, missing required fields (`id`, `version`, `components`) produce clear
  error messages

Suggested labels: `area:ui-manifest`, `area:runtime`, `type:feature`, `priority:p2`, `release:v0.3`

### Story 3.5 — Condition expression engine (replace `new Function()`)

`step-executor.ts` (line 232) uses `new Function()` for condition evaluation. Replace with a safe,
pure field-path expression evaluator.

Acceptance criteria:
- Supports: equality (`context.risk_tier == "T2"`), comparison (`context.amount > 500`), set
  membership (`context.channel in ["web", "app"]`), boolean literals (`context.consent_present == true`)
- No `eval` or `new Function()` in production paths
- Parser is pure, synchronous, and has no side effects
- `packages/policy-engine/tests/expression-engine.test.js` — minimum 10 tests covering each
  operator type and malformed expression handling

Suggested labels: `area:policy`, `area:runtime`, `type:feature`, `priority:p1`, `release:v0.3`

### Story 3.6 — Insurance-claims example journey

Add a second fictional enterprise journey to validate the policy engine across a different domain.

Acceptance criteria:
- Full YAML manifest set: agent, skill, 2+ policies (one `deny`, one `require_approval`),
  3+ tools, workflow with compensation step, system, 2+ audit events, 1+ evaluation
- Mock handlers for all tools registered in the demo runner
- Scenario A: low-value claim auto-approved, completes in < 5 steps
- Scenario B: high-value claim triggers `require_approval`, resumed with evidence, then compensated
  on rejection
- `examples/insurance-claims/README.md` — describes the journey and how to run it
- All cross-references validated by `npm run validate:references`

Suggested labels: `area:examples`, `area:runtime`, `type:feature`, `priority:p1`, `release:v0.3`

## Out of scope for v0.3

- Durable/persistent workflow state (PostgresStateStore — deferred to v0.6)
- Full policy language or external policy engine (CEL / OPA — post-v0.6)
- Real financial, telecom, insurance, or retail system adapters
- Authentication and RBAC

## Exit Criteria

- `npm test` passes with 0 failures (all new tests included)
- `npm run validate` passes
- A completed demo run prints a readable, chronological audit trail keyed to the workflow run ID
- Context scope access is policy-gated and produces audit events
- Insurance-claims journey executes end-to-end in the demo runner
- No `new Function()` or `eval` in policy or workflow execution paths
