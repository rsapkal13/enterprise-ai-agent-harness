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

Suggested m