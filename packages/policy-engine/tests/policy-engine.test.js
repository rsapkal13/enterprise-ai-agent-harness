/**
 * policy-engine.test.js
 *
 * Tests for packages/policy-engine/src/policy-engine.js
 *
 * Coverage:
 *   - Lifecycle guard (inactive policy → deny)
 *   - Default decision pass-through (allow / deny / require_approval / require_consent)
 *   - Rule evaluation — first matching rule wins
 *   - Condition matching: subject.agent_id, subject.skill_id, resource.tool_id,
 *     resource.tools (array), context scalar, context array
 *   - Risk-tier ceiling check
 *   - Obligation extraction (string and object forms)
 *   - No-rules policy falls back to default decision
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

const { RuleBasedPolicyEvaluator, createPolicyEvaluator } = await import(
  path.join(repoRoot, "packages/policy-engine/src/policy-engine.js")
);

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makePolicy(overrides = {}) {
  return {
    id: "test.policy",
    version: "0.1.0",
    name: "Test Policy",
    status: "active",
    decisionType: "allow",
    _rules: [],
    _applicableRiskTiers: [],
    ...overrides,
  };
}

function makeRequest(overrides = {}) {
  return {
    agentId: "agent-1",
    skillId: "skill-a",
    toolId: "tool-x",
    context: {},
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RuleBasedPolicyEvaluator", () => {
  const evaluator = new RuleBasedPolicyEvaluator();

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  describe("lifecycle guard", () => {
    test("active policy proceeds to evaluation", async () => {
      const policy = makePolicy({ status: "active", decisionType: "allow" });
      const result = await evaluator.evaluate(policy, makeRequest());
      assert.equal(result.outcome, "allow");
    });

    test("draft policy → deny", async () => {
      const policy = makePolicy({ status: "draft" });
      const result = await evaluator.evaluate(policy, makeRequest());
      assert.equal(result.outcome, "deny");
      assert.ok(result.reason.includes("draft"));
    });

    test("deprecated policy → deny", async () => {
      const policy = makePolicy({ status: "deprecated" });
      const result = await evaluator.evaluate(policy, makeRequest());
      assert.equal(result.outcome, "deny");
    });

    test("retired policy → deny", async () => {
      const policy = makePolicy({ status: "retired" });
      const result = await evaluator.evaluate(policy, makeRequest());
      assert.equal(result.outcome, "deny");
    });

    test("missing status defaults to active", async () => {
      const policy = makePolicy({ decisionType: "deny" });
      delete policy.status;
      const result = await evaluator.evaluate(policy, makeRequest());
      // No status means active, so falls through to decisionType
      assert.equal(result.outcome, "deny");
    });
  });

  // ── Default decision ───────────────────────────────────────────────────────

  describe("default decision (no rules)", () => {
    test("decisionType allow → outcome allow", async () => {
      const result = await evaluator.evaluate(
        makePolicy({ decisionType: "allow" }),
        makeRequest(),
      );
      assert.equal(result.outcome, "allow");
      assert.equal(result.policyId, "test.policy");
      assert.ok(result.evaluatedAt);
      assert.ok(Array.isArray(result.obligations));
    });

    test("decisionType deny → outcome deny", async () => {
      const result = await evaluator.evaluate(
        makePolicy({ decisionType: "deny" }),
        makeRequest(),
      );
      assert.equal(result.outcome, "deny");
    });

    test("decisionType require_approval → outcome require_approval", async () => {
      const result = await evaluator.evaluate(
        makePolicy({ decisionType: "require_approval" }),
        makeRequest(),
      );
      assert.equal(result.outcome, "require_approval");
    });

    test("decisionType require_consent → outcome require_consent", async () => {
      const result = await evaluator.evaluate(
        makePolicy({ decisionType: "require_consent" }),
        makeRequest(),
      );
      assert.equal(result.outcome, "require_consent");
    });

    test("unknown decisionType normalises to deny", async () => {
      const result = await evaluator.evaluate(
        makePolicy({ decisionType: "whatever" }),
        makeRequest(),
      );
      assert.equal(result.outcome, "deny");
    });

    test("missing decisionType normalises to deny", async () => {
      const policy = makePolicy();
      delete policy.decisionType;
      const result = await evaluator.evaluate(policy, makeRequest());
      assert.equal(result.outcome, "deny");
    });
  });

  // ── Rule evaluation ────────────────────────────────────────────────────────

  describe("rule evaluation", () => {
    test("first matching rule wins — returns rule decision", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            description: "Allow agent-1",
            condition: { subject: { agent_id: "agent-1" } },
            decision: "allow",
            obligations: [],
          },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest({ agentId: "agent-1" }));
      assert.equal(result.outcome, "allow");
      assert.ok(result.reason.includes("r1"));
    });

    test("non-matching rule falls through to default", async () => {
      const policy = makePolicy({
        decisionType: "allow",
        _rules: [
          {
            id: "r1",
            condition: { subject: { agent_id: "agent-2" } },
            decision: "deny",
          },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest({ agentId: "agent-1" }));
      assert.equal(result.outcome, "allow"); // default, not the rule
    });

    test("multiple rules — first match wins, skips later rules", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: { subject: { agent_id: "agent-1" } },
            decision: "allow",
          },
          {
            id: "r2",
            condition: { subject: { agent_id: "agent-1" } },
            decision: "deny",
          },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest({ agentId: "agent-1" }));
      assert.equal(result.outcome, "allow");
    });

    test("rule with no condition matches everything", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          { id: "r1", condition: null, decision: "require_approval" },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest());
      assert.equal(result.outcome, "require_approval");
    });

    test("rule with undefined condition matches everything", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [{ id: "r1", decision: "allow" }],
      });
      const result = await evaluator.evaluate(policy, makeRequest());
      assert.equal(result.outcome, "allow");
    });
  });

  // ── Condition: subject ─────────────────────────────────────────────────────

  describe("condition — subject", () => {
    function policyWithSubjectRule(subject) {
      return makePolicy({
        decisionType: "deny",
        _rules: [{ id: "r1", condition: { subject }, decision: "allow" }],
      });
    }

    test("subject.agent_id match → rule fires", async () => {
      const result = await evaluator.evaluate(
        policyWithSubjectRule({ agent_id: "agent-1" }),
        makeRequest({ agentId: "agent-1" }),
      );
      assert.equal(result.outcome, "allow");
    });

    test("subject.agent_id mismatch → rule skipped", async () => {
      const result = await evaluator.evaluate(
        policyWithSubjectRule({ agent_id: "agent-2" }),
        makeRequest({ agentId: "agent-1" }),
      );
      assert.equal(result.outcome, "deny");
    });

    test("subject.skill_id match → rule fires", async () => {
      const result = await evaluator.evaluate(
        policyWithSubjectRule({ skill_id: "skill-a" }),
        makeRequest({ skillId: "skill-a" }),
      );
      assert.equal(result.outcome, "allow");
    });

    test("subject.skill_id mismatch → rule skipped", async () => {
      const result = await evaluator.evaluate(
        policyWithSubjectRule({ skill_id: "skill-b" }),
        makeRequest({ skillId: "skill-a" }),
      );
      assert.equal(result.outcome, "deny");
    });

    test("subject agent_id AND skill_id both must match", async () => {
      const policy = policyWithSubjectRule({ agent_id: "agent-1", skill_id: "skill-a" });
      // Both match
      const r1 = await evaluator.evaluate(policy, makeRequest({ agentId: "agent-1", skillId: "skill-a" }));
      assert.equal(r1.outcome, "allow");
      // Only agent matches
      const r2 = await evaluator.evaluate(policy, makeRequest({ agentId: "agent-1", skillId: "skill-x" }));
      assert.equal(r2.outcome, "deny");
    });
  });

  // ── Condition: resource ────────────────────────────────────────────────────

  describe("condition — resource", () => {
    test("resource.tool_id match → rule fires", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          { id: "r1", condition: { resource: { tool_id: "tool-x" } }, decision: "allow" },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest({ toolId: "tool-x" }));
      assert.equal(result.outcome, "allow");
    });

    test("resource.tool_id mismatch → rule skipped", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          { id: "r1", condition: { resource: { tool_id: "tool-y" } }, decision: "allow" },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest({ toolId: "tool-x" }));
      assert.equal(result.outcome, "deny");
    });

    test("resource.tools (array) — toolId in list → rule fires", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: { resource: { tools: ["tool-x", "tool-y"] } },
            decision: "allow",
          },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest({ toolId: "tool-y" }));
      assert.equal(result.outcome, "allow");
    });

    test("resource.tools (array) — toolId not in list → rule skipped", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: { resource: { tools: ["tool-a", "tool-b"] } },
            decision: "allow",
          },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest({ toolId: "tool-x" }));
      assert.equal(result.outcome, "deny");
    });
  });

  // ── Condition: context ─────────────────────────────────────────────────────

  describe("condition — context", () => {
    test("context scalar match → rule fires", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: { context: { consent_present: true } },
            decision: "allow",
          },
        ],
      });
      const result = await evaluator.evaluate(
        policy,
        makeRequest({ context: { consent_present: true } }),
      );
      assert.equal(result.outcome, "allow");
    });

    test("context scalar mismatch → rule skipped", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: { context: { consent_present: true } },
            decision: "allow",
          },
        ],
      });
      const result = await evaluator.evaluate(
        policy,
        makeRequest({ context: { consent_present: false } }),
      );
      assert.equal(result.outcome, "deny");
    });

    test("context array — value included → rule fires", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: { context: { channel: ["web", "contact-center"] } },
            decision: "allow",
          },
        ],
      });
      const result = await evaluator.evaluate(
        policy,
        makeRequest({ context: { channel: "web" } }),
      );
      assert.equal(result.outcome, "allow");
    });

    test("context array — value not included → rule skipped", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: { context: { channel: ["web", "contact-center"] } },
            decision: "allow",
          },
        ],
      });
      const result = await evaluator.evaluate(
        policy,
        makeRequest({ context: { channel: "mobile-app" } }),
      );
      assert.equal(result.outcome, "deny");
    });

    test("multiple context conditions — all must match", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: { context: { consent_present: true, risk_tier: "T2" } },
            decision: "allow",
          },
        ],
      });
      // Both match
      const r1 = await evaluator.evaluate(
        policy,
        makeRequest({ context: { consent_present: true, risk_tier: "T2" } }),
      );
      assert.equal(r1.outcome, "allow");
      // Only consent matches
      const r2 = await evaluator.evaluate(
        policy,
        makeRequest({ context: { consent_present: true, risk_tier: "T3" } }),
      );
      assert.equal(r2.outcome, "deny");
    });
  });

  // ── Risk-tier ceiling ──────────────────────────────────────────────────────

  describe("risk-tier ceiling", () => {
    test("request tier in list → passes to default decision", async () => {
      const policy = makePolicy({
        decisionType: "allow",
        _applicableRiskTiers: ["T1", "T2"],
      });
      const result = await evaluator.evaluate(
        policy,
        makeRequest({ context: { risk_tier: "T2" } }),
      );
      assert.equal(result.outcome, "allow");
    });

    test("request tier NOT in list → deny", async () => {
      const policy = makePolicy({
        decisionType: "allow",
        _applicableRiskTiers: ["T1", "T2"],
      });
      const result = await evaluator.evaluate(
        policy,
        makeRequest({ context: { risk_tier: "T3" } }),
      );
      assert.equal(result.outcome, "deny");
      assert.ok(result.reason.includes("T3"));
    });

    test("empty tier list — no ceiling applied", async () => {
      const policy = makePolicy({
        decisionType: "allow",
        _applicableRiskTiers: [],
      });
      const result = await evaluator.evaluate(
        policy,
        makeRequest({ context: { risk_tier: "T4" } }),
      );
      assert.equal(result.outcome, "allow"); // no ceiling
    });

    test("missing risk_tier in context defaults to T1 for ceiling check", async () => {
      const policy = makePolicy({
        decisionType: "allow",
        _applicableRiskTiers: ["T1"],
      });
      const result = await evaluator.evaluate(policy, makeRequest({ context: {} }));
      assert.equal(result.outcome, "allow"); // T1 default is in list
    });
  });

  // ── Obligations ────────────────────────────────────────────────────────────

  describe("obligations extraction", () => {
    test("string obligations are returned directly", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: {},
            decision: "allow",
            obligations: ["emit_audit_event", "show_confirmation"],
          },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest());
      assert.deepEqual(result.obligations, ["emit_audit_event", "show_confirmation"]);
    });

    test("object obligations with type field are extracted", async () => {
      const policy = makePolicy({
        decisionType: "deny",
        _rules: [
          {
            id: "r1",
            condition: {},
            decision: "allow",
            obligations: [
              { type: "emit_audit_event", description: "log it" },
              { type: "redact_sensitive_payloads" },
            ],
          },
        ],
      });
      const result = await evaluator.evaluate(policy, makeRequest());
      assert.deepEqual(result.obligations, [
        "emit_audit_event",
        "redact_sensitive_payloads",
      ]);
    });

    test("default decision returns empty obligations", async () => {
      const result = await evaluator.evaluate(
        makePolicy({ decisionType: "allow" }),
        makeRequest(),
      );
      assert.deepEqual(result.obligations, []);
    });
  });

  // ── Decision shape ─────────────────────────────────────────────────────────

  describe("PolicyDecision shape", () => {
    test("result always has policyId, outcome, reason, obligations, evaluatedAt", async () => {
      const result = await evaluator.evaluate(makePolicy(), makeRequest());
      assert.ok(typeof result.policyId === "string");
      assert.ok(typeof result.outcome === "string");
      assert.ok(typeof result.reason === "string");
      assert.ok(Array.isArray(result.obligations));
      assert.ok(typeof result.evaluatedAt === "string");
      // evaluatedAt is a valid ISO timestamp
      assert.ok(!isNaN(new Date(result.evaluatedAt).getTime()));
    });
  });

  // ── Factory ────────────────────────────────────────────────────────────────

  describe("createPolicyEvaluator", () => {
    test("factory returns a RuleBasedPolicyEvaluator instance", async () => {
      const evaluator = createPolicyEvaluator();
      assert.ok(evaluator instanceof RuleBasedPolicyEvaluator);
      const result = await evaluator.evaluate(makePolicy(), makeRequest());
      assert.equal(result.outcome, "allow");
    });
  });

  // ── Telco scenario ─────────────────────────────────────────────────────────

  describe("telco scenario: consent.required policy", () => {
    const consentPolicy = makePolicy({
      id: "consent.required",
      decisionType: "require_approval",
      _rules: [
        {
          id: "consent_present_allows_progress",
          description: "Allow progress when current-session consent evidence is present.",
          condition: {
            subject: { agent_id: "customer-service-agent" },
            context: { consent_present: true, channel: ["contact-center", "web"] },
          },
          decision: "allow",
          obligations: [
            { type: "emit_audit_event" },
            { type: "show_confirmation" },
          ],
        },
      ],
    });

    test("consent present + web channel → allow", async () => {
      const result = await evaluator.evaluate(consentPolicy, {
        agentId: "customer-service-agent",
        skillId: "customer.change_plan",
        context: { consent_present: true, channel: "web" },
      });
      assert.equal(result.outcome, "allow");
      assert.ok(result.obligations.includes("emit_audit_event"));
    });

    test("consent absent → falls to require_approval default", async () => {
      const result = await evaluator.evaluate(consentPolicy, {
        agentId: "customer-service-agent",
        skillId: "customer.change_plan",
        context: { consent_present: false, channel: "web" },
      });
      assert.equal(result.outcome, "require_approval");
    });

    test("wrong agent → rule skipped, falls to require_approval default", async () => {
      const result = await evaluator.evaluate(consentPolicy, {
        agentId: "rogue-agent",
        skillId: "customer.change_plan",
        context: { consent_present: true, channel: "web" },
      });
      assert.equal(result.outcome, "require_approval");
    });
  });
});
