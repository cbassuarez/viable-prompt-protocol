import assert from "node:assert/strict";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import manifest from "../protocol/v1.5/manifest.json";
import manifestSchema from "../protocol/v1.5/manifest.schema.json";
import stateSchema from "../protocol/v1.5/state.schema.json";
import worker, { handleRequest, type Env } from "../src/worker";

function post(path: string, body: unknown, env: Env = {}) {
  return handleRequest(
    new Request(`https://mcp.viableprompt.org${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }),
    env
  );
}

async function mcp(method: string, params: Record<string, unknown> = {}, id = 1) {
  const response = await worker.fetch(
    new Request("https://mcp.viableprompt.org/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Host: "mcp.viableprompt.org"
      },
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params })
    }),
    {}
  );
  const text = await response.text();
  assert.equal(response.status, 200, text);
  const payload = text.startsWith("event:")
    ? text
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("")
    : text;
  return JSON.parse(payload);
}

async function mcpModern(method: string, params: Record<string, unknown> = {}, id = 101) {
  const response = await worker.fetch(
    new Request("https://mcp.viableprompt.org/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Host: "mcp.viableprompt.org",
        "MCP-Protocol-Version": "2026-07-28",
        "MCP-Method": method
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params: {
          _meta: {
            "io.modelcontextprotocol/protocolVersion": "2026-07-28",
            "io.modelcontextprotocol/clientCapabilities": {}
          },
          ...params
        }
      })
    }),
    {}
  );
  const text = await response.text();
  assert.equal(response.status, 200, text);
  return JSON.parse(text);
}

test("normative manifest and state conform to their schemas", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  assert.equal(ajv.validate(manifestSchema, manifest), true, JSON.stringify(ajv.errors));
  const validateState = ajv.compile(stateSchema);
  assert.equal(
    validateState({
      protocol_version: "v1.5",
      cycle: {
        sequence: 1,
        iteration: 1,
        locus: { index: 1, name: "default" },
        path: [],
        closed: false
      },
      tag_counts: { g: 0, q: 0, o: 0, c: 0, o_f: 0 },
      closed: false
    }),
    true,
    JSON.stringify(validateState.errors)
  );
});

test("health and OpenAPI metadata are public and versioned", async () => {
  const health = await handleRequest(new Request("https://mcp.viableprompt.org/healthz"));
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true, service_version: "1.1.0", protocol_version: "v1.5", stateful: false });

  const openapi = await handleRequest(new Request("https://mcp.viableprompt.org/api/v1/openapi.json"));
  assert.equal(openapi.status, 200);
  const document = (await openapi.json()) as { openapi: string; paths: Record<string, unknown> };
  assert.equal(document.openapi, "3.1.0");
  assert.deepEqual(Object.keys(document.paths).slice(0, 4), [
    "/api/v1/prepare-turn",
    "/api/v1/format-response",
    "/api/v1/validate-exchange",
    "/api/v1/validate-transcript"
  ]);
  assert.ok((document as any).components.schemas.PreparedTurn.required.includes("next_state"));
});

test("OpenAI domain challenge is exact, optional, and never cached", async () => {
  const missing = await handleRequest(new Request("https://mcp.viableprompt.org/.well-known/openai-apps-challenge"));
  assert.equal(missing.status, 404);

  const configured = await handleRequest(
    new Request("https://mcp.viableprompt.org/.well-known/openai-apps-challenge"),
    { OPENAI_APPS_CHALLENGE: "challenge-token" }
  );
  assert.equal(configured.status, 200);
  assert.equal(await configured.text(), "challenge-token");
  assert.equal(configured.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(configured.headers.get("cache-control"), "no-store");
});

test("JSON API implements prepare, format, validation, and transcript reconstruction", async () => {
  const preparedResponse = await post("/api/v1/prepare-turn", { message: "!<g>\nDesign a resilient queue." });
  assert.equal(preparedResponse.status, 200);
  const prepared = (await preparedResponse.json()) as Record<string, any>;
  assert.equal(prepared.assistant_tag, "g");
  assert.equal(prepared.next_state.tag_counts.g, 1);
  assert.equal(prepared.next_state.cycle.iteration, 1);
  assert.equal(prepared.next_state.cycle.path[0].response_tag, "g");
  const openapiResponse = await handleRequest(new Request("https://mcp.viableprompt.org/api/v1/openapi.json"));
  const openapi = (await openapiResponse.json()) as any;
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validatePrepared = ajv.compile(openapi.components.schemas.PreparedTurn);
  assert.equal(validatePrepared(prepared), true, JSON.stringify(validatePrepared.errors));

  const formattedResponse = await post("/api/v1/format-response", {
    prepared_turn: prepared,
    body: "Use an idempotent consumer and explicit retry policy.",
    sources: "none",
    assumption_count: 1
  });
  assert.equal(formattedResponse.status, 200);
  const formatted = (await formattedResponse.json()) as Record<string, any>;
  assert.match(formatted.message, /^<g>/);
  assert.match(formatted.message, /Tag=g_1/);

  const validatedResponse = await post("/api/v1/validate-exchange", {
    user_message: "!<g>\nDesign a resilient queue.",
    assistant_message: formatted.message
  });
  const validated = (await validatedResponse.json()) as Record<string, any>;
  assert.equal(validated.ok, true);

  const transcriptResponse = await post("/api/v1/validate-transcript", {
    turns: [
      { role: "user", content: "!<g>\nDesign a resilient queue." },
      { role: "assistant", content: formatted.message }
    ]
  });
  const transcript = (await transcriptResponse.json()) as Record<string, any>;
  assert.equal(transcript.ok, true);
  assert.equal(transcript.state.tag_counts.g, 1);
});

test("JSON API rejects invalid schemas, oversized bodies, and excess rate", async () => {
  const bad = await post("/api/v1/prepare-turn", { message: 42 });
  assert.equal(bad.status, 400);
  assert.equal(((await bad.json()) as any).error.code, "invalid-request");

  const huge = await handleRequest(
    new Request("https://mcp.viableprompt.org/api/v1/prepare-turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: `!<g>\n${"x".repeat(262_145)}` })
    })
  );
  assert.equal(huge.status, 413);

  const rate = await post(
    "/api/v1/prepare-turn",
    { message: "!<g>" },
    { VPP_RATE_LIMITER: { async limit() { return { success: false }; } } }
  );
  assert.equal(rate.status, 429);
  assert.equal(rate.headers.get("retry-after"), "60");
});

test("MCP discovery is deterministic and exposes all tools, resources, and prompt", async () => {
  const initialized = await mcp("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "vpp-contract-test", version: "1.0.0" }
  });
  assert.equal(initialized.result.serverInfo.name, "viable-prompt-protocol");

  const tools = await mcp("tools/list");
  assert.deepEqual(
    tools.result.tools.map((tool: { name: string }) => tool.name),
    ["vpp_prepare_turn", "vpp_format_response", "vpp_validate_exchange", "vpp_validate_transcript"]
  );
  for (const tool of tools.result.tools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.ok(tool.inputSchema);
    assert.ok(tool.outputSchema);
    assert.ok(tool._meta["openai/toolInvocation/invoking"]);
    assert.ok(tool._meta["openai/toolInvocation/invoked"]);
  }
  assert.equal(tools.result.tools[0]._meta.ui, undefined);
  assert.equal(tools.result.tools[1]._meta.ui, undefined);
  assert.equal(tools.result.tools[2]._meta.ui.resourceUri, "ui://vpp/cycle-controller-v1.1.0.html");
  assert.equal(tools.result.tools[3]._meta.ui.resourceUri, "ui://vpp/cycle-controller-v1.1.0.html");

  const resources = await mcp("resources/list");
  assert.deepEqual(
    resources.result.resources.map((resource: { uri: string }) => resource.uri),
    [
      "vpp://v1.5/spec",
      "vpp://v1.5/manifest",
      "vpp://v1.5/header-snippet",
      "vpp://v1.5/state-schema",
      "vpp://v1.5/adoption",
      "ui://vpp/cycle-controller-v1.1.0.html"
    ]
  );

  const prompts = await mcp("prompts/list");
  assert.deepEqual(prompts.result.prompts.map((prompt: { name: string }) => prompt.name), ["start-vpp"]);
});

test("current request-scoped MCP discovery serves the 2026 protocol", async () => {
  const discovery = await mcpModern("server/discover");
  assert.ok(discovery.result.supportedVersions.includes("2026-07-28"));
  const tools = await mcpModern("tools/list");
  assert.deepEqual(
    tools.result.tools.map((tool: { name: string }) => tool.name),
    ["vpp_prepare_turn", "vpp_format_response", "vpp_validate_exchange", "vpp_validate_transcript"]
  );
});

test("MCP structured tool output matches the JSON operation", async () => {
  const preparedCall = await mcp("tools/call", { name: "vpp_prepare_turn", arguments: { message: "!<g>" } });
  assert.equal(preparedCall.result.isError, undefined);
  const prepared = preparedCall.result.structuredContent;
  assert.equal(prepared.assistant_tag, "g");
  assert.equal(prepared.next_state.tag_counts.g, 1);
  assert.deepEqual(JSON.parse(preparedCall.result.content[0].text), prepared);

  const formattedCall = await mcp("tools/call", {
    name: "vpp_format_response",
    arguments: { prepared_turn: prepared, body: "Concept.", sources: "none", assumption_count: 0 }
  });
  const formatted = formattedCall.result.structuredContent;
  assert.match(formatted.message, /Tag=g_1/);

  const exchangeCall = await mcp("tools/call", {
    name: "vpp_validate_exchange",
    arguments: { user_message: "!<g>", assistant_message: formatted.message }
  });
  assert.equal(exchangeCall.result.structuredContent.ok, true);

  const transcriptCall = await mcp("tools/call", {
    name: "vpp_validate_transcript",
    arguments: {
      turns: [
        { role: "user", content: "!<g>" },
        { role: "assistant", content: formatted.message }
      ]
    }
  });
  assert.equal(transcriptCall.result.structuredContent.ok, true);
  assert.equal(transcriptCall.result.structuredContent.state.tag_counts.g, 1);
});

test("MCP immutable resources and start prompt return generated v1.5 content", async () => {
  const resource = await mcp("resources/read", { uri: "vpp://v1.5/state-schema" });
  assert.equal(JSON.parse(resource.result.contents[0].text).properties.protocol_version.const, "v1.5");

  const prompt = await mcp("prompts/get", { name: "start-vpp", arguments: { goal: "Map the rollout", starting_tag: "q" } });
  assert.equal(prompt.result.messages[0].content.text, "!<q>\nMap the rollout");
});

test("MCP Apps controller resource has exact metadata and no network allowlist", async () => {
  const resource = await mcp("resources/read", { uri: "ui://vpp/cycle-controller-v1.1.0.html" });
  const content = resource.result.contents[0];
  assert.equal(content.mimeType, "text/html;profile=mcp-app");
  assert.equal(content._meta.ui.prefersBorder, true);
  assert.equal(content._meta.ui.domain, "https://mcp.viableprompt.org");
  assert.deepEqual(content._meta.ui.csp, { connectDomains: [], resourceDomains: [] });
  assert.equal(content._meta["openai/widgetPrefersBorder"], true);
  assert.equal(content._meta["openai/widgetDomain"], "https://mcp.viableprompt.org");
  assert.deepEqual(content._meta["openai/widgetCSP"], { connect_domains: [], resource_domains: [] });
  assert.match(content.text, /data-vpp-controller/);
  assert.match(content.text, /ui\/message/);
  assert.doesNotMatch(content.text, /VALID|INVALID/);
});

test("MCP rejects untrusted browser origins", async () => {
  const response = await handleRequest(
    new Request("https://mcp.viableprompt.org/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", Host: "mcp.viableprompt.org", Origin: "https://evil.example" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })
    })
  );
  assert.equal(response.status, 403);
});

test("MCP rejects untrusted hostnames", async () => {
  const response = await handleRequest(
    new Request("https://evil.example/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json", Host: "evil.example" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} })
    })
  );
  assert.equal(response.status, 403);
});
