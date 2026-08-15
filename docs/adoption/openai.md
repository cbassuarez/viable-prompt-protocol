# Adoption — OpenAI

Install the repository plugin to load the `viable-prompt-protocol` skill and its remote MCP dependency together. The
skill invokes `vpp_prepare_turn`, generates body-only content, invokes `vpp_format_response`, and validates before
returning the reply. State stays in the calling conversation as auditable JSON.

For an application host, use [`examples/openai-responses.ts`](../../examples/openai-responses.ts) with the
provider-neutral adapter. It bypasses model generation for deterministic protocol errors and wraps every generated body
through the shared core.

Cloud applications can attach `https://mcp.viableprompt.org/mcp` as a remote MCP server. If remote MCP is unavailable,
map the four OpenAPI operations at `https://mcp.viableprompt.org/api/v1/openapi.json` as functions. Use the header
snippet only as a reduced-assurance fallback.
