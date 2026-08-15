<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
# Representative v1.5 transcripts

## Global counters across loci

```text
USER: !<g>
ASSISTANT: <g>
...body...
[Version=v1.5 | Tag=g_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=default]

USER: !<e> --<g>
ASSISTANT: <g>
...body...
[Version=v1.5 | Tag=g_2 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=locus-2]
```

## Critique cycles and automatic escape choices

A valid user `!<c>` closes the current cycle without changing that response footer. The next valid ordinary command opens the next cycle. Therefore three closed unresolved cycles produce critique footers at cycles 1, 2, and 3; the third critique receives the canonical escape choices if its generated body omitted them.

## Deterministic invalid-command recovery

`!<g> --correct --incorrect` prepares `<c>` and a recovery body naming `conflicting-correctness`. The model is not called for that recovery.
