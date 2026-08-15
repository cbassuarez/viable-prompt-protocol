// Exp4 — Task Utility, ported to the shared runner. Single deliverable turn per
// task (max_turns=2). Compares vpp / baseline / mini-protocol on structured
// technical-writing tasks. Non-VPP conditions stored flat.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseAssistantMessage } from "../lib/parsing.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASKS_PATH = path.resolve(path.join(__dirname, "tasks.json"));
const HEADER_SNIPPET_PATH = path.resolve(path.join(__dirname, "../../docs/spec/v1.4/header-snippet.txt"));

const TASKS = new Map(JSON.parse(fs.readFileSync(TASKS_PATH, "utf8")).map((t) => [t.id, t]));
const loadHeaderSnippet = () => fs.readFileSync(HEADER_SNIPPET_PATH, "utf8").trimEnd();

function buildSystemMessage(config) {
  if (config.condition === "vpp_task_utility") {
    return {
      role: "system",
      content: [
        "You are participating in Viable Prompt Protocol (VPP) — Exp4: Task Utility.",
        loadHeaderSnippet(),
        "Respect the tags `<g>`, `<q>`, `<o>`, `<c>`, `<o_f>` and append the v1.4 footer format to each reply."
      ].join("\n\n")
    };
  }
  if (config.condition === "baseline_task_utility") {
    return {
      role: "system",
      content: [
        "You are a careful, technically literate assistant helping with structured technical writing tasks.",
        "Follow the user's formatting constraints precisely, keep answers concise, and stay on topic."
      ].join("\n\n")
    };
  }
  if (config.condition === "mini_proto_task_utility") {
    return {
      role: "system",
      content: [
        "You follow a minimal protocol competing with VPP.",
        "Always obey explicit structure or section requests, keep answers concise, prefer numbered sections when asked, and honor length constraints without adding protocol tags or footers."
      ].join("\n\n")
    };
  }
  throw new Error(`Unsupported condition: ${config.condition}`);
}

function nextUserTurn(config, session) {
  if (session.turns.some((t) => t.role === "user")) return null; // one task turn only
  const task = TASKS.get(config.task_id);
  if (!task) throw new Error(`Unknown task_id: ${config.task_id}`);
  if (config.condition === "vpp_task_utility") {
    const body = [
      "You are helping with a task-utility experiment under the Viable Prompt Protocol.",
      "Mirror my tag on line 1, keep the requested structure exactly, and end with a single `[Version=v1.4 | Tag=<tag> | Sources=… | Assumptions=… | Cycle=… | Locus=…]` footer line.",
      task.prompt
    ].join("\n\n");
    return { raw_header: "!<o>", tag: "o", modifiers: [], body };
  }
  return { raw_header: null, tag: null, modifiers: [], body: task.prompt };
}

function parseAssistant(text, config) {
  if (config.condition !== "vpp_task_utility") {
    return { raw_header: null, tag: null, modifiers: [], body: (text || "").trim(), footer: null, parsed_footer: null };
  }
  return parseAssistantMessage(text);
}

function metaOverrides(config) {
  return { challenge_type: config.challenge_type ?? "task_utility", task_template_id: config.task_id ?? null };
}

export default { buildSystemMessage, nextUserTurn, parseAssistant, metaOverrides };
