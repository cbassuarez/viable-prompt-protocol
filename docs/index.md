<!-- markdownlint-disable MD013 -->
<!-- cspell:words Regressable mathrm mathbb protret hyperparameters -->
---
layout: home
title: "Viable Prompt Protocol (VPP)"
titleTemplate: "Viable Prompt Protocol (VPP)"
description: "Viable Prompt Protocol (VPP) is a tag-driven conversation scaffold that keeps LLM workflows reproducible for developers and prompt designers."
editLink: true
lastUpdated: true
hero:
  name: "Viable Prompt Protocol"
  text: "A tag-and-footer protocol for controlling LLM conversations across iterative cycles."
  tagline: "A repeatable, machine-readable conversation scaffold for humans and language models."
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
  - title: "Deterministic conversation frames"
    details: "Each VPP exchange starts with a command line that tells the model exactly which role it is playing and what the turn must deliver. Tags keep both humans and automation aligned."
  - title: "Composable pipelines"
    details: "Pipelines and loci give you structure for chaining draft, critique, revision, and finalization steps. You can slice transcripts into repeatable tracks without losing context."
  - title: "Machine-readable transcripts"
    details: "The compliance footer compresses version, tag, assumptions, cycle count, and locus into a single parseable line. Logs stay ready for analysis, scoring, or replay."
  - title: "Model-agnostic discipline"
    details: "Viable Prompt Protocol (VPP) works across model providers and UI surfaces. Its grammar is minimal, readable, and easy to adopt in notebooks, apps, or hosted chat clients."
---

## What is the Viable Prompt Protocol?

Viable Prompt Protocol (VPP) is a lightweight, tag-based conversation protocol for Large Language Model chats. It replaces sprawling prompt templates with a predictable command line on the first line and structured sections that follow.

Every compliant turn begins with `!<tag>` on line one and ends with a compliance footer that records the version, tag, locus, cycle count, and assumptions. Those anchors make transcripts machine-readable and unlock automated auditing, replay, and diffing.

The protocol is model-agnostic and designed for iterative, multi-cycle workflows such as draft → critique → revision → final. Tags like `<g>`, `<q>`, `<o>`, `<c>`, and `<o_f>` mark each phase, allowing humans and tools to keep long-running exchanges disciplined.

## Core ideas in one glance

- **Tags drive intent.** Tags such as `<g>`, `<q>`, `<o>`, `<c>`, and `<o_f>` describe whether a turn is grounding, questioning, outputting, critiquing, or finalizing. They keep the conversation’s purpose explicit.
- **Command line grammar.** The first line always begins with `!<tag>` and may include modifiers like `--correct`, `--incorrect`, `--minor`, `--major`, or `--<tag>` for cross-references. This syntax creates a predictable command surface.
- **Pipelines and loci.** Pipelines define multi-step workflows while loci keep concurrent threads separate. Together they let you orchestrate complex exchanges without transcript collisions.
- **Compliance footer.** A single, parseable footer line encodes protocol version, active tag, assumptions, cycle count, and locus so downstream systems can validate or score the turn automatically.

## Try it in ChatGPT

Copy the header snippet, paste it into a fresh ChatGPT conversation, and start issuing tagged turns. The assistant will answer with its own tag line and compliance footer.

1. Paste the header snippet into a new ChatGPT conversation to initialize the Viable Prompt Protocol (VPP) context.
2. Send `!<q>` on line 1 to begin a question turn, then provide your instructions below the command line.
3. Watch for the assistant’s response: the first line mirrors the tag, and the final line carries the compliance footer.
4. Iterate through `<g> → <q> → <o> → <c> → <o_f>` or other sanctioned sequences to drive the workflow you need.

```text
# Header snippet (replace this block with the official header-snippet.txt contents)

!<g>
[PLACEHOLDER: insert the official VPP header snippet here exactly, without modification]
```

## Where to go next

- [Specification (normative)](/spec/) — Full protocol grammar, tag definitions, compliance rules, and version history for Viable Prompt Protocol (VPP).
- [Guide (tags, modifiers, pipelines, error modes)](/guide/) — Practical explanations and worked examples for applying tags, modifiers, loci, and recovery paths.
- [Experiments (Exp-01, Exp-02, Exp-01b)](/experiments/) — Detailed experiment logs that probe VPP behavior across models, prompts, and error scenarios.
- [Corpus (annotated transcripts and datasets)](/corpus/) — Downloadable transcripts with annotations, scoring, and metadata for analysis or benchmarking.
- [Changelog & versions](/changelog/) — A chronological record of protocol releases, header snippet changes, and compliance clarifications.
- [FAQ and adoption tips](/faq/) — Answers to recurring questions plus playbooks for integrating Viable Prompt Protocol (VPP) into your stack.

## Corpus at a glance

The Viable Prompt Protocol (VPP) corpus is a curated set of annotated transcripts and experiment logs. It shows how the protocol behaves in realistic, sometimes messy conversations and how the compliance footer exposes error conditions.

- Experiment logs (Exp-01 / Exp-02 / Exp-01b) with full tag-by-tag commentary.
- User-only protocol trials that demonstrate manual adherence and where breakdowns happen.
- Failure cases and edge conditions that highlight recovery behaviors and exception handling.

Heavy data and raw exports live in the repository and dedicated corpus pages, while this landing page offers a navigational overview.

## Design principles

- **Minimal surface area.** A small vocabulary of tags and modifiers keeps the command line grammar easy to remember yet expressive.
- **Machine legibility.** Every turn exposes its state via the top-line tag and the compliance footer, enabling downstream parsing and analytics.
- **Human legibility.** Tags and sections mirror natural collaboration phases such as grounding, questioning, output drafting, critique, and finalization.
- **Radical transparency.** Error modes, misfires, and corrective modifiers are documented and expected; nothing is hidden or implicit.
- **Versioned and explicit.** The footer and header capture protocol version, assumptions, and locus so revisions are auditable.
- **Model-agnostic adoption.** The protocol applies across OpenAI, Anthropic, local LLMs, or any surface that accepts plain text input.
- **Tooling-friendly.** Pipelines, loci, and modifiers are structured so IDEs, workflow engines, and analysis scripts can automate around them.

## Who is VPP for?

Viable Prompt Protocol (VPP) supports practitioners who need dependable, inspectable LLM interactions instead of ad-hoc prompt strings.

- Prompt engineers seeking repeatable workflows and traceable revisions.
- Researchers running controlled prompt experiments across models or conditions.
- Developers building tools that ingest, replay, or score LLM transcripts.
- Artists and writers who collaborate with LLMs through iterative drafts, critiques, and finals.
