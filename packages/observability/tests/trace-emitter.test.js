/**
 * trace-emitter.test.js
 *
 * Tests for packages/observability/src/trace-emitter.js
 *
 * Coverage:
 *   - emit() produces correctly shaped TraceEvent
 *   - traceId is consistent across multiple emits
 *   - spanId is unique per emit
 *   - events are written to the provided sink
 *   - no-sink mode — emit returns event but does not throw
 *   - child() shares traceId with parent
 *   - createTraceEmitter factory
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

const { TraceEmitter, createTraceEmitter } = await import(
  path.join(repoRoot, "packages/observability/src/trace-emitter.js")
);
const { InMemoryAuditSink } = await import(
  path.join(repoRoot, "packages/audit/src/in-memory-audit-sink.js")
);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TraceEmitter", () => {
  // ── Event shape ────────────────────────────────────────────────────────────

  describe("emit() — event shape", () => {
    test("emitted event has required fields", async () => {
      const emitter = new TraceEmitter(null);
      const event = await emitter.emit("test.event");
      assert.ok(typeof event.id === "string");
      assert.ok(typeof event.traceId === "string");
      assert.ok(typeof event.spanId === "string");
      assert.equal(event.eventType, "test.event");
      assert.ok(typeof event.timestamp === "string");
      assert.ok(!isNaN(new Date(event.timestamp).getTime()));
      assert.deepEqual(event.attributes, {});
    });

    test("id and spanId are the same (one-span-per-event model)", async () => {
      const emitter = new TraceEmitter(null);
      const event = await emitter.emit("test.event");
      assert.equal(event.id, event.spanId);
    });

    test("attributes are forwarded", async () => {
      const emitter = new TraceEmitter(null);
      const event = await emitter.emit("tool.called", { toolId: "my-tool", latencyMs: 42 });
      assert.equal(event.attributes.toolId, "my-tool");
      assert.equal(event.attributes.latencyMs, 42);
    });

    test("attributes default to empty object if not provided", async () => {
      const emitter = new TraceEmitter(null);
      const event = await emitter.emit("something");
      assert.deepEqual(event.attributes, {});
    });

    test("attributes are defensively copied — caller mutation does not affect event", async () => {
      const emitter = new TraceEmitter(null);
      const attrs = { key: "original" };
      const event = await emitter.emit("test", attrs);
      attrs.key = "mutated";
      assert.equal(event.attributes.key, "original");
    });
  });

  // ── traceId consistency ────────────────────────────────────────────────────

  describe("traceId", () => {
    test("traceId is consistent across multiple emits", async () => {
      const emitter = new TraceEmitter(null);
      const e1 = await emitter.emit("a");
      const e2 = await emitter.emit("b");
      assert.equal(e1.traceId, e2.traceId);
      assert.equal(e1.traceId, emitter.traceId);
    });

    test("traceId can be supplied at construction time", () => {
      const emitter = new TraceEmitter(null, "my-custom-trace-id");
      assert.equal(emitter.traceId, "my-custom-trace-id");
    });

    test("traceId is auto-generated when not supplied", () => {
      const e1 = new TraceEmitter(null);
      const e2 = new TraceEmitter(null);
      assert.notEqual(e1.traceId, e2.traceId);
    });

    test("emitted event carries the emitter traceId", async () => {
      const emitter = new TraceEmitter(null, "fixed-trace");
      const event = await emitter.emit("evt");
      assert.equal(event.traceId, "fixed-trace");
    });
  });

  // ── spanId uniqueness ──────────────────────────────────────────────────────

  describe("spanId uniqueness", () => {
    test("each emit produces a unique spanId", async () => {
      const emitter = new TraceEmitter(null);
      const events = await Promise.all(
        Array.from({ length: 10 }, () => emitter.emit("test")),
      );
      const spanIds = new Set(events.map((e) => e.spanId));
      assert.equal(spanIds.size, 10);
    });
  });

  // ── sink integration ───────────────────────────────────────────────────────

  describe("sink integration", () => {
    test("emitted events are written to the sink", async () => {
      const sink = new InMemoryAuditSink();
      const emitter = new TraceEmitter(sink, "trace-sink-test");
      await emitter.emit("event.one");
      await emitter.emit("event.two");
      assert.equal(sink.size, 2);
    });

    test("findByTraceId on sink finds emitted events", async () => {
      const sink = new InMemoryAuditSink();
      const emitter = new TraceEmitter(sink, "trace-query-test");
      await emitter.emit("workflow.started");
      await emitter.emit("workflow.completed");
      const results = await sink.findByTraceId("trace-query-test");
      assert.equal(results.length, 2);
      assert.ok(results.some((e) => e.eventType === "workflow.started"));
      assert.ok(results.some((e) => e.eventType === "workflow.completed"));
    });

    test("multiple emitters with different traceIds are isolated in sink", async () => {
      const sink = new InMemoryAuditSink();
      const em1 = new TraceEmitter(sink, "trace-A");
      const em2 = new TraceEmitter(sink, "trace-B");
      await em1.emit("a.event");
      await em2.emit("b.event");
      const aEvents = await sink.findByTraceId("trace-A");
      const bEvents = await sink.findByTraceId("trace-B");
      assert.equal(aEvents.length, 1);
      assert.equal(bEvents.length, 1);
    });

    test("emit returns the event even when sink write is awaited", async () => {
      const sink = new InMemoryAuditSink();
      const emitter = new TraceEmitter(sink);
      const event = await emitter.emit("my.event", { data: 1 });
      assert.equal(event.eventType, "my.event");
      assert.equal(event.attributes.data, 1);
    });
  });

  // ── no-sink mode ───────────────────────────────────────────────────────────

  describe("no-sink mode", () => {
    test("null sink — emit does not throw", async () => {
      const emitter = new TraceEmitter(null);
      const event = await emitter.emit("evt");
      assert.ok(event.id);
    });

    test("undefined sink — emit does not throw", async () => {
      const emitter = new TraceEmitter(undefined);
      const event = await emitter.emit("evt");
      assert.ok(event.id);
    });
  });

  // ── child() ────────────────────────────────────────────────────────────────

  describe("child()", () => {
    test("child shares traceId with parent", async () => {
      const parent = new TraceEmitter(null, "parent-trace");
      const child = parent.child();
      assert.equal(child.traceId, parent.traceId);
    });

    test("child emits to same sink as parent", async () => {
      const sink = new InMemoryAuditSink();
      const parent = new TraceEmitter(sink, "shared-trace");
      const child = parent.child();
      await parent.emit("parent.event");
      await child.emit("child.event");
      const results = await sink.findByTraceId("shared-trace");
      assert.equal(results.length, 2);
    });

    test("child and parent emit different spanIds", async () => {
      const parent = new TraceEmitter(null, "trace-X");
      const child = parent.child();
      const pe = await parent.emit("p");
      const ce = await child.emit("c");
      assert.notEqual(pe.spanId, ce.spanId);
    });
  });

  // ── Factory ────────────────────────────────────────────────────────────────

  describe("createTraceEmitter", () => {
    test("factory returns a TraceEmitter instance", () => {
      const emitter = createTraceEmitter(null);
      assert.ok(emitter instanceof TraceEmitter);
    });

    test("factory accepts sink and traceId", async () => {
      const sink = new InMemoryAuditSink();
      const emitter = createTraceEmitter(sink, "factory-trace");
      assert.equal(emitter.traceId, "factory-trace");
      await emitter.emit("test");
      assert.equal(sink.size, 1);
    });

    test("factory works without arguments", () => {
      const emitter = createTraceEmitter();
      assert.ok(emitter instanceof TraceEmitter);
      assert.ok(typeof emitter.traceId === "string");
    });
  });
});
