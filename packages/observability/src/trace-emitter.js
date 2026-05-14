/**
 * trace-emitter.js
 *
 * Structured trace event emitter for the Enterprise AI Agent Harness.
 *
 * Each TraceEmitter is bound to a single traceId (e.g. a workflow run ID).
 * Individual emit() calls each produce a unique spanId.
 *
 * Events written to the optional sink implement the AuditEventWriter interface,
 * so InMemoryAuditSink can serve as a unified trace + audit store in tests and
 * the demo runner.
 *
 * Shape of emitted events
 * ───────────────────────
 *   id          — unique span/event ID (UUID)
 *   traceId     — shared trace correlation ID
 *   spanId      — same as id (one-span-per-event model for simplicity)
 *   eventType   — caller-supplied string (e.g. "workflow.step.started")
 *   timestamp   — UTC ISO string
 *   attributes  — caller-supplied key/value bag
 *
 * Part of: v0.2 local runtime — Issue #61 (Observability/Audit)
 */

import { randomUUID } from "node:crypto";

// ── TraceEmitter ──────────────────────────────────────────────────────────────

export class TraceEmitter {
  #sink;
  #traceId;

  /**
   * @param {object|null} sink    — AuditEventWriter (write(event): Promise<void>)
   *                               Pass null/undefined for a no-op sink (events
   *                               are still returned from emit() but not stored).
   * @param {string} [traceId]   — Correlation ID shared across all emitted spans.
   *                               Defaults to a fresh UUID.
   */
  constructor(sink, traceId) {
    this.#sink = sink ?? null;
    this.#traceId = traceId ?? randomUUID();
  }

  /** The trace correlation ID shared by all events emitted by this instance. */
  get traceId() {
    return this.#traceId;
  }

  /**
   * Emit a structured trace event.
   *
   * @param {string} eventType    — Dot-namespaced event name
   *                               (e.g. "workflow.step.started", "tool.called")
   * @param {object} [attributes] — Arbitrary key/value context
   * @returns {Promise<object>}   — The emitted event object
   */
  async emit(eventType, attributes = {}) {
    const spanId = randomUUID();
    const event = {
      id: spanId,
      traceId: this.#traceId,
      spanId,
      eventType,
      timestamp: new Date().toISOString(),
      attributes: { ...attributes },
    };

    if (this.#sink) {
      await this.#sink.write(event);
    }

    return event;
  }

  /**
   * Create a child emitter that shares this trace's traceId but has its own
   * identity. Useful for sub-operations (e.g. per-step emitters inside a
   * workflow run).
   *
   * @returns {TraceEmitter}
   */
  child() {
    return new TraceEmitter(this.#sink, this.#traceId);
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a new TraceEmitter.
 *
 * @param {object|null} [sink]   — AuditEventWriter; omit for a no-op sink
 * @param {string}      [traceId] — Correlation ID; defaults to a fresh UUID
 * @returns {TraceEmitter}
 */
export function createTraceEmitter(sink, traceId) {
  return new TraceEmitter(sink ?? null, traceId);
}
