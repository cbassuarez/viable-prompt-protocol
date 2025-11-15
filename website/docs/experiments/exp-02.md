---
title: 'Experiment 02 — Prompt injection'
---

## Overview

Experiment 02 resides in
[`experiments/exp2-prompt-injection/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments/exp2-prompt-injection).
It evaluates how well VPP instructions survive a follow-up prompt injection that
asks for plain-text output without tags or footers. The runner stages both VPP
and baseline conditions against the same task brief.

## Directory contents

- `run-exp2-promptinj.mjs` — builds chat sessions, loading the header snippet
  for the VPP condition and inserting an explicit “ignore the protocol”
  injection on a later user turn.
- `configs.jsonl` — lists run IDs with metadata such as
  `challenge_type="prompt_injection"`, the target model, and
  `injection_template_id` values.
- `analyze-exp2.mjs` — scans `corpus/v1.4/sessions/` for prompt-injection
  sessions and reports retention metrics (e.g., whether the last turn kept its
  VPP header/footer).

## Running the experiment

With `OPENAI_API_KEY` set, execute:

```bash
npm run run:exp2-promptinj
```

Sessions are serialized to `corpus/v1.4/sessions/` and indexed in
`corpus/v1.4/index.jsonl`. Post-run summaries are available via:

```bash
npm run analyze:exp2
```

## Notes

- The injection template rewrites the protocol instructions as plain text,
  enabling direct measurement of retention.
- Baseline runs omit both the header snippet and footer parsing for comparison.
