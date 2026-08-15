import { hostHeaderValidationResponse, originValidationResponse } from "@modelcontextprotocol/server";
import { ZodError } from "zod";
import { formatResponse, prepareTurn, validateExchange, validateTranscript, VppInputError } from "./core";
import { vppMcpHandler } from "./mcp";
import { openApiDocument } from "./openapi";
import {
  formatInputSchema,
  prepareInputSchema,
  validateExchangeInputSchema,
  validateTranscriptInputSchema
} from "./schemas";

const MAX_BODY_BYTES = 262_144;
const API_PREFIX = "/api/v1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};

export interface Env {
  VPP_RATE_LIMITER?: { limit(input: { key: string }): Promise<{ success: boolean }> };
  OPENAI_APPS_CHALLENGE?: string;
}

function json(value: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return Response.json(value, {
    status,
    headers: { ...corsHeaders, "Cache-Control": "no-store", ...extraHeaders }
  });
}

async function enforceBodyLimit(request: Request): Promise<Response | null> {
  if (request.method !== "POST") return null;
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return json({ ok: false, error: { code: "body-too-large", message: "Request body exceeds 256 KiB." } }, 413);
  }
  const body = await request.clone().arrayBuffer();
  if (body.byteLength > MAX_BODY_BYTES) {
    return json({ ok: false, error: { code: "body-too-large", message: "Request body exceeds 256 KiB." } }, 413);
  }
  return null;
}

async function applyRateLimit(request: Request, env: Env): Promise<Response | null> {
  if (!env.VPP_RATE_LIMITER) return null;
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const path = new URL(request.url).pathname;
  const result = await env.VPP_RATE_LIMITER.limit({ key: `${ip}:${path}` });
  return result.success
    ? null
    : json(
        { ok: false, error: { code: "rate-limit-exceeded", message: "Rate limit exceeded; retry later." } },
        429,
        { "Retry-After": "60" }
      );
}

async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new VppInputError("invalid-json", "Request body must be valid JSON.");
  }
}

async function handleApi(request: Request, pathname: string): Promise<Response> {
  if (request.method !== "POST") return json({ ok: false, error: { code: "method-not-allowed", message: "Use POST." } }, 405, { Allow: "POST" });
  const raw = await parseJson(request);
  switch (pathname) {
    case `${API_PREFIX}/prepare-turn`: {
      const input = prepareInputSchema.parse(raw);
      return json(prepareTurn(input.message, input.state, input.next_locus));
    }
    case `${API_PREFIX}/format-response`: {
      const input = formatInputSchema.parse(raw);
      return json(formatResponse(input.prepared_turn, input.body, input.sources, input.assumption_count));
    }
    case `${API_PREFIX}/validate-exchange`: {
      const input = validateExchangeInputSchema.parse(raw);
      return json(validateExchange(input));
    }
    case `${API_PREFIX}/validate-transcript`: {
      const input = validateTranscriptInputSchema.parse(raw);
      return json(validateTranscript(input));
    }
    default:
      return json({ ok: false, error: { code: "not-found", message: "API operation not found." } }, 404);
  }
}

export async function handleRequest(request: Request, env: Env = {}): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (url.pathname === "/.well-known/openai-apps-challenge") {
    if (request.method !== "GET") {
      return new Response("Use GET.", { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store" } });
    }
    if (!env.OPENAI_APPS_CHALLENGE) {
      return new Response("Not configured.", { status: 404, headers: { "Cache-Control": "no-store" } });
    }
    return new Response(env.OPENAI_APPS_CHALLENGE, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
  if (url.pathname === "/healthz") {
    return json({ ok: true, service_version: "1.0.0", protocol_version: "v1.5", stateful: false }, 200, { "Cache-Control": "public, max-age=60" });
  }
  if (url.pathname === `${API_PREFIX}/openapi.json`) {
    return json(openApiDocument, 200, { "Cache-Control": "public, max-age=3600" });
  }

  const limited = await enforceBodyLimit(request);
  if (limited) return limited;
  const rateLimited = await applyRateLimit(request, env);
  if (rateLimited) return rateLimited;

  try {
    if (url.pathname === "/mcp") {
      const allowedServiceHost =
        url.hostname === "mcp.viableprompt.org" ||
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname.endsWith(".workers.dev");
      if (!allowedServiceHost) {
        return json({ ok: false, error: { code: "invalid-host", message: "Host is not allowed." } }, 403);
      }
      const allowedHosts = [url.hostname, "mcp.viableprompt.org", "localhost", "127.0.0.1"];
      const allowedOrigins = [
        "mcp.viableprompt.org",
        "viableprompt.org",
        "chatgpt.com",
        "claude.ai",
        "gemini.google.com",
        "localhost",
        "127.0.0.1"
      ];
      const rejected = hostHeaderValidationResponse(request, allowedHosts) ?? originValidationResponse(request, allowedOrigins);
      if (rejected) return rejected;
      return vppMcpHandler.fetch(request);
    }
    if (url.pathname.startsWith(`${API_PREFIX}/`)) return await handleApi(request, url.pathname);
    return json({ ok: false, error: { code: "not-found", message: "Route not found." } }, 404);
  } catch (error) {
    if (error instanceof VppInputError) return json({ ok: false, error: { code: error.code, message: error.message } }, 400);
    if (error instanceof ZodError) {
      return json(
        { ok: false, error: { code: "invalid-request", message: "Request does not match the operation schema.", issues: error.issues } },
        400
      );
    }
    return json({ ok: false, error: { code: "internal-error", message: "The request could not be completed." } }, 500);
  }
}

export default { fetch: handleRequest } satisfies ExportedHandler<Env>;
