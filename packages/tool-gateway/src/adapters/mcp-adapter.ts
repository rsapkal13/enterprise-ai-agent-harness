import type { ToolCallRequest, ToolCallResult } from "../tool-gateway";

export async function callMcpTool(
  _request: ToolCallRequest,
): Promise<ToolCallResult> {
  // TODO: Implement MCP adapter after tool capability contracts settle.
  throw new Error("MCP tool adapter is not implemented yet.");
}
