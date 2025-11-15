# I. Grammar (Line 1 Only)
**Form**: `!<tag> [--modifier ...]`  
Tags: `g,q,o,c,o_f,e,e_o` (user side, with `!`).  
Assistant mirrors the tag (no `!`), except: `!<e> --<tag>` → `<tag>`, `!<e_o>` → `<o>`.
Only the **first line** is parsed; later bangs are ignored as content.
Tags define mode, regardless of prompt body content. 
**Pipeline modifiers MUST be angle-bracketed**: use `--<q>`, not `--q`.
