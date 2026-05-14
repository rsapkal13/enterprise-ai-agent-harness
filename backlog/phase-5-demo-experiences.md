# Phase 5: Dashboard Phases B, C & D + Documentation Website

Goal: complete the admin console as a connected operator tool and publish a public documentation site.

## What was already delivered in v0.2 (closed — no longer in scope here)

- Demo runner: telco plan-change journey, two scenarios (upgrade and high-value downgrade) ✅
- Banking card dispute end-to-end example ✅
- Interactive demo dashboard HTML ✅
- Admin console Phase A: static registry browser (object list, detail, filter, search, governance home) ✅
- Admin console Phase E scaffold: approval queue UI, dependency graph ✅
- `apps/admin-console/` — Vite/TypeScript app with dev/build/preview scripts ✅

## What is being completed in v0.3 (not repeated here)

- Insurance-claims example journey (Story 3.6)

## What is being completed in v0.4 (not repeated here)

- Retail-returns example journey with evaluation scenario (Story 4.5)

## Scope

### Story 5.1 — Admin console Phase B: Policy inspector

Operators can inspect policy structure, conditions, obligations, and cross-references between
policies and the skills/workflows that reference them.

Acceptance criteria:
- Dedicated Policies view with policies grouped by `enforcement_point` (skill_invocation, tool_call,
  workflow_step, context_access)
- Each policy expanded to show: `decisionType`, `applicableRiskTiers`, rules table
  (condition → decision → obligations), evidence requirements
- Decision type distribution donut chart (allow / deny / require_approval / require_consent)
- Cross-reference panel: from a policy, show which skills and workflows reference it
- From a skill detail, show which policies are evaluated (already in YAML `policies` field)
- Clicking a cross-reference navigates to that object's detail panel

Suggested labels: `area:dashboard`, `area:policy`, `type:feature`, `priority:p0`, `release:v0.5`

Suggested milestone: `v0.5`

### Story 5.2 — Admin console Phase B: Audit event list and detail

Operators can browse and inspect static audit event examples from YAML files.

Acceptance criteria:
- Load `examples/*/audit-events/*.yaml` files and display as a filterable table:
  event type, actor, actor type, outcome, timestamp
- Filters: outcome, actor type, date range, example journey (telco / banking / insurance / retail)
- Click a row to open event detail with all fields rendered as structured key-value pairs
- Placeholder trace correlation section: "Trace view — live in Phase C (v0.6)"

Suggested labels: `area:dashboard`, `area:observability`, `type:feature`, `priority:p0`, `release:v0.5`

Suggested milestone: `v0.5`

### Story 5.3 — Admin console Phase C: Journey monitor

Operators can watch a demo journey execute step-by-step and see real-time state.
Requires local runtime HTTP API (v0.6 Story 6.1).

Acceptance criteria:
- Dashboard connects to local runtime API (HTTP or WebSocket)
- Graceful fallback: if runtime is not running, show "demo mode — static data only" banner
- Runtime status indicator in header (connected / disconnected)
- Live list of in-progress workflow runs: run ID, workflow name, current step, elapsed time, status
- Auto-refreshes every 3 seconds or via WebSocket push
- Click a run to open step trace timeline: step ID, type, status, blocking reason (if blocked)
- Completed runs show rollback/compensation events as a separate section
- Historical journey list with filters: status, workflow name, date range

Suggested labels: `area:dashboard`, `area:workflow`, `type:feature`, `priority:p1`, `release:v0.5`

Suggested milestone: `v0.5`

### Story 5.4 — Admin console Phase D: Evaluation console

Operators can track evaluation outcomes per target and identify compliance gaps.

Acceptance criteria:
- Evaluation result list: evaluation name, target type, target ID, metric type, outcome, date
- Filters: target type, metric type, outcome
- Evaluation detail: full field rendering, linked target object, evidence section
- Compliance summary card: per-skill and per-workflow `complianceRate` (from `ComplianceScorer`)
- Coverage gap indicator: skills/workflows with no evaluation records highlighted in amber
- Compliance card extended on the governance home page (extends Phase A home)

Suggested labels: `area:dashboard`, `area:evaluation`, `type:feature`, `priority:p1`, `release:v0.5`

Suggested milestone: `v0.5`

### Story 5.5 — Documentation website

Publish a public documentation site aligned with the v0.2 spec and runtime.

Acceptance criteria:
- Static site generator (Docusaurus, VitePress, or equivalent) under `apps/website/`
- Sections: Getting Started, Concepts, Guides, API Reference, Governance, Example Journeys, Roadmap
- Content from `docs/` ported to site with navigation and search
- Website clearly separates: available in v0.2, coming in v0.3–v0.5, future roadmap
- No runtime overclaims; all fictional journey descriptions reference YAML source files
- `npm run website:dev` starts local dev server

Suggested labels: `area:website`, `area:docs`, `type:feature`, `priority:p1`, `release:v0.5`

Suggested milestone: `v0.5`

### Story 5.6 — Approval-required and rejected-action walkthroughs

Public walkthroughs of governance outcomes as worked examples on the website.

Acceptance criteria:
- Approval-required walkthrough: agent intent → skill selection → policy gate → approval → resume → audit
- Rejected-action walkthrough: policy denial or human rejection → compensation → audit evidence
- Both use telco plan-change journey manifests (fictional data only)
- Links to relevant YAML manifest files in the repository
- Published under `docs/guides/` and linked from the website navigation

Suggested labels: `area:examples`, `area:docs`, `type:docs`, `priority:p2`, `release:v0.5`

Suggested milestone: `v0.5`

### Story 5.7 — UI Manifest rendering example in admin console

Product engineers can see a UI manifest rendered through approved components.

Acceptance criteria:
- Example renders the `confirm-plan-change.yaml` UI manifest in the admin console
- Approved component names and required disclosures are visible
- Human approval prompt is shown when `require_approval` is present
- Rendering is local and fixture-driven; no network calls

Suggested labels: `area:ui-manifest`, `area:dashboard`, `type:feature`, `priority:p2`, `release:v0.5`

Suggested milestone: `v0.5`

## Out of scope for v0.5

- User authentication and RBAC (deferred to post-v0.8)
- Write operations on registry objects (deferred to post-v0.7)
- Multi-tenant or cloud-hosted deployment (deferred to post-v0.8)
- Production dashboard
- Prompt or model management surfaces

## Exit Criteria

- Admin console can browse registries, inspect policy conditions, replay an audit trail, and show
  evaluation outcomes without leaving the browser
- Journey monitor auto-refreshes and shows real-time step state from local runtime (Phase C)
- Evaluation console surfaces compliance scores and coverage gaps (Phase D)
- Documentation website is publicly accessible with spec-aligned content
- Approval-required and rejected-action walkthroughs are published and linked
