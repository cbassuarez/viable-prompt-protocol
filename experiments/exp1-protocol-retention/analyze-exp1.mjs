#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const SESSIONS_DIR = path.join(ROOT, "corpus", "v1.4", "sessions");

const EXPECTED_HEADINGS = [
  "Goals",
  "Threat model & attack surfaces",
  "Task suite design",
  "Metrics & reporting"
];

// Exp1 instrumentation note: the original analyzer treated tags like "!<g>" (user
// commands) and "<g>" (assistant mirrors) as distinct values because the
// serialized turns omit assistant `tag` fields. That formatting quirk was a
// confounding measurement artifact—the model mirrored tags correctly, but our
// metrics compared raw headers verbatim and reported 0% adherence. We normalize
// tags before computing metrics so the experiment measures protocol retention
// rather than logging conventions.

const DEBUG_TAGS = false;

function getEffectiveTag(turn) {
  if (!turn) return null;

  if (typeof turn.tag === "string" && turn.tag.trim().length > 0) {
    return turn.tag.trim().toLowerCase();
  }

  if (typeof turn.raw_header === "string") {
    const header = turn.raw_header.trim();
    const match = header.match(/^!?<([a-z_]+)>$/i);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
  }

  return null;
}

function normalizeSessionTags(session) {
  if (!session || !Array.isArray(session.turns)) return;
  for (const turn of session.turns) {
    const effective = getEffectiveTag(turn);
    if (effective && (!turn.tag || turn.tag.trim().length === 0)) {
      // Non-destructive normalization keeps old corpus files intact while
      // ensuring in-memory metrics operate on the semantic tag value.
      turn.tag = effective;
    }
  }
}

function loadSessions() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    console.error(`Sessions directory not found: ${SESSIONS_DIR}`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(SESSIONS_DIR)
    .filter(name => name.toLowerCase().endsWith(".json"))
    .map(name => path.join(SESSIONS_DIR, name));

  const sessions = [];
  for (const filePath of files) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(raw);
      normalizeSessionTags(data);
      sessions.push(data);
    } catch (err) {
      console.warn(`Skipping ${path.basename(filePath)} due to read/parse error: ${err.message}`);
    }
  }
  return sessions;
}

function normalizeHeading(raw) {
  if (!raw) return null;
  let text = raw.trim();
  text = text.replace(/^#{1,6}\s+/, "");
  text = text.replace(/^\d+[\.)]\s+/, "");
  text = text.replace(/^[-*+]\s+/, "");
  text = text.replace(/\s*[:\-–—]\s*$/, "");
  return text.trim().toLowerCase();
}

function looksLikeHeading(raw) {
  if (!raw) return false;
  const text = raw.trim();
  if (!text) return false;
  if (/^#{1,6}\s+/.test(text)) return true;
  if (/^\d+[\.)]\s+[A-Z]/.test(text)) return true;
  if (/^[A-Z][A-Za-z0-9 '&\-/]+\s*[:\-–—]?$/u.test(text) && text.length <= 80) return true;
  return false;
}

function extractHeadings(body) {
  const lines = (body ?? "").split(/\r?\n/);
  const headings = [];
  for (const line of lines) {
    if (!looksLikeHeading(line)) continue;
    const normalized = normalizeHeading(line);
    if (!normalized) continue;
    headings.push({ raw: line.trim(), normalized });
  }
  return headings;
}

function hasPrematureProtocol(gTurn) {
  if (!gTurn) return false;
  const body = gTurn.body ?? "";
  const matches = EXPECTED_HEADINGS.filter(heading => body.includes(heading)).length;
  return matches >= 3;
}

function finalProtocolInOrder(oTurn) {
  if (!oTurn) return false;
  const headings = extractHeadings(oTurn.body);
  if (headings.length !== EXPECTED_HEADINGS.length) {
    return false;
  }

  const expectedNormalized = EXPECTED_HEADINGS.map(h => h.toLowerCase());
  for (let i = 0; i < headings.length; i += 1) {
    if (headings[i].normalized !== expectedNormalized[i]) {
      return false;
    }
  }
  return true;
}

function analyzeSession(session) {
  const assistantTurns = session.turns.filter(turn => turn.role === "assistant");
  const assistantCount = assistantTurns.length;

  const headerPresent = assistantTurns.filter(turn => {
    const header = turn.raw_header;
    return typeof header === "string" && header.trim().length > 0;
  }).length;

  let comparablePairs = 0;
  let mirroredPairs = 0;
  for (const turn of assistantTurns) {
    const prevUser = session.turns
      .slice(0, turn.turn_index)
      .reverse()
      .find(candidate => candidate.role === "user");
    const assistantTag = getEffectiveTag(turn);
    const userTag = getEffectiveTag(prevUser);
    if (assistantTag && userTag) {
      comparablePairs += 1;
      if (DEBUG_TAGS) {
        console.debug(
          `[tag-debug] user ${prevUser?.raw_header ?? "<none>"}/${userTag} -> assistant ${turn.raw_header}/${assistantTag}`
        );
      }
      if (assistantTag === userTag) {
        mirroredPairs += 1;
      }
    }
  }

  const footerPresent = assistantTurns.filter(turn => {
    const footer = turn.footer;
    return typeof footer === "string" && footer.trim().length > 0;
  }).length;

  const footerVersionMatch = assistantTurns.filter(turn => {
    return turn.parsed_footer && turn.parsed_footer.version === "v1.4";
  }).length;

  const firstAssistantG = assistantTurns.find(turn => getEffectiveTag(turn) === "g");
  const lastAssistantO = [...assistantTurns].reverse().find(turn => getEffectiveTag(turn) === "o");

  const premature = hasPrematureProtocol(firstAssistantG);
  const finalOk = finalProtocolInOrder(lastAssistantO);
  const protocolRetentionOk = !premature && finalOk;

  return {
    assistantCount,
    header_present_rate: assistantCount ? headerPresent / assistantCount : 0,
    tag_mirrors_user_rate: comparablePairs ? mirroredPairs / comparablePairs : 0,
    footer_present_rate: assistantCount ? footerPresent / assistantCount : 0,
    footer_version_v14_rate: assistantCount ? footerVersionMatch / assistantCount : 0,
    protocol_retention_ok: protocolRetentionOk ? 1 : 0
  };
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function summarizeByCondition(sessions) {
  const filtered = sessions.filter(
    session => session?.meta?.challenge_type === "protocol_retention"
  );

  const stats = new Map();

  for (const session of filtered) {
    const condition = session.meta?.condition ?? "unknown";
    if (!stats.has(condition)) {
      stats.set(condition, {
        sessionCount: 0,
        assistantTurnCount: 0,
        header_present_sum: 0,
        tag_mirror_sum: 0,
        footer_present_sum: 0,
        footer_version_sum: 0,
        protocol_retention_ok_sum: 0
      });
    }
    const entry = stats.get(condition);
    const metrics = analyzeSession(session);
    entry.sessionCount += 1;
    entry.assistantTurnCount += metrics.assistantCount;
    entry.header_present_sum += metrics.header_present_rate;
    entry.tag_mirror_sum += metrics.tag_mirrors_user_rate;
    entry.footer_present_sum += metrics.footer_present_rate;
    entry.footer_version_sum += metrics.footer_version_v14_rate;
    entry.protocol_retention_ok_sum += metrics.protocol_retention_ok;
  }

  return stats;
}

function printSummary(stats) {
  if (stats.size === 0) {
    console.log("No protocol_retention sessions found.");
    return;
  }

  console.log("Exp1 — Protocol Retention Metrics\n");
  for (const [condition, entry] of stats.entries()) {
    const { sessionCount } = entry;
    if (sessionCount === 0) continue;

    const avg = value => (sessionCount ? value / sessionCount : 0);

    console.log(`Condition: ${condition}`);
    console.log(`  Sessions: ${sessionCount}`);
    console.log(`  Assistant turns: ${entry.assistantTurnCount}`);
    console.log(`  header_present:           ${formatPercent(avg(entry.header_present_sum))}`);
    console.log(`  tag_mirrors_user:         ${formatPercent(avg(entry.tag_mirror_sum))}`);
    console.log(`  footer_present:           ${formatPercent(avg(entry.footer_present_sum))}`);
    console.log(`  footer_version_v1.4:      ${formatPercent(avg(entry.footer_version_sum))}`);
    console.log(`  protocol_retention_ok:    ${formatPercent(avg(entry.protocol_retention_ok_sum))}`);
    console.log("");
  }
}

function main() {
  const sessions = loadSessions();
  const stats = summarizeByCondition(sessions);
  printSummary(stats);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
