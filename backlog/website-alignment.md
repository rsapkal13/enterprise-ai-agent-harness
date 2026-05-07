# Backlog: Website Alignment

Goal: keep the public website aligned with the repository's current specification, examples, and
future roadmap.

The website can describe the long-term AgentHarness vision, but it must not present future runtime,
CLI, deployment, or agent-mesh capabilities as currently available.

## Story W1: Align Website Core Capabilities

As a visitor, I want the website to use the same core capability model as the repository so that the
project direction is clear.

Acceptance criteria:

- Website lists the current core capabilities:
  - Agent Registry
  - Skill Registry
  - Tool Gateway
  - Identity and Policy
  - Workflow Engine
  - Context Layer
  - Evaluation Service
  - Observability and Audit
- Website keeps the operating model visible:
  `Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit`
- Website does not present Agent Directory or Mesh as a current v0.1 core capability.

Suggested labels: `area:website`, `type:docs`, `priority:p0`, `release:v0.1`

Suggested milestone: `v0.1`

## Story W2: Separate Current Scope From Future State

As a contributor, I want the website to distinguish available v0.1 content from future roadmap
items so that I do not assume runtime features already exist.

Acceptance criteria:

- Website states that `v0.1` is a specification release.
- Website says runtime implementation is intentionally out of scope for `v0.1`.
- CLI, Docker, Helm, hosted deployment, and runtime SDK claims are marked as future roadmap items
  unless implemented in the repository.
- Future-state sections link back to roadmap or backlog pages where possible.

Suggested labels: `area:website`, `type:docs`, `priority:p0`, `release:v0.1`

Suggested milestone: `v0.1`

## Story W3: Align Telco Example With Repository Manifests

As a reader, I want the website telco example to use the same fictional objects as the repository so
that the example is easy to trace.

Acceptance criteria:

- Website references `customer-service-agent`.
- Website references `customer.change_plan`.
- Website references `consent.required`, `customer_data.access`, and `high_risk.action`.
- Website references the governed tools from `examples/telco-customer-care/tools/`.
- Website states that the journey prepares a change request and does not imply a production
  integration applies the change.
- Website links to `examples/telco-customer-care/`.

Suggested labels: `area:website`, `area:examples`, `type:docs`, `priority:p1`, `release:v0.1`

Suggested milestone: `v0.1`

## Story W4: Add Missing Concept Pages

As an architect, I want the website concepts section to cover all first-class AgentHarness objects
so that the public site reflects the repository architecture.

Acceptance criteria:

- Website includes concept pages for:
  - Context Layer
  - Experience Manifest
  - Evaluation Service
  - Observability and Audit
  - System Registry
  - Audit Model
- Each page follows the public docs pattern:
  - What it is
  - Why it matters
  - How it works
  - Manifest shape
  - Relationships
  - Design rules
  - Anti-patterns
  - v0.1 scope

Suggested labels: `area:website`, `area:docs`, `type:docs`, `priority:p1`, `release:v0.1`

Suggested milestone: `v0.1`

## Story W5: Remove Real-Looking Claims And Examples

As an open-source maintainer, I want website copy to avoid sensitive, real-looking, or unsupported
claims so that the project stays vendor-neutral and organisation-neutral.

Acceptance criteria:

- Website does not include unsupported quantified outcomes such as exact AHT, CSAT, or automation
  percentages.
- Website examples avoid real-looking internal endpoints, private domains, credentials, customer
  data, and vendor-specific model names.
- Website uses fictional but generic names and clearly labels examples as illustrative.
- Corrupted typography characters are fixed.

Suggested labels: `area:website`, `type:docs`, `priority:p1`, `release:v0.1`

Suggested milestone: `v0.1`
