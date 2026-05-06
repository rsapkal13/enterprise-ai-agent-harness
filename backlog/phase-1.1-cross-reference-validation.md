# Phase 1.1: Cross-Reference Validation

Goal: validate that specification examples form a coherent object graph before building runtime behavior.

## Scope

- Check YAML and JSON parse validity
- Verify that agent `allowedSkills` point to existing skills
- Verify that skills reference existing policies, tools, context scopes, workflows, and evaluations
- Verify that tools reference existing systems and IO schemas
- Verify that workflows reference existing tools, policies, UI manifests, and evaluations
- Verify that audit events reference known example objects where possible

## Exit Criteria

- The telco example can be checked without installing heavy dependencies
- Validation failures produce clear file and identifier messages
- The checker remains a development aid, not a runtime engine
