import type { SkillDefinition } from "../../core/src";
import {
  type LifecycleMetadata,
  type LifecycleState,
  initialLifecycle,
  transitionLifecycle,
} from "./lifecycle";

export interface SkillRecord {
  skill: SkillDefinition;
  /** Tool IDs this skill is permitted to invoke. */
  allowedToolIds: string[];
  lifecycle: LifecycleMetadata;
}

export interface SkillRegistry {
  register(skill: SkillDefinition, allowedToolIds?: string[]): Promise<SkillRecord>;
  activate(id: string, approvedBy: string): Promise<SkillRecord>;
  deprecate(id: string, reason: string): Promise<SkillRecord> ;
  retire(id: string, reason: string): Promise<SkillRecord>;
  get(id: string): Promise<SkillRecord | undefined>;
  list(state?: LifecycleState): Promise<SkillRecord[]>;
}

export class InMemorySkillRegistry implements SkillRegistry {
  private readonly store = new Map<string, SkillRecord>();

  async register(
    skill: SkillDefinition,
    allowedToolIds: string[] = [],
  ): Promise<SkillRecord> {
    if (this.store.has(skill.id)) {
      throw new Error(`Skill already registered: ${skill.id}`);
    }
    const record: SkillRecord = {
      skill,
      allowedToolIds,
      lifecycle: initialLifecycle(),
    };
    this.store.set(skill.id, record);
    return { ...record };
  }

  async activate(id: string, approvedBy: string): Promise<SkillRecord> {
    return this.transition(id, "active", { approvedBy });
  }

  async deprecate(id: string, reason: string): Promise<SkillRecord> {
    return this.transition(id, "deprecated", { reason });
  }

  async retire(id: string, reason: string): Promise<SkillRecord> {
    return this.transition(id, "retired", { reason });
  }

  async get(id: string): Promise<SkillRecord | undefined> {
    const record = this.store.get(id);
    return record ? { ...record } : undefined;
  }

  async list(state: LifecycleState = "active"): Promise<SkillRecord[]> {
    return [...this.store.values()]
      .filter((r) => r.lifecycle.state === state)
      .map((r) => ({ ...r }));
  }

  private async transition(
    id: string,
    to: LifecycleState,
    opts?: { approvedBy?: string; reason?: string },
  ): Promise<SkillRecord> {
    const record = this.store.get(id);
    if (!record) throw new Error(`Skill not found: ${id}`);
    record.lifecycle = transitionLifecycle(record.lifecycle, to, opts);
    this.store.set(id, record);
    return { ...record };
  }
}
