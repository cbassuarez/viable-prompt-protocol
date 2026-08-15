#!/usr/bin/env node
// Run a suite of experiments under ONE shared USD budget, stopping the moment
// the cap would be exceeded. New runs are written to corpus/v1.5 by default so
// the frozen v1.4 corpus is untouched.
//
// Requires OPENAI_API_KEY. Recommended invocation (key from a gitignored .env):
//   node --env-file=.env scripts/run-openai-suite.mjs --max-usd 1.00
//
// Options:
//   --max-usd D         hard cap on estimated spend (default 0.50)
//   --version vX        corpus version dir to write to (default v1.5)
//   --limit-per-exp N   cap configs per experiment (spreads budget across exps)
//   --exps a,b,c        comma list of experiment dir names (default: all)
//   --dry-run           use the mock provider (no spend), for a final shape check
//
// The estimate is conservative (see PRICES in providers.mjs); your OpenAI invoice
// is authoritative, and prepaid credit is itself a hard ceiling (calls 429 with
// no charge once exhausted).

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runExperiment } from "../experiments/lib/runner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(path.join(__dirname, ".."));

// The four experiments ported to the shared runner so far, cheapest/highest-count
// first. exp4/5/6 are not yet ported (no script.mjs) and are skipped if requested.
const DEFAULT_EXPS = [
  "exp1b-user-only-protocol",
  "exp1-protocol-retention",
  "exp2-prompt-injection",
  "exp3-task-injection"
];

function parseArgs(argv) {
  const args = { maxUsd: 0.5, version: "v1.5", limitPerExp: null, exps: DEFAULT_EXPS, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--max-usd") args.maxUsd = Number.parseFloat(argv[++i]);
    else if (a === "--version") args.version = argv[++i];
    else if (a === "--limit-per-exp") args.limitPerExp = Number.parseInt(argv[++i], 10);
    else if (a === "--exps") args.exps = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
    else if (a === "--dry-run") args.dryRun = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.dryRun && !process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY. Put it in a gitignored .env and run:");
    console.error("  node --env-file=.env scripts/run-openai-suite.mjs --max-usd 1.00");
    process.exit(1);
  }

  // One budget object threaded through every experiment.
  const budget = { spentUsd: 0, capUsd: args.maxUsd };
  console.log(`[suite] cap=$${args.maxUsd} version=${args.version} dryRun=${args.dryRun} exps=${args.exps.join(",")}`);

  const summary = [];
  for (const exp of args.exps) {
    const expDir = path.join(ROOT, "experiments", exp);
    const { results, stopped } = await runExperiment({
      expDir,
      dryRun: args.dryRun,
      version: args.version,
      limit: args.limitPerExp,
      budget
    });
    summary.push({ exp, sessions: results.length });
    if (stopped) {
      console.log("[suite] budget cap reached; not starting further experiments.");
      break;
    }
  }

  console.log("\n[suite] summary:");
  for (const s of summary) console.log(`  ${s.exp}: ${s.sessions} sessions`);
  console.log(`[suite] total spent ~$${budget.spentUsd.toFixed(4)} of $${args.maxUsd} cap`);
  console.log(`[suite] next: node scripts/build-index.mjs --version ${args.version} && node scripts/validate-corpus.mjs --version ${args.version}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
