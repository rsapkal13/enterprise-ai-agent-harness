import type { ToolDefinition } from "../../core/src";

export interface ToolCallRequest {
  tool: ToolDefinition;
  input: Record<string, unknown>;
  traceId: string;
}

export interface ToolCallResult {
  toolId: string;
  output: Record<string, unknown>;
  completedAt: string;
}

export interface ToolGateway {
  callTool(request: ToolCallRequest): Promise<ToolCallResult>;
}

// TODO: Enforce policy decisions and audit logging around tool calls.
