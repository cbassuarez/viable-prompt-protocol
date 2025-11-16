#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(path.join(__dirname, ".."));

const INDEX_PATH = path.join(ROOT, "corpus", "v1.4", "index.jsonl");
// Jekyll site root is under website/docs/
const DATA_DIR = path.join(ROOT, "website", "docs", "_data");
const OUT_PATH = path.join(DATA_DIR, "corpus-v1_4.json");

if (!fs.existsSync(INDEX_PATH)) {
  console.error("Missing index.jsonl at", INDEX_PATH);
  process.exit(1);
}

fs.mkdirSync(DATA_DIR, { recursive: true });

const lines = fs
  .readFileSync(INDEX_PATH, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

const entries = [];
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

    entries.push({
      id,
      model: model || null,
      provider: provider || null,
      condition: condition || null,
      challenge_type: challenge_type || null,
      created_at: created_at || null,
      // Path where GitHub Pages serves the raw session JSON
      path: `/corpus/v1.4/sessions/${id}.json`,
    });
  } catch (err) {
    console.warn("Skipping invalid JSONL line:", line, err.message);
  }
}

fs.writeFileSync(OUT_PATH, JSON.stringify(entries, null, 2));
console.log(`Wrote ${entries.length} entries to ${OUT_PATH}`);
