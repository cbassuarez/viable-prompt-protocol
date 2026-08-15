// Exp5 — Friction & Convergence, ported to the shared runner. The next user turn
// is validator-driven: after each assistant reply we check the task's required
// structure; if it's missing we send a "complaint" turn and let the model retry,
// up to max_turns. Convergence/turns-to-success are recomputed by the scorer
// (the original stashed them in meta.friction, which the schema forbids).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseAssistantMessage } from "../lib/parsing.mjs";
import { validateResponse } from "../lib/scorers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Tasks live with exp4 (exp5 reuses them).
const TASKS_PATH = path.resolve(path.join(__dirname, "../exp4-task-utility/tasks.json"));
const HEADER_SNIPPET_PATH = path.resolve(path.join(__dirname, "../../docs/spec/v1.4/header-snippet.txt"));

const TASKS = new Map(JSON.parse(fs.readFileSync(TASKS_PATH, "utf8")).map((t) => [t.id, t]));
const loadHeaderSnippet = () => fs.readFileSync(HEADER_SNIPPET_PATH, "utf8").trimEnd();

function buildSystemMessage(config) {
  if (config.condition === "vpp_friction") {
    return {
      role: "system",
      content: [
        "You are participating in Viable Prompt Protocol (VPP) — Exp5: Friction & Convergence.",
        loadHeaderSnippet(),
        "Mirror user tags exactly and include the v1.4 footer each turn."
      ].join("\n\n")
    };
  }
  if (config.condition === "baseline_friction") {
    return { role: "system", content: ["You are a precise assistant.", "Follow explicit structural constraints and be concise."].join("\n\n") };
  }
  if (config.condition === "mini_proto_friction") {
    return {
      role: "system",
      content: ["You obey a minimal competing protocol.", "Always respect requested section titles, keep the answer compact, and avoid protocol tags or footers."].join("\n\n")
    };
  }
  throw new Error(`Unsupported condition: ${config.condition}`);
}

function initialTurn(config) {
  const task = TASKS.get(config.task_id);
  if (!task) throw new Error(`Unknown task_id: ${config.task_id}`);
  const shared = [task.prompt, "Deliver the answer now and follow every structural and length constraint precisely."].join("\n\n");
  if (config.condition === "vpp_friction") {
    const body = [
      "You are helping me evaluate structural convergence under the Viable Prompt Protocol.",
      "Mirror my tag on line 1 of every response and finish with `[Version=v1.4 | Tag=<tag> | Sources=… | Assumptions=… | Cycle=… | Locus=…]`.",
      shared
    ].join("\n\n");
    return { raw_header: "!<o>", tag: "o", modifiers: [], body };
  }
  return { raw_header: null, tag: null, modifiers: [], body: shared };
}

function complaintTurn(config, validation) {
  const bullets = [];
  if (validation.missingSections?.length) bullets.push(`Missing sections: ${validation.missingSections.join(", ")}`);
  if (validation.tooLong) bullets.push("The answer exceeded the requested length limits.");
  if (bullets.length === 0) bullets.push("Structure still not matching the explicit instructions.");
  const body = [
    "You did not fully satisfy the requested structure.",
    "Missing or incorrect items:",
    ...bullets.map((b) => `- ${b}`),
    "Please fix the answer so that it includes all required section titles exactly as requested and respects the length and bullet constraints.",
    "Don't change the underlying task; just correct the structure."
  ].join("\n\n");
  if (config.condition === "vpp_friction") return { raw_header: "!<c>", tag: "c", modifiers: [], body };
  return { raw_header: null, tag: null, modifiers: [], body };
}

function nextUserTurn(config, session) {
  const assistantTurns = session.turns.filter((t) => t.role === "assistant");
  if (assistantTurns.length === 0) return initialTurn(config);

  // Inspect the latest assistant reply; stop if it satisfies the task validator.
  const last = assistantTurns[assistantTurns.length - 1];
  const validation = validateResponse(config.task_id, last.body);
  if (validation.ok) return null;
  return complaintTurn(config, validation);
}

function parseAssistant(text, config) {
  if (config.condition !== "vpp_friction") {
    return { raw_header: null, tag: null, modifiers: [], body: (text || "").trim(), footer: null, parsed_footer: null };
  }
  return parseAssistantMessage(text);
}

function metaOverrides(config) {
  return { challenge_type: config.challenge_type ?? "friction", task_template_id: config.task_id ?? null };
}

export default { buildSystemMessage, nextUserTurn, parseAssistant, metaOverrides };
