# AgentHarness Admin Console

Front-end governance portal application for Enterprise AI Agent Harness.

This first v0.2 slice focuses on the registry surfaces:

- Agent Registry
- Skill Registry
- Tool Registry
- AI Harness certification status
- Risk tier and lifecycle state
- Ownership and policy coverage
- Object relationships
- Search and filtering

The app currently uses fictional local sample data aligned to the telco customer-care journey.
It does not call production systems, perform writes, or require private data.

## Run

From the repository root:

```bash
npm run admin:dev
```

Build:

```bash
npm run admin:build
```

## Scope

This is not the full governance dashboard yet. Next slices should add policy inspection,
approval queue, audit evidence, evaluation coverage, and local runtime connection.
