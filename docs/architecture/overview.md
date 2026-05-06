# Architecture Overview

The harness separates AI intent from business execution.

An agent selects or is assigned a skill. The skill declares the business capability, risk level, allowed tools, expected policies, workflow requirements, and evaluation signals. Policies decide whether the action can proceed. Tools perform bounded interactions with registered systems. Workflows coordinate stateful journeys. Audit and observability records capture decisions, actions, outcomes, and evidence.

## Layers

- Experience layer: channels, UI manifests, user journeys
- Agent layer: agent identity, allowed skills, conversational runtime
- Governance layer: policy decisions, risk classification, human approval
- Execution layer: tools, workflows, context access, system adapters
- Evidence layer: audit events, traces, decisions, outcomes, evaluations
