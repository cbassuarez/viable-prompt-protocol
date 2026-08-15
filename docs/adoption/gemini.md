# Adoption — Google Gemini

Attach `https://mcp.viableprompt.org/mcp` when the Gemini host supports remote MCP. Otherwise convert
`https://mcp.viableprompt.org/api/v1/openapi.json` into function declarations and enforce the same sequence: prepare,
body-only generation, format, then validate.

Carry returned state in application conversation storage. Tag counters are global to that conversation and continue when
loci change; the server stores no state. Treat `content_contract` as the generation instruction and never allow the model
to supply its own header, footer, cycle, or counter. The generated header snippet is a reduced-assurance fallback for
hosts without tools.
