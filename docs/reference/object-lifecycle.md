# Object Lifecycle

Registry objects should move through explicit lifecycle states.

Suggested states:

- draft: proposed and not yet approved for use
- active: approved for use
- deprecated: still available but should not be used for new journeys
- retired: unavailable for new execution

The lifecycle model applies to agents, skills, tools, policies, workflows, systems, context scopes, UI manifests, and evaluation definitions.
