<!-- markdownlint-disable MD013 MD046 MD003 MD013 MD034 -->
---
layout: home
title: 'Viable Prompt Protocol (VPP)'
titleTemplate: 'Viable Prompt Protocol (VPP)'
description: 'A tag + footer-driven protocol for deterministic, machine-readable LLM conversations.'
hero:
  name: 'Viable Prompt Protocol'
  text: 'Structure every LLM exchange with explicit tags, modifiers, and a compliance footer.'
  tagline: 'Deterministic scaffolding for research-grade prompt engineering.'
  actions:
    - theme: brand
      text: Read the normative spec
      link: https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/spec/latest/spec.md
    - theme: alt
      text: Browse the protocol guide
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/cbassuarez/viable-prompt-protocol
---

<div class="vpp-hero-grid">
  <div class="vpp-hero-main">
    <h1>Viable Prompt Protocol (VPP)</h1>
    <p>Viable Prompt Protocol (VPP) is a compact grammar for human ↔ LLM collaborations.</p>
    <div class="vpp-hero-actions">
      <a class="VPButton brand" href="/spec/">Read the Spec</a>
      <a class="VPButton alt" href="/corpus/">Explore the Corpus</a>
      <a class="VPButton alt" href="/github/">View on GitHub</a>
    </div>
  </div>
  <div class="vpp-hero-snippet">
    <header class="vpp-snippet-header">
      <span class="vpp-snippet-title">Header snippet</span>
      <span class="vpp-snippet-hint">Copy → paste into custom instructions</span>
    </header>

```text
Viable-Prompt Protocol:

User sends !<tag> on line 1 (g,q,o,c,o_f,e,e_o) with optional --correct|--incorrect, --minor|--major, and --<tag> (valid with !<o> --correct and !<e>).
I mirror the tag, prepended to my output: `<tag>`. !<x>→<x>, except !<e> --<tag>→<tag> and !<e_o>→<o>. Non-negotiable: ALWAYS prepend the tag line to EVERY reply.

Only the first line is parsed; later bangs are ignored as content.
<g> is concept-only (snippets ok; no full files).
<o> is a realized draft with Assumptions, Citations, Tests when relevant.
<q> is rough-context question/probing/diagnostic only. Ask general questions when appropriate.
<c> is a fine-context locum questioning/probing. Ask clarifying questions when appropriate. Otherwise, clarify.
<o_f> is the final, desired output with Assumptions, Citations, Tests when relevant. Any <o> could be <o_f>.
<e> is an escape tag, which is paired with a modifier tag to escape to another part in the loop (e.g. !<e> --<g>).  Special case <e_o> escapes to <o> immediately.
Loop is flexible: g→q→o→c→…→o_f (any order/length).
After 3 cycles I propose !<e> --<tag> or !<e_o>.

Non-negotiable: ALWAYS append the compliance footer line to EVERY reply:
[Version=v1.4 | Tag=<x_n> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<name?>]
Do not add any text outside the tagged content and the footer.

Full spec: https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/spec/latest/spec.md
```

<p class="vpp-snippet-instructions">
  Paste this snippet into your model's custom instructions or system prompt.
  Then start each conversation with <code>!&lt;q&gt;</code> on line 1.
  </p>
 </div>
</div>

## Start with the protocol

Viable Prompt Protocol (VPP) is a compact grammar for human ↔ LLM collaborations.
Every user turn begins with `!<tag> [--modifier ...]` on line 1.
Every assistant turn mirrors the tag and ends with a compliance footer.

- Tags communicate intent: `<g>` for grounding, `<q>` for questioning, `<o>` for drafting, `<c>` for critique,
  `<o_f>` for final delivery, and `<e>` / `<e_o>` for escape conditions.
- Modifiers refine expectations: `--correct`, `--incorrect`, `--minor`, `--major`, `--<tag>`, and custom flags
  such as `--assumptions=3`.
- The compliance footer keeps transcripts auditable with `[Version=vX.Y | Tag=<tag_n> | Sources=<...> | Assumptions=<n> |
  Cycle=<i>/3 | Locus=<name?>]`.

The [protocol guide](/guide/) elaborates on pipelines, loci, and recovery strategies.
The [FAQ](/faq/) captures pragmatic adoption questions.

## Machine-readable assets

- **Normative spec:** <https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/spec/latest/spec.md>
- **Versioned archive:** [`docs/spec/v1.4/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/docs/spec/v1.4)
- **Header snippet:** <https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/docs/spec/v1.4/header-snippet.txt>
- **Parser schema:** [`spec/latest/spec.md`](https://github.com/cbassuarez/viable-prompt-protocol/blob/main/spec/latest/spec.md)

These paths back the CDN mirrors used by downstream tooling, so they remain stable across releases.

## Repository map

- [`/spec/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/spec) —
  Machine-readable spec copies used by the CDN.
- [`/docs/spec/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/docs/spec) —
  Versioned modules, examples, and header snippets.
- [`/corpus/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/corpus) —
  Annotated transcripts and datasets.
- [`/experiments/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments) —
  Experiment runners, logs, and analyses.
- [`/scripts/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/scripts) —
  Validators and transcript tooling.

## Protocol tooling and CI

This repository ships with strict automation to keep transcripts and docs trustworthy:

- `npx markdownlint-cli2 **/*.md` enforces formatting across specs, guides, and corpus notes.
- `npx cspell --no-progress "docs/**/*.md" "spec/**/*.md" "website/docs/**/*.md" "README.md"` protects terminology and
  protocol jargon.
- `node scripts/test-transcripts.mjs` validates transcript fixtures against the parser schema.
- GitHub Pages builds this VitePress site via `npm run docs:build`, ensuring the public docs match the main branch.

See the [Validator & CI page](/validator/) for details on extending these checks.

## Adoption workflow

1. Fetch the [header snippet](https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/docs/spec/v1.4/header-snippet.txt)
   and paste it into a fresh conversation.
2. Issue `!<g>` or `!<q>` on line 1 to begin the first cycle.
3. Track cycles with the compliance footer and use modifiers to steer corrections.
4. Close with `!<o_f>` once the deliverable is production-ready.

Share corpus additions or protocol findings by opening a pull request—automation validates transcripts and docs before merge.
