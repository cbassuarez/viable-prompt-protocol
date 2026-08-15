<!-- cSpell:ignore vpp vppchat streamable Cloudflare Anthropic -->
# Viable Prompt Protocol (VPP)

[![Spec][badge-spec]][spec-doc]
[![License][badge-license]](#license)
[![CI][badge-ci]][ci-workflow]
[![Docs][badge-docs]][docs-site]

VPP v1.5 is a tagged, closed-loop protocol for auditable human–LLM conversations. Its primary integration is an
Agent Skill backed by a deterministic runtime, not a prose prompt asking the model to keep its own counters.

## Adopt with the skill and MCP

The distributable plugin lives at [`plugins/viable-prompt-protocol`](plugins/viable-prompt-protocol). It packages one
portable `viable-prompt-protocol` skill, an offline fallback script, OpenAI UI metadata, and a remote MCP connection.
Install that plugin in an agent host, or install the contained skill in any host that supports the
[Agent Skills specification](https://agentskills.io/specification).

```bash
codex plugin marketplace add cbassuarez/viable-prompt-protocol
codex plugin add viable-prompt-protocol@viable-prompt-protocol
```

The website also publishes deterministic [plugin](https://viableprompt.org/downloads/viable-prompt-protocol-plugin-1.1.0.zip)
and [standalone skill](https://viableprompt.org/downloads/viable-prompt-protocol-skill-1.1.0.zip) archives.

The enforced workflow is:

1. `vpp_prepare_turn` parses line 1 and proposes transparent conversation state.
2. The host asks its model for body-only content under the returned contract.
3. `vpp_format_response` removes duplicate wrappers and commits the exact header, footer, cycle, locus, and global tag index.
4. `vpp_validate_exchange` verifies the result before the host returns it.

The plugin targets `https://mcp.viableprompt.org/mcp`. Equivalent JSON operations are `/api/v1/prepare-turn`,
`/format-response`, `/validate-exchange`, and `/validate-transcript`; OpenAPI is `/api/v1/openapi.json`. The bundled
offline script remains available when the remote service is unavailable.

```bash
npm install
npm run generate:vpp
npm run build:skill-script
printf '%s' '{"message":"!<g>\nDesign a resilient queue."}' \
  | node plugins/viable-prompt-protocol/skills/viable-prompt-protocol/scripts/vpp.mjs prepare-turn
```

Conversation state is client-carried JSON. A new conversation begins with no state and zero per-tag counters. Returned
state must be reused on later turns; each tag index continues across all cycles and loci, while each restartable cycle
owns its current locus and realized traversal path.

## Runtime and hosting

- Canonical protocol source: [`protocol/v1.5/manifest.json`](protocol/v1.5/manifest.json)
- Client-carried state schema: [`protocol/v1.5/state.schema.json`](protocol/v1.5/state.schema.json)
- Pure deterministic core: [`src/core.ts`](src/core.ts)
- Provider-neutral host adapter: [`src/adapter.ts`](src/adapter.ts)
- Cloudflare Worker and MCP server: [`src/worker.ts`](src/worker.ts), [`src/mcp.ts`](src/mcp.ts)
- OpenAI Responses example: [`examples/openai-responses.ts`](examples/openai-responses.ts)
- Provider recipes: [`docs/adoption/openai.md`](docs/adoption/openai.md),
  [`docs/adoption/anthropic.md`](docs/adoption/anthropic.md), and
  [`docs/adoption/gemini.md`](docs/adoption/gemini.md)

The Worker is stateless, anonymous, read-only, size-limited, and rate-limited. It has no server-side conversation
persistence and its configuration disables request sampling. Callers remain responsible for semantic contracts and for
declaring source mode and assumption count honestly.

## Reduced-assurance custom-instruction fallback

If a host cannot run skills, MCP, JSON functions, or the offline script, use
[`docs/spec/v1.5/header-snippet.txt`](docs/spec/v1.5/header-snippet.txt). This fallback describes the same protocol but
cannot deterministically guarantee counters, transitions, or wrapper repair.

## Compatibility

Protocol v1.4 artifacts and historical corpus sessions remain unchanged. `corpus/v1.5` is a separate corpus-schema
version; it is not the VPP protocol v1.5 manifest. Generated latest aliases point to protocol v1.5 without rewriting the
v1.4 archive.

## Development and verification

Requires Node 22 or newer.

```bash
npm ci
npm run check:generated
npm run typecheck
npm run test:vpp
npm run test:parser
npm run validate
npm run validate:vpp-artifacts
npm run check:plugin-package
npm run docs:build
npm run build:worker
```

`npm run build:worker` performs a Cloudflare dry run only. Production deployment uses `npm run deploy:production`.

After Cloudflare authentication is available, the rollout commands are `npm run deploy:preview`,
`VPP_BASE_URL=https://PREVIEW_ORIGIN npm run smoke:remote`, and
`VPP_MCP_URL=https://PREVIEW_ORIGIN/mcp OPENAI_MODEL=MODEL npm run smoke:openai-mcp`. The preview command deploys a
separate `viable-prompt-protocol-preview` Worker. See
[`docs/deployment-and-submission.md`](docs/deployment-and-submission.md) for the Squarespace-to-Cloudflare DNS cutover,
Custom Domain, domain challenge, and public Plugins Directory submission packet.

## License

Code is MIT licensed. Documentation and examples are CC BY 4.0 where noted.

<!-- markdownlint-disable MD013 -->
[badge-spec]: https://img.shields.io/badge/spec-v1.5-blue
[badge-license]: https://img.shields.io/badge/license-MIT%20%2B%20CC%20BY%204.0-black
[badge-ci]: https://github.com/cbassuarez/viable-prompt-protocol/actions/workflows/ci.yml/badge.svg
[badge-docs]: https://img.shields.io/badge/docs-GitHub%20Pages-informational
[spec-doc]: docs/spec/v1.5/spec.md
[ci-workflow]: https://github.com/cbassuarez/viable-prompt-protocol/actions/workflows/ci.yml
[docs-site]: https://viableprompt.org/
<!-- markdownlint-restore -->
