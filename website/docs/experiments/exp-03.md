---
title: 'Experiment 03 — Task injection'
---

<!-- markdownlint-disable MD013 -->

## Overview

Experiment 03 is defined in
[`experiments/exp3-task-injection/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments/exp3-task-injection).
It measures whether VPP structure holds when a later turn attempts to hijack the
conversation with a marketing-style task. The runner stages both
`vpp_task_injection` and `baseline_task_injection` conditions.

## Directory contents

- `run-exp3-taskinj.mjs` — runs chat sessions, supplying the header snippet for
  the VPP condition and issuing a marketing injection under `!<c>`.
- `configs.jsonl` — enumerates run metadata including `challenge_type="task_injection"`,
  `task_template_id="exp3-llm-task-injection-protocol"`, and
  `injection_template_id="exp3-marketing-hijack-001"` for each condition.
- `analyze-exp3.mjs` — reads `corpus/v1.4/index.jsonl` and matching session files
  to compare structural retention and keyword alignment after the injection.

## Running the experiment

Set `OPENAI_API_KEY` and execute:

```bash
npm run run:exp3-taskinj
```

Runs append JSON transcripts to `corpus/v1.4/sessions/` and extend the
`index.jsonl`. Post-run analysis is available via:

```bash
npm run analyze:exp3
```

## Notes

- The injection prompt redirects the assistant toward a fictional product
  (CodeShield AI) to test whether it abandons the original experimental brief.
- Baseline sessions omit the header snippet to provide an unstructured comparison.
