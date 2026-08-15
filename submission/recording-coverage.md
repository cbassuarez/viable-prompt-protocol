# VPP 1.1.0 recording coverage

This matrix is the shot list and evidence log for the OpenAI review recording. Record only after the production MCP rescan is clean. Responsive browser captures are useful preflight evidence but are not labeled as native iOS or Android footage.

## Required coverage

| Flow | Tool or UI proof | Web | iOS | Android | Acceptance marker |
| --- | --- | --- | --- | --- | --- |
| Start and normal mode | `vpp_prepare_turn`, `vpp_format_response`, controller mode buttons | Primary | Confirm | Confirm | `!<g>` produces `g_1`, `Cycle=1/3`, `Locus=default` |
| Combined flags | Controller correctness and severity groups | Primary | Confirm | Confirm | Preview is exact and contradictory flags cannot remain selected |
| New locus | Controller New locus, `ui/message`, model context `next_locus` | Primary | Confirm | Confirm | `!<e> --correct --major --<g>` produces `g_2` at `locus-2` |
| Global counters | Committed canonical state | Primary | Confirm | Confirm | Per-tag counts continue across both cycle and locus changes |
| Three closed cycles | `vpp_prepare_turn`, `vpp_format_response` | Primary | Spot check | Spot check | Critiques close iterations 1, 2, and 3; only the third injects escapes |
| Skip to output | Controller Skip action | Primary | Confirm | Confirm | Preview and sent command are `!<e_o>` with selected flags |
| Exchange repair | `vpp_validate_exchange` and attached UI | Primary | Spot check | Spot check | Violations are actionable; repaired wrapper preserves the body |
| Transcript reconstruction | `vpp_validate_transcript` and attached UI | Primary | Spot check | Spot check | Earlier loci appear as history and cannot be selected again |

`Primary` means the complete interaction and tool details are visible. `Confirm` means the native control is operated on camera. `Spot check` means the result and responsive layout are visible without replaying the entire web sequence.

## Capture order

1. Web Developer Mode: show plugin details and the four-tool discovery order.
2. Run the start, flags, locus, counter, three-cycle, skip, repair, and transcript flows above.
3. Capture native iOS and Android sessions after confirming 320 px layout, keyboard focus, 44 px controls, light/dark theme, and Continue/Copy behavior in preflight.
4. Export three clean platform masters, one review cut, and short silent website clips.

## Recording hygiene

- Use a dedicated VPP task with no unrelated conversation history.
- Hide credentials, account identifiers, personal notifications, and unrelated browser tabs.
- Keep Developer Mode tool details visible on web when each tool is first demonstrated.
- Do not imply that responsive-browser or simulator web views are native ChatGPT evidence.
- Record the deployed `1.1.0` runtime only; keep `/healthz` and the rescan timestamp in the evidence notes.

## Evidence log

| Artifact | Status | Path or URL | Notes |
| --- | --- | --- | --- |
| Web master | Pending production rescan | — | Developer Mode and tool details required |
| iOS master | Pending native-device check | — | Use physical ChatGPT if simulator installation is not authentic |
| Android master | Pending native-device check | — | Use physical ChatGPT if emulator installation is not authentic |
| Review cut | Pending platform masters | — | Include all four tools and main UI flows |
| Website clips | Pending review cut | — | No claims beyond the platform actually shown |
