---
title: 'Experiment 02 — Multi-agent critique loop'
---

## Overview

Experiment 02 explores how two assistant personas collaborate under VPP to critique and refine outputs iteratively.

## Condition & setup

- Agents: Assistant-A (drafting) and Assistant-B (critique)
- Hand-off: Each cycle concludes with an explicit locus change in the footer
- Objective: Produce a policy memo with peer review baked in

## Metrics

- Turn-taking latency
- Critique depth (measured in corrective modifiers)
- Resolution time per cycle

## Results

The drafting agent maintained `<o>` turns while the critic issued `<c>` responses with targeted modifiers such as `--major`. The loop converged in three cycles with a vetted memo.

```text
<o>
Draft an executive summary of the memo.
[Version=v1.4 | Tag=<o> | Sources=draft-notes | Assumptions=3 | Cycle=2/3 | Locus=assistant-a]
```

## Failure modes

Occasional double-critiques occurred when the critic forgot to shift loci back to the drafter, resulting in redundant `<c>` turns.

```text
<c>
Awaiting updated draft before issuing further critique.
[Version=v1.4 | Tag=<c> | Sources=critique-log | Assumptions=0 | Cycle=3/3 | Locus=assistant-b]
```

## Implications for the protocol

- Encourage explicit locus naming in footers for multi-agent runs.
- Consider introducing a `--handoff=<agent>` modifier to prevent duplicate critiques.
