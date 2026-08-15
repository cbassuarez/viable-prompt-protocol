import {
  formatResponse,
  prepareTurn,
  validateExchange,
  type FormattedResponse,
  type PreparedTurn,
  type SourceMode,
  type VppStateInput
} from "./core";

export interface BodyGeneration {
  body: string;
  sources?: SourceMode;
  assumption_count?: number;
}

export interface HostAdapterInput {
  message: string;
  state?: VppStateInput | null;
  next_locus?: string | null;
  generate: (prepared: PreparedTurn) => Promise<string | BodyGeneration>;
}

export interface HostAdapterResult extends FormattedResponse {
  prepared_turn: PreparedTurn;
}

/** Enforce prepare -> body-only generation -> format -> validate around any model provider. */
export async function runVppTurn(input: HostAdapterInput): Promise<HostAdapterResult> {
  const prepared = prepareTurn(input.message, input.state, input.next_locus);
  let generated: string | BodyGeneration;
  if (prepared.status === "protocol_error") {
    generated = { body: prepared.deterministic_body ?? "Invalid VPP command.", sources: "none", assumption_count: 0 };
  } else {
    generated = await input.generate(prepared);
  }
  const normalized = typeof generated === "string" ? { body: generated } : generated;
  const formatted = formatResponse(
    prepared,
    normalized.body,
    normalized.sources ?? "none",
    normalized.assumption_count ?? 0
  );
  const validation = validateExchange({
    user_message: input.message,
    assistant_message: formatted.message,
    state: input.state,
    next_locus: input.next_locus
  });
  if (!validation.ok) {
    throw new Error(`Internal VPP validation failed: ${validation.violations.map((item) => item.code).join(", ")}`);
  }
  return { ...formatted, prepared_turn: prepared };
}
