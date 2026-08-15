// protocol/v1.5/manifest.json
var manifest_default = {
  $schema: "./manifest.schema.json",
  name: "Viable Prompt Protocol",
  short_name: "VPP",
  version: "v1.5",
  assistant_tags: ["g", "q", "o", "c", "o_f"],
  user_tags: ["g", "q", "o", "c", "o_f", "e", "e_o"],
  modifiers: {
    correctness: ["correct", "incorrect"],
    severity: ["minor", "major"],
    pipeline_destinations: ["g", "q", "o", "c", "o_f"]
  },
  grammar: {
    form: "!<tag> [--modifier ...]",
    first_line_only: true,
    case_sensitive: true,
    pipeline_requires_angle_brackets: true,
    duplicate_modifiers_are_errors: true
  },
  transitions: {
    mirror_default: true,
    escape_requires_pipeline: true,
    immediate_output_tag: "o",
    pipeline_form: "!<o> --correct --<tag>",
    assistant_error_tag: "c"
  },
  state: {
    default_locus: "default",
    cycle_initial: 1,
    cycle_max: 3,
    cycle_model: "restartable-dag",
    cycle_closes_on_user_tag: "c",
    cycle_advances_after_close: true,
    locus_scope: "cycle",
    active_path_only: true,
    tag_counts_scope: "conversation-per-tag",
    cycle_resets: [
      "new-locus-escape",
      "immediate-output-escape",
      "explicit-pipeline",
      "new-command-after-final"
    ],
    escape_hint_on_cycle_close_at_max: true
  },
  contracts: {
    g: "Stay conceptual. Snippets are allowed; do not emit full files or modules.",
    q: "Ask broad, uncertainty-reducing questions or provide diagnostic framing.",
    o: "Produce a realized deliverable and include assumptions, citations, and tests when relevant.",
    c: "Critique or clarify at fine context, targeting concrete deltas and asking no more than 25 questions.",
    o_f: "Produce the publishable final result with a brief rationale and acceptance checklist."
  },
  footer: {
    format: "[Version=v1.5 | Tag=<tag>_<index> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<name>]",
    sources: ["none", "web"],
    locus_max_length: 64
  },
  limits: {
    critique_questions: 25,
    message_bytes: 262144
  }
};

// src/core.ts
var PROTOCOL_VERSION = "v1.5";
var ASSISTANT_TAGS = ["g", "q", "o", "c", "o_f"];
var USER_TAGS = [...ASSISTANT_TAGS, "e", "e_o"];
var SOURCES = ["none", "web"];
var ESCAPE_HINT = "Escape options: send `!<e> --<g>` (or `--<q>`, `--<o>`, `--<c>`, `--<o_f>`) to change locus, or `!<e_o>` to start an output pipeline.";
var protocolManifest = Object.freeze(manifest_default);
var assistantTagSet = new Set(ASSISTANT_TAGS);
var userTagSet = new Set(USER_TAGS);
var ordinaryModifierSet = /* @__PURE__ */ new Set(["correct", "incorrect", "minor", "major"]);
var locusPattern = /^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,63}$/;
var VppInputError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "VppInputError";
    this.code = code;
  }
};
function createInitialState(locus = "default") {
  assertLocusName(locus);
  return {
    protocol_version: PROTOCOL_VERSION,
    cycle: {
      sequence: 1,
      iteration: 1,
      locus: { index: 1, name: locus },
      path: [],
      closed: false
    },
    tag_counts: { g: 0, q: 0, o: 0, c: 0, o_f: 0 },
    closed: false
  };
}
function normalizeState(value) {
  if (value == null) return createInitialState();
  if (typeof value !== "object" || value.protocol_version !== PROTOCOL_VERSION) {
    throw new VppInputError("invalid-state-version", `State must use ${PROTOCOL_VERSION}.`);
  }
  const counts = {};
  for (const tag of ASSISTANT_TAGS) {
    const count = value.tag_counts?.[tag];
    if (!Number.isInteger(count) || count < 0) {
      throw new VppInputError("invalid-tag-count", `State tag_counts.${tag} must be a non-negative integer.`);
    }
    counts[tag] = count;
  }
  if (typeof value.closed !== "boolean") {
    throw new VppInputError("invalid-closed-state", "State closed must be boolean.");
  }
  if (typeof value.cycle === "number") {
    if (!value.locus || !Number.isInteger(value.locus.index) || value.locus.index < 1) {
      throw new VppInputError("invalid-locus-index", "State locus.index must be a positive integer.");
    }
    assertLocusName(value.locus.name);
    if (![1, 2, 3].includes(value.cycle)) {
      throw new VppInputError("invalid-cycle", "State cycle must be 1, 2, or 3.");
    }
    return {
      protocol_version: PROTOCOL_VERSION,
      cycle: {
        sequence: 1,
        iteration: value.cycle,
        locus: { index: value.locus.index, name: value.locus.name },
        path: [],
        closed: false
      },
      tag_counts: counts,
      closed: value.closed
    };
  }
  const cycle = value.cycle;
  if (!cycle || !Number.isInteger(cycle.sequence) || cycle.sequence < 1) {
    throw new VppInputError("invalid-cycle-sequence", "State cycle.sequence must be a positive integer.");
  }
  if (![1, 2, 3].includes(cycle.iteration)) {
    throw new VppInputError("invalid-cycle", "State cycle.iteration must be 1, 2, or 3.");
  }
  if (!cycle.locus || !Number.isInteger(cycle.locus.index) || cycle.locus.index < 1) {
    throw new VppInputError("invalid-locus-index", "State cycle.locus.index must be a positive integer.");
  }
  assertLocusName(cycle.locus.name);
  if (!Array.isArray(cycle.path)) {
    throw new VppInputError("invalid-cycle-path", "State cycle.path must be an array.");
  }
  const path = cycle.path.map((node, index) => {
    if (!node || !userTagSet.has(node.command_tag) || !assistantTagSet.has(node.response_tag)) {
      throw new VppInputError("invalid-cycle-path", `State cycle.path[${index}] has an invalid tag.`);
    }
    if (!Number.isInteger(node.tag_index) || node.tag_index < 1 || node.tag_index > counts[node.response_tag]) {
      throw new VppInputError("invalid-cycle-path", `State cycle.path[${index}].tag_index is inconsistent.`);
    }
    if (!Array.isArray(node.modifiers) || node.modifiers.some((modifier) => typeof modifier !== "string")) {
      throw new VppInputError("invalid-cycle-path", `State cycle.path[${index}].modifiers must be strings.`);
    }
    const reconstructed = parseCommand(
      [`!<${node.command_tag}>`, ...node.modifiers.map((modifier) => `--${modifier}`)].join(" ")
    );
    if (!reconstructed.ok || resolvedAssistantTag(reconstructed) !== node.response_tag) {
      throw new VppInputError(
        "invalid-cycle-path",
        `State cycle.path[${index}] does not represent a valid resolved transition.`
      );
    }
    return {
      command_tag: node.command_tag,
      response_tag: node.response_tag,
      tag_index: node.tag_index,
      modifiers: [...node.modifiers]
    };
  });
  if (typeof cycle.closed !== "boolean") {
    throw new VppInputError("invalid-cycle-closed-state", "State cycle.closed must be boolean.");
  }
  const lastIndexes = /* @__PURE__ */ new Map();
  for (let index = 0; index < path.length; index += 1) {
    const node = path[index];
    const prior = lastIndexes.get(node.response_tag) ?? 0;
    if (node.tag_index <= prior) {
      throw new VppInputError(
        "invalid-cycle-path",
        `State cycle.path[${index}].tag_index must increase for ${node.response_tag}.`
      );
    }
    if (node.command_tag === "c" && index !== path.length - 1) {
      throw new VppInputError("invalid-cycle-path", "A cycle path cannot continue after a closing c command.");
    }
    lastIndexes.set(node.response_tag, node.tag_index);
  }
  const last = path.at(-1);
  if (cycle.closed !== (last?.command_tag === "c")) {
    throw new VppInputError("invalid-cycle-closed-state", "State cycle.closed must match the final path command.");
  }
  if (value.closed !== (last?.response_tag === "o_f")) {
    throw new VppInputError("invalid-closed-state", "State closed must match the final path response.");
  }
  return {
    protocol_version: PROTOCOL_VERSION,
    cycle: {
      sequence: cycle.sequence,
      iteration: cycle.iteration,
      locus: { index: cycle.locus.index, name: cycle.locus.name },
      path,
      closed: cycle.closed
    },
    tag_counts: counts,
    closed: value.closed
  };
}
function parseCommand(message) {
  const source = typeof message === "string" ? message : String(message ?? "");
  const lines = source.split(/\r?\n/);
  const firstLine = lines[0] ?? "";
  const body = lines.slice(1).join("\n");
  const diagnostics = [];
  const commandMatch = firstLine.match(/^!<([a-z_]+)>(.*)$/);
  if (!commandMatch) {
    diagnostics.push({
      code: "invalid-first-line",
      message: "Line 1 must begin with a valid VPP command.",
      example: "!<g>"
    });
    return {
      ok: false,
      first_line: firstLine,
      body,
      tag: null,
      modifiers: [],
      pipeline_tag: null,
      diagnostics
    };
  }
  const rawTag = commandMatch[1];
  const tag = userTagSet.has(rawTag) ? rawTag : null;
  if (!tag) {
    diagnostics.push({
      code: "unknown-tag",
      message: `Unknown user tag <${rawTag}>.`,
      example: "!<g>"
    });
  }
  const remainder = commandMatch[2].trim();
  const tokens = remainder ? remainder.split(/\s+/) : [];
  const modifiers = [];
  const pipelineTags = [];
  const seen = /* @__PURE__ */ new Set();
  for (const token of tokens) {
    const ordinary = token.match(/^--(correct|incorrect|minor|major)$/);
    const pipeline = token.match(/^--<([a-z_]+)>$/);
    if (ordinary && ordinaryModifierSet.has(ordinary[1])) {
      const value = ordinary[1];
      if (seen.has(value)) {
        diagnostics.push({
          code: "duplicate-modifier",
          message: `Modifier --${value} may appear only once.`,
          example: tag ? `!<${tag}> --${value}` : "!<g> --minor"
        });
      }
      seen.add(value);
      modifiers.push(value);
      continue;
    }
    if (pipeline) {
      const destination = pipeline[1];
      if (!assistantTagSet.has(destination)) {
        diagnostics.push({
          code: "invalid-pipeline-destination",
          message: `Pipeline destination <${destination}> is not an assistant tag.`,
          example: "!<e> --<g>"
        });
        continue;
      }
      const key = `pipeline:${destination}`;
      if (seen.has(key)) {
        diagnostics.push({
          code: "duplicate-modifier",
          message: `Pipeline destination --<${destination}> may appear only once.`,
          example: "!<e> --<g>"
        });
      }
      seen.add(key);
      pipelineTags.push(destination);
      modifiers.push(`<${destination}>`);
      continue;
    }
    diagnostics.push({
      code: "invalid-modifier",
      message: `Invalid modifier token ${token}.`,
      example: tag ? `!<${tag}> --minor` : "!<g> --minor"
    });
  }
  if (seen.has("correct") && seen.has("incorrect")) {
    diagnostics.push({
      code: "conflicting-correctness",
      message: "--correct and --incorrect are mutually exclusive.",
      example: tag ? `!<${tag}> --incorrect` : "!<c> --incorrect"
    });
  }
  if (seen.has("minor") && seen.has("major")) {
    diagnostics.push({
      code: "conflicting-severity",
      message: "--minor and --major are mutually exclusive.",
      example: tag ? `!<${tag}> --minor` : "!<c> --minor"
    });
  }
  if (pipelineTags.length > 1) {
    diagnostics.push({
      code: "multiple-pipeline-destinations",
      message: "Only one pipeline destination is allowed.",
      example: "!<e> --<g>"
    });
  }
  const pipelineTag = pipelineTags[0] ?? null;
  if (tag === "e" && !pipelineTag) {
    diagnostics.push({
      code: "missing-pipeline-destination",
      message: "!<e> requires exactly one assistant-tag destination.",
      example: "!<e> --<g>"
    });
  }
  if (tag === "e_o" && pipelineTag) {
    diagnostics.push({
      code: "pipeline-not-allowed",
      message: "!<e_o> already targets <o> and cannot take a pipeline destination.",
      example: "!<e_o>"
    });
  }
  if (pipelineTag && tag !== "e" && !(tag === "o" && seen.has("correct"))) {
    diagnostics.push({
      code: "pipeline-not-allowed",
      message: "A pipeline destination is valid only with !<e> or !<o> --correct.",
      example: "!<o> --correct --<g>"
    });
  }
  return {
    ok: diagnostics.length === 0 && tag !== null,
    first_line: firstLine,
    body,
    tag,
    modifiers,
    pipeline_tag: pipelineTag,
    diagnostics
  };
}
function prepareTurn(message, state, nextLocus) {
  const current = normalizeState(state);
  if (nextLocus != null) assertLocusName(nextLocus);
  const command = parseCommand(message);
  const next = normalizeState(current);
  let assistantTag = "c";
  let status = "ready";
  let deterministicBody;
  if (!command.ok || !command.tag) {
    status = "protocol_error";
    const diagnostic = command.diagnostics[0] ?? {
      code: "invalid-command",
      message: "The VPP command is invalid.",
      example: "!<g>"
    };
    deterministicBody = `Invalid VPP command (${diagnostic.code}): ${diagnostic.message} Example: ${diagnostic.example ?? "!<g>"}`;
  } else {
    assistantTag = resolvedAssistantTag(command);
    if (command.tag === "e") {
      const locusIndex = current.cycle.locus.index + 1;
      restartCycle(next, 1, { index: locusIndex, name: nextLocus ?? `locus-${locusIndex}` });
    } else if (command.tag === "e_o") {
      restartCycle(next, 1, current.cycle.locus);
    } else if (command.tag === "o" && command.pipeline_tag && command.modifiers.includes("correct")) {
      restartCycle(next, 1, current.cycle.locus);
    }
    const isExplicitRestart = command.tag === "e" || command.tag === "e_o" || command.tag === "o" && Boolean(command.pipeline_tag) && command.modifiers.includes("correct");
    if (!isExplicitRestart && current.closed) {
      restartCycle(next, 1, current.cycle.locus);
    } else if (!isExplicitRestart && current.cycle.closed) {
      const iteration = Math.min(3, current.cycle.iteration + 1);
      restartCycle(next, iteration, current.cycle.locus);
    }
  }
  next.tag_counts[assistantTag] += 1;
  const tagIndex = next.tag_counts[assistantTag];
  if (status === "ready" && command.tag) {
    next.cycle.path.push({
      command_tag: command.tag,
      response_tag: assistantTag,
      tag_index: tagIndex,
      modifiers: [...command.modifiers]
    });
    next.cycle.closed = command.tag === "c";
    next.closed = assistantTag === "o_f";
  }
  const mustOfferEscape = status === "ready" && command.tag === "c" && next.cycle.iteration === 3;
  return {
    protocol_version: PROTOCOL_VERSION,
    status,
    command,
    assistant_tag: assistantTag,
    tag_index: tagIndex,
    content_contract: contentContract(assistantTag, command),
    must_offer_escape: mustOfferEscape,
    ...deterministicBody ? { deterministic_body: deterministicBody } : {},
    next_state: next
  };
}
function resolvedAssistantTag(command) {
  if (!command.ok || !command.tag) {
    throw new VppInputError("invalid-command", "Cannot resolve an invalid VPP command.");
  }
  if (command.tag === "e") return command.pipeline_tag;
  if (command.tag === "e_o") return "o";
  if (command.tag === "o" && command.pipeline_tag && command.modifiers.includes("correct")) {
    return command.pipeline_tag;
  }
  if ((command.tag === "o" || command.tag === "o_f") && command.modifiers.includes("incorrect")) {
    return "c";
  }
  return command.tag;
}
function restartCycle(state, iteration, locus) {
  state.cycle = {
    sequence: state.cycle.sequence + 1,
    iteration,
    locus: { index: locus.index, name: locus.name },
    path: [],
    closed: false
  };
  state.closed = false;
}
function normalizePreparedTurn(value) {
  if (!value || typeof value !== "object") {
    throw new VppInputError("invalid-prepared-turn", "Prepared turn must be an object.");
  }
  const legacy = typeof value.next_state?.cycle === "number";
  const nextState = normalizeState(value.next_state);
  if (legacy && value.status === "ready" && value.command?.ok && value.command.tag) {
    nextState.cycle.path.push({
      command_tag: value.command.tag,
      response_tag: value.assistant_tag,
      tag_index: value.tag_index,
      modifiers: [...value.command.modifiers]
    });
    nextState.cycle.closed = value.command.tag === "c";
    nextState.closed = value.assistant_tag === "o_f";
  }
  const expectedEscape = value.status === "ready" && value.command?.tag === "c" && nextState.cycle.iteration === 3;
  return {
    ...value,
    must_offer_escape: legacy ? expectedEscape : value.must_offer_escape,
    next_state: nextState
  };
}
function formatResponse(preparedTurnInput, body, sources = "none", assumptionCount = 0) {
  const preparedTurn = normalizePreparedTurn(preparedTurnInput);
  assertPreparedTurn(preparedTurn);
  if (!SOURCES.includes(sources)) {
    throw new VppInputError("invalid-sources", "Sources must be none or web.");
  }
  if (!Number.isInteger(assumptionCount) || assumptionCount < 0) {
    throw new VppInputError("invalid-assumption-count", "Assumption count must be a non-negative integer.");
  }
  let normalizedBody = preparedTurn.status === "protocol_error" ? preparedTurn.deterministic_body ?? "Invalid VPP command. Example: !<g>" : stripResponseWrapper(body);
  if (!normalizedBody.trim()) {
    throw new VppInputError("empty-body", "A ready VPP response body must not be empty.");
  }
  if (preparedTurn.must_offer_escape && !containsEscapeOptions(normalizedBody)) {
    normalizedBody = `${normalizedBody.trimEnd()}

${ESCAPE_HINT}`;
  }
  const header = `<${preparedTurn.assistant_tag}>`;
  const state = normalizeState(preparedTurn.next_state);
  const footer = buildFooter({
    tag: preparedTurn.assistant_tag,
    tagIndex: preparedTurn.tag_index,
    sources,
    assumptions: assumptionCount,
    state
  });
  const message = `${header}
${normalizedBody.trim()}
${footer}`;
  return { message, header, body: normalizedBody.trim(), footer, state };
}
function buildFooter(input) {
  const state = normalizeState(input.state);
  if (!assistantTagSet.has(input.tag)) throw new VppInputError("invalid-assistant-tag", "Invalid assistant tag.");
  if (!Number.isInteger(input.tagIndex) || input.tagIndex < 1) {
    throw new VppInputError("invalid-tag-index", "Tag index must be a positive integer.");
  }
  if (!SOURCES.includes(input.sources)) throw new VppInputError("invalid-sources", "Sources must be none or web.");
  if (!Number.isInteger(input.assumptions) || input.assumptions < 0) {
    throw new VppInputError("invalid-assumption-count", "Assumptions must be a non-negative integer.");
  }
  return `[Version=${PROTOCOL_VERSION} | Tag=${input.tag}_${input.tagIndex} | Sources=${input.sources} | Assumptions=${input.assumptions} | Cycle=${state.cycle.iteration}/3 | Locus=${state.cycle.locus.name}]`;
}
function parseFooter(line) {
  const raw = typeof line === "string" ? line.trim() : "";
  const diagnostics = [];
  const pattern = /^\[Version=(v\d+\.\d+(?:\.\d+)?) \| Tag=(g|q|o|c|o_f)_(\d+) \| Sources=(none|web) \| Assumptions=(\d+) \| Cycle=([1-3])\/(3) \| Locus=([A-Za-z0-9][A-Za-z0-9 ._/-]{0,63})\]$/;
  const match = raw.match(pattern);
  if (!match) {
    diagnostics.push({ code: "malformed-footer", message: "Footer does not match the canonical VPP v1.5 shape." });
    return { ok: false, raw, diagnostics };
  }
  const tag = match[2];
  return {
    ok: true,
    raw,
    version: match[1],
    tag,
    tag_index: Number.parseInt(match[3], 10),
    sources: match[4],
    assumptions: Number.parseInt(match[5], 10),
    cycle: Number.parseInt(match[6], 10),
    cycle_max: Number.parseInt(match[7], 10),
    locus: match[8],
    diagnostics
  };
}
function parseAssistantMessage(message) {
  const normalized = typeof message === "string" ? message.replace(/\r\n/g, "\n").trim() : "";
  const lines = normalized ? normalized.split("\n") : [];
  const rawHeader = lines[0] ?? null;
  const headerMatch = rawHeader?.match(/^<(g|q|o|c|o_f)>$/);
  const tag = headerMatch ? headerMatch[1] : null;
  const footer = lines.length > 1 ? lines[lines.length - 1] : null;
  const parsedFooter = footer ? parseFooter(footer) : null;
  const bodyStart = tag ? 1 : 0;
  const footerLike = footer?.trim().startsWith("[Version=") ?? false;
  const bodyEnd = parsedFooter?.ok || footerLike ? lines.length - 1 : lines.length;
  const body = lines.slice(bodyStart, bodyEnd).join("\n").trim();
  return {
    raw_header: rawHeader,
    tag,
    body,
    footer,
    parsed_footer: parsedFooter
  };
}
function validateExchange(input) {
  const prepared = prepareTurn(input.user_message, input.state, input.next_locus);
  const parsed = parseAssistantMessage(input.assistant_message);
  const violations = [];
  if (!parsed.tag) violations.push({ code: "missing-or-invalid-header", message: "Assistant line 1 must be a bare VPP tag." });
  if (parsed.tag && parsed.tag !== prepared.assistant_tag) {
    violations.push({ code: "tag-mismatch", message: `Expected <${prepared.assistant_tag}> but found <${parsed.tag}>.` });
  }
  if (!parsed.footer || !parsed.parsed_footer?.ok) {
    violations.push({ code: "missing-or-malformed-footer", message: "Assistant response must end with the canonical footer." });
  } else {
    const footer = parsed.parsed_footer;
    if (footer.version !== PROTOCOL_VERSION) violations.push({ code: "version-mismatch", message: `Expected ${PROTOCOL_VERSION}.` });
    if (footer.tag !== prepared.assistant_tag || footer.tag_index !== prepared.tag_index) {
      violations.push({ code: "footer-tag-mismatch", message: `Expected Tag=${prepared.assistant_tag}_${prepared.tag_index}.` });
    }
    if (footer.cycle !== prepared.next_state.cycle.iteration || footer.cycle_max !== 3) {
      violations.push({ code: "cycle-mismatch", message: `Expected Cycle=${prepared.next_state.cycle.iteration}/3.` });
    }
    if (footer.locus !== prepared.next_state.cycle.locus.name) {
      violations.push({ code: "locus-mismatch", message: `Expected Locus=${prepared.next_state.cycle.locus.name}.` });
    }
  }
  if (!parsed.body) violations.push({ code: "empty-body", message: "Assistant response body must not be empty." });
  if (/(?:^|\n)<(?:g|q|o|c|o_f)>(?:\n|$)/.test(parsed.body)) {
    violations.push({ code: "nested-header", message: "Assistant response contains a duplicate VPP header inside the body." });
  }
  if (/(?:^|\n)\[Version=v\d+\.\d+/.test(parsed.body)) {
    violations.push({ code: "nested-footer", message: "Assistant response contains a duplicate VPP footer inside the body." });
  }
  if (prepared.must_offer_escape && !containsEscapeOptions(parsed.body)) {
    violations.push({ code: "missing-escape-options", message: "Cycle 3 responses must surface both escape forms." });
  }
  if (prepared.status === "protocol_error" && parsed.body !== prepared.deterministic_body) {
    violations.push({ code: "recovery-body-mismatch", message: "Invalid commands require the deterministic one-line recovery body." });
  }
  const result = {
    ok: violations.length === 0,
    violations,
    prepared_turn: prepared,
    parsed_response: parsed,
    state: normalizeState(prepared.next_state)
  };
  if (input.repair) {
    if (result.ok) {
      result.repaired_message = input.assistant_message.replace(/\r\n/g, "\n").trim();
    } else {
      const sources = parsed.parsed_footer?.ok ? parsed.parsed_footer.sources ?? "none" : "none";
      const assumptions = parsed.parsed_footer?.ok ? parsed.parsed_footer.assumptions ?? 0 : 0;
      const repairBody = parsed.body || stripResponseWrapper(input.assistant_message) || "Protocol response repaired structurally.";
      result.repaired_message = formatResponse(prepared, repairBody, sources, assumptions).message;
    }
  }
  return result;
}
function validateTranscript(input) {
  let state = normalizeState(input.initial_state);
  const violations = [];
  const exchanges = [];
  for (let index = 0; index < input.turns.length; index += 1) {
    const turn = input.turns[index];
    if (turn.role !== "user") {
      violations.push({ turn_index: index, code: "unexpected-assistant", message: "Expected a user turn." });
      continue;
    }
    const assistant = input.turns[index + 1];
    if (!assistant || assistant.role !== "assistant") {
      violations.push({ turn_index: index, code: "missing-assistant", message: "User turn has no following assistant response." });
      continue;
    }
    const exchange = validateExchange({
      user_message: turn.content,
      assistant_message: assistant.content,
      state,
      repair: input.repair
    });
    exchanges.push(exchange);
    for (const violation of exchange.violations) violations.push({ ...violation, turn_index: index + 1 });
    state = exchange.state;
    index += 1;
  }
  return { ok: violations.length === 0, violations, exchanges, state };
}
function stripResponseWrapper(value) {
  const normalized = typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
  if (!normalized) return "";
  const lines = normalized.split("\n").filter((line) => {
    const trimmed = line.trim();
    return !/^<(g|q|o|c|o_f)>$/.test(trimmed) && !/^\[Version=v\d+\.\d+(?:\.\d+)? \| Tag=/.test(trimmed);
  });
  return lines.join("\n").trim();
}
function contentContract(tag, command) {
  const modifierGuidance = [];
  if (command.modifiers.includes("minor")) modifierGuidance.push("Keep the existing scope and make only minor changes.");
  if (command.modifiers.includes("major")) modifierGuidance.push("Reframe within the current locus when needed.");
  if (command.modifiers.includes("correct")) modifierGuidance.push("Treat the prior direction as accepted and proceed with minimal friction.");
  if (command.modifiers.includes("incorrect")) modifierGuidance.push("Diagnose the rejected direction and target the concrete fault.");
  return {
    tag,
    instruction: protocolManifest.contracts[tag],
    modifier_guidance: modifierGuidance,
    body_only: true,
    ...tag === "c" ? { max_questions: protocolManifest.limits.critique_questions } : {},
    assumptions_must_be_explicit: command.tag === "e_o"
  };
}
function assertPreparedTurn(value) {
  if (!value || value.protocol_version !== PROTOCOL_VERSION || !assistantTagSet.has(value.assistant_tag)) {
    throw new VppInputError("invalid-prepared-turn", "Prepared turn is not a VPP v1.5 turn context.");
  }
  const state = normalizeState(value.next_state);
  if (!Number.isInteger(value.tag_index) || value.tag_index < 1 || state.tag_counts[value.assistant_tag] !== value.tag_index) {
    throw new VppInputError("invalid-prepared-turn", "Prepared turn tag index does not match its next state.");
  }
  if (value.status === "ready" && (!value.command?.ok || !value.command.tag)) {
    throw new VppInputError("invalid-prepared-turn", "A ready prepared turn must contain a valid parsed command.");
  }
  if (value.status === "protocol_error" && (value.command?.ok || value.assistant_tag !== "c" || typeof value.deterministic_body !== "string")) {
    throw new VppInputError("invalid-prepared-turn", "A protocol-error turn must contain deterministic c recovery.");
  }
  if (value.status === "ready" && state.closed !== (value.assistant_tag === "o_f")) {
    throw new VppInputError("invalid-prepared-turn", "Prepared turn closure does not match its assistant tag.");
  }
  const expectedCycleClosed = value.status === "ready" && value.command.tag === "c";
  if (value.status === "ready" && state.cycle.closed !== expectedCycleClosed) {
    throw new VppInputError("invalid-prepared-turn", "Prepared turn cycle closure does not match its command tag.");
  }
  if (value.must_offer_escape !== (expectedCycleClosed && state.cycle.iteration === 3)) {
    throw new VppInputError("invalid-prepared-turn", "Prepared turn escape requirement does not match its cycle.");
  }
  const expectedContract = contentContract(value.assistant_tag, value.command);
  if (JSON.stringify(value.content_contract) !== JSON.stringify(expectedContract)) {
    throw new VppInputError("invalid-prepared-turn", "Prepared turn content contract is inconsistent.");
  }
}
function assertLocusName(value) {
  if (typeof value !== "string" || !locusPattern.test(value)) {
    throw new VppInputError(
      "invalid-locus",
      "Locus must be 1-64 characters using letters, digits, spaces, period, underscore, slash, or hyphen."
    );
  }
}
function containsEscapeOptions(body) {
  return body.includes("!<e> --<") && body.includes("!<e_o>");
}

// src/generated-content.ts
var generatedManifestText = '{\n  "$schema": "./manifest.schema.json",\n  "name": "Viable Prompt Protocol",\n  "short_name": "VPP",\n  "version": "v1.5",\n  "assistant_tags": ["g", "q", "o", "c", "o_f"],\n  "user_tags": ["g", "q", "o", "c", "o_f", "e", "e_o"],\n  "modifiers": {\n    "correctness": ["correct", "incorrect"],\n    "severity": ["minor", "major"],\n    "pipeline_destinations": ["g", "q", "o", "c", "o_f"]\n  },\n  "grammar": {\n    "form": "!<tag> [--modifier ...]",\n    "first_line_only": true,\n    "case_sensitive": true,\n    "pipeline_requires_angle_brackets": true,\n    "duplicate_modifiers_are_errors": true\n  },\n  "transitions": {\n    "mirror_default": true,\n    "escape_requires_pipeline": true,\n    "immediate_output_tag": "o",\n    "pipeline_form": "!<o> --correct --<tag>",\n    "assistant_error_tag": "c"\n  },\n  "state": {\n    "default_locus": "default",\n    "cycle_initial": 1,\n    "cycle_max": 3,\n    "cycle_model": "restartable-dag",\n    "cycle_closes_on_user_tag": "c",\n    "cycle_advances_after_close": true,\n    "locus_scope": "cycle",\n    "active_path_only": true,\n    "tag_counts_scope": "conversation-per-tag",\n    "cycle_resets": [\n      "new-locus-escape",\n      "immediate-output-escape",\n      "explicit-pipeline",\n      "new-command-after-final"\n    ],\n    "escape_hint_on_cycle_close_at_max": true\n  },\n  "contracts": {\n    "g": "Stay conceptual. Snippets are allowed; do not emit full files or modules.",\n    "q": "Ask broad, uncertainty-reducing questions or provide diagnostic framing.",\n    "o": "Produce a realized deliverable and include assumptions, citations, and tests when relevant.",\n    "c": "Critique or clarify at fine context, targeting concrete deltas and asking no more than 25 questions.",\n    "o_f": "Produce the publishable final result with a brief rationale and acceptance checklist."\n  },\n  "footer": {\n    "format": "[Version=v1.5 | Tag=<tag>_<index> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<name>]",\n    "sources": ["none", "web"],\n    "locus_max_length": 64\n  },\n  "limits": {\n    "critique_questions": 25,\n    "message_bytes": 262144\n  }\n}\n';

// src/offline-cli.ts
function asObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new VppInputError("invalid-input", "Input must be a JSON object.");
  }
  return value;
}
function requiredString(input, key) {
  const value = input[key];
  if (typeof value !== "string") throw new VppInputError("invalid-input", `${key} must be a string.`);
  return value;
}
async function readInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) throw new VppInputError("missing-input", "Provide one JSON object on stdin.");
  return JSON.parse(text);
}
async function main() {
  const operation = process.argv[2];
  if (operation === "manifest") {
    process.stdout.write(generatedManifestText);
    return;
  }
  const input = asObject(await readInput());
  let result;
  switch (operation) {
    case "prepare-turn": {
      result = prepareTurn(
        requiredString(input, "message"),
        input.state,
        input.next_locus
      );
      break;
    }
    case "format-response": {
      result = formatResponse(
        input.prepared_turn,
        requiredString(input, "body"),
        input.sources ?? "none",
        input.assumption_count ?? 0
      );
      break;
    }
    case "validate-exchange": {
      result = validateExchange({
        user_message: requiredString(input, "user_message"),
        assistant_message: requiredString(input, "assistant_message"),
        state: input.state,
        repair: input.repair === true,
        next_locus: input.next_locus
      });
      break;
    }
    case "validate-transcript": {
      if (!Array.isArray(input.turns)) throw new VppInputError("invalid-input", "turns must be an array.");
      result = validateTranscript({
        turns: input.turns,
        initial_state: input.initial_state,
        repair: input.repair === true
      });
      break;
    }
    default:
      throw new VppInputError(
        "unknown-operation",
        "Use prepare-turn, format-response, validate-exchange, validate-transcript, or manifest."
      );
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}
`);
}
main().catch((error) => {
  const code = error instanceof VppInputError ? error.code : "invalid-input";
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`${JSON.stringify({ ok: false, error: { code, message } })}
`);
  process.exitCode = 1;
});
