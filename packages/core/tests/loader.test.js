/**
 * loader.test.js
 *
 * Unit tests for packages/core/src/loader.js
 * Tests YAML manifest loading and snake_case → camelCase field mapping.
 *
 * Uses Node.js built-in test runner (node:test + node:assert).
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot  = path.resolve(__dirname, "../../..");

const { loadExampleManifests } = await import(
  path.join(repoRoot, "packages/core/src/loader.js")
);

const exampleDir = path.join(repoRoot, "examples/telco-customer-care");

describe("loadExampleManifests — telco-customer-care", async () => {
  // Load once and share across all tests
  const manifests = await loadExampleManifests(exampleDir);

  // ── Agents ───────────────────────────────────────────────────────────────

  describe("agents", () => {
    test("loads at least one agent", () => {
      assert.ok(manifests.agents.length >= 1, "expected at least 1 agent");
    });

    test("maps lifecycle_state → status", () => {
      const agent = manifests.agents[0];
      const validStatuses = new Set(["draft", "active", "deprecated", "retired"]);
      assert.ok(validStatuses.has(agent.status), `status "${agent.status}" not a valid LifecycleStatus`);
    });

    test("maps approved_skills → allowedSkills", () => {
      const agent = manifests.agents[0];
      assert.ok(Array.isArray(agent.allowedSkills), "allowedSkills should be an array");
      assert.ok(agent.allowedSkills.length > 0, "expected at least one allowed skill");
    });

    test("maps allowed_channels → channels", () => {
      const agent = manifests.agents[0];
      assert.ok(Array.isArray(agent.channels), "channels should be an array");
    });

    test("agent has required id and name", () => {
      const agent = manifests.agents[0];
      assert.ok(typeof agent.id === "string" && agent.id.length > 0, "agent.id must be non-empty string");
      assert.ok(typeof agent.name === "string" && agent.name.length > 0, "agent.name must be non-empty string");
    });
  });

  // ── Skills ───────────────────────────────────────────────────────────────

  describe("skills", () => {
    test("loads at least one skill", () => {
      assert.ok(manifests.skills.length >= 1);
    });

    test("maps tool_bindings → tools", () => {
      const skill = manifests.skills.find((s) => s.id === "customer.change_plan");
      assert.ok(skill, "customer.change_plan skill not found");
      assert.ok(Array.isArray(skill.tools), "tools should be an array");
      assert.ok(skill.tools.includes("customer.read_limited_profile"), "expected read_limited_profile in tools");
    });

    test("maps risk_tier T2 → medium", () => {
      const skill = manifests.skills.find((s) => s.id === "customer.change_plan");
      assert.equal(skill.riskLevel, "medium");
    });

    test("maps required_context → contextScopes", () => {
      const skill = manifests.skills.find((s) => s.id === "customer.change_plan");
      assert.ok(Array.isArray(skill.contextScopes));
      assert.ok(skill.contextScopes.length > 0);
    });
  });

  // ── Tools ────────────────────────────────────────────────────────────────

  describe("tools", () => {
    test("loads 4 telco tools", () => {
      assert.equal(manifests.tools.length, 4);
    });

    test("maps adapter_type mock → adapter mock", () => {
      for (const tool of manifests.tools) {
        assert.equal(tool.adapter, "mock", `${tool.id} should have adapter=mock`);
      }
    });

    test("maps target_system → systemId", () => {
      const tool = manifests.tools.find((t) => t.id === "billing.calculate_price_delta");
      assert.ok(tool, "billing.calculate_price_delta not found");
      assert.equal(tool.systemId, "fictional-billing-system");
    });

    test("maps risk_tier T1 → low", () => {
      const tool = manifests.tools.find((t) => t.id === "customer.read_limited_profile");
      assert.equal(tool.riskLevel, "low");
    });

    test("maps risk_tier T2 → medium", () => {
      const tool = manifests.tools.find((t) => t.id === "order.prepare_plan_change_request");
      assert.equal(tool.riskLevel, "medium");
    });
  });

  // ── Workflows ─────────────────────────────────────────────────────────────

  describe("workflows", () => {
    test("loads the change-plan workflow", () => {
      const wf = manifests.workflows.find((w) => w.id === "customer.change_plan.workflow");
      assert.ok(wf, "customer.change_plan.workflow not found");
    });

    test("workflow steps list matches YAML step IDs", () => {
      const wf = manifests.workflows.find((w) => w.id === "customer.change_plan.workflow");
      assert.ok(wf.steps.includes("read_limited_profile"), "expected read_limited_profile step");
      assert.ok(wf.steps.includes("complete"), "expected complete step");
    });

    test("_rawSteps are attached with full step objects", () => {
      const wf = manifests.workflows.find((w) => w.id === "customer.change_plan.workflow");
      assert.ok(Array.isArray(wf._rawSteps), "_rawSteps should be an array");
      assert.ok(wf._rawSteps.length > 0, "_rawSteps should not be empty");
      const firstStep = wf._rawSteps[0];
      assert.ok(firstStep.id && firstStep.type, "raw step should have id and type");
    });
  });

  // ── Policies ─────────────────────────────────────────────────────────────

  describe("policies", () => {
    test("loads at least one policy", () => {
      assert.ok(manifests.policies.length >= 1);
    });

    test("customer_data.access has decisionType deny (default_decision)", () => {
      const policy = manifests.policies.find((p) => p.id === "customer_data.access");
      assert.ok(policy, "customer_data.access not found");
      assert.equal(policy.decisionType, "deny");
    });
  });

  // ── Systems ───────────────────────────────────────────────────────────────

  describe("systems", () => {
    test("loads at least one system", () => {
      assert.ok(manifests.systems.length >= 1);
    });

    test("maps trust_level mock → trustLevel mock", () => {
      const system = manifests.systems.find((s) => s.id === "fictional-crm-system");
      assert.ok(system, "fictional-crm-system not found");
      assert.equal(system.trustLevel, "mock");
    });

    test("picks most restrictive dataClassification", () => {
      // fictional-crm-system has data_classifications: [internal, confidential]
      const system = manifests.systems.find((s) => s.id === "fictional-crm-system");
      assert.equal(system.dataClassification, "confidential");
    });
  });

  // ── Context scopes ────────────────────────────────────────────────────────

  describe("contextScopes", () => {
    test("loads at least one context scope", () => {
      assert.ok(manifests.contextScopes.length >= 1);
    });

    test("has id, version, name, status, dataClassification", () => {
      const scope = manifests.contextScopes[0];
      assert.ok(scope.id);
      assert.ok(scope.version);
      assert.ok(scope.name);
      assert.ok(scope.status);
      assert.ok(scope.dataClassification);
    });
  });

  // ── Evaluations ───────────────────────────────────────────────────────────

  describe("evaluations", () => {
    test("loads at least one evaluation", () => {
      assert.ok(manifests.evaluations.length >= 1);
    });
  });

  // ── Audit events ──────────────────────────────────────────────────────────

  describe("auditEvents", () => {
    test("loads at least one audit event", () => {
      assert.ok(manifests.auditEvents.length >= 1);
    });

    test("maps event_id → id", () => {
      for (const ev of manifests.auditEvents) {
        assert.ok(typeof ev.id === "string" && ev.id.length > 0, "audit event id must be set");
      }
    });
  });
});
