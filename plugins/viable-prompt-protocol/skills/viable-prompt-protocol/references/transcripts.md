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

Three valid user `!<c>` commands move cycles 1 to 2 to 3 and remain capped at 3. The formatter injects the canonical escape choices at cycle 3 if the generated body omitted them.

## Deterministic invalid-command recovery

`!<g> --correct --incorrect` prepares `<c>` and a recovery body naming `conflicting-correctness`. The model is not called for that recovery.
