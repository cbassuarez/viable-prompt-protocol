---
title: 'Install VPP'
description: 'Install the VPP v1.5 plugin, connect the remote MCP server, or use the portable Agent Skill.'
---

<!-- cSpell:ignore healthz -->
<!-- markdownlint-disable MD013 -->

Choose the complete plugin when your host supports plugins. It keeps the portable `viable-prompt-protocol` Agent Skill, production MCP connection, generated v1.5 references, and offline fallback together as one versioned install.

The public runtime is anonymous and requires no VPP account or API key.

## Codex and ChatGPT desktop

Until VPP is available in the public Plugins Directory, add the repository marketplace and install the plugin:

```bash
codex plugin marketplace add cbassuarez/viable-prompt-protocol
codex plugin add viable-prompt-protocol@viable-prompt-protocol
```

Restart the ChatGPT desktop app or begin a new Codex session so the skill and MCP tools are discovered. Start with a VPP command on line 1, such as `!<g>`, or explicitly invoke `$viable-prompt-protocol`.

This repository install is the same plugin package being prepared for OpenAI's public directory. After publication, users will be able to install it directly from the shared Plugins Directory in ChatGPT or Codex.

## Download the portable bundle

- [Download the complete plugin 1.1.0](/downloads/viable-prompt-protocol-plugin-1.1.0.zip) ([SHA-256](/downloads/viable-prompt-protocol-plugin-1.1.0.zip.sha256.txt))
- [Download the standalone Agent Skill 1.1.0](/downloads/viable-prompt-protocol-skill-1.1.0.zip) ([SHA-256](/downloads/viable-prompt-protocol-skill-1.1.0.zip.sha256.txt))

The complete archive contains the same plugin directory used by the repository marketplace. Use it for local inspection, a manual install, or distribution to another plugin-compatible host. The standalone archive is the portable skill tree for Agent Skills hosts and submission systems that accept a skill bundle directly.

Both include `scripts/vpp.mjs`, a deterministic offline fallback for hosts that cannot reach the remote service. Verify a downloaded artifact with its adjacent SHA-256 file when your installation process requires supply-chain verification.

## Connect the remote MCP server

Hosts with Streamable HTTP MCP support can connect directly:

```text
https://mcp.viableprompt.org/mcp
```

In ChatGPT developer mode, open Plugins, select the plus button, create a public MCP connection, and enter the complete URL above. Choose no authentication. The service exposes four read-only computation tools, five immutable v1.5 references, the `start-vpp` prompt, and one inline cycle controller attached only to validation results.

You can confirm that the production service is available at [`/healthz`](https://mcp.viableprompt.org/healthz). The MCP endpoint itself expects MCP requests; opening `/mcp` as an ordinary web page is not a functional test.

## Use the JSON or OpenAPI API

Cloud apps and hosts without remote MCP can use the equivalent stateless operations:

- `POST https://mcp.viableprompt.org/api/v1/prepare-turn`
- `POST https://mcp.viableprompt.org/api/v1/format-response`
- `POST https://mcp.viableprompt.org/api/v1/validate-exchange`
- `POST https://mcp.viableprompt.org/api/v1/validate-transcript`
- `GET https://mcp.viableprompt.org/api/v1/openapi.json`

Carry the returned `state` to the next exchange. Omit it only for a genuinely new conversation.

## What the runtime does with your content

The service receives the command, response, state, or transcript supplied to the selected operation and returns a deterministic structural result. It does not create an account, persist conversation state, or enable application-level request-body logging. Do not send secrets or personal data that are unnecessary for validation. Read the full [privacy policy](/privacy/) before using the public endpoint with sensitive workflows.

<a id="secondary-methods"></a>

## Secondary methods — reduced assurance

Read the [normative v1.5 specification](/spec/) when implementing another host adapter. Only when the host cannot install a skill, call MCP, or use the JSON operations should you use the [custom-instructions fallback](/custom-instructions/). That route is reduced assurance because the model must maintain and repair its own structural state.

Need help choosing an installation route? See [Support](/support/).

<!-- markdownlint-restore -->
