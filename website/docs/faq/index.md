---
title: 'FAQ'
---

## How do I add VPP to my prompts?

Import the header snippet into your custom instructions:

```text
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

Then issue your first line as `!<tag> [--modifier ...]`.

Mirror the workflow described in the guide and spec.

## What if the model ignores the footer?

Treat missing or malformed footers as protocol violations. Respond with `<c>` or `<e>` to request correction, and log the incident for future tuning.

## Can I extend the tag set?

Yes, but version the extension and document new tags in your implementation notes. Keep the core tags intact so other
participants can interoperate.

## Does VPP work with non-OpenAI models?

Yes. Any model capable of deterministic formatting can adopt VPP. Adjust prompts to reinforce footer compliance and modifier handling.

## How should I handle multi-agent scenarios?

Assign loci in modifiers or footers (e.g., `Locus=assistant-b`) and coordinate hand-offs explicitly. The experiments section showcases working patterns.
