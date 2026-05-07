# Backlog: Runtime CLI, Packaging, and Deployment

Goal: define the future developer experience for AgentHarness without overstating current v0.1
capability.

`v0.1` includes schemas, examples, package boundaries, and validation tooling. CLI scaffolding,
runtime SDKs, Docker, Helm, and deployment patterns are future work.

## Story R1: Define CLI Scope

As a contributor, I want a clear CLI scope proposal so that future command examples are realistic
and aligned with the repository.

Acceptance criteria:

- CLI proposal separates `v0.1` validation commands from future runtime commands.
- Initial candidate commands are limited to:
  - validate schemas
  - validate examples
  - inspect manifest references
  - load a local fixture directory
- The proposal explicitly defers live tool execution, production workflow execution, and hosted
  deployment.

Suggested labels: `area:runtime`, `area:ci`, `type:design`, `priority:p1`, `release:v0.2`

Suggested milestone: `v0.2`

## Story R2: Define Package Naming Strategy

As a maintainer, I want a package naming and publishing strategy so that future SDK package names do
not drift across docs, website, and code.

Acceptance criteria:

- Proposal covers package names for:
  - core
  - registries
  - policy engine
  - workflow engine
  - tool gateway
  - observability
  - audit
  - evaluation
  - UI manifest
- Proposal states whether package names are npm scopes, internal workspace names, or placeholders.
- Website uses only names approved by this proposal.

Suggested labels: `area:runtime`, `type:design`, `priority:p1`, `release:v0.6`

Suggested milestone: `v0.6`

## Story R3: Define Local Runtime Preview Boundary

As an engineer, I want the local runtime preview boundary documented so that early runtime work does
not become production infrastructure by accident.

Acceptance criteria:

- Runtime preview is limited to local fixture loading, in-memory registries, mock tool gateway,
  policy decision contracts, and simple workflow simulation.
- No production auth, cloud hosting, persistent storage, or real system adapters are required.
- Docs explain that runtime preview exists to test the specification, not to operate production AI.

Suggested labels: `area:runtime`, `type:design`, `priority:p0`, `release:v0.2`

Suggested milestone: `v0.2`

## Story R4: Define Deployment Strategy As Future Work

As a maintainer, I want deployment language to be staged so that website and docs do not promise
Docker, Helm, or hosted deployment before the runtime exists.

Acceptance criteria:

- Roadmap identifies deployment guidance as post-runtime work.
- Website does not present Docker Compose, Kubernetes, Helm, or managed hosting as current
  capabilities.
- Future deployment proposal includes local, self-hosted, and managed considerations without
  vendor lock-in.

Suggested labels: `area:runtime`, `type:design`, `priority:p2`, `release:v0.6`

Suggested milestone: `Post-v0.8`
