import type { AgentDefinition } from "../../core/src";

export interface AgentRegistry {
  getAgent(id: string): Promise<AgentDefinition | undefined>;
  listAgents(): Promise<AgentDefinition[]>;
  registerAgent(agent: AgentDefinition): Promise<void>;
}

// TODO: Add allowed-skill validation against the Skill Registry.
