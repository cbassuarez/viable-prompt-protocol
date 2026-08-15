# VPP cycle controller submission audit

## Product contract

- Validation tools attach one inline MCP App; prepare and format calls remain UI-free.
- The card shows `Cycle i/3`, the cycle-owned locus, and at most the latest five active path nodes until expanded.
- Modes are G, Q, O, C, and FINAL. Correctness and severity are separate, clearable, mutually exclusive groups.
- Current locus is the default. New locus proposes editable `locus-N`; earlier transcript loci are display-only.
- Skip to output composes `!<e_o>`. Accepted output composes `!<o> --correct [severity] --<mode>`.
- Continue sends the exact preview with `ui/message`; a new locus also sends `next_locus` through model context. Copy appears when messaging is unavailable.
- Structural violations appear only as concise intervention text. The card never shows `VALID` or `INVALID` badges.

## Static and automated checks

- Semantic `button`, `input`, `fieldset`, `legend`, `output`, and live-status elements remain available without host styling.
- Every primary control has a 44 px minimum target; the layout collapses at 430 px and remains usable at 320 px.
- Focus is visible; pressed state is conveyed with `aria-pressed`; native keyboard behavior is retained.
- Light, dark, and reduced-motion CSS are present. There are no gradients, external assets, storage calls, telemetry calls, or network allowlists.
- The resource uses `text/html;profile=mcp-app`, exact empty CSP domain arrays, a dedicated app domain, and a border preference.
- Tool discovery order and read-only annotations are contract-tested.

## Manual sign-off before recording

- [ ] Production scan renders the card after both validation tools and never after prepare or format.
- [ ] Light and dark modes preserve contrast for text, selected controls, focus rings, warnings, and errors.
- [ ] Keyboard-only operation can select and clear every flag, edit a locus, expand the path, and Continue or Copy.
- [ ] Touch operation is comfortable at 320 px without nested horizontal scrolling.
- [ ] The host sends the previewed command verbatim and carries the exact state and `next_locus`.
- [ ] Earlier loci are visible in transcript history but have no interactive re-entry control.
- [ ] Three closed cycles produce critique footers 1/3, 2/3, and 3/3; escape choices appear only on the third close.
- [ ] Per-tag indexes continue across cycle and locus boundaries.
- [ ] Repair preserves the body and is idempotent.
- [ ] No console errors, external requests, storage, or request-body telemetry are observed.
