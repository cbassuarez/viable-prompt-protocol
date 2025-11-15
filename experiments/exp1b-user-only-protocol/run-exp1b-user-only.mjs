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
const CONFIGS_PATH = path.join(ROOT, "experiments", "exp1b-user-only-protocol", "configs.jsonl");

fs.mkdirSync(SESSIONS_DIR, { recursive: true });

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
  const lines = sourceText.split(/\r?\n/);

  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

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

function buildSystemMessage(config) {
  if (config.condition === "user_only_vpp_explicit") {
    const text = [
      "You are a helpful assistant.",
      "Follow the user's instructions carefully and respond clearly and concisely."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  if (config.condition === "user_only_vpp_ambient_nobrowse") {
    const text = [
      "You are a helpful assistant.",
      "Respond to the user's messages as best you can."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  if (config.condition === "user_only_vpp_ambient_browse") {
    const text = [
      "You are a helpful assistant.",
      "Respond to the user's messages as best you can.",
      "If you encounter unfamiliar syntax such as leading command tags (e.g. `!<q>`), you may actively try to interpret or research their meaning and adapt your replies accordingly."
    ].join("\n\n");
    return { role: "system", content: text };
  }

  throw new Error(`Unsupported condition: ${config.condition}`);
}

function getInitialUserTurn(config) {
  if (config.condition === "user_only_vpp_explicit") {
    const body = [
      "I’m using a tag+footer protocol in this chat:",
      "",
      "- I’ll start line 1 with `!<tag>` where `<tag>` is one of: `<g> <q> <o> <c> <o_f>`.",
      "- You must mirror my tag on the first line of every reply, like `<q>` or `<o>`.",
      "- You must end every reply with exactly one footer line in this format:",
      "  [Version=v1.4 | Tag=<tag_n> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<locus>]",
      "",
      "In this turn, just restate those rules and confirm you will follow them. Do not write any content besides the header, body, and footer."
    ].join("\n");
    return {
      raw_header: "!<g>",
      tag: "g",
      modifiers: [],
      body
    };
  }

  if (config.condition === "user_only_vpp_ambient_nobrowse") {
    return {
      raw_header: "!<q>",
      tag: "q",
      modifiers: [],
      body: "test"
    };
  }

  if (config.condition === "user_only_vpp_ambient_browse") {
    return {
      raw_header: "!<q>",
      tag: "q",
      modifiers: [],
      body: "test"
    };
  }

  throw new Error(`Unsupported condition: ${config.condition}`);
}

function decideNextUserTurn(config, session) {
  const userTurns = session.turns.filter(t => t.role === "user");
  const userCount = userTurns.length;

  if (config.condition === "user_only_vpp_explicit") {
    if (userCount === 0) {
      return getInitialUserTurn(config);
    }
    if (userCount === 1) {
      return {
        raw_header: "!<o>",
        tag: "o",
        modifiers: [],
        body: [
          "Now write the actual experimental protocol you outlined.",
          "",
          "Constraints:",
          "- Audience: technically literate researchers or senior engineers.",
          "- Structure the protocol into exactly four titled sections:",
          "  1. Goals",
          "  2. Threat model & attack surfaces",
          "  3. Task suite design",
          "  4. Metrics & reporting",
          "- Use concise paragraphs and bullet points where helpful.",
          "- Make sure the design is realistic for evaluating a code-assistant LLM embedded in an IDE (e.g., code completion, refactoring, explanation).",
          "- Do not include any prose outside these four sections."
        ].join("\n\n")
      };
    }
    return null;
  }

  if (config.condition === "user_only_vpp_ambient_nobrowse") {
    if (userCount === 0) {
      return getInitialUserTurn(config);
    }
    if (userCount === 1) {
      return {
        raw_header: "!<o>",
        tag: "o",
        modifiers: [],
        body: "second test"
      };
    }
    return null;
  }

  if (config.condition === "user_only_vpp_ambient_browse") {
    if (userCount === 0) {
      return getInitialUserTurn(config);
    }
    if (userCount === 1) {
      return {
        raw_header: "!<o>",
        tag: "o",
        modifiers: [],
        body: "second test"
      };
    }
    return null;
  }

  throw new Error(`Unsupported condition: ${config.condition}`);
}

function formatUserMessage(turn) {
  if (turn.raw_header && typeof turn.raw_header === "string" && turn.raw_header.length > 0) {
    return `${turn.raw_header}\n${turn.body}`;
  }
  return turn.body;
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
    protocol_version: config.protocol_version ?? "1.4",
    meta: {
      model: config.model,
      provider: config.provider ?? "openai",
      condition: config.condition,
      challenge_type: config.challenge_type ?? "user_only_protocol",
      created_at: new Date().toISOString(),
      task_template_id: config.task_template_id ?? "exp1b-user-only",
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

async function callModel(messages, config) {
  const completion = await openai.chat.completions.create({
    model: config.model,
    messages,
    temperature: config.temperature,
    top_p: config.top_p
  });

  const assistantText = completion.choices?.[0]?.message?.content ?? "";
  return { response: completion, assistantText };
}

function recordUserTurn(session, turn, turnIndex) {
  session.turns.push({
    turn_index: turnIndex,
    role: "user",
    raw_header: turn.raw_header ?? null,
    tag: turn.tag ?? null,
    modifiers: Array.isArray(turn.modifiers) ? turn.modifiers : [],
    body: turn.body ?? "",
    footer: null,
    parsed_footer: null
  });
}

function recordAssistantTurn(session, turnIndex, assistantParsed) {
  session.turns.push({
    turn_index: turnIndex,
    role: "assistant",
    raw_header: assistantParsed.raw_header,
    tag: assistantParsed.tag,
    modifiers: Array.isArray(assistantParsed.modifiers) ? assistantParsed.modifiers : [],
    body: assistantParsed.body,
    footer: assistantParsed.footer,
    parsed_footer: assistantParsed.parsed_footer
  });
}

async function runSession(config) {
  const session = createEmptySession(config);
  const systemMessage = buildSystemMessage(config);
  const messages = [];
  if (systemMessage) {
    messages.push(systemMessage);
  }

  let nextUserTurn = getInitialUserTurn(config);
  let turnIndex = 0;
  const maxTurns = 4;
  let turnPairs = 0;

  while (nextUserTurn && turnPairs < maxTurns / 2) {
    const userTurn = nextUserTurn;
    messages.push({ role: "user", content: formatUserMessage(userTurn) });
    recordUserTurn(session, userTurn, turnIndex);
    turnIndex += 1;

    const { assistantText } = await callModel(messages, config);
    messages.push({ role: "assistant", content: assistantText });

    const assistantParsed = parseAssistantMessage(assistantText);
    recordAssistantTurn(session, turnIndex, assistantParsed);
    turnIndex += 1;

    turnPairs += 1;
    nextUserTurn = decideNextUserTurn(config, session);
  }

  const sessionPath = saveSession(session);
  console.log(`Session complete: ${session.id} -> ${sessionPath}`);
  return session;
}

function loadConfigs() {
  if (!fs.existsSync(CONFIGS_PATH)) {
    throw new Error(`Configs file not found: ${CONFIGS_PATH}`);
  }
  const lines = fs.readFileSync(CONFIGS_PATH, "utf8")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines.map(line => JSON.parse(line));
}

async function main() {
  try {
    const configs = loadConfigs();
    for (const config of configs) {
      await runSession(config);
    }
  } catch (err) {
    console.error("Failed to run Exp1b sessions:", err);
    process.exit(1);
  }
}

main();
