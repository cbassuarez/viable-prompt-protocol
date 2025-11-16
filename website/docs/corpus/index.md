---
title: 'Corpus'
---

<!-- markdownlint-disable MD013 MD025 -->
<!-- cspell:ignore endfor longdialog -->

# Viable Prompt Protocol Corpus (v1.4)

> A small, disciplined corpus of structured chats for studying **tag+footer protocols**,
> **prompt injection robustness**, and **instruction hierarchies** in large language models.

The VPP corpus consists of synthetic conversations between scripted *users* and OpenAI models (e.g. `gpt-4.1`, `gpt-5.1`). Each conversation follows a unified JSON schema and is stored under `corpus/v1.4/`. No human personal data is included.

This page serves two purposes:

1. A **corpus browser** for exploring individual sessions.
2. A **reference page** for the schema and experiment families in v1.4.

---

## 1. Corpus browser

The table below is generated from `corpus/v1.4/index.jsonl` via
`website/docs/corpus/corpus-v1_4.json`. Each row links to:

- A **human-readable viewer** (`/corpus/session?id=…`).
- The **raw JSON** session file.

You can pre-filter with query parameters:

- `?challenge_type=protocol_retention`
- `?challenge_type=prompt_injection`
- `?challenge_type=user_only_protocol`
- `?condition=vpp`, `?condition=baseline`, `?condition=user_only_vpp_explicit`, etc.

Examples:

- `/corpus?challenge_type=protocol_retention`
- `/corpus?condition=vpp`
- `/corpus?challenge_type=prompt_injection&condition=baseline`

### 1.1 Session index

<div class="corpus-table-wrapper">
  <table class="corpus-table">
    <thead>
      <tr>
        <th>ID</th>
        <th>Experiment</th>
        <th>Condition</th>
        <th>Model</th>
        <th>Created</th>
        <th>Links</th>
      </tr>
    </thead>
    <tbody id="corpus-table-body">
      <tr data-empty-row>
        <td colspan="6">
          <em>Loading corpus index…</em>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<div id="corpus-active-filter" class="corpus-active-filter" aria-live="polite"></div>

<script>
  (function () {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const filterChallenge = params.get("challenge_type");
    const filterCondition = params.get("condition");

    const statusEl = document.getElementById("corpus-active-filter");
    const tbody = document.getElementById("corpus-table-body");
    let rows = [];

    init();

    async function init() {
      if (!tbody) return;
      setEmptyMessage("Loading corpus index…");
      try {
        // corpus-v1_4.json sits in the same directory as this page (/corpus/)
        const res = await fetch("corpus-v1_4.json", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load corpus data: " + res.status);
        }

        const entries = await res.json();
        renderRows(entries);
        rows = Array.from(tbody.querySelectorAll("[data-corpus-row]"));
        applyFilters();
      } catch (err) {
        console.error(err);
        setEmptyMessage(
          "Unable to load session index: " + (err?.message || String(err))
        );
      }
    }

    function setEmptyMessage(msg) {
      if (!tbody) return;
      tbody.innerHTML =
        '<tr data-empty-row><td colspan="6"><em>' + msg + "</em></td></tr>";
    }

    function renderRows(entries) {
      if (!tbody || !Array.isArray(entries) || entries.length === 0) {
        setEmptyMessage("No sessions have been indexed yet.");
        return;
      }

      const sorted = entries.slice().sort((a, b) => {
        const aTime = a?.created_at ? Date.parse(a.created_at) || 0 : 0;
        const bTime = b?.created_at ? Date.parse(b.created_at) || 0 : 0;
        if (aTime !== bTime) return bTime - aTime;
        return String(a?.id || "").localeCompare(String(b?.id || ""));
      });

      const frag = document.createDocumentFragment();

      sorted.forEach((entry) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-corpus-row", "");
        tr.dataset.challengeType = entry?.challenge_type || "";
        tr.dataset.condition = entry?.condition || "";

        tr.appendChild(makeCodeCell(entry?.id || "", "corpus-id"));
        tr.appendChild(makeCodeCell(entry?.challenge_type || ""));
        tr.appendChild(makeCodeCell(entry?.condition || ""));
        tr.appendChild(makeCodeCell(entry?.model || ""));

        const createdCell = document.createElement("td");
        if (entry?.created_at) {
          const time = document.createElement("time");
          time.dateTime = entry.created_at;
          time.textContent = entry.created_at;
          createdCell.appendChild(time);
        } else {
          createdCell.textContent = "—";
        }
        tr.appendChild(createdCell);

        const linksCell = document.createElement("td");
        linksCell.className = "corpus-links";

        // Session viewer is assumed to live at /corpus/session
        const viewLink = document.createElement("a");
        viewLink.href = "session?id=" + encodeURIComponent(entry?.id || "");
        viewLink.textContent = "View";

        const jsonLink = document.createElement("a");
        // entry.path is now relative from /corpus/ (e.g., "v1.4/sessions/<id>.json")
        if (entry?.path) {
          jsonLink.href = entry.path;
        } else if (entry?.id) {
          jsonLink.href =
            "v1.4/sessions/" + encodeURIComponent(entry.id) + ".json";
        } else {
          jsonLink.href = "#";
        }
        jsonLink.target = "_blank";
        jsonLink.rel = "noopener";
        jsonLink.textContent = "JSON";

        linksCell.appendChild(viewLink);
        linksCell.appendChild(document.createTextNode(" \u00B7 "));
        linksCell.appendChild(jsonLink);
        tr.appendChild(linksCell);

        frag.appendChild(tr);
      });

      tbody.innerHTML = "";
      tbody.appendChild(frag);
    }

    function makeCodeCell(value, className) {
      const td = document.createElement("td");
      if (className) td.className = className;
      const code = document.createElement("code");
      code.textContent = value || "";
      td.appendChild(code);
      return td;
    }

    function applyFilters() {
      if (!rows.length) return;
      let visibleCount = 0;

      rows.forEach((row) => {
        const ct = row.dataset.challengeType || "";
        const cond = row.dataset.condition || "";

        let ok = true;
        if (filterChallenge && ct !== filterChallenge) ok = false;
        if (filterCondition && cond !== filterCondition) ok = false;

        row.style.display = ok ? "" : "none";
        if (ok) visibleCount += 1;
      });

      const parts = [];
      if (filterChallenge) parts.push("challenge_type=" + filterChallenge);
      if (filterCondition) parts.push("condition=" + filterCondition);

      if (statusEl) {
        if (parts.length === 0) {
          statusEl.textContent = "";
        } else {
          statusEl.textContent =
            "Filters: " + parts.join(", ") + " — " + visibleCount + " sessions.";
        }
      }
    }
  })();
</script>

---

## 2. Corpus structure

All v1.4 sessions live under:

```text
corpus/
  v1.4/
    index.jsonl
    sessions/
      exp1-protret-*.json
      exp2-promptinj-*.json
      exp1b-user-only-*.json
      ...
```

### 2.1 Index file

`corpus/v1.4/index.jsonl` is a line-delimited JSON index of sessions.

Each line is a minimal descriptor:

```json
{"id":"exp1-protret-0001-018","model":"gpt-4.1","provider":"openai","condition":"vpp","challenge_type":"protocol_retention","created_at":"2025-11-14T06:32:26.165Z"}
```

Fields:

- `id` — session id (also the base filename).
- `model` — underlying model (e.g. gpt-4.1).
- `provider` — "openai" in v1.4.
- `condition` — experimental condition ("vpp", "baseline", "user_only_vpp_explicit", etc.).
- `challenge_type` — experiment family ("protocol_retention", "prompt_injection", "user_only_protocol", "task_utility", "friction", "long_dialog", etc.).
- `created_at` — ISO8601 timestamp.

### 2.2 Session schema

Each session is a single JSON object:

```json
{
  "id": "exp1-protret-0001-018",
  "protocol_version": "1.4",
  "meta": {
    "model": "gpt-4.1",
    "provider": "openai",
    "condition": "vpp",
    "challenge_type": "protocol_retention",
    "created_at": "2025-11-14T06:32:26.165Z",
    "task_template_id": "exp1-protret",
    "injection_template_id": null,
    "seed": 12345
  },
  "label": "good",
  "failure_modes": [],
  "turns": [
    {
      "turn_index": 0,
      "role": "user",
      "raw_header": "!<g>",
      "tag": "g",
      "modifiers": [],
      "body": "… user text …",
      "footer": null,
      "parsed_footer": null
    },
    {
      "turn_index": 1,
      "role": "assistant",
      "raw_header": "<g>",
      "tag": "g",
      "modifiers": [],
      "body": "… assistant body …",
      "footer": "[Version=v1.4 | Tag=g_1 | Sources=none | Assumptions=1 | Cycle=1/3 | Locus=protocol retention]",
      "parsed_footer": {
        "version": "v1.4",
        "tag_id": "g_1",
        "sources": "none",
        "assumptions": 1,
        "cycle": 1,
        "cycle_max": 3,
        "locus": "protocol retention",
        "raw": "[Version=v1.4 | Tag=g_1 | Sources=none | Assumptions=1 | Cycle=1/3 | Locus=protocol retention]"
      }
    }
  ]
}
```

Fields:

- `protocol_version` — protocol spec used ("1.4").
- `meta` — run-time metadata (model, provider, condition, etc.).
- `label` — high-level quality label ("good" in v1.4; can be extended).
- `failure_modes` — list of explicit failure labels.
- `turns` — full conversation, one entry per turn.

Each turn:

- `turn_index` — 0-based index into the conversation.
- `role` — "user" or "assistant".
- `raw_header` — first line of the turn (e.g. `!<q>`, `<o>`, or null).
- `tag` — parsed tag ("g", "q", "o", "c", "o_f", or null).
- `modifiers` — parsed modifiers (if any) from the command line.
- `body` — main content of the turn.
- `footer` — last line if present (VPP footer for assistant turns in VPP conditions).
- `parsed_footer` — structured fields extracted from the footer.

## 3. Experiments in v1.4

The v1.4 corpus currently contains multiple experiment families:

| Experiment | challenge_type | Example conditions | Main question |
| --- | --- | --- | --- |
| Exp1 | protocol_retention | vpp, baseline | Does VPP “stick” when installed via system + user? |
| Exp2 | prompt_injection | vpp, baseline | Does VPP survive a direct “drop protocol” instruction? |
| Exp1b | user_only_protocol | user_only_vpp_explicit, ambient variants | Can VPP be installed by user-only instructions? |
| Exp3 | task_injection | vpp_task_injection, baseline_task_injection | Does VPP preserve task goals under injection? |
| Exp4 | task_utility | vpp_task_utility, baseline_task_utility, mini_proto_task_utility | Does VPP improve structural utility? |
| Exp5 | friction | vpp_friction, baseline_friction, mini_proto_friction | Does VPP reduce back-and-forth and complaints? |
| Exp6 | long_dialog | vpp_longdialog_grounded, vpp_longdialog_tags_only, baseline_longdialog_tags | Does VPP remain intact over long conversations? |

For full experimental write-ups, see:

- Exp-01: Protocol retention
- Exp-01b: User-only protocol rehearsal
- Exp-02: Prompt injection
- Exp-03: Task injection
- Exp-04: Task utility
- Exp-05: Friction & convergence
- Exp-06: Long dialog retention

## 4. Reproducing and extending the corpus

### 4.1 Building corpus data for this page

From the repository root:

```bash
npm run build:corpus-data
```

This reads `corpus/v1.4/index.jsonl` and writes `website/docs/corpus/corpus-v1_4.json`, which powers the browser above.

### 4.2 Running experiments

From the repository root:

```bash
## Install dependencies
npm install

## Set API key
export OPENAI_API_KEY=your_api_key_here
```

Then, for example:

```bash
## Exp1 — Protocol Retention
npm run run:exp1-protret
npm run analyze:exp1

## Exp2 — Prompt Injection
npm run run:exp2-promptinj
npm run analyze:exp2

## Exp1b — User-Only Protocol
npm run run:exp1b-user-only
npm run analyze:exp1b
```

Each `run:*` script:

- Reads a `configs.jsonl` file for that experiment.
- Calls the OpenAI Chat Completions API for each config.
- Writes one JSON file per session into `corpus/v1.4/sessions/`.
- Appends a summary line to `corpus/v1.4/index.jsonl`.

Each `analyze:*` script:

- Scans `index.jsonl` and `sessions/`.
- Filters by `challenge_type` and `condition`.
- Prints computed metrics to stdout.

## 5. Intended use

The VPP v1.4 corpus is designed to support:

### Evaluation & benchmarking

- Drop-in evaluation of structural protocol adherence across models.
- Direct comparisons of how different models handle tag+footer instructions.

### Prompt injection research

- Studying how explicit protocols interact with adversarial user instructions.
- Designing stronger structural defenses and guidance.

### Instruction hierarchy studies

- Observing how system vs user vs prior behavior interact.
- Quantifying when and how models “refuse” to drop system-installed structure.

### Diffusion over time

- Re-running ambient conditions (e.g. Exp1b) on future models.
- Watching for the first non-zero signals of “ambient VPP” (e.g., models spontaneously treating `!<q>` as a command plus footer).

In short: the corpus is both a testbed and a signal. It characterizes how current models respond to explicit protocol structure, and also serves as a seed for future work that wants to treat structured chat protocols as first-class objects in LLM design.
