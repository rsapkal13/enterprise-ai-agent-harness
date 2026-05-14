# Documentation Website (Placeholder)

Future home for the public documentation website for the Enterprise AI Agent Harness.

## Scope

The website makes the content in `docs/`, `schemas/`, `examples/`, and `backlog/` accessible
to contributors and enterprise teams without requiring them to read raw Markdown from a repository.

The website is documentation-first. It is not a marketing site or a product demo runner.

## Intended Audience

- Enterprise architects and governance teams evaluating the harness model
- Engineers contributing schemas, examples, or package implementations
- Policy and risk teams reading governance documentation
- Open-source contributors looking for first contribution areas

## Content Mapping

The following `docs/` structure maps to the website's top-level navigation:

| Section | Source | Purpose |
|---------|--------|---------|
| Vision | `docs/vision.md` | Why the harness exists |
| Architecture | `docs/architecture/` | System boundaries, module diagrams, design principles |
| Concepts | `docs/concepts/` | Registry, policy, workflow, context, audit, UI, observability, evaluation |
| Governance | `docs/governance/` | Responsible AI, risk, audit, approval, privacy |
| Guides | `docs/guides/` | Authoring workflows for spec objects |
| Reference | `docs/reference/` | Glossary, identifier conventions, cross-reference rules, lifecycle, versioning |
| Schemas | `docs/schemas/` + `schemas/` | Human-readable schema notes linked to JSON Schema source |
| Examples | `examples/` | Fictional enterprise journeys |
| Backlog | `backlog/` | Epics, milestones, phase plans |

## Homepage Direction

The homepage should communicate:

> **One control plane. Two surfaces.**
>
> ```
> Agent -> Skill -> Policy -> Tool -> Workflow -> System -> Audit
> ```
>
> A business control plane for governance teams to register, approve, monitor, and retire AI capabilities.
> An open-source codebase that makes those governance decisions enforceable at runtime.

The homepage should not:
- Claim runtime capabilities that are not yet implemented
- Name specific enterprise customers or organisations
- Reference private internal architecture

## Framework Selection

Do not select a documentation framework until:

1. The `docs/` content structure is stable (target: after v0.1 spec release)
2. The team has agreed on hosting and CI requirements
3. At least one other example journey (`banking-card-dispute` or `insurance-claims`) is populated

Good candidate frameworks for a docs-first site include Docusaurus, MkDocs, and Starlight.
Evaluate based on Markdown compatibility, search, versioning support, and GitHub Pages deployment ease.
No framework should be added to this repository without a separate approved issue.

## Status

Placeholder. Do not add a website framework until the `docs/` content structure is stable.
The `docs/` directory is the canonical source of truth for all content.
