import type { ToolAdapter } from "../tool-gateway";

/**
 * Mock adapter — used for local development, demos, and tests.
 *
 * Handlers are registered by toolId at construction time.
 * Unregistered tools throw a descriptive error so the developer knows
 * which handler is missing rather than getting a silent failure.
 */
export type MockToolHandler = (
  input: Record<string, unknown>,
) => Promise<Record<string, unknown>> | Record<string, unknown>;

export class MockToolAdapter implements ToolAdapter {
  private readonly handlers = new Map<string, MockToolHandler>();

  register(toolId: string, handler: MockToolHandler): this {
    this.handlers.set(toolId, handler);
    return this;
  }

  async call(
    toolId: string,
    input: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const handler = this.handlers.get(toolId);
    if (!handler) {
      throw new Error(
        `MockToolAdapter: no handler registered for tool "${toolId}". ` +
          `Register one with adapter.register("${toolId}", handler).`,
      );
    }
    return handler(input);
  }
}

/**
 * @deprecated Legacy function-based mock. Use MockToolAdapter class instead.
 */
export async function callMockTool(): Promise<never> {
  throw new Error("callMockTool is deprecated. Use MockToolAdapter instead.");
}
