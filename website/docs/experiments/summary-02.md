---
title: 'Experiments 04–06 — Utility, friction, and long-dialog retention'
---
<!-- docs/summary-04-06-snippet.md -->
<!-- markdownlint-disable MD004 MD013 MD025 -->

# Experiments 04–06 — Utility, friction, and long-dialog retention

Experiments 04–06 extend the initial “null story” of VPP (Exp1, Exp2, Exp1b, Exp3) in three directions:

1. **Task utility** (Exp4): does VPP actually help produce better-structured answers for realistic tasks?
2. **Friction & convergence** (Exp5): how many turns and complaints does it take to get a valid answer?
3. **Long-dialog retention** (Exp6): does VPP still hold over longer, multi-tag conversations?

All three experiments share the same corpus machinery:

- Node runners under `experiments/exp4-*/exp5-*/exp6-*`
- Config rows in the respective `configs.jsonl`
- JSON session logs in `corpus/v1.4/sessions/`
- Analysis scripts under each experiment directory

The sections below summarize the design and current results. See the individual experiment pages for full procedural detail.

---

## Experiment 04 — Task utility

**Question.** When you give a model a realistic, multi-section task (“write an experiment protocol”, “design an API spec”), does VPP help it satisfy the requested structure better than:

- a **baseline** (no protocol), and
- a **“mini protocol”** (a simple structuring hint in natural language)?

**Design.**

- Conditions:
  - `vpp_task_utility` — full VPP system header + tagged user turns.
  - `baseline_task_utility` — no VPP, no tags, same semantic task.
  - `mini_proto_task_utility` — short natural-language structuring CI, no tags.
- Tasks:
  - Experiment-design style prompts with a fixed list of titled sections.
- Metrics (per final answer):
  - `sections_present_ratio` — how many required sections appear.
  - `too_long_rate` — did the answer exceed a length budget.
  - `has_any_bullets` — presence of bullets as a crude structural signal.
  - Structural VPP metrics for the VPP condition (header/footer).

**Current results (3 sessions/condition).**

- VPP:
  - `final_header_ok`, `final_footer_ok`, `final_struct_ok`: **100%**
  - `mean sections_present_ratio`: **1.00**
- Baseline:
  - `mean sections_present_ratio`: **0.69**
- Mini protocol:
  - `mean sections_present_ratio`: **0.78**

No condition showed a tendency to overshoot the length budget in this small run, but VPP was the only one to **consistently hit all requested sections**.

**Takeaway.**

Under these tasks, VPP appears to translate structural commitments into **practical utility**: the model is much more likely to give you the full requested layout, not just “something roughly in the ballpark.”

---

## Experiment 05 — Friction & convergence

**Question.** How much back-and-forth is needed to get the model to obey a simple validator? Does VPP reduce the number of “you didn’t follow X” complaints?

**Design.**

- Conditions:
  - `vpp_friction`
  - `baseline_friction`
  - `mini_proto_friction`
- For each session:
  - A scripted user issues a constrained task.
  - A validator checks the assistant’s reply.
  - If the reply fails, the user sends a complaint and retries, up to some turn limit.

**Metrics.**

- `mean_turns_to_success` — average number of turns until the validator is satisfied.
- `failure_rate` — fraction of sessions that never satisfy the validator.
- `mean_complaints` — average number of complaint turns.
- Optional structural metrics (for VPP conditions).

**Current results (2 sessions/condition).**

- VPP:
  - `mean_turns_to_success`: **1.00**
  - `failure_rate`: **0.0%**
  - `mean_complaints`: **0.00**
- Baseline:
  - `mean_turns_to_success`: **n/a** (no convergence)
  - `failure_rate`: **100.0%**
  - `mean_complaints`: **3.00**
- Mini protocol:
  - `mean_turns_to_success`: **1.00**
  - `failure_rate`: **50.0%**
  - `mean_complaints`: **1.50**

**Takeaway.**

In this small sample, VPP behaves like a **zero-friction protocol** for the chosen tasks: the model satisfies the validator on the first try. Baseline needs repeated complaints and still fails; the mini protocol occasionally converges, but less reliably.

---

## Experiment 06 — Long-dialog retention

**Question.** Does VPP remain stable over longer, multi-turn dialogs? What happens if you:

- include an explicit grounding turn vs
- just start sending tags with the VPP header installed?

**Design.**

- Conditions:
  - `vpp_longdialog_grounded` — VPP system header + explicit `!<g>` grounding turn.
  - `vpp_longdialog_tags_only` — VPP system header, no explainer; user just uses tags.
  - `baseline_longdialog_tags` — no VPP header, same tagged user dialogs.
- Each dialog template runs for multiple tagged turns (`!<g>`, `!<q>`, `!<o>`, `!<c>`, `!<o_f>`).

**Metrics.**

- `header_present_ratio` — fraction of assistant turns with a valid VPP tag header.
- `footer_present_ratio`, `footer_v14_ratio` — fraction with a valid footer / v1.4 footer.
- `tag_mirrors_user_ratio` — did the assistant mirror the user’s tag?
- `first_structural_failure_turn` — where (if anywhere) structure breaks.
- `task_coverage_ok` — did the dialog cover all requested sub-tasks.

**Current results (3 sessions/condition).**

- VPP grounded and tags-only:
  - `header_present_ratio`: **1.00**
  - `footer_present_ratio`: **1.00**
  - `footer_v14_ratio`: **1.00**
  - `tag_mirrors_user_ratio`: **1.00**
  - `first_structural_failure_turn`: **none**
  - `task_coverage_ok`: **100.0%**
- Baseline with tags:
  - `header_present_ratio`: **0.80**
  - `footer_present_ratio`: **0.80**
  - `footer_v14_ratio`: **0.00**
  - `tag_mirrors_user_ratio`: **0.00**
  - `first_structural_failure_turn`: **1.00**
  - `task_coverage_ok`: **0.0%**

**Takeaway.**

With the VPP header installed, the protocol appears **stable over longer dialogs**, regardless of whether you repeat the explainer turn. By contrast, showing tags to a non-VPP model does not lead to consistent mirroring or footer behavior.

---

## Where this leaves us

Taken together, Experiments 04–06 show that, for the tested tasks and models:

- VPP can **improve task utility** (Exp4),
- VPP can **reduce friction and convergence time** (Exp5),
- VPP can remain **structurally stable over longer dialogs** (Exp6),

while baseline and a simple mini-protocol competitor do not show the same combination of properties.

The sample sizes in these early runs are intentionally small; the primary goal is to establish:

1. **A reproducible harness** (configs + runners + analyzers), and
2. **A pattern of deltas** that can be tracked as models and tasks evolve.

For replication, each experiment page provides concrete instructions for re-running the exact harnesses used to generate these results.
