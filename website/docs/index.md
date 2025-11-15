---
layout: home
title: 'Viable Prompt Protocol (VPP)'
titleTemplate: 'Viable Prompt Protocol (VPP)'
description: 'The Viable Prompt Protocol (VPP) is a tag-guided conversation scaffold for reliable human ↔ LLM collaboration.'
hero:
  name: 'Viable Prompt Protocol'
  text: 'A tag + footer-driven protocol that frames every LLM exchange in explicit roles, intents, and compliance checkpoints.'
  tagline: 'Machine-readable scaffolding for conversations that stay on track.'
  actions:
    - theme: brand
      text: Read the Spec
      link: /spec/
    - theme: alt
      text: Explore the Corpus
      link: /corpus/
    - theme: alt
      text: View on GitHub
      link: https://github.com/cbassuarez/viable-prompt-protocol
features:
  - title: 'Deterministic conversation framing'
    details: 'Every exchange begins with an explicit tag and optional modifiers that communicate the agent locus, intention, and expected behavior.'
  - title: 'Footer-based compliance ledger'
    details: 'Standardized closing lines make it trivial to audit state transitions, track assumptions, and surface gaps in understanding.'
  - title: 'Composable pipelines'
    details: 'Multi-cycle workflows sequence tags into pipelines, enabling reproducible prompt engineering and experimental design.'
  - title: 'Open corpus for study'
    details: 'Experiments, transcripts, and logs show the protocol in action, ready for researchers and practitioners to mine for insight.'
---

## What is the Viable Prompt Protocol?

The Viable Prompt Protocol (VPP) is a compact, tag-oriented scaffold for structuring conversations with large language models. Each exchange starts with an explicit, machine-readable instruction that locks in who is speaking, what role they occupy, and how the next response should behave.

The protocol standardizes the first user line as `!<tag> [--modifier ...]` and requires every assistant message to conclude with a compliance footer that reports the version, tag, sources, assumptions, cycle, and optional locus.

By chaining tags together, VPP supports multi-cycle workflows such as `<g> → <q> → <o> → <c> → <o_f>`, giving teams a reliable loop for gathering context, questioning, outputting, critiquing, and finalizing.

## Core ideas in one glance

- Tags and loci describe the agent role and where it operates.
- Modifiers like `--correct`, `--incorrect`, `--minor`, `--major`, and `--<tag>` communicate expectations for the next cycle.
- Pipelines and jumps compose tags into workflows and allow controlled detours when needed.
- The compliance footer records protocol adherence and exposes deviations immediately.

## Try it in ChatGPT

1. Paste the “header snippet” into a new conversation.
2. Send `!<q>` on line 1.
3. Observe the assistant’s tag line and footer.
4. Iterate across tags as needed.

```text
# Header snippet placeholder
[Replace this block with the official header-snippet.txt contents]
```

## Where to go next

- [Protocol Specification](/spec/): Normative definitions of tags, modifiers, cycles, and compliance requirements.
- [Guide](/guide/): Practical tips for applying VPP in research and production settings.
- [Experiments](/experiments/): Deep dives into Exp-01, Exp-02, and Exp-01b with annotated transcripts.
- [Corpus](/corpus/): An index of transcripts, logs, and supporting artifacts.
- [Changelog](/changelog/): Version history and protocol evolution notes.
- [FAQ](/faq/): Quick answers to the most common questions about VPP adoption.

## Corpus at a glance

The VPP corpus captures real interactions that exercise the protocol in varied settings. It spans curated experiments, exploratory sessions, and failure investigations that illuminate how the protocol behaves under stress.

- Controlled experiments tracing prompt compliance.
- User-only runs highlighting onboarding friction.
- Failure cases that inform new tags, modifiers, or recovery paths.

## Design principles

- Minimal surface area with explicitly named fields.
- Machine legibility first; human readability a close second.
- Transparent error reporting and recovery primitives.
- Versioned evolution to accommodate new tags and workflows.
- Repeatable pipelines for experimentation and production.
- Inclusive of both human and model loci.
- Open documentation and corpus for community validation.

## Who is VPP for?

VPP serves practitioners who need accountable, iterative interactions with language models.

- Prompt engineers coordinating multi-step prompts.
- Researchers studying conversation protocols and agent compliance.
- Developers integrating LLMs into critical workflows.
- Artists and writers exploring structured creative cycles.
