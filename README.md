# Enterprise AI Harness

**Enterprise AI Harness** is an open‑source control plane for defining, registering,
governing, executing, and observing AI capabilities inside enterprise ecosystems.

It helps organisations move beyond simple chatbots and multi‑agent demos by creating
a governed execution layer for real business journeys.

## Why this exists

Enterprise AI does not fail because the model is weak.  It fails because agents
are connected to systems before the organisation has defined:

- What the AI is allowed to do.
- Which tools it can call.
- Which policies apply.
- Which approvals are required.
- Which identity the agent uses.
- How actions are audited.
- How failures are handled.
- How business outcomes are measured.

Enterprise AI Harness provides the missing operating layer.

## Core idea

```
Agent → Skill → Policy → Tool → Workflow → System → Audit
```

An agent should not call raw enterprise APIs directly.  Instead, it should
execute registered business skills through governed tools, policy checks,
workflow orchestration, and full observability.

## Key capabilities

### 1. Skill Registry

Define enterprise AI skills as reusable business capabilities.

Example:

```yaml
id: customer.change_plan
name: Change Customer Plan
description: Allows an authorised customer service agent to change a customer's plan
risk_level: high
owner: customer-platform-team
requires_consent: true
requires_human_approval: false
allowed_agents:
  - customer-service-agent
tools:
  - eligibility.check_plan_change
  - billing.calculate_price_delta
  - order.submit_plan_change
evals:
  - plan_change_success_rate
  - policy_compliance
  - rollback_success
```

### 2. Tool Registry

Wrap APIs, MCP tools, data queries, and workflow actions as business‑safe tools.

```yaml
id: billing.calculate_price_delta
type: api
method: POST
endpoint: /billing/price-delta
auth: service_identity
risk_level: medium
input_schema: ./schemas/price-delta.input.json
output_schema: ./schemas/price-delta.output.json
```

### 3. Agent Registry

Define each agent’s business identity, technical identity, permissions, and
operating boundaries.

```yaml
id: customer-service-agent
business_identity: Customer Service Agent
technical_identity:
  provider: entra_id
  client_id_ref: AZURE_CLIENT_ID
allowed_skills:
  - customer.check_balance
  - customer.change_plan
  - customer.replace_sim
channels:
  - voice
  - web
  - mobile
  - whatsapp
```

### 4. Policy Engine

Apply enterprise controls before the AI can act.  Policies can enforce:

- Customer consent.
- Human‑in‑the‑loop approval.
- PII restrictions.
- Risk‑based step‑up authentication.
- Tool‑level access.
- Channel restrictions.
- Rate limits.
- Audit requirements.

### 5. Workflow Orchestration

Execute multi‑step business journeys with:

- State management.
- Retry.
- Rollback and compensation.
- Async task handling.
- Customer‑visible journey status.

### 6. Observability

Trace every AI action:

- Agent request.
- Skill selected.
- Policy decision.
- Tool call.
- Workflow state.
- System response.
- Business outcome.
- Evaluation result.

## What this is not

Enterprise AI Harness is **not** another multi‑agent framework.  It does not
try to replace LangChain, Semantic Kernel, CrewAI, AutoGen, OpenAI Agents SDK,
Azure AI Foundry, or MCP.  It complements them by providing the enterprise
governance and execution layer around them.

## Reference architecture

```
Channels
  App · Web · Voice · Chat · Copilot

AI Runtime
  Agents · Assistants · Orchestrators

Enterprise AI Harness
  Skill Registry
  Tool Registry
  Agent Registry
  Policy Engine
  Workflow Engine
  Context Layer
  UI Manifest Registry
  Observability

Enterprise Systems
  CRM · Billing · ERP · Data Platform · Knowledge Base · Workflow Tools
```

## Project status

This project is in early design.

Planned milestones:

- [ ] Define Skill Registry schema.
- [ ] Define Tool Registry schema.
- [ ] Define Agent Registry schema.
- [ ] Build local harness runtime.
- [ ] Add policy engine.
- [ ] Add MCP tool gateway.
- [ ] Add workflow orchestration.
- [ ] Add observability dashboard.
- [ ] Add demo enterprise journeys.

## License

MIT License
