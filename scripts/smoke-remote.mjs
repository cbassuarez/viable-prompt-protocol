import assert from "node:assert/strict";

const baseUrl = process.env.VPP_BASE_URL?.replace(/\/$/, "");
if (!baseUrl) throw new Error("Set VPP_BASE_URL to the versioned Cloudflare preview origin.");
const parsedBase = new URL(baseUrl);
if (parsedBase.protocol !== "https:") throw new Error("VPP_BASE_URL must use HTTPS.");

const health = await fetch(`${baseUrl}/healthz`);
assert.equal(health.status, 200);
assert.equal((await health.json()).protocol_version, "v1.5");

const prepared = await fetch(`${baseUrl}/api/v1/prepare-turn`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "!<g>" })
});
assert.equal(prepared.status, 200);
assert.equal((await prepared.json()).next_state.tag_counts.g, 1);

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
console.log(`Remote VPP health, JSON, and MCP smoke tests passed at ${baseUrl}.`);
