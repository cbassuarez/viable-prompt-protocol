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
    Join VPPChat Beta for tuned defaults and strict tag + footer
    enforcement.
  </p>

  <div class="vpp-hero-actions">
    <a class="vpp-hero-button vpp-hero-button--brand"
      href="https://testflight.apple.com/join/w4GDYBZs">
      Join VPPChat Beta (TestFlight)
    </a>
    <a class="vpp-hero-button" href="/#header-snippet">
      Try VPP in your system prompt
    </a>
  </div>
</div>

<div class="vpp-callout">
  <strong>VPP is not a chatbot in disguise.</strong>
  It does not swap models or pretend one system is another.
  VPP is a protocol layered on top of vanilla LLMs: a shared contract for
  how humans and assistants structure multi-turn work.
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
[Version=v1.4 | Tag=<q_1> | Sources=<none> | Assumptions=0 | Cycle=1/3 |
Locus=unknowns]

!<c>
Clarify the deliverable and remove the weakest assumption.

<c>
Understood. Deliverable: a single-page spec with a join-first CTA.
Removed assumption: that we can infer the user’s audience without
asking.
[Version=v1.4 | Tag=<c_1> | Sources=<none> | Assumptions=0 | Cycle=2/3 |
Locus=spec-tighten]
```

The tag states intent. The footer makes progress reviewable.

## Why prompt templates aren’t enough

Prompt templates are great at starting a session.
They do not enforce structure across dozens of turns.

VPP makes structure continuous:
Every turn declares intent, every response mirrors it, and the
transcript stays auditable as it grows.

<div class="vpp-try-box">
  <h3>Try VPP anywhere</h3>
  <p>
    Paste the <a href="/#header-snippet">header snippet</a> into your
    system prompt, then begin with <code>!&lt;g&gt;</code> or
    <code>!&lt;q&gt;</code>.
  </p>
</div>

<div class="vpp-try-box" style="margin-top: 1rem;">
  <h3>Run VPP enforced</h3>
  <p>
    <a href="https://testflight.apple.com/join/w4GDYBZs">Join VPPChat
    Beta</a> for tuned defaults and strict tag + footer enforcement—no
    extra setup.
  </p>
</div>

## Next

- Read the normative spec: [Spec](/spec)
- Learn workflows and patterns: [Guide](/guide/)
- Copy the system prompt once: [Header snippet](/#header-snippet)

-[testflight](https://testflight.apple.com/join/w4GDYBZs)
