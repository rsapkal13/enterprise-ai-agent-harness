# Enterprise AI Agent Harness

Welcome to the Enterprise AI Agent Harness documentation. This is a specification for the control layer that enables governed, auditable AI execution in enterprise environments.

> **v0.1 Note:** This is a specification release focused on schema definition and reference implementations. Runtime execution is out of scope for v0.1.

---

## Start Here

**New to the Harness?** Choose your path based on your role:

- **Enterprise Architects & Governance Leaders** → [Vision](./vision.md) | [Governance Model](./governance.md) | [Architecture Overview](./architecture.md)
- **Developers & Integrators** → [Quickstart](./quickstart.md) | [Concepts](./concepts/) | [Schemas](./schemas/)
- **Security & Compliance Teams** → [Governance Model](./governance.md) | [Audit Model](./concepts/audit.md) | [Privacy Framework](./governance.md)
- **Open Source Contributors** → [Contributing](../CONTRIBUTING.md) | [Architecture](./architecture.md) | [Backlog](../BACKLOG.md)

---

## What is Enterprise AI Agent Harness?

The **Enterprise AI Agent Harness** is an open, vendor-neutral specification for building governed AI agent systems. It defines:

- **How agents execute** multi-step workflows with human oversight
- **How governance is applied** through policies, approvals, and consent checkpoints
- **How actions are audited** for compliance and risk management
- **How systems remain observable** through standardized traces and evaluations

The Harness is designed for enterprises that need:
- ✅ Explainability and auditability of AI decisions
- ✅ Fine-grained control and approval workflows
- ✅ Risk and compliance frameworks
- ✅ Vendor independence and portability

---

## Core Operating Model

The Harness defines five core abstractions:

| Object | Purpose |
|--------|---------|
| **Agent** | Describes an AI entity with capabilities, policies, and execution context |
| **Skill** | Encapsulates a reusable task or decision point |
| **Tool** | External system integration (APIs, databases, services) |
| **Workflow** | Orchestrates skills and tools with conditions, approvals, and retries |
| **Policy** | Governs execution through consent checkpoints, approval gates, and compliance rules |

These objects are managed in a **Registry** and composed into **Systems** that execute bounded business journeys.

---

## Reading Paths

### 🎯 The Big Picture (15 min read)
1. [Vision](./vision.md) — Why the Harness exists
2. [Architecture Overview](./architecture.md) — System boundaries and design principles

### 🛠️ Building with the Harness (30 min read)
1. [Core Concepts](./concepts/) — Registry, agents, skills, tools, workflows, policies
2. [Schema Overview](./schemas/) — How objects are defined
3. [Quickstart Guide](./quickstart.md) — Your first agent manifest

### 📋 Governance & Compliance (25 min read)
1. [Governance Model](./governance.md) — Responsible AI framework
2. [Audit & Tracing](./concepts/audit.md) — How execution is recorded
3. [Privacy & Data Handling](./governance.md#privacy-framework)

### 🔍 Deep Dives (45 min+ read)
1. [Agent Lifecycle](./reference/lifecycle.md)
2. [Policy Decision Model](./concepts/policy.md)
3. [Workflow Execution Model](./concepts/workflow.md)
4. [Observability & Evaluation](./concepts/observability.md)

---

## Specification Objects

The Harness defines portable JSON Schema specifications for:

- **agent.schema.json** — Agent configuration and capabilities
- **skill.schema.json** — Skill definitions and contracts
- **tool.schema.json** — Tool gateway configuration
- **policy.schema.json** — Governance and control rules
- **workflow.schema.json** — Execution orchestration
- **ui-manifest.schema.json** — User interaction definitions
- **evaluation.schema.json** — Quality metrics and assessment

👉 [View all schemas →](./schemas/)

---

## Governance Model

The Harness embeds governance at three levels:

1. **Policy Layer** — Consent, approval, and compliance checkpoints
2. **Audit Layer** — Immutable recording of execution traces and decisions
3. **Evaluation Layer** — Quality, safety, and compliance assessment

For details, see [Governance & Compliance](./governance.md).

---

## Example Journey: Telco Customer Care

The **telco change-plan example** demonstrates a real-world customer service journey:

- Customer requests a plan change
- Agent gathers context and validates eligibility
- Policy gates require approval for high-value changes
- System executes tools to process the change
- Audit trail captures all decisions and user interactions
- Evaluation metrics measure customer satisfaction

👉 [Explore the telco example →](./examples/telco-customer-care/)

---

## v0.1 Scope

**In scope for v0.1:**
- ✅ Schema finalization for all core objects
- ✅ Reference examples (telco, banking)
- ✅ Governance model definition
- ✅ Audit and compliance framework
- ✅ CI/CD validation tooling

**Out of scope for v0.1:**
- ❌ Runtime execution engine
- ❌ Policy engine implementation
- ❌ Tool gateway implementation
- ❌ Production observability integrations

---

## What's Not Included

The Harness is a **specification and framework**, not a runtime platform. You will need to:

- **Implement the runtime** that interprets these schemas
- **Build the policy engine** that evaluates governance rules
- **Integrate external tools** through the tool gateway interface
- **Deploy observability** for your execution environment

The Harness provides the **vocabulary and contracts**; you provide the **execution engine**.

---

## Get Involved

### For Developers
- 📖 [Contributing Guide](../CONTRIBUTING.md)
- 🐛 [Issues & Features](../issues)
- 🗺️ [Roadmap](../ROADMAP.md)

### For the Community
- 💬 [Discussions](../discussions)
- 📋 [Backlog](../BACKLOG.md)
- ⭐ Star the repo if you find this useful!

---

## Quick Links

| Link | Purpose |
|------|---------|
| [Quickstart](./quickstart.md) | Get started in 5 minutes |
| [Architecture](./architecture.md) | Understand system design |
| [Schemas](./schemas/) | View all JSON schemas |
| [Examples](./examples/) | Reference implementations |
| [Governance](./governance.md) | Compliance framework |
| [Roadmap](../ROADMAP.md) | What's planned |
| [Contributing](../CONTRIBUTING.md) | How to contribute |

---

**Questions?** Check the [FAQ](./faq.md) or open an [issue](../issues).
