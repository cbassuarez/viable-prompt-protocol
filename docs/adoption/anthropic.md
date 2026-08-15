# Adoption — Anthropic

Prefer a remote MCP connection to `https://mcp.viableprompt.org/mcp` when the selected Anthropic host supports
Streamable HTTP MCP. Give the model the concise skill workflow, but keep state and all structural operations in the MCP
calls.

When remote MCP is unavailable, expose the four JSON/OpenAPI operations as tools:

1. Call `/api/v1/prepare-turn` with the full user message and prior state.
2. Ask Claude for body-only content under `content_contract`.
3. Call `/api/v1/format-response` with that body.
4. Call `/api/v1/validate-exchange` and return only a valid result.

Do not ask the model to increment counters or infer locus state. Persist the returned public state with the conversation.
Use the generated header snippet only as a reduced-assurance fallback.
