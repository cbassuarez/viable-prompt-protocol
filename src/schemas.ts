import { z } from "zod";

export const assistantTagSchema = z.enum(["g", "q", "o", "c", "o_f"]).describe("The VPP assistant wrapper tag selected for this response.");
export const sourceModeSchema = z.enum(["none", "web"]).describe("Whether the generated body relied on web sources.");
export const locusNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,63}$/)
  .describe("A safe, human-readable VPP locus name of at most 64 characters.");

const userTagSchema = z.enum(["g", "q", "o", "c", "o_f", "e", "e_o"]);
const cycleIterationSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const locusSchema = z.object({
  index: z.number().int().positive().describe("One-based locus number within the conversation."),
  name: locusNameSchema
}).describe("The locus owned by this VPP cycle.");
const tagCountsSchema = z.object({
  g: z.number().int().nonnegative().describe("Conversation-global count of g responses."),
  q: z.number().int().nonnegative().describe("Conversation-global count of q responses."),
  o: z.number().int().nonnegative().describe("Conversation-global count of o responses."),
  c: z.number().int().nonnegative().describe("Conversation-global count of c responses."),
  o_f: z.number().int().nonnegative().describe("Conversation-global count of o_f responses.")
}).describe("Per-tag conversation-global counters that never reset across cycles or loci.");
const cyclePathNodeSchema = z.object({
  command_tag: userTagSchema.describe("Valid user command that produced this realized transition."),
  response_tag: assistantTagSchema.describe("Resolved assistant response tag."),
  tag_index: z.number().int().positive().describe("Conversation-global index for the resolved assistant tag."),
  modifiers: z.array(z.enum(["correct", "incorrect", "minor", "major", "<g>", "<q>", "<o>", "<c>", "<o_f>"]))
    .describe("Unique normalized command modifiers in source order; their command-level consistency is enforced by the runtime.")
}).describe("One valid realized transition in the active cycle DAG traversal.");

export const vppStateSchema = z.object({
  protocol_version: z.literal("v1.5").describe("The protocol version for this state."),
  cycle: z.object({
    sequence: z.number().int().positive().describe("Monotonic identity of this cycle record within the conversation."),
    iteration: cycleIterationSchema.describe("Footer cycle iteration, capped at three."),
    locus: locusSchema,
    path: z.array(cyclePathNodeSchema).describe("Valid realized path for the active cycle only."),
    closed: z.boolean().describe("Whether a valid user c command closed this cycle DAG.")
  }).describe("The active restartable DAG cycle and its owned locus."),
  tag_counts: tagCountsSchema,
  closed: z.boolean().describe("Whether the active pipeline is closed by an o_f response.")
}).describe("Transparent VPP conversation state carried by the client, never stored by the service.");

export const legacyVppStateSchema = z.object({
  protocol_version: z.literal("v1.5"),
  locus: locusSchema,
  cycle: cycleIterationSchema,
  tag_counts: tagCountsSchema,
  closed: z.boolean()
}).describe("Legacy flat v1.5 state accepted temporarily as input and normalized to canonical cycle state.");

export const vppStateInputSchema = z.union([vppStateSchema, legacyVppStateSchema]);

export const diagnosticSchema = z.object({
  code: z.string().describe("Stable machine-readable VPP failure code."),
  message: z.string().describe("Human-readable explanation of the violation."),
  example: z.string().optional().describe("A valid command or structure illustrating recovery.")
}).describe("One structural VPP diagnostic.");
const parsedCommandSchema = z.object({
  ok: z.boolean().describe("Whether line 1 is a valid VPP command."),
  first_line: z.string().describe("The only line parsed as a VPP command."),
  body: z.string().describe("The unparsed content after line 1."),
  tag: userTagSchema.nullable().describe("The parsed user command tag, or null when invalid."),
  modifiers: z.array(z.string()).describe("Normalized command modifiers in source order."),
  pipeline_tag: assistantTagSchema.nullable().describe("The explicit assistant-tag destination, when present."),
  diagnostics: z.array(diagnosticSchema).describe("Structural command violations, empty for a valid command.")
}).describe("The deterministic first-line parse result.");
const contractSchema = z.object({
  tag: assistantTagSchema,
  instruction: z.string().describe("Semantic instruction for generating the response body."),
  modifier_guidance: z.array(z.string()).describe("Additional guidance derived from valid modifiers."),
  body_only: z.literal(true).describe("The host must generate body content without VPP wrappers."),
  max_questions: z.number().int().positive().optional().describe("Maximum allowed questions when the contract defines one."),
  assumptions_must_be_explicit: z.boolean().describe("Whether assumptions should be made explicit in the body.")
}).describe("The model-facing content contract for body-only generation.");

export const preparedTurnSchema = z.object({
  protocol_version: z.literal("v1.5").describe("The protocol version used to prepare this turn."),
  status: z.enum(["ready", "protocol_error"]).describe("Whether the host may generate content or must use deterministic recovery."),
  command: parsedCommandSchema,
  assistant_tag: assistantTagSchema,
  tag_index: z.number().int().positive().describe("Conversation-global index for the selected assistant tag."),
  content_contract: contractSchema,
  must_offer_escape: z.boolean().describe("Whether the formatted body must contain the canonical cycle-3 escape choices."),
  deterministic_body: z.string().optional().describe("Exact recovery body to use instead of model generation for invalid commands."),
  next_state: vppStateSchema
}).describe("Prepared VPP turn returned before body generation.");

export const preparedTurnInputSchema = z.union([
  preparedTurnSchema,
  preparedTurnSchema.extend({ next_state: legacyVppStateSchema })
]).describe("Canonical or compatibility-window legacy prepared turn accepted for formatting.");

export const formattedResponseSchema = z.object({
  message: z.string().describe("Complete structurally valid assistant message to return."),
  header: z.string().describe("Canonical bare VPP wrapper tag on line 1."),
  body: z.string().describe("Normalized response body without duplicate VPP wrappers."),
  footer: z.string().describe("Canonical v1.5 compliance footer."),
  state: vppStateSchema
}).describe("Formatted VPP response and committed client-carried state.");

const parsedResponseSchema = z.object({
  raw_header: z.string().nullable().describe("Unnormalized first line of the assistant message, when present."),
  tag: assistantTagSchema.nullable().describe("Parsed assistant wrapper tag, or null when invalid."),
  body: z.string().describe("Assistant body isolated from the outer VPP wrapper."),
  footer: z.string().nullable().describe("Raw compliance footer, or null when absent."),
  parsed_footer: z.looseObject({}).nullable().describe("Parsed footer fields, or null when malformed or absent.")
}).describe("Structural parse of an assistant response.");

export const exchangeValidationSchema = z.object({
  ok: z.boolean().describe("Whether the exchange is structurally valid under VPP v1.5."),
  violations: z.array(diagnosticSchema).describe("Structural violations in deterministic evaluation order."),
  prepared_turn: preparedTurnSchema,
  parsed_response: parsedResponseSchema,
  state: vppStateSchema,
  repaired_message: z.string().optional().describe("Body-preserving structural repair, returned only when requested and possible.")
}).describe("Validation result for one VPP exchange.");

export const transcriptValidationSchema = z.object({
  ok: z.boolean().describe("Whether every complete exchange in the transcript is structurally valid."),
  violations: z.array(diagnosticSchema.extend({
    turn_index: z.number().int().nonnegative().describe("Zero-based index of the transcript turn associated with the violation.")
  })).describe("All transcript violations in deterministic turn order."),
  exchanges: z.array(exchangeValidationSchema).describe("Per-exchange validation results."),
  state: vppStateSchema
}).describe("Transcript-wide validation result and reconstructed final state.");

export const transcriptTurnSchema = z.object({
  role: z.enum(["user", "assistant"]).describe("Speaker for this transcript turn."),
  content: z.string().describe("Complete message content for this transcript turn.")
}).describe("One ordered transcript turn.");
export const prepareInputSchema = z.object({
  message: z.string().min(1).describe("Complete user message; only line 1 is parsed as the VPP command."),
  state: vppStateInputSchema.nullish().describe("Prior client-carried state; omit only for a new conversation."),
  next_locus: locusNameSchema.nullish().describe("Optional user-supplied name for a new locus created by an escape command.")
}).describe("Input for deterministic VPP turn preparation.");

export const formatInputSchema = z.object({
  prepared_turn: preparedTurnInputSchema.describe("Unmodified result from vpp_prepare_turn, including temporary legacy compatibility."),
  body: z.string().describe("Model-generated body only, or the exact deterministic recovery body when supplied."),
  sources: sourceModeSchema,
  assumption_count: z.number().int().nonnegative().describe("Caller-declared number of assumptions in the response body.")
}).describe("Input for canonical VPP response formatting.");

export const validateExchangeInputSchema = z.object({
  user_message: z.string().describe("Original complete user message for this exchange."),
  assistant_message: z.string().describe("Assistant message whose VPP structure should be validated."),
  state: vppStateInputSchema.nullish().describe("State before this exchange; omit only for the first exchange."),
  repair: z.boolean().default(false).describe("When true, return a structural repair that preserves the response body."),
  next_locus: locusNameSchema.nullish().describe("Optional user-supplied locus name used while reconstructing this transition.")
}).describe("Input for validating or structurally repairing one VPP exchange.");

export const validateTranscriptInputSchema = z.object({
  turns: z.array(transcriptTurnSchema).describe("Ordered user and assistant turns to validate."),
  initial_state: vppStateInputSchema.nullish().describe("Optional state immediately before the supplied transcript."),
  repair: z.boolean().default(false).describe("When true, include structural repairs for invalid assistant turns.")
}).describe("Input for transcript-wide VPP state reconstruction and validation.");
