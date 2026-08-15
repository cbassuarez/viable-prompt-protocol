import {
  formatResponse,
  prepareTurn,
  validateExchange,
  validateTranscript,
  VppInputError,
  type PreparedTurn,
  type SourceMode,
  type TranscriptTurn,
  type VppState
} from "./core";
import { generatedManifestText } from "./generated-content";

type Input = Record<string, unknown>;

function asObject(value: unknown): Input {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new VppInputError("invalid-input", "Input must be a JSON object.");
  }
  return value as Input;
}

function requiredString(input: Input, key: string): string {
  const value = input[key];
  if (typeof value !== "string") throw new VppInputError("invalid-input", `${key} must be a string.`);
  return value;
}

async function readInput(): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) throw new VppInputError("missing-input", "Provide one JSON object on stdin.");
  return JSON.parse(text);
}

async function main() {
  const operation = process.argv[2];
  if (operation === "manifest") {
    process.stdout.write(generatedManifestText);
    return;
  }
  const input = asObject(await readInput());
  let result: unknown;
  switch (operation) {
    case "prepare-turn": {
      result = prepareTurn(
        requiredString(input, "message"),
        input.state as VppState | null | undefined,
        input.next_locus as string | null | undefined
      );
      break;
    }
    case "format-response": {
      result = formatResponse(
        input.prepared_turn as PreparedTurn,
        requiredString(input, "body"),
        (input.sources ?? "none") as SourceMode,
        (input.assumption_count ?? 0) as number
      );
      break;
    }
    case "validate-exchange": {
      result = validateExchange({
        user_message: requiredString(input, "user_message"),
        assistant_message: requiredString(input, "assistant_message"),
        state: input.state as VppState | null | undefined,
        repair: input.repair === true,
        next_locus: input.next_locus as string | null | undefined
      });
      break;
    }
    case "validate-transcript": {
      if (!Array.isArray(input.turns)) throw new VppInputError("invalid-input", "turns must be an array.");
      result = validateTranscript({
        turns: input.turns as TranscriptTurn[],
        initial_state: input.initial_state as VppState | null | undefined,
        repair: input.repair === true
      });
      break;
    }
    default:
      throw new VppInputError(
        "unknown-operation",
        "Use prepare-turn, format-response, validate-exchange, validate-transcript, or manifest."
      );
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  const code = error instanceof VppInputError ? error.code : "invalid-input";
  const message = error instanceof Error ? error.message : "Unknown error";
  process.stderr.write(`${JSON.stringify({ ok: false, error: { code, message } })}\n`);
  process.exitCode = 1;
});
