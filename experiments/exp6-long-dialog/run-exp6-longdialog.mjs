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
  "exp6-long-dialog",
  "configs.jsonl"
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

function createEmptySession(config) {
  const uniqueId = ensureUniqueSessionId(config.id);
  return {
    id: uniqueId,
    protocol_version: config.protocol_version,
    meta: {
      model: config.model,
      provider: "openai",
      condition: config.condition,
      challenge_type: config.challenge_type ?? "long_dialog",
      created_at: new Date().toISOString(),
      long_dialog_script_id: "ld-01",
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
    long_dialog_script_id: session.meta.long_dialog_script_id
  };
  fs.appendFileSync(INDEX_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

function saveSession(session) {
  const sessionPath = path.join(SESSIONS_DIR, `${session.id}.json`);
  fs.writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
  appendToCorpusIndex(session);
}

function buildSystemMessage(condition, headerSnippet) {
  if (condition === "vpp_longdialog_grounded" || condition === "vpp_longdialog_tags_only") {
    const text = [
      "You are participating in Viable Prompt Protocol (VPP) — Exp6: Long Dialog Retention.",
      headerSnippet,
      "Mirror the user's tag on line 1 and include the v1.4 footer each turn."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  if (condition === "baseline_longdialog_tags") {
    const text = [
      "You are a cooperative assistant.",
      "The user may label their turns with markers like !<q> or !<o>; treat them as hints but no special formatting is required."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  throw new Error(`Unsupported condition: ${condition}`);
}

function longDialogUserScript(condition) {
  const sharedPrompts = {
    goals: [
      "We are mapping a multi-stage workflow for evaluating an IDE-integrated LLM assistant.",
      "List three crisp experiment goals we should prioritize next."
    ].join("\n\n"),
    protocolDraft: [
      "Draft a structured protocol covering setup, scenarios, guardrails, and metrics.",
      "Keep it concise and clearly labeled."
    ].join("\n\n"),
    styleShift: [
      "Now restate the protocol as bullet points aimed at senior engineers with limited time.",
      "Keep technical fidelity; do not introduce marketing fluff."
    ].join("\n\n"),
    finalOutput: [
      "Provide a final concise handoff that includes Goals, Threat model, Task suite, and Metrics sections in that order.",
      "This is the closing deliverable."
    ].join("\n\n")
  };

  const groundingBody = (() => {
    if (condition === "vpp_longdialog_grounded") {
      return [
        "We will follow the Viable Prompt Protocol with minimal reminders.",
        "Confirm you understand the tags (`<g>`, `<q>`, `<o>`, `<c>`, `<o_f>`), mirroring, and footer requirements before proceeding.",
        "We will iterate through grounding, exploration, constraint changes, and a final write-up.",
        "Do not solve the whole task in this turn; acknowledge and ask any clarifying questions."
      ].join("\n\n");
    }
    if (condition === "vpp_longdialog_tags_only") {
      return [
        "Assume the Viable Prompt Protocol header already primed you.",
        "We will simply start using the tags without further ceremony.",
        "Acknowledge readiness briefly."
      ].join("\n\n");
    }
    return [
      "I will label my turns with markers like !<g> or !<o> just for bookkeeping.",
      "Treat them as plain text and proceed normally.",
      "Let me know if anything is unclear."
    ].join("\n\n");
  })();

  return [
    { tag: "g", body: groundingBody },
    { tag: "q", body: sharedPrompts.goals },
    { tag: "o", body: sharedPrompts.protocolDraft },
    { tag: "c", body: sharedPrompts.styleShift },
    { tag: "o_f", body: sharedPrompts.finalOutput }
  ];
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

async function runSession(config, headerSnippet) {
  const session = createEmptySession(config);
  const systemMessage = buildSystemMessage(config.condition, headerSnippet);
  const script = longDialogUserScript(config.condition);

  const messages = [systemMessage];
  let turnIndex = 0;

  for (const userStep of script) {
    if (turnIndex >= config.max_turns) break;
    const rawHeader = `!<${userStep.tag}>`;
    const turn = {
      turn_index: turnIndex++,
      role: "user",
      raw_header: rawHeader,
      tag: userStep.tag,
      modifiers: [],
      body: userStep.body,
      footer: null,
      parsed_footer: null
    };
    session.turns.push(turn);
    messages.push({ role: "user", content: formatUserMessage(turn) });

    if (turnIndex >= config.max_turns) break;
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
  }

  saveSession(session);
  return session;
}

async function main() {
  const headerSnippet = loadHeaderSnippet();
  const raw = fs.readFileSync(CONFIGS_PATH, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    console.error("No configs found for Exp6.");
    process.exit(1);
  }

  for (const line of lines) {
    const config = JSON.parse(line);
    const session = await runSession(config, headerSnippet);
    console.log("Exp6 session complete:", session.id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
