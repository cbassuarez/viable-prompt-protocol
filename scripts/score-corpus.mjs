#!/usr/bin/env node
// Score a corpus version: write per-turn scores/flags + session label/
// failure_modes back into each session (in place), then emit aggregate
// results.json per experiment and a combined summary.json.
//
//   node scripts/score-corpus.mjs [--version v1.5] [--no-write]
//
//   --no-write   compute + emit summaries but do NOT modify session files.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { scoreSession, summarize } from "../experiments/lib/scorers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(path.join(__dirname, ".."));

const CHALLENGE_TO_EXP = {
  protocol_retention: "exp1-protocol-retention",
  user_only_protocol: "exp1b-user-only-protocol",
  prompt_injection: "exp2-prompt-injection",
  task_injection: "exp3-task-injection",
  task_utility: "exp4-task-utility",
  friction: "exp5-friction-convergence",
  long_dialog: "exp6-long-dialog"
};

function parseArgs(argv) {
  const args = { version: "v1.5", write: true };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--version") args.version = argv[++i];
    else if (argv[i] === "--no-write") args.write = false;
  }
  return args;
}

function main() {
  const { version, write } = parseArgs(process.argv.slice(2));
  const sessionsDir = path.join(ROOT, "corpus", version, "sessions");
  if (!fs.existsSync(sessionsDir)) {
    console.error(`Sessions directory not found: ${sessionsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(sessionsDir).filter((f) => f.toLowerCase().endsWith(".json")).sort();
  const sessions = [];

  for (const file of files) {
    const full = path.join(sessionsDir, file);
    const session = JSON.parse(fs.readFileSync(full, "utf8"));
    const { perTurn, label, failure_modes } = scoreSession(session);

    if (write) {
      for (const turn of session.turns) {
        const ann = perTurn.get(turn.turn_index);
        if (ann) {
          turn.scores = ann.scores;
          turn.flags = ann.flags;
        }
      }
      session.label = label;
      session.failure_modes = failure_modes;
      fs.writeFileSync(full, `${JSON.stringify(session, null, 2)}\n`, "utf8");
    }
    sessions.push(session);
  }

  const summary = summarize(sessions);

  // Combined summary for the whole version.
  const summaryPath = path.join(ROOT, "corpus", version, "summary.json");
  fs.writeFileSync(summaryPath, `${JSON.stringify({ version, generated_at: new Date().toISOString(), rows: summary }, null, 2)}\n`, "utf8");

  // Per-experiment results.json (rows for that experiment's challenge type).
  const byChallenge = new Map();
  for (const row of summary) {
    if (!byChallenge.has(row.challenge_type)) byChallenge.set(row.challenge_type, []);
    byChallenge.get(row.challenge_type).push(row);
  }
  let resultsWritten = 0;
  for (const [challenge, rows] of byChallenge.entries()) {
    const expDir = CHALLENGE_TO_EXP[challenge];
    if (!expDir) continue;
    const out = path.join(ROOT, "experiments", expDir, "results.json");
    fs.writeFileSync(out, `${JSON.stringify({ challenge_type: challenge, version, generated_at: new Date().toISOString(), rows }, null, 2)}\n`, "utf8");
    resultsWritten += 1;
  }

  console.log(`Scored ${sessions.length} sessions (${version}); write=${write}.`);
  console.log(`Wrote summary.json + ${resultsWritten} experiment results.json.`);
  console.log("\nchallenge / condition                         n  hdr  ftr  mirror  lastRet  extra");
  for (const r of summary) {
    const p = (x) => (x == null ? "  - " : (100 * x).toFixed(0).padStart(3) + "%");
    let extra = "";
    if (r.challenge_type === "friction") extra = `conv=${p(r.convergence_rate)} ttsucc=${r.mean_turns_to_success ?? "-"}`;
    if (r.challenge_type === "task_utility") extra = `sections=${p(r.sections_ok_rate)} long=${p(r.too_long_rate)}`;
    if (r.mean_first_failure_turn != null) extra += ` 1stFail=${r.mean_first_failure_turn.toFixed(1)}`;
    console.log(
      `${(r.challenge_type + "/" + r.condition).padEnd(44)} ${String(r.n).padStart(2)} ${p(r.header_rate)} ${p(r.footer_rate)} ${p(r.mirror_rate)}   ${p(r.last_turn_retained_rate)}  ${extra}`
    );
  }
}

main();
