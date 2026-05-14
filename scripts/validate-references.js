/**
 * validate-references.js
 *
 * Cross-reference validation for Enterprise AI Agent Harness example manifests.
 *
 * Checks that every object ID referenced across YAML manifests (agent → skill,
 * skill → policy, workflow → tool, etc.) resolves to a real object in the same
 * example set. This catches broken links before a runtime ever loads the specs.
 *
 * Design: ADR-001 (docs/architecture/adr-001-cross-reference-validation.md)
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";

const examplesDir = path.resolve("examples");

// ── Helpers ──────────────────────────────────────────────────────────────────

function relative(file) {
  return path.relative(process.cwd(), file).replaceAll(path.sep, "/");
}

async function listYamlFiles(dir) {
  let files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await listYamlFiles(full));
    } else if (entry.isFile() && /\.(yaml|yml)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function loadManifests(exampleDir, subdirectory, idField = "id") {
  const dir = path.join(exampleDir, subdirectory);
  const manifests = new Map();
  let files = [];
  try {
    files = await listYamlFiles(dir);
  } catch {
    return manifests; // directory may not exist for every example
  }
  for (const file of files) {
    try {
      const raw = await readFile(file, "utf8");
      const manifest = YAML.parse(raw);
      const id = manifest?.[idField];
      if (typeof id === "string") {
        manifests.set(id, { file, manifest });
      }
    } catch {
      // parse errors are caught by validate-examples.js
    }
  }
  return manifests;
}

function check(ref, registry, label, sourceFile, failures) {
  if (ref != null && !registry.has(String(ref))) {
    failures.push(`${relative(sourceFile)}: broken ${label} reference "${ref}"`);
  }
}

function checkAll(refs, registry, label, sourceFile, failures) {
  for (const ref of refs ?? []) {
    check(ref, registry, label, sourceFile, failures);
  }
}

// ── Per-example validation ────────────────────────────────────────────────────

async function validateExample(exampleDir) {
  const failures = [];

  const agents       = await loadManifests(exampleDir, "agents");
  const skills       = await loadManifests(exampleDir, "skills");
  const tools        = await loadManifests(exampleDir, "tools");
  const policies     = await loadManifests(exampleDir, "policies");
  const workflows    = await loadManifests(exampleDir, "workflows");
  const systems      = await loadManifests(exampleDir, "systems");
  const ctxScopes    = await loadManifests(exampleDir, "context-scopes");
  const auditEvents  = await loadManifests(exampleDir, "audit-events", "event_id");
  const evaluations  = await loadManifests(exampleDir, "evaluations");
  const uiManifests  = await loadManifests(exampleDir, "ui-manifests");

  const allObjects = new Map([...agents, ...skills, ...tools, ...policies,
    ...workflows, ...systems]);

  // Agent references
  for (const { file, manifest } of agents.values()) {
    checkAll(manifest.approved_skills,    skills,     "skill",         file, failures);
    checkAll(manifest.approved_tools,     tools,      "tool",          file, failures);
    checkAll(manifest.context_scopes,     ctxScopes,  "context-scope", file, failures);
    checkAll(manifest.evaluation_refs,    evaluations,"evaluation",    file, failures);
    check(manifest.evaluation_pack_ref,   evaluations,"evaluation",    file, failures);
    checkAll(manifest.audit_refs,         auditEvents,"audit-event",   file, failures);
  }

  // Skill references
  for (const { file, manifest } of skills.values()) {
    checkAll(manifest.approved_agents,    agents,     "agent",         file, failures);
    checkAll(manifest.required_context,   ctxScopes,  "context-scope", file, failures);
    checkAll(manifest.tool_bindings,      tools,      "tool",          file, failures);
    checkAll(manifest.policies,           policies,   "policy",        file, failures);
    check(manifest.workflow_ref,          workflows,  "workflow",      file, failures);
    checkAll(manifest.evaluation_refs,    evaluations,"evaluation",    file, failures);
    checkAll(manifest.audit_refs,         auditEvents,"audit-event",   file, failures);
  }

  // Tool references
  for (const { file, manifest } of tools.values()) {
    check(manifest.target_system,         systems,    "system",        file, failures);
    checkAll(manifest.policy_refs,        policies,   "policy",        file, failures);
    checkAll(manifest.evaluation_refs,    evaluations,"evaluation",    file, failures);

    for (const field of ["input_schema", "output_schema"]) {
      const ref = manifest[field];
      if (ref && !existsSync(path.join(exampleDir, ref))) {
        failures.push(`${relative(file)}: missing ${field} file "${ref}"`);
      }
    }
  }

  // Workflow references (step-level)
  for (const { file, manifest } of workflows.values()) {
    for (const step of manifest.steps ?? []) {
      check(step.skill_ref,       skills,     "skill",      file, failures);
      check(step.policy_ref,      policies,   "policy",     file, failures);
      check(step.tool_ref,        tools,      "tool",       file, failures);
      check(step.context_scope_ref, ctxScopes,"context-scope", file, failures);
      check(step.ui_manifest_ref, uiManifests,"ui-manifest",file, failures);
    }
    checkAll(manifest.evaluation_refs, evaluations, "evaluation", file, failures);
    checkAll(manifest.audit_refs,      auditEvents, "audit-event",file, failures);
  }

  // Policy scope references
  for (const { file, manifest } of policies.values()) {
    const s = manifest.scope ?? {};
    checkAll(s.agents,         agents,    "agent",         file, failures);
    checkAll(s.skills,         skills,    "skill",         file, failures);
    checkAll(s.tools,          tools,     "tool",          file, failures);
    checkAll(s.workflows,      workflows, "workflow",      file, failures);
    checkAll(s.systems,        systems,   "system",        file, failures);
    checkAll(s.context_scopes, ctxScopes, "context-scope", file, failures);
    checkAll(manifest.evaluation_refs, evaluations,"evaluation",  file, failures);
  }

  // Context-scope references
  for (const { file, manifest } of ctxScopes.values()) {
    checkAll(manifest.allowed_agents,  agents,     "agent",      file, failures);
    checkAll(manifest.allowed_skills,  skills,     "skill",      file, failures);
    checkAll(manifest.source_systems,  systems,    "system",     file, failures);
    checkAll(manifest.evaluation_refs, evaluations,"evaluation", file, failures);
  }

  // UI manifest references
  for (const { file, manifest } of uiManifests.values()) {
    check(manifest.journey_ref,          workflows,  "workflow",   file, failures);
    checkAll(manifest.policy_refs,       policies,   "policy",     file, failures);
    checkAll(manifest.audit_refs,        auditEvents,"audit-event",file, failures);
    checkAll(manifest.evaluation_refs,   evaluations,"evaluation", file, failures);
  }

  // Evaluation target references
  for (const { file, manifest } of evaluations.values()) {
    checkAll(manifest.target_refs, allObjects, "object", file, failures);
    checkAll(manifest.audit_refs,  auditEvents,"audit-event", file, failures);
  }

  // Audit-event object references (optional fields — only check when present)
  for (const { file, manifest } of auditEvents.values()) {
    check(manifest.agent_id,         agents,     "agent",         file, failures);
    check(manifest.skill_id,         skills,     "skill",         file, failures);
    check(manifest.policy_id,        policies,   "policy",        file, failures);
    check(manifest.tool_id,          tools,      "tool",          file, failures);
    check(manifest.workflow_id,      workflows,  "workflow",      file, failures);
    check(manifest.system_id,        systems,    "system",        file, failures);
    check(manifest.context_scope_id, ctxScopes,  "context-scope", file, failures);
    check(manifest.evaluation_id,    evaluations,"evaluation",    file, failures);
  }

  return {
    name: path.basename(exampleDir),
    objectCount: agents.size + skills.size + tools.size + policies.size +
      workflows.size + systems.size + ctxScopes.size + auditEvents.size +
      evaluations.size + uiManifests.size,
    failures,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

const exampleDirs = (await readdir(examplesDir, { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => path.join(examplesDir, e.name));

let totalObjects = 0;
let totalFailures = 0;

for (const dir of exampleDirs) {
  const result = await validateExample(dir);
  totalObjects += result.objectCount;

  if (result.failures.length > 0) {
    console.error(`\nCross-reference errors in example "${result.name}":`);
    for (const f of result.failures) {
      console.error(`  ✗ ${f}`);
    }
    totalFailures += result.failures.length;
  }
}

if (totalFailures > 0) {
  console.error(`\nCross-reference validation failed: ${totalFailures} broken reference(s).`);
  process.exit(1);
}

console.log(`Cross-references validated: ${exampleDirs.length} example(s), ${totalObjects} manifest objects checked.`);
