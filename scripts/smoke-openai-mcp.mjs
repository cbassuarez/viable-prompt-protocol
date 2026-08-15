import assert from "node:assert/strict";
import OpenAI from "openai";

const serverUrl = process.env.VPP_MCP_URL;
const model = process.env.OPENAI_MODEL;
if (!serverUrl) throw new Error("Set VPP_MCP_URL to the preview MCP endpoint ending in /mcp.");
if (!model) throw new Error("Set OPENAI_MODEL to a Responses API model available to your account.");

const client = new OpenAI();
const response = await client.responses.create({
  model,
  tools: [
    {
      type: "mcp",
      server_label: "viable_prompt_protocol",
      server_url: serverUrl,
      require_approval: "never",
      allowed_tools: ["vpp_prepare_turn"]
    }
  ],
  input:
    "Call vpp_prepare_turn exactly once. Use this exact JSON argument with no added punctuation: {\"message\":\"!<g>\"}. Then report completion."
});

const call = response.output.find((item) => item.type === "mcp_call");
assert.ok(call, "Responses API did not emit an MCP call");
assert.equal(call.name, "vpp_prepare_turn");
assert.deepEqual(JSON.parse(call.arguments), { message: "!<g>" });
assert.equal(call.status, "completed", call.error ?? "MCP call did not complete");
const output = JSON.parse(call.output ?? "null");
assert.equal(output.assistant_tag, "g");
assert.equal(output.tag_index, 1);
console.log("OpenAI Responses remote MCP smoke test passed.");
