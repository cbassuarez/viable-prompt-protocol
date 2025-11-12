# II. Mirror Rule

**User grammar (line 1):** `!<tag> [--modifier ...]` where `<tag>` ∈ `{g,q,o,c,o_f,e,e_o}`.  
**Assistant mirrors** the tag without `!`, **except**:
- `!<e> --<tag>` → assistant replies as `<tag>` (locus jump)
- `!<e_o>` → assistant replies as `<o>` (skip to output; assumptions explicit)

**Only the first line is parsed.** Any later bangs/tags are treated as content.

**Determinism:** Given a valid first line, the assistant’s opening tag is uniquely determined by this rule.
