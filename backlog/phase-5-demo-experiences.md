# Phase 5: Demo Experiences

Goal: create usable public demos after the specification and local runtime are stable.

## Scope

- Documentation website
- Admin console prototype
- Demo runner
- Additional fictional enterprise journeys
- Static control-plane views over registry objects
- Website alignment with current spec and future roadmap

## Exit Criteria

- Users can inspect registries and run demo journeys locally
- UI manifests inform user-facing screens
- Examples remain fictional and vendor-neutral
- Website clearly separates v0.1 specification scope from future runtime, CLI, deployment, and
  agent-directory capabilities

## Issue-Ready Stories

### Story 5.1: Align Public Website With v0.1 Spec Scope

As a visitor, I want the website to describe what exists today and what is future roadmap so that I
do not mistake planned runtime capabilities for released features.

Acceptance criteria:

- Website states that v0.1 is a specification release.
- CLI scaffolding, Docker, Helm, runtime SDKs, and agent mesh are not presented as available
  v0.1 capabilities.
- Future-state items link back to public roadmap or backlog.

Suggested labels: `area:website`, `type:docs`, `priority:p0`, `release:v0.1`

Suggested milestone: `v0.1`

### Story 5.2: Publish Schema-Aligned Telco Journey On Website

As an architect, I want the website sample journey to match the repository manifests so that I can
trace the public narrative to real files.

Acceptance criteria:

- Website references the same agent, skill, policies, tools, workflow, systems, evaluations, UI
  manifest, and audit outcomes as `examples/telco-customer-care/`.
- Website labels the journey as fictional and organisation-neutral.
- Website avoids claims that a real system is updated.

Suggested labels: `area:website`, `area:examples`, `type:docs`, `priority:p1`, `release:v0.1`

Suggested milestone: `v0.1`
