# Tool Gateway

## What it is

The Tool Gateway provides governed access to enterprise systems. It wraps APIs, MCP tools, data access, workflow actions, and system integrations with schema validation, policy checks, rate limits, and audit logging.

## Why it matters

Tools are where AI actions become system actions. Without a gateway, agents can gain direct access to sensitive APIs, broad data queries, or state-changing operations without consistent identity, policy, validation, or audit controls.

## How it works

Tools are registered as governed wrappers around specific system interactions. A tool declares its target system, adapter type, side-effect profile, input and output schemas, data classification, audit requirements, and risk tier.

At runtime, the gateway should check policy and identity before executing a tool call, validate inputs and outputs, apply rate limits, and emit trace and audit records.

## Manifest shape

```yaml
id: billing.calculate_price_delta
version: 0.1.0
status: active
name: Calculate Price Delta
adapter: mock
systemId: mock.billing-system
riskTier: T1
sideEffect: read
dataClassification: confidential
inputSchema: schemas/price-delta.input.json
outputSchema: schemas/price-delta.output.json
auditRequired: true
rateLimit:
  window: minute
  maxCalls: 60
```

## Relationships

- Skills reference tools they are allowed to use.
- Policies can allow, deny, or require approval before tool execution.
- Tools reference systems and schemas.
- Workflows can include tool steps.
- Context may provide bounded inputs to tools.
- Audit events should capture tool calls, side effects, outputs, and system interactions.

## Design rules

- Register tools before they can be used by skills.
- Validate input and output schemas.
- Declare side effects and data classification.
- Reference systems by ID rather than embedding private details.
- Use scoped workload identity for execution.
- Audit every meaningful tool call.

## Anti-patterns

- Giving agents raw API credentials.
- Letting tools perform broad unbounded actions.
- Skipping schema validation for model-generated inputs.
- Calling write tools without policy checks.
- Embedding real private system names in public examples.

## v0.1 scope

v0.1 defines the tool gateway concept, starter tool schema, and fictional mock tool examples. Runtime gateway execution, adapters, rate-limit enforcement, and production identity integration are deferred to later releases.
