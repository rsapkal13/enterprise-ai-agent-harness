/**
 * Enterprise AI Harness — Demo Runtime
 *
 * Bootstraps a fully wired runtime from all harness packages:
 *   - Registries (Agent, Skill, Tool) with lifecycle management
 *   - Tool Gateway backed by the ToolRegistry
 *   - WorkflowRunner with PolicyEngine and Observability
 *
 * This is the composition root for all demo journeys.
 */

import { InMemoryAgentRegistry } from "../../../packages/registries/src/agent-registry";
import { InMemorySkillRegistry } from "../../../packages/registries/src/skill-registry";
import { InMemoryToolRegistry } from "../../../packages/registries/src/tool-registry";
import { RegistryToolGateway } from "../../../packages/tool-gateway/src/tool-gateway";
import { MockToolAdapter } from "../../../packages/tool-gateway/src/adapters/mock-adapter";
import { WorkflowRunner } from "../../../packages/workflow-engine/src/workflow-engine";
import type { TraceEvent } from "../../../packages/observability/src/trace-model";
import type { MockToolHandler } from "../../../packages/tool-gateway/src/adapters/mock-adapter";
import type { PolicyEngine } from "../../../packages/policy-engine/src/policy-engine";
import type { PolicyDefinition } from "../../../packages/core/src";

export interface RuntimeOptions {
  policyEngine: PolicyEngine;
  defaultPolicy: PolicyDefinition;
  /** Tool handlers to register in the mock adapter. */
  mockToolHandlers: Record<string, MockToolHandler>;
  /** Tool IDs to register and activate. */
  toolIds: string[];
  /** Agent definition. */
  agent: { id: string; name: string };
  /** Skill IDs the agent is permitted to use. */
  agentSkillIds: string[];
  emitTrace?: (event: TraceEvent) => void;
}

export interface HarnessRuntime {
  workflowRunner: WorkflowRunner;
  agentRegistry: InMemoryAgentRegistry;
  skillRegistry: InMemorySkillRegistry;
  toolRegistry: InMemoryToolRegistry;
  toolGateway: RegistryToolGateway;
  defaultPolicy: PolicyDefinition;
}

/**
 * Bootstraps and returns a fully initialised harness runtime.
 * All registries are populated and objects activated before return.
 */
export async function createRuntime(opts: RuntimeOptions): Promise<HarnessRuntime> {
  const agentRegistry = new InMemoryAgentRegistry();
  const skillRegistry = new InMemorySkillRegistry();
  const toolRegistry = new InMemoryToolRegistry();
  const mockAdapter = new MockToolAdapter();

  // Register mock handlers
  for (const [toolId, handler] of Object.entries(opts.mockToolHandlers)) {
    mockAdapter.register(toolId, handler);
  }

  // Register and activate tools
  for (const toolId of opts.toolIds) {
    await toolRegistry.register({ id: toolId } as never, "mock");
    await toolRegistry.activate(toolId, "system-bootstrap");
  }

  // Register and activate agent
  await agentRegistry.register(
    { id: opts.agent.id, name: opts.agent.name } as never,
    opts.agentSkillIds,
    ["api", "ivr", "web"],
  );
  await agentRegistry.activate(opts.agent.id, "system-bootstrap");

  const toolGateway = new RegistryToolGateway({
    toolRegistry,
    adapters: { mock: mockAdapter },
    policyEngine: opts.policyEngine,
    policy: opts.defaultPolicy,
    emitTrace: opts.emitTrace,
  });

  const workflowRunner = new WorkflowRunner({
    policyEngine: opts.policyEngine,
    toolGateway,
    emitTrace: opts.emitTrace,
  });

  return {
    workflowRunner,
    agentRegistry,
    skillRegistry,
    toolRegistry,
    toolGateway,
    defaultPolicy: opts.defaultPolicy,
  };
}
