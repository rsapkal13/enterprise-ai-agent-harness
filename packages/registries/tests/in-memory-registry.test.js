/**
 * in-memory-registry.test.js
 *
 * Unit tests for packages/registries/src/in-memory-registry.js
 * Tests generic store behaviour and all concrete registry types.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot  = path.resolve(__dirname, "../../..");

const {
  InMemoryAgentRegistry,
  InMemorySkillRegistry,
  InMemoryToolRegistry,
  InMemoryPolicyRegistry,
  InMemoryWorkflowRegistry,
  buildRegistries,
} = await import(path.join(repoRoot, "packages/registries/src/in-memory-registry.js"));

const { loadExampleManifests } = await import(
  path.join(repoRoot, "packages/core/src/loader.js")
);

// ── Generic store behaviour ───────────────────────────────────────────────────

describe("InMemoryAgentRegistry", () => {
  test("getAgent returns undefined for unknown id", async () => {
    const reg = new InMemoryAgentRegistry();
    const result = await reg.getAgent("does-not-exist");
    assert.equal(result, undefined);
  });

  test("registerAgent then getAgent returns the object", async () => {
    const reg = new InMemoryAgentRegistry();
    const agent = { id: "test-agent", version: "1.0.0", name: "Test", status: "active", allowedSkills: [], channels: [] };
    await reg.registerAgent(agent);
    const found = await reg.getAgent("test-agent");
    assert.deepEqual(found, agent);
  });

  test("listAgents returns all registered agents", async () => {
    const reg = new InMemoryAgentRegistry();
    await reg.registerAgent({ id: "a1", version: "1", name: "A1", status: "active", allowedSkills: [], channels: [] });
    await reg.registerAgent({ id: "a2", version: "1", name: "A2", status: "draft",  allowedSkills: [], channels: [] });
    const list = await reg.listAgents();
    assert.equal(list.length, 2);
  });

  test("load() bulk-populates the registry", async () => {
    const reg = new InMemoryAgentRegistry();
    reg.load([
      { id: "b1", version: "1", name: "B1", status: "active", allowedSkills: [], channels: [] },
      { id: "b2", version: "1", name: "B2", status: "active", allowedSkills: [], channels: [] },
    ]);
    assert.equal(reg.size, 2);
  });

  test("registering same id twice overwrites", async () => {
    const reg = new InMemoryAgentRegistry();
    await reg.registerAgent({ id: "dup", version: "1", name: "Original", status: "active", allowedSkills: [], channels: [] });
    await reg.registerAgent({ id: "dup", version: "2", name: "Updated",  status: "active", allowedSkills: [], channels: [] });
    const found = await reg.getAgent("dup");
    assert.equal(found.name, "Updated");
    assert.equal(reg.size, 1);
  });
});

describe("InMemoryToolRegistry", () => {
  test("getTool / registerTool roundtrip", async () => {
    const reg = new InMemoryToolRegistry();
    const tool = { id: "my.tool", version: "1", name: "My Tool", status: "active", adapter: "mock", riskLevel: "low", systemId: "sys-1" };
    await reg.registerTool(tool);
    const found = await reg.getTool("my.tool");
    assert.deepEqual(found, tool);
  });

  test("listTools returns empty array when empty", async () => {
    const reg = new InMemoryToolRegistry();
    assert.deepEqual(await reg.listTools(), []);
  });
});

describe("InMemorySkillRegistry", () => {
  test("getSkill returns registered skill", async () => {
    const reg = new InMemorySkillRegistry();
    const skill = { id: "my.skill", version: "1", name: "My Skill", description: "", owner: "team", status: "active", riskLevel: "low", tools: [], policies: [], contextScopes: [] };
    await reg.registerSkill(skill);
    assert.ok(await reg.getSkill("my.skill"));
  });
});

describe("InMemoryPolicyRegistry", () => {
  test("getPolicy returns undefined for missing id", async () => {
    const reg = new InMemoryPolicyRegistry();
    assert.equal(await reg.getPolicy("x"), undefined);
  });
});

// ── buildRegistries ───────────────────────────────────────────────────────────

describe("buildRegistries", async () => {
  const exampleDir = path.join(repoRoot, "examples/telco-customer-care");
  const manifests  = await loadExampleManifests(exampleDir);
  const registries = buildRegistries(manifests);

  test("agents registry has the customer-service-agent", async () => {
    const agent = await registries.agents.getAgent("customer-service-agent");
    assert.ok(agent, "customer-service-agent should be in registry");
    assert.equal(agent.name, "Customer Service Agent");
  });

  test("tools registry has all 4 telco tools", async () => {
    const tools = await registries.tools.listTools();
    assert.equal(tools.length, 4);
  });

  test("tools registry can retrieve by id", async () => {
    const tool = await registries.tools.getTool("billing.calculate_price_delta");
    assert.ok(tool);
    assert.equal(tool.systemId, "fictional-billing-system");
  });

  test("policies registry has customer_data.access", async () => {
    const policy = await registries.policies.getPolicy("customer_data.access");
    assert.ok(policy, "customer_data.access not found");
    assert.equal(policy.decisionType, "deny");
  });

  test("workflows registry has the change-plan workflow", async () => {
    const wf = await registries.workflows.getWorkflow("customer.change_plan.workflow");
    assert.ok(wf);
  });

  test("skills registry has customer.change_plan", async () => {
    const skill = await registries.skills.getSkill("customer.change_plan");
    assert.ok(skill);
    assert.ok(skill.tools.includes("eligibility.check_plan_change"));
  });
});
