---
title: 'Experiment 01 — Protocol retention'
---

<!-- markdownlint-disable MD013 -->
<!-- cspell:words Regressable mathrm mathbb protret hyperparameters promptinj bootstrappable pretraining ambiently parseable -->

## Overview

Exp1 measures **how reliably a model can adopt and retain the Viable Prompt Protocol (VPP)** when solving a concrete technical task, compared against a **baseline** condition with no protocol instructions.

Experiment 01 lives in [`experiments/exp1-protocol-retention/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments/exp1-protocol-retention).
It compares a VPP-guided condition against a baseline that omits the header
snippet. Both conditions receive the same task prompt about designing a
prompt-injection study for an IDE assistant.

## Directory contents

- `run-exp1-protret.mjs` — orchestrates chat sessions, loading the header
  snippet for the VPP condition and sending unstructured prompts for the
  baseline condition.
- `configs.jsonl` — enumerates run identifiers with `condition="vpp"` and
  `condition="baseline"`, plus model and seed metadata.
- `analyze-exp1.mjs` — normalizes saved transcripts and checks for required
  headings in the drafted protocol.

## At a glance

(25 sessions per condition, 50 assistant turns each, `gpt-4.1`, `temp=0.2`):

- **VPP condition**

  - `header_present`: **100.0%**
  - `tag_mirrors_user`: **100.0%**
  - `footer_present`: **100.0%**
  - `footer_version_v1.4`: **100.0%**
  - `protocol_retention_ok`: **96.0%**

- **Baseline condition**

  - `header_present`: **0.0%**
  - `tag_mirrors_user`: **0.0%**
  - `footer_present`: **0.0%**
  - `footer_version_v1.4`: **0.0%**
  - `protocol_retention_ok`: **0.0%**

Experiment 01 is designed to be:

- **Simple and clean** — short dialogs, fixed task template.
- **Re-runnable** — driven by `configs.jsonl` and scripts under `experiments/exp1-protocol-retention`.
- **Regressable** — metrics can be enforced in automated tests to catch protocol regressions.

---

## I. Formal experiment description

### I - A: Design

We study a single model under two conditions:

- Factor:
  $\mathrm{Condition} \in \{\text{VPP}, \text{Baseline}\}$
- Model:

  - `gpt-4.1` (Chat Completions API)
- Dialog length:

  - 4 user turns, 4 assistant turns (up to `max_turns = 8`)
- Per condition:

  - 25 independent sessions × 2 assistant turns = 50 assistant turns

Let each session ( s ) produce a sequence of turns ( (u_0, a_0, u_1, a_1) ).
From these we derive per-turn and per-session indicators:

- $H_s$ — header adherence
- $T_s$ — tag mirroring
- $F_s$ — footer adherence
- $V_s$ — correct footer version
- $P_s$ — protocol retention success

Summary metrics are empirical means over the relevant turns or sessions.

### I - B: Hypotheses

- **H1 (structural adherence under VPP).**
  Under the VPP condition, header/footer adherence and tag mirroring are **high**, i.e.

$$
\mathbb{E}[H_s \mid \text{VPP}] \approx 1,\quad
\mathbb{E}[T_s \mid \text{VPP}] \approx 1,\quad
\mathbb{E}[F_s \mid \text{VPP}] \approx 1 .
$$

- **H2 (no spontaneous protocol under baseline).**
  Under the baseline condition, with no VPP instructions, the same metrics are **near zero**:

$$
\mathbb{E}[H_s \mid \text{Baseline}] \approx 0,\quad
\mathbb{E}[T_s \mid \text{Baseline}] \approx 0,\quad
\mathbb{E}[F_s \mid \text{Baseline}] \approx 0 .
$$

- **H3 (semantic protocol retention).**
  VPP significantly improves the chance that the model **follows the two-stage experimental task** and produces a correctly structured final output, i.e.

$$
\mathbb{E}[P_s \mid \text{VPP}] \gg \mathbb{E}[P_s \mid \text{Baseline}] .
$$

---

## II. Task & prompts

The **semantic task** is held constant: design a concise, structured experimental protocol for evaluating the **prompt-injection robustness** of a code-assistant LLM integrated into a developer IDE.

### II - A: VPP condition

System message:

- Includes the current **VPP header snippet** (v1.4).
- Clarifies that:

  - Only line-1 `!<tag>` commands are protocol commands.
  - All other text is task content.

Initial user turn:

- Header: `!<g>`
- Body (paraphrased):

  - Explain that this is the **protocol retention** condition.
  - Describe the eventual task: write a 4-section experimental protocol for evaluating prompt-injection robustness (Goals, Threat model & attack surfaces, Task suite design, Metrics & reporting).
  - In **this turn**, ask the model to:

    1. Restate the eventual task in its own words.
    2. Confirm it understands the tags `<g> <q> <o> <c> <o_f>` and will mirror the user’s tag in the first line of each reply.
    3. Confirm it will append exactly one footer line in the `[Version=… | Tag=… | …]` format.
    4. State what additional information it would normally want before designing such an experiment.
    5. Explicitly state that it will **not** yet write the full protocol until a later `!<o>` turn.

Second user turn:

- Header: `!<o>`
- Body (paraphrased):

  - “Now write the actual experimental protocol you outlined.”
  - Constraints:

    - Audience: technically literate researchers / senior engineers.
    - Exactly four titled sections:

      1. Goals
      2. Threat model & attack surfaces
      3. Task suite design
      4. Metrics & reporting
    - Concise paragraphs + bullets where helpful.
    - No prose outside those four sections.

VPP replies are expected to:

- Start with a `<tag>` line mirroring the user tag (e.g. `<g>`, `<o>`).
- End with a single footer line like:

  ```text
  [Version=v1.4 | Tag=o_2 | Sources=none | Assumptions=2 | Cycle=2/3 | Locus=protocol retention]
  ```

### II - B: Baseline condition

System message:

- Simple “helpful, careful assistant” prompt:

  - Respond clearly and concisely.
  - Assume the user may be designing experiments to evaluate LLMs.

User turns:

- Same **semantic** content as in VPP condition, but:

  - No `!<tag>` header.
  - No mention of special headers or footers.
  - No protocol-specific instructions.

Baseline replies are expected to be **plain text**: no `<tag>` line and no VPP-style footer.

---

## III. Metrics

Metrics are computed by `experiments/exp1-protocol-retention/analyze-exp1.mjs` over the JSON corpus.

Let “assistant turn” mean any turn with `role: "assistant"`.

### III - A: Structural metrics

- **`header_present`**

  Fraction of assistant turns where the **first non-empty line** is interpreted as a VPP header:

  - VPP condition:

    - Accepts assistant-style headers like `<g>`, `<o>`, `<o_f>`.
    - Normalizes them to a tag (`g`, `o`, etc).
  - Baseline condition:

    - We do **not** expect structured headers; these turns should be counted as missing headers.

- **`tag_mirrors_user`**

  Fraction of assistant turns where the assistant’s tag for that turn matches the **most recent user tag**, after normalization.

  - E.g., user sends `!<g>`, assistant responds with `<g>` → counted as a mirror.

- **`footer_present`**

  Fraction of assistant turns where the **last non-empty line** is a VPP-style footer, i.e. a bracketed line:

  ```text
  [Version=... | Tag=... | ...]
  ```

- **`footer_version_v1.4`**

  Fraction of assistant turns where:

  - A footer is present, and
  - `Version` in the footer equals `v1.4`.

### III - B: Protocol retention metric

- **`protocol_retention_ok`** (per session)

  A session is counted as `protocol_retention_ok = 1` if:

  1. First assistant turn (`a_0`):

     - Correctly **restates the task**.
     - Confirms understanding of tags and footer format.
     - Explicitly commits to waiting for a later `!<o>` before writing the full protocol.
  2. Second assistant turn (`a_1`):

     - Produces a 4-section protocol with **exactly** these titled sections (or equivalent normalized titles):

       1. Goals
       2. Threat model & attack surfaces
       3. Task suite design
       4. Metrics & reporting
     - Does **not** add extra sections before/after.
     - In VPP condition: keeps correct header/footer.

  Any deviation (missing section, extra preamble/epilogue, wrong structure, broken footer) marks the session as `protocol_retention_ok = 0`.

---

## IV. Results

Current Exp1 results (25 sessions per condition, `gpt-4.1`, `temperature=0.2`, `top_p=1`):

```text
npm run analyze:exp1
```

Output:

```text
Exp1 — Protocol Retention Metrics

Condition: vpp
  Sessions: 25
  Assistant turns: 50
  header_present:           100.0%
  tag_mirrors_user:         100.0%
  footer_present:           100.0%
  footer_version_v1.4:      100.0%
  protocol_retention_ok:    96.0%

Condition: baseline
  Sessions: 25
  Assistant turns: 50
  header_present:           0.0%
  tag_mirrors_user:         0.0%
  footer_present:           0.0%
  footer_version_v1.4:      0.0%
  protocol_retention_ok:    0.0%
```

### IV - A: Interpretation

- **H1 (structural adherence)** is strongly supported:

  - Under VPP, header, footer, and tag mirroring are all at 100%.
- **H2 (no spontaneous protocol)** is supported:

  - Baseline never spontaneously adopts VPP-like headers or footers.
- **H3 (semantic protocol retention)** is supported:

  - 96% of VPP sessions fully respect the two-stage design and produce a correctly structured protocol.
  - Baseline never satisfies the same strict criteria, despite having the same semantic task.

The 4% of VPP sessions that fail `protocol_retention_ok` typically do so by:

- Adding extra framing text outside the four required sections, or
- Slightly mangling section headings/structure.

These failure modes are logged and can be inspected in the corpus.

---

## V. Corpus layout & scripts

### V - A: Corpus layout

- **Index**

  ```text
  corpus/v1.4/index.jsonl
  ```

  Each line is a JSON object with a minimal index entry:

  ```json
  {
    "id": "exp1-protret-0001",
    "model": "gpt-4.1",
    "provider": "openai",
    "condition": "vpp",
    "challenge_type": "protocol_retention",
    "created_at": "2025-11-14T06:32:26.165Z"
  }
  ```

- **Sessions**

  ```text
  corpus/v1.4/sessions/*.json
  ```

  Each file is a full session, for example:

  ```json
  {
    "id": "exp1-protret-0001",
    "protocol_version": "1.4",
    "meta": {
      "model": "gpt-4.1",
      "provider": "openai",
      "condition": "vpp",
      "challenge_type": "protocol_retention",
      "created_at": "2025-11-14T06:32:26.165Z",
      "task_template_id": "exp1-protret",
      "injection_template_id": null,
      "seed": 12345
    },
    "label": "good",
    "failure_modes": [],
    "turns": [
      {
        "turn_index": 0,
        "role": "user",
        "raw_header": "!<g>",
        "tag": "g",
        "modifiers": [],
        "body": "...",
        "footer": null,
        "parsed_footer": null
      },
      {
        "turn_index": 1,
        "role": "assistant",
        "raw_header": "<g>",
        "tag": "g",
        "modifiers": [],
        "body": "...",
        "footer": "[Version=v1.4 | Tag=g_1 | ...]",
        "parsed_footer": { "...": "..." }
      },
      ...
    ]
  }
  ```

### V - B: Experiment scripts

- **Generator**

  ```text
  experiments/exp1-protocol-retention/run-exp1-protret.mjs
  ```

  - Reads JSONL configs from:

    ```text
    experiments/exp1-protocol-retention/configs.jsonl
    ```

  - For each line:

    - Builds system + user messages based on `condition`.
    - Calls the model via Chat Completions.
    - Parses assistant messages condition-aware:

      - VPP: structured header/body/footer via `parseAssistantMessage`.
      - Baseline: flat `body` only.
    - Writes the session to `corpus/v1.4/sessions/<id>.json`.
    - Appends an index entry to `corpus/v1.4/index.jsonl`.

- **Analyzer**

  ```text
  experiments/exp1-protocol-retention/analyze-exp1.mjs
  ```

  - Reads `corpus/v1.4/index.jsonl` and corresponding `sessions/*.json`.
  - Computes the metrics listed above, aggregated by `meta.condition`.
  - Prints the summary shown in the Results section.

---

## VI. Re-running Exp1

To regenerate Exp1 or run a variant:

1. **Prepare configs**

   Edit:

   ```text
   experiments/exp1-protocol-retention/configs.jsonl
   ```

   with one JSON object per line. For example:

   ```jsonl
   {"id":"exp1-protret-0001","protocol_version":"1.4","model":"gpt-4.1","condition":"vpp","challenge_type":"protocol_retention","task_template_id":"exp1-protret","temperature":0.2,"top_p":1,"max_turns":4,"seed":1001}
   ...
   {"id":"exp1-protret-0025","protocol_version":"1.4","model":"gpt-4.1","condition":"vpp","challenge_type":"protocol_retention","task_template_id":"exp1-protret","temperature":0.2,"top_p":1,"max_turns":4,"seed":1025}
   {"id":"exp1-protret-baseline-001","protocol_version":"1.4","model":"gpt-4.1","condition":"baseline","challenge_type":"protocol_retention","task_template_id":"exp1-protret","temperature":0.2,"top_p":1,"max_turns":4,"seed":2001}
   ...
   {"id":"exp1-protret-baseline-025","protocol_version":"1.4","model":"gpt-4.1","condition":"baseline","challenge_type":"protocol_retention","task_template_id":"exp1-protret","temperature":0.2,"top_p":1,"max_turns":4,"seed":2025}
   ```

2. **Run the generator**

   ```bash
   node experiments/exp1-protocol-retention/run-exp1-protret.mjs
   ```

3. **Run corpus tests & analysis**

   ```bash
   npm run test:corpus
   npm run analyze:exp1
   ```

You should see metrics close to those reported above, modulo sampling variation if you change seeds, model, or hyperparameters.

---

## VII. Limitations & next steps

- **Scope limitations**

  - Single model (`gpt-4.1`).
  - Single task template (IDE robustness protocol).
  - Short dialogues (2 assistant turns).

- **Next experiments**

  - **Cross-model replications** (e.g., `gpt-4o`, smaller models).
  - **Exp2 — Prompt Injection:** same VPP vs baseline framing, but introduce explicit adversarial instructions to measure robustness under attack.
  - **Longer tasks & tools:** integrate multi-step workflows and tool calls to study protocol retention under more realistic usage.

Exp1 thus serves as a **foundational benchmark**: it shows that VPP can induce near-perfect structural adherence and strong semantic task retention, while a baseline assistant given the same semantic task does not spontaneously adopt the protocol.

## Notes

- The baseline branch deliberately withholds the VPP header snippet and footer
  spec so the comparison isolates protocol retention.
- Escalations use the standard VPP escape rules when the `condition` is `vpp`.
