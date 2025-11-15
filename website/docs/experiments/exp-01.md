---
title: 'Experiment 01 — Baseline compliance run'
---

## Overview

Experiment 01 measures how faithfully a frontier model adheres to VPP when provided with the canonical header snippet and minimal prompting.

## Condition & setup

- Model: GPT-4-turbo (March 2024 snapshot)
- Context: Seeded with `header-snippet.txt`
- Objective: Produce a structured research summary under `<o>`

## Metrics

- Tag echo accuracy
- Footer completeness
- Cycle completion rate

## Results

The assistant maintained perfect tag mirroring across five cycles and produced compliant footers with accurate assumption counts.

```text
<q>
Summarize the implications of protocol drift in conversational agents.
[Version=v1.4 | Tag=<q> | Sources=preprint-2024-02 | Assumptions=1 | Cycle=1/3 | Locus=assistant]
```

## Failure modes

One cycle stalled when the user issued conflicting modifiers (`--major --correct`). The assistant escalated with `<e>` and requested clarification.

```text
<e>
Conflicting modifiers detected: --major vs --correct.
[Version=v1.4 | Tag=<e> | Sources=cycle-log | Assumptions=0 | Cycle=1/3 | Locus=assistant]
```

## Implications for the protocol

- Clear guidance is needed on modifier precedence.
- UI affordances should warn users when selecting incompatible modifiers.
