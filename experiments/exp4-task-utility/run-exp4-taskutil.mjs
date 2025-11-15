#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import OpenAI from "openai";

import { parseFirstLine } from "../../scripts/parse-first-line.mjs";

const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
  console.error("Missing OPENAI_API_KEY environment variable.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: openaiApiKey
});

const ROOT = path.resolve(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "../../")
);
const CORPUS_DIR = path.join(ROOT, "corpus", "v1.4");
const SESSIONS_DIR = path.join(CORPUS_DIR, "sessions");
const INDEX_PATH = path.join(CORPUS_DIR, "index.jsonl");
const CONFIGS_PATH = path.join(
  ROOT,
  "experiments",
  "exp4-task-utility",
  "configs.jsonl"
);
const TASKS_PATH = path.join(
  ROOT,
  "experiments",
  "exp4-task-utility",
  "tasks.json"
);
const HEADER_SNIPPET_PATH = path.join(
  ROOT,
  "docs",
  "spec",
  "v1.4",
  "header-snippet.txt"
);

fs.mkdirSync(SESSIONS_DIR, { recursive: true });

function loadHeaderSnippet() {
  const contents = fs.readFileSync(HEADER_SNIPPET_PATH, "utf8");
  return contents.trimEnd();
}

function loadTasks() {
  const raw = fs.readFileSync(TASKS_PATH, "utf8");
  const list = JSON.parse(raw);
  const byId = new Map();
  for (const task of list) {
    byId.set(task.id, task);
  }
  return { list, byId };
}

function parseFooter(footerLine) {
  if (!footerLine) return null;
  const trimmed = footerLine.trim();
  if (!trimmed) return null;
  try {
    if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
      throw new Error("footer-missing-brackets");
    }
    const inner = trimmed.slice(1, -1);
    const parts = inner.split("|").map(part => part.trim());
    const parsed = {};
    for (const part of parts) {
      const [keyRaw, ...rest] = part.split("=");
      if (!keyRaw || rest.length === 0) continue;
      const key = keyRaw.toLowerCase();
      const value = rest.join("=").trim();
      switch (key) {
        case "version":
          parsed.version = value;
          break;
        case "tag":
          parsed.tag_id = value;
          break;
        case "sources":
          parsed.sources = value;
          break;
        case "assumptions": {
          const n = Number.parseInt(value, 10);
          parsed.assumptions = Number.isNaN(n) ? null : n;
          break;
        }
        case "cycle": {
          const [cycleCurrent, cycleMax] = value
            .split("/")
            .map(v => v && v.trim());
          const cycle = Number.parseInt(cycleCurrent, 10);
          const cycleMaxNum = Number.parseInt(cycleMax, 10);
          parsed.cycle = Number.isNaN(cycle) ? null : cycle;
          parsed.cycle_max = Number.isNaN(cycleMaxNum)
            ? null
            : cycleMaxNum;
          break;
        }
        case "locus":
          parsed.locus = value;
          break;
        default: {
          if (!parsed.extras) parsed.extras = {};
          parsed.extras[key] = value;
        }
      }
    }
    parsed.raw = footerLine;
    return parsed;
  } catch (err) {
    console.warn("Failed to parse footer:", footerLine, err);
    return { raw: footerLine };
  }
}

function parseAssistantMessage(text) {
  const sourceText = typeof text === "string" ? text : "";
  const lines = sourceText.split(/\r?\n/).map(line => line.trim());
  while (lines.length && lines[0] === "") lines.shift();
  while (lines.length && lines[lines.length - 1] === "") lines.pop();

  if (lines.length < 2) {
    return {
      raw_header: null,
      tag: null,
      modifiers: [],
      body: sourceText.trim(),
      footer: null,
      parsed_footer: null
    };
  }

  const raw_header = lines[0];
  const footer = lines[lines.length - 1];
  const bodyLines = lines.slice(1, -1);
  const body = bodyLines.join("\n").trim();

  let tag = null;
  let modifiers = [];
  if (raw_header) {
    const parsed = parseFirstLine(raw_header);
    if (parsed && typeof parsed.tag === "string") {
      tag = parsed.tag;
    }
    if (parsed) {
      if (Array.isArray(parsed.mods)) {
        modifiers = parsed.mods;
      } else if (Array.isArray(parsed.modifiers)) {
        modifiers = parsed.modifiers;
      }
    }

    if (!tag) {
      const m = raw_header.match(/^<([a-z_]+)>$/i);
      if (m) {
        tag = m[1];
      }
    }
  }

  if (!Array.isArray(modifiers)) {
    modifiers = [];
  } else {
    modifiers = modifiers.filter(
      mod => typeof mod === "string" && mod.length > 0
    );
  }

  return {
    raw_header,
    tag,
    modifiers,
    body,
    footer,
    parsed_footer: parseFooter(footer)
  };
}

function ensureUniqueSessionId(baseId) {
  let candidate = baseId;
  let counter = 1;
  while (fs.existsSync(path.join(SESSIONS_DIR, `${candidate}.json`))) {
    const suffix = String(counter).padStart(3, "0");
    candidate = `${baseId}-${suffix}`;
    counter += 1;
  }
  return candidate;
}

function createEmptySession(config, task) {
  const uniqueId = ensureUniqueSessionId(config.id);
  return {
    id: uniqueId,
    protocol_version: config.protocol_version,
    meta: {
      model: config.model,
      provider: "openai",
      condition: config.condition,
      challenge_type: config.challenge_type ?? "task_utility",
      created_at: new Date().toISOString(),
      task_template_id: task.id,
      task_family: task.family ?? null,
      task_title: task.title ?? null,
      seed: config.seed ?? null
    },
    label: "good",
    failure_modes: [],
    turns: []
  };
}

function appendToCorpusIndex(session) {
  const entry = {
    id: session.id,
    model: session.meta.model,
    provider: session.meta.provider,
    condition: session.meta.condition,
    challenge_type: session.meta.challenge_type,
    created_at: session.meta.created_at,
    task_template_id: session.meta.task_template_id
  };
  fs.appendFileSync(INDEX_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

function saveSession(session) {
  const sessionPath = path.join(SESSIONS_DIR, `${session.id}.json`);
  fs.writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
  appendToCorpusIndex(session);
}

function buildSystemMessage(condition, headerSnippet) {
  if (condition === "vpp_task_utility") {
    const text = [
      "You are participating in Viable Prompt Protocol (VPP) — Exp4: Task Utility.",
      headerSnippet,
      "Respect the tags `<g>`, `<q>`, `<o>`, `<c>`, `<o_f>` and append the v1.4 footer format to each reply."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  if (condition === "baseline_task_utility") {
    const text = [
      "You are a careful, technically literate assistant helping with structured technical writing tasks.",
      "Follow the user's formatting constraints precisely, keep answers concise, and stay on topic."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  if (condition === "mini_proto_task_utility") {
    const text = [
      "You follow a minimal protocol competing with VPP.",
      "Always obey explicit structure or section requests, keep answers concise, prefer numbered sections when asked, and honor length constraints without adding protocol tags or footers."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  throw new Error(`Unsupported condition: ${condition}`);
}

function buildInitialUserTurn(condition, task) {
  const baseBody = task.prompt;
  if (condition === "vpp_task_utility") {
    const body = [
      "You are helping with a task-utility experiment under the Viable Prompt Protocol.",
      "Mirror my tag on line 1, keep the requested structure exactly, and end with a single `[Version=v1.4 | Tag=<tag> | Sources=… | Assumptions=… | Cycle=… | Locus=…]` footer line.",
      baseBody
    ].join("\n\n");
    return {
      raw_header: "!<o>",
      tag: "o",
      modifiers: [],
      body
    };
  }

  return {
    raw_header: null,
    tag: null,
    modifiers: [],
    body: baseBody
  };
}

function formatUserMessage(turn) {
  if (turn.raw_header) {
    return `${turn.raw_header}\n${turn.body}`;
  }
  return turn.body;
}

async function callModel(messages, config) {
  const completion = await openai.chat.completions.create({
    model: config.model,
    messages,
    temperature: config.temperature ?? 0.2,
    top_p: config.top_p ?? 1.0
  });

  const assistantText = completion.choices?.[0]?.message?.content ?? "";
  return { response: completion, assistantText };
}

async function runSession(config, task, headerSnippet) {
  const session = createEmptySession(config, task);
  const systemMessage = buildSystemMessage(config.condition, headerSnippet);
  const initialUser = buildInitialUserTurn(config.condition, task);

  const messages = [
    systemMessage,
    {
      role: "user",
      content: formatUserMessage(initialUser)
    }
  ];

  session.turns.push({
    turn_index: 0,
    role: "user",
    raw_header: initialUser.raw_header,
    tag: initialUser.tag,
    modifiers: initialUser.modifiers,
    body: initialUser.body,
    footer: null,
    parsed_footer: null
  });

  let turnIndex = 1;

  const { assistantText } = await callModel(messages, config);
  const parsed = parseAssistantMessage(assistantText);
  session.turns.push({
    turn_index: turnIndex++,
    role: "assistant",
    raw_header: parsed.raw_header,
    tag: parsed.tag,
    modifiers: parsed.modifiers,
    body: parsed.body,
    footer: parsed.footer,
    parsed_footer: parsed.parsed_footer
  });
  messages.push({ role: "assistant", content: assistantText });

  saveSession(session);
  return session;
}

async function main() {
  const headerSnippet = loadHeaderSnippet();
  const { byId: tasksById } = loadTasks();
  const raw = fs.readFileSync(CONFIGS_PATH, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    console.error("No configs found for Exp4.");
    process.exit(1);
  }

  for (const line of lines) {
    const config = JSON.parse(line);
    const task = tasksById.get(config.task_id);
    if (!task) {
      console.error(`Unknown task_id ${config.task_id} in config ${config.id}`);
      continue;
    }
    const session = await runSession(config, task, headerSnippet);
    console.log("Exp4 session complete:", session.id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
