// Exp1b — User-Only Protocol, ported to the shared runner.
// Faithful to run-exp1b-user-only.mjs: tests whether VPP "sticks" when installed
// by the USER alone (the system prompt never contains the protocol). Conditions:
//   user_only_vpp_explicit        user pastes the tag+footer rules themselves
//   user_only_vpp_ambient_nobrowse  user just sends `!<q>` with no explanation
//   user_only_vpp_ambient_browse    same, but the system note permits researching
//                                    unfamiliar syntax
// All conditions are parsed structurally (the original used the VPP parser for
// every condition), so we rely on the runner's default parser.

function buildSystemMessage(config) {
  if (config.condition === "user_only_vpp_explicit") {
    return {
      role: "system",
      content: [
        "You are a helpful assistant.",
        "Follow the user's instructions carefully and respond clearly and concisely."
      ].join("\n\n")
    };
  }
  if (config.condition === "user_only_vpp_ambient_nobrowse") {
    return {
      role: "system",
      content: ["You are a helpful assistant.", "Respond to the user's messages as best you can."].join("\n\n")
    };
  }
  if (config.condition === "user_only_vpp_ambient_browse") {
    return {
      role: "system",
      content: [
        "You are a helpful assistant.",
        "Respond to the user's messages as best you can.",
        "If you encounter unfamiliar syntax such as leading command tags (e.g. `!<q>`), you may actively try to interpret or research their meaning and adapt your replies accordingly."
      ].join("\n\n")
    };
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
    return { raw_header: "!<g>", tag: "g", modifiers: [], body };
  }
  // Ambient conditions: minimal, unexplained tag usage.
  return { raw_header: "!<q>", tag: "q", modifiers: [], body: "test" };
}

function getSecondUserTurn(config) {
  if (config.condition === "user_only_vpp_explicit") {
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
  return { raw_header: "!<o>", tag: "o", modifiers: [], body: "second test" };
}

function nextUserTurn(config, session) {
  const userCount = session.turns.filter((t) => t.role === "user").length;
  if (userCount === 0) return getInitialUserTurn(config);
  if (userCount === 1) return getSecondUserTurn(config);
  return null;
}

function metaOverrides(config) {
  return {
    challenge_type: config.challenge_type ?? "user_only_protocol",
    task_template_id: config.task_template_id ?? "exp1b-user-only"
  };
}

export default { buildSystemMessage, nextUserTurn, metaOverrides };
