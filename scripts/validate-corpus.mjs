#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const CORPUS_DIR = path.join(ROOT, "corpus", "v1.4");
const SCHEMA_PATH = path.join(CORPUS_DIR, "schema.json");
const SESSIONS_DIR = path.join(CORPUS_DIR, "sessions");

function loadSchema() {
  try {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read schema at ${SCHEMA_PATH}:`, err.message);
    process.exit(1);
  }
}

function loadSessionFiles() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    console.error(`Sessions directory not found: ${SESSIONS_DIR}`);
    process.exit(1);
  }
  return fs
    .readdirSync(SESSIONS_DIR)
    .filter(name => name.toLowerCase().endsWith(".json"))
    .map(name => path.join(SESSIONS_DIR, name))
    .sort();
}

function validateSessions() {
  const schema = loadSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const sessionPaths = loadSessionFiles();
  if (sessionPaths.length === 0) {
    console.log("No session files found to validate.");
    return;
  }

  let validCount = 0;
  let invalidCount = 0;

  for (const sessionPath of sessionPaths) {
    let data;
    try {
      const raw = fs.readFileSync(sessionPath, "utf8");
      data = JSON.parse(raw);
    } catch (err) {
      console.error(`Failed to parse JSON for ${path.basename(sessionPath)}: ${err.message}`);
      invalidCount += 1;
      continue;
    }

    const ok = validate(data);
    if (!ok) {
      console.error(`Validation failed for ${path.basename(sessionPath)}:`);
      for (const error of validate.errors ?? []) {
        console.error(`  [${error.instancePath || "/"}] ${error.message}`);
      }
      invalidCount += 1;
    } else {
      validCount += 1;
    }
  }

  if (invalidCount > 0) {
    console.error(`\n${invalidCount} of ${sessionPaths.length} session(s) failed validation.`);
    process.exit(1);
  }

  console.log(`${validCount} session(s) validated successfully.`);
}

validateSessions();
