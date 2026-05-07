# Registering A Tool

A tool is a governed wrapper around a system action, lookup, data access path, workflow command, API, or MCP tool.

## Steps

1. Choose a stable tool ID.
2. Describe the action in business-safe language.
3. Reference the target system.
4. Declare adapter type.
5. Define input and output schemas.
6. Classify data and side effects.
7. Attach audit requirements.
8. Keep the tool narrow enough to govern and test.

## Example

```yaml
id: billing.calculate_price_delta
version: 0.1.0
status: active
name: Calculate Price Delta
description: Calculate a fictional before-and-after price comparison.
adapter: mock
systemId: mock.billing-system
riskTier: T1
sideEffect: read
dataClassification: confidential
inputSchema: schemas/price-delta.input.json
outputSchema: schemas/price-delta.output.json
auditRequired: true
```

## Design Checks

- Does the tool reference a registered system?
- Is the side effect clear?
- Are inputs and outputs schema-bound?
- Does the tool avoid broad, unbounded system access?
- Will policy and audit checks happen before execution?
