// Session construction + persistence for experiment runners.
//
// Writes one <id>.json per session. It does NOT touch index.jsonl — the index
// is a pure function of the session files, rebuilt by scripts/build-index.mjs.
// (The old runners appended to the index on every run, which caused drift.)
//
// This produces the canonical v1.4 session shape (meta is strict: exactly the
// eight schema fields). Run-level stamps (harness_version, run_id, spec_version)
// arrive with the v1.5 schema in Phase 2; adding them here would fail v1.4's
// `additionalProperties: false`.

import fs from "node:fs";
import path from "node:path";

export const HARNESS_VERSION = "2.0.0";

export function createSession(config, { idOverride, metaOverrides } = {}) {
  return {
    id: idOverride ?? config.id,
    protocol_version: config.protocol_version,
    meta: {
      model: config.model,
      provider: config.provider ?? "openai",
      condition: config.condition,
      challenge_type: config.challenge_type,
      created_at: new Date().toISOString(),
      task_template_id: config.task_template_id ?? null,
      injection_template_id: config.injection_template_id ?? null,
      seed: config.seed ?? null,
      // Experiment-specific meta defaults (e.g. a fixed injection_template_id).
      ...(metaOverrides ?? {})
    },
    label: "good",
    failure_modes: [],
    turns: []
  };
}

// Append a turn, auto-assigning the next turn_index. Accepts a partial turn and
// fills the schema-required fields with safe defaults.
export function pushTurn(session, turn) {
  session.turns.push({
    turn_index: session.turns.length,
    role: turn.role,
    raw_header: turn.raw_header ?? null,
    tag: turn.tag ?? null,
    modifiers: Array.isArray(turn.modifiers) ? turn.modifiers : [],
    body: turn.body ?? "",
    footer: turn.footer ?? null,
    parsed_footer: turn.parsed_footer ?? null
  });
  return session;
}

function ensureUniqueId(baseId, sessionsDir) {
  let candidate = baseId;
  let counter = 1;
  while (fs.existsSync(path.join(sessionsDir, `${candidate}.json`))) {
    candidate = `${baseId}-${String(counter).padStart(3, "0")}`;
    counter += 1;
  }
  return candidate;
}

// Persist a session as <sessionsDir>/<id>.json. If a file with the session's id
// already exists, a numeric suffix is appended (and session.id is updated).
export function saveSession(session, sessionsDir) {
  fs.mkdirSync(sessionsDir, { recursive: true });
  session.id = ensureUniqueId(session.id, sessionsDir);
  const sessionPath = path.join(sessionsDir, `${session.id}.json`);
  fs.writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
  return sessionPath;
}
