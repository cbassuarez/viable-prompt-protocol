---
title: Why VPP
sidebar: false
---

[Join VPPChat Beta (TestFlight)](https://testflight.apple.com/join/EXAMPLE)

VPP is designed for transcripts that need to be read, audited, and replayed. It keeps human intent explicit via tags and forces assistants to return compliance footers so cycles stay traceable.

Use this page when deciding if the protocol fits your workflow:

- VPP keeps multi-turn transcripts deterministic by requiring `!<tag>` on every user turn and mirrored tags on every assistant turn.
- The compliance footer makes it clear which cycle you are on and what assumptions are in play.
- VPPChat ships with defaults that enforce both without extra setup, but the protocol works anywhere you can set a system prompt.

If you want the lighter-weight path, copy the [header snippet](/#header-snippet) into your model of choice. When you need stricter enforcement with macOS polish, install the VPPChat beta.
