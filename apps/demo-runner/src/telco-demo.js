#!/usr/bin/env node
/**
 * telco-demo.js
 *
 * Local demo runner for the fictional telco customer-care plan-change journey.
 * Runs the full change-plan workflow using mock fixtures — no real systems called.
 *
 * Usage:
 *   node apps/demo-runner/src/telco-demo.js
 *   npm run demo:telco
 *
 * Part of: v0.2 local runtime — Issue #58
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, readdir } from "node:fs/promises";
import YAML from "yaml";

// ── Path resolution ───────────────────────────────────────────────────────────

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const repoRoot   = path.resolve(__dirname, "../../..");
const exampleDir = path.join(repoRoot, "examples/telco-customer-care");

// ── Package imports (source files, no build step needed) ──────────────────────

const { loadExampleManifests } = await import(path.join(repoRoot, "packages/core/src/loader.js"));
const { buildRegistries }      = await import(path.join(repoRoot, "packages/registries/src/in-memory-registry.js"));
const { callMockTool }         = await import(path.join(repoRoot, "packages/tool-gateway/src/adapters/mock-adapter.js"));
const { InMemoryWorkflowEngine } = await import(path.join(repoRoot, "packages/workflow-engine/src/in-memory-workflow-engine.js"));

// ── Colour helpers (no chalk dependency) ─────────────────────────────────────

const c = {
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  grey:   (s) => `\x1b[90m${s}\x1b[0m`,
  dim:    (s) => `\x1b[2m${s}\x1b[0m`,
};

function banner(title) {
  const line = "─".repeat(60);
  console.log(`\n${c.cyan(line)}\n  ${c.bold(title)}\n${c.cyan(line)}`);
}

/** Print a single step result row. */
function printStep(result) {
  const icons = { completed: c.green("✓"), denied: c.red("✗"), waiting: c.yellow("⏸"), failed: c.red("!") };
  const icon  = icons[result.outcome] ?? "?";
  const tag   = c.dim(`[${result.type}]`);
  console.log(`  ${icon}  ${tag} ${c.bold(result.stepId)}`);

  // Notable output fields per step
  const notable = pickFields(result.stepId, result.output);
  for (const [k, v] of Object.entries(notable)) {
    console.log(`       ${c.grey(k + ":")} ${JSON.stringify(v)}`);
  }
}

/** Print only the new steps added since lastPrinted index. */
function printNewSteps(history, lastPrinted) {
  for (let i = lastPrinted; i < history.length; i++) {
    printStep(history[i]);
  }
  return history.length;
}

function pickFields(stepId, output) {
  if (!output || !Object.keys(output).length) return {};
  const picks = {
    read_limited_profile:       ["customer_reference", "full_name", "current_plan_id"],
    check_eligibility:          ["eligibility_status", "eligibility_reason"],
    calculate_price_delta:      ["monthly_price_delta", "currency", "price_delta_summary"],
    verify_data_access:         ["policy_id", "decision"],
    confirm_consent:            ["policy_id", "decision"],
    risk_review:                ["policy_id", "decision"],
    customer_confirmation:      ["approver_role", "approved"],
    human_review:               ["approver_role", "approved"],
    prepare_change_request:     ["prepared_request_id", "prepared_request_status"],
  };
  const keys = picks[stepId] ?? Object.keys(output).slice(0, 3);
  const result = {};
  for (const k of keys) { if (k in output) result[k] = output[k]; }
  return result;
}

/** Load the raw workflow YAML (with full step objects, not just IDs). */
async function loadRawWorkflow(workflowId) {
  const files = await readdir(path.join(exampleDir, "workflows"));
  for (const f of files) {
    if (!/\.(yaml|yml)$/.test(f)) continue;
    const raw = YAML.parse(await readFile(path.join(exampleDir, "workflows", f), "utf8"));
    if (raw?.id === workflowId) return raw;
  }
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  banner("Enterprise AI Agent Harness — Telco Demo Runner");
  console.log(c.dim("  Journey: Customer Plan-Change  |  Mode: mock / dry-run\n"));

  // 1. Load manifests
  process.stdout.write("  Loading manifests … ");
  const manifests = await loadExampleManifests(exampleDir);
  const m = manifests;
  console.log(c.green("done") + c.grey(
    ` (${m.agents.length} agents, ${m.skills.length} skills, ${m.tools.length} tools, ${m.workflows.length} workflows)`
  ));

  // 2. Build registries
  process.stdout.write("  Building registries … ");
  const registries = buildRegistries(manifests);
  console.log(c.green("done"));

  // 3. Attach raw step objects to the workflow definition
  const workflowId = "customer.change_plan.workflow";
  const rawWorkflow = await loadRawWorkflow(workflowId);
  if (!rawWorkflow) {
    console.error(c.red(`\n  ERROR: Workflow "${workflowId}" not found`)); process.exit(1);
  }
  const workflow = await registries.workflows.getWorkflow(workflowId);
  if (!workflow) {
    console.error(c.red(`\n  ERROR: Workflow "${workflowId}" not in registry`)); process.exit(1);
  }
  workflow._rawSteps = rawWorkflow.steps ?? [];

  // 4. Create engine
  const gateway = { callTool: (req) => callMockTool(req) };
  const engine  = new InMemoryWorkflowEngine({ toolGateway: gateway, toolRegistry: registries.tools, policyRegistry: registries.policies });

  // 5. Start journey
  banner("Journey: change-plan for CUST-DEMO-0001 → PLAN-PREMIUM-002");
  const input = { customer_reference: "CUST-DEMO-0001", requested_plan_id: "PLAN-PREMIUM-002" };
  console.log(c.dim(`  Input: ${JSON.stringify(input)}\n`) + c.bold("  Steps:"));

  let state     = await engine.start({ workflow, input });
  let printed   = printNewSteps(state.history, 0);

  // 6. Drive approval steps (auto-approve in demo)
  while (state.status === "waiting_for_approval") {
    const role = state.stepOutputs[state.pendingApprovalStepId]?.approver_role ?? "approver";
    console.log(`\n  ${c.yellow("⏸")}  ${c.bold("Workflow paused")} — awaiting ${c.cyan(role)} approval`);
    console.log(c.grey("     (demo: auto-approving)\n"));

    state   = await engine.resume(state.runId, true, {
      demo_auto_approved: true,
      approver_role: role,
      consent_statement_version: "v1.0",
      approval_reference: "DEMO-AUTO-APPROVAL",
    });
    printed = printNewSteps(state.history, printed);
  }

  // 7. Summary
  banner("Journey Summary");

  const statusLabel =
    state.status === "completed" ? c.green("✓ COMPLETED") :
    state.status === "failed"    ? c.red("✗ FAILED")     : c.yellow(state.status.toUpperCase());

  console.log(`  Status:   ${statusLabel}`);
  console.log(`  Run ID:   ${c.grey(state.runId)}`);
  console.log(`  Steps:    ${state.history.length} executed`);

  const prepStep  = state.stepOutputs["prepare_change_request"];
  if (prepStep?.prepared_request_id) {
    console.log(`  Request:  ${c.cyan(String(prepStep.prepared_request_id))}`);
    console.log(`  Outcome:  ${c.green(String(prepStep.prepared_request_status))}`);
  }

  const deltaStep = state.stepOutputs["calculate_price_delta"];
  if (deltaStep?.price_delta_summary) {
    console.log(`\n  ${c.bold("Price delta:")} ${deltaStep.price_delta_summary}`);
  }

  console.log(`\n${c.grey("  All tool calls used mock fixtures — no real systems were contacted.")}`);
  console.log(c.cyan("─".repeat(60)) + "\n");

  process.exit(state.status === "completed" ? 0 : 1);
}

main().catch((err) => { console.error(c.red("\n  FATAL:"), err); process.exit(1); });
