/**
 * in-memory-audit-sink.test.js
 *
 * Tests for packages/audit/src/in-memory-audit-sink.js
 *
 * Coverage:
 *   - write() appends events and enforces append-only semantics
 *   - findByTraceId() — top-level and nested attributes.traceId
 *   - findByActor() — type only, id only, both, neither
 *   - findByTimeRange() — open-ended and bounded windows
 *   - findByOutcome()
 *   - listAll() — defensive copy
 *   - size getter
 *   - createAuditSink factory
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

const { InMemoryAuditSink, createAuditSink } = await import(
  path.join(repoRoot, "packages/audit/src/in-memory-audit-sink.js")
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEvent(overrides = {}) {
  return {
    id: "evt-1",
    traceId: "trace-abc",
    eventType: "test.event",
    timestamp: "2026-01-01T00:00:00.000Z",
    actor: { type: "agent", id: "agent-1" },
    outcome: "completed",
    attributes: {},
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("InMemoryAuditSink", () => {
  let sink;

  beforeEach(() => {
    sink = new InMemoryAuditSink();
  });

  // ── write ──────────────────────────────────────────────────────────────────

  describe("write()", () => {
    test("empty sink starts at size 0", () => {
      assert.equal(sink.size, 0);
    });

    test("write increments size", async () => {
      await sink.write(makeEvent());
      assert.equal(sink.size, 1);
      await sink.write(makeEvent({ id: "evt-2" }));
      assert.equal(sink.size, 2);
    });

    test("write assigns id if missing", async () => {
      const event = makeEvent();
      delete event.id;
      await sink.write(event);
      const all = await sink.listAll();
      assert.ok(typeof all[0].id === "string");
      assert.ok(all[0].id.length > 0);
    });

    test("write assigns timestamp if missing", async () => {
      const event = makeEvent();
      delete event.timestamp;
      await sink.write(event);
      const all = await sink.listAll();
      assert.ok(!isNaN(new Date(all[0].timestamp).getTime()));
    });

    test("write adds _writtenAt metadata", async () => {
      await sink.write(makeEvent());
      const all = await sink.listAll();
      assert.ok(typeof all[0]._writtenAt === "string");
    });

    test("stored events are frozen (append-only enforcement)", async () => {
      await sink.write(makeEvent());
      const all = await sink.listAll();
      assert.throws(() => {
        all[0].outcome = "mutated";
      }, TypeError);
    });
  });

  // ── findByTraceId ──────────────────────────────────────────────────────────

  describe("findByTraceId()", () => {
    test("returns events with matching top-level traceId", async () => {
      await sink.write(makeEvent({ traceId: "trace-abc" }));
      await sink.write(makeEvent({ id: "evt-2", traceId: "trace-xyz" }));
      const results = await sink.findByTraceId("trace-abc");
      assert.equal(results.length, 1);
      assert.equal(results[0].id, "evt-1");
    });

    test("returns events with matching attributes.traceId", async () => {
      await sink.write(makeEvent({ traceId: undefined, attributes: { traceId: "trace-nested" } }));
      const results = await sink.findByTraceId("trace-nested");
      assert.equal(results.length, 1);
    });

    test("returns empty array when no match", async () => {
      await sink.write(makeEvent());
      const results = await sink.findByTraceId("trace-does-not-exist");
      assert.equal(results.length, 0);
    });

    test("returns multiple matching events", async () => {
      await sink.write(makeEvent({ id: "evt-1", traceId: "trace-abc" }));
      await sink.write(makeEvent({ id: "evt-2", traceId: "trace-abc" }));
      await sink.write(makeEvent({ id: "evt-3", traceId: "trace-xyz" }));
      const results = await sink.findByTraceId("trace-abc");
      assert.equal(results.length, 2);
    });
  });

  // ── findByActor ────────────────────────────────────────────────────────────

  describe("findByActor()", () => {
    beforeEach(async () => {
      await sink.write(makeEvent({ id: "e1", actor: { type: "agent", id: "agent-1" } }));
      await sink.write(makeEvent({ id: "e2", actor: { type: "agent", id: "agent-2" } }));
      await sink.write(makeEvent({ id: "e3", actor: { type: "user", id: "user-1" } }));
      await sink.write(makeEvent({ id: "e4", actor: { type: "policy_engine", id: "pe-1" } }));
    });

    test("filter by type only", async () => {
      const results = await sink.findByActor("agent");
      assert.equal(results.length, 2);
    });

    test("filter by id only", async () => {
      const results = await sink.findByActor(undefined, "agent-1");
      assert.equal(results.length, 1);
      assert.equal(results[0].id, "e1");
    });

    test("filter by type AND id", async () => {
      const results = await sink.findByActor("agent", "agent-1");
      assert.equal(results.length, 1);
    });

    test("no arguments returns all events", async () => {
      const results = await sink.findByActor();
      assert.equal(results.length, 4);
    });

    test("no match returns empty array", async () => {
      const results = await sink.findByActor("agent", "agent-99");
      assert.equal(results.length, 0);
    });
  });

  // ── findByTimeRange ────────────────────────────────────────────────────────

  describe("findByTimeRange()", () => {
    beforeEach(async () => {
      await sink.write(makeEvent({ id: "e1", timestamp: "2026-01-01T00:00:00.000Z" }));
      await sink.write(makeEvent({ id: "e2", timestamp: "2026-06-15T12:00:00.000Z" }));
      await sink.write(makeEvent({ id: "e3", timestamp: "2026-12-31T23:59:59.000Z" }));
    });

    test("bounded range returns matching events", async () => {
      const results = await sink.findByTimeRange(
        "2026-01-01T00:00:00.000Z",
        "2026-06-15T12:00:00.000Z",
      );
      assert.equal(results.length, 2);
    });

    test("open lower bound returns all up-to", async () => {
      const results = await sink.findByTimeRange(undefined, "2026-06-15T12:00:00.000Z");
      assert.equal(results.length, 2);
    });

    test("open upper bound returns all from", async () => {
      const results = await sink.findByTimeRange("2026-06-15T12:00:00.000Z");
      assert.equal(results.length, 2);
    });

    test("no bounds returns all events", async () => {
      const results = await sink.findByTimeRange();
      assert.equal(results.length, 3);
    });

    test("range with no matches returns empty array", async () => {
      const results = await sink.findByTimeRange(
        "2025-01-01T00:00:00.000Z",
        "2025-12-31T23:59:59.000Z",
      );
      assert.equal(results.length, 0);
    });
  });

  // ── findByOutcome ──────────────────────────────────────────────────────────

  describe("findByOutcome()", () => {
    test("returns only events with matching outcome", async () => {
      await sink.write(makeEvent({ id: "e1", outcome: "completed" }));
      await sink.write(makeEvent({ id: "e2", outcome: "denied" }));
      await sink.write(makeEvent({ id: "e3", outcome: "completed" }));

      const completed = await sink.findByOutcome("completed");
      assert.equal(completed.length, 2);

      const denied = await sink.findByOutcome("denied");
      assert.equal(denied.length, 1);
    });

    test("returns empty array for unknown outcome", async () => {
      await sink.write(makeEvent());
      const results = await sink.findByOutcome("unknown_outcome");
      assert.equal(results.length, 0);
    });
  });

  // ── listAll ────────────────────────────────────────────────────────────────

  describe("listAll()", () => {
    test("returns all events in insertion order", async () => {
      await sink.write(makeEvent({ id: "first" }));
      await sink.write(makeEvent({ id: "second" }));
      const all = await sink.listAll();
      assert.equal(all.length, 2);
      assert.equal(all[0].id, "first");
      assert.equal(all[1].id, "second");
    });

    test("returns defensive copy — mutations do not affect store", async () => {
      await sink.write(makeEvent());
      const all = await sink.listAll();
      all.push({ id: "injected" });
      const all2 = await sink.listAll();
      assert.equal(all2.length, 1);
    });

    test("empty sink returns empty array", async () => {
      const all = await sink.listAll();
      assert.deepEqual(all, []);
    });
  });

  // ── Factory ────────────────────────────────────────────────────────────────

  describe("createAuditSink", () => {
    test("factory returns InMemoryAuditSink instance", async () => {
      const s = createAuditSink();
      assert.ok(s instanceof InMemoryAuditSink);
      assert.equal(s.size, 0);
    });
  });
});
