import type { ToolCallRequest, ToolCallResult } from "../tool-gateway";

export async function callMockTool(
  request: ToolCallRequest,
): Promise<ToolCallResult> {
  // TODO: Replace with deterministic fixtures for local demo journeys.
  return {
    toolId: request.tool.id,
    output: {},
    completedAt: new Date().toISOString(),
  };
}
