# Viable Prompt Protocol (VPP)

[![Spec](https://img.shields.io/badge/spec-v1.4-blue)](docs/spec/v1.4/spec.md)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20CC%20BY%204.0-black)](#license)
[![CI](https://github.com/cbassuarez/viable-prompt-protocol/actions/workflows/ci.yml/badge.svg)](https://github.com/cbassuarez/viable-prompt-protocol/actions/workflows/ci.yml)
[![Pages](https://github.com/cbassuarez/viable-prompt-protocol/actions/workflows/pages.yml/badge.svg)](https://github.com/cbassuarez/viable-prompt-protocol/actions/workflows/pages.yml)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-informational)](https://cbassuarez.github.io/viable-prompt-protocol/)
[![CDN Latest](https://img.shields.io/badge/cdn-latest-success)](https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/docs/latest/spec.md)
[![CDN v1.4](https://img.shields.io/badge/cdn-v1.4-success)](https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/docs/spec/v1.4/spec.md)

> ![VPP Example](https://raw.githubusercontent.com/cbassuarez/viable-prompt-protocol/263b11b92ca34b5ef34b85a8937494bf3a6c9250/vpp_example.gif)

A compact, testable protocol for tagged, closed-loop prompting (constructivist–cybernetic).  
**Bang-tag grammar** for users, **mirrored tags** for assistants, flexible loop, explicit escapes, and a machine-readable compliance footer.

## Quick adopt (ChatGPT Custom Instructions)
Paste the **Header Snippet** into “How would you like ChatGPT to respond?”:

```bash
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


Or fetch via CDN:  
`https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/docs/spec/v1.4/header-snippet.txt`

## Docs
- **Latest**: `docs/latest/spec.md` (tracked to v1.4)
- **Versioned**: `docs/spec/v1.4/spec.md`
- **Modules** for quick reference under `docs/spec/v1.4/modules/`
- **Examples** under `docs/spec/v1.4/examples/`

## Validator
- Minimal first-line parser + tests under `scripts/` and `tests/`.
- CI runs markdown lint, link check, spellcheck, and parser tests.

## Contributing
PRs welcome. Please see [CONTRIBUTING.md](contributing.md). Issues templates provided.

## Local development
Requires Node 20 (see `.nvmrc`).
```
npm i -g markdownlint-cli2 cspell
npx markdownlint-cli2 **/*.md
npx cspell --no-progress "docs/**/*.md" "spec/**/*.md" "README.md"
node scripts/test-transcripts.mjs
node tests/parser.spec.mjs
```


## License
- **Code**: MIT (`LICENSE-MIT`)
- **Docs & Examples**: CC BY 4.0 (`LICENSE-CC-BY-4.0`)
- See `NOTICE` in files where required.
