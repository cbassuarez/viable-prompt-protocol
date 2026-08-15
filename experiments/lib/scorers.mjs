// Scoring for VPP sessions. Pure functions over a session/turn; no I/O.
// Used by scripts/score-corpus.mjs (to populate v1.5 scores/flags + results.json)
// and by the exp5 runner (validateResponse is shared).

import { parseFirstLine } from "../../scripts/parse-first-line.mjs";

const VPP_TAGS = new Set(["g", "q", "o", "c", "o_f"]);

// Does this condition expect the assistant to speak VPP? (baseline / mini-proto
// do not; everything with "vpp" in the name does, including the user-only
// "ambient" conditions whose whole point is whether adoption happens.)
export function expectsVpp(condition = "") {
  return /vpp/.test(condition) && !/baseline/.test(condition);
}

// The tag the assistant should mirror for a given user header (VPP mirror rule).
export function expectedMirror(userTurn) {
  if (!userTurn || !userTurn.raw_header) return null;
  const p = parseFirstLine(userTurn.raw_header);
  if (!p.ok) return null;
  if (p.tag === "e") return p.mods.find((m) => VPP_TAGS.has(m)) ?? "o";
  if (p.tag === "e_o") return "o";
  return p.tag;
}

export function isVppHeader(turn) {
  return turn.role === "assistant" && Boolean(turn.raw_header) && VPP_TAGS.has(turn.tag);
}
export function isVppFooterV14(turn) {
  return Boolean(turn.parsed_footer) && turn.parsed_footer.version === "v1.4";
}

/* ---------- exp5 / task-structure validator (shared with the runner) ---------- */

export function requiredSectionsForTask(taskId) {
  if (taskId === "t1-exp-protocol-llm") {
    return ["Goals", "Threat model & attack surfaces", "Task suite design", "Metrics & reporting"];
  }
  return [];
}

function includesSection(lowerBody, sectionLabel) {
  const normalized = sectionLabel.toLowerCase();
  if (lowerBody.includes(normalized)) return true;
  if (normalized.includes("&")) {
    const alt = normalized.replace(/&/g, "and");
    if (lowerBody.includes(alt)) return true;
  }
  return false;
}

export function validateResponse(taskId, body, { maxWords = 750 } = {}) {
  const sections = requiredSectionsForTask(taskId);
  if (!body || sections.length === 0) return { ok: true, missingSections: [], tooLong: false };
  const lower = body.toLowerCase();
  const missing = sections.filter((s) => !includesSection(lower, s));
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const tooLong = words > maxWords;
  return { ok: missing.length === 0 && !tooLong, missingSections: missing, tooLong };
}

/* ---------- per-turn scoring ---------- */

export function scoreAssistantTurn(turn, prevUserTurn, { expectVpp }) {
  const scores = {};
  const flags = [];

  const hdr = isVppHeader(turn);
  const ftr = isVppFooterV14(turn);
  scores.vpp_header_present = hdr;
  scores.vpp_footer_v14 = ftr;
  scores.footer_well_formed = Boolean(turn.parsed_footer && turn.parsed_footer.version);

  const expected = expectedMirror(prevUserTurn);
  if (expected) scores.tag_mirrors_user = turn.tag === expected;

  // Only treat absence of structure as a failure where VPP is expected.
  if (expectVpp) {
    if (!hdr) flags.push("missing_header");
    if (!ftr) flags.push("missing_footer");
    if (expected && turn.tag !== expected) flags.push("tag_mismatch");
  }
  return { scores, flags };
}

// Returns { perTurn: Map(turn_index -> {scores,flags}), label, failure_modes,
// session metrics } and is the basis for both in-place annotation and aggregation.
export function scoreSession(session) {
  const expectVpp = expectsVpp(session.meta?.condition);
  const turns = session.turns ?? [];
  const perTurn = new Map();
  const assistantTurns = [];
  let firstStructuralFailureTurn = null;

  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    if (t.role !== "assistant") continue;
    const prevUser = i > 0 && turns[i - 1].role === "user" ? turns[i - 1] : null;
    const { scores, flags } = scoreAssistantTurn(t, prevUser, { expectVpp });
    perTurn.set(t.turn_index, { scores, flags });
    assistantTurns.push({ turn: t, scores });
    if (expectVpp && firstStructuralFailureTurn === null && (!scores.vpp_header_present || !scores.vpp_footer_v14)) {
      firstStructuralFailureTurn = t.turn_index;
    }
  }

  const failure_modes = [...new Set([...perTurn.values()].flatMap((p) => p.flags))];

  // label: where VPP is expected, "good" iff every assistant turn complied;
  // otherwise (baseline/mini) the expected behavior is plain text → "good".
  let label = "good";
  if (expectVpp) {
    const allOk = assistantTurns.length > 0 && assistantTurns.every((a) => a.scores.vpp_header_present && a.scores.vpp_footer_v14);
    label = allOk ? "good" : "bad";
  }

  const last = assistantTurns[assistantTurns.length - 1]?.scores;
  const metrics = {
    assistant_turns: assistantTurns.length,
    header_rate: rate(assistantTurns, (a) => a.scores.vpp_header_present),
    footer_rate: rate(assistantTurns, (a) => a.scores.vpp_footer_v14),
    mirror_rate: rate(assistantTurns.filter((a) => "tag_mirrors_user" in a.scores), (a) => a.scores.tag_mirrors_user),
    last_turn_retained: Boolean(last && last.vpp_header_present && last.vpp_footer_v14),
    first_structural_failure_turn: firstStructuralFailureTurn
  };

  // friction: count user "complaint" turns and find the first assistant turn that
  // satisfied the task validator (uses task_template_id as the task id).
  if (session.meta?.challenge_type === "friction") {
    const taskId = session.meta?.task_template_id;
    let turnsToSuccess = null;
    let i = 0;
    for (const a of assistantTurns) {
      i += 1;
      if (validateResponse(taskId, a.turn.body).ok) { turnsToSuccess = a.turn.turn_index; break; }
    }
    const complaints = turns.filter((t) => t.role === "user" && t.turn_index > 0).length;
    metrics.friction = { turns_to_success: turnsToSuccess, complaints, converged: turnsToSuccess != null };
  }

  // task utility (exp4): structure adherence of the single deliverable turn.
  if (session.meta?.challenge_type === "task_utility") {
    const body = assistantTurns[assistantTurns.length - 1]?.turn.body ?? "";
    const v = validateResponse(session.meta?.task_template_id, body);
    metrics.task_utility = {
      sections_ok: v.missingSections.length === 0,
      too_long: v.tooLong,
      has_bullets: /(^|\n)\s*[-*]\s+/.test(body)
    };
  }

  return { perTurn, label, failure_modes, metrics, expectVpp };
}

function rate(arr, pred) {
  if (!arr.length) return null;
  return arr.filter(pred).length / arr.length;
}

/* ---------- aggregation across sessions ---------- */

export function summarize(sessions) {
  const groups = new Map(); // `${challenge}::${condition}` -> bucket
  for (const s of sessions) {
    const key = `${s.meta?.challenge_type}::${s.meta?.condition}`;
    if (!groups.has(key)) {
      groups.set(key, {
        challenge_type: s.meta?.challenge_type,
        condition: s.meta?.condition,
        provider: s.meta?.provider,
        model: s.meta?.model,
        n: 0,
        header_rates: [],
        footer_rates: [],
        mirror_rates: [],
        last_retained: 0,
        first_fail_turns: [],
        friction_turns: [],
        friction_converged: 0,
        task_sections_ok: 0,
        task_too_long: 0
      });
    }
    const g = groups.get(key);
    const { metrics } = scoreSession(s);
    g.n += 1;
    if (metrics.header_rate != null) g.header_rates.push(metrics.header_rate);
    if (metrics.footer_rate != null) g.footer_rates.push(metrics.footer_rate);
    if (metrics.mirror_rate != null) g.mirror_rates.push(metrics.mirror_rate);
    if (metrics.last_turn_retained) g.last_retained += 1;
    if (metrics.first_structural_failure_turn != null) g.first_fail_turns.push(metrics.first_structural_failure_turn);
    if (metrics.friction) {
      if (metrics.friction.turns_to_success != null) g.friction_turns.push(metrics.friction.turns_to_success);
      if (metrics.friction.converged) g.friction_converged += 1;
    }
    if (metrics.task_utility) {
      if (metrics.task_utility.sections_ok) g.task_sections_ok += 1;
      if (metrics.task_utility.too_long) g.task_too_long += 1;
    }
  }

  const out = [];
  for (const g of groups.values()) {
    const row = {
      challenge_type: g.challenge_type,
      condition: g.condition,
      provider: g.provider,
      model: g.model,
      n: g.n,
      header_rate: mean(g.header_rates),
      footer_rate: mean(g.footer_rates),
      mirror_rate: mean(g.mirror_rates),
      last_turn_retained_rate: g.n ? g.last_retained / g.n : null
    };
    if (g.first_fail_turns.length) row.mean_first_failure_turn = mean(g.first_fail_turns);
    if (g.challenge_type === "friction") {
      row.convergence_rate = g.n ? g.friction_converged / g.n : null;
      row.mean_turns_to_success = mean(g.friction_turns);
    }
    if (g.challenge_type === "task_utility") {
      row.sections_ok_rate = g.n ? g.task_sections_ok / g.n : null;
      row.too_long_rate = g.n ? g.task_too_long / g.n : null;
    }
    out.push(row);
  }
  out.sort((a, b) => `${a.challenge_type}${a.condition}`.localeCompare(`${b.challenge_type}${b.condition}`));
  return out;
}

function mean(arr) {
  if (!arr || !arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
