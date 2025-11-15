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
  "vpp_task_utility",
  "baseline_task_utility",
  "mini_proto_task_utility"
]);

const TASK_CONSTRAINTS = {
  "t1-exp-protocol-llm": {
    sections: [
      "Goals",
      "Threat model & attack surfaces",
      "Task suite design",
      "Metrics & reporting"
    ],
    max_words: 500,
    require_bullets: true
  },
  "t2-litreview-synth": {
    sections: [
      "Problem framing",
      "Methods and benchmarks",
      "Open questions"
    ],
    max_words: 400,
    require_bullets: false
  },
  "t3-api-spec-design": {
    sections: [
      "Core resources",
      "Example endpoints",
      "Common usage patterns"
    ],
    max_words: 450,
    require_bullets: true
  },
  "t4-refactor-plan": {
    sections: [
      "Context & risks",
      "Proposed changes",
      "Validation plan"
    ],
    max_words: 450,
    require_bullets: true
  },
  "t5-test-harness": {
    sections: [
      "Test goals",
      "Mock data + fixtures",
      "Automation & CI hooks",
      "Reporting & dashboards"
    ],
    max_words: 500,
    require_bullets: true
  },
  "t6-incident-report": {
    sections: [
      "Summary",
      "Timeline",
      "Root cause analysis",
      "Mitigations"
    ],
    max_words: 500,
    require_bullets: true
  }
};

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
    sessions_analyzed: 0,
    header_ok: 0,
    footer_ok: 0,
    final_struct_ok: 0,
    sections_ratio_sum: 0,
    sections_ratio_count: 0,
    too_long_count: 0,
    too_long_den: 0,
    bullet_count: 0
  };
}

function detectSections(body, sections) {
  if (!body || !Array.isArray(sections) || sections.length === 0) {
    return { ratio: null };
  }
  const lower = body.toLowerCase();
  let hits = 0;
  for (const section of sections) {
    const query = section.toLowerCase();
    let present = lower.includes(query);
    if (!present && query.includes("&")) {
      const alt = query.replace(/&/g, "and");
      present = lower.includes(alt);
    }
    if (present) {
      hits += 1;
    }
  }
  return { ratio: hits / sections.length };
}

function countWords(text) {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasBullets(text) {
  if (!text) return false;
  return /^(\s*[-*]|\s*\d+\.)/m.test(text);
}

function analyze() {
  const statsByCondition = new Map();
  for (const cond of CONDITIONS) {
    statsByCondition.set(cond, initStats());
  }

  const records = loadIndexRecords();
  for (const entry of records) {
    if (entry.challenge_type !== "task_utility") continue;
    if (!CONDITIONS.has(entry.condition)) continue;

    const stats = statsByCondition.get(entry.condition);
    const session = loadSession(entry.id);
    if (!session) continue;

    const assistantTurns = (session.turns || []).filter(
      turn => turn.role === "assistant"
    );
    if (assistantTurns.length === 0) continue;

    const finalTurn = assistantTurns[assistantTurns.length - 1];
    stats.sessions_analyzed += 1;

    const headerOk = Boolean(finalTurn.raw_header && finalTurn.tag);
    const footerOk = Boolean(finalTurn?.parsed_footer?.version === "v1.4");
    if (headerOk) stats.header_ok += 1;
    if (footerOk) stats.footer_ok += 1;
    if (headerOk && footerOk) stats.final_struct_ok += 1;

    const body = typeof finalTurn.body === "string" ? finalTurn.body : "";
    const constraint = TASK_CONSTRAINTS[session.meta?.task_template_id];
    if (constraint?.sections?.length) {
      const { ratio } = detectSections(body, constraint.sections);
      if (typeof ratio === "number") {
        stats.sections_ratio_sum += ratio;
        stats.sections_ratio_count += 1;
      }
    }

    if (constraint?.max_words) {
      stats.too_long_den += 1;
      const words = countWords(body);
      if (words > constraint.max_words * 1.5) {
        stats.too_long_count += 1;
      }
    }

    const bullets = hasBullets(body);
    if (bullets) stats.bullet_count += 1;
  }

  console.log("Exp4 — Task Utility");
  console.log("");

  for (const cond of CONDITIONS) {
    const stats = statsByCondition.get(cond) || initStats();
    const analyzed = stats.sessions_analyzed;
    console.log(`Condition: ${cond}`);
    console.log(`  Sessions analyzed:              ${analyzed}`);
    if (analyzed === 0) {
      console.log("");
      continue;
    }

    const structPct = pct(stats.final_struct_ok, analyzed).toFixed(1);
    const headerPct = pct(stats.header_ok, analyzed).toFixed(1);
    const footerPct = pct(stats.footer_ok, analyzed).toFixed(1);
    const sectionsMean =
      stats.sections_ratio_count > 0
        ? (stats.sections_ratio_sum / stats.sections_ratio_count).toFixed(2)
        : "n/a";
    const tooLongPct = pct(stats.too_long_count, stats.too_long_den).toFixed(1);
    const bulletsPct = pct(stats.bullet_count, analyzed).toFixed(1);

    console.log(`  final_header_ok:                ${headerPct}%`);
    console.log(`  final_footer_ok:                ${footerPct}%`);
    console.log(`  final_struct_ok:                ${structPct}%`);
    console.log(`  mean sections_present_ratio:    ${sectionsMean}`);
    console.log(`  too_long rate:                  ${tooLongPct}%`);
    console.log(`  has_any_bullets rate:           ${bulletsPct}%`);
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
