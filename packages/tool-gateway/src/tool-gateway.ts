import type { ToolDefinition } from "../../core/src";
import type { PolicyEngine } from "../../policy-engine/src/policy-engine";
import type { PolicyDefinition } from "../../core/src";
import type { TraceEvent } from "../../observability/src/trace-model";
import type { ToolRegistry } from "../../registries/src/tool-registry";

export interface ToolCallRequest {
  tool: Pick<ToolDefinition, "id">;
  input: Record<string, unknown>;
  traceId: string;
  /** Agent making the call — used for policy evaluation. */
  agentId?: string;
}

export interface ToolCallResult {
  toolId: string;
  output: Record<string, unknown>;
  completedAt: string;
}

export interface ToolGateway {
  callTool(request: ToolCallRequest): Promise<ToolCallResult>;
}

/** Adapter interface — implemented by mock, REST, and MCP adapters. */
export interface ToolAdapter {
  call(
    toolId: string,
    input: Record<string, unknown>,
    baseUrl?: string,
  ): Promise<Record<string, unknown>>;
}

export interface ToolGatewayOptions {
  toolRegistry: ToolRegistry;
  adapters: Record<string, ToolAdapter>; // keyed by adapterType: "mock" | "rest" | "mcp"
  policyEngine?: PolicyEngine;
  policy?: PolicyDefinition;
  emitTrace?: (event: TraceEvent) => void;
}

/**
 * Registry-backed ToolGateway.
 *
 * For every tool call:
 * 1. Resolves tool record from ToolRegistry (must be active)
 * 2. Evaluates policy if a PolicyEngine is configured
 * 3. Routes to the correct adapter (mock | rest | mcp)
 * 4. Emits trace events around the call
 */
export class RegistryToolGateway implements ToolGateway {
  constructor(private readonly opts: ToolGatewayOptions) {}

  async callTool(request: ToolCallRequest): Promise<ToolCallResult> {
    const { toolRegistry, adapters, policyEngine, policy, emitTrace = () => {} } = this.opts;
    const traceId = request.traceId;
    const toolId = request.tool.id;

    // 1. Resolve tool
    const record = await toolRegistry.get(toolId);
    if (!record) {
      throw new Error(`Tool not found in registry: ${toolId}`);
    }
    if (record.lifecycle.state !== "active") {
      throw new Error(
        `Tool "${toolId}" is not active (state: ${record.lifecycle.state})`,
      );
    }

    emitTrace({
      traceId,
      spanId: `span-gateway-${toolId}-${Date.now()}`,
      eventType: "tool_gateway.call_started",
      timestamp: new Date().toISOString(),
      attributes: { toolId, adapterType: record.adapterType, agentId: request.agentId },
    });

    // 2. Policy check
    if (policyEngine && policy) {
      const decision = await policyEngine.evaluate(policy, {
        agentId: request.agentId ?? "unknown",
        toolId,
        context: request.input,
      });

      emitTrace({
        traceId,
        spanId: `span-policy-${toolId}-${Date.now()}`,
        eventType: "tool_gateway.policy_checked",
        timestamp: new Date().toISOString(),
        attributes: { toolId, outcome: decision.outcome, reason: decision.reason },
      });

      if (decision.outcome === "deny") {
        throw new Error(`Tool call denied by policy: ${decision.reason}`);
      }
      if (decision.outcome === "require_approval" || decision.outcome === "require_consent") {
        throw new Error(
          `Tool call requires approval before execution: ${decision.reason}`,
        );
      }
    }

    // 3. Route to adapter
    const adapter = adapters[record.adapterType];
    if (!adapter) {
      throw new Error(`No adapter registered for type: ${record.adapterType}`);
    }

    const startedAt = Date.now();
    let output: Record<string, unknown>;

    try {
      output = await adapter.call(toolId, request.input, record.baseUrl);
    } catch (err) {
      emitTrace({
        traceId,
        spanId: `span-gateway-err-${toolId}-${Date.now()}`,
        eventType: "tool_gateway.call_failed",
        timestamp: new Date().toISOString(),
        attributes: {
          toolId,
          error: err instanceof Error ? err.message : String(err),
          durationMs: Date.now() - startedAt,
        },
      });
      throw err;
    }

    const completedAt = new Date().toISOString();

    emitTrace({
      traceId,
      spanId: `span-gateway-done-${toolId}-${Date.now()}`,
      eventType: "tool_gateway.call_completed",
      timestamp: completedAt,
      attributes: { toolId, durationMs: Date.now() - startedAt },
    });

    return { toolId, output, completedAt };
  }
}
