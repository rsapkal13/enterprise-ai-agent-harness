# Module Architecture Diagrams

Text-based diagrams showing the structural relationships between Enterprise AI Agent Harness modules.
All diagrams are vendor-neutral. No private architecture details are included.

---

## 1. Full Module Map

```text
┌──────────────────────────────────────────────────────────────────────┐
│                        Channel Layer                                  │
│          Web · Mobile · Contact Centre · Chat · Internal Tools        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│                         AI Runtime Layer                              │
│              Agents · Assistants · Planners · Orchestrators           │
└─────┬──────────────┬────────────────────┬─────────────────────┬──────┘
      │              │                    │                     │
      ▼              ▼                    ▼                     ▼
┌──────────┐  ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐
│  Agent   │  │   Skill     │  │  Policy Engine   │  │   Context    │
│ Registry │  │  Registry   │  │                  │  │    Layer     │
└──────────┘  └──────┬──────┘  └────────┬─────────┘  └──────┬───────┘
                     │                  │                    │
                     ▼                  │                    │
              ┌─────────────┐           │                    │
              │    Tool     │◄──────────┘                    │
              │   Gateway   │                                 │
              └──────┬──────┘                                 │
                     │                                        │
                     ▼                                        │
              ┌─────────────┐                                 │
              │  Workflow   │                                 │
              │   Engine   │◄────────────────────────────────┘
              └──────┬──────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Enterprise Systems Layer                         │
│         CRM · Billing · Identity · Order · Data · Knowledge           │
└──────────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Evidence and Observability Layer                   │
│         Audit Events · Traces · Evaluation Results · Signals          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Control Plane vs Runtime Enforcement

The harness has two planes:

```text
┌─────────────────────────────────────────────────────────┐
│                    CONTROL PLANE                         │
│                                                          │
│  Agent Registry     Skill Registry    Tool Registry      │
│  Policy Registry    Workflow Registry System Registry    │
│  Context Scope Reg  UI Manifest Reg   Evaluation Defs    │
│                                                          │
│  → Operators author, approve, and retire objects here    │
│  → No live traffic passes through this plane             │
└──────────────────────────┬──────────────────────────────┘
                           │  registry reads at startup / refresh
┌──────────────────────────▼──────────────────────────────┐
│                  RUNTIME ENFORCEMENT                      │
│                                                          │
│  Policy Engine     Tool Gateway     Workflow Engine      │
│  Context Layer     Audit Writer     Trace Collector      │
│                                                          │
│  → Every agent request flows through this plane          │
│  → Decisions are governed, logged, and traceable         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Request Execution Flow

How a single agent request travels through the harness:

```text
Agent
  │
  │  1. Invoke skill by id
  ▼
Skill Registry
  │  2. Resolve skill definition (tools, policies, context scopes)
  ▼
Policy Engine
  │  3. Evaluate pre-skill policies
  │     - allow → continue
  │     - deny → reject with evidence
  │     - require_consent → pause, collect consent, re-evaluate
  │     - require_approval → escalate to human reviewer
  ▼
Context Layer
  │  4. Resolve requested context scopes (filtered by classification)
  ▼
Workflow Engine
  │  5. Begin workflow execution
  │
  ├──► Tool Gateway
  │      │  6a. Validate input schema
  │      │  6b. Evaluate tool-level policies
  │      │  6c. Call target system adapter
  │      │  6d. Validate output schema
  │      │  6e. Write tool-call audit event
  │      └──► System (CRM / Billing / Order / ...)
  │
  ├──► Policy Engine (per workflow step)
  │      │  7. Evaluate step-level policy gates
  │      └──► Audit Event (policy decision + evidence)
  │
  ├──► UI Manifest (approval steps)
  │      │  8. Surface confirmation screen to human
  │      └──► Record approval decision in audit log
  │
  └──► Completion
         │  9. Write journey-complete audit event
         └──► Trigger evaluation checks
```

---

## 4. Registry Object Relationships

How registry objects reference each other:

```text
Agent ──────────────► Skill
                       │
               ┌───────┼────────────┐
               │       │            │
               ▼       ▼            ▼
             Tool    Policy    Context Scope
               │
               ▼
            System

Skill ──────────────► Workflow
                         │
               ┌─────────┼──────────┐
               │         │          │
               ▼         ▼          ▼
             Tool      Policy   UI Manifest

Audit Event ─────────► Agent, Skill, Tool, Policy, Workflow (by id)
Evaluation  ─────────► Agent, Skill, Tool, Workflow, Policy (by targetId)
```

---

## 5. Evidence Layer

How evidence accumulates during a journey:

```text
Journey execution
  │
  ├── Skill invocation        → audit event: skill_invocation_started
  ├── Policy decision         → audit event: policy_decision (+ evidence payload)
  ├── Context access          → audit event: context_scope_resolved
  ├── Tool call               → audit event: tool_call_completed (+ input/output hash)
  ├── Human approval          → audit event: approval_recorded (+ approver + reason)
  ├── Journey completion      → audit event: journey_completed
  │
  └── All events share trace_id ──► Trace (correlated view of the journey)
                                        │
                                        └──► Evaluation (outcome measurement)
```
