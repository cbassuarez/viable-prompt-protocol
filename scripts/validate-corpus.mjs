#!/usr/bin/env node
// Validate corpus session files against their version's JSON Schema.
//
// By default this validates every corpus/<version> directory that has a
// schema.json (so both v1.4 and v1.5 are checked). Pass --version vX to restrict
// to one.
//
//   node scripts/validate-corpus.mjs              # all versions
//   node scripts/validate-corpus.mjs --version v1.5

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const CORPUS_ROOT = path.join(ROOT, "corpus");

function parseArgs(argv) {
  const args = { version: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--version") args.version = argv[++i];
    else if (argv[i].startsWith("--version=")) args.version = argv[i].slice("--version=".length);
  }
  return args;
}

// A "version dir" is corpus/<name> containing a schema.json.
function discoverVersionDirs() {
  if (!fs.existsSync(CORPUS_ROOT)) return [];
  return fs
    .readdirSync(CORPUS_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(CORPUS_ROOT, d.name, "schema.json")))
    .map((d) => d.name)
    .sort();
}

function validateVersion(version) {
  const dir = path.join(CORPUS_ROOT, version);
  const schemaPath = path.join(dir, "schema.json");
  const sessionsDir = path.join(dir, "sessions");

  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  let sessionPaths = [];
  if (fs.existsSync(sessionsDir)) {
    sessionPaths = fs
      .readdirSync(sessionsDir)
      .filter((name) => name.toLowerCase().endsWith(".json"))
      .map((name) => path.join(sessionsDir, name))
      .sort();
  }

  let valid = 0;
  let invalid = 0;
  for (const sessionPath of sessionPaths) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
    } catch (err) {
      console.error(`[${version}] bad JSON ${path.basename(sessionPath)}: ${err.message}`);
      invalid += 1;
      continue;
    }
    if (validate(data)) {
      valid += 1;
    } else {
      invalid += 1;
      console.error(`[${version}] validation failed for ${path.basename(sessionPath)}:`);
      for (const e of validate.errors ?? []) console.error(`    [${e.instancePath || "/"}] ${e.message}`);
    }
  }

  console.log(`[${version}] ${valid} valid, ${invalid} invalid (${sessionPaths.length} files).`);
  return invalid === 0;
}

function main() {
  const { version } = parseArgs(process.argv.slice(2));
  const versions = version ? [version] : discoverVersionDirs();

  if (versions.length === 0) {
    console.error("No corpus version directories with a schema.json found.");
    process.exit(1);
  }

  let allOk = true;
  for (const v of versions) {
    const schemaPath = path.join(CORPUS_ROOT, v, "schema.json");
    if (!fs.existsSync(schemaPath)) {
      console.error(`No schema for version ${v} at ${schemaPath}`);
      allOk = false;
      continue;
    }
    allOk = validateVersion(v) && allOk;
  }

  if (!allOk) process.exit(1);
}

main();
