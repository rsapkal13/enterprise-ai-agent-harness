/**
 * in-memory-registry.js
 *
 * In-memory registry implementations for the Enterprise AI Agent Harness
 * local runtime. Provides concrete stores for all manifest object types.
 *
 * Part of: v0.2 local runtime — Issue #55
 */

// ── Generic base ──────────────────────────────────────────────────────────────

class InMemoryStore {
  constructor() {
    this._store = new Map();
  }

  async get(id) { return this._store.get(id); }
  async list()  { return Array.from(this._store.values()); }
  async register(item) { this._store.set(item.id, item); }

  /** Bulk-load from an array. */
  load(items) {
    for (const item of items) this._store.set(item.id, item);
  }

  get size() { return this._store.size; }
}

// ── Concrete registries ───────────────────────────────────────────────────────

export class InMemoryAgentRegistry extends InMemoryStore {
  async getAgent(id)             { return this.get(id); }
  async listAgents()             { return this.list(); }
  async registerAgent(agent)     { return this.register(agent); }
}

export class InMemorySkillRegistry extends InMemoryStore {
  async getSkill(id)             { return this.get(id); }
  async listSkills()             { return this.list(); }
  async registerSkill(skill)     { return this.register(skill); }
}

export class InMemoryToolRegistry extends InMemoryStore {
  async getTool(id)              { return this.get(id); }
  async listTools()              { return this.list(); }
  async registerTool(tool)       { return this.register(tool); }
}

export class InMemoryPolicyRegistry extends InMemoryStore {
  async getPolicy(id)            { return this.get(id); }
  async listPolicies()           { return this.list(); }
}

export class InMemoryWorkflowRegistry extends InMemoryStore {
  async getWorkflow(id)          { return this.get(id); }
  async listWorkflows()          { return this.list(); }
}

export class InMemorySystemRegistry extends InMemoryStore {
  async getSystem(id)            { return this.get(id); }
  async listSystems()            { return this.list(); }
}

export class InMemoryContextScopeRegistry extends InMemoryStore {
  async getContextScope(id)      { return this.get(id); }
  async listContextScopes()      { return this.list(); }
}

export class InMemoryEvaluationRegistry extends InMemoryStore {
  async getEvaluation(id)        { return this.get(id); }
  async listEvaluations()        { return this.list(); }
}

export class InMemoryAuditEventRegistry extends InMemoryStore {
  async getAuditEvent(id)        { return this.get(id); }
  async listAuditEvents()        { return this.list(); }
}

// ── Aggregate factory ─────────────────────────────────────────────────────────

/**
 * Populate all in-memory registries from a loaded manifests bundle.
 *
 * @param {object} manifests  Result of loadExampleManifests()
 * @returns {object}          Populated registry bundle
 */
export function buildRegistries(manifests) {
  const agents        = new InMemoryAgentRegistry();
  const skills        = new InMemorySkillRegistry();
  const tools         = new InMemoryToolRegistry();
  const policies      = new InMemoryPolicyRegistry();
  const workflows     = new InMemoryWorkflowRegistry();
  const systems       = new InMemorySystemRegistry();
  const contextScopes = new InMemoryContextScopeRegistry();
  const evaluations   = new InMemoryEvaluationRegistry();
  const auditEvents   = new InMemoryAuditEventRegistry();

  agents.load(manifests.agents);
  skills.load(manifests.skills);
  tools.load(manifests.tools);
  policies.load(manifests.policies);
  workflows.load(manifests.workflows);
  systems.load(manifests.systems);
  contextScopes.load(manifests.contextScopes);
  evaluations.load(manifests.evaluations);
  auditEvents.load(manifests.auditEvents);

  return { agents, skills, tools, policies, workflows, systems, contextScopes, evaluations, auditEvents };
}
