---
title: 'Guide'
---

<!-- markdownlint-disable MD013 -->

## Start a conversation

Put a VPP command on line 1 and the request body on later lines:

```text
!<g>
Design a resilient queue.
```

The skill prepares the turn through the deterministic runtime, asks the model for body-only content, formats it, validates it, and carries the returned state to the next exchange.

## Tags and content contracts

- `<g>` stays conceptual and avoids complete modules or files.
- `<q>` asks broad uncertainty-reducing questions or frames a diagnosis.
- `<o>` realizes a deliverable and includes assumptions, citations, and tests when relevant.
- `<c>` critiques or clarifies concrete deltas, with at most 25 questions.
- `<o_f>` produces the publishable final result and closes the current pipeline.
- `!<e> --<tag>` moves to a new locus; `!<e_o>` starts an immediate `<o>` pipeline.

The runtime enforces tag selection and wrapper structure. It cannot prove semantic quality, citation relevance, or whether a conceptual answer accidentally became a full implementation.

## Counters, cycles, and loci

Tag indexes are global to one conversation. If `<g_1>` is followed by a locus jump that also produces `<g>`, the next footer says `Tag=g_2`. A new conversation starts every counter at zero.

Cycle begins at 1. Every valid user `!<c>` advances it, capped at 3. A new-locus escape, immediate-output escape, explicit pipeline, or new command after `<o_f>` resets cycle to 1 but preserves tag counts. Cycle-3 formatting automatically adds both canonical escape choices when they are absent.

The default locus is `default`. An unnamed jump becomes `locus-2`, then `locus-3`, and so on. Applications can supply a safe explicit name with `next_locus`.

## Modifiers and recovery

Supported ordinary modifiers are `--correct`, `--incorrect`, `--minor`, and `--major`. Pipeline destinations are limited to assistant tags and use angle brackets. Duplicate modifiers, contradictory pairs, and invalid destinations deterministically produce `<c>` recovery; the host does not call the model for that body.

## Implementation options

Use remote MCP when the host supports it. Otherwise use the JSON/OpenAPI operations or the provider-neutral adapter. The bundled offline script exposes the same four operations. Custom instructions are available only as a reduced-assurance fallback.

See the [normative v1.5 specification](/spec/) and the repository [adoption recipes](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/docs/adoption).

<!-- markdownlint-restore -->
