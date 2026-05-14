import type { ToolAdapter } from "../tool-gateway";

/**
 * MCP adapter stub — v0.2 placeholder.
 * Full MCP protocol implementation is v0.3 work once tool capability contracts settle.
 */
export class McpToolAdapter implements ToolAdapter {
  async call(toolId: string): Promise<Record<string, unknown>> {
    throw new Error(
      `MCP adapter not yet implemented. Tool "${toolId}" cannot be called via MCP in v0.2.`,
    );
  }
}

/** @deprecated Use McpToolAdapter class instead. */
export async function callMcpTool(): Promise<never> {
  throw new Error("MCP tool adapter is not implemented yet.");
}
