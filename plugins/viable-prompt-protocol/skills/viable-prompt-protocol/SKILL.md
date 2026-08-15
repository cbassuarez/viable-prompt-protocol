---
name: viable-prompt-protocol
description: Enforce Viable Prompt Protocol v1.5 when line 1 contains an explicit VPP bang-tag command; when the user explicitly invokes this skill; or when asked to validate or repair VPP content. Use deterministic tools for tags, global counters, cycles, loci, wrappers, and footers while leaving semantic quality to the model.
---

# Viable Prompt Protocol

Treat the returned state as conversation state. Each tag has its own conversation-global index, and those counters continue across cycle and locus changes. Each restartable cycle owns its current locus and realized path. Omit state only for a genuinely new conversation.

1. Call `vpp_prepare_turn` with the complete user message, current state when available, and `next_locus` only when the user names a new locus.
2. If status is `protocol_error`, use `deterministic_body` and do not improvise. Otherwise generate body-only content that follows `content_contract`; do not add VPP wrappers.
3. Call `vpp_format_response` with the exact prepared turn, body, `sources`, and declared `assumption_count`.
4. Call `vpp_validate_exchange` on the original user message and formatted message. Return only a valid message. Use `repair: true` for structural failures, then validate the repair once more.
5. Carry the committed `state` into the next exchange.

Use `vpp_validate_transcript` for transcript-wide checks. The tools enforce structure, not claims such as concept-only compliance or citation quality; assess those separately.

If the remote MCP server is unavailable, pipe one JSON object to the bundled `scripts/vpp.mjs` with `prepare-turn`, `format-response`, `validate-exchange`, or `validate-transcript`. Follow the same sequence and do not simulate counters mentally when the script is runnable.

Read [protocol.md](references/protocol.md) for normative behavior, [failure-codes.md](references/failure-codes.md) when handling violations, [transcripts.md](references/transcripts.md) for examples, and [adoption.md](references/adoption.md) for host integration.
