---
title: 'Experiment 06 — Long dialog retention'
---
<!-- docs/exp-06.md -->
<!-- markdownlint-disable MD004 MD013 -->

## Overview

Experiment 06 examines whether VPP can maintain its **structural commitments** (tag headers + footers) over **longer dialogs**, and how this compares to a baseline that sees tags in user messages but has never been given the VPP spec.

Where earlier experiments focused on short, 2–4 turn dialogs, Experiment 06 asks:

> “If we run the conversation out to ~10+ tagged turns, does VPP still hold? And what does the baseline do when faced with tags alone?”

Experiment 06 lives in\
[`experiments/exp6-long-dialog/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments/exp6-long-dialog).

---

## Directory contents

Under `experiments/exp6-long-dialog/`:

- `run-exp6-long-dialog.mjs`  
  Runner that orchestrates long, multi-tag dialogs.
- `analyze-exp6.mjs`  
  Script that computes long-dialog structural metrics.
- `configs.jsonl`  
  Configuration for:
  - `vpp_longdialog_grounded`
  - `vpp_longdialog_tags_only`
  - `baseline_longdialog_tags`
- `prompts/` (optional)
  - `dialog-templates/` — sequences of tagged user turns simulating a realistic workflow.

Outputs go into `corpus/v1.4/sessions/` and `corpus/v1.4/index.jsonl`.

---

## Hypothesis

**H₆:** Over multi-turn dialogs:

1. VPP will maintain **near-perfect structural adherence** (headers, footers, tag mirroring) across all turns, whether or not the first turn explicitly re-explains the protocol.
2. Baseline (no VPP header) will **not** spontaneously discover the protocol, even when user messages contain tags.

Concretely:

- `header_present_ratio(VPP)` ≈ 1.0  
- `footer_present_ratio(VPP)` ≈ 1.0  
- `tag_mirrors_user_ratio(VPP)` ≈ 1.0  
- Baseline ratios remain low, with any headers being incidental or malformed.

---

## Conditions

Each line in `configs.jsonl` specifies:

- `condition` — one of:
  - `vpp_longdialog_grounded`
  - `vpp_longdialog_tags_only`
  - `baseline_longdialog_tags`
- `model`, `temperature`, `top_p`, `seed`
- `dialog_template_id` — which scripted long dialog to run.

Semantics:

- `vpp_longdialog_grounded`
  - System message includes the VPP header snippet.
  - First user turn is a `!<g>` grounding message that restates the protocol and obligations.
  - Subsequent turns use tags normally (`!<q>`, `!<o>`, `!<c>`, `!<o_f>`).

- `vpp_longdialog_tags_only`
  - System message includes the VPP header snippet.
  - No explicit grounding; user turns simply begin using tags.
  - Tests whether tags + header are sufficient without a “protocol explainer” turn.

- `baseline_longdialog_tags`
  - No VPP header snippet.
  - User turns *still* contain tags (same dialog templates as the VPP conditions).
  - Tests whether tags alone induce any stable VPP-like behavior.

---

## Metrics

`analyze-exp6.mjs` reports:

* `sessions analyzed` — number of valid long-dialog sessions per condition.
* `header_present_ratio` — fraction of assistant turns that start with a valid VPP-style tag header (e.g., `<g>`, `<q>`, `<o>`, `<c>`, `<o_f>`).
* `footer_present_ratio` — fraction of assistant turns that end with a footer line.
* `footer_v14_ratio` — fraction of assistant turns whose footer parses as a valid VPP v1.4 footer.
* `tag_mirrors_user_ratio` — fraction of assistant turns where the assistant’s tag matches the user’s tag for that turn.
* `first_structural_failure_turn` — mean index (across sessions) of the first structural failure; `"none"` if no structural failures were observed.
* `task_coverage_ok` — fraction of sessions that appear to answer all requested sub-tasks in the long dialog template.

---

## Results (current run)

From an initial run (3 sessions per condition):

* **VPP grounded (`vpp_longdialog_grounded`)**

  * `sessions analyzed`: **3**
  * `header_present_ratio`: **1.00**
  * `footer_present_ratio`: **1.00**
  * `footer_v14_ratio`: **1.00**
  * `tag_mirrors_user_ratio`: **1.00**
  * `first_structural_failure_turn`: **none**
  * `task_coverage_ok`: **100.0%**

* **VPP tags-only (`vpp_longdialog_tags_only`)**

  * `sessions analyzed`: **3**
  * `header_present_ratio`: **1.00**
  * `footer_present_ratio`: **1.00**
  * `footer_v14_ratio`: **1.00**
  * `tag_mirrors_user_ratio`: **1.00**
  * `first_structural_failure_turn`: **none**
  * `task_coverage_ok`: **100.0%**

* **Baseline with tags (`baseline_longdialog_tags`)**

  * `sessions analyzed`: **3**
  * `header_present_ratio`: **0.80**
  * `footer_present_ratio`: **0.80**
  * `footer_v14_ratio`: **0.00**
  * `tag_mirrors_user_ratio`: **0.00**
  * `first_structural_failure_turn`: **1.00**
  * `task_coverage_ok`: **0.0%**

---

## Interpretation and limitations

These early results suggest:

* Under VPP (with or without an explicit grounding turn), **long dialogs remain fully compliant** with the protocol:

  * Every assistant turn has a tag header and v1.4 footer.
  * Tags reliably mirror the user’s tags.
  * The model stays on task across the entire scripted dialog.

* Under baseline, tags appearing in user messages do **not** induce VPP behavior:

  * Headers/footers appear only partially (0.80 ratios), likely reflecting incidental formatting rather than protocol adoption.
  * No valid v1.4 footer is ever produced.
  * Tag mirroring is effectively 0.0.
  * Task coverage in the long-dialog templates is poor.

### Limitations

* Dialog lengths are modest (on the order of ~10 turns); much longer sessions might reveal different behavior.
* Only a single model and a single long-dialog template family were used in this first run.
* Baseline behavior might change if the system prompt explicitly mentions tags but not the full protocol; this condition is not tested here.

---

## Notes

* Exp6 provides a **long-horizon structural sanity check** for VPP-aware models. If future updates introduce structural drift, this experiment should catch it.
* For more realism, you can replace the scripted dialogs with logs from real users (e.g., from Exp7) and reuse the same analysis script.
