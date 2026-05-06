export interface TraceEvent {
  traceId: string;
  spanId: string;
  eventType: string;
  timestamp: string;
  attributes: Record<string, unknown>;
}

// TODO: Align trace events with audit and evaluation models.
