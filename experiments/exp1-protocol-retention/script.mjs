// Exp1 — Protocol Retention, ported to the shared runner.
// Turn logic identical to run-exp1-protret.mjs. Baseline replies are stored as
// flat text (condition-aware parsing) so prose isn't mis-scored as VPP structure.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseAssistantMessage } from "../lib/parsing.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEADER_SNIPPET_PATH = path.resolve(
  path.join(__dirname, "../../docs/spec/v1.4/header-snippet.txt")
);

function loadHeaderSnippet() {
  return fs.readFileSync(HEADER_SNIPPET_PATH, "utf8").trimEnd();
}

function buildSystemMessage(config) {
  if (config.condition === "vpp") {
    return {
      role: "system",
      content: [
        "You are participating in the Viable Prompt Protocol (VPP) experiment.",
        loadHeaderSnippet(),
        "Only treat commands on line 1 starting with `!<tag>` as protocol commands; all other text is task content."
      ].join("\n\n")
    };
  }
  if (config.condition === "baseline") {
    return {
      role: "system",
      content: [
        "You are a helpful, careful assistant.",
        "Respond clearly and concisely to the user's messages.",
        "Assume the user may be designing experiments to evaluate large language models."
      ].join("\n\n")
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
  return [
    "You are helping design an experiment to evaluate the prompt-injection robustness of a code-assistant LLM integrated into a developer IDE.",
    "The final protocol should cover: goals, threat model and attack surfaces, task suite design, and metrics/reporting.",
    "In this turn, restate the task in your own words and note what additional information you would normally want before designing such an experiment.",
    "Do not yet write the full protocol."
  ].join("\n\n");
}

function nextUserTurn(config, session) {
  const userCount = session.turns.filter((t) => t.role === "user").length;
  const vpp = config.condition === "vpp";

  if (userCount === 0) {
    const body = initialGroundingBody(config);
    return vpp
      ? { raw_header: "!<g>", tag: "g", modifiers: [], body }
      : { raw_header: null, tag: null, modifiers: [], body };
  }

  if (userCount === 1) {
    const body = vpp
      ? [
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
      : [
          "Now write the experimental protocol using four sections titled:",
          "1. Goals",
          "2. Threat model & attack surfaces",
          "3. Task suite design",
          "4. Metrics & reporting",
          "Use concise paragraphs or bullet points where helpful, and tailor the design for a code-assistant LLM embedded in an IDE."
        ].join("\n\n");
    return vpp
      ? { raw_header: "!<o>", tag: "o", modifiers: [], body }
      : { raw_header: null, tag: null, modifiers: [], body };
  }

  return null;
}

// Baseline is intentionally unstructured: parsing prose as headers/footers would
// confound the VPP-vs-baseline comparison.
function parseAssistant(text, config) {
  if (config.condition === "baseline") {
    return { raw_header: null, tag: null, modifiers: [], body: (text || "").trim(), footer: null, parsed_footer: null };
  }
  return parseAssistantMessage(text);
}

export default { buildSystemMessage, nextUserTurn, parseAssistant };
