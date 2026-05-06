import type { ContextScopeDefinition } from "../../core/src";

export interface ContextScopeRegistry {
  getContextScope(id: string): Promise<ContextScopeDefinition | undefined>;
  listContextScopes(): Promise<ContextScopeDefinition[]>;
}

// TODO: Add policy-aware context access checks.
