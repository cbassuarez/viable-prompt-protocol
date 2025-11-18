#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(path.join(__dirname, ".."));
const SESSIONS_DIR = path.join(ROOT, "corpus", "v1.4", "sessions");
const OUTPUT_DIR = path.join(ROOT, "website", "docs", "public", "corpus", "v1.4");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "corpus-v1_4.json");

// Tags we care about for the viewer
const VALID_TAGS = new Set(["g", "q", "o", "c", "o_f"]);

function listSessionFiles() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    throw new Error(`Sessions directory not found: ${SESSIONS_DIR}`);
  }
  return fs
    .readdirSync(SESSIONS_DIR)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .map((name) => path.join(SESSIONS_DIR, name))
    .sort();
}

function toViewerVersion(protocolVersion) {
  // protocol_version is "1.4" in the sessions; the viewer expects "v1.4"
  if (typeof protocolVersion === "string" && protocolVersion.length > 0) {
    return protocolVersion.startsWith("v") ? protocolVersion : `v${protocolVersion}`;
  }
  return "v1.4";
}

function relativeFilePath(absPath) {
  // Store filePath like "corpus/v1.4/sessions/exp1-protret-0001.json"
  const rel = path.relative(ROOT, absPath).replace(/\\/g, "/");
  return rel;
}

function buildEntries() {
  const sessionFiles = listSessionFiles();
  console.log(`[build-corpus] found ${sessionFiles.length} session files`);

  const entries = [];
  let nextId = 1;

  for (const filePath of sessionFiles) {
    const rawText = fs.readFileSync(filePath, "utf8");
    const session = JSON.parse(rawText);

    const version = toViewerVersion(session.protocol_version);
    const meta = session.meta && typeof session.meta === "object" ? session.meta : {};
    const turns = Array.isArray(session.turns) ? session.turns : [];

    // Build an index from turn_index -> array index for quick lookup
    const indexByTurnIndex = new Map();
    turns.forEach((turn, idx) => {
      indexByTurnIndex.set(turn.turn_index, idx);
    });

    for (const turn of turns) {
      if (turn.role !== "assistant") continue;
      if (!VALID_TAGS.has(turn.tag)) continue;

      const assistantTurnIndex = turn.turn_index;
      const prevIndex = assistantTurnIndex - 1;
      const prevIdx = indexByTurnIndex.get(prevIndex);
      const prevTurn =
        typeof prevIdx === "number" && turns[prevIdx] && turns[prevIdx].role === "user"
          ? turns[prevIdx]
          : null;

      const userText = prevTurn && typeof prevTurn.body === "string" ? prevTurn.body : "";

      const id = `${version}-${String(nextId).padStart(4, "4").replace(/^0+/, "").padStart(4, "0")}`;
      // simpler: pad to 4 digits
      const paddedId = `${version}-${String(nextId).padStart(4, "0")}`;

      const entry = {
        // id and version
        id: paddedId,
        version,

        // core tagging (mode/correctness are conservative defaults)
        tag: turn.tag,
        mode: "happy",
        correctness: "correct",
        severity: null,

        // basic text fields
        title: `${session.id} · turn ${assistantTurnIndex} · <${turn.tag}>`,
        summary: `Session ${session.id}, assistant turn ${assistantTurnIndex} for tag <${turn.tag}>.`,
        ruleIds: [],

        // file path + texts
        filePath: relativeFilePath(filePath),
        userText,
        assistantText: typeof turn.body === "string" ? turn.body : "",

        // notes + meta
        notes: `Session ${session.id}, turns ${prevTurn ? `${prevTurn.turn_index}-` : ""}${
          assistantTurnIndex
        }.`,
        meta
      };

      entries.push(entry);
      nextId += 1;
    }
  }

  console.log(`[build-corpus] built ${entries.length} entries`);
  return entries;
}

function main() {
  const entries = buildEntries();

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2), "utf8");
  console.log(`[build-corpus] wrote ${entries.length} entries to: ${OUTPUT_PATH}`);
}

main();
