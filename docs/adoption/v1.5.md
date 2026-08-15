<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
# Adopt VPP v1.5

Use the packaged `viable-prompt-protocol` skill and its remote MCP dependency. The required host sequence is:

1. Call `vpp_prepare_turn` with the user message and client-carried state.
2. Generate body-only content under `content_contract`, unless the prepared turn supplies `deterministic_body`.
3. Call `vpp_format_response` with the prepared turn, body, source mode, and assumption count.
4. Call `vpp_validate_exchange` before returning the message.

The MCP endpoint is `https://mcp.viableprompt.org/mcp`. Equivalent stateless JSON operations live under `https://mcp.viableprompt.org/api/v1/`; OpenAPI is at `/api/v1/openapi.json`.

Conversation state is transparent JSON carried by the client. Send no state to begin a new conversation. Reuse returned state for the next turn. The service keeps no conversation state and is designed not to log request bodies.

Use the bundled offline CLI only if remote MCP and JSON are unavailable. Custom instructions are a reduced-assurance fallback because a model cannot reliably enforce counters and transitions from prose alone.
