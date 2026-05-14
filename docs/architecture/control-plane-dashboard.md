# Control Plane Dashboard

The control plane dashboard is the operator-facing web console for the Enterprise AI Agent Harness.
It gives teams a single surface to inspect registries, govern policy decisions, monitor active journeys,
review audit trails, and track evaluation outcomes — without needing to read raw YAML or query logs directly.

## Role in the Architecture

```text
Operator / Governance Team
        |
        v
Control Plane Dashboard
        |
        |-- Registry Explorer     <-- reads agent, skill, tool, policy, workflow, system, context, ui-manifest objects
        |-- Policy Inspector      <-- reads policy definitions and decision logs
        |-- Journey Monitor       <-- reads workflow execution state and step traces
        |-- Audit Trail           <-- reads audit events and evidence payloads
        |-- Evaluation Console    <-- reads evaluation results and compliance signals
        |-- Approval Queue        <-- surfaces human-in-the-loop pending decisions
        |
        v
Enterprise AI Agent Harness (registries, policy engine, workflow engine, audit, observability)
```

## Design Principles

**Read before write.** The first version is read-only. Operators inspect and audit. Mutations stay in YAML/code
until the runtime and access control model are mature enough to support safe writes.

**Schema-driven rendering.** Every panel is driven by the same JSON schemas used by the harness itself.
Adding a new registry object type automatically makes it browsable without dashboard code changes.

**Governance-first layout.** The default view is not a list of agents — it is a governance summary:
risk distribution, policy coverage, pending approvals, and open audit obligations.

**Local-first, runtime-ready.** The first implementation reads local YAML/JSON files from the
`examples/` and `schemas/` directories. Later phases connect to the live runtime API.

## Surfaces

### 1. Registry Explorer

Browse all registered objects across types: agents, skills, tools, policies, workflows, systems,
context scopes, and UI manifests. Each object card shows:

- ID, version, status (draft / active / deprecated / retired)
- Risk level and owner
- Linked objects (e.g. skill → tools → policies → systems)
- Raw YAML/JSON viewer

Filters: status, risk level, object type, owner, tags.

### 2. Policy Inspector

View active policies organized by enforcement point:

- `agent_request` / `skill_invocation` / `tool_call` / `workflow_step` / `context_access` / `system_interaction`
- Decision type distribution (allow / deny / require_approval / require_consent)
- Conditions, obligations, and evidence requirements per policy
- Decision log (when runtime is available): recent decisions with outcomes and explanations

### 3. Journey Monitor

Track workflow executions step by step:

- Active journeys with current step, elapsed time, and blocking state
- Historical journeys with completion status and rollback events
- Step-level trace: tool calls made, policy decisions at each gate, UI manifests shown
- Linked audit events per journey

### 4. Audit Trail

Filterable log of all audit events:

- Event type, actor, outcome, and timestamp
- Evidence payload viewer
- Trace correlation: link related events across a single journey execution
- Export to JSON for compliance review

### 5. Evaluation Console

Aggregate view of evaluation results per target:

- By agent, skill, tool, workflow, or journey
- Metric types: completion, compliance, quality, latency, reliability, business outcome
- Trend indicators (requires multiple result records)
- Linked improvement signals

### 6. Approval Queue

Human-in-the-loop surface for `require_approval` decisions:

- Pending approvals with context: skill, tool, risk level, requesting agent, evidence collected so far
- Approve / reject action (phase 3+, after write model is defined)
- Audit log of past approval decisions

## Phases

| Phase | Milestone | Scope |
|-------|-----------|-------|
| A     | v0.5      | Static registry browser from local YAML/JSON |
| B     | v0.5      | Policy inspector and audit trail (static) |
| C     | v0.6      | Journey monitor connected to local runtime |
| D     | v0.6      | Evaluation console |
| E     | v0.7      | Approval queue with write model |

## Technology Constraints

- Must be runnable with a single command alongside the demo runner
- No external services required for phase A or B
- Vendor-neutral: no hard dependency on a specific UI framework (recommend React or plain HTML/TS for the demo prototype)
- Accessible and legible in a standard browser without authentication for demo mode
