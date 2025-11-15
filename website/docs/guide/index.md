---
title: 'Guide'
---

## Tags and loci

Tags establish the locus and intent for each participant.
Begin with `<g>` to gather context, pivot to `<q>` for framing problems, and progress to `<o>` when you are ready to receive
deliverables. Loci labels—either implicit in the tag or explicit in modifiers—identify who owns the action (human researcher,
assistant analyst, reviewer).

## Modifiers

Modifiers provide nuance.
Combine `--major` with `<c>` to demand substantial revisions, or use `--correct` when closing a critique cycle.
Custom modifiers such as `--assumptions=3` or `--draft` travel with the command to inform downstream processing.
When in doubt, keep modifiers sparse to reduce ambiguity.

## Pipelines and cycles

Most VPP workflows iterate through three-cycle loops.
A canonical pipeline is `<g> → <q> → <o> → <c> → <o_f>`.
You may branch by appending `--<tag>` modifiers, instructing the assistant to jump to a different locus on the next turn.
Track cycle counts in the footer to ensure you are progressing or resetting intentionally.

## Error modes

When something goes wrong, reach for `<e>` or `<e_o>`.
The assistant should emit `<e>` on protocol violations, unclear instructions, or conflicting modifiers.
Operators use `<e_o>` when they recognize their own misstep.
After acknowledging the error, return to a stable tag (`<g>` or `<q>`) with corrective modifiers.

## Implementation notes

- Mirror the user’s tag at the top of every assistant response.
- Validate modifier combinations before generating content.
- Always end with the compliance footer; treat missing fields as bugs.
- For integrations, pre-fill header snippets and footer templates to minimize user error.
- Log each cycle alongside footer data to power analytics and audits.
