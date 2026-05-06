import type { ToolDefinition } from "../../core/src";

export interface ToolRegistry {
  getTool(id: string): Promise<ToolDefinition | undefined>;
  listTools(): Promise<ToolDefinition[]>;
  registerTool(tool: ToolDefinition): Promise<void>;
}

// TODO: Add adapter capability checks before registration.
