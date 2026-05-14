# Milestones

## v0.1 - Spec Release ✅ Tagged: v0.1.0-alpha

- Repository foundation
- Public docs and draft schemas
- Telco customer-care sample journey (agent, skill, policy, tool, workflow, system, context, audit, evaluation, UI manifest)
- Architecture and governance documentation
- Cross-reference validation tooling

## v0.2 - Local Runtime Preview ✅ Ready to tag: v0.2.0

Delivered (original scope plus significant pull-forward):

- YAML manifest loader with field mapping
- In-memory registries for all nine object types with lifecycle state machine
- Registry-backed mock tool gateway (mock / REST / MCP adapters)
- Workflow engine: tool, policy, approval, and completion step execution
- Rule-based policy evaluator with condition matching (subject, resource, context, risk-tier ceiling)
- Human approval gates (park/resume workflow execution)
- LIFO compensation stack (saga-style undo on failure)
- Per-step retry with exponential backoff
- Append-only in-memory audit sink (write, queryable by traceId / actor / time / outcome)
- Structured trace emitter with correlation IDs and child emitter support
- Telco plan-change demo runner (upgrade and high-value downgrade scenarios)
- Banking card dispute end-to-end example
- Interactive demo dashboard (HTML)
- Governance portal admin console — Phase A static registry browser + Phase E approval queue scaffold
- 167 tests, 53 suites, 0 failures across 7 packages

Issues to close at v0.2.0 tag:
- #54 Workflow engine core
- #55 In-memory registries
- #56 Tool gateway with registry-backed routing
- #57 In-memory workflow engine (JS runtime)
- #58 Demo runner — telco plan-change journey
- #59 Banking card dispute example
- #60 Policy engine �