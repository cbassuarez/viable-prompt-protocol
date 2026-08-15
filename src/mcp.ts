import { McpServer, createMcpHandler, preloadSchemas } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  formatResponse,
  prepareTurn,
  validateExchange,
  validateTranscript,
  VppInputError
} from "./core";
import {
  generatedAdoptionText,
  generatedHeaderText,
  generatedManifestText,
  generatedSpecText,
  generatedStateSchemaText
} from "./generated-content";
import {
  formatInputSchema,
  exchangeValidationSchema,
  formattedResponseSchema,
  prepareInputSchema,
  preparedTurnSchema,
  transcriptValidationSchema,
  validateExchangeInputSchema,
  validateTranscriptInputSchema
} from "./schemas";
import {
  CYCLE_CONTROLLER_MIME_TYPE,
  CYCLE_CONTROLLER_URI,
  cycleControllerHtml
} from "./widget-resource";

preloadSchemas();

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
} as const;

function toolResult(value: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value
  };
}

function registerTextResource(server: McpServer, name: string, uri: string, title: string, mimeType: string, text: string) {
  server.registerResource(
    name,
    uri,
    { title, mimeType, cacheHint: { ttlMs: 31_536_000_000, cacheScope: "public" } },
    async (resourceUri) => ({ contents: [{ uri: resourceUri.href, mimeType, text }] })
  );
}

function toolMeta(invoking: string, invoked: string, rendersController = false) {
  return {
    "openai/toolInvocation/invoking": invoking,
    "openai/toolInvocation/invoked": invoked,
    ...(rendersController
      ? {
          ui: { resourceUri: CYCLE_CONTROLLER_URI },
          "openai/outputTemplate": CYCLE_CONTROLLER_URI
        }
      : {})
  };
}

export function createVppMcpServer(): McpServer {
  const server = new McpServer(
    { name: "viable-prompt-protocol", title: "Viable Prompt Protocol", version: "1.1.0" },
    {
      instructions:
        "Use vpp_prepare_turn, generate body-only content under its contract, call vpp_format_response, then vpp_validate_exchange. Carry returned canonical state to the next turn. Tag counters are per-tag and conversation-global; each cycle owns its locus and active path.",
      cacheHints: {
        "tools/list": { ttlMs: 86_400_000, cacheScope: "public" },
        "resources/list": { ttlMs: 86_400_000, cacheScope: "public" },
        "prompts/list": { ttlMs: 86_400_000, cacheScope: "public" },
        "server/discover": { ttlMs: 86_400_000, cacheScope: "public" }
      }
    }
  );

  // Registration order is part of the public discovery contract.
  server.registerTool(
    "vpp_prepare_turn",
    {
      title: "Prepare VPP turn",
      description: "Use this when a VPP command on line 1 needs deterministic parsing, transition resolution, and proposed client-carried state.",
      inputSchema: prepareInputSchema,
      outputSchema: preparedTurnSchema,
      annotations,
      _meta: toolMeta("Preparing VPP turn…", "Turn prepared")
    },
    async ({ message, state, next_locus }) => toolResult(prepareTurn(message, state, next_locus) as unknown as Record<string, unknown>)
  );

  server.registerTool(
    "vpp_format_response",
    {
      title: "Format VPP response",
      description: "Use this after preparing a VPP turn to normalize body-only model output and add the canonical v1.5 wrapper, footer, and committed state.",
      inputSchema: formatInputSchema,
      outputSchema: formattedResponseSchema,
      annotations,
      _meta: toolMeta("Formatting VPP response…", "Response formatted")
    },
    async ({ prepared_turn, body, sources, assumption_count }) =>
      toolResult(formatResponse(prepared_turn, body, sources, assumption_count) as unknown as Record<string, unknown>)
  );

  server.registerTool(
    "vpp_validate_exchange",
    {
      title: "Validate VPP exchange",
      description: "Use this when one VPP exchange needs structural validation or a body-preserving wrapper repair; the result also renders the cycle controller.",
      inputSchema: validateExchangeInputSchema,
      outputSchema: exchangeValidationSchema,
      annotations,
      _meta: toolMeta("Checking VPP exchange…", "Exchange checked", true)
    },
    async (input) => toolResult(validateExchange(input) as unknown as Record<string, unknown>)
  );

  server.registerTool(
    "vpp_validate_transcript",
    {
      title: "Validate VPP transcript",
      description: "Use this when a VPP transcript needs state reconstruction and turn-indexed structural diagnostics; the result also renders cycle and locus history.",
      inputSchema: validateTranscriptInputSchema,
      outputSchema: transcriptValidationSchema,
      annotations,
      _meta: toolMeta("Checking VPP transcript…", "Transcript checked", true)
    },
    async (input) => toolResult(validateTranscript(input) as unknown as Record<string, unknown>)
  );

  registerTextResource(server, "vpp-v1.5-spec", "vpp://v1.5/spec", "VPP v1.5 specification", "text/markdown", generatedSpecText);
  registerTextResource(server, "vpp-v1.5-manifest", "vpp://v1.5/manifest", "VPP v1.5 manifest", "application/json", generatedManifestText);
  registerTextResource(server, "vpp-v1.5-header", "vpp://v1.5/header-snippet", "VPP v1.5 fallback header", "text/plain", generatedHeaderText);
  registerTextResource(server, "vpp-v1.5-state", "vpp://v1.5/state-schema", "VPP v1.5 state schema", "application/schema+json", generatedStateSchemaText);
  registerTextResource(server, "vpp-v1.5-adoption", "vpp://v1.5/adoption", "VPP v1.5 adoption guide", "text/markdown", generatedAdoptionText);
  server.registerResource(
    "vpp-cycle-controller",
    CYCLE_CONTROLLER_URI,
    { title: "VPP cycle controller", mimeType: CYCLE_CONTROLLER_MIME_TYPE },
    async (resourceUri) => ({
      contents: [
        {
          uri: resourceUri.href,
          mimeType: CYCLE_CONTROLLER_MIME_TYPE,
          text: cycleControllerHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              domain: "https://mcp.viableprompt.org",
              csp: { connectDomains: [], resourceDomains: [] }
            },
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": "https://mcp.viableprompt.org",
            "openai/widgetCSP": { connect_domains: [], resource_domains: [] },
            "openai/widgetDescription":
              "Compact VPP controls for the active cycle path, next mode, flags, locus, and exact follow-up command."
          }
        }
      ]
    })
  );

  server.registerPrompt(
    "start-vpp",
    {
      title: "Start a VPP conversation",
      description: "Create the first valid VPP command for a requested goal.",
      argsSchema: z.object({ goal: z.string().describe("The goal to explore under VPP"), starting_tag: z.enum(["g", "q", "o", "c", "o_f"]).default("g") })
    },
    ({ goal, starting_tag }) => ({
      messages: [
        {
          role: "user" as const,
          content: { type: "text" as const, text: `!<${starting_tag}>\n${goal}` }
        }
      ]
    })
  );

  return server;
}

export const vppMcpHandler = createMcpHandler(() => createVppMcpServer(), {
  legacy: "stateless",
  responseMode: "json"
});

export function isVppInputError(error: unknown): error is VppInputError {
  return error instanceof VppInputError;
}
