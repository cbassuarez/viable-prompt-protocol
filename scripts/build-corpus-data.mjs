#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(path.join(__dirname, ".."));

// Source index + sessions
const INDEX_PATH = path.join(ROOT, "corpus", "v1.4", "index.jsonl");
const SESSIONS_SRC_DIR = path.join(ROOT, "corpus", "v1.4", "sessions");

// Destination inside VitePress docs tree, so they’re served at /corpus/v1.4/*
const DOCS_CORPUS_DIR = path.join(ROOT, "website", "docs", "corpus");
const OUT_DIR = path.join(DOCS_CORPUS_DIR, "v1.4");
const OUT_INDEX_PATH = path.join(OUT_DIR, "corpus-v1_4.json");
const SESSIONS_DEST_DIR = path.join(OUT_DIR, "sessions");

if (!fs.existsSync(INDEX_PATH)) {
  console.error("Missing index.jsonl at", INDEX_PATH);
  process.exit(1);
}

if (!fs.existsSync(SESSIONS_SRC_DIR)) {
  console.error("Missing sessions directory at", SESSIONS_SRC_DIR);
  process.exit(1);
}

// Ensure destination directories exist
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(SESSIONS_DEST_DIR, { recursive: true });

const lines = fs
  .readFileSync(INDEX_PATH, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

const entries = [];
let copied = 0;

for (const line of lines) {
  try {
    const row = JSON.parse(line);
    const {
      id,
      model,
      provider,
      condition,
      challenge_type,
      created_at,
    } = row;

    if (!id) continue;

    // Path where the JSON will be served from, relative to /corpus
    // i.e. /corpus/v1.4/sessions/<id>.json
    const relPath = `v1.4/sessions/${id}.json`;

    const srcSessionPath = path.join(SESSIONS_SRC_DIR, `${id}.json`);
    const destSessionPath = path.join(SESSIONS_DEST_DIR, `${id}.json`);

    if (fs.existsSync(srcSessionPath)) {
      // Copy session JSON into docs tree (idempotent)
      fs.copyFileSync(srcSessionPath, destSessionPath);
      copied += 1;
    } else {
      console.warn(
        `Warning: session JSON not found for id=${id} at ${srcSessionPath}`
      );
    }

    entries.push({
      id,
      model: model || null,
      provider: provider || null,
      condition: condition || null,
      challenge_type: challenge_type || null,
      created_at: created_at || null,
      // Relative path from /corpus, used by the browser page
      path: relPath,
    });
  } catch (err) {
    console.warn("Skipping invalid JSONL line:", line, err.message);
  }
}

// Write the compact JSON index next to the sessions we just copied
fs.writeFileSync(OUT_INDEX_PATH, JSON.stringify(entries, null, 2));

console.log(`Wrote ${entries.length} entries to ${OUT_INDEX_PATH}`);
console.log(`Copied ${copied} session files into ${SESSIONS_DEST_DIR}`);
