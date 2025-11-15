---
title: 'FAQ'
---

## How do I add VPP to my prompts?

Store the header snippet in your model’s custom instructions or system prompt so
every chat begins with the same contract. Then start a conversation with
`!<tag> [--modifier ...]` on line 1 and follow the loop described in the guide
and spec.

## What if the model ignores the footer?

Treat missing or malformed footers as protocol violations. Respond with `<c>` or `<e>` to request correction, and log the
incident for future tuning.

## Can I extend the tag set?

Yes, but version the extension and document new tags in your implementation notes. Keep the core tags intact so other
participants can interoperate.

## Does VPP work with non-OpenAI models?

Yes. Any model capable of deterministic formatting can adopt VPP. Adjust prompts to reinforce footer compliance and modifier
handling.

## How should I handle multi-agent scenarios?

Assign loci in modifiers or footers (e.g., `Locus=assistant-b`) and coordinate
hand-offs explicitly. The current experiments focus on protocol retention and
injection scenarios; consult the normative spec when designing multi-agent
extensions.
