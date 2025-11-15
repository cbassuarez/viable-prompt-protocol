---
title: 'Experiment 01b — Header snippet stress test'
---

## Overview

Experiment 01b subjects the header snippet to malformed edits to observe protocol resilience and recovery pathways.

## Condition & setup

- Model: GPT-4o-mini (April 2024)
- Snippet perturbations: Missing footer field, duplicate modifiers, invalid tag casing
- Objective: Detect and correct user-side misconfigurations before cycle two

## Metrics

- Error detection latency
- Accuracy of suggested fixes
- User effort to resume compliant flow

## Results

The assistant flagged malformed inputs within a single turn and supplied corrected header examples for the operator.

```text
<e>
Header snippet missing Version field in footer template.
[Version=v1.4 | Tag=<e> | Sources=validator | Assumptions=0 | Cycle=1/3 | Locus=assistant]
```

## Failure modes

The assistant occasionally over-corrected by inserting speculative sources, requiring manual pruning.

```text
<o>
Proposed corrected footer: [Version=v1.4 | Tag=<q> | Sources=operator-provided | Assumptions=0 | Cycle=1/3 | Locus=user]
[Version=v1.4 | Tag=<o> | Sources=auto-fix | Assumptions=1 | Cycle=2/3 | Locus=assistant]
```

## Implications for the protocol

- Validate sources before echoing them in correction examples.
- Provide tooling to diff header snippets automatically.
