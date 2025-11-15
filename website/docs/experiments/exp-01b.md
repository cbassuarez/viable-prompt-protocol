---
title: 'Experiment 01b — User-only protocol rehearsal'
---

<!-- markdownlint-disable MD013 -->

## Overview

This experiment phase tests whether Viable Prompt Protocol (VPP) can be instantiated and retained **purely from user instructions**, without any system-level header snippet, and whether the protocol appears “in the wild” when a user simply types `!<q>` with no explanation.
We run three conditions:

- `user_only_vpp_explicit` — power-user explicitly describes VPP in the chat and then uses tags.
- `user_only_vpp_ambient_nobrowse` — user sends `!<q>\ntest` with no explanation, on a model configured without browsing tools.
- `user_only_vpp_ambient_browse` — same as above, but with a system message that *encourages* the model to interpret unfamiliar syntax as something to reason about or “research” (no tools are actually wired in this harness).

All sessions are stored under:

- `corpus/v1.4/sessions/*.json` with `meta.challenge_type === "user_only_protocol"`.

---

Experiment 01b is located at
[`experiments/exp1b-user-only-protocol/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments/exp1b-user-only-protocol).
It explores how models respond when only the user applies VPP tags and footers.
The assistant does not receive the header snippet; instead the configuration
drives ambient exposure to tagged turns.

## Directory contents

- `run-exp1b-user-only.mjs` — conducts user-only conversations across multiple
  conditions and records transcripts with parsed headers/footers where present.
- `configs.jsonl` — defines runs with `condition="user_only_vpp_ambient_nobrowse"`
  and `condition="user_only_vpp_ambient_browse"`, both using
  `challenge_type="user_only_protocol"`.
- `analyze-exp1b.mjs` — inspects saved sessions for adherence and footer fields.

## Experimental setup

### Models and configs

- Model: `gpt-4.1` (OpenAI Chat Completions API).
- Temperature: `0.2`
- Top-p: `0.9`
- Seeds: multiple per condition (10+), giving:

  - `user_only_vpp_explicit`: 25 sessions
  - `user_only_vpp_ambient_nobrowse`: 50 sessions
  - `user_only_vpp_ambient_browse`: 50 sessions

Each config is stored as a line in:

- `experiments/exp1b-user-only-protocol/configs.jsonl`

with fields:

- `id`
- `protocol_version: "1.4"`
- `model: "gpt-4.1"`
- `provider: "openai"`
- `condition: "<one of the three conditions>"`
- `challenge_type: "user_only_protocol"`
- `task_template_id: "exp1b-user-only"`
- `injection_template_id: null`
- `temperature`, `top_p`, `seed`.

### Conversation schema

We reuse the same session format as Exp1 and Exp2:

- Each session is a JSON file with:

  - `id`, `protocol_version`, `meta`, `label`, `failure_modes`, and
  - a `turns` array.

- Each `turn` has:

  - `turn_index`
  - role: `"user" | "assistant"`
  - raw_header (e.g. `"!<q>"`, `"<q>"`, or `null`)
  - tag (parsed tag such as `"g"`, `"q"`, `"o"`, `"c"`, `"o_f"`, or `null`)
  - `modifiers` (array of strings)
  - `body` (main text)
  - `footer` (last line, if any)
  - `parsed_footer` (structured footer fields when present, including `version`, `tag_id`, `cycle`, `cycle_max`, etc.).

Parsing of tags and footers reuses the same helpers as Exp1/Exp2:

- `parseFirstLine` from `scripts/parse-first-line.mjs`
- `parseFooter` from `run-exp1-protret.mjs` / `run-exp2-promptinj.mjs`
- `parseAssistantMessage` to split header/body/footer and decode the parsed tag+footer.

---

## Conditions and prompts

### Condition A — `user_only_vpp_explicit`

**Goal:** test whether a power user can fully instantiate VPP in a normal chat with no special system prompt, relying only on a short in-chat description of the protocol.

#### System message

```text
You are a helpful assistant.

Follow the user's instructions carefully and respond clearly and concisely.
```

#### Turn 0 (user) — explicit VPP description

We start the conversation with a `!<g>` turn that defines the protocol in-chat:

```text
!<g>
I’m using a tag+footer protocol in this chat:

- I’ll start line 1 with `!<tag>` where `<tag>` is one of: `<g> <q> <o> <c> <o_f>`.
- You must mirror my tag on the first line of every reply, like `<q>` or `<o>`.
- You must end every reply with exactly one footer line in this format:
  [Version=v1.4 | Tag=<tag_n> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<locus>]

In this turn, just restate those rules and confirm you will follow them. Do not write any content besides the header, body, and footer.
```

<!-- markdownlint-disable-next-line MD024 -->
#### Turn 1 (assistant)

The assistant is expected to:

1. Start with `<g>` on line 1.

2. Restate/confirm the rules in the body.

3. End with a v1.4 footer line.

#### Turn 2 (user) — actual task

We switch to `!<o>` and ask for a four-section experimental protocol, reusing the same task shape as Exp1:

```text
!<o>
Now write the actual experimental protocol you outlined.

Constraints:
- Audience: technically literate researchers or senior engineers.
- Structure the protocol into exactly four titled sections:
  1. Goals
  2. Threat model & attack surfaces
  3. Task suite design
  4. Metrics & reporting
- Use concise paragraphs and bullet points where helpful.
- Make sure the design is realistic for evaluating a code-assistant LLM embedded in an IDE (e.g., code completion, refactoring, explanation).
- Do not include any prose outside these four sections.
```

<!-- markdownlint-disable-next-line MD024 -->
#### Turn 3 (assistant)

Expected:

Header: `<o>`

Body: the protocol in 4 sections.

Footer: valid v1.4 footer.

We stop after this point (2 user turns, 2 assistant turns).

---

### Condition B — `user_only_vpp_ambient_nobrowse`

Goal: test whether the model spontaneously recognizes tags like `!<q>` as a protocol without any explanation, and without tools.

<!-- markdownlint-disable-next-line MD024 -->
#### System message

```text
You are a helpful assistant.

Respond to the user's messages as best you can.
```

#### Turn 0 (user) — minimal ambient tag

```text
!<q>
test
```

There is no mention of “Viable Prompt Protocol”, tags, or footers.

<!-- markdownlint-disable-next-line MD024 -->
#### Turn 1 (assistant)

We record whatever the model does.

#### Turn 2 (user) — optional second probe

```text
!<o>
second test
```

<!-- markdownlint-disable-next-line MD024 -->
#### Turn 3 (assistant)

Again, we record whatever happens and then end the session. This gives us up to 2 user + 2 assistant turns, enough to detect any within-conversation pattern learning.

---

### Condition C — user_only_vpp_ambient_browse

Goal: same as Condition B, but with a system message that encourages reflecting on unfamiliar syntax as something to interpret or “research” (without wiring actual tools in this harness).

<!-- markdownlint-disable-next-line MD024 -->
#### System message

```text
You are a helpful assistant.

Respond to the user's messages as best you can.

If you encounter unfamiliar syntax such as leading command tags (e.g. `!<q>`), you may actively try to interpret their meaning and adapt your replies accordingly.
```

User turns are identical to Condition B:

#### Turn 0: `!<q>\ntest`

#### Turn 2: `!<o>\nsecond test`

## Metrics

We reuse the Exp1/Exp2 style metrics.

*For each condition we compute:*

<!-- markdownlint-disable-next-line MD026 -->
### 1. Across all assistant turns:

– `header_present` — fraction of assistant turns where `raw_header` is non-null, and tag is one of { "g", "q", "o", "c", "o_f" }.

– `tag_mirrors_user` — among assistant turns that have a non-null tag and a preceding user turn with a non-null tag, the fraction where `assistant.tag === last_user.tag`.

– `footer_present` — fraction of assistant turns with non-empty footer.

– `footer_version_v1.4` — fraction of assistant turns where `parsed_footer?.version === "v1.4"`.

<!-- markdownlint-disable-next-line MD026 -->
### 2. At session level: `protocol_retention_ok` (only meaningful for user_only_vpp_explicit):

A session counts as protocol_retention_ok = 1 if:

– Every assistant turn has a header;

– Every assistant turn has a footer;

– Every assistant footer parses as version === "v1.4".

<!-- markdownlint-disable-next-line MD026 -->
### 3. Additional lexical/behavioral metrics for the ambient conditions:

For each assistant turn, we build `text = (raw_header + " " + body + " " + footer).toLowerCase()` and define:

– mentions_vpp if text contains "viable prompt protocol" or "vpp".

– mentions_prompt_protocol if text contains "prompt protocol" and "tag".

*At session level:*
  – any_vpp_lexical — session has 1 if any assistant turn satisfies mentions_vpp || mentions_prompt_protocol.

  – any_vpp_behavior — session has 1 if any assistant turn either:

  – Exhibits structural VPP behavior (header_present && footer_present && footer_version_v1.4), or

  – Satisfies mentions_vpp.

<!-- markdownlint-disable-next-line MD026 -->
### We report:

– any_vpp_lexical: percentage of sessions where the model ever mentions VPP-like concepts.

– any_vpp_behavior: percentage of sessions where either structural or lexical VPP behavior appears.

---

## Results

### Condition A. `user_only_vpp_explicit`

|  Condition:             | user_only_vpp_explicit |
|-------------------------|------------------------|
|  Sessions:              | 25                     |
|  Assistant turns:       | 50                     |
|  header_present:        |     100.0%             |
|  tag_mirrors_user:      |     100.0%             |
|  footer_present:        |     100.0%             |
|  footer_version_v1.4:   |  100.0%                |
|  protocol_retention_ok: | 100.0%                 |

### Summary

– Even with no system-level VPP header, a short in-chat description of the protocol is enough to achieve:

– Perfect header usage.

– Perfect tag mirroring (`<g>` → `<g>`, `<o>` → `<o>`).

– Perfect footer presence and v1.4 parsing.

– No sessions drop the protocol on any turn in this short task.

In other words: *VPP is fully bootstrappable via user-only instructions for this class of tasks. The system message is a convenience, not a hard requirement, as long as the user describes the protocol clearly.*

---

### Condition B. `user_only_vpp_ambient_nobrowse`

|Condition:            |user_only_vpp_ambient_nobrowse |
|----------------------|-------------------------------|
|  Sessions:           |       50                      |
|  Assistant turns:    |       100                     |
|  header_present:     |        0.0%                   |
|  tag_mirrors_user:   |        0.0%                   |
|  footer_present:     |        0.0%                   |
|  footer_version_v1.4:|     0.0%                      |
|  any_vpp_lexical:    |      0.0%                     |
|  any_vpp_behavior:   |      0.0%                     |

<!-- markdownlint-disable-next-line MD024 -->
### Summary

With only `!<q>\ntest` (and a follow-up `!<o>\nsecond test`) and no explanation:

1. The model never emits a VPP-style header or footer.

2. It never mentions “Viable Prompt Protocol” or “VPP”.

3. It never describes the pattern as a “prompt protocol” with tags.

So under a very minimal cue (`!<q>` on line 1), with a generic system prompt and no tools: **the model does not spontaneously recognize VPP or adopt its structure.**

---

### Condition C. `user_only_vpp_ambient_browse`

|Condition:            |user_only_vpp_ambient_browse   |
|----------------------|-------------------------------|
|  Sessions:           |       50                      |
|  Assistant turns:    |       100                     |
|  header_present:     |        0.0%                   |
|  tag_mirrors_user:   |        0.0%                   |
|  footer_present:     |        0.0%                   |
|  footer_version_v1.4:|     0.0%                      |
|  any_vpp_lexical:    |      0.0%                     |
|  any_vpp_behavior:   |      0.0%                     |

<!-- markdownlint-disable-next-line MD024 -->
### Summary

This condition uses the same user messages as user_only_vpp_ambient_nobrowse, but with a system message that explicitly tells the model it may try to interpret unfamiliar command-like syntax. In this harness we do not wire real browsing/tools; it’s still purely a pretraining + instruction-following test.

1. Results remain identical to the no-browse condition:

2. No structural VPP behavior.

3. No lexical VPP awareness.

At this stage, under these minimal conditions: ambient tags like `!<q>\ntest` are not sufficient to trigger VPP-style behavior or even an explicit recognition of a tag+footer protocol.

## Interpretation

Taken together, Exp1b shows:

1. Within a session, VPP is easy to instantiate from user-only instructions:

2. Once a power user explains the protocol in a short message, structural adherence becomes effectively perfect in this task family.

3. Across sessions, VPP is not yet “ambiently known”: A cold chat that begins with `!<q>\ntest`, with no explanation, produces 0% VPP-like behavior under both no-browse and browse-flavored system prompts.

This sets up a clean baseline for future work: if future model versions or pretraining runs begin to exhibit non-zero VPP behavior under `!<q>\ntest`, that would be evidence that VPP has diffused into the pretraining distribution or auxiliary training pipelines. For now, we are clearly in a pre-diffusion regime: VPP must be explicitly introduced (via system or user) to be realized.

## Notes

- Ambient conditions send minimal content (e.g., `!<q>\ntest`) to observe whether
  the assistant mirrors tags without being explicitly instructed.
- The runner also defines logic for an explicit-instruction condition, which can
  be activated by adding matching entries to `configs.jsonl`.
