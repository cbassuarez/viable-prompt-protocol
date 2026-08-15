---
title: Why VPP
sidebar: false
---

<div class="vpp-hero">
  <h1 class="vpp-hero-title">Why VPP</h1>

  <p class="vpp-hero-lede">
    VPP is for transcripts that must stay readable, auditable, and
    replayable as projects get longer, ideas get denser, and decisions
    become costly.
  </p>

  <p class="vpp-hero-tagline">
    A shared contract for how humans and assistants structure
    multi-turn work—on any model you already use.
  </p>

  <div class="vpp-hero-actions">
    <a class="vpp-hero-button vpp-hero-button--brand"
      href="/install/">
      Install VPP
    </a>
    <a class="vpp-hero-button" href="/spec/">
      Read the spec
    </a>
  </div>
</div>

<div class="vpp-callout">
  <strong>VPP is not a chatbot in disguise.</strong>
  It does not swap models or pretend one system is another.
  VPP is a portable skill plus deterministic protocol runtime layered on top
  of the models you already use.
</div>

## What breaks in normal chat

- Intent drifts: the “mode” of a turn (explore, draft, critique) stays
  implicit.
- Corrections get lost: fixes are made, but the transcript stops being
  traceable.
- Assumptions hide: choices accumulate without being named or counted.
- Review becomes guesswork: collaborators can’t reliably replay
  reasoning.

## What VPP adds

- **Explicit intent** on every user turn via `!<tag>`.
- **Mirrored intent** on every assistant turn via `<tag>`.
- **Auditability** via a footer that records cycle, sources, and
  assumptions.
- **Iterative control** via a loop that makes correction and refinement
  legible.

## Where VPP shines

- **Long, big projects:** the transcript stays navigable months later.
- **Complex ideas:** you can separate grounding, probing, drafting, and
  critique.
- **Recursive prompting:** when you don’t yet know what you want, the
  loop supports discovering it together—without losing structure.

## A micro-example

```text
!<q>
What are the unknowns in this plan?

<q>
Unknowns:
- What “success” means (deliverable + audience).
- Which constraints are hard vs negotiable.
- What data we can cite vs must infer.
[Version=v1.5 | Tag=q_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=default]

!<c>
Clarify the deliverable and remove the weakest assumption.

<c>
Understood. Deliverable: a single-page spec with a join-first CTA.
Removed assumption: that we can infer the user’s audience without
asking.
[Version=v1.5 | Tag=c_1 | Sources=none | Assumptions=0 | Cycle=2/3 | Locus=default]
```

The tag states intent. The footer makes progress reviewable.

## Why prompt templates aren’t enough

Prompt templates are great at starting a session.
They do not reliably enforce structure across dozens of turns or maintain global counters through locus changes.

VPP makes structure continuous:
Every turn declares intent, every response mirrors it, and the
transcript stays auditable as it grows.

<div class="vpp-try-box">
  <h3>Try VPP anywhere</h3>
  <p>
    <a href="/install/">Install the plugin</a>, then begin with
    <code>!&lt;g&gt;</code> or <code>!&lt;q&gt;</code>. The generated
    <a href="/custom-instructions/">custom-instructions block</a> remains
    available for hosts that cannot use skills or tools.
  </p>
</div>

## Next

- Read the normative spec: [Spec](https://viableprompt.org/spec/)
- Learn workflows and patterns: [Guide](https://viableprompt.org/guide/)
- Use the fallback instructions: [Custom instructions](/custom-instructions/)

---
<!-- cSpell:ignore replayable -->
