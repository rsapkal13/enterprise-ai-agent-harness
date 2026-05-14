# Cross-Reference Rules

Registry objects in the Enterprise AI Agent Harness reference each other by `id`.
This page documents which references are required, which are optional, and which are reserved for runtime.

These rules can be used as the basis for validation scripts and CI checks.

## The Reference Chain

```text
Agent
  -> allowedSkills            (Skill ids)

Skill
  -> allowedAgents            (Agent ids, optional)
  -> tools                    (Tool ids)
  -> policies                 (Policy ids)
  -> contextScopes            (Context Scope ids, optional)
  -> evaluations              (Evaluation ids, optional)

Tool
  -> systemId                 (System id)
  -> inputSchema              (path to input JSON Schema file)
  -> outputSchema             (path to output JSON Schema file)

Policy
  -> appliesTo                (Skill ids, Tool ids, Workflow ids, or risk class strings)
  -> subject.allowedIds       (Agent ids, optional)
  -> resource.ids             (Skill ids, Tool ids, Workflow ids, optional)

Workflow
  -> steps[].policy           (Policy id, for policy-type steps)
  -> steps[].tool             (Tool id, for tool-type steps)
  -> steps[].uiManifest       (UI Manifest id, for approval-type steps)
  -> evaluations              (Evaluation ids, optional)

Audit Event
  -> agentId                  (Agent id)
  -> skillId                  (Skill id, if skill-scoped)
  -> toolId                   (Tool id, if tool-scoped)
  -> policyId                 (Policy id, if policy-scoped)
  -> workflowId               (Workflow id, if workflow-scoped)

Evaluation
  -> targetType               (agent | skill | tool | workflow | policy | journey)
  -> targetId                 (id of the referenced target object)
```

## Required References

These references must resolve for a valid spec object. CI and validation scripts should enforce these.

| Object | Field | Resolves to |
|--------|-------|-------------|
| Agent | `allowedSkills[]` | Skill ids |
| Skill | `tools[]` | Tool ids |
| Skill | `policies[]` | Policy ids |
| Tool | `systemId` | System id |
| Workflow step (type: `tool`) | `tool` | Tool id |
| Workflow step (type: `policy`) | `policy` | Policy id |
| Workflow step (type: `approval`) | `uiManifest` | UI Manifest id |
| Evaluation | `targetId` | id of object matching `targetType` |

## Optional References

These references are encouraged but not required for a valid v0.1 spec object.

| Object | Field | Resolves to |
|--------|-------|-------------|
| Skill | `allowedAgents[]` | Agent ids |
| Skill | `contextScopes[]` | Context Scope ids |
| Skill | `evaluations[]` | Evaluation ids |
| Policy | `subject.allowedIds[]` | Agent ids |
| Policy | `resource.ids[]` | Skill, Tool, or Workflow ids |
| Workflow | `evaluations[]` | Evaluation ids |

## Tool Schema References

Tools may declare input and output schemas as file paths relative to the example journey directory.
These paths should resolve to valid JSON Schema files.

```yaml
# Example: tool referencing schema files
inputSchema: schemas/plan-change-eligibility.input.json
outputSchema: schemas/plan-change-eligibility.output.json
```

Both files should exist and parse as valid JSON.

## What v0.1 Validates

The v0.1 validation scripts (`scripts/validate-schemas.js` and `scripts/validate-examples.js`) check:

- JSON Schema files under `schemas/` compile without errors.
- YAML files under `examples/` parse without errors.
- The telco customer-care example has basic cross-reference integrity:
  - Skill tool references resolve to tool files that exist.
  - Skill policy references resolve to policy files that exist.
  - Workflow step tool and policy references resolve.

## What Is Deferred to Runtime

These reference rules are defined in the spec but not enforced until runtime is available:

- Policy `appliesTo` values resolving to active skills/tools/workflows in a live registry.
- Context scope references resolving to declared scopes with appropriate data classification.
- Audit event actor and object references resolving to live registry records.
- Evaluation `targetId` cross-validating against runtime execution records.

## Telco Customer-Care Reference Map

The following shows the actual cross-reference graph for the telco example journey.

```text
customer-service-agent
  -> customer.change_plan
       -> tools:    eligibility.check_plan_change
                    billing.calculate_price_delta
                    order.prepare_plan_change_request
                    customer.read_limited_profile
       -> policies: consent.required
                    high_risk.action
                    customer_data.access
       -> workflow: customer.change_plan.workflow
                      step: consent.required            (policy)
                      step: eligibility.check_plan_change (tool)
                      step: billing.calculate_price_delta  (tool)
                      step: high_risk.action            (policy)
                      step: confirm-plan-change         (ui manifest)
                      step: order.prepare_plan_change_request (tool)
  -> customer.check_balance
  -> customer.replace_sim

Tools -> Systems:
  eligibility.check_plan_change        -> fictional-eligibility-system
  billing.calculate_price_delta        -> fictional-billing-system
  order.prepare_plan_change_request    -> fictional-order-system
  customer.read_limited_profile        -> fictional-crm-system
```
