# Backlog: Control Plane Dashboard

The control plane dashboard is the operator console for inspecting registries, policy decisions,
journey execution, audit trails, and evaluation outcomes. It lives in `apps/admin-console-placeholder/`.

See [`docs/architecture/control-plane-dashboard.md`](../docs/architecture/control-plane-dashboard.md)
for the full design rationale.

---

## Phase A: Static Registry Browser (v0.5)

Goal: operators can open the dashboard and browse all registered objects loaded from local YAML/JSON files.
No runtime required.

### A1 — App scaffold

- Set up `apps/admin-console/` with a minimal dev server and build script (no framework lock-in required for prototype; plain TypeScript + HTML or React both acceptable)
- Single-command start: `npm start` or equivalent from the repo root
- Read YAML/JSON files from `examples/` and `schemas/` at startup; expose as in-memory object store
- Basic responsive layout: sidebar nav, main panel, header with project name and version

### A2 — Object type navigation

- Sidebar lists all registry object types: Agents, Skills, Tools, Policies, Workflows, Systems, Context Scopes, UI Manifests
- Each type shows object count and status breakdown (draft / active / deprecated / retired) as a badge
- Clicking a type loads the object list panel

### A3 — Object list panel

- Table/card view of all objects for the selected type
- Columns: ID, name, version, status, risk level, owner
- Status indicator with color coding (active = green, draft = grey, deprecated = amber, retired = red)
- Click a row to open the object detail panel

### A4 — Object detail panel

- Shows all fields from the loaded YAML/JSON, rendered as structured key-value pairs
- Linked objects rendered as clickable chips (e.g. skill → tool IDs → navigate to that tool)
- Raw YAML/JSON toggle for technical inspection
- Breadcrumb: object type → object ID

### A5 — Filtering and search

- Filter bar on the list panel: status, risk level, owner (dropdowns)
- Text search across ID and name fields
- URL query params preserve filter state for sharing

### A6 — Governance summary home page

- Default landing page (not the registry list)
- Cards: total objects by type, risk level distribution chart, policy coverage count, objects in draft status
- Derived entirely from loaded local files; no runtime calls

---

## Phase B: Policy Inspector and Audit Trail (v0.5)

Goal: operators can inspect policy structure and review static audit event examples.

### B1 — Policy inspector panel

- Dedicated view under Policies showing policies grouped by `enforcementPoint`
- Each policy expanded to show: decisionType, appliesTo list, conditions table, obligations list, evidence requirements
- Decision type distribution donut (allow / deny / require_approval / require_consent)

### B2 — Policy → object cross-reference

- From a policy detail, show which skills and workflows reference it
- From a skill detail, show which policies are evaluated (already linked in skill schema)
- Clicking a cross-reference navigates to that object's detail panel

### B3 — Audit event list

- Load example audit event YAML files from `examples/telco-customer-care/audit-events/`
- Display as a filterable table: event type, actor, actor type, outcome, timestamp
- Click a row to open the event detail with full evidence payload rendered

### B4 — Audit event detail

- Structured viewer for all event fields
- Evidence payload section with key-value rendering
- Placeholder trace correlation section (label: "Trace view — available in Phase C")

---

## Phase C: Journey Monitor (v0.6)

Goal: operators can watch a demo journey execute step by step and see real-time state.
Requires local runtime (v0.2+) to be running.

### C1 — Runtime connection

- Dashboard connects to local runtime API (HTTP or WebSocket) when available
- Graceful fallback: if runtime is not running, show "demo mode — static data only" banner
- Runtime status indicator in header (connected / disconnected)

### C2 — Active journey list

- Live list of in-progress workflow executions: journey ID, workflow name, current step, elapsed time, status
- Auto-refreshes every few seconds or via WebSocket push

### C3 — Journey step trace

- Click a journey to open the step trace timeline
- Each step shown as a node: step ID, step type (tool / policy / approval / completion), status (pending / running / done / failed / blocked)
- Blocked steps show the blocking reason (e.g. "awaiting human approval", "policy denied")
- Completed steps show: tool called, policy decision made, UI manifest shown

### C4 — Historical journey list

- Completed and failed journeys with filters: status, workflow name, date range
- Click to view the full step trace (read-only)
- Rollback events shown as a separate section if present

### C5 — Trace-linked audit events

- From a journey detail, show the linked audit events in chronological order
- Clicking an audit event opens the event detail panel (from Phase B)

---

## Phase D: Evaluation Console (v0.6)

Goal: operators can track evaluation outcomes per target and identify compliance gaps.

### D1 — Evaluation result list

- Load evaluation result YAML files from `examples/telco-customer-care/evaluations/`
- Table: evaluation name, target type, target ID, metric type, outcome, date
- Filter by: target type, metric type, outcome

### D2 — Evaluation detail

- Full field rendering for an evaluation result
- Linked target object (click to navigate to skill/agent/workflow detail)
- Placeholder trend section (label: "Trend view — requires multiple result records")

### D3 — Compliance summary

- Per-skill and per-workflow compliance score: ratio of policy_compliance evaluations with passing outcomes
- Surface skills with no evaluation coverage (coverage gap indicator)
- Top-level compliance card on the home page (extends Phase A6)

---

## Phase E: Approval Queue (v0.7)

Goal: operators can action human-in-the-loop approval decisions from the dashboard.
Requires policy engine write model (v0.3+) and dashboard authentication.

### E1 — Pending approvals list

- Live list of `require_approval` decisions awaiting action: skill, requesting agent, risk level, evidence collected
- Sorted by age (oldest first)
- Filter by: skill, risk level, requesting agent

### E2 — Approval detail and action

- Full context for the pending decision: skill metadata, tool to be called, policy that triggered the gate, evidence payload
- Approve / reject buttons with required reason field
- Confirmation modal before submitting
- Action writes a decision record via the policy engine API

### E3 — Approval audit log

- Historical list of past approval decisions: who approved/rejected, when, reason, linked journey
- Read-only; wired to the audit trail (Phase B)

---

## Cross-cutting Stories (all phases)

### X1 — Schema-driven rendering

- Object detail panels are generated from the JSON schema definitions in `schemas/`
- Unknown fields render as generic key-value pairs (no dashboard code change needed for new fields)

### X2 — Accessible and keyboard navigable

- All interactive elements reachable by keyboard
- Sufficient color contrast for status indicators
- No color-only encoding (status labels accompany color)

### X3 — Demo journey fixture loader

- CLI flag or UI control to load a specific example journey directory
- Default: loads `examples/telco-customer-care/`
- Future: select from available journey directories

### X4 — Export

- Audit trail: export filtered results as JSON
- Evaluation results: export as JSON or CSV
- Object detail: export raw YAML/JSON

---

## Out of scope (this backlog)

- User authentication and role-based access (deferred to a separate security backlog)
- Write operations on registry objects (deferred to post-v0.7)
- Multi-tenant or cloud-hosted deployment (deferred to post-v0.7)
- Prompt or model management surfaces (outside harness scope)
