---
title: 'Validator & CI'
---

The repository ships with validators and workflows that enforce protocol compliance across specs, transcripts, and docs.
These automation steps run in CI and in the GitHub Pages deployment pipeline.

## Markdown linting

- Command: `npx markdownlint-cli2 **/*.md`
- Scope: All Markdown files, including the spec copies under `/spec/` and `/docs/spec/`, the VitePress docs, and repository
  notes.
- Purpose: Keep formatting predictable for both human readers and downstream tooling that ingests the spec.

## Spell checking

- Command: `npx cspell --no-progress "docs/**/*.md" "spec/**/*.md" "website/docs/**/*.md" "README.md"`
- Scope: Human-facing docs and machine-readable specs.
- Purpose: Guard against typos in tag names, modifiers, and experiment identifiers that would otherwise break scripts.

## Transcript validation

- Command: `node scripts/test-transcripts.mjs`
- Scope: Fixtures in `/tests/` and `/corpus/`.
- Purpose: Ensure transcripts respect the command-line grammar and footer schema before they enter the corpus.

## Experiment harnesses

- Location: [`/experiments/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/experiments)
- Scripts: `npm run run:exp1-protret`, `npm run run:exp2-promptinj`, `npm run run:exp1b-user-only`, and associated analyzers.
- Purpose: Provide reproducible prompt-injection and retention studies grounded in the current protocol release.

## Pages deployment

- Workflow: `.github/workflows/pages.yml`
- Steps: Install Node 20, run lint + spell + parser checks,
  build the VitePress site with `npm run docs:build`, and publish via
  `actions/deploy-pages`.
- Output: <https://cbassuarez.github.io/viable-prompt-protocol/>

Use these commands locally before pushing changes; CI will block merges that diverge from the expected outputs.
