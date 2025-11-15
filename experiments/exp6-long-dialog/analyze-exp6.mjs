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
  "vpp_longdialog_grounded",
  "vpp_longdialog_tags_only",
  "baseline_longdialog_tags"
]);

const COVERAGE_KEYWORDS = [
  "goals",
  "threat model",
  "task suite",
  "metrics"
];

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
      console.warn("Skipping malformed index line:", trimmed);
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
    header_present_sum: 0,
    footer_present_sum: 0,
    footer_v14_sum: 0,
    tag_match_sum: 0,
    tag_match_den: 0,
    assistant_turns: 0,
    first_failure_turns: [],
    coverage_ok: 0
  };
}

function collectAssistantMetrics(session) {
  const assistantTurns = (session.turns || []).filter(
    turn => turn.role === "assistant"
  );
  const orderedTurns = session.turns || [];
  let firstFailure = null;
  let headerHits = 0;
  let footerHits = 0;
  let footerV14Hits = 0;
  let tagMatchHits = 0;
  let tagMatchDen = 0;

  for (const turn of assistantTurns) {
    const headerOk = Boolean(turn.raw_header && turn.raw_header.length > 0);
    const footerOk = Boolean(turn.footer);
    const footerV14Ok = Boolean(turn?.parsed_footer?.version === "v1.4");

    if (headerOk) headerHits += 1;
    if (footerOk) footerHits += 1;
    if (footerV14Ok) footerV14Hits += 1;

    const prevUser = findPreviousUserTurn(orderedTurns, turn.turn_index);
    if (prevUser && prevUser.tag) {
      tagMatchDen += 1;
      if (turn.tag && turn.tag === prevUser.tag) {
        tagMatchHits += 1;
      } else if (firstFailure === null) {
        firstFailure = turn.turn_index;
      }
    }

    if (firstFailure === null) {
      if (!headerOk || !footerOk || (prevUser?.tag && turn.tag !== prevUser.tag)) {
        firstFailure = turn.turn_index;
      }
    }
  }

  const conversationText = assistantTurns
    .map(turn => turn.body || "")
    .join("\n")
    .toLowerCase();
  const coverage = COVERAGE_KEYWORDS.every(keyword =>
    conversationText.includes(keyword)
  );

  return {
    assistantTurnsCount: assistantTurns.length,
    headerHits,
    footerHits,
    footerV14Hits,
    tagMatchHits,
    tagMatchDen,
    firstFailure,
    coverage
  };
}

function findPreviousUserTurn(allTurns, turnIndex) {
  for (let i = turnIndex - 1; i >= 0; i -= 1) {
    const turn = allTurns[i];
    if (turn && turn.role === "user") {
      return turn;
    }
  }
  return null;
}

function analyze() {
  const statsByCondition = new Map();
  for (const cond of CONDITIONS) {
    statsByCondition.set(cond, initStats());
  }

  const records = loadIndexRecords();
  for (const entry of records) {
    if (entry.challenge_type !== "long_dialog") continue;
    if (!CONDITIONS.has(entry.condition)) continue;

    const session = loadSession(entry.id);
    if (!session) continue;

    const stats = statsByCondition.get(entry.condition);
    const metrics = collectAssistantMetrics(session);

    stats.sessions += 1;
    stats.assistant_turns += metrics.assistantTurnsCount;
    stats.header_present_sum += metrics.headerHits;
    stats.footer_present_sum += metrics.footerHits;
    stats.footer_v14_sum += metrics.footerV14Hits;
    stats.tag_match_sum += metrics.tagMatchHits;
    stats.tag_match_den += metrics.tagMatchDen;
    if (metrics.coverage) stats.coverage_ok += 1;
    if (metrics.firstFailure !== null) {
      stats.first_failure_turns.push(metrics.firstFailure);
    }
  }

  console.log("Exp6 — Long Dialog Retention");
  console.log("");

  for (const cond of CONDITIONS) {
    const stats = statsByCondition.get(cond) || initStats();
    console.log(`Condition: ${cond}`);
    console.log(`  Sessions analyzed:               ${stats.sessions}`);
    if (stats.sessions === 0) {
      console.log("");
      continue;
    }

    const headerRatio =
      stats.assistant_turns > 0
        ? (stats.header_present_sum / stats.assistant_turns).toFixed(2)
        : "n/a";
    const footerRatio =
      stats.assistant_turns > 0
        ? (stats.footer_present_sum / stats.assistant_turns).toFixed(2)
        : "n/a";
    const footerV14Ratio =
      stats.assistant_turns > 0
        ? (stats.footer_v14_sum / stats.assistant_turns).toFixed(2)
        : "n/a";
    const tagMatchRatio =
      stats.tag_match_den > 0
        ? (stats.tag_match_sum / stats.tag_match_den).toFixed(2)
        : "n/a";
    const failureTurn =
      stats.first_failure_turns.length > 0
        ? (
            stats.first_failure_turns.reduce((a, b) => a + b, 0) /
            stats.first_failure_turns.length
          ).toFixed(2)
        : "none";
    const coveragePct = pct(stats.coverage_ok, stats.sessions).toFixed(1);

    console.log(`  header_present_ratio:            ${headerRatio}`);
    console.log(`  footer_present_ratio:            ${footerRatio}`);
    console.log(`  footer_v14_ratio:                ${footerV14Ratio}`);
    console.log(`  tag_mirrors_user_ratio:          ${tagMatchRatio}`);
    console.log(`  first_structural_failure_turn:   ${failureTurn}`);
    console.log(`  task_coverage_ok:                ${coveragePct}%`);
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
