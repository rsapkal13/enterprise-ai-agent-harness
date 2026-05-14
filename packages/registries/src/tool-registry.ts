import type { ToolDefinition } from "../../core/src";
import {
  type LifecycleMetadata,
  type LifecycleState,
  initialLifecycle,
  transitionLifecycle,
} from "./lifecycle";

export interface ToolRecord {
  tool: ToolDefinition;
  /** Adapter type determines routing in the ToolGateway. */
  adapterType: "mock" | "rest" | "mcp";
  /** For REST adapters — the base URL of the target system. */
  baseUrl?: string;
  lifecycle: LifecycleMetadata;
}

export interface ToolRegistry {
  register(tool: ToolDefinition, adapterType: ToolRecord["adapterType"], baseUrl?: string): Promise<ToolRecord>;
  activate(id: string, approvedBy: string): Promise<ToolRecord>;
  deprecate(id: string, reason: string): Promise<ToolRecord>;
  retire(id: string, reason: string): Promise<ToolRecord>;
  get(id: string): Promise<ToolRecord | undefined>;
  /** Returns only active tools by default. Pass state to filter differently. */
  list(state?: LifecycleState): Promise<ToolRecord[]>;
}

export class InMemoryToolRegistry implements ToolRegistry {
  private readonly store = new Map<string, ToolRecord>();

  async register(
    tool: ToolDefinition,
    adapterType: ToolRecord["adapterType"],
    baseUrl?: string,
  ): Promise<ToolRecord> {
    if (this.store.has(tool.id)) {
      throw new Error(`Tool already registered: ${tool.id}`);
    }
    const record: ToolRecord = {
      tool,
      adapterType,
      baseUrl,
      lifecycle: initialLifecycle(),
    };
    this.store.set(tool.id, record);
    return { ...record };
  }

  async activate(id: string, approvedBy: string): Promise<ToolRecord> {
    return this.transition(id, "active", { approvedBy });
  }

  async deprecate(id: string, reason: string): Promise<ToolRecord> {
    return this.transition(id, "deprecated", { reason });
  }

  async retire(id: string, reason: string): Promise<ToolRecord> {
    return this.transition(id, "retired", { reason });
  }

  async get(id: string): Promise<ToolRecord | undefined> {
    const record = this.store.get(id);
    return record ? { ...record } : undefined;
  }

  async list(state: LifecycleState = "active"): Promise<ToolRecord[]> {
    return [...this.store.values()]
      .filter((r) => r.lifecycle.state === state)
      .map((r) => ({ ...r }));
  }

  private async transition(
    id: string,
    to: LifecycleState,
    opts?: { approvedBy?: string; reason?: string },
  ): Promise<ToolRecord> {
    const record = this.store.get(id);
    if (!record) throw new Error(`Tool not found: ${id}`);
    record.lifecycle = transitionLifecycle(record.lifecycle, to, opts);
    this.store.set(id, record);
    return { ...record };
  }
}
