import type { AgentDefinition } from "../../core/src";
import {
  type LifecycleMetadata,
  type LifecycleState,
  initialLifecycle,
  transitionLifecycle,
} from "./lifecycle";

export interface AgentRecord {
  agent: AgentDefinition;
  /** Skill IDs this agent is permitted to invoke. */
  allowedSkillIds: string[];
  /** Channel identifiers this agent is permitted to operate on (e.g. "web", "ivr", "api"). */
  allowedChannels: string[];
  lifecycle: LifecycleMetadata;
}

export interface AgentRegistry {
  register(agent: AgentDefinition, allowedSkillIds?: string[], allowedChannels?: string[]): Promise<AgentRecord>;
  activate(id: string, approvedBy: string): Promise<AgentRecord>;
  deprecate(id: string, reason: string): Promise<AgentRecord>;
  retire(id: string, reason: string): Promise<AgentRecord>;
  get(id: string): Promise<AgentRecord | undefined>;
  list(state?: LifecycleState): Promise<AgentRecord[]>;
  /** Validates that the agent is allowed to invoke the given skill. */
  canUseSkill(agentId: string, skillId: string): Promise<boolean>;
}

export class InMemoryAgentRegistry implements AgentRegistry {
  private readonly store = new Map<string, AgentRecord>();

  async register(
    agent: AgentDefinition,
    allowedSkillIds: string[] = [],
    allowedChannels: string[] = ["api"],
  ): Promise<AgentRecord> {
    if (this.store.has(agent.id)) {
      throw new Error(`Agent already registered: ${agent.id}`);
    }
    const record: AgentRecord = {
      agent,
      allowedSkillIds,
      allowedChannels,
      lifecycle: initialLifecycle(),
    };
    this.store.set(agent.id, record);
    return { ...record };
  }

  async activate(id: string, approvedBy: string): Promise<AgentRecord> {
    return this.transition(id, "active", { approvedBy });
  }

  async deprecate(id: string, reason: string): Promise<AgentRecord> {
    return this.transition(id, "deprecated", { reason });
  }

  async retire(id: string, reason: string): Promise<AgentRecord> {
    return this.transition(id, "retired", { reason });
  }

  async get(id: string): Promise<AgentRecord | undefined> {
    const record = this.store.get(id);
    return record ? { ...record } : undefined;
  }

  async list(state: LifecycleState = "active"): Promise<AgentRecord[]> {
    return [...this.store.values()]
      .filter((r) => r.lifecycle.state === state)
      .map((r) => ({ ...r }));
  }

  async canUseSkill(agentId: string, skillId: string): Promise<boolean> {
    const record = this.store.get(agentId);
    if (!record || record.lifecycle.state !== "active") return false;
    return record.allowedSkillIds.includes(skillId);
  }

  private async transition(
    id: string,
    to: LifecycleState,
    opts?: { approvedBy?: string; reason?: string },
  ): Promise<AgentRecord> {
    const record = this.store.get(id);
    if (!record) throw new Error(`Agent not found: ${id}`);
    record.lifecycle = transitionLifecycle(record.lifecycle, to, opts);
    this.store.set(id, record);
    return { ...record };
  }
}
