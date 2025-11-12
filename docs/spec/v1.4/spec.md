---
title: Viable Prompt Protocol (VPP) v1.4 — Bang-Tagged, Mirror-Response Loop
permalink: /spec/v1.4/spec/
canonical_url: https://cbassuarez.github.io/viable-prompt-protocol/latest/spec/
---
# Viable Prompt Protocol (VPP) v1.4 — Bang-Tagged, Mirror-Response Loop
I. Command line grammar (must be line 1, column 1)
---
{% include version-switcher.html %}

> **You’re viewing v1.4.** For the canonical page see **[Latest Spec](/latest/spec/)**.
**Form**  
`!<tag> [--modifier ...]`

**Tags (user side):** `<g>` `<q>` `<o>` `<c>` `<o_f>` `<e>` `<e_o>`  
**Assistant reply tags:** `<g>` `<q>` `<o>` `<c>` `<o_f>` (no `<e>`, no `<e_o>`)

**Modifiers (case-sensitive; any order; all optional unless noted):**

`--correct` | `--incorrect`  
**Severity:** `--minor` | `--major` (optional strength hints)  
**Pipeline tag:** `--<tag>`

Valid with `!<o> --correct --<tag>` (open a new pipeline/locum to `<tag>`).  
Also valid with `!<e> --<tag>` (explicitly jump loci and start at `<tag>`).

The first line must contain **only** the command.  
No other text or tags allowed on that line.

Parsing rule: only the first line is parsed for a command;  
any bangs/tags on later lines are treated as plain content (ignored by the parser).

**Regex (reference, for line 1 only)**  
``` bash
^!<(g|q|o|c|o_f|e|e_o)>(?:\s+--(?:correct|incorrect|minor|major|g|q|o|c|o_f|e|e_o))\s$
```


---

II. Mirror rule (authoritative)
---

For any user command `!<x>`, the assistant must reply with the mirrored tag `<x>` (no bang),  
except for the two escape forms below:

- `!<e> --<tag>` → assistant replies with `<tag>` (locus jump; `<e>` does not exist on the assistant side).  
- `!<e_o>` → assistant replies with `<o>` (skip to output; assumptions required).

**Examples:**

| User Command | Assistant Reply |
| ------------- | ---------------- |
| `!<g>` | `<g>` |
| `!<q>` | `<q>` |
| `!<c>` | `<c>` |
| `!<o>` | `<o>` |
| `!<o_f>` | `<o_f>` |
| `!<e> --<g>` | `<g>` |
| `!<e_o>` | `<o>` |

---

III. Modifiers → deterministic actions
---

### `--incorrect`

- **!<q>** → return `<q>` with a re-factored question set (broader/different decomposition).  
- **!<c>** → return `<c>` that explicitly targets deltas from the prior `<o>`.  
- **!<o>** → either `<c>` first (diagnose) or a corrected `<o>` when faults are unambiguous.  
- **!<g>** → return `<g>` trimmed to concept-only.  
- **!<o_f>** → return `<c>` listing blockers to finality.  
- **!<e> --<tag>** → ask the minimum extra info needed for `<tag>`, then proceed with `<tag>`.  
- **!<e_o>** → proceed with `<o>` but list assumptions that would otherwise require `<q>/<c>`.

### Severity

- `--minor` → keep scope; ≤ 25 questions max for any `<c>`.  
- `--major` → allow reframing within the same locus; still ≤ 25 questions.

### `--correct`

- **!<q> / !<c>** → proceed with the same tag, shorter/more targeted.  
- **!<g>** → accept grounding; remain conceptual (no full files/modules).  
- **!<o>** → if `--<tag>` is also present, start a new pipeline and reply with `<tag>`; otherwise reply with `<o>` and note readiness in the footer.  
- **!<o_f>** → finalize; loop closes unless a new command arrives.  
- **!<e> --<tag> / !<e_o>** → proceed with minimal friction.

### Conflict handling

If mutually exclusive modifiers appear (e.g., `--correct` and `--incorrect`),  
return a failure: reply with `<c>` containing a one-line error and a minimal valid first-line example.  
No other content.

---

IV. Loop discipline & escapes
---

Flexible loop per locus:  
`<g> → <q> → <o> → <c> → … → <o_f>`  
where the `…` may be any length and may contain any of `<g> <q> <o> <c>` as needed.

After 3 cycles without acceptance, the assistant surfaces an escape option:

> send `!<e> --<g>` (or `--<q>/<o>/<c>/<o_f>`) to change locus or skip via `!<e_o>`.

User may always short-circuit with:

- `!<e> --<tag>` → declare new locus starting at `<tag>`  
- `!<e_o>` → skip straight to `<o>`; assumptions explicit

---

V. Hallucination guardrails (non-negotiable)
---

- When external facts matter: browse & cite authoritative sources.  
- If sources are unavailable/blocked: abstain and provide evidence (404/paywall/tool error).  
- Otherwise: proceed with clearly marked assumptions.

---

VI. Tag contracts (essentials)
---

| Tag | Description |
| ---- | ------------ |
| `<g>` | conceptual only; snippets allowed; no full files/modules |
| `<q>` | broad, uncertainty-reducing; structured answer formats when helpful |
| `<o>` | full deliverable as if final; include Assumptions, Citations, and Tests/Checks when appropriate |
| `<c>` | finer-order, delta-seeking questions keyed to faults/ambiguities in `<o>` |
| `<o_f>` | publishable; brief rationale + acceptance checklist |

---

VII. Noncompliance & recovery
---

If the assistant emits the wrong tag, user may interrupt.  
The assistant must re-emit the correct tag in a new message  
with a one-line, apology-free correction note in the footer only.

---

VIII. Compliance footer (append to every assistant message)
---

One line, non-semantic, machine-readable. Include version and tag instance index:

`[Version=v1.4 | Tag=<x_n> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<name?>]`

Example: `Tag=o_1` for the first `<o>` in the current locus.

---

IX. Protocol “unit tests” (quick checks)
---

- **Grammar pass:** line-1 matches the regex; later lines ignored.  
- **Mirror pass:** `!<x>` yields `<x>`, except `!<e> --<tag>` → `<tag>` and `!<e_o>` → `<o>`.  
- **Modifier pass:** conflicts → `<c>` failure with fix; ≤ 25-question cap.  
- **Guardrail pass:** external facts → cite; unavailability → abstain with evidence.  
- **Budget pass:** `<g>` conceptual; `<o>` includes Assumptions/Citations/Tests when relevant.  
- **Cycle pass:** after three unresolved cycles, suggest `!<e> --<tag>` or `!<e_o>`.

---

X. Deployment & hosting
---

**Short header (for ChatGPT instructions panel)** — keep concise:

> “Bang-tag protocol. User sends !<tag> on line 1 (g,q,o,c,o_f,e,e_o). I mirror the tag (except !<e> --<tag> → <tag>, !<e_o> → <o>). <g> is concept-only; <o> includes assumptions/citations/tests. After 3 cycles suggest !<e> --<tag> or !<e_o>. Full spec: [CDN link].”

**Full spec URL (placeholder):**  
`https://cdn.example.com/protocol/v1.4.md`  
(Include extended examples and sample chats at the CDN.)

---

**Assumptions**

- Locus naming remains free-form; if absent, assistant infers a generic label.  
- The index `_n` in `Tag=<x_n>` counts instances within the current locus.

**Citations**

None external; derived from this session’s rules.

---

**Minimal Tests (for this revision)**

| Test | Input | Expected Reply |
|------|--------|----------------|
| **A** | `!<e> --<g>` | reply begins with `<g>` |
| **B** | `!<e_o>` | reply begins with `<o>` and lists explicit assumptions |
| **C** | `!<o> --correct --<q>` | reply begins with `<q>` |
| **D** | `!<q> --correct --incorrect` | reply `<c>` with single-line conflict error + valid example |
