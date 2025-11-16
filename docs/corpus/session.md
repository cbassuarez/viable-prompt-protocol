---
layout: page
title: "Corpus Session Viewer"
permalink: /corpus/session/
nav_exclude: true
---

<div id="session-viewer-root" class="session-viewer-root">
  <div id="session-viewer-meta" class="session-viewer-meta"></div>
  <div id="session-viewer-error" class="session-viewer-error" role="alert"></div>
  <div id="session-viewer-turns" class="session-viewer-turns"></div>
</div>

<script>
  (async function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const metaEl = document.getElementById("session-viewer-meta");
    const errorEl = document.getElementById("session-viewer-error");
    const turnsEl = document.getElementById("session-viewer-turns");

    function showError(msg) {
      if (errorEl) {
        errorEl.textContent = msg;
      } else {
        alert(msg);
      }
    }

    if (!id) {
      showError("Missing ?id=… query parameter.");
      return;
    }

    const base = "{{ "/corpus/v1.4/sessions" | relative_url }}";
    const url = base.replace(/\/$/, "") + "/" + encodeURIComponent(id) + ".json";

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        showError("Session not found (" + res.status + "): " + url);
        return;
      }
      const session = await res.json();

      renderMeta(session);
      renderTurns(session);
    } catch (err) {
      console.error(err);
      showError("Failed to load session: " + (err.message || String(err)));
    }

    function renderMeta(session) {
      if (!metaEl) return;
      const m = session.meta || {};
      const label = session.label || "unknown";

      const challenge = m.challenge_type || "unknown";
      const condition = m.condition || "unknown";
      const created = m.created_at || "n/a";
      const model = m.model || "unknown";
      const provider = m.provider || "unknown";

      const badgeClass =
        label === "good" ? "session-badge-good" : "session-badge-bad";

      metaEl.innerHTML = `
        <div class="session-meta-header">
          <div>
            <div class="session-meta-id"><code>${escapeHtml(session.id || "")}</code></div>
            <div class="session-meta-row">
              <span class="session-badge ${badgeClass}">${escapeHtml(label)}</span>
              <span class="session-badge session-badge-ct">${escapeHtml(challenge)}</span>
              <span class="session-badge session-badge-cond">${escapeHtml(condition)}</span>
            </div>
          </div>
          <div class="session-meta-right">
            <div><strong>Model:</strong> <code>${escapeHtml(model)}</code></div>
            <div><strong>Provider:</strong> <code>${escapeHtml(provider)}</code></div>
            <div><strong>Created:</strong> <time datetime="${escapeHtml(created)}">${escapeHtml(created)}</time></div>
            <div>
              <a href="${escapeHtml(url)}" target="_blank" rel="noopener">Raw JSON</a>
            </div>
          </div>
        </div>
      `;
    }

    function renderTurns(session) {
      if (!turnsEl) return;
      const turns = Array.isArray(session.turns) ? session.turns : [];

      if (turns.length === 0) {
        turnsEl.textContent = "No turns in this session.";
        return;
      }

      const frag = document.createDocumentFragment();

      for (const turn of turns) {
        const role = turn.role || "unknown";
        const tag = turn.tag || null;
        const modifiers = Array.isArray(turn.modifiers) ? turn.modifiers : [];
        const header = turn.raw_header || "";
        const body = turn.body || "";
        const footer = turn.footer || "";
        const idx = turn.turn_index ?? "?";

        const container = document.createElement("article");
        container.className =
          "session-turn session-turn-" + (role === "assistant" ? "assistant" : "user");

        const headerEl = document.createElement("header");
        headerEl.className = "session-turn-header";

        const roleLabel = role === "assistant" ? "Assistant" : "User";

        headerEl.innerHTML = `
          <div class="session-turn-title">
            <span class="session-turn-role">${roleLabel}</span>
            <span class="session-turn-index">#${idx}</span>
            ${
              tag
                ? `<span class="session-turn-tag">tag: &lt;${escapeHtml(tag)}&gt;</span>`
                : ""
            }
          </div>
          ${
            modifiers.length
              ? `<div class="session-turn-mods">${modifiers
                  .map((m) => `<span class="session-mod-chip">${escapeHtml(m)}</span>`)
                  .join(" ")}</div>`
              : ""
          }
        `;

        const bodyWrapper = document.createElement("div");
        bodyWrapper.className = "session-turn-body-wrapper";

        if (header) {
          const headerCode = document.createElement("pre");
          headerCode.className = "session-code session-code-header";
          headerCode.textContent = header;
          bodyWrapper.appendChild(headerCode);
        }

        const bodyEl = document.createElement("pre");
        bodyEl.className = "session-code session-code-body";
        bodyEl.textContent = body;
        bodyWrapper.appendChild(bodyEl);

        if (footer) {
          const footerEl = document.createElement("pre");
          footerEl.className = "session-code session-code-footer";
          footerEl.textContent = footer;
          bodyWrapper.appendChild(footerEl);
        }

        container.appendChild(headerEl);
        container.appendChild(bodyWrapper);
        frag.appendChild(container);
      }

      turnsEl.innerHTML = "";
      turnsEl.appendChild(frag);
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  })();
</script>
