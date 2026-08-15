import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const manifestPath = resolve(root, "protocol/v1.5/manifest.json");
const stateSchemaPath = resolve(root, "protocol/v1.5/state.schema.json");
const manifestSchemaPath = resolve(root, "protocol/v1.5/manifest.schema.json");
const manifestText = await readFile(manifestPath, "utf8");
const stateSchemaText = await readFile(stateSchemaPath, "utf8");
const manifestSchemaText = await readFile(manifestSchemaPath, "utf8");
const manifest = JSON.parse(manifestText);
const digest = createHash("sha256").update(manifestText).digest("hex").slice(0, 16);

const escapeHint =
  "Escape options: send `!<e> --<g>` (or `--<q>`, `--<o>`, `--<c>`, `--<o_f>`) to change locus, or `!<e_o>` to start an output pipeline.";

const spec = `<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
# Viable Prompt Protocol v1.5

Manifest digest: \`${digest}\`

VPP is a tagged, closed-loop conversation protocol. The user places one command on line 1; the assistant returns exactly one allowed wrapper tag, a body, and the canonical footer.

## Grammar

\`${manifest.grammar.form}\`

- Parse line 1 only. Later lines are content, even when they contain bang tags.
- Tags and modifiers are case-sensitive.
- User tags: ${manifest.user_tags.map((tag) => `\`!<${tag}>\``).join(", ")}.
- Assistant tags: ${manifest.assistant_tags.map((tag) => `\`<${tag}>\``).join(", ")}.
- Correctness modifiers: ${manifest.modifiers.correctness.map((item) => `\`--${item}\``).join(", ")}.
- Severity modifiers: ${manifest.modifiers.severity.map((item) => `\`--${item}\``).join(", ")}.
- Duplicate or contradictory modifiers are invalid.
- Pipeline destinations must be one of ${manifest.modifiers.pipeline_destinations.map((tag) => `\`--<${tag}>\``).join(", ")}.

## Transitions

- Valid ordinary commands mirror their tag.
- \`!<e> --<tag>\` starts a new locus at cycle 1 and routes to \`<tag>\`.
- \`!<e_o>\` starts an immediate output pipeline at \`<o>\` and cycle 1.
- \`${manifest.transitions.pipeline_form}\` starts an explicit pipeline at cycle 1.
- \`!<o> --incorrect\` and \`!<o_f> --incorrect\` route to \`<c>\`.
- Invalid commands deterministically route to \`<c>\` with a recovery body.

## State

The default locus is \`${manifest.state.default_locus}\`. Cycle starts at 1. Every valid user \`!<c>\` advances the cycle, capped at ${manifest.state.cycle_max}. New-locus escapes, immediate-output escapes, explicit pipelines, and a new command after \`<o_f>\` reset cycle to 1.

Tag indexes are conversation-global. They continue across cycle resets and locus changes, and reset only when the caller begins a new conversation with no prior state. Unnamed locus jumps are assigned \`locus-2\`, \`locus-3\`, and so on.

At cycle 3 the formatter adds the canonical escape choices when the body does not already contain both forms:

> ${escapeHint}

## Content contracts

${Object.entries(manifest.contracts).map(([tag, text]) => `- \`<${tag}>\`: ${text}`).join("\n")}

The runtime enforces structure: commands, wrappers, modifiers, counters, cycles, loci, footer fields, and wrapper placement. Meaning-level obligations such as concept-only behavior and citation quality remain model or evaluation concerns.

## Footer

\`${manifest.footer.format}\`

\`Sources\` is \`none\` or \`web\`. \`Assumptions\` is a caller-declared non-negative integer. No text may appear outside the header, body, and footer.
`;

const header = `Viable Prompt Protocol v1.5 (reduced-assurance fallback):

Parse only line 1 as !<tag> plus optional modifiers. User tags are g,q,o,c,o_f,e,e_o. Assistant tags are limited to g,q,o,c,o_f. Reject duplicate or contradictory modifiers and invalid pipeline destinations with <c> recovery. Mirror ordinary tags; !<e> --<tag> starts a named/new locus, !<e_o> routes to <o>, and !<o> --correct --<tag> starts a pipeline.

Track state per conversation. Tag indexes are conversation-global and continue across loci. Cycle starts at 1; every valid user !<c> advances it, capped at 3. Locus escapes, immediate-output escapes, explicit pipelines, and a new command after <o_f> reset cycle but not tag counts. At cycle 3 add both escape choices if absent. Default locus is default; unnamed jumps are locus-2, locus-3, etc.

Every reply must be exactly:
<assistant_tag>
body
${manifest.footer.format}

Prefer the viable-prompt-protocol skill plus https://mcp.viableprompt.org/mcp; this text cannot deterministically enforce state.
`;

const customInstructionsPage = `---
title: 'Custom instructions fallback'
description: 'Reduced-assurance VPP v1.5 instructions for hosts without skills, MCP, or JSON tools.'
---

<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
<!-- markdownlint-disable MD013 -->

Use this route only when your host cannot install the VPP plugin or skill and cannot call the remote MCP or JSON API. Prose instructions cannot reliably maintain conversation-global counters, enforce state transitions, or repair wrappers.

Copy the complete block into the host's system prompt or custom instructions:

\`\`\`text
${header.trimEnd()}
\`\`\`

Then begin a new conversation with a VPP command on line 1, for example:

\`\`\`text
!<g>
Explore a robust queue design.
\`\`\`

For deterministic enforcement, [install the plugin](/install/) or connect to \`https://mcp.viableprompt.org/mcp\`. The [v1.5 specification](/spec/) remains the normative human-readable reference.

<!-- markdownlint-restore -->
`;

const failureCodes = `<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
# VPP v1.5 structural failure codes

| Code | Meaning |
| --- | --- |
| \`invalid-first-line\` | Line 1 is not a valid VPP command. |
| \`unknown-tag\` | The command tag is not a VPP user tag. |
| \`invalid-modifier\` | A token after the command is not a supported modifier. |
| \`duplicate-modifier\` | A modifier or pipeline destination appears more than once. |
| \`conflicting-correctness\` | \`--correct\` and \`--incorrect\` appear together. |
| \`conflicting-severity\` | \`--minor\` and \`--major\` appear together. |
| \`multiple-pipeline-destinations\` | More than one destination was supplied. |
| \`missing-pipeline-destination\` | \`!<e>\` lacks its destination. |
| \`invalid-pipeline-destination\` | A destination is not an assistant tag. |
| \`pipeline-not-allowed\` | A destination appears on an unsupported command. |
| \`invalid-state-*\` | Client-carried state violates the v1.5 schema. |
| \`missing-or-invalid-header\` | Assistant line 1 is not the expected bare tag. |
| \`missing-or-malformed-footer\` | The canonical footer is absent or malformed. |
| \`*-mismatch\` | Wrapper/footer fields differ from the deterministic transition. |
| \`nested-header\`, \`nested-footer\` | A duplicate wrapper appears inside the body. |
| \`missing-escape-options\` | A cycle-3 response omitted an escape form. |
| \`recovery-body-mismatch\` | Invalid input did not use the deterministic recovery body. |
`;

const transcripts = `<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
# Representative v1.5 transcripts

## Global counters across loci

\`\`\`text
USER: !<g>
ASSISTANT: <g>
...body...
[Version=v1.5 | Tag=g_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=default]

USER: !<e> --<g>
ASSISTANT: <g>
...body...
[Version=v1.5 | Tag=g_2 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=locus-2]
\`\`\`

## Critique cycles and automatic escape choices

Three valid user \`!<c>\` commands move cycles 1 to 2 to 3 and remain capped at 3. The formatter injects the canonical escape choices at cycle 3 if the generated body omitted them.

## Deterministic invalid-command recovery

\`!<g> --correct --incorrect\` prepares \`<c>\` and a recovery body naming \`conflicting-correctness\`. The model is not called for that recovery.
`;

const adoption = `<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
# Adopt VPP v1.5

Use the packaged \`viable-prompt-protocol\` skill and its remote MCP dependency. The required host sequence is:

1. Call \`vpp_prepare_turn\` with the user message and client-carried state.
2. Generate body-only content under \`content_contract\`, unless the prepared turn supplies \`deterministic_body\`.
3. Call \`vpp_format_response\` with the prepared turn, body, source mode, and assumption count.
4. Call \`vpp_validate_exchange\` before returning the message.

The MCP endpoint is \`https://mcp.viableprompt.org/mcp\`. Equivalent stateless JSON operations live under \`https://mcp.viableprompt.org/api/v1/\`; OpenAPI is at \`/api/v1/openapi.json\`.

Conversation state is transparent JSON carried by the client. Send no state to begin a new conversation. Reuse returned state for the next turn. The service keeps no conversation state and is designed not to log request bodies.

Use the bundled offline CLI only if remote MCP and JSON are unavailable. Custom instructions are a reduced-assurance fallback because a model cannot reliably enforce counters and transitions from prose alone.
`;

const generatedTs = `// GENERATED by scripts/generate-v15.mjs; do not edit.\n` +
  `export const generatedManifestText = ${JSON.stringify(manifestText.trimEnd() + "\n")};\n` +
  `export const generatedStateSchemaText = ${JSON.stringify(stateSchemaText.trimEnd() + "\n")};\n` +
  `export const generatedManifestSchemaText = ${JSON.stringify(manifestSchemaText.trimEnd() + "\n")};\n` +
  `export const generatedSpecText = ${JSON.stringify(spec)};\n` +
  `export const generatedHeaderText = ${JSON.stringify(header)};\n` +
  `export const generatedAdoptionText = ${JSON.stringify(adoption)};\n`;

const vppJson = `${JSON.stringify(
  {
    name: manifest.name,
    short: manifest.short_name,
    version: "1.5.0",
    latest: "v1.5",
    protocol_manifest: "protocol/v1.5/manifest.json",
    state_schema: "protocol/v1.5/state.schema.json",
    services: {
      mcp: "https://mcp.viableprompt.org/mcp",
      json: "https://mcp.viableprompt.org/api/v1",
      openapi: "https://mcp.viableprompt.org/api/v1/openapi.json"
    },
    cdn: {
      spec_latest: "https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/docs/latest/spec.md",
      spec_v1_5: "https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/docs/spec/v1.5/spec.md",
      spec_v1_4: "https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/docs/spec/v1.4/spec.md",
      header_latest: "https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/docs/spec/v1.5/header-snippet.txt"
    },
    license: { code: "MIT", docs_examples: "CC-BY-4.0" }
  },
  null,
  2
)}\n`;

const outputs = new Map([
  ["docs/spec/v1.5/spec.md", spec],
  ["docs/spec/v1.5/header-snippet.txt", header],
  ["docs/latest/spec.md", spec],
  ["spec/latest/spec.md", spec],
  ["website/docs/spec/index.md", spec],
  ["website/docs/custom-instructions/index.md", customInstructionsPage],
  ["docs/adoption/v1.5.md", adoption],
  ["plugins/viable-prompt-protocol/skills/viable-prompt-protocol/references/protocol.md", spec],
  ["plugins/viable-prompt-protocol/skills/viable-prompt-protocol/references/failure-codes.md", failureCodes],
  ["plugins/viable-prompt-protocol/skills/viable-prompt-protocol/references/transcripts.md", transcripts],
  ["plugins/viable-prompt-protocol/skills/viable-prompt-protocol/references/adoption.md", adoption],
  ["src/generated-content.ts", generatedTs],
  ["vpp.json", vppJson]
]);

const drift = [];
for (const [relativePath, content] of outputs) {
  const target = resolve(root, relativePath);
  let existing = null;
  try {
    existing = await readFile(target, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (existing === content) continue;
  drift.push(relativePath);
  if (!check) {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
}

if (check && drift.length) {
  console.error(`Generated VPP files are stale:\n${drift.map((item) => `- ${item}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(check ? "Generated VPP files are current." : `Generated ${outputs.size} VPP files.`);
}
