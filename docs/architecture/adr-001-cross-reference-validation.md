# ADR-001: Cross-Reference Validation as a Dedicated Static-Analysis Pass

**Status:** Accepted
**Date:** 2026-05-10
**Deciders:** Ravi Sapkal (Transformation Lead / repo owner), AI Architecture review

---

## Context

The Enterprise AI Agent Harness specification describes a connected object graph: agents
reference skills and tools; skills bind to policies, workflows, and context scopes; tools
point to systems and IO schemas; workflows orchestrate tools, policies, and UI manifests;
evaluations target any of the above.

All relationships are expressed as plain string IDs inside YAML manifests. JSON Schema
validation (`validate:examples`) confirms that manifests are well-formed, but it cannot
check whether a referenced ID actually exists in the repository — a broken reference such
as `workflow_ref: customer.change_plan.workflow` would pass schema validation even if
the workflow file were deleted or renamed.

Before tagging `v0.1.0-alpha`, the team identified issue #40: the validation pipeline had
no pass that detected broken cross-object references. A developer could rename a tool ID,
forget to update the referencing skill manifest, and the error would not surface until the
spec was loaded into a runtime.

---

## Decision

Introduce a dedicated **cross-reference validation pass** implemented as
`scripts/validate-references.js` and exposed via the `validate:references` npm script. The
pass is appended to the `validate` chain so that `npm run validate` now runs:

```
validate:schemas → validate:examples → validate:references
```

### What the validator checks

The validator builds an in-memory registry for each object type within each example
directory (agents, skills, tools, policies, workflows, systems, context-scopes,
audit-events, evaluations, ui-manifests) and then walks every manifest to assert that
each reference field resolves to a known ID in the appropriate registry.

Edges validated:

| Source object | Reference field(s) | Target registry |
|---|---|---|
| Agent | `approved_skills` | skills |
| Agent | `approved_tools` | tools |
| Agent | `context_scopes` | context-scopes |
| Agent | `evaluation_pack_ref`, `evaluation_refs` | evaluations |
| Agent | `audit_refs` | audit-events |
| Skill | `approved_agents` | agents |
| Skill | `required_context` | context-scopes |
| Skill | `tool_bindings` | tools |
| Skill | `policies` | policies |
| Skill | `workflow_ref` | workflows |
| Skill | `evaluation_refs`, `audit_refs` | evaluations / audit-events |
| Tool | `target_system` | systems |
| Tool | `policy_refs`, `evaluation_refs` | policies / evaluations |
| Tool | `input_schema`, `output_schema` | filesystem paths |
| Workflow step | `tool_ref`, `policy_ref`, `skill_ref` | tools / policies / skills |
| Workflow step | `ui_manifest_ref`, `context_scope_ref` | ui-manifests / context-scopes |
| Workflow | `evaluation_refs`, `audit_refs` | evaluations / audit-events |
| Policy scope | `agents`, `skills`, `tools`, `workflows`, `systems`, `context_scopes` | respective registries |
| Context-scope | `allowed_agents`, `allowed_skills`, `source_systems` | agents / skills / systems |
| UI manifest | `journey_ref`, `policy_refs`, `audit_refs`, `evaluation_refs` | workflows / policies / audit-events / evaluations |
| Evaluation | `target_refs` | any object registry |
| Audit event | `agent_id`, `skill_id`, `policy_id`, `tool_id`, etc. | respective registries |

---

## Options Considered

### Option A: Integrate into `validate-examples.js` (status quo before this ADR)

Cross-reference logic already existed inside `validate-examples.js` as the private
`validateTelcoReferences` function. Keeping it there would avoid a new script.

| Dimension | Assessment |
|---|---|
| Complexity | Low — no new files |
| Separation of concerns | Poor — schema validation and graph validation mixed in one script |
| Discoverability | Low — the cross-reference layer is invisible from `package.json` |
| Extensibility | Low — hard to run or test the graph check independently |
| CI granularity | Low — one step covers all failure modes |

**Pros:** One fewer file.
**Cons:** Mixed responsibility; can't run graph checks without triggering schema validation
too; harder to cite in issue comments and contributor docs.

### Option B: Dedicated `validate-references.js` script (chosen) ✅

Extract the cross-reference logic into its own script, wire it as a separate npm script,
and append it to the `validate` chain.

| Dimension | Assessment |
|---|---|
| Complexity | Low — ~150 LOC, same dependencies as existing scripts |
| Separation of concerns | Good — three distinct passes, each with a clear purpose |
| Discoverability | High — visible as `validate:references` in `package.json` |
| Extensibility | High — new example sets are validated automatically via directory scan |
| CI granularity | Medium — one extra step in CI, errors surface with a clear label |

**Pros:** Cleaner architecture; pass is independently runnable (`npm run validate:references`);
failure messages are scoped to graph errors only; the design generalises to additional
example sets without code changes.
**Cons:** One more file to maintain; slight duplication of the YAML-loading boilerplate.

### Option C: Runtime-level validation only

Defer cross-reference checking to the local runtime (planned for v0.2). Specs would only
be graph-checked when loaded into the in-memory runtime.

| Dimension | Assessment |
|---|---|
| Complexity | Zero now, high later |
| Developer feedback loop | Poor — errors surface only at runtime execution time |
| v0.1 suitability | Poor — the runtime does not exist yet |

**Pros:** No maintenance burden at spec time.
**Cons:** Broken references would be committed and pushed without any signal. Violates
the principle that the v0.1 milestone is *specification-readiness*, not runtime readiness.

---

## Trade-off Analysis

Options A and B share the same correctness guarantees. The key difference is architectural
clarity. Option A is expedient but obscures the existence of the graph-validation pass from
both contributors and CI dashboards. Option B treats cross-reference validation as a
first-class concern — consistent with the control-plane philosophy of the harness, where
explicit governance surfaces matter as much as runtime behaviour.

Option C is incompatible with the v0.1 milestone goal.

---

## Consequences

**What becomes easier:**
- Contributors can run `npm run validate:references` in isolation during development.
- CI failure messages distinguish "schema error" from "broken object reference".
- Adding a new example set (e.g. banking, insurance) is automatically covered without
  touching any validation code.
- The validator serves as a living specification of the object graph's edges — reviewers
  can read the check file to understand what relationships the harness enforces.

**What becomes harder:**
- A new reference field added to any schema must also be added to `validate-references.js`.
  (This is intentional — the graph edges are explicit, not auto-derived from schemas.)

**What we will revisit:**
- When the local runtime (v0.2) is introduced, the runtime loader should reuse the same
  graph-traversal logic rather than reinventing it. Consider extracting the registry-
  building functions into a shared `lib/registry.js` module at that point.
- When the registry grows beyond a single working example per domain, evaluate whether
  cross-example references (e.g. a shared policy used by two skills from different
  examples) need to be supported.

---

## Action Items

1. [x] Implement `scripts/validate-references.js`
2. [x] Add `validate:references` to `package.json` scripts
3. [x] Append `validate:references` to the `validate` chain
4. [ ] Close GitHub issue #40 with reference to this ADR
5. [ ] Confirm CI passes after removing the stale `.claude/` worktree (prerequisite: fix from CI investigation)
6. [ ] At v0.2 runtime design, revisit extraction of registry logic into `lib/registry.js`
