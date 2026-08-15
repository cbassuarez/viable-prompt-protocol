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

export function createVppMcpServer(): McpServer {
  const server = new McpServer(
    { name: "viable-prompt-protocol", title: "Viable Prompt Protocol", version: "1.0.0" },
    {
      instructions:
        "Use vpp_prepare_turn, generate body-only content under its contract, call vpp_format_response, then vpp_validate_exchange. Carry returned state to the next turn.",
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
      description: "Parse only line 1 of a VPP message, resolve the deterministic transition, and propose transparent client-carried state without persisting it.",
      inputSchema: prepareInputSchema,
      outputSchema: preparedTurnSchema,
      annotations
    },
    async ({ message, state, next_locus }) => toolResult(prepareTurn(message, state, next_locus) as unknown as Record<string, unknown>)
  );

  server.registerTool(
    "vpp_format_response",
    {
      title: "Format VPP response",
      description: "Normalize a model-generated body, remove duplicate VPP wrappers, inject required cycle-3 escapes, and add the canonical v1.5 header and footer.",
      inputSchema: formatInputSchema,
      outputSchema: formattedResponseSchema,
      annotations
    },
    async ({ prepared_turn, body, sources, assumption_count }) =>
      toolResult(formatResponse(prepared_turn, body, sources, assumption_count) as unknown as Record<string, unknown>)
  );

  server.registerTool(
    "vpp_validate_exchange",
    {
      title: "Validate VPP exchange",
      description: "Validate one VPP user-assistant exchange, report structural violations, and optionally repair wrappers while preserving the response body.",
      inputSchema: validateExchangeInputSchema,
      outputSchema: exchangeValidationSchema,
      annotations
    },
    async (input) => toolResult(validateExchange(input) as unknown as Record<string, unknown>)
  );

  server.registerTool(
    "vpp_validate_transcript",
    {
      title: "Validate VPP transcript",
      description: "Validate a VPP transcript, reconstruct conversation-global counters and client-carried state, and report structural violations by turn.",
      inputSchema: validateTranscriptInputSchema,
      outputSchema: transcriptValidationSchema,
      annotations
    },
    async (input) => toolResult(validateTranscript(input) as unknown as Record<string, unknown>)
  );

  registerTextResource(server, "vpp-v1.5-spec", "vpp://v1.5/spec", "VPP v1.5 specification", "text/markdown", generatedSpecText);
  registerTextResource(server, "vpp-v1.5-manifest", "vpp://v1.5/manifest", "VPP v1.5 manifest", "application/json", generatedManifestText);
  registerTextResource(server, "vpp-v1.5-header", "vpp://v1.5/header-snippet", "VPP v1.5 fallback header", "text/plain", generatedHeaderText);
  registerTextResource(server, "vpp-v1.5-state", "vpp://v1.5/state-schema", "VPP v1.5 state schema", "application/schema+json", generatedStateSchemaText);
  registerTextResource(server, "vpp-v1.5-adoption", "vpp://v1.5/adoption", "VPP v1.5 adoption guide", "text/markdown", generatedAdoptionText);

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
