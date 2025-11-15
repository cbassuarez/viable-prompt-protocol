---
title: 'Specification'
outline: [2, 3]
---

> The canonical machine-readable copy lives at
> <https://cdn.jsdelivr.net/gh/cbassuarez/viable-prompt-protocol@main/spec/latest/spec.md>.
> Versioned modules and examples remain under
> [`docs/spec/v1.4/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/docs/spec/v1.4).

The Viable Prompt Protocol (VPP) specification defines the normative behaviors expected from both human operators and assistant
models when participating in protocol-compliant conversations. This document is authoritative and should be treated as the
source of truth for all VPP implementations.

```text
VPP_VERSION: 1.4
TAGS_USER: <g>, <q>, <o>, <c>, <o_f>, <e>, <e_o>
TAGS_ASSISTANT: <g>, <q>, <o>, <c>, <o_f>
FIRST_LINE: "!<tag> [--modifier ...]"
FOOTER_FORMAT: [Version=vX.Y | Tag=<tag_n> | Sources=<...> | Assumptions=<n> | Cycle=<i>/3 | Locus=<name?>]
```

## Introduction

VPP is a conversation protocol that constrains the structure of human and assistant turns through mandatory first-line tags,
optional modifiers, and a required compliance footer. The goals are repeatability, machine legibility, and clear traceability
across multi-turn cycles.

## Scope and terminology

- **Tag** — A symbol describing the role of the next speaker (e.g., `<q>` for questioning).
- **Modifier** — Optional flag(s) that adjust expectations for the response (e.g., `--major`).
- **Cycle** — A bounded sequence of turns, typically three exchanges, that advances the workflow.
- **Locus** — The seat or perspective from which an agent is operating (human or assistant).
- **Footer** — The terminal line of a message summarizing compliance data.

## Command line grammar

The user MUST begin each cycle with a tag line matching the grammar below:

```bnf
command-line ::= bang tag modifiers? newline
bang ::= "!"
tag ::= "<" identifier ">"
identifier ::= letter ( letter | digit | "_" )*
modifiers ::= modifier+
modifier ::= "--" identifier ( "=" value )?
value ::= quoted | unquoted
quoted ::= '"' chars '"'
unquoted ::= ( letter | digit | "_" | "-" )+
```

## Tags

Tags are grouped into loci that signal intent:

- **Gather (`<g>`)** — Request background context or clarifications.
- **Question (`<q>`)** — Pose a primary question or subproblem.
- **Output (`<o>`)** — Require the assistant to produce a deliverable.
- **Critique (`<c>`)** — Evaluate previous outputs for correctness and completeness.
- **Finalize (`<o_f>`)** — Provide the final, vetted answer.
- **Exception (`<e>`, `<e_o>`)** — Signal user- or operator-originating errors.

Each assistant response MUST echo the incoming tag on its first line.

## Modifiers

Modifiers refine tag intent and expectation:

- `--correct` / `--incorrect` — Confirm or deny correctness of prior outputs.
- `--minor` / `--major` — Signal the severity of required changes.
- `--<tag>` — Request a branch to a specific tag locus in the next cycle.
- `--assumptions=<n>` — Declare expected assumption count in the footer.

Modifiers SHOULD be sparse and mutually coherent. Conflicting modifiers MUST be resolved before issuing the command.

## Pipelines and loci

Pipelines chain tags into predictable sequences, often using loci labels such as `research`, `draft`, or `eval`.
A canonical pipeline is `<g> → <q> → <o> → <c> → <o_f>`, enabling preparation, inquiry, production, critique, and delivery.
Loci metadata may be included in modifiers or footers to trace responsibility boundaries.

## Error modes and recovery

Error tags `<e>` and `<e_o>` capture deviations.
When the assistant detects an invalid state, it MUST emit `<e>` and describe the issue.
The user may follow with `<e_o>` to report operator-originating problems.
Recovery typically involves returning to `<g>` or `<q>` with corrective modifiers.

## Compliance footer

Every assistant message MUST end with a footer matching the schema `[Version=vX.Y | Tag=<tag_n> | Sources=<...> | Assumptions=<n>
| Cycle=<i>/3 | Locus=<name?>]`.
Missing fields or malformed entries constitute protocol violations and should be escalated through critique cycles.

## Examples

```text
!<q> --major
<q>
Please outline the primary risk factors for protocol drift.
[Version=v1.4 | Tag=<q> | Sources=preprint-2024-02 | Assumptions=1 | Cycle=1/3 | Locus=assistant]
```

```text
!<c> --correct --minor
<c>
Feedback acknowledged. Minor updates applied to the summary section.
[Version=v1.4 | Tag=<c> | Sources=prior-cycle | Assumptions=0 | Cycle=2/3 | Locus=assistant]
```

## Versioning

VPP versions follow semantic increments.
Minor versions introduce new modifiers or clarifications; major versions may revise tag semantics or footer structure.
Implementers SHOULD record the version in the footer and upgrade only after validating compatibility.
