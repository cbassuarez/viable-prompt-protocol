# IV. Loop & Escapes

**Flexible loop:** `g → q → o → c → … → o_f`  
The `…` may be any length and any order of `{g,q,o,c}` as required by the problem.

**Cycle policy:** After 3 unresolved cycles, assistant surfaces escape options:
- `!<e> --<g|q|o|c|o_f>` to jump locus and start at a chosen tag
- `!<e_o>` to skip directly to `<o>` (assumptions explicit)

**Locus:** A named or implied sub-problem context. Pipelines can fork by `!<o> --correct --<tag>` or `!<e> --<tag>`.
