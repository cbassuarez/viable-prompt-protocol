---
layout: home
title: 'Viable Prompt Protocol (VPP)'
titleTemplate: 'Viable Prompt Protocol (VPP)'
description: 'Install VPP v1.5 as a portable skill backed by deterministic MCP and JSON tools for reliable conversation structure.'
hero:
  name: 'VPP v1.5'
  text: 'Keep agent conversations structured—reliably.'
  tagline: 'One portable skill gives the model the workflow. A stateless runtime enforces tags, global counters, cycles, loci, wrappers, and validation.'
  actions:
    - theme: brand
      text: Install VPP
      link: /install/
    - theme: alt
      text: Download bundle
      link: /downloads/viable-prompt-protocol-plugin-1.0.0.zip
    - theme: alt
      text: Read the v1.5 spec
      link: /spec/
features:
  - icon: '🧭'
    title: 'Portable workflow'
    details: 'Install one Agent Skill in ChatGPT, Codex, or another compatible host. The plugin includes its MCP connection and offline fallback.'
  - icon: '⚙️'
    title: 'Deterministic structure'
    details: 'Pure operations parse commands, advance state, format responses, repair wrappers, and validate complete transcripts.'
  - icon: '🔌'
    title: 'Shared everywhere'
    details: 'Agent hosts use remote MCP. Cloud LLMs and custom apps can call the same versioned JSON/OpenAPI operations.'
---

<!-- markdownlint-disable MD013 -->

## VPP is a protocol, a skill, and a runtime

VPP gives a person and an AI a small shared vocabulary for exploring a goal, asking questions, producing work, critiquing it, and closing the loop. Version 1.5 turns that vocabulary into an installable system: a concise Agent Skill tells the host when and how to use VPP, while a deterministic runtime owns the structural details that language models handle inconsistently on their own.

[Install the complete plugin](/install/) to get the portable skill, production MCP connection, generated v1.5 references, and bundled offline CLI together. No account or API key is required for the public runtime.

The enforced host sequence is:

1. Prepare the user turn through `vpp_prepare_turn`.
2. Generate body-only content under the returned contract.
3. Commit the exact wrapper and state through `vpp_format_response`.
4. Check the exchange through `vpp_validate_exchange` before returning it.

State stays transparent and travels with the client. Tag indexes are conversation-global and continue across loci. New loci and pipelines reset the cycle, never the global counters. Sending no prior state begins a genuinely new conversation with every counter at zero.

**Ready to use:** [Install VPP](/install/) · [Download plugin 1.0.0](/downloads/viable-prompt-protocol-plugin-1.0.0.zip) · [Download standalone skill](/downloads/viable-prompt-protocol-skill-1.0.0.zip)

The public-directory submission for ChatGPT and Codex is in preparation. Until it is approved, install from the repository marketplace, download the bundle, or connect directly to the production MCP endpoint.

## Public interfaces

- Remote MCP: `https://mcp.viableprompt.org/mcp`
- JSON base: `https://mcp.viableprompt.org/api/v1`
- OpenAPI: `https://mcp.viableprompt.org/api/v1/openapi.json`
- Health: `https://mcp.viableprompt.org/healthz`

The four operations are `vpp_prepare_turn`, `vpp_format_response`, `vpp_validate_exchange`, and `vpp_validate_transcript`. The MCP server also exposes immutable v1.5 references and a reusable `start-vpp` prompt. It is anonymous, stateless, read-only, rate-limited, and designed without request-body telemetry or server-side conversation persistence.

## Keep the spec and custom-instruction routes

The [normative v1.5 specification](/spec/) remains the source for human review and independent implementations. The generated [custom-instructions block](/custom-instructions/) remains available for hosts without skills or tools. It cannot deterministically maintain counters or repair malformed output, so it is deliberately a secondary, reduced-assurance method.

## Repository map

- [`protocol/v1.5/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/protocol/v1.5) — normative manifest and schemas.
- [`plugins/viable-prompt-protocol/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/plugins/viable-prompt-protocol) — distributable skill and plugin.
- [`src/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/src) — core, adapter, MCP, OpenAPI, and Worker.
- [`corpus/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/corpus) — historical and corpus-schema-versioned sessions.
- [`experiments/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments) — protocol-retention and task-utility experiments.

## What is enforced

The runtime enforces commands, tag selection, global indexes, cycles, loci, footers, wrapper placement, deterministic recovery, and structural repair. Meaning-level obligations—such as whether an answer is genuinely concept-only or whether its citations are good—remain model and evaluation concerns.

## Publisher and support

Viable Prompt Protocol is an open-source project published by Seb Suarez. See [Support](/support/) for help and contact information, [Privacy](/privacy/) for the public runtime's data practices, and [Terms](/terms/) for service terms.

<!-- markdownlint-restore -->
