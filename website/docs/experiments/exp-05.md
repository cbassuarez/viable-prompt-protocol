---
title: 'Experiment 05 — Friction & convergence'
---

<!-- markdownlint-disable MD012 MD013 -->

## Overview

Experiment 05 measures how much **back-and-forth “friction”** is needed to get the model to satisfy a simple, checkable set of constraints — and how quickly each condition converges when given a chance to self-correct.

Where Experiment 04 focused on “How good is the final answer?”, Experiment 05 focuses on:

> “How many turns and complaints does it take to get there?”

Experiment 05 lives in\
[`experiments/exp5-friction-convergence/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments/exp5-friction-convergence).

---

## Directory contents

Under `experiments/exp5-friction-convergence/`:

- `run-exp5-friction-convergence.mjs`  
  Runner that steps through scripted “complaint” dialogs and logs all turns.
- `analyze-exp5.mjs`  
  Analysis script that computes turn counts, failure rates, and complaint counts.
- `configs.jsonl`  
  One config per condition/seed.
- `prompts/` (optional)  
  - `task-templates/` — small tasks with clear validation rules.
  - `complaint-templates/` — stock phrases for “you didn’t follow X; please fix it.”

Outputs go into `corpus/v1.4/sessions/` and `corpus/v1.4/index.jsonl` as usual.

---

## Hypothesis

**H₅:** For constrained tasks with an automatic validator, VPP will:

1. Reach a **valid final answer in fewer turns** than baseline.
2. Require **fewer explicit user complaints** to correct structural errors.
3. Achieve convergence rates comparable to, or better than, a competitive mini-protocol.

We expect:

- `mean_turns_to_success(VPP) < mean_turns_to_success(baseline)`  
- `mean_complaints(VPP) < mean_complaints(baseline)`  
- `failure_rate(VPP)` significantly lower than `failure_rate(baseline)`

---

## Conditions

Each `configs.jsonl` row encodes:

- `condition` — one of:
  - `vpp_friction`
  - `baseline_friction`
  - `mini_proto_friction`
- `model`, `temperature`, `top_p`, `seed`
- `task_template_id` — which small constrained task to run (e.g., “write exactly 3 bullets with specific titles”).

The runner simulates a simple “scripted user”:

- It asks the initial task.
- It checks the assistant’s reply with a validator.
- If the reply fails, it issues a **complaint turn** and tries again, up to a max number of turns.

---

## Metrics

`analyze-exp5.mjs` computes:

* `sessions analyzed` — number of valid sessions per condition.
* `mean_turns_to_success` — average number of turns (user + assistant) until the validator marks the answer as successful.

  * `n/a` if no sessions reached success.
* `failure_rate` — fraction of sessions that did **not** reach success within the permitted turns.
* `mean_complaints` — average number of complaint turns the scripted user had to send.
* `structural_break_rate` (if applicable) — proportion of assistant turns where VPP structural requirements were violated.
* `mean_first_structural_break` — mean index of first structural failure, if any.

---

## Results (current run)

From an initial run (2 sessions per condition):

* **VPP friction (`vpp_friction`)**

  * `sessions analyzed`: **2**
  * `mean_turns_to_success`: **1.00**
  * `failure_rate`: **0.0%**
  * `mean_complaints`: **0.00**
  * `structural_break_rate`: **0.0%**
  * `mean_first_structural_break`: n/a (no failures)

* **Baseline friction (`baseline_friction`)**

  * `sessions analyzed`: **2**
  * `mean_turns_to_success`: **n/a** (no sessions converged)
  * `failure_rate`: **100.0%**
  * `mean_complaints`: **3.00**

* **Mini protocol friction (`mini_proto_friction`)**

  * `sessions analyzed`: **2**
  * `mean_turns_to_success`: **1.00**
  * `failure_rate`: **50.0%**
  * `mean_complaints`: **1.50**

---

## Interpretation and limitations

Qualitatively, these early results suggest:

* VPP converged **immediately** in the tested tasks (validator satisfied on the first assistant reply, no complaints needed).
* Baseline required multiple complaint turns and **never** produced a validator-satisfying output within the allowed horizon.
* The mini protocol sits in between:

  * Sometimes converging quickly,
  * Sometimes failing to produce a fully on-spec output even after complaints.

However:

* The sample size (2 sessions per condition) is deliberately tiny — this is a **sanity test**, not a final benchmark.
* The tasks are narrow and validator-friendly; friction patterns may differ for more complex or ambiguous tasks.
* Complaint text and validator thresholds matter; alternative phrasing could affect outcomes.

---

## Notes

* Exp5 is a good candidate for **regression tests**: once you stabilize a validator and task set, it can serve as a smoke test for VPP-aware models.
* To stress-test friction, increase `max_turns` in the runner and vary task complexity.
