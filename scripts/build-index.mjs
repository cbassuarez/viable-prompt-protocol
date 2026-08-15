#!/usr/bin/env node
// Rebuild corpus/<version>/index.jsonl deterministically from the session files.
//
// The experiment runners used to APPEND to index.jsonl on every run, so re-runs
// accumulated duplicate/stale entries (the index drifted out of sync with the
// sessions on disk). This script makes the index a pure function of the session
// files: scan sessions, sort by id, rewrite the index.
//
// Protocol v1.4 is an immutable historical corpus. This command intentionally
// leaves its index and sessions untouched; `--all` rebuilds mutable versions
// such as corpus-schema v1.5 only.
//
// Usage:
//   node scripts/build-index.mjs [--version v1.5] [--check]
//
//   --check  Do not write; exit non-zero if the on-disk index differs from the
//            freshly-computed one. Intended for CI / `npm run validate`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(path.join(__dirname, ".."));

function parseArgs(argv) {
  const args = { version: "v1.5", check: false, all: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--check") args.check = true;
    else if (a === "--all") args.all = true;
    else if (a === "--version") args.version = argv[++i];
    else if (a.startsWith("--version=")) args.version = a.slice("--version=".length);
  }
  return args;
}

// Every corpus/<name> that has a sessions/ subdirectory.
function discoverVersions() {
  const corpusRoot = path.join(ROOT, "corpus");
  if (!fs.existsSync(corpusRoot)) return [];
  return fs
    .readdirSync(corpusRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(corpusRoot, d.name, "sessions")))
    .map((d) => d.name)
    .sort();
}

function indexEntry(session) {
  // Mirrors the entry shape the runners historically wrote, plus a couple of
  // fields that make the index useful on its own (seed for reproducibility).
  return {
    id: session.id,
    model: session.meta?.model ?? null,
    provider: session.meta?.provider ?? null,
    condition: session.meta?.condition ?? null,
    challenge_type: session.meta?.challenge_type ?? null,
    created_at: session.meta?.created_at ?? null,
    seed: session.meta?.seed ?? null
  };
}

function buildIndexText(sessionsDir) {
  const files = fs
    .readdirSync(sessionsDir)
    .filter((name) => name.toLowerCase().endsWith(".json"));

  const entries = [];
  for (const file of files) {
    const full = path.join(sessionsDir, file);
    try {
      const session = JSON.parse(fs.readFileSync(full, "utf8"));
      entries.push(indexEntry(session));
    } catch (err) {
      console.error(`Skipping unreadable session ${file}: ${err.message}`);
      process.exitCode = 1;
    }
  }

  // Deterministic order: sort by id (stable, locale-independent).
  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return entries.map((e) => JSON.stringify(e)).join("\n") + (entries.length ? "\n" : "");
}

function processVersion(version, check) {
  if (version === "v1.4") {
    console.log("Preserving immutable historical corpus index for v1.4.");
    return true;
  }
  const corpusDir = path.join(ROOT, "corpus", version);
  const sessionsDir = path.join(corpusDir, "sessions");
  const indexPath = path.join(corpusDir, "index.jsonl");

  if (!fs.existsSync(sessionsDir)) {
    console.error(`Sessions directory not found: ${sessionsDir}`);
    return false;
  }

  const next = buildIndexText(sessionsDir);

  if (check) {
    const current = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
    if (current !== next) {
      console.error(`index.jsonl is stale for ${version}. Run: node scripts/build-index.mjs --version ${version}`);
      return false;
    }
    console.log(`index.jsonl is up to date for ${version}.`);
    return true;
  }

  fs.writeFileSync(indexPath, next, "utf8");
  const lineCount = next ? next.trimEnd().split("\n").length : 0;
  console.log(`Wrote ${lineCount} entries to ${path.relative(ROOT, indexPath)}`);
  return true;
}

function main() {
  const { version, check, all } = parseArgs(process.argv.slice(2));
  const versions = all ? discoverVersions() : [version];
  let ok = true;
  for (const v of versions) ok = processVersion(v, check) && ok;
  if (!ok) process.exit(1);
}

main();
