#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), "../.."));
const SESSIONS_DIR = path.join(ROOT, "corpus", "v1.4", "sessions");

const CONDITIONS = [
  "user_only_vpp_explicit",
  "user_only_vpp_ambient_nobrowse",
  "user_only_vpp_ambient_browse"
];

const RECOGNIZED_TAGS = new Set(["g", "q", "o", "c", "o_f"]);

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
      const parsed = JSON.parse(raw);
      sessions.push(parsed);
    } catch (err) {
      console.warn(`Skipping ${path.basename(filePath)} due to read/parse error: ${err.message}`);
    }
  }
  return sessions;
}

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

function loadSessionsForCondition(allSessions, condition) {
  return allSessions.filter(session => {
    const meta = session?.meta ?? {};
    return (
      meta.challenge_type === "user_only_protocol" &&
      meta.condition === condition
    );
  });
}

function computeHeaderFooterMetrics(sessions) {
  let assistantTurnCount = 0;
  let headerPresentCount = 0;
  let footerPresentCount = 0;
  let footerVersionV14Count = 0;

  for (const session of sessions) {
    const assistantTurns = session.turns?.filter(turn => turn.role === "assistant") ?? [];
    for (const turn of assistantTurns) {
      assistantTurnCount += 1;
      const headerPresent = typeof turn.raw_header === "string" && turn.raw_header.trim().length > 0;
      const tag = getEffectiveTag(turn);
      if (headerPresent && tag && RECOGNIZED_TAGS.has(tag)) {
        headerPresentCount += 1;
      }
      const footerPresent = typeof turn.footer === "string" && turn.footer.trim().length > 0;
      if (footerPresent) {
        footerPresentCount += 1;
      }
      if (turn.parsed_footer && turn.parsed_footer.version === "v1.4") {
        footerVersionV14Count += 1;
      }
    }
  }

  return {
    assistantTurnCount,
    headerPresentCount,
    footerPresentCount,
    footerVersionV14Count
  };
}

function computeTagMirrors(sessions) {
  let mirrorCandidates = 0;
  let mirrorSuccesses = 0;

  for (const session of sessions) {
    const assistantTurns = session.turns?.filter(turn => turn.role === "assistant") ?? [];
    for (const turn of assistantTurns) {
      const assistantTag = getEffectiveTag(turn);
      if (!assistantTag || !RECOGNIZED_TAGS.has(assistantTag)) {
        continue;
      }
      const precedingUser = session.turns
        .slice(0, turn.turn_index)
        .reverse()
        .find(candidate => candidate.role === "user");
      const userTag = getEffectiveTag(precedingUser);
      if (!userTag || !RECOGNIZED_TAGS.has(userTag)) {
        continue;
      }
      mirrorCandidates += 1;
      if (assistantTag === userTag) {
        mirrorSuccesses += 1;
      }
    }
  }

  return { mirrorCandidates, mirrorSuccesses };
}

function computeProtocolRetentionRate(sessions) {
  let okSessions = 0;

  for (const session of sessions) {
    const assistantTurns = session.turns?.filter(turn => turn.role === "assistant") ?? [];
    if (assistantTurns.length === 0) {
      continue;
    }
    const allStructured = assistantTurns.every(turn => {
      const headerPresent = typeof turn.raw_header === "string" && turn.raw_header.trim().length > 0;
      const tag = getEffectiveTag(turn);
      const footerPresent = typeof turn.footer === "string" && turn.footer.trim().length > 0;
      const footerOk = turn.parsed_footer && turn.parsed_footer.version === "v1.4";
      return headerPresent && tag && RECOGNIZED_TAGS.has(tag) && footerPresent && footerOk;
    });
    if (allStructured) {
      okSessions += 1;
    }
  }

  return okSessions;
}

function computeLexicalBehaviorMetrics(sessions) {
  let lexicalSessions = 0;
  let behaviorSessions = 0;

  for (const session of sessions) {
    const assistantTurns = session.turns?.filter(turn => turn.role === "assistant") ?? [];
    let anyLexical = false;
    let anyBehavior = false;

    for (const turn of assistantTurns) {
      const text = [
        turn.raw_header ?? "",
        turn.body ?? "",
        turn.footer ?? ""
      ]
        .join(" ")
        .toLowerCase();

      const mentionsVpp = text.includes("viable prompt protocol") || text.includes("vpp");
      const mentionsPromptProtocol = text.includes("prompt protocol") && text.includes("tag");

      if (mentionsVpp || mentionsPromptProtocol) {
        anyLexical = true;
      }

      const headerPresent = typeof turn.raw_header === "string" && turn.raw_header.trim().length > 0;
      const tag = getEffectiveTag(turn);
      const footerPresent = typeof turn.footer === "string" && turn.footer.trim().length > 0;
      const footerOk = turn.parsed_footer && turn.parsed_footer.version === "v1.4";
      if ((headerPresent && tag && RECOGNIZED_TAGS.has(tag) && footerPresent && footerOk) || mentionsVpp) {
        anyBehavior = true;
      }
    }

    if (anyLexical) {
      lexicalSessions += 1;
    }
    if (anyBehavior) {
      behaviorSessions += 1;
    }
  }

  return { lexicalSessions, behaviorSessions };
}

function formatPercent(numerator, denominator) {
  if (!denominator) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function printExplicitSummary(condition, sessions) {
  const { assistantTurnCount, headerPresentCount, footerPresentCount, footerVersionV14Count } =
    computeHeaderFooterMetrics(sessions);
  const { mirrorCandidates, mirrorSuccesses } = computeTagMirrors(sessions);
  const protocolOkCount = computeProtocolRetentionRate(sessions);

  console.log(`Condition: ${condition}`);
  console.log(`  Sessions: ${sessions.length}`);
  console.log(`  Assistant turns: ${assistantTurnCount}`);
  console.log(`  header_present:        ${formatPercent(headerPresentCount, assistantTurnCount)}`);
  console.log(`  tag_mirrors_user:      ${formatPercent(mirrorSuccesses, mirrorCandidates)}`);
  console.log(`  footer_present:        ${formatPercent(footerPresentCount, assistantTurnCount)}`);
  console.log(`  footer_version_v1.4:   ${formatPercent(footerVersionV14Count, assistantTurnCount)}`);
  console.log(`  protocol_retention_ok: ${formatPercent(protocolOkCount, sessions.length)}`);
  console.log();
}

function printAmbientSummary(condition, sessions) {
  const { assistantTurnCount, headerPresentCount, footerPresentCount, footerVersionV14Count } =
    computeHeaderFooterMetrics(sessions);
  const { mirrorCandidates, mirrorSuccesses } = computeTagMirrors(sessions);
  const { lexicalSessions, behaviorSessions } = computeLexicalBehaviorMetrics(sessions);

  console.log(`Condition: ${condition}`);
  console.log(`  Sessions: ${sessions.length}`);
  console.log(`  Assistant turns: ${assistantTurnCount}`);
  console.log(`  header_present:           ${formatPercent(headerPresentCount, assistantTurnCount)}`);
  console.log(`  tag_mirrors_user:         ${formatPercent(mirrorSuccesses, mirrorCandidates)}`);
  console.log(`  footer_present:           ${formatPercent(footerPresentCount, assistantTurnCount)}`);
  console.log(`  footer_version_v1.4:      ${formatPercent(footerVersionV14Count, assistantTurnCount)}`);
  console.log(`  any_vpp_lexical:          ${formatPercent(lexicalSessions, sessions.length)}`);
  console.log(`  any_vpp_behavior:         ${formatPercent(behaviorSessions, sessions.length)}`);
  console.log();
}

function main() {
  const sessions = loadSessions();
  const byCondition = new Map();
  for (const condition of CONDITIONS) {
    byCondition.set(condition, loadSessionsForCondition(sessions, condition));
  }

  console.log("Exp1b — User-Only Protocol\n");
  const explicitSessions = byCondition.get("user_only_vpp_explicit") ?? [];
  printExplicitSummary("user_only_vpp_explicit", explicitSessions);

  const ambientNoBrowse = byCondition.get("user_only_vpp_ambient_nobrowse") ?? [];
  printAmbientSummary("user_only_vpp_ambient_nobrowse", ambientNoBrowse);

  const ambientBrowse = byCondition.get("user_only_vpp_ambient_browse") ?? [];
  printAmbientSummary("user_only_vpp_ambient_browse", ambientBrowse);
}

main();
