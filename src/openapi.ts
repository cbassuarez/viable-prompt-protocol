import stateSchema from "../protocol/v1.5/state.schema.json";
import { z } from "zod";
import {
  exchangeValidationSchema,
  formatInputSchema,
  formattedResponseSchema,
  prepareInputSchema,
  preparedTurnSchema,
  transcriptValidationSchema,
  validateExchangeInputSchema,
  validateTranscriptInputSchema
} from "./schemas";

const errorSchema = {
  type: "object",
  required: ["ok", "error"],
  properties: {
    ok: { const: false },
    error: {
      type: "object",
      required: ["code", "message"],
      properties: { code: { type: "string" }, message: { type: "string" } }
    }
  }
};

const requestBody = (schema: Record<string, unknown>) => ({
  required: true,
  content: { "application/json": { schema } }
});

const operation = (operationId: string, summary: string, requestRef: string, responseRef: string) => ({
  post: {
    operationId,
    summary,
    requestBody: requestBody({ $ref: requestRef }),
    responses: {
      "200": {
        description: "Deterministic VPP result",
        content: { "application/json": { schema: { $ref: responseRef } } }
      },
      "400": {
        description: "Invalid request or state",
        content: { "application/json": { schema: errorSchema } }
      },
      "413": { description: "Request body exceeds 256 KiB" },
      "429": { description: "Rate limit exceeded" }
    }
  }
});

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Viable Prompt Protocol API",
    version: "1.0.0",
    description: "Stateless deterministic operations for VPP protocol v1.5. Conversation state is client-carried JSON."
  },
  servers: [{ url: "https://mcp.viableprompt.org" }],
  paths: {
    "/api/v1/prepare-turn": operation(
      "vpp_prepare_turn",
      "Parse line 1 and resolve the next transition",
      "#/components/schemas/PrepareInput",
      "#/components/schemas/PreparedTurn"
    ),
    "/api/v1/format-response": operation(
      "vpp_format_response",
      "Normalize and wrap a model body",
      "#/components/schemas/FormatInput",
      "#/components/schemas/FormattedResponse"
    ),
    "/api/v1/validate-exchange": operation(
      "vpp_validate_exchange",
      "Validate or structurally repair one exchange",
      "#/components/schemas/ValidateExchangeInput",
      "#/components/schemas/ExchangeValidation"
    ),
    "/api/v1/validate-transcript": operation(
      "vpp_validate_transcript",
      "Reconstruct and validate transcript state",
      "#/components/schemas/ValidateTranscriptInput",
      "#/components/schemas/TranscriptValidation"
    ),
    "/healthz": {
      get: {
        operationId: "healthz",
        summary: "Service health and protocol version",
        responses: { "200": { description: "Healthy" } }
      }
    }
  },
  components: {
    schemas: {
      VppState: stateSchema,
      PrepareInput: z.toJSONSchema(prepareInputSchema),
      PreparedTurn: z.toJSONSchema(preparedTurnSchema),
      FormatInput: z.toJSONSchema(formatInputSchema),
      FormattedResponse: z.toJSONSchema(formattedResponseSchema),
      ValidateExchangeInput: z.toJSONSchema(validateExchangeInputSchema),
      ExchangeValidation: z.toJSONSchema(exchangeValidationSchema),
      ValidateTranscriptInput: z.toJSONSchema(validateTranscriptInputSchema),
      TranscriptValidation: z.toJSONSchema(transcriptValidationSchema),
      Error: errorSchema
    }
  }
} as const;
