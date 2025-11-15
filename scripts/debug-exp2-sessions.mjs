import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const CORPUS_DIR = path.join(ROOT, "corpus", "v1.4");
const INDEX_PATH = path.join(CORPUS_DIR, "index.jsonl");
const SESSIONS_DIR = path.join(CORPUS_DIR, "sessions");

function loadIndexEntries() {
  const raw = fs.readFileSync(INDEX_PATH, "utf8");
  const entries = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      entries.push(obj);
    } catch {
      console.warn("Skipping bad index line:", trimmed);
    }
  }
  return entries;
}

const entries = loadIndexEntries().filter(
  e => e.challenge_type === "prompt_injection"
);

console.log("=== All challenge_type=prompt_injection entries ===");
console.log("Total in index:", entries.length);
console.log("");

const byCondition = new Map();
for (const e of entries) {
  const cond = e.condition || "unknown";
  if (!byCondition.has(cond)) byCondition.set(cond, []);
  byCondition.get(cond).push(e);
}

for (const [cond, list] of byCondition.entries()) {
  console.log(`Condition: ${cond}`);
  console.log(`  Count: ${list.length}`);
  for (const e of list) {
    const sessionPath = path.join(SESSIONS_DIR, `${e.id}.json`);
    const exists = fs.existsSync(sessionPath) ? "OK" : "MISSING";
    console.log(`    - id=${e.id}  model=${e.model}  created_at=${e.created_at}  [${exists}]`);
  }
  console.log("");
}
