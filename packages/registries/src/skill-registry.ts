import type { SkillDefinition } from "../../core/src";

export interface SkillRegistry {
  getSkill(id: string): Promise<SkillDefinition | undefined>;
  listSkills(): Promise<SkillDefinition[]>;
  registerSkill(skill: SkillDefinition): Promise<void>;
}

// TODO: Add schema validation and versioning support.
