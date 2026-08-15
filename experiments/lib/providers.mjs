// Provider-agnostic chat adapter.
//
// Every experiment runner talks to models through one interface:
//   const chat = await getChat(provider, { dryRun });
//   const text = await chat({ model, messages, temperature, top_p, seed });
//
// `messages` is an array of { role: "system"|"user"|"assistant", content }.
// SDKs are imported lazily so the harness loads even when a provider's SDK or
// API key is absent — you only pay that cost for the provider you actually use.

import { parseFirstLine } from "../../scripts/parse-first-line.mjs";

// Approximate per-1M-token USD prices, used ONLY for the local budget guard.
// Your provider invoice is authoritative; these are deliberately rounded UP so
// the guard errs toward stopping early rather than overspending. Update freely.
const PRICES = {
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  default: { input: 5.0, output: 15.0 }
};

// Estimate USD for one call's token usage. Unknown models use the (expensive)
// default so the guard is conservative.
export function costForUsage(model, usage) {
  if (!usage) return 0;
  const p = PRICES[model] ?? PRICES.default;
  const inTok = usage.input_tokens ?? 0;
  const outTok = usage.output_tokens ?? 0;
  return (inTok / 1e6) * p.input + (outTok / 1e6) * p.output;
}

// Map a user header to the tag the assistant should mirror (VPP mirror rule).
function mirrorTag(rawHeader) {
  if (!rawHeader) return "o";
  const parsed = parseFirstLine(rawHeader);
  if (!parsed.ok) return "o";
  if (parsed.tag === "e") {
    // !<e> --<x> -> mirror <x>; default to <o> if no pipeline tag present.
    const pipe = parsed.mods.find((m) => ["g", "q", "o", "c", "o_f"].includes(m));
    return pipe ?? "o";
  }
  if (parsed.tag === "e_o") return "o";
  return parsed.tag;
}

// Deterministic, VPP-shaped reply for --dry-run. No network, no spend. Lets us
// exercise the full pipeline (parse -> score -> save -> pack) without API keys.
function mockChat({ messages }) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const firstLine = (lastUser?.content ?? "").split(/\r?\n/, 1)[0];
  const tag = mirrorTag(firstLine);
  const footer = `[Version=v1.4 | Tag=${tag}_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=dry-run]`;
  const body = `Dry-run mock response for tag <${tag}>. No model was called.`;
  return { text: `<${tag}>\n${body}\n${footer}`, usage: { input_tokens: 0, output_tokens: 0 } };
}

async function openaiChat() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY for provider 'openai'.");
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });
  return async ({ model, messages, temperature, top_p, seed }) => {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature,
      top_p,
      ...(seed != null ? { seed } : {})
    });
    return {
      text: completion.choices?.[0]?.message?.content ?? "",
      usage: {
        input_tokens: completion.usage?.prompt_tokens ?? 0,
        output_tokens: completion.usage?.completion_tokens ?? 0
      }
    };
  };
}

async function anthropicChat() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY for provider 'anthropic'.");
  let Anthropic;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
  } catch {
    throw new Error("@anthropic-ai/sdk is not installed. Run: npm install @anthropic-ai/sdk");
  }
  const client = new Anthropic({ apiKey });
  return async ({ model, messages, temperature, top_p, max_tokens = 2048 }) => {
    // Anthropic takes the system prompt separately and only user/assistant turns.
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const convo = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));
    const resp = await client.messages.create({
      model,
      system: system || undefined,
      messages: convo,
      max_tokens,
      temperature,
      ...(top_p != null ? { top_p } : {})
    });
    return {
      text: resp.content?.map((b) => (b.type === "text" ? b.text : "")).join("") ?? "",
      usage: {
        input_tokens: resp.usage?.input_tokens ?? 0,
        output_tokens: resp.usage?.output_tokens ?? 0
      }
    };
  };
}

// Return an async chat() function for the given provider.
export async function getChat(provider, { dryRun = false } = {}) {
  if (dryRun) return async (req) => mockChat(req);
  switch (provider) {
    case "openai":
      return openaiChat();
    case "anthropic":
      return anthropicChat();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
