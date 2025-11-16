#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(path.join(__dirname, ".."));
const VERSION = "v1.4";
const OUTPUT_FILENAME = "corpus-v1_4.json";

// Source index
const INDEX_PATH = path.join(ROOT, "corpus", VERSION, "index.jsonl");

const OUTPUT_TARGETS = [
  {
    label: "corpus working copy",
    dir: path.join(ROOT, "corpus", VERSION),
  },
  {
    label: "docs public assets",
    dir: path.join(ROOT, "website", "docs", "public", "corpus", VERSION),
  },
];

if (!fs.existsSync(INDEX_PATH)) {
  console.error("Missing index.jsonl at", INDEX_PATH);
  process.exit(1);
}

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
      // Where the raw session JSON is served from on the site
      path: `/corpus/v1.4/sessions/${id}.json`,
    });
  } catch (err) {
    console.warn("Skipping invalid JSONL line:", line, err.message);
  }
}

const json = JSON.stringify(entries, null, 2);

const writtenPaths = OUTPUT_TARGETS.map(({ dir, label }) => {
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, OUTPUT_FILENAME);
  fs.writeFileSync(outPath, json);
  return { label, outPath };
});

const reportLines = writtenPaths
  .map(({ label, outPath }) => `  - ${label}: ${outPath}`)
  .join("\n");

console.log(`Wrote ${entries.length} entries to:\n${reportLines}`);
