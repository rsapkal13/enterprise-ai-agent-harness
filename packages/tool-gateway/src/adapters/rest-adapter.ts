import type { ToolCallRequest, ToolCallResult } from "../tool-gateway";

export async function callRestTool(
  _request: ToolCallRequest,
): Promise<ToolCallResult> {
  // TODO: Implement REST adapter after authentication and schema contracts settle.
  throw new Error("REST tool adapter is not implemented yet.");
}
