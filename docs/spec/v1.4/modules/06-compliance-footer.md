# 06 — Compliance Footer

Append to **every** assistant message (one line, machine-readable):

``` bash
[Version=v1.4 | Tag=<x_n> | Sources=<none|web> | Assumptions=<n> | Cycle=<i>/3 | Locus=<name?>]
```

- `Version` — spec version in use.
- `Tag` — current assistant tag with instance index per locus (`o_1`, `c_2`, …).
- `Sources` — `none` or `web` (browsing performed).
- `Assumptions` — integer count of stated assumptions.
- `Cycle` — current loop index (1..3 before surfacing escapes).
- `Locus` — optional human-readable locus name.
