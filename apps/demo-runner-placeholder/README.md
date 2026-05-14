# Demo Runner (v0.2)

A bootable local runtime that wires all harness packages together and executes end-to-end example journeys.

## Runtime Architecture

```
createRuntime()
  ├── InMemoryAgentRegistry   — agent lifecycle management
  ├── InMemorySkillRegistry   — skill lifecycle management
  ├── InMemoryToolRegistry    — tool lifecycle + adapter routing
  ├── MockToolAdapter         — fictional tool handlers (no real systems)
  ├── RegistryToolGateway     — policy-enforced, registry-backed tool calls
  └── WorkflowRunner          — orchestrates journeys with approval gates & compensation
```

## Journeys

### Telco Customer-Care Plan Change

A fictional mobile plan change journey for an AI-assisted care agent.

**Scenario A — Standard upgrade (auto-complete)**
Customer upgrades from 50GB to 100GB. Eligibility passes, AI recommends the plan, proration calculated, provisioned, credit applied, confirmation sent, audit recorded.

**Scenario B — High-value downgrade (approval gate → approved)**
Customer downgrades significantly (>30% MRC drop). Journey parks at `team_lead_approval`. Team lead approves → journey resumes and completes.

```bash
npx tsx apps/demo-runner-placeholder/src/telco-plan-change/run-plan-change.ts
```

## Adding a New Journey

1. Create `src/<journey-name>/` with a workflow definition, tool handlers, and a runner script
2. Register your tools in `createRuntime()` options
3. Run with `npx tsx`

## Related Docs

- System Design: `docs/v02/system-design-workflow-engine.md`
- ADR-001: `docs/v02/adr-001-workflow-execution-model.md`
- Banking Card Dispute example: `examples/banking-card-dispute/`
