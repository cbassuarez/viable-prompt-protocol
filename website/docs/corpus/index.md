---
title: "Corpus"
---

<!-- markdownlint-disable MD013 MD025 MD033 -->
<!-- cspell:ignore longdialog Menlo Consolas -->

# Viable Prompt Protocol Corpus (v1.4)

> A small, disciplined corpus of structured chats for studying **tag+footer protocols**,
> **prompt injection robustness**, and **instruction hierarchies** in large language models.

The VPP corpus consists of synthetic conversations between scripted *users* and OpenAI models (e.g. `gpt-4.1`, `gpt-5.1`). Each conversation follows a unified JSON schema and is stored under `corpus/v1.4/`. No human personal data is included.

This page serves two purposes:

1. A **corpus browser** for exploring individual sessions.
2. A **reference page** for the schema and experiment families in v1.4.

---

## 1. Corpus browser

The table below is generated from `corpus/v1.4/index.jsonl` via a prebuilt
`corpus/v1.4/corpus-v1_4.json` index (copied into this directory at build time).
Each row links to:

- A **human-readable viewer** (`/corpus/session?id=…`).
- The **raw JSON** session file.

You can pre-filter with query parameters:

- `?challenge_type=protocol_retention`
- `?challenge_type=prompt_injection`
- `?challenge_type=user_only_protocol`
- `?challenge_type=task_utility`
- `?challenge_type=friction`
- `?challenge_type=long_dialog`
- `?condition=vpp`, `?condition=baseline`, `?condition=user_only_vpp_explicit`, etc.

Examples:

- `/corpus?challenge_type=protocol_retention`
- `/corpus?condition=vpp`
- `/corpus?challenge_type=prompt_injection&condition=baseline`

### 1.1 Session index

<div class="corpus-controls">
  <div class="corpus-controls-left">
    <label>
      Experiment
      <select id="corpus-filter-challenge">
        <option value="">All experiments</option>
      </select>
    </label>
    <label>
      Condition
      <select id="corpus-filter-condition">
        <option value="">All conditions</option>
      </select>
    </label>
  </div>
  <div class="corpus-controls-right">
    <label>
      Search
      <input
        id="corpus-search"
        type="search"
        placeholder="id, model, condition…"
        autocomplete="off"
      />
    </label>
  </div>
</div>

<div class="corpus-table-wrapper">
  <table class="corpus-table">
    <thead>
      <tr>
        <th data-sort-key="id">ID</th>
        <th data-sort-key="challenge_type">Experiment</th>
        <th data-sort-key="condition">Condition</th>
        <th data-sort-key="model">Model</th>
        <th data-sort-key="created_at">Created</th>
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
<div id="corpus-pagination" class="corpus-pagination" aria-live="polite"></div>

<style>
  .corpus-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
    margin: 1rem 0 0.5rem;
  }

  .corpus-controls-left,
  .corpus-controls-right {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .corpus-controls label {
    font-size: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .corpus-controls select,
  .corpus-controls input[type="search"] {
    font: inherit;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.16));
    background: var(--vp-c-bg-alt, #ffffff);
  }

  .corpus-table-wrapper {
    margin-top: 0.5rem;
    border-radius: 0.75rem;
    border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.16));
    background: var(--vp-c-bg-soft, #f8fafc);
    overflow-x: auto;
    font-family: var(
      --vp-font-family-mono,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      "Liberation Mono",
      "Courier New",
      monospace
    );
  }

  .corpus-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .corpus-table thead {
    background: linear-gradient(
      to right,
      rgba(15, 23, 42, 0.03),
      rgba(148, 163, 184, 0.03)
    );
  }

  .corpus-table th,
  .corpus-table td {
    padding: 0.4rem 0.6rem;
    text-align: left;
    white-space: nowrap;
  }

  .corpus-table th {
    font-weight: 600;
    font-size: 0.8rem;
    border-bottom: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.16));
    cursor: pointer;
    user-select: none;
  }

  .corpus-table th:last-child {
    cursor: default;
  }

  .corpus-table tbody tr.corpus-row:nth-child(even) {
    background: rgba(15, 23, 42, 0.02);
  }

  .corpus-table tbody tr.corpus-row:hover {
    background: rgba(56, 189, 248, 0.08);
  }

  .corpus-table td.corpus-id code {
    font-weight: 600;
  }

  .corpus-table code {
    font-family: inherit;
    font-size: 0.8rem;
  }

  .corpus-links a {
    font-size: 0.8rem;
  }

  .corpus-links a + a::before {
    content: "·";
    margin: 0 0.25rem;
    color: var(--vp-c-text-2, #64748b);
  }

  .corpus-active-filter {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: var(--vp-c-text-2, #64748b);
  }

  .corpus-pagination {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.8rem;
  }

  .corpus-pagination-controls {
    display: flex;
    gap: 0.25rem;
  }

  .corpus-pagination button {
    font: inherit;
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.16));
    background: var(--vp-c-bg-alt, #ffffff);
    cursor: pointer;
  }

  .corpus-pagination button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .corpus-sort-active {
    color: var(--vp-c-brand, #0ea5e9);
  }

  .corpus-sort-active::after {
    content: "▾";
    display: inline-block;
    margin-left: 0.25rem;
    font-size: 0.6rem;
    transform: translateY(-0.05rem);
  }

  .corpus-sort-active[aria-sort="ascending"]::after {
    content: "▴";
  }

  .corpus-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid transparent;
    background: rgba(15, 23, 42, 0.03);
  }

  .corpus-badge--experiment {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.06);
    color: #1d4ed8;
  }

  .corpus-badge--condition {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.06);
    color: #047857;
  }

  @media (max-width: 768px) {
    .corpus-controls {
      align-items: stretch;
    }

    .corpus-controls-left,
    .corpus-controls-right {
      width: 100%;
    }

    .corpus-controls label {
      width: 100%;
    }

    .corpus-table th:nth-child(4),
    .corpus-table td:nth-child(4),
    .corpus-table th:nth-child(5),
    .corpus-table td:nth-child(5) {
      display: none;
    }
  }
</style>

<script>
  (function () {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const initialChallenge = params.get("challenge_type") || "";
    const initialCondition = params.get("condition") || "";

    const tbody = document.getElementById("corpus-table-body");
    const filterChallengeEl = document.getElementById("corpus-filter-challenge");
    const filterConditionEl = document.getElementById("corpus-filter-condition");
    const searchEl = document.getElementById("corpus-search");
    const statusEl = document.getElementById("corpus-active-filter");
    const paginationEl = document.getElementById("corpus-pagination");

    // We are at /corpus/, so this relative path resolves to /corpus/v1.4/corpus-v1_4.json
    const dataUrl = "v1.4/corpus-v1_4.json";
    const PAGE_SIZE = 50;

    let allEntries = [];
    let filteredEntries = [];
    let currentSort = { key: "created_at", dir: "desc" };
    let currentPage = 1;

    init();

    async function init() {
      if (!tbody) return;
      setEmptyMessage("Loading corpus index…");
      try {
        const res = await fetch(dataUrl, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load corpus data: " + res.status);
        }
        const entries = await res.json();
        allEntries = Array.isArray(entries) ? entries : [];

        populateFilters(allEntries);

        if (initialChallenge && filterChallengeEl) {
          filterChallengeEl.value = initialChallenge;
        }
        if (initialCondition && filterConditionEl) {
          filterConditionEl.value = initialCondition;
        }

        attachEventHandlers();
        applyAll();
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
      if (paginationEl) {
        paginationEl.textContent = "";
      }
    }

    function populateFilters(entries) {
      if (!Array.isArray(entries) || !entries.length) return;

      const challengeSet = new Set();
      const conditionSet = new Set();

      entries.forEach((e) => {
        if (e?.challenge_type) challengeSet.add(e.challenge_type);
        if (e?.condition) conditionSet.add(e.condition);
      });

      if (filterChallengeEl) {
        while (filterChallengeEl.options.length > 1) {
          filterChallengeEl.remove(1);
        }
        Array.from(challengeSet)
          .sort()
          .forEach((ct) => {
            const opt = document.createElement("option");
            opt.value = ct;
            opt.textContent = ct;
            filterChallengeEl.appendChild(opt);
          });
      }

      if (filterConditionEl) {
        while (filterConditionEl.options.length > 1) {
          filterConditionEl.remove(1);
        }
        Array.from(conditionSet)
          .sort()
          .forEach((cond) => {
            const opt = document.createElement("option");
            opt.value = cond;
            opt.textContent = cond;
            filterConditionEl.appendChild(opt);
          });
      }
    }

    function attachEventHandlers() {
      if (filterChallengeEl) {
        filterChallengeEl.addEventListener("change", () => {
          currentPage = 1;
          applyAll();
        });
      }
      if (filterConditionEl) {
        filterConditionEl.addEventListener("change", () => {
          currentPage = 1;
          applyAll();
        });
      }
      if (searchEl) {
        searchEl.addEventListener("input", () => {
          currentPage = 1;
          applyAll();
        });
      }

      const headerCells = document.querySelectorAll(
        ".corpus-table thead th[data-sort-key]"
      );
      headerCells.forEach((th) => {
        th.addEventListener("click", () => {
          const key = th.getAttribute("data-sort-key");
          if (!key) return;
          if (currentSort.key === key) {
            currentSort.dir = currentSort.dir === "asc" ? "desc" : "asc";
          } else {
            currentSort.key = key;
            currentSort.dir = key === "created_at" ? "desc" : "asc";
          }
          updateSortIndicators();
          applyAll();
        });
      });
      updateSortIndicators();
    }

    function applyAll() {
      const challengeFilter = filterChallengeEl ? filterChallengeEl.value || "" : "";
      const conditionFilter = filterConditionEl ? filterConditionEl.value || "" : "";
      const searchTerm = searchEl ? searchEl.value.trim().toLowerCase() : "";

      filteredEntries = allEntries.filter((e) => {
        if (challengeFilter && e.challenge_type !== challengeFilter) return false;
        if (conditionFilter && e.condition !== conditionFilter) return false;
        if (searchTerm) {
          const haystack = [
            e.id,
            e.model,
            e.challenge_type,
            e.condition,
            e.provider,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(searchTerm)) return false;
        }
        return true;
      });

      const total = filteredEntries.length;
      if (!total) {
        setEmptyMessage("No sessions match the current filters.");
        if (statusEl) {
          statusEl.textContent = buildFilterStatus(0);
        }
        return;
      }

      filteredEntries.sort((a, b) => {
        const { key, dir } = currentSort;
        const va = a?.[key];
        const vb = b?.[key];
        let cmp = 0;

        if (key === "created_at") {
          const ta = va ? Date.parse(va) || 0 : 0;
          const tb = vb ? Date.parse(vb) || 0 : 0;
          cmp = ta - tb;
        } else {
          const sa = (va ?? "").toString();
          const sb = (vb ?? "").toString();
          cmp = sa.localeCompare(sb);
        }

        return dir === "asc" ? cmp : -cmp;
      });

      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (currentPage > totalPages) currentPage = totalPages;

      const start = (currentPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageEntries = filteredEntries.slice(start, end);

      renderRows(pageEntries);
      renderPagination(total, totalPages);
      if (statusEl) {
        statusEl.textContent = buildFilterStatus(total);
      }
    }

    function renderRows(entries) {
      if (!tbody) return;
      if (!Array.isArray(entries) || !entries.length) {
        setEmptyMessage("No sessions to display.");
        return;
      }

      const frag = document.createDocumentFragment();

      entries.forEach((entry) => {
        const tr = document.createElement("tr");
        tr.className = "corpus-row";

        tr.appendChild(makeCodeCell(entry.id || "", "corpus-id"));
        tr.appendChild(
          makeBadgeCell(entry.challenge_type || "", "corpus-badge--experiment")
        );
        tr.appendChild(
          makeBadgeCell(entry.condition || "", "corpus-badge--condition")
        );
        tr.appendChild(makeCodeCell(entry.model || "", ""));

        const createdCell = document.createElement("td");
        if (entry.created_at) {
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

        const viewLink = document.createElement("a");
        // /corpus/session?id=<id>
        viewLink.href = "session?id=" + encodeURIComponent(entry.id || "");
        viewLink.textContent = "View";

        const jsonLink = document.createElement("a");
        if (entry.path) {
          // entry.path is relative to /corpus, e.g. v1.4/sessions/<id>.json
          jsonLink.href = entry.path;
        } else if (entry.id) {
          jsonLink.href = "v1.4/sessions/" + encodeURIComponent(entry.id) + ".json";
        } else {
          jsonLink.href = "#";
        }
        jsonLink.target = "_blank";
        jsonLink.rel = "noopener";
        jsonLink.textContent = "JSON";

        linksCell.appendChild(viewLink);
        linksCell.appendChild(jsonLink);

        tr.appendChild(linksCell);
        frag.appendChild(tr);
      });

      tbody.innerHTML = "";
      tbody.appendChild(frag);
    }

    function makeCodeCell(value, extraClass) {
      const td = document.createElement("td");
      if (extraClass) td.className = extraClass;
      const code = document.createElement("code");
      code.textContent = value || "";
      td.appendChild(code);
      return td;
    }

    function makeBadgeCell(value, badgeClass) {
      const td = document.createElement("td");
      const span = document.createElement("span");
      span.className = "corpus-badge " + (badgeClass || "");
      span.textContent = value || "—";
      td.appendChild(span);
      return td;
    }

    function renderPagination(total, totalPages) {
      if (!paginationEl) return;
      if (total <= PAGE_SIZE) {
        paginationEl.textContent = "";
        return;
      }

      paginationEl.innerHTML = "";

      const info = document.createElement("span");
      info.className = "corpus-pagination-info";
      info.textContent =
        "Page " +
        currentPage +
        " of " +
        totalPages +
        " — " +
        total +
        " sessions";
      paginationEl.appendChild(info);

      const controls = document.createElement("div");
      controls.className = "corpus-pagination-controls";

      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.textContent = "Prev";
      prevBtn.disabled = currentPage <= 1;
      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage -= 1;
          applyAll();
        }
      });
      controls.appendChild(prevBtn);

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.textContent = "Next";
      nextBtn.disabled = currentPage >= totalPages;
      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage += 1;
          applyAll();
        }
      });
      controls.appendChild(nextBtn);

      paginationEl.appendChild(controls);
    }

    function updateSortIndicators() {
      const headerCells = document.querySelectorAll(
        ".corpus-table thead th[data-sort-key]"
      );
      headerCells.forEach((th) => {
        const key = th.getAttribute("data-sort-key");
        if (!key) return;
        const isActive = key === currentSort.key;
        th.classList.toggle("corpus-sort-active", isActive);
        th.setAttribute(
          "aria-sort",
          isActive
            ? currentSort.dir === "asc"
              ? "ascending"
              : "descending"
            : "none"
        );
      });
    }

    function buildFilterStatus(total) {
      const parts = [];
      const challengeFilter = filterChallengeEl ? filterChallengeEl.value || "" : "";
      const conditionFilter = filterConditionEl ? filterConditionEl.value || "" : "";
      const searchTerm = searchEl ? searchEl.value.trim() : "";

      if (challengeFilter) parts.push("challenge_type=" + challengeFilter);
      if (conditionFilter) parts.push("condition=" + conditionFilter);
      if (searchTerm) parts.push('search="' + searchTerm + '"');

      if (!parts.length) {
        return total + " sessions.";
      }
      return "Filters: " + parts.join(", ") + " — " + total + " sessions.";
    }
  })();
</script>

---

## 2. Corpus structure

The corpus directory contains the transcripts collected by the experiment
runners. Browse the files on GitHub:
[`/corpus/`](https://github.com/cbassuarez/viable-prompt-protocol/tree/main/corpus).

### Layout

- `corpus/v1.4/schema.json` — JSON Schema describing the shape of each saved
  session (IDs, meta fields, turns, and parsed footers).
- `corpus/v1.4/index.jsonl` — newline-delimited index of sessions with model,
  provider, condition, challenge type, and timestamps.
- `corpus/v1.4/sessions/*.json` — per-session transcripts generated by
  experiments (e.g., `exp1-protret-0001.json`). Each file records user and
  assistant turns, raw headers, parsed tags, and footers.

The files follow the same schema validated by `node scripts/test-transcripts.mjs`.
Session IDs align with the `id` fields in each experiment’s `configs.jsonl` so
you can trace runs back to their source configuration.
