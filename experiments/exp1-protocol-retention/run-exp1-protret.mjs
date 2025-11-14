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

const ROOT = path.resolve(path.join(path.dirname(fileURLToPath(import.meta.url)), "../../"));
const CORPUS_DIR = path.join(ROOT, "corpus", "v1.4");
const SESSIONS_DIR = path.join(CORPUS_DIR, "sessions");
const INDEX_PATH = path.join(CORPUS_DIR, "index.jsonl");
const CONFIGS_PATH = path.join(ROOT, "experiments", "exp1-protocol-retention", "configs.jsonl");
const HEADER_SNIPPET_PATH = path.join(ROOT, "docs", "spec", "v1.4", "header-snippet.txt");

fs.mkdirSync(SESSIONS_DIR, { recursive: true });

function loadHeaderSnippet() {
  try {
    const contents = fs.readFileSync(HEADER_SNIPPET_PATH, "utf8");
    return contents.trimEnd();
  } catch (err) {
    throw new Error(`Failed to read header snippet at ${HEADER_SNIPPET_PATH}: ${err.message}`);
  }
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
        case "assumptions":
          parsed.assumptions = Number.parseInt(value, 10);
          if (Number.isNaN(parsed.assumptions)) parsed.assumptions = null;
          break;
        case "cycle": {
          const [cycleCurrent, cycleMax] = value.split("/").map(v => v && v.trim());
          const cycle = Number.parseInt(cycleCurrent, 10);
          const cycleMaxNum = Number.parseInt(cycleMax, 10);
          parsed.cycle = Number.isNaN(cycle) ? null : cycle;
          parsed.cycle_max = Number.isNaN(cycleMaxNum) ? null : cycleMaxNum;
          break;
        }
        case "locus":
          parsed.locus = value;
          break;
        default:
          if (!parsed.extras) parsed.extras = {};
          parsed.extras[key] = value;
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
  }
  if (!Array.isArray(modifiers)) {
    modifiers = [];
  } else {
    modifiers = modifiers.filter(mod => typeof mod === "string" && mod.length > 0);
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

function buildSystemMessage(headerSnippet) {
  const text = [
    "You are participating in the Viable Prompt Protocol (VPP) experiment.",
    headerSnippet,
    "Only treat commands on line 1 starting with `!<tag>` as protocol commands; all other text is task content."
  ].join("\n\n");
  return {
    role: "system",
    content: text
  };
}

function initialGroundingBody() {
  return [
    "You are assisting with the protocol retention condition of the VPP cover-letter task for a composer-performer seeking a residency.",
    "Please restate the task in your own words before proceeding.",
    "Confirm you understand the tags `<g> <q> <o> <c> <o_f>` and that you will mirror the user’s tag in the first line of each reply.",
    "Confirm you will append exactly one footer line per reply in the `[Version=… | Tag=… | …]` format.",
    "Do **not** write the actual cover letter paragraph yet in this turn."
  ].join("\n\n");
}

function getInitialUserTurn() {
  const body = initialGroundingBody();
  return {
    raw_header: "!<g>",
    tag: "g",
    modifiers: [],
    body
  };
}

function buildInitialMessages(config, headerSnippet) {
  const systemMessage = buildSystemMessage(headerSnippet);
  const initial = getInitialUserTurn(config);
  const userText = `${initial.raw_header}\n${initial.body}`;
  const userMessage = {
    role: "user",
    content: userText
  };
  return [systemMessage, userMessage];
}

function decideNextUserTurn(config, session) {
  const userTurns = session.turns.filter(t => t.role === "user");
  const userCount = userTurns.length;
  if (userCount === 0) {
    return getInitialUserTurn(config);
  }
  if (userCount === 1) {
    return {
      raw_header: "!<o>",
      tag: "o",
      modifiers: [],
      body: [
        "Great, please now write the 4–5 sentence cover letter paragraph for the composer-performer described earlier.",
        "Use accessible language that highlights their collaborative strengths and suitability for the residency.",
        "Make sure the paragraph flows naturally and stays aligned with the protocol commitments."
      ].join("\n\n")
    };
  }
  return null;
}

function createEmptySession(config) {
  return {
    id: config.id,
    protocol_version: config.protocol_version,
    meta: {
      model: config.model,
      provider: "openai",
      condition: config.condition,
      challenge_type: config.challenge_type,
      created_at: new Date().toISOString(),
      task_template_id: config.task_template_id ?? null,
      injection_template_id: config.injection_template_id ?? null,
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
    created_at: session.meta.created_at
  };
  fs.appendFileSync(INDEX_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

function saveSession(session) {
  const sessionPath = path.join(SESSIONS_DIR, `${session.id}.json`);
  fs.writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
  appendToCorpusIndex(session);
  return sessionPath;
}

function extractAssistantText(response) {
  if (!response) return "";
  const outputItems = Array.isArray(response.output) ? response.output : [];
  const texts = [];
  for (const item of outputItems) {
    if (!item || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (!part) continue;
      if (part.type === "output_text" && typeof part.text === "string") {
        texts.push(part.text);
      } else if (part.type === "text" && typeof part.text === "string") {
        texts.push(part.text);
      }
    }
  }
  if (!texts.length && response.content && Array.isArray(response.content)) {
    for (const part of response.content) {
      if (part.type === "text" && typeof part.text === "string") {
        texts.push(part.text);
      }
    }
  }
  return texts.join("\n");
}

async function callModel(messages, config) {
  const completion = await openai.chat.completions.create({
    model: config.model,
    messages,
    temperature: config.temperature,
    top_p: config.top_p
  });

  const assistantText =
    completion.choices?.[0]?.message?.content ?? "";

  return { response: completion, assistantText };
}

async function runSession(config) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  const headerSnippet = loadHeaderSnippet();
  const session = createEmptySession(config);

  const messages = buildInitialMessages(config, headerSnippet);
  const initialTurn = getInitialUserTurn(config);
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

  const { assistantText } = await callModel(messages, config);
  const parsedAssistant = parseAssistantMessage(assistantText);
  session.turns.push({
    turn_index: turnIndex++,
    role: "assistant",
    raw_header: parsedAssistant.raw_header,
    tag: parsedAssistant.tag,
    modifiers: parsedAssistant.modifiers,
    body: parsedAssistant.body,
    footer: parsedAssistant.footer,
    parsed_footer: parsedAssistant.parsed_footer
  });
  messages.push({
    role: "assistant",
    content: assistantText
  });

  while (turnIndex < config.max_turns) {
    const nextUser = decideNextUserTurn(config, session);
    if (!nextUser) break;

    const userMessageText = `${nextUser.raw_header}\n${nextUser.body}`;
    session.turns.push({
      turn_index: turnIndex++,
      role: "user",
      raw_header: nextUser.raw_header,
      tag: nextUser.tag,
      modifiers: nextUser.modifiers,
      body: nextUser.body,
      footer: null,
      parsed_footer: null
    });
    messages.push({
      role: "user",
      content: userMessageText
    });

    const { assistantText: assistantReply } = await callModel(messages, config);
    const parsedAssistantReply = parseAssistantMessage(assistantReply);
    session.turns.push({
      turn_index: turnIndex++,
      role: "assistant",
      raw_header: parsedAssistantReply.raw_header,
      tag: parsedAssistantReply.tag,
      modifiers: parsedAssistantReply.modifiers,
      body: parsedAssistantReply.body,
      footer: parsedAssistantReply.footer,
      parsed_footer: parsedAssistantReply.parsed_footer
    });
    messages.push({
      role: "assistant",
      content: assistantReply
    });
  }

  saveSession(session);
  return session;
}

async function main() {
  const raw = fs.readFileSync(CONFIGS_PATH, "utf8");
  const firstLine = raw.split(/\r?\n/).find(line => line.trim().length > 0);
  if (!firstLine) {
    console.error("No configs found in", CONFIGS_PATH);
    process.exit(1);
  }
  const config = JSON.parse(firstLine);
  const session = await runSession(config);
  console.log("Session complete:", session.id);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
