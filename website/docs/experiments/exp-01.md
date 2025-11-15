---
title: 'Experiment 01 — Protocol retention'
---

## Overview

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

## Running the experiment

Set `OPENAI_API_KEY` and execute:

```bash
npm run run:exp1-protret
```

The runner appends session records to `corpus/v1.4/sessions/` and adds index
entries to `corpus/v1.4/index.jsonl`. Analysis scripts can be invoked with:

```bash
npm run analyze:exp1
```

Both scripts rely on the same corpus layout validated by
`node scripts/test-transcripts.mjs`.

## Notes

- The baseline branch deliberately withholds the VPP header snippet and footer
  spec so the comparison isolates protocol retention.
- Escalations use the standard VPP escape rules when the `condition` is `vpp`.
