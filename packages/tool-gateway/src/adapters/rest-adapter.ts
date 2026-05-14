import type { ToolAdapter } from "../tool-gateway";

/**
 * REST adapter — makes HTTP calls to external systems.
 * v0.2: minimal implementation (POST JSON, Bearer token auth).
 * v0.3+: add OAuth flows, retry, circuit breaker, response schema validation.
 */
export class RestToolAdapter implements ToolAdapter {
  constructor(
    private readonly authToken?: string,
  ) {}

  async call(
    toolId: string,
    input: Record<string, unknown>,
    baseUrl?: string,
  ): Promise<Record<string, unknown>> {
    if (!baseUrl) {
      throw new Error(`RestToolAdapter: no baseUrl configured for tool "${toolId}".`);
    }

    const url = `${baseUrl.replace(/\/$/, "")}/${toolId}`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.authToken) headers["Authorization"] = `Bearer ${this.authToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(
        `REST tool call failed: ${response.status} ${response.statusText} — ${url}`,
      );
    }

    return response.json() as Promise<Record<string, unknown>>;
  }
}

/** @deprecated Use RestToolAdapter class instead. */
export async function callRestTool(): Promise<never> {
  throw new Error("REST tool adapter is not implemented yet.");
}
