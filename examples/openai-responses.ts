import OpenAI from "openai";
import { runVppTurn } from "../src/adapter";

const client = new OpenAI();
const userMessage = process.argv.slice(2).join(" ") || "!<g>\nDesign a resilient queue.";
const model = process.env.OPENAI_MODEL;
if (!model) throw new Error("Set OPENAI_MODEL to a Responses API model available to your account.");

const result = await runVppTurn({
  message: userMessage,
  generate: async (prepared) => {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: `Return body-only content. Do not add VPP tags or footers. Contract: ${JSON.stringify(prepared.content_contract)}`
            }
          ]
        },
        { role: "user", content: [{ type: "input_text", text: prepared.command.body }] }
      ]
    });
    return { body: response.output_text, sources: "none", assumption_count: 0 };
  }
});

process.stdout.write(`${result.message}\n`);
process.stderr.write(`${JSON.stringify(result.state)}\n`);
