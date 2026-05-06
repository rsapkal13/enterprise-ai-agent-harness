import type { AuditEvent } from "../../core/src";

export interface AuditEventWriter {
  write(event: AuditEvent): Promise<void>;
}

export interface AuditEventReader {
  findByTraceId(traceId: string): Promise<AuditEvent[]>;
}

// TODO: Add append-only storage, retention, and export contracts.
