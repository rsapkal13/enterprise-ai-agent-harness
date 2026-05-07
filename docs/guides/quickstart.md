# Quickstart

This guide helps you explore the v0.1 specification foundation. v0.1 does not include a production runtime.

## 1. Clone The Repository

```bash
git clone https://github.com/rsapkal13/enterprise-ai-agent-harness.git
cd enterprise-ai-agent-harness
```

## 2. Understand The Core Objects

Start with the operating model:

```text
Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
```

Read:

- `README.md`
- `docs/vision.md`
- `docs/architecture/overview.md`
- `docs/architecture/agent-skill-tool-policy-model.md`

## 3. Model The First Agent

Create an agent record that describes ownership, purpose, allowed skills, channels, context scopes, risk tier, and lifecycle state.

Start with `examples/telco-customer-care/agents/customer-service-agent.yaml`.

## 4. Define A Skill

Define a business capability the agent can request. A skill should describe required context, policies, tools, workflow, and evaluations.

Start with `examples/telco-customer-care/skills/customer-change-plan.yaml`.

## 5. Register A Tool

Register governed access to a system action or lookup. A tool should describe its target system, input and output schemas, side effect, data classification, and audit requirements.

Start with `examples/telco-customer-care/tools/billing-calculate-price-delta.yaml`.

## 6. Attach A Policy

Define whether the skill or tool action is allowed, denied, or requires consent or approval.

Start with `examples/telco-customer-care/policies/consent-required.yaml`.

## 7. Define A Workflow

Model the journey steps, including policy checks, tool calls, approvals, failure behaviour, and completion.

Start with `examples/telco-customer-care/workflows/change-plan.workflow.yaml`.

## 8. Validate The Model

The current validation is intentionally lightweight. Use the repository CI workflow as the source of truth for available checks.

Future v0.1 work should add YAML parsing and telco cross-reference validation.

## 9. Explore The Sample Journey

Read `examples/telco-customer-care/README.md` and the YAML files under that folder. The journey is fictional and designed to show how the model fits together.

## 10. Understand v0.1 Scope

v0.1 includes:

- Public documentation foundation
- Draft schemas
- Fictional enterprise journeys
- Backlog and milestones
- Contribution structure
- Package boundaries

Runtime execution, production identity integration, policy evaluation, workflow execution, and observability pipelines are deferred to later releases.

## What Not To Publish

Do not publish:

- Real customer data
- Credentials
- Private system names
- Internal approval thresholds
- Sensitive architecture notes
- Legal interpretations
- Operational contacts
- Organisation-specific strategy
