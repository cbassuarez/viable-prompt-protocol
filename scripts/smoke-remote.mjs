import assert from "node:assert/strict";

const baseUrl = process.env.VPP_BASE_URL?.replace(/\/$/, "");
if (!baseUrl) throw new Error("Set VPP_BASE_URL to the versioned Cloudflare preview origin.");
const parsedBase = new URL(baseUrl);
if (parsedBase.protocol !== "https:") throw new Error("VPP_BASE_URL must use HTTPS.");

const health = await fetch(`${baseUrl}/healthz`);
assert.equal(health.status, 200);
assert.deepEqual(await health.json(), {
  ok: true,
  service_version: "1.1.0",
  protocol_version: "v1.5",
  stateful: false
});

const prepared = await fetch(`${baseUrl}/api/v1/prepare-turn`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "!<g>" })
});
assert.equal(prepared.status, 200);
const preparedTurn = await prepared.json();
assert.equal(preparedTurn.next_state.tag_counts.g, 1);
assert.equal(preparedTurn.next_state.cycle.path[0].response_tag, "g");

const formatted = await fetch(`${baseUrl}/api/v1/format-response`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prepared_turn: preparedTurn,
    body: "Use bounded work queues and idempotent consumers.",
    sources: "none",
    assumption_count: 0
  })
});
assert.equal(formatted.status, 200);
const formattedResponse = await formatted.json();
assert.match(formattedResponse.message, /Tag=g_1/);

const validated = await fetch(`${baseUrl}/api/v1/validate-exchange`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user_message: "!<g>", assistant_message: formattedResponse.message })
});
assert.equal(validated.status, 200);
assert.equal((await validated.json()).ok, true);

const transcript = await fetch(`${baseUrl}/api/v1/validate-transcript`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    turns: [
      { role: "user", content: "!<g>" },
      { role: "assistant", content: formattedResponse.message }
    ]
  })
});
assert.equal(transcript.status, 200);
assert.equal((await transcript.json()).state.tag_counts.g, 1);

const legacy = await fetch(`${baseUrl}/api/v1/prepare-turn`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "!<q>",
    state: {
      protocol_version: "v1.5",
      locus: { index: 1, name: "default" },
      cycle: 2,
      tag_counts: { g: 1, q: 0, o: 0, c: 0, o_f: 0 },
      closed: false
    }
  })
});
assert.equal(legacy.status, 200);
const normalized = await legacy.json();
assert.equal(normalized.next_state.cycle.iteration, 2);
assert.equal(normalized.next_state.cycle.locus.name, "default");

const mcp = await fetch(`${baseUrl}/mcp`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "vpp-remote-smoke", version: "1.0.0" }
    }
  })
});
assert.equal(mcp.status, 200);
assert.match(await mcp.text(), /viable-prompt-protocol/);

async function mcpList(method, id) {
  const response = await fetch(`${baseUrl}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params: {} })
  });
  assert.equal(response.status, 200);
  const text = await response.text();
  if (!text.startsWith("event:")) return JSON.parse(text);
  const data = text.split("\n").find((line) => line.startsWith("data:"));
  assert.ok(data);
  return JSON.parse(data.slice(5).trim());
}

const tools = await mcpList("tools/list", 3);
assert.deepEqual(tools.result.tools.map((tool) => tool.name), [
  "vpp_prepare_turn",
  "vpp_format_response",
  "vpp_validate_exchange",
  "vpp_validate_transcript"
]);
assert.equal(tools.result.tools[0]._meta.ui, undefined);
assert.equal(tools.result.tools[1]._meta.ui, undefined);
assert.equal(tools.result.tools[2]._meta.ui.resourceUri, "ui://vpp/cycle-controller-v1.1.0.html");
assert.equal(tools.result.tools[3]._meta.ui.resourceUri, "ui://vpp/cycle-controller-v1.1.0.html");

const resources = await mcpList("resources/list", 4);
assert.equal(resources.result.resources.at(-1).uri, "ui://vpp/cycle-controller-v1.1.0.html");

const modernMcp = await fetch(`${baseUrl}/mcp`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "MCP-Protocol-Version": "2026-07-28",
    "MCP-Method": "server/discover"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 2,
    method: "server/discover",
    params: {
      _meta: {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  })
});
assert.equal(modernMcp.status, 200);
assert.ok((await modernMcp.json()).result.supportedVersions.includes("2026-07-28"));
console.log(`Remote VPP 1.1.0 health, all JSON operations, legacy normalization, and MCP discovery passed at ${baseUrl}.`);
