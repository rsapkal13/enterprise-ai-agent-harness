/**
 * in-memory-audit-sink.js
 *
 * Append-only in-memory implementation of AuditEventWriter and AuditEventReader
 * for the Enterprise AI Agent Harness local runtime.
 *
 * Storage model
 * ─────────────
 * Events are stored in insertion order in an internal array. All write
 * operations are append-only — existing events cannot be modified or deleted.
 *
 * Query support
 * ─────────────
 *   findByTraceId(traceId)               — all events with matching traceId
 *   findByActor(actorType?, actorId?)    — filter by actor type and/or id
 *   findByTimeRange(from?, to?)          — filter by ISO timestamp window
 *   findByOutcome(outcome)               — filter by event outcome
 *   listAll()                            — full event log (defensive copy)
 *
 * Part of: v0.2 local runtime — Issue #61 (Observability/Audit)
 */

import { randomUUID } from "node:crypto";

// ── InMemoryAuditSink ─────────────────────────────────────────────────────────

export class InMemoryAuditSink {
  /** @type {Array<object>} Append-only event store */
  #events = [];

  // ── AuditEventWriter ──────────────────────────────────────────────────────

  /**
   * Append an audit event to the store.
   *
   * Any object shape is accepted. If the event does not have an `id` field,
   * one is generated. If it does not have a `timestamp`, the current UTC time
   * is used.
   *
   * @param {object} event
   * @returns {Promise<void>}
   */
  async write(event) {
    const stored = {
      id: event.id ?? randomUUID(),
      timestamp: event.timestamp ?? new Date().toISOString(),
      ...event,
      _writtenAt: new Date().toISOString(),
    };
    Object.freeze(stored); // enforce append-only semantics
    this.#events.push(stored);
  }

  // ── AuditEventReader ──────────────────────────────────────────────────────

  /**
   * Find all events whose `traceId` field matches (supports both top-level
   * `traceId` and nested `attributes.traceId`).
   *
   * @param {string} traceId
   * @returns {Promise<object[]>}
   */
  async findByTraceId(traceId) {
    return this.#events.filter(
      (e) => e.traceId === traceId || e.attributes?.traceId === traceId,
    );
  }

  /**
   * Find events by actor type and/or actor id.
   * Either parameter may be undefined to match any value.
   *
   * @param {string|undefined} actorType
   * @param {string|undefined} actorId
   * @returns {Promise<object[]>}
   */
  async findByActor(actorType, actorId) {
    return this.#events.filter((e) => {
      if (actorType !== undefined && e.actor?.type !== actorType) return false;
      if (actorId !== undefined && e.actor?.id !== actorId) return false;
      return true;
    });
  }

  /**
   * Find events within an ISO timestamp window.
   * Either bound may be omitted (open-ended range).
   *
   * @param {string|undefined} from  — inclusive lower bound
   * @param {string|undefined} to    — inclusive upper bound
   * @returns {Promise<object[]>}
   */
  async findByTimeRange(from, to) {
    const fromMs = from ? new Date(from).getTime() : -Infinity;
    const toMs = to ? new Date(to).getTime() : Infinity;
    return this.#events.filter((e) => {
      const ts = new Date(e.timestamp).getTime();
      return ts >= fromMs && ts <= toMs;
    });
  }

  /**
   * Find events by outcome value.
   *
   * @param {string} outcome
   * @returns {Promise<object[]>}
   */
  async findByOutcome(outcome) {
    return this.#events.filter((e) => e.outcome === outcome);
  }

  /**
   * Return all stored events (defensive copy — mutations do not affect store).
   *
   * @returns {Promise<object[]>}
   */
  async listAll() {
    return [...this.#events];
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Number of events currently in the store. */
  get size() {
    return this.#events.length;
  }
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a new empty InMemoryAuditSink.
 */
export function createAuditSink() {
  return new InMemoryAuditSink();
}
