# Design Principles

These principles guide the public specification and future runtime implementation.

## 1. Registry-First

Capabilities should be registered before they are executed.

Agents, skills, policies, tools, workflows, systems, context scopes, UI manifests, and evaluations should have explicit records with ownership, lifecycle state, and review status. Registry records make AI capabilities discoverable, governable, and auditable.

## 2. Deny By Default

An agent should not be able to act simply because it can produce a tool call.

Runtime execution should require explicit permission through registered skills, scoped workload identity, policy decisions, approved tools, and workflow boundaries.

## 3. Governance As Runtime Constraints

Approval should create binding constraints, not informal permission.

Policy decisions, identity scopes, context boundaries, workflow checkpoints, evaluation requirements, and audit obligations should be enforceable by runtime components.

## 4. Skills Before Tools

Agents should request business capabilities, not raw system actions.

A skill describes what the agent is allowed to do, why it exists, which policies apply, which tools may be used, which context is required, and how it will be evaluated.

## 5. Evaluation Before Production

AI capabilities should be evaluated before release and continuously after release.

Evaluations should test behaviour across scenarios, tool-use paths, policy boundaries, adversarial inputs, regression cases, and expected business outcomes.

## 6. Trace Everything Structurally

Logs are not enough.

The harness should emit structured traces, audit events, policy decisions, tool call records, workflow states, approvals, outputs, side effects, and evaluation results. Evidence should connect back to registered objects.

## 7. Human Oversight Scales With Risk

Human review should be required where impact demands it.

Low-risk informational capabilities should not carry the same overhead as high-impact transactional capabilities. Approval requirements, evaluation depth, identity controls, and observability should scale with risk tier.

## 8. Vendor-Neutral By Design

The public model should work across model providers, agent frameworks, identity systems, workflow tools, integration platforms, observability stacks, and deployment targets.

Provider-specific adapters can exist later, but the core specification should remain portable.

## 9. Public Spec, Private Implementation Details

The public repository should contain reusable open-source patterns, schemas, examples, docs, backlog, and code.

Organisation-specific strategy, approval thresholds, customer examples, real system names, sensitive architecture notes, credentials, legal interpretations, and operational contacts belong in private tools.

## 10. Incremental Adoption

The specification should be useful before the runtime is complete.

Teams should be able to start with documentation, schemas, and examples; add validation; then adopt registries, policy enforcement, workflows, audit, and evaluation over time.
