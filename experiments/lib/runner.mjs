// Generic VPP experiment runner.
//
// Each experiment supplies a small script module (default export) with:
//   buildSystemMessage(config) -> { role: "system", content } | null
//   nextUserTurn(config, session) -> { raw_header, tag, modifiers, body } | null
// The runner owns everything else: provider calls, parsing, session assembly,
// persistence. An experiment is now a script.mjs + configs.jsonl, not a
// 500-line copy of the loop.
//
// CLI:
//   node experiments/lib/runner.mjs --exp <dir> [--dry-run] [--version v1.4]
//                                   [--out <sessionsDir>] [--limit N]
//
// As a library:
//   import { runExperiment } from "../lib/runner.mjs";
//   await runExperiment({ expDir, dryRun, version, sessionsDir, limit });

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { parseAssistantMessage } from "./parsing.mjs";
import { getChat, costForUsage } from "./providers.mjs";
import { createSession, pushTurn, saveSession } from "./session.mjs";

// Sentinel thrown when the cumulative spend would exceed the configured cap, so
// the run stops launching new model calls. Caught in runExperiment.
class BudgetExceeded extends Error {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(path.join(__dirname, "../../"));

function formatUserMessage(turn) {
  if (turn.raw_header && typeof turn.raw_header === "string" && turn.raw_header.length > 0) {
    return `${turn.raw_header}\n${turn.body}`;
  }
  return turn.body;
}

function loadConfigs(configsPath) {
  const raw = fs.readFileSync(configsPath, "utf8");
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

async function runSession(config, { script, chatFor, sessionsDir, budget }) {
  const session = createSession(config, { metaOverrides: script.metaOverrides?.(config) });
  const messages = [];
  // Experiments may parse assistant replies in a condition-aware way (e.g. store
  // baseline/non-VPP replies as flat text so prose isn't mis-scored as headers/
  // footers). Default to the shared structural parser.
  const parseAssistant = script.parseAssistant ?? ((text) => parseAssistantMessage(text));

  const sysMsg = script.buildSystemMessage?.(config);
  if (sysMsg) messages.push(sysMsg);

  const chat = await chatFor(config.provider ?? "openai");
  const maxTurns = config.max_turns ?? Infinity;

  while (session.turns.length < maxTurns) {
    const nextUser = script.nextUserTurn(config, session);
    if (!nextUser) break;

    // Budget guard: refuse to start another model call once the cap is reached.
    // The partial session built so far is still saved by the caller.
    if (budget.capUsd != null && budget.spentUsd >= budget.capUsd) {
      throw new BudgetExceeded(`budget cap $${budget.capUsd} reached (spent ~$${budget.spentUsd.toFixed(4)})`);
    }

    pushTurn(session, { role: "user", ...nextUser });
    messages.push({ role: "user", content: formatUserMessage(nextUser) });

    const { text, usage } = await chat({
      model: config.model,
      messages,
      temperature: config.temperature,
      top_p: config.top_p,
      seed: config.seed
    });
    budget.spentUsd += costForUsage(config.model, usage);

    const parsed = parseAssistant(text, config);
    pushTurn(session, { role: "assistant", ...parsed });
    messages.push({ role: "assistant", content: text });
  }

  const savedPath = saveSession(session, sessionsDir);
  return { session, savedPath };
}

export async function runExperiment({ expDir, dryRun = false, version = "v1.4", sessionsDir, limit, maxUsd = null, budget }) {
  const scriptPath = path.join(expDir, "script.mjs");
  const configsPath = path.join(expDir, "configs.jsonl");

  let script;
  try {
    script = (await import(pathToFileURL(scriptPath).href)).default;
  } catch (err) {
    // Un-ported experiment (no script.mjs yet) or a broken module: skip, don't
    // crash the whole suite.
    console.error(`[runner] SKIP ${path.basename(expDir)}: ${err.message}`);
    return { results: [], budget: budget ?? { spentUsd: 0, capUsd: maxUsd }, stopped: false, skipped: true };
  }

  let configs = loadConfigs(configsPath);
  if (limit != null) configs = configs.slice(0, limit);

  const outDir =
    sessionsDir ??
    (dryRun
      ? path.join(ROOT, ".scratch", "dryrun", version, "sessions")
      : path.join(ROOT, "corpus", version, "sessions"));

  // Cache one chat() per provider so we don't reconstruct SDK clients per config.
  const chatCache = new Map();
  const chatFor = async (provider) => {
    if (!chatCache.has(provider)) chatCache.set(provider, await getChat(provider, { dryRun }));
    return chatCache.get(provider);
  };

  // Shared budget across configs (and across experiments if the caller passes one in).
  budget = budget ?? { spentUsd: 0, capUsd: maxUsd };

  console.log(
    `[runner] exp=${path.basename(expDir)} configs=${configs.length} dryRun=${dryRun} cap=${budget.capUsd != null ? "$" + budget.capUsd : "none"} out=${path.relative(ROOT, outDir)}`
  );

  const results = [];
  let stopped = false;
  for (const config of configs) {
    try {
      const { session, savedPath } = await runSession(config, { script, chatFor, sessionsDir: outDir, budget });
      console.log(
        `[runner] ok ${session.id} (${session.turns.length} turns) ~$${budget.spentUsd.toFixed(4)} -> ${path.relative(ROOT, savedPath)}`
      );
      results.push(session);
    } catch (err) {
      if (err instanceof BudgetExceeded) {
        console.error(`[runner] STOP: ${err.message}. Ran ${results.length}/${configs.length} configs.`);
        stopped = true;
        break;
      }
      console.error(`[runner] FAILED config ${config.id}: ${err.message}`);
    }
  }
  console.log(`[runner] done exp=${path.basename(expDir)} sessions=${results.length} spent~$${budget.spentUsd.toFixed(4)}${stopped ? " (budget-stopped)" : ""}`);
  return { results, budget, stopped };
}

function parseArgs(argv) {
  const args = { dryRun: false, version: "v1.4", expDir: null, sessionsDir: null, limit: null, maxUsd: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--exp") args.expDir = argv[++i];
    else if (a === "--version") args.version = argv[++i];
    else if (a === "--out") args.sessionsDir = argv[++i];
    else if (a === "--limit") args.limit = Number.parseInt(argv[++i], 10);
    else if (a === "--max-usd") args.maxUsd = Number.parseFloat(argv[++i]);
  }
  return args;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.expDir) {
    console.error("Usage: node experiments/lib/runner.mjs --exp <dir> [--dry-run] [--version v1.4] [--out <dir>] [--limit N] [--max-usd D]");
    process.exit(1);
  }
  const expDir = path.resolve(args.expDir);
  runExperiment({
    expDir,
    dryRun: args.dryRun,
    version: args.version,
    sessionsDir: args.sessionsDir,
    limit: args.limit,
    maxUsd: args.maxUsd
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
