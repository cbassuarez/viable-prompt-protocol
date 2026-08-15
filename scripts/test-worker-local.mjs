import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 8791;
const origin = `http://127.0.0.1:${port}`;
const output = [];
const child = spawn(
  "./node_modules/.bin/wrangler",
  [
    "dev",
    "--local",
    "--ip",
    "127.0.0.1",
    "--port",
    String(port),
    "--inspector-ip",
    "127.0.0.1",
    "--inspector-port",
    "8792",
    "--env-file",
    "/dev/null",
    "--log-level",
    "error"
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, WRANGLER_WRITE_LOGS: "false", WRANGLER_SEND_METRICS: "false" }
  }
);
child.stdout.on("data", (chunk) => output.push(chunk.toString()));
child.stderr.on("data", (chunk) => output.push(chunk.toString()));

async function waitForWorker() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode != null) throw new Error(`wrangler exited early (${child.exitCode})\n${output.join("")}`);
    try {
      const response = await fetch(`${origin}/healthz`);
      if (response.ok) return response;
    } catch {
      // Worker is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for local Worker.\n${output.join("")}`);
}

try {
  const health = await waitForWorker();
  assert.equal((await health.json()).protocol_version, "v1.5");

  const prepared = await fetch(`${origin}/api/v1/prepare-turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "!<g>" })
  });
  assert.equal(prepared.status, 200);
  assert.equal((await prepared.json()).next_state.tag_counts.g, 1);

  const mcp = await fetch(`${origin}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "local-worker-smoke", version: "1.0.0" }
      }
    })
  });
  assert.equal(mcp.status, 200);
  assert.match(await mcp.text(), /viable-prompt-protocol/);
  console.log("Local Cloudflare Worker JSON and MCP smoke tests passed.");
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    if (child.exitCode != null) return resolve();
    child.once("exit", resolve);
    setTimeout(resolve, 2_000).unref();
  });
}
