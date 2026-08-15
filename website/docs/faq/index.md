---
title: 'FAQ'
---

## How do I add VPP to my prompts?

Install the VPP plugin or portable Agent Skill, then start a conversation with
`!<tag> [--modifier ...]` on line 1. The skill uses the deterministic MCP
runtime to prepare, format, and validate each exchange. See the
[installation guide](/install/).

If the host has no skill or tool support, the
[custom-instructions block](/custom-instructions/) remains available as a
reduced-assurance fallback.

## What if the model ignores the footer?

The installed skill calls `vpp_validate_exchange` and can request structural
repair before returning the result. In the custom-instructions fallback,
treat a missing or malformed footer as a protocol violation and request
correction.

## Can I extend the tag set?

Yes, but version the extension and document new tags in your implementation notes. Keep the core tags intact so other
participants can interoperate.

## Does VPP work with non-OpenAI models?

Yes. Use the remote MCP endpoint when the host supports it, or the JSON/OpenAPI
operations otherwise. The same deterministic core can wrap output from OpenAI,
Anthropic, Gemini, or another provider.

## Are tag indexes local to a locus?

No. In v1.5, each tag's index is conversation-global and continues across
loci. A locus or pipeline transition resets the cycle, not the counters.
Starting a new conversation with no prior state resets every counter to zero.

## How should I handle multi-agent scenarios?

Carry one auditable `VppState` object across the orchestration boundary. Assign
safe locus names for handoffs and let the runtime advance the global tag
counters. Consult the normative spec when designing host-specific
orchestration.
