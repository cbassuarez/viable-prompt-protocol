<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
# Viable Prompt Protocol v1.5

Manifest digest: `3f8948a2838ddc33`

VPP is a tagged, closed-loop conversation protocol. The user places one command on line 1; the assistant returns exactly one allowed wrapper tag, a body, and the canonical footer.

## Grammar

`!<tag> [--modifier ...]`

- Parse line 1 only. Later lines are content, even when they contain bang tags.
- Tags and modifiers are case-sensitive.
- User tags: `!<g>`, `!<q>`, `!<o>`, `!<c>`, `!<o_f>`, `!<e>`, `!<e_o>`.
- Assistant tags: `<g>`, `<q>`, `<o>`, `<c>`, `<o_f>`.
- Correctness modifiers: `--correct`, `--incorrect`.
- Severity modifiers: `--minor`, `--major`.
- Duplicate or contradictory modifiers are invalid.
- Pipeline destinations must be one of `--<g>`, `--<q>`, `--<o>`, `--<c>`, `--<o_f>`.

## Transitions

- Valid ordinary commands mirror their tag.
- `!<e> --<tag>` starts a new locus at cycle 1 and routes to `<tag>`.
- `!<e_o>` starts an immediate output pipeline at `<o>` and cycle 1.
- `!<o> --correct --<tag>` starts an explicit pipeline at cycle 1.
- `!<o> --incorrect` and `!<o_f> --incorrect` route to `<c>`.
- Invalid commands deterministically route to `<c>` with a recovery body.

## State

The default locus is `default`. Cycle starts at 1. Every valid user `!<c>` advances the cycle, capped at 3. New-locus escapes, immediate-output escapes, explicit pipelines, and a new command after `<o_f>` reset cycle to 1.

Tag indexes are conversation-global. They continue across cycle resets and locus changes, and reset only when the caller begins a new conversation with no prior state. Unnamed locus jumps are assigned `locus-2`, `locus-3`, and so on.

At cycle 3 the formatter adds the canonical escape choices when the body does not already contain both forms:

> Escape options: send `!<e> --<g>` (or `--<q>`, `--<o>`, `--<c>`, `--<o_f>`) to change locus, or `!<e_o>` to start an output pipeline.

## Content contracts

- `<g>`: Stay conceptual. Snippets are allowed; do not emit full files or modules.
- `<q>`: Ask broad, uncertainty-reducing questions or provide diagnostic framing.
- `<o>`: Produce a realized deliverable and include assumptions, citations, and tests when relevant.
- `<c>`: Critique or clarify at fine context, targeting concrete deltas and asking no more than 25 questions.
- `<o_f>`: Produce the publishable final result with a brief rationale and acceptance checklist.

The runtime enforces structure: commands, wrappers, modifiers, counters, cycles, loci, footer fields, and wrapper placement. Meaning-level obligations such as concept-only behavior and citation quality remain model or evaluation concerns.

## Footer

`[Version=v1.5 | Tag=<tag>_<index> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<name>]`

`Sources` is `none` or `web`. `Assumptions` is a caller-declared non-negative integer. No text may appear outside the header, body, and footer.
