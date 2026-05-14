# Phase 6: Runtime-Connected Dashboard

Goal: connect the dashboard to local runtime evidence while keeping the experience safe for public
open-source demos.

## Scope

- Runtime status indicator
- Journey monitor connected to local runtime or local fixtures
- Trace-linked audit event navigation
- Evaluation console over local results
- Runtime package naming and publishing strategy
- CLI scope for validation and local fixture workflows

## Exit Criteria

- Dashboard can show connected or fixture-only mode.
- Journey executions can be inspected step by step.
- Audit events and trace events can be correlated.
- Evaluation coverage is visible by registry object.
- Runtime and package naming are documented before website claims are expanded.

## Issue-Ready Stories

### Story 6.1: Add Runtime Status Contract

As a dashboard user, I want to know whether I am looking at static fixtures or a running local
runtime so that I do not confuse demo data with live execution.

Acceptance criteria:

- Runtime status model includes connected, disconnected, fixture-only, and error.
- Dashboard shows current mode in the header.
- Fixture mode is the default when no runtime is available.
- No production endpoint assumptions are introduced.

Suggested labels: `area:website`, `area:runtime`, `type:feature`, `priority:p1`, `release:v0.6`

Suggested milestone: `v0.6`

### Story 6.2: Add Journey Monitor View

As an operator, I want to inspect local journey execution so that workflow state is understandable.

Acceptance criteria:

- Journey list shows run ID, workflow ID, status, current step, started time, and outcome.
- Journey detail shows ordered steps, policy decisions, tool calls, approvals, compensation, and
  audit references.
- View works from local fixtures before runtime API exists.

Suggested labels: `area:workflow`, `area:observability`, `type:feature`, `priority:p1`, `release:v0.6`

Suggested milestone: `v0.6`

### Story 6.3: Add Evaluation Console

As a governance reviewer, I want an evaluation console so that certification gaps are visible.

Acceptance criteria:

- Evaluation results can be listed by target type and target ID.
- Failed or missing evaluations are highlighted.
- Evaluation detail links back to related agent, skill, tool, workflow, and trace IDs.
- Console uses fictional examples only.

Suggested labels: `area:observability`, `area:examples`, `type:feature`, `priority:p1`, `release:v0.6`

Suggested milestone: `v0.6`

### Story 6.4: Define Runtime Package Naming

As a maintainer, I want package names settled before publishing so that docs, website, examples, and
imports do not drift.

Acceptance criteria:

- Package naming proposal covers core, registries, policy engine, workflow engine, tool gateway,
  observability, audit, evaluation, and UI manifest.
- Proposal states whether packages are private workspaces, npm-publishable packages, or placeholders.
- Website uses only approved names.

Suggested labels: `area:runtime`, `type:design`, `priority:p1`, `release:v0.6`

Suggested milestone: `v0.6`
