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
  "exp5-friction-convergence",
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
  return byId;
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
      challenge_type: config.challenge_type ?? "friction",
      created_at: new Date().toISOString(),
      task_template_id: task.id,
      seed: config.seed ?? null,
      friction: null
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
  if (condition === "vpp_friction") {
    const text = [
      "You are participating in Viable Prompt Protocol (VPP) — Exp5: Friction & Convergence.",
      headerSnippet,
      "Mirror user tags exactly and include the v1.4 footer each turn."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  if (condition === "baseline_friction") {
    const text = [
      "You are a precise assistant.",
      "Follow explicit structural constraints and be concise."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  if (condition === "mini_proto_friction") {
    const text = [
      "You obey a minimal competing protocol.",
      "Always respect requested section titles, keep the answer compact, and avoid protocol tags or footers."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  throw new Error(`Unsupported condition: ${condition}`);
}

function buildInitialUserTurn(condition, task) {
  const shared = [
    task.prompt,
    "Deliver the answer now and follow every structural and length constraint precisely."
  ].join("\n\n");

  if (condition === "vpp_friction") {
    const body = [
      "You are helping me evaluate structural convergence under the Viable Prompt Protocol.",
      "Mirror my tag on line 1 of every response and finish with `[Version=v1.4 | Tag=<tag> | Sources=… | Assumptions=… | Cycle=… | Locus=…]`.",
      shared
    ].join("\n\n");
    return { raw_header: "!<o>", tag: "o", modifiers: [], body };
  }

  return { raw_header: null, tag: null, modifiers: [], body: shared };
}

function formatUserMessage(turn) {
  if (turn.raw_header) {
    return `${turn.raw_header}\n${turn.body}`;
  }
  return turn.body;
}

function requiredSectionsForTask(taskId) {
  if (taskId === "t1-exp-protocol-llm") {
    return [
      "Goals",
      "Threat model & attack surfaces",
      "Task suite design",
      "Metrics & reporting"
    ];
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

function validateResponse(taskId, body) {
  const sections = requiredSectionsForTask(taskId);
  if (!body || sections.length === 0) {
    return { ok: true, missingSections: [], tooLong: false };
  }
  const lower = body.toLowerCase();
  const missing = [];
  for (const section of sections) {
    if (!includesSection(lower, section)) {
      missing.push(section);
    }
  }
  const words = body
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const tooLong = words > 750;
  return {
    ok: missing.length === 0 && !tooLong,
    missingSections: missing,
    tooLong
  };
}

function buildComplaintTurn(condition, violations) {
  const bullets = [];
  if (violations.missingSections?.length) {
    bullets.push(
      `Missing sections: ${violations.missingSections.join(", ")}`
    );
  }
  if (violations.tooLong) {
    bullets.push("The answer exceeded the requested length limits.");
  }
  if (bullets.length === 0) {
    bullets.push("Structure still not matching the explicit instructions.");
  }

  const body = [
    "You did not fully satisfy the requested structure.",
    "Missing or incorrect items:",
    ...bullets.map(item => `- ${item}`),
    "Please fix the answer so that it includes all required section titles exactly as requested and respects the length and bullet constraints.",
    "Don't change the underlying task; just correct the structure."
  ].join("\n\n");

  if (condition === "vpp_friction") {
    return { raw_header: "!<c>", tag: "c", modifiers: [], body };
  }

  return { raw_header: null, tag: null, modifiers: [], body };
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
  const initialTurn = buildInitialUserTurn(config.condition, task);
  const messages = [
    systemMessage,
    { role: "user", content: formatUserMessage(initialTurn) }
  ];

  session.turns.push({
    turn_index: 0,
    role: "user",
    raw_header: initialTurn.raw_header,
    tag: initialTurn.tag,
    modifiers: initialTurn.modifiers,
    body: initialTurn.body,
    footer: null,
    parsed_footer: null
  });

  let turnIndex = 1;
  let complaints = 0;
  let violationsCount = 0;
  let turnsToSuccess = null;
  let firstStructuralBreak = null;
  let previousUserTag = initialTurn.tag;

  while (turnIndex < config.max_turns) {
    const { assistantText } = await callModel(messages, config);
    const parsed = parseAssistantMessage(assistantText);
    const assistantTurn = {
      turn_index: turnIndex++,
      role: "assistant",
      raw_header: parsed.raw_header,
      tag: parsed.tag,
      modifiers: parsed.modifiers,
      body: parsed.body,
      footer: parsed.footer,
      parsed_footer: parsed.parsed_footer
    };
    session.turns.push(assistantTurn);
    messages.push({ role: "assistant", content: assistantText });

    if (config.condition === "vpp_friction") {
      const headerOk = Boolean(assistantTurn.raw_header && assistantTurn.tag);
      const footerOk = Boolean(
        assistantTurn?.parsed_footer?.version === "v1.4"
      );
      const tagOk = !previousUserTag || assistantTurn.tag === previousUserTag;
      if ((!headerOk || !footerOk || !tagOk) && firstStructuralBreak === null) {
        firstStructuralBreak = assistantTurn.turn_index;
      }
    }

    const validation = validateResponse(task.id, assistantTurn.body);
    if (validation.ok) {
      turnsToSuccess = assistantTurn.turn_index;
      break;
    }

    violationsCount += 1;
    if (turnIndex >= config.max_turns) {
      break;
    }

    const complaintTurn = buildComplaintTurn(config.condition, validation);
    complaints += 1;
    session.turns.push({
      turn_index: turnIndex++,
      role: "user",
      raw_header: complaintTurn.raw_header,
      tag: complaintTurn.tag,
      modifiers: complaintTurn.modifiers,
      body: complaintTurn.body,
      footer: null,
      parsed_footer: null
    });
    messages.push({
      role: "user",
      content: formatUserMessage(complaintTurn)
    });
    previousUserTag = complaintTurn.tag;
  }

  session.meta.friction = {
    turns_to_success: turnsToSuccess,
    complaints,
    violations_count: violationsCount,
    first_structural_break_turn: firstStructuralBreak
  };

  saveSession(session);
  return session;
}

async function main() {
  const headerSnippet = loadHeaderSnippet();
  const tasksById = loadTasks();
  const raw = fs.readFileSync(CONFIGS_PATH, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    console.error("No configs found for Exp5.");
    process.exit(1);
  }

  for (const line of lines) {
    const config = JSON.parse(line);
    const task = tasksById.get(config.task_id);
    if (!task) {
      console.error(`Unknown task ${config.task_id}`);
      continue;
    }
    const session = await runSession(config, task, headerSnippet);
    console.log("Exp5 session complete:", session.id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
