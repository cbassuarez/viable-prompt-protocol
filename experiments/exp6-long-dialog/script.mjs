// Exp6 — Long Dialog Retention, ported to the shared runner. A fixed 5-step
// dialog (g → q → o → c → o_f). All conditions send `!<tag>` user headers; the
// question is whether the assistant keeps mirroring + footering across the
// dialog. Conditions: vpp_longdialog_grounded / vpp_longdialog_tags_only /
// baseline_longdialog_tags (baseline stored flat).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseAssistantMessage } from "../lib/parsing.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HEADER_SNIPPET_PATH = path.resolve(path.join(__dirname, "../../docs/spec/v1.4/header-snippet.txt"));
const loadHeaderSnippet = () => fs.readFileSync(HEADER_SNIPPET_PATH, "utf8").trimEnd();

function buildSystemMessage(config) {
  if (config.condition === "vpp_longdialog_grounded" || config.condition === "vpp_longdialog_tags_only") {
    return {
      role: "system",
      content: [
        "You are participating in Viable Prompt Protocol (VPP) — Exp6: Long Dialog Retention.",
        loadHeaderSnippet(),
        "Mirror the user's tag on line 1 and include the v1.4 footer each turn."
      ].join("\n\n")
    };
  }
  if (config.condition === "baseline_longdialog_tags") {
    return {
      role: "system",
      content: [
        "You are a cooperative assistant.",
        "The user may label their turns with markers like !<q> or !<o>; treat them as hints but no special formatting is required."
      ].join("\n\n")
    };
  }
  throw new Error(`Unsupported condition: ${config.condition}`);
}

function longDialogUserScript(condition) {
  const prompts = {
    goals: ["We are mapping a multi-stage workflow for evaluating an IDE-integrated LLM assistant.", "List three crisp experiment goals we should prioritize next."].join("\n\n"),
    protocolDraft: ["Draft a structured protocol covering setup, scenarios, guardrails, and metrics.", "Keep it concise and clearly labeled."].join("\n\n"),
    styleShift: ["Now restate the protocol as bullet points aimed at senior engineers with limited time.", "Keep technical fidelity; do not introduce marketing fluff."].join("\n\n"),
    finalOutput: ["Provide a final concise handoff that includes Goals, Threat model, Task suite, and Metrics sections in that order.", "This is the closing deliverable."].join("\n\n")
  };
  const grounding =
    condition === "vpp_longdialog_grounded"
      ? [
          "We will follow the Viable Prompt Protocol with minimal reminders.",
          "Confirm you understand the tags (`<g>`, `<q>`, `<o>`, `<c>`, `<o_f>`), mirroring, and footer requirements before proceeding.",
          "We will iterate through grounding, exploration, constraint changes, and a final write-up.",
          "Do not solve the whole task in this turn; acknowledge and ask any clarifying questions."
        ].join("\n\n")
      : condition === "vpp_longdialog_tags_only"
        ? ["Assume the Viable Prompt Protocol header already primed you.", "We will simply start using the tags without further ceremony.", "Acknowledge readiness briefly."].join("\n\n")
        : ["I will label my turns with markers like !<g> or !<o> just for bookkeeping.", "Treat them as plain text and proceed normally.", "Let me know if anything is unclear."].join("\n\n");

  return [
    { tag: "g", body: grounding },
    { tag: "q", body: prompts.goals },
    { tag: "o", body: prompts.protocolDraft },
    { tag: "c", body: prompts.styleShift },
    { tag: "o_f", body: prompts.finalOutput }
  ];
}

function nextUserTurn(config, session) {
  const userCount = session.turns.filter((t) => t.role === "user").length;
  const script = longDialogUserScript(config.condition);
  if (userCount >= script.length) return null;
  const step = script[userCount];
  return { raw_header: `!<${step.tag}>`, tag: step.tag, modifiers: [], body: step.body };
}

function parseAssistant(text, config) {
  if (config.condition === "baseline_longdialog_tags") {
    return { raw_header: null, tag: null, modifiers: [], body: (text || "").trim(), footer: null, parsed_footer: null };
  }
  return parseAssistantMessage(text);
}

function metaOverrides(config) {
  return { challenge_type: config.challenge_type ?? "long_dialog" };
}

export default { buildSystemMessage, nextUserTurn, parseAssistant, metaOverrides };
