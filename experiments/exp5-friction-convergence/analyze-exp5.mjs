import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../../")
);
const CORPUS_DIR = path.join(ROOT, "corpus", "v1.4");
const SESSIONS_DIR = path.join(CORPUS_DIR, "sessions");
const INDEX_PATH = path.join(CORPUS_DIR, "index.jsonl");

const CONDITIONS = new Set([
  "vpp_friction",
  "baseline_friction",
  "mini_proto_friction"
]);

function pct(n, d) {
  if (!d) return 0;
  return (100 * n) / d;
}

function loadIndexRecords() {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(`Corpus index missing at ${INDEX_PATH}`);
  }
  const raw = fs.readFileSync(INDEX_PATH, "utf8");
  const records = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const entry = JSON.parse(trimmed);
      records.push(entry);
    } catch {
      console.warn("Skipping malformed index entry:", trimmed);
    }
  }
  return records;
}

function loadSession(id) {
  const fullPath = path.join(SESSIONS_DIR, `${id}.json`);
  if (!fs.existsSync(fullPath)) {
    console.warn("Missing session file for", id);
    return null;
  }
  try {
    const raw = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to parse session", id, err.message);
    return null;
  }
}

function initStats() {
  return {
    sessions: 0,
    turns_to_success_sum: 0,
    turns_to_success_count: 0,
    failures: 0,
    complaints_sum: 0,
    structural_breaks: 0,
    structural_break_turn_sum: 0
  };
}

function analyze() {
  const statsByCondition = new Map();
  for (const cond of CONDITIONS) {
    statsByCondition.set(cond, initStats());
  }

  const records = loadIndexRecords();
  for (const entry of records) {
    if (entry.challenge_type !== "friction") continue;
    if (!CONDITIONS.has(entry.condition)) continue;

    const session = loadSession(entry.id);
    if (!session) continue;

    const stats = statsByCondition.get(entry.condition);
    stats.sessions += 1;

    const friction = session.meta?.friction ?? {};
    const turnsToSuccess = friction.turns_to_success;
    const complaints = friction.complaints ?? 0;
    const firstBreak = friction.first_structural_break_turn ?? null;

    if (typeof turnsToSuccess === "number") {
      stats.turns_to_success_sum += turnsToSuccess;
      stats.turns_to_success_count += 1;
    } else {
      stats.failures += 1;
    }

    stats.complaints_sum += complaints;

    if (entry.condition === "vpp_friction") {
      if (typeof firstBreak === "number") {
        stats.structural_breaks += 1;
        stats.structural_break_turn_sum += firstBreak;
      }
    }
  }

  console.log("Exp5 — Friction & Convergence");
  console.log("");

  for (const cond of CONDITIONS) {
    const stats = statsByCondition.get(cond) || initStats();
    console.log(`Condition: ${cond}`);
    console.log(`  Sessions analyzed:                ${stats.sessions}`);
    if (stats.sessions === 0) {
      console.log("");
      continue;
    }

    const meanTurns =
      stats.turns_to_success_count > 0
        ? (stats.turns_to_success_sum / stats.turns_to_success_count).toFixed(2)
        : "n/a";
    const failureRate = pct(stats.failures, stats.sessions).toFixed(1);
    const meanComplaints = (stats.complaints_sum / stats.sessions).toFixed(2);

    console.log(`  mean_turns_to_success:           ${meanTurns}`);
    console.log(`  failure_rate:                    ${failureRate}%`);
    console.log(`  mean_complaints:                 ${meanComplaints}`);

    if (cond === "vpp_friction") {
      const breakRate = pct(stats.structural_breaks, stats.sessions).toFixed(1);
      const meanBreakTurn =
        stats.structural_breaks > 0
          ? (stats.structural_break_turn_sum / stats.structural_breaks).toFixed(2)
          : "n/a";
      console.log(`  structural_break_rate:           ${breakRate}%`);
      console.log(`  mean_first_structural_break:    ${meanBreakTurn}`);
    }
    console.log("");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    analyze();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
