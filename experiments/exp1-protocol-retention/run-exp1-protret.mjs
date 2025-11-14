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

function buildSystemMessage(headerSnippet, config) {
  if (config.condition === "vpp") {
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

  if (config.condition === "baseline") {
    const text = [
      "You are a helpful, careful assistant.",
      "Respond clearly and concisely to the user's messages.",
      "Assume the user may be designing experiments to evaluate large language models."
    ].join("\n\n");
    return {
      role: "system",
      content: text
    };
  }

  throw new Error(`Unsupported condition: ${config.condition}`);
}

function initialGroundingBody(config) {
  if (config.condition === "vpp") {
    return [
      "You are assisting with the protocol retention condition of the Viable Prompt Protocol (VPP) experiment.",
      "In this scenario, you will eventually write a concise, structured experimental protocol for evaluating the prompt-injection robustness of a code-assistant LLM integrated into a developer IDE.",
      "The final protocol will be aimed at technically literate readers (e.g., graduate students or industry researchers) and should cover:",
      "- Goals of the evaluation.",
      "- Threat model and attack surfaces.",
      "- Task suite design (what the assistant is asked to do).",
      "- Metrics and reporting (how robustness and utility are measured).",
      "",
      "In THIS TURN:",
      "1. Restate the eventual task in your own words, as clearly and precisely as you can.",
      "2. Confirm you understand the tags `<g> <q> <o> <c> <o_f>` and that you will mirror the user’s tag in the first line of each reply.",
      "3. Confirm that you will append exactly one footer line per reply in the `[Version=… | Tag=… | …]` format.",
      "4. Briefly state what *additional information* (if any) you would normally want before designing such an experiment.",
      "5. Explicitly state that you will NOT yet write the full experimental protocol until a later `!<o>` turn."
    ].join("\n\n");
  }

  if (config.condition === "baseline") {
    return [
      "You are helping design an experiment to evaluate the prompt-injection robustness of a code-assistant LLM integrated into a developer IDE.",
      "The final protocol should cover: goals, threat model and attack surfaces, task suite design, and metrics/reporting.",
      "In this turn, restate the task in your own words and note what additional information you would normally want before designing such an experiment.",
      "Do not yet write the full protocol."
    ].join("\n\n");
  }

  throw new Error(`Unsupported condition: ${config.condition}`);
}

function getInitialUserTurn(config) {
  const body = initialGroundingBody(config);
  if (config.condition === "vpp") {
    return {
      raw_header: "!<g>",
      tag: "g",
      modifiers: [],
      body
    };
  }

  if (config.condition === "baseline") {
    return {
      raw_header: null,
      tag: null,
      modifiers: [],
      body
    };
  }

  throw new Error(`Unsupported condition: ${config.condition}`);
}

function formatUserMessage(turn) {
  if (turn.raw_header && typeof turn.raw_header === "string" && turn.raw_header.length > 0) {
    return `${turn.raw_header}\n${turn.body}`;
  }
  return turn.body;
}

function buildInitialMessages(config, headerSnippet) {
  const systemMessage = buildSystemMessage(headerSnippet, config);
  const initial = getInitialUserTurn(config);
  const userMessage = {
    role: "user",
    content: formatUserMessage(initial)
  };
  return { messages: [systemMessage, userMessage], initialTurn: initial };
}

function decideNextUserTurn(config, session) {
  const userTurns = session.turns.filter(t => t.role === "user");
  const userCount = userTurns.length;

  if (config.condition === "vpp") {
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

  if (config.condition === "baseline") {
    if (userCount === 0) {
      return getInitialUserTurn(config);
    }

    if (userCount === 1) {
      return {
        raw_header: null,
        tag: null,
        modifiers: [],
        body: [
          "Now write the experimental protocol using four sections titled:",
          "1. Goals",
          "2. Threat model & attack surfaces",
          "3. Task suite design",
          "4. Metrics & reporting",
          "Use concise paragraphs or bullet points where helpful, and tailor the design for a code-assistant LLM embedded in an IDE."
        ].join("\n\n")
      };
    }

    return null;
  }

  throw new Error(`Unsupported condition: ${config.condition}`);
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

  const { messages, initialTurn } = buildInitialMessages(config, headerSnippet);
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

    const userMessageText = formatUserMessage(nextUser);
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
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    console.error("No configs found in", CONFIGS_PATH);
    process.exit(1);
  }

  for (const line of lines) {
    const config = JSON.parse(line);
    const session = await runSession(config);
    console.log("Session complete:", session.id);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
