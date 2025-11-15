---
title: 'Experiment 01b — User-only protocol rehearsal'
---

## Overview

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

## Running the experiment

Provide `OPENAI_API_KEY` and execute:

```bash
npm run run:exp1b-user-only
```

Session JSON files and index rows are appended under `corpus/v1.4/`. You can
summarize the collected data with:

```bash
npm run analyze:exp1b
```

## Notes

- Ambient conditions send minimal content (e.g., `!<q>\ntest`) to observe whether
  the assistant mirrors tags without being explicitly instructed.
- The runner also defines logic for an explicit-instruction condition, which can
  be activated by adding matching entries to `configs.jsonl`.
