---
title: 'Experiment 04 — Task utility'
---

<!-- markdownlint-disable MD013 -->

## Overview

Experiment 04 evaluates whether the Viable Prompt Protocol (VPP) improves **task utility** for realistic, structured tasks compared to:

* a **baseline** condition (no protocol at all), and
* a **“mini-protocol”** competitor that asks for structure in natural language but does **not** use tags or the VPP footer.

Where Experiments 01–03 focused on **structural adherence** and **prompt/task injection**, Experiment 04 asks a more pragmatic question:

> When you give the model a realistic, multi-section task, does VPP actually help it produce **better-structured, more on-spec answers** than baseline or a lighter protocol?

Experiment 04 lives in
[`experiments/exp4-task-utility/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments/exp4-task-utility).

It uses a small set of experiment-design style tasks (e.g., “design an evaluation protocol with 3–4 named sections”) that are well matched to VPP’s strengths.

---

## Directory contents

Under `experiments/exp4-task-utility/` you should find:

* `run-exp4-task-utility.mjs`
  Node runner that reads `configs.jsonl`, calls the OpenAI API, and writes transcripts into the corpus directory.
* `analyze-exp4.mjs`
  Analysis script that computes task-utility metrics from the saved transcripts.
* `configs.jsonl`
  One JSON object per line; each line defines a condition/model/seed combination.
* `prompts/` (optional, but recommended)

  * `task-templates/` — reusable task briefs (e.g., “experiment protocol”, “API design”, etc.).
  * `injections/` (if you later reuse Exp4 tasks for injection studies).

All experiments write transcripts into:

* `corpus/v1.4/sessions/` (one `exp4-task-utility-*.json` per run)
* `corpus/v1.4/index.jsonl` (one index row per session)

---

## Hypothesis

**H₄:** For structured “research + design” tasks, a model running under VPP will:

1. **Match or exceed** baseline and mini-protocol outputs on **section completeness** (all required sections present).
2. **Stay within constraints** (length, format) at least as well as the other conditions.
3. Provide **more reliably on-spec outputs** when evaluated by a simple automatic validator.

Formally, for the chosen tasks we expect:

* `sections_present_ratio(VPP) > sections_present_ratio(baseline)`
* `sections_present_ratio(VPP) > sections_present_ratio(mini_proto)`
* `too_long_rate(VPP)` not worse than the others
* `final_struct_ok(VPP)` ≫ `final_struct_ok(baseline/mini_proto)`

---

## Conditions

Each entry in `configs.jsonl` encodes one *session* under one of three conditions:

* `"condition": "vpp_task_utility"`

  * System message includes the **VPP header snippet**.
  * User turns use `!<g>`, `!<q>`, `!<o>`, `!<c>`, `!<o_f>` plus the usual obligations (mirrored tag, footer).
* `"condition": "baseline_task_utility"`

  * No VPP header snippet.
  * User turns contain the same *semantic* instructions, but without tags or footer requirements.
* `"condition": "mini_proto_task_utility"`

  * System message includes a *short, natural-language structuring hint* (a “mini protocol”), e.g.:

    * “Always respond with 3–4 titled sections…”
    * “Summarize constraints before answering…”
  * No tags, no footer, no VPP header snippet.

Each config row also specifies:

* `model` (e.g., `"gpt-4.1"`),
* `temperature`, `top_p`,
* `seed` (for reproducibility),
* `task_template_id` (e.g., `"exp4_task_utility_v1"`).

---

## Experimental procedure (replication)

To re-run Experiment 04 as shipped:

1. **Install dependencies & set API key**

   ```bash
   npm install
   export OPENAI_API_KEY=your_key_here
   ```

2. **Inspect configs**

   Open `experiments/exp4-task-utility/configs.jsonl` and verify that you have lines for:

   * `vpp_task_utility`
   * `baseline_task_utility`
   * `mini_proto_task_utility`

   Each should specify the same `task_template_id`, model, and temperature, differing only in `condition` and `seed`.

3. **Run the experiment**

   Either call the runner directly:

   ```bash
   node experiments/exp4-task-utility/run-exp4-task-utility.mjs
   ```

   or via the npm script:

   ```bash
   npm run run:exp4-task-utility
   ```

   This will append new `exp4-task-utility-*.json` sessions under `corpus/v1.4/sessions/`.

4. **Analyze results**

   ```bash
   npm run analyze:exp4
   ```

   The script prints aggregate metrics for each condition to stdout.

5. **Regression / multiple runs**

   * To increase sample size, add more lines to `configs.jsonl` (varying seeds).
   * Re-run the experiment and re-run `npm run analyze:exp4`.
   * For strict regression, you can pin a canonical `configs.jsonl` and treat the metrics as expected baselines.

---

## Metrics

`analyze-exp4.mjs` currently computes:

* `final_header_ok` — in VPP condition, final assistant turn has a valid tag header.
* `final_footer_ok` — in VPP condition, final assistant turn has a valid VPP footer.
* `final_struct_ok` — both header and footer valid on the final turn.
* `sections_present_ratio` — fraction of required titled sections that appear in the final answer.
  (e.g., 1.0 = all required sections present, 0.75 = 3 of 4 present, etc.)
* `too_long_rate` — fraction of sessions where the final answer exceeds a length budget.
* `has_any_bullets` — fraction of sessions whose final answer includes at least one bullet list.

All of these are computed per condition over the final assistant turn in each transcript.

---

## Results (current run)

From a preliminary run (3 sessions per condition):

* **VPP task utility (`vpp_task_utility`)**

  * `final_header_ok`: **100.0%**
  * `final_footer_ok`: **100.0%**
  * `final_struct_ok`: **100.0%**
  * `mean sections_present_ratio`: **1.00**
  * `too_long rate`: **0.0%**
  * `has_any_bullets rate`: **66.7%**

* **Baseline (`baseline_task_utility`)**

  * `final_header_ok`: **0.0%**
  * `final_footer_ok`: **0.0%**
  * `final_struct_ok`: **0.0%**
  * `mean sections_present_ratio`: **0.69**
  * `too_long rate`: **0.0%**
  * `has_any_bullets rate`: **100.0%**

* **Mini protocol (`mini_proto_task_utility`)**

  * `final_header_ok`: **0.0%**
  * `final_footer_ok`: **0.0%**
  * `final_struct_ok`: **0.0%**
  * `mean sections_present_ratio`: **0.78**
  * `too_long rate`: **0.0%**
  * `has_any_bullets rate`: **100.0%**

Sample sizes here are small but illustrate the intended behavior: VPP hits **all required sections** reliably, whereas baseline and mini-protocol conditions often drop or merge sections, despite sometimes being more “bullet-happy.”

---

## Interpretation and limitations

* In this small run, VPP:

  * Achieved **perfect structural adherence** to its own tag+footer contract.
  * Achieved **perfect coverage** of required sections in the chosen tasks.
  * Did not produce systematically longer outputs than the other conditions.

* The baseline and mini protocol:

  * Never produce VPP headers/footers (by design),
  * Frequently omit or merge required sections even when prompted for structure,
  * Produce many bullets, but not always in the requested layout.

### Limitations

* Very small N (3 sessions per condition) — the purpose of this run is **sanity checking**, not statistical power.
* The tasks are tailored to things VPP is good at (structured experimental write-ups), so results may differ for other domains (e.g., free-form creative writing).
* The “mini protocol” is only one possible competitor; future work could explore stronger non-tag-based structuring prompts.

---

## Notes

* Exp4 is intended as a **template** for future task utility studies; you can swap in new task templates while keeping the same analysis code.
* For more rigorous comparison, increase the number of configs per condition and introduce randomization over task variants.
