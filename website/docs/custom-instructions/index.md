---
title: 'Custom instructions fallback'
description: 'Reduced-assurance VPP v1.5 instructions for hosts without skills, MCP, or JSON tools.'
---

<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
<!-- markdownlint-disable MD013 -->

Use this route only when your host cannot install the VPP plugin or skill and cannot call the remote MCP or JSON API. Prose instructions cannot reliably maintain conversation-global counters, enforce state transitions, or repair wrappers.

Copy the complete block into the host's system prompt or custom instructions:

```text
Viable Prompt Protocol v1.5 (reduced-assurance fallback):

Parse only line 1 as !<tag> plus optional modifiers. User tags are g,q,o,c,o_f,e,e_o. Assistant tags are limited to g,q,o,c,o_f. Reject duplicate or contradictory modifiers and invalid pipeline destinations with <c> recovery. Mirror ordinary tags; !<e> --<tag> starts a named/new locus, !<e_o> routes to <o>, and !<o> --correct --<tag> starts a pipeline.

Track state per conversation. Tag indexes are per-tag, conversation-global, and continue across cycles and loci. A cycle is one restartable DAG traversal with its own locus and active path. A valid user !<c> is formatted at the current cycle and closes it; the next valid ordinary command opens the next cycle, capped at 3. Locus escapes, immediate-output escapes, explicit pipelines, and a new valid command after <o_f> start at cycle 1 without resetting tag counts. Add both escape choices only when a valid !<c> closes cycle 3. Default locus is default; unnamed jumps are locus-2, locus-3, etc.

Every reply must be exactly:
<assistant_tag>
body
[Version=v1.5 | Tag=<tag>_<index> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<name>]

Prefer the viable-prompt-protocol skill plus https://mcp.viableprompt.org/mcp; this text cannot deterministically enforce state.
```

Then begin a new conversation with a VPP command on line 1, for example:

```text
!<g>
Explore a robust queue design.
```

For deterministic enforcement, [install the plugin](/install/) or connect to `https://mcp.viableprompt.org/mcp`. The [v1.5 specification](/spec/) remains the normative human-readable reference.

<!-- markdownlint-restore -->
