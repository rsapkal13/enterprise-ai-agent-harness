# Project State

This file is a lightweight handoff note for future AI assistants and contributors working in this repository.

## Project

Name: Enterprise AI Agent Harness

Short name used in framing: AgentHarness

Repository: `rsapkal13/enterprise-ai-agent-harness`

Core model:

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

Project framing:

AgentHarness is an open-source specification and execution-harness project for defining, registering, governing, executing, observing, and improving AI capabilities across enterprise ecosystems.

It is not another multi-agent framework. It is the enterprise control plane around AI agents: capability registration, policy decisions, workload identity, workflow boundaries, context access, auditability, evaluation, and lifecycle governance.

## Product Framing

One control plane. Two surfaces.

Surface 1: A business-facing control plane portal for registering, approving, monitoring, certifying, and retiring AI capabilities.

Surface 2: An open-source engineering codebase that makes governance decisions enforceable at runtime through schemas, SDKs, registries, policy, identity, tool gateways, workflows, evaluation, and observability.

## Current Release Focus

Current target: `v0.1 - Spec Release`

v0.1 is intentionally a specification release, not a runtime release.

Included in v0.1:

- Public documentation foundation
- Draft schemas
- Fictional enterprise journeys
- Backlog and milestones
- Contribution structure
- Package boundaries
- Lightweight validation tooling

Out of scope for v0.1:

- Production runtime
- Production policy execution
- Real system integrations
- Real customer data
- Organisation-specific approval thresholds
- Private architecture details

## Core Capabilities

1. Agent Registry
2. Skill Registry
3. Tool Gateway
4. Identity and Policy
5. Workflow Engine
6. Context Layer
7. Evaluation Service
8. Observability and Audit

## Risk Model

Risk tiers:

- `T0` - Informational
- `T1` - Bounded operational
- `T2` - Transactional
- `T3` - High impact

Governance scales with risk, not bureaucracy. Approval requirements, evaluation depth, identity controls, human oversight, observability, and recertification requirements depend on risk tier.

## What Has Been Built So Far

### Repository Foundation

Created or updated:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `ROADMAP.md`
- `.gitignore`
- `.editorconfig`
- `.github/ISSUE_TEMPLATE/*`
- `.github/pull_request_template.md`
- `.github/workflows/validate.yml`

### Documentation

Expanded the public docs under `docs/`.

Key docs updated:

- `docs/vision.md`
- `docs/architecture/overview.md`
- `docs/architecture/reference-architecture.md`
- `docs/architecture/design-principles.md`
- `docs/architecture/agent-skill-tool-policy-model.md`

Concept docs expanded under `docs/concepts/`:

- `agent-registry.md`
- `skill-registry.md`
- `tool-registry.md`
- `policy-engine.md`
- `workflow-orchestration.md`
- `context-layer.md`
- `experience-manifest.md`
- `observability.md`
- `evaluation.md`

Governance and guide docs expanded:

- `docs/governance/risk-classification.md`
- `docs/governance/approval-workflow.md`
- `docs/governance/responsible-ai.md`
- `docs/governance/audit-model.md`
- `docs/governance/human-in-the-loop.md`
- `docs/governance/data-and-privacy.md`
- `docs/guides/quickstart.md`
- `docs/guides/defining-a-skill.md`
- `docs/guides/registering-a-tool.md`
- `docs/guides/creating-an-agent.md`
- `docs/guides/defining-a-policy.md`
- `docs/guides/creating-a-workflow.md`
- `docs/guides/running-a-demo-journey.md`

### Schemas

Hardened v0.1 schemas under `schemas/`:

- `agent.schema.json`
- `skill.schema.json`
- `tool.schema.json`
- `policy.schema.json`
- `workflow.schema.json`
- `system.schema.json`
- `context-scope.schema.json`
- `audit-event.schema.json`
- `evaluation.schema.json`
- `ui-manifest.schema.json`

Important schema decisions:

- Use JSON Schema draft 2020-12.
- Use string IDs for references between objects.
- Include `version`, `owner`, `risk_tier`, `lifecycle_state`, and environment fields where relevant.
- Keep schemas vendor-neutral.
- Avoid runtime-specific hard dependencies.

Known schema caveat:

- Older `schemas/context.schema.json` may still exist alongside `schemas/context-scope.schema.json`. Future cleanup should decide whether to remove, alias, or deprecate the older file.

### Telco Example

Expanded and aligned fictional telco customer-care journey under `examples/telco-customer-care/`.

The journey demonstrates:

```text
customer-service-agent
-> customer.change_plan
-> consent.required, customer_data.access, high_risk.action
-> customer.read_limited_profile, eligibility.check_plan_change, billing.calculate_price_delta, order.prepare_plan_change_request
-> customer.change_plan.workflow
-> fictional CRM, product catalogue, billing, and order systems
-> allowed, blocked, and approval-required audit events
```

Important example folders:

- `agents/`
- `skills/`
- `tools/`
- `policies/`
- `workflows/`
- `systems/`
- `context-scopes/`
- `audit-events/`
- `evaluations/`
- `ui-manifests/`
- `schemas/`

The example is fictional and must remain free of real company names, real APIs, real customer data, credentials, or private architecture details.

### Backlog

Expanded public backlog:

- `backlog/README.md`
- `backlog/epics.md`
- `backlog/milestones.md`
- `backlog/phase-0-foundation.md`
- `backlog/phase-1-spec-release.md`
- `backlog/phase-2-local-runtime.md`
- `backlog/phase-3-policy-and-workflow.md`
- `backlog/phase-4-observability.md`
- `backlog/phase-5-demo-experiences.md`

The v0.1 phase backlog has issue-ready stories with acceptance criteria, labels, priority, and milestone.

### Validation Tooling

Added lightweight validation tooling:

- `package.json`
- `package-lock.json`
- `scripts/validate-schemas.js`
- `scripts/validate-examples.js`
- `.github/workflows/validate.yml`

Dependencies:

- `ajv`
- `yaml`

NPM scripts:

```bash
npm run validate:schemas
npm run validate:examples
npm run validate
```

Validation currently checks:

- JSON schemas under `schemas/` are valid and compile with Ajv.
- YAML files under `examples/` parse.
- Example manifests contain key required fields.
- Telco sample has basic cross-reference integrity across agents, skills, tools, policies, workflows, systems, context scopes, audit events, evaluations, UI manifests, and tool IO schemas.

## GitHub Issues And Labels

A first batch of GitHub issues was created earlier for docs, schemas, examples, validation, runtime skeleton, policy/workflow, observability, and demo work.

Suggested label set includes:

- `area:docs`
- `area:schema`
- `area:examples`
- `area:validation`
- `area:website`
- `area:ci`
- `type:feature`
- `type:docs`
- `type:good-first-issue`
- `priority:p0`
- `priority:p1`
- `release:v0.1`

GitHub CLI is installed at:

```text
C:\Program Files\GitHub CLI\gh.exe
```

Project creation required Project scopes. If needed, refresh auth with:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth refresh -s project
```

## Public vs Private Boundary

Public GitHub should contain:

- Reusable open-source patterns
- Schemas
- Fictional examples
- Public documentation
- Backlog
- Validation tooling
- Code intended for open-source reuse

Private tools such as Notion should contain:

- Organisation-specific strategy
- Internal approval thresholds
- Sensitive architecture notes
- Customer-specific examples
- Real system names
- Credentials
- Legal interpretations
- Operational contacts

## Current Local Git Situation

The user reported that local `main` was behind `origin/main` by two commits after pushing changes through Claude.

At that time, `git pull` was blocked because local modified backlog files would be overwritten.

Recommended safe sync flow:

```powershell
git stash push -u -m "local work before syncing"
git pull --ff-only
git stash pop
```

If conflicts appear, resolve the conflict markers, then:

```powershell
git add <resolved-files>
git commit -m "docs: merge local updates"
```

Do not blindly discard local changes unless the user explicitly asks.

`.claude/` appeared as an untracked local folder. Treat it as local tooling unless the user explicitly wants it committed.

## Recommended Next Tasks

High-priority next tasks:

1. Resolve local Git sync safely with stash or commit.
2. Decide whether to keep or retire `schemas/context.schema.json`.
3. Run `npm run validate` after syncing.
4. Create or reconcile GitHub labels.
5. Add GitHub Project board if Project auth scope is available.
6. Convert v0.1 backlog stories into GitHub issues if not already complete.
7. Add architecture diagrams and approval workflow diagram.
8. Add public glossary.

## Suggested Commit Messages Used Recently

- `docs: align vision and architecture with AgentHarness framing`
- `docs: expand concept pages for core AgentHarness capabilities`
- `docs: expand governance and getting-started guidance`
- `schema: harden v0.1 registry object definitions`
- `examples: align telco customer-care journey with v0.1 schemas`
- `ci: add lightweight v0.1 schema and example validation`

## Guardrails For Future Work

- Do not add real customer data.
- Do not add credentials.
- Do not add private system names.
- Do not add organisation-specific approval thresholds.
- Do not build production runtime features in v0.1 tasks.
- Keep examples fictional and reusable.
- Keep docs vendor-neutral and architecture-friendly.
- Prefer small issue-sized changes.
