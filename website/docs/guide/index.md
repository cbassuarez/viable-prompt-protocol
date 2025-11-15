---
title: 'Guide'
---

## Tags and loci

Every user turn starts with `!<tag>` on the first line. The assistant mirrors that
tag (e.g., `<g>`). Tags map to loci defined in the header snippet and spec:

- `<g>` — concept gathering; share context, snippets, or requirements without full deliverables.
- `<q>` — rough-context questioning and diagnostics; ask broad questions to establish direction.
- `<o>` — realized drafts that include assumptions, citations, and tests when relevant.
- `<c>` — fine-context critique or clarification; probe gaps and request adjustments.
- `<o_f>` — final delivery stage; any `<o>` turn can also be an `<o_f>` when the work is ready to ship.
- `<e>` / `<e_o>` — escape tags that redirect the conversation when you need to jump elsewhere in the loop.

Modifiers or footer metadata can further label who owns a locus (for example,
`Locus=assistant-analyst`).

## Modifiers

Modifiers provide nuance on the same first line as the tag. VPP reserves:

- `--correct` and `--incorrect`
- `--minor` and `--major`
- `--<tag>` (paired with `!<o> --correct` or `!<e>`)

Additional structured flags (e.g., `--assumptions=3`) are allowed but should be
documented in your project so downstream tooling can interpret them. Keep
modifiers sparse to avoid conflicting instructions.

## Pipelines and cycles

The loop is flexible—`<g> → <q> → <o> → <c> → … → <o_f>` in any order or length.
After three cycles the assistant proposes an escape (`!<e> --<tag>` or `!<e_o>`) as
outlined in the header snippet. Use the footer’s `Cycle=<i>/3` field to keep track
of progress and resets.

## Escapes

`<e>` is an escape tag paired with a modifier (`!<e> --<g>`, `!<e> --<q>`, etc.) to
redirect the conversation to another locus. `<e_o>` is the dedicated form for
immediate transitions into `<o>`. Use these escapes when the current loop needs
to jump to a different phase without violating the grammar. Refer to the
[normative spec](https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/spec/latest/spec.md)
for the full grammar and validation rules.

## Implementation notes

- Mirror the user’s tag at the top of every assistant response.
- Validate modifier combinations before generating content.
- Always end with the compliance footer; treat missing fields as bugs.
- Store the header snippet in custom instructions or the system prompt so each
  conversation starts from the same contract.
- Log each cycle alongside footer data to power analytics and audits.
