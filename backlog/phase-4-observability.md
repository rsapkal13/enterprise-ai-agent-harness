# Phase 4: Evaluation & Reporting

Goal: make evaluation outcomes computable from completed journey data and produce local reports
operators and engineers can act on.

## What was already delivered in v0.2 (closed — no longer in scope here)

- `TraceEmitter` — structured span emission, correlation IDs, child emitters, sink write ✅
- `InMemoryAuditSink` — append-only, findByTraceId / Actor / TimeRange / Outcome ✅
- `TraceEvent` model with `traceId`, `spanId`, `eventType`, `timestamp`, `attributes` ✅
- `EvaluationDefinition` type mapped by loader ✅
- `EvaluationResult` interface stub ✅

## What is being completed in v0.3 (not repeated here)

- Wiring TraceEmitter into the workflow engine so journeys produce real trace events (Story 3.2)

## Scope

### Story 4.1 — Evaluation runner

Implement a runtime evaluator that scores a completed workflow run against `EvaluationDefinition`
objects.

Acceptance criteria:
- `EvaluationRunner.evaluate(runId, sink, evaluations[])` reads audit events for `runId` from
  `InMemoryAuditSink` and returns one `EvaluationResult` per matched definition
- Supported `metricType` values:
  - `completion` — workflow reached `completed` status?
  - `compliance` — every policy step produced `allow` or `require_approval` (not `deny`)?
  - `latency` — elapsed ms between `workflow.started` and `workflow.completed` events
  - `reliability` — did any step outcome equal `failed`?
  - `quality` and `business_outcome` — pluggable; default to `needs_review` with a note
- Result shape: `{ id, evaluationId, runId, targetType, targetId, metricType, outcome, score?, evaluatedAt, evidence }`
- `outcome` limited to `pass | fail | needs_review`
- `packages/observability/tests/evaluation-runner.test.js` — minimum 15 tests

Suggested labels: `area:observability`, `area:evaluation`, `type:feature`, `priority:p0`, `release:v0.4`

Suggested milestone: `v0.4`

### Story 4.2 — Evaluation result store

Persist results so they are queryable across multiple runs.

Acceptance criteria:
- `InMemoryEvaluationResultStore` following the same `InMemoryStore<T>` base pattern
- Methods: `write(result)`, `findByRunId(runId)`, `findByTargetId(targetId)`,
  `findByOutcome(outcome)`, `listAll()`
- Results are immutable after write (Object.freeze)
- `packages/observability/tests/evaluation-result-store.test.js` — minimum 8 tests

Suggested labels: `area:observability`, `area:evaluation`, `type:feature`, `priority:p0`, `release:v0.4`

Suggested milestone: `v0.4`

### Story 4.3 — Policy compliance scoring and coverage gap detection

Compute per-skill and per-workflow compliance scores from accumulated results.

Acceptance criteria:
- `ComplianceScorer.score(targetId, store)` returns
  `{ targetId, totalRuns, passingRuns, complianceRate, lastEvaluatedAt }`
- `CoverageAnalyser.gaps(registries, store)` returns skills and workflows with zero evaluation records
- Both are pure, synchronous functions with no side effects
- `packages/observability/tests/compliance-scorer.test.js` — minimum 10 tests covering score
  calculation, zero-run edge case, and coverage gaps

Suggested labels: `area:observability`, `area:evaluation`, `type:feature`, `priority:p1`, `release:v0.4`

Suggested milestone: `v0.4`

### Story 4.4 — Local evaluation report generator

Produce a human-readable HTML/JSON report from a completed demo run.

Acceptance criteria:
- `npm run report` executes a telco demo run and writes `output/report.html` and `output/report.json`
- HTML report sections: run summary, step trace table, audit event log, evaluation results table,
  compliance scores, coverage gaps
- JSON report contains the same data in machine-readable form
- Report generation completes in < 3 seconds on the telco example
- Implementation in `scripts/generate-report.js` using no new npm dependencies

Suggested labels: `area:observability`, `area:demo`, `type:feature`, `priority:p1`, `release:v0.4`

Suggested milestone: `v0.4`

### Story 4.5 — Retail-returns example journey with evaluation scenario

Add a third fictional journey that exercises the evaluation runner across a retail domain.

Acceptance criteria:
- Full YAML manifest set: agent, skill, 2+ policies, 3+ tools, workflow, system, audit events,
  2+ evaluation definitions (one `completion`, one `compliance`)
- Scenario A: straightforward return — all steps complete, both evaluations pass
- Scenario B: high-value return — policy flags for manual review, evaluation outcome `needs_review`
- `examples/retail-returns/README.md` — describes the journey and how to run it
- `npm run validate:references` passes

Suggested labels: `area:examples`, `area:evaluation`, `type:feature`, `priority:p2`, `release:v0.4`

Suggested milestone: `v0.4`

### Story 4.6 — Improvement-loop documentation

Document the feedback loop from audit → evaluation → improvement decision.

Acceptance criteria:
- `docs/governance/improvement-loop.md` covers: how audit events feed evaluation, how results
  drive policy review, and how policy changes are governed through the approval workflow
- Worked example uses the telco plan-change journey
- Linked from `docs/index.md` under the Governance section
- Clearly marks what is local-runtime simulation vs. future production behaviour

Suggested labels: `area:docs`, `area:governance`, `type:docs`, `priority:p2`, `release:v0.4`

Suggested milestone: `v0.4`

## Out of scope for v0.4

- External observability platforms (Prometheus, DataDog, OpenTelemetry exporters)
- Persistent database-backed result storage (deferred to v0.6)
- Real-time streaming evaluation
- Model quality or LLM-output evaluation (outside harness scope)
- Sensitive payload capture by default

## Exit Criteria

- `npm test` passes with 0 failures (all new evaluation tests included)
- `npm run report` produces `output/report.html` and `output/report.json` from a live telco run
- Compliance scores and coverage gaps are visible in the generated report
- Retail-returns journey runs end-to-end with evaluation results captured
- Improvement-loop documentation is linked from the docs index
