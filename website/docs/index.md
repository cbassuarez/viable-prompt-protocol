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
      link: /github/
---

## What is the Viable Prompt Protocol?

The Viable Prompt Protocol (VPP) is a compact, tag-oriented scaffold for structuring conversations with large language models. Each exchange starts with an explicit, machine-readable instruction that locks in who is speaking, what role they occupy, and how the next response should behave.

The protocol standardizes the first user line as `!<tag> [--modifier ...]` and requires every assistant message to conclude with a compliance footer that reports the version, tag, sources, assumptions, cycle, and optional locus.

By chaining tags together, VPP supports multi-cycle workflows such as `<g> → <q> → <o> → <c> → <o_f>`, giving teams a reliable loop for gathering context, questioning, outputting, critiquing, and finalizing.

## Features

- **Deterministic conversation framing.** Every exchange begins with an explicit tag and optional modifiers that communicate the agent locus, intention, and expected behavior.
- **Footer-based compliance ledger.** Standardized closing lines make it trivial to audit state transitions, track assumptions, and surface gaps in understanding.
- **Composable pipelines.** Multi-cycle workflows sequence tags into pipelines, enabling reproducible prompt engineering and experimental design.
- **Open corpus for study.** Experiments, transcripts, and logs show the protocol in action, ready for researchers and practitioners to mine for insight.

## Core ideas in one glance

- Tags and loci describe the agent role and where it operates.
- Modifiers like `--correct`, `--incorrect`, `--minor`, `--major`, and `--<tag>` communicate expectations for the next cycle.
- Pipelines and jumps compose tags into workflows and allow controlled detours when needed.
- The compliance footer records protocol adherence and exposes deviations immediately.

## Try it in ChatGPT

1. Paste the header snippet below into a new conversation.
2. Send `!<q>` on line 1.
3. Observe the assistant’s tag line and footer.
4. Iterate across tags as needed.

# Header snippet placeholder
```
Viable-Prompt Protocol:

User sends !<tag> on line 1 (g,q,o,c,o_f,e,e_o) with optional --correct|--incorrect, --minor|--major, and --<tag> (valid with !<o> --correct and !<e>).
I mirror the tag, prepended to my output: `<tag>`. !<x>→<x>, except !<e> --<tag>→<tag> and !<e_o>→<o>. Non-negotiable: ALWAYS prepend the tag line to EVERY reply.


Only the first line is parsed; later bangs are ignored as content. Tags define mode, regardless of prompt body content. 
<g> is concept-only (snippets ok; no full files).
<o> is a realized draft with Assumptions, Citations, Tests when relevant. 
<q> is rough-context question/probing/diagnostic only. Ask general questions when appropriate.
<c> is a fine-context locum questioning/probing. Ask clarifying questions when appropriate. Otherwise, clarify.
<o_f> is the final, desired output with Assumptions, Citations, Tests when relevant. Any <o> could be <o_f>.
<e> is an escape tag, which is paired with a modifier tag to escape to another part in the loop (e.g. !<e> --<g>). Special case <e_o> escapes to <o> immediately.
Loop is flexible: g→q→o→c→…→o_f (any order/length).
After 3 cycles I propose !<e> --<tag> or !<e_o>.

Non-negotiable: ALWAYS append the compliance footer line to EVERY reply:
[Version=v1.4 | Tag=<x_n> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<name?>]
Do not add any text outside the tagged content and the footer.

Full spec: https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/spec/latest/spec.md
```
