# Observability

## What it is

Observability captures engineering and governance evidence for AI capability execution. It includes traces, audit events, policy decisions, tool calls, approvals, outputs, side effects, cost, latency, and drift signals.

## Why it matters

Enterprise teams need to prove what happened, diagnose failures, measure reliability, and detect quality or compliance drift. Text logs alone are not enough because they do not reliably connect decisions, tools, systems, workflows, and outcomes.

## How it works

Runtime components should emit structured records that link back to registered objects. A trace can show the execution path, while audit events preserve governance evidence. Evaluation results can then reference traces and audit events to support improvement loops.

Observability helps operators understand behaviour. Audit preserves structured evidence for governance and review.

## Manifest shape

```yaml
id: audit.telco.plan-change.tool-call.example
version: 0.1.0
traceId: trace.telco.plan-change.example
timestamp: "2026-01-01T00:01:00Z"
eventType: tool_call
actor:
  type: agent
  id: customer-service-agent
references:
  skillId: customer.change_plan
  toolId: billing.calculate_price_delta
  systemId: mock.billing-system
outcome: completed
evidence:
  side_effect: read
  data_classification: confidential
```

## Relationships

- Agents, skills, policies, tools, workflows, systems, and evaluations should all be traceable.
- Policy decisions should produce auditable outcomes and obligations.
- Tool calls should capture inputs, outputs, side effects, and system references at an appropriate level.
- Workflow state changes should be visible.
- Evaluations should reference traces and audit evidence.

## Design rules

- Emit structured events, not only text logs.
- Correlate records with trace IDs.
- Capture policy decisions and tool side effects.
- Keep audit evidence public-safe in examples.
- Separate operational observability from governance audit semantics.

## Anti-patterns

- Logging prompts and outputs without object references.
- Omitting policy decisions from traces.
- Capturing sensitive data unnecessarily.
- Treating audit as debug logging.
- Measuring latency and cost while ignoring governance evidence.

## v0.1 scope

v0.1 defines observability and audit concepts, starter audit event schema, and fictional audit examples. Production telemetry pipelines, dashboards, alerting, cost attribution, and drift detection are deferred to later releases.
