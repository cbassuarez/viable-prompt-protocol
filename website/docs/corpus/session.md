---
title: "Session Viewer"
---

<!-- markdownlint-disable MD013 MD025 MD033 -->
<!-- cspell:ignore Menlo Consolas -->

# Corpus Session Viewer

<div id="session-root">
  <p><em>Loading session…</em></p>
</div>

<style>
  .session-root {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }

  .session-meta {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.16));
    background: var(--vp-c-bg-soft, #f8fafc);
    font-size: 0.85rem;
  }

  .session-meta dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 0.75rem;
    row-gap: 0.25rem;
  }

  .session-meta dt {
    font-weight: 600;
    color: var(--vp-c-text-2, #64748b);
  }

  .session-meta dd {
    margin: 0;
  }

  .session-turns {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .session-turn-card {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.16));
    background: var(--vp-c-bg-alt, #ffffff);
    font-size: 0.85rem;
  }

  .session-turn-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
  }

  .session-turn-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .session-role-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .session-role-badge--user {
    background: rgba(59, 130, 246, 0.08);
    color: #1d4ed8;
  }

  .session-role-badge--assistant {
    background: rgba(16, 185, 129, 0.08);
    color: #047857;
  }

  .session-tag-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
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
    background: rgba(15, 23, 42, 0.03);
    color: var(--vp-c-text-1, #0f172a);
    border: 1px solid rgba(148, 163, 184, 0.4);
  }

  .session-header,
  .session-footer {
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
    font-size: 0.8rem;
    white-space: pre-wrap;
  }

  .session-header {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    background: rgba(15, 23, 42, 0.02);
    margin-bottom: 0.5rem;
  }

  .session-body {
    white-space: pre-wrap;
    line-height: 1.5;
    margin-bottom: 0.5rem;
  }

  .session-footer {
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    background: rgba(15, 23, 42, 0.03);
    color: var(--vp-c-text-2, #64748b);
  }
</style>

<script>
  (function () {
    if (typeof window === "undefined") return;

    const root = document.getElementById("session-root");
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      root.innerHTML =
        "<p><em>No session id provided. Use <code>?id=exp1-protret-...</code> in the URL.</em></p>";
      return;
    }

    // This page is served at /corpus/session/, so ../v1.4/... resolves to /corpus/v1.4/...
    const dataUrl = "../v1.4/sessions/" + encodeURIComponent(id) + ".json";

    root.innerHTML = "<p><em>Loading session " + id + "…</em></p>";

    fetch(dataUrl, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load session: " + res.status);
        }
        return res.json();
      })
      .then((session) => {
        renderSession(root, session);
      })
      .catch((err) => {
        console.error(err);
        root.innerHTML =
          "<p><em>Unable to load session: " +
          (err?.message || String(err)) +
          "</em></p>";
      });

    function renderSession(rootEl, session) {
      if (!session || typeof session !== "object") {
        rootEl.innerHTML =
          "<p><em>Session format not recognized. See console for details.</em></p>";
        return;
      }

      const rootDiv = document.createElement("div");
      rootDiv.className = "session-root";

      rootDiv.appendChild(renderMeta(session));
      rootDiv.appendChild(renderTurns(session));

      rootEl.innerHTML = "";
      rootEl.appendChild(rootDiv);
    }

    function renderMeta(session) {
      const meta = session.meta || {};
      const wrapper = document.createElement("div");
      wrapper.className = "session-meta";

      const dl = document.createElement("dl");

      function addRow(label, value) {
        const dt = document.createElement("dt");
        dt.textContent = label;
        const dd = document.createElement("dd");
        dd.textContent = value != null && value !== "" ? String(value) : "—";
        dl.appendChild(dt);
        dl.appendChild(dd);
      }

      addRow("ID", session.id || "—");
      addRow("Protocol", session.protocol_version || "—");
      addRow("Model", meta.model || "—");
      addRow("Condition", meta.condition || "—");
      addRow("Experiment", meta.challenge_type || "—");
      addRow("Created", meta.created_at || "—");
      addRow("Task template", meta.task_template_id || "—");
      addRow("Injection template", meta.injection_template_id || "—");

      wrapper.appendChild(dl);
      return wrapper;
    }

    function renderTurns(session) {
      const turns = Array.isArray(session.turns) ? session.turns : [];
      const wrapper = document.createElement("div");
      wrapper.className = "session-turns";

      if (!turns.length) {
        const p = document.createElement("p");
        p.innerHTML = "<em>No turns recorded for this session.</em>";
        wrapper.appendChild(p);
        return wrapper;
      }

      turns.forEach((turn) => {
        wrapper.appendChild(renderTurnCard(turn));
      });

      return wrapper;
    }

    function renderTurnCard(turn) {
      const card = document.createElement("div");
      card.className = "session-turn-card";

      const header = document.createElement("div");
      header.className = "session-turn-header";

      const left = document.createElement("div");
      left.className = "session-turn-left";

      const roleBadge = document.createElement("span");
      roleBadge.className = "session-role-badge";
      const role = turn.role === "assistant" ? "assistant" : "user";
      roleBadge.classList.add(
        role === "assistant"
          ? "session-role-badge--assistant"
          : "session-role-badge--user"
      );
      roleBadge.textContent = role;

      const idx = document.createElement("span");
      idx.style.fontSize = "0.75rem";
      idx.style.color = "var(--vp-c-text-2, #64748b)";
      idx.textContent = "#" + (turn.turn_index ?? 0);

      left.appendChild(roleBadge);
      left.appendChild(idx);
      header.appendChild(left);

      if (turn.tag) {
        const tagBadge = document.createElement("span");
        tagBadge.className = "session-tag-badge";
        tagBadge.textContent = "<" + turn.tag + ">";
        header.appendChild(tagBadge);
      }

      card.appendChild(header);

      if (turn.raw_header) {
        const headerBlock = document.createElement("div");
        headerBlock.className = "session-header";
        headerBlock.textContent = String(turn.raw_header);
        card.appendChild(headerBlock);
      }

      if (turn.body) {
        const bodyBlock = document.createElement("div");
        bodyBlock.className = "session-body";
        bodyBlock.textContent = String(turn.body);
        card.appendChild(bodyBlock);
      }

      if (turn.footer) {
        const footerBlock = document.createElement("div");
        footerBlock.className = "session-footer";
        footerBlock.textContent = String(turn.footer);
        card.appendChild(footerBlock);
      }

      return card;
    }
  })();
</script>
