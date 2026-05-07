import Ajv2020 from "ajv/dist/2020.js";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const schemaDir = path.resolve("schemas");
const ajv = new Ajv2020({
  strict: false,
  validateFormats: false,
  validateSchema: true,
});

async function listJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files;
}

function formatErrors(errors) {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ");
}

const failures = [];
const files = await listJsonFiles(schemaDir);

for (const file of files) {
  try {
    const raw = await readFile(file, "utf8");
    const schema = JSON.parse(raw);
    const valid = ajv.validateSchema(schema);

    if (!valid) {
      failures.push(`${file}: invalid JSON Schema: ${formatErrors(ajv.errors)}`);
      continue;
    }

    ajv.compile(schema);
  } catch (error) {
    failures.push(`${file}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error("Schema validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${files.length} schema file(s).`);
