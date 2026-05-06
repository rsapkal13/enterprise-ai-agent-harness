export interface ContextRequest {
  agentId: string;
  skillId?: string;
  requestedScopes: string[];
  purpose: string;
}

export interface ContextGrant {
  grantedScopes: string[];
  deniedScopes: string[];
  obligations: string[];
}

// TODO: Integrate context grants with policy decisions and audit events.
