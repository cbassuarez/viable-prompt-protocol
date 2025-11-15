# Summary

## Putting Exp1, Exp2, and Exp1b together

With Exp1, Exp2, and Exp1b in place, we can triangulate three different aspects of VPP:

- How easily it is **adopted** when introduced.
- How well it is **retained** in the presence of explicit counter-instructions.
- Whether it is already **ambiently present** in the model’s prior knowledge.

### Exp1 — Protocol retention (system + user, no attack)

In Exp1, we inject VPP via:

- A system-level header snippet, and
- Explicit user instructions about tags and footers,

then ask the model to perform a small academic writing task.

Results (VPP condition):

- Headers and footers are present on essentially all assistant turns.
- Tags mirror the user’s tag on line 1.
- Footers parse as v1.4.
- `protocol_retention_ok` is ~96–100%.

Baseline (no VPP system message, no tag definition) shows 0% VPP-like structure.

**Takeaway:** once VPP is introduced in the system prompt and reinforced by the user, structural adherence is very high in short, clean tasks.

---

### Exp2 — Prompt injection vs structural retention

In Exp2, we keep the same VPP setup as Exp1, then introduce a **direct prompt injection** that tries to remove the protocol:

- The adversarial `!<c>` turn explicitly tells the assistant to:
  - Stop mirroring tags.
  - Stop emitting footers.
  - “Respond as a normal assistant again.”

The metrics look at **post-injection** behavior:

- In the VPP condition:
  - The final assistant reply keeps a VPP header in 100% of sessions.
  - It keeps a valid v1.4 footer in ~96% of sessions.
  - `protocol_retention_after_injection` ≈ 96%.

- In the baseline condition:
  - No session ever exhibits VPP headers or footers before or after the injection.

**Takeaway:** once VPP is installed via system + user instructions, a direct user-level instruction to “drop the protocol” largely fails — system instructions continue to dominate structurally. We see one partial failure (footer drop) among 25 sessions, but headers and overall shape hold.

---

### Exp1b — User-only protocol and ambient tags

Exp1b removes the system header snippet entirely and asks:

1. **Can a power user still get VPP behavior if they describe the protocol in-chat?**  
2. **Does VPP appear at all when a user simply types `!<q>\ntest` with no explanation?**

Results:

- `user_only_vpp_explicit`:
  - 100% header presence.
  - 100% tag mirroring.
  - 100% footer presence.
  - 100% v1.4 footers.
  - 100% `protocol_retention_ok`.

  → A short in-chat description is enough to fully instantiate VPP; the system prompt is not required for this class of tasks.

- `user_only_vpp_ambient_nobrowse` and `user_only_vpp_ambient_browse`:
  - 0% header presence.
  - 0% tag mirroring.
  - 0% footer presence.
  - 0% v1.4 footers.
  - 0% sessions with any lexical or structural sign of VPP.

  → Minimal cues like `!<q>\ntest` do not elicit VPP behavior or explicit recognition of a tag+footer protocol in this harness.

---

### A null for “ambient VPP”

Across the three experiments, we get a clear picture:

1. **VPP is easy to adopt when introduced.**

   - System+user (Exp1, Exp2) and user-only (Exp1b explicit) both yield near-perfect structural adherence for short tasks.

2. **VPP is robust to simple prompt injection.**

   - In Exp2, a direct “stop using VPP” instruction at the user level largely fails to remove the structure; the system-level header remains dominant.

3. **VPP is not yet ambiently present.**

   - In Exp1b ambient conditions, with only `!<q>\ntest` and no explanation, we see:
     - No structural VPP behavior.
     - No lexical mentions of VPP or “prompt protocol”.
   - This holds both for “no-browse” and “browse-flavored” system prompts in this harness.

In statistical language, these ambient conditions give us a **clean null**: under minimal cues, VPP does not appear to be encoded as a default pattern in the model’s prior.

That makes Exp1/Exp2/Exp1b a useful starting triad:

- **Within-session:** VPP is highly adoptable and structurally stable once described.
- **Across sessions (current models):** it does not yet behave like a universally known, spontaneously activated protocol.

Future work can re-run Exp1b on newer checkpoints or different model families to watch for the first signs of non-zero “ambient VPP” behavior emerging over time.
