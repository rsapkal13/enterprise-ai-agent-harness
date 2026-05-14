/**
 * in-memory-registry.ts
 *
 * Generic in-memory registry and concrete implementations for every
 * manifest object type in the Enterprise AI Agent Harness.
 *
 * Usage:
 *   const manifests = await loadExampleManifests(exampleDir);
 *   const registries = buildRegistries(manifests);
 *   const agent = await registries.agents.getAgent("customer-service-agent");
 *
 * Part of: v0.2 local runtime — Issue #55
 */

import type {
  AgentDefinition,
  AuditEvent,
  ContextScopeDefinition,
  EvaluationDefinition,
  ExampleManifests,
  PolicyDefinition,
  SkillDefinition,
  SystemDefinition,
  ToolDefinition,
  WorkflowDefinition,
} from "../../core/src/index.js";

import type { AgentRegistry } from "./agent-registry.js";
import type { SkillRegistry } from "./skill-registry.js";
import type { ToolRegistry } from "./tool-registry.js";

// ── Generic base ──────────────────────────────────────────────────────────────

/**
 * Simple in-memory store keyed by object ID.
 * All registry interface methods are synchronous under the hood but return
 * Promises to match the async interface contract.
 */
class InMemoryStore<T extends { id: string }> {
  protected readonly store = new Map<string, T>();

  async get(id: string): Promise<T | undefined> {
    return this.store.get(id);
  }

  async list(): Promise<T[]> {
    return Array.from(this.store.values());
  }

  async register(item: T): Promise<void> {
    this.store.set(item.id, item);
  }

  /** Bulk-load from an array — used by buildRegistries. */
  load(items: T[]): void {
    for (const item of items) {
      this.store.set(item.id, item);
    }
  }

  get size(): number {
    return this.store.size;
  }
}

// ── Concrete registry implementations ────────────────────────────────────────

export class InMemoryAgentRegistry
  extends InMemoryStore<AgentDefinition>
  implements AgentRegistry
{
  async getAgent(id: string): Promise<AgentDefinition | undefined> {
    return this.get(id);
  }

  async listAgents(): Promise<AgentDefinition[]> {
    return this.list();
  }

  async registerAgent(agent: AgentDefinition): Promise<void> {
    return this.register(agent);
  }
}

export class InMemorySkillRegistry
  extends InMemoryStore<SkillDefinition>
  implements SkillRegistry
{
  async getSkill(id: string): Promise<SkillDefinition | undefined> {
    return this.get(id);
  }

  async listSkills(): Promise<SkillDefinition[]> {
    return this.list();
  }

  async registerSkill(skill: SkillDefinition): Promise<void> {
    return this.register(skill);
  }
}

export class InMemoryToolRegistry
  extends InMemoryStore<ToolDefinition>
  implements ToolRegistry
{
  async getTool(id: string): Promise<ToolDefinition | undefined> {
    return this.get(id);
  }

  async listTools(): Promise<ToolDefinition[]> {
    return this.list();
  }

  async registerTool(tool: ToolDefinition): Promise<void> {
    return this.register(tool);
  }
}

// Additional registries for types that don't yet have separate interface files.

export class InMemoryPolicyRegistry extends InMemoryStore<PolicyDefinition> {
  async getPolicy(id: string): Promise<PolicyDefinition | undefined> {
    return this.get(id);
  }
  async listPolicies(): Promise<PolicyDefinition[]> {
    return this.list();
  }
}

export class InMemoryWorkflowRegistry extends InMemoryStore<WorkflowDefinition> {
  async getWorkflow(id: string): Promise<WorkflowDefinition | undefined> {
    return this.get(id);
  }
  async listWorkflows(): Promise<WorkflowDefinition[]> {
    return this.list();
  }
}

export class InMemorySystemRegistry extends InMemoryStore<SystemDefinition> {
  async getSystem(id: string): Promise<SystemDefinition | undefined> {
    return this.get(id);
  }
  async listSystems(): Promise<SystemDefinition[]> {
    return this.list();
  }
}

export class InMemoryContextScopeRegistry extends InMemoryStore<ContextScopeDefinition> {
  async getContextScope(id: string): Promise<ContextScopeDefinition | undefined> {
    return this.get(id);
  }
  async listContextScopes(): Promise<ContextScopeDefinition[]> {
    return this.list();
  }
}

export class InMemoryEvaluationRegistry extends InMemoryStore<EvaluationDefinition> {
  async getEvaluation(id: string): Promise<EvaluationDefinition | undefined> {
    return this.get(id);
  }
  async listEvaluations(): Promise<EvaluationDefinition[]> {
    return this.list();
  }
}

// AuditEvent uses event_id as ID in YAML but is mapped to `.id` in TypeScript.
export class InMemoryAuditEventRegistry extends InMemoryStore<AuditEvent> {
  async getAuditEvent(id: string): Promise<AuditEvent | undefined> {
    return this.get(id);
  }
  async listAuditEvents(): Promise<AuditEvent[]> {
    return this.list();
  }
}

// ── Aggregate registry bundle ─────────────────────────────────────────────────

export interface RuntimeRegistries {
  agents: InMemoryAgentRegistry;
  skills: InMemorySkillRegistry;
  tools: InMemoryToolRegistry;
  policies: InMemoryPolicyRegistry;
  workflows: InMemoryWorkflowRegistry;
  systems: InMemorySystemRegistry;
  contextScopes: InMemoryContextScopeRegistry;
  evaluations: InMemoryEvaluationRegistry;
  auditEvents: InMemoryAuditEventRegistry;
}

/**
 * Populate all in-memory registries from a loaded ExampleManifests bundle.
 *
 * @param manifests  Result of `loadExampleManifests(dir)`
 * @returns          Populated `RuntimeRegistries` ready for the workflow engine
 */
export function buildRegistries(manifests: ExampleManifests): RuntimeRegistries {
  const agents      = new InMemoryAgentRegistry();
  const skills      = new InMemorySkillRegistry();
  const tools       = new InMemoryToolRegistry();
  const policies    = new InMemoryPolicyRegistry();
  const workflows   = new InMemoryWorkflowRegistry();
  const systems     = new InMemorySystemRegistry();
  const contextScopes = new InMemoryContextScopeRegistry();
  const evaluations = new InMemoryEvaluationRegistry();
  const auditEvents = new InMemoryAuditEventRegistry();

  agents.load(manifests.agents);
  skills.load(manifests.skills);
  tools.load(manifests.tools);
  policies.load(manifests.policies);
  workflows.load(manifests.workflows);
  systems.load(manifests.systems);
  contextScopes.load(manifests.contextScopes);
  evaluations.load(manifests.evaluations);
  auditEvents.load(manifests.auditEvents);

  return {
    agents, skills, tools, policies, workflows,
    systems, contextScopes, evaluations, auditEvents,
  };
}
