import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import YAML from "yaml";

const examplesDir = path.resolve("examples");
const telcoDir = path.join(examplesDir, "telco-customer-care");
const schemaDir = path.resolve("schemas");
const ajv = new Ajv2020({
  strict: false,
  validateFormats: false,
});

const manifestTypes = [
  ["agents", "agent.schema.json", "id"],
  ["skills", "skill.schema.json", "id"],
  ["tools", "tool.schema.json", "id"],
  ["policies", "policy.schema.json", "id"],
  ["workflows", "workflow.schema.json", "id"],
  ["systems", "system.schema.json", "id"],
  ["context-scopes", "context-scope.schema.json", "id"],
  ["audit-events", "audit-event.schema.json", "event_id"],
  ["evaluations", "evaluation.schema.json", "id"],
  ["ui-manifests", "ui-manifest.schema.json", "id"],
];

async function listFiles(dir, extensions) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath, extensions)));
    } else if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

async function parseYamlFiles() {
  const files = await listFiles(examplesDir, new Set([".yaml", ".yml"]));
  const parsed = new Map();
  const failures = [];

  for (const file of files) {
    try {
      const raw = await readFile(file, "utf8");
      parsed.set(file, YAML.parse(raw));
    } catch (error) {
      failures.push(`${relative(file)}: ${error.message}`);
    }
  }

  return { files, parsed, failures };
}

function relative(file) {
  return path.relative(process.cwd(), file).replaceAll(path.sep, "/");
}

function requireFields(manifest, fields, file, failures) {
  for (const field of fields) {
    if (manifest?.[field] === undefined || manifest?.[field] === null) {
      failures.push(`${relative(file)}: missing required field "${field}"`);
    }
  }
}

function loadManifests(parsed, directoryName, idField = "id") {
  const dir = path.join(telcoDir, directoryName);
  const manifests = new Map();

  for (const [file, manifest] of parsed.entries()) {
    if (!file.startsWith(dir + path.sep)) {
      continue;
    }

    const id = manifest?.[idField];
    if (typeof id === "string") {
      manifests.set(id, { file, manifest });
    }
  }

  return manifests;
}

function requireRef(ref, collection, label, file, failures) {
  if (ref && !collection.has(ref)) {
    failures.push(`${relative(file)}: missing ${label} reference "${ref}"`);
  }
}

function requireRefs(refs, collection, label, file, failures) {
  for (const ref of refs ?? []) {
    requireRef(ref, collection, label, file, failures);
  }
}

function validateManifestShapes(parsed) {
  const failures = [];
  const requirements = new Map([
    ["agents", ["id", "version", "name", "owner", "risk_tier", "lifecycle_state"]],
    ["skills", ["id", "version", "name", "owner", "risk_tier", "lifecycle_state"]],
    ["tools", ["id", "version", "name", "owner", "target_system", "side_effects"]],
    ["policies", ["id", "version", "name", "owner", "scope", "default_decision", "rules"]],
    ["workflows", ["id", "version", "name", "owner", "steps", "completion_criteria"]],
    ["systems", ["id", "version", "name", "owner", "trust_level", "interfaces"]],
    ["context-scopes", ["id", "version", "name", "owner", "data_classification", "source_systems"]],
    ["audit-events", ["event_id", "version", "timestamp", "trace_id", "event_type", "requester", "outcome"]],
    ["evaluations", ["id", "version", "name", "owner", "target_type", "scenarios", "pass_threshold"]],
    ["ui-manifests", ["id", "version", "name", "owner", "journey_ref", "channels", "components"]],
  ]);

  for (const [directoryName, fields] of requirements.entries()) {
    const dir = path.join(telcoDir, directoryName);
    for (const [file, manifest] of parsed.entries()) {
      if (file.startsWith(dir + path.sep)) {
        requireFields(manifest, fields, file, failures);
      }
    }
  }

  return failures;
}

async function validateManifestsAgainstSchemas(parsed) {
  const failures = [];

  for (const [directoryName, schemaFile] of manifestTypes) {
    const rawSchema = await readFile(path.join(schemaDir, schemaFile), "utf8");
    const schema = JSON.parse(rawSchema);
    const validate = ajv.compile(schema);
    const dir = path.join(telcoDir, directoryName);

    for (const [file, manifest] of parsed.entries()) {
      if (!file.startsWith(dir + path.sep)) {
        continue;
      }

      if (!validate(manifest)) {
        for (const error of validate.errors ?? []) {
          const location = error.instancePath || "/";
          failures.push(`${relative(file)}: schema ${schemaFile} ${location} ${error.message}`);
        }
      }
    }
  }

  return failures;
}

function validateTelcoReferences(parsed) {
  const failures = [];
  const agents = loadManifests(parsed, "agents");
  const skills = loadManifests(parsed, "skills");
  const tools = loadManifests(parsed, "tools");
  const policies = loadManifests(parsed, "policies");
  const workflows = loadManifests(parsed, "workflows");
  const systems = loadManifests(parsed, "systems");
  const contextScopes = loadManifests(parsed, "context-scopes");
  const auditEvents = loadManifests(parsed, "audit-events", "event_id");
  const evaluations = loadManifests(parsed, "evaluations");
  const uiManifests = loadManifests(parsed, "ui-manifests");

  for (const { file, manifest } of agents.values()) {
    requireRefs(manifest.approved_skills, skills, "skill", file, failures);
    requireRefs(manifest.approved_tools, tools, "tool", file, failures);
    requireRefs(manifest.context_scopes, contextScopes, "context scope", file, failures);
    requireRef(manifest.evaluation_pack_ref, evaluations, "evaluation", file, failures);
  }

  for (const { file, manifest } of skills.values()) {
    requireRefs(manifest.approved_agents, agents, "agent", file, failures);
    requireRefs(manifest.required_context, contextScopes, "context scope", file, failures);
    requireRefs(manifest.tool_bindings, tools, "tool", file, failures);
    requireRefs(manifest.policies, policies, "policy", file, failures);
    requireRef(manifest.workflow_ref, workflows, "workflow", file, failures);
    requireRefs(manifest.evaluation_refs, evaluations, "evaluation", file, failures);
  }

  for (const { file, manifest } of tools.values()) {
    requireRef(manifest.target_system, systems, "system", file, failures);
    requireRefs(manifest.policy_refs, policies, "policy", file, failures);
    requireRefs(manifest.evaluation_refs, evaluations, "evaluation", file, failures);

    for (const field of ["input_schema", "output_schema"]) {
      const ref = manifest[field];
      if (ref && !existsSync(path.join(telcoDir, ref))) {
        failures.push(`${relative(file)}: missing ${field} file "${ref}"`);
      }
    }
  }

  for (const { file, manifest } of workflows.values()) {
    for (const step of manifest.steps ?? []) {
      requireRef(step.skill_ref, skills, "skill", file, failures);
      requireRef(step.policy_ref, policies, "policy", file, failures);
      requireRef(step.tool_ref, tools, "tool", file, failures);
      requireRef(step.context_scope_ref, contextScopes, "context scope", file, failures);
      requireRef(step.ui_manifest_ref, uiManifests, "UI manifest", file, failures);
    }
    requireRefs(manifest.evaluation_refs, evaluations, "evaluation", file, failures);
  }

  for (const { file, manifest } of policies.values()) {
    requireRefs(manifest.scope?.agents, agents, "agent", file, failures);
    requireRefs(manifest.scope?.skills, skills, "skill", file, failures);
    requireRefs(manifest.scope?.tools, tools, "tool", file, failures);
    requireRefs(manifest.scope?.workflows, workflows, "workflow", file, failures);
    requireRefs(manifest.scope?.systems, systems, "system", file, failures);
    requireRefs(manifest.scope?.context_scopes, contextScopes, "context scope", file, failures);
    requireRefs(manifest.evaluation_refs, evaluations, "evaluation", file, failures);
  }

  for (const { file, manifest } of contextScopes.values()) {
    requireRefs(manifest.allowed_agents, agents, "agent", file, failures);
    requireRefs(manifest.allowed_skills, skills, "skill", file, failures);
    requireRefs(manifest.source_systems, systems, "system", file, failures);
    requireRefs(manifest.evaluation_refs, evaluations, "evaluation", file, failures);
  }

  for (const { file, manifest } of uiManifests.values()) {
    requireRef(manifest.journey_ref, workflows, "workflow", file, failures);
    requireRefs(manifest.policy_refs, policies, "policy", file, failures);
    requireRefs(manifest.audit_refs, auditEvents, "audit event", file, failures);
    requireRefs(manifest.evaluation_refs, evaluations, "evaluation", file, failures);
  }

  const knownTargets = new Map([
    ...agents,
    ...skills,
    ...tools,
    ...policies,
    ...workflows,
    ...systems,
  ]);

  for (const { file, manifest } of evaluations.values()) {
    for (const ref of manifest.target_refs ?? []) {
      requireRef(ref, knownTargets, "evaluation target", file, failures);
    }
    requireRefs(manifest.audit_refs, auditEvents, "audit event", file, failures);
  }

  for (const { file, manifest } of auditEvents.values()) {
    requireRef(manifest.agent_id, agents, "agent", file, failures);
    requireRef(manifest.skill_id, skills, "skill", file, failures);
    requireRef(manifest.policy_id, policies, "policy", file, failures);
    requireRef(manifest.tool_id, tools, "tool", file, failures);
    requireRef(manifest.workflow_id, workflows, "workflow", file, failures);
    requireRef(manifest.system_id, systems, "system", file, failures);
    requireRef(manifest.context_scope_id, contextScopes, "context scope", file, failures);
    requireRef(manifest.evaluation_id, evaluations, "evaluation", file, failures);
  }

  return failures;
}

const { files, parsed, failures: parseFailures } = await parseYamlFiles();
const failures = [
  ...parseFailures,
  ...validateManifestShapes(parsed),
  ...(await validateManifestsAgainstSchemas(parsed)),
  ...validateTelcoReferences(parsed),
];

if (failures.length > 0) {
  console.error("Example validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${files.length} YAML example file(s).`);
