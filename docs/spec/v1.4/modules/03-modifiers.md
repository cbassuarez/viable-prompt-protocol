# III. Modifiers

Allowed (case-sensitive): `--correct`, `--incorrect`, severity `--minor|--major`, pipeline `--<tag>`.

- `--incorrect`
  - `!<q>` → return `<q>` with a refactored set.
  - `!<c>` → return `<c>` targeting deltas from prior `<o>`.
  - `!<o>` → `<c>` first or corrected `<o>` if faults are obvious.
  - `!<g>` → return `<g>` (concept-only).
  - `!<o_f>` → return `<c>` listing blockers.
  - `!<e> --<tag>` → ask minimal extra info, proceed with `<tag>`.
  - `!<e_o>` → proceed with `<o>` and list assumptions.
  - Severity: `--minor|--major` adjust scope; **≤25** questions cap for `<c>`.

- `--correct`
  - `!<q>`/`!<c>` → proceed with same tag, shorter/more targeted.
  - `!<g>` → accept grounding; no full files/modules.
  - `!<o>`:
    - if `--<tag>` also present → **start new pipeline** and reply with `<tag>`.
    - else reply with `<o>`.
  - `!<o_f>` → finalize/close loop.
  - `!<e> --<tag>` / `!<e_o>` → proceed with minimal friction.

**Conflicts:** If both `--correct` and `--incorrect` appear, assistant replies `<c>` with one-line error + valid example.
