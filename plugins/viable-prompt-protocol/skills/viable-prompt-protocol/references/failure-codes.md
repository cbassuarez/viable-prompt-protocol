<!-- GENERATED from protocol/v1.5/manifest.json; do not edit. -->
# VPP v1.5 structural failure codes

| Code | Meaning |
| --- | --- |
| `invalid-first-line` | Line 1 is not a valid VPP command. |
| `unknown-tag` | The command tag is not a VPP user tag. |
| `invalid-modifier` | A token after the command is not a supported modifier. |
| `duplicate-modifier` | A modifier or pipeline destination appears more than once. |
| `conflicting-correctness` | `--correct` and `--incorrect` appear together. |
| `conflicting-severity` | `--minor` and `--major` appear together. |
| `multiple-pipeline-destinations` | More than one destination was supplied. |
| `missing-pipeline-destination` | `!<e>` lacks its destination. |
| `invalid-pipeline-destination` | A destination is not an assistant tag. |
| `pipeline-not-allowed` | A destination appears on an unsupported command. |
| `invalid-state-*` | Client-carried state violates the v1.5 schema. |
| `missing-or-invalid-header` | Assistant line 1 is not the expected bare tag. |
| `missing-or-malformed-footer` | The canonical footer is absent or malformed. |
| `*-mismatch` | Wrapper/footer fields differ from the deterministic transition. |
| `nested-header`, `nested-footer` | A duplicate wrapper appears inside the body. |
| `missing-escape-options` | The critique closing cycle 3 omitted an escape form. |
| `recovery-body-mismatch` | Invalid input did not use the deterministic recovery body. |
