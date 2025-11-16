---
layout: page
title: "Corpus Session Viewer"
permalink: /corpus/session/
nav_exclude: true
---

<!-- markdownlint-disable MD013 MD033 -->

# Session viewer

This page renders a single corpus session from `corpus/v1.4/sessions/`.  
Provide a query parameter, for example:

- `/corpus/session?id=exp1-protret-0001-018`

<div id="corpus-session-root" class="corpus-session-root">
  <p><em>Loading session…</em></p>
</div>

<style>
  .corpus-session-root {
    margin-top: 1rem;
    font-size: 0.9rem;
  }

  .corpus-session-meta {
    border-radius: 0.75rem;
    border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.16));
    background: var(--vp-c-bg-soft, #f8fafc);
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
  }

  .corpus-session-meta-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .corpus-session-id {
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
    font-weight: 600;
  }

  .corpus-session-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .corpus-session-badges .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.45rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid transparent;
    background: rgba(15, 23, 42, 0.03);
  }

  .badge--challenge {
    border-color: rgba(59, 130, 246, 0.3);
    background: rgba(59, 130, 246, 0.06);
    color: #1d4ed8;
  }

  .badge--condition {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.06);
    color: #047857;
  }

  .badge--model {
    border-color: rgba(14, 165, 233, 0.3);
    background: rgba(14, 165, 233, 0.06);
    color: #0369a1;
  }

  .badge--protocol {
    border-color: rgba(244, 114, 182, 0.4);
    background: rgba(244, 114, 182, 0.1);
    color: #be185d;
  }

  .corpus-session-meta-body {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--vp-c-text-2, #64748b);
  }

  .corpus-session-meta-body time {
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

  .corpus-session-backlink a {
    font-size: 0.8rem;
  }

  .corpus-tag-histogram {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
  }

  .corpus-tag-histogram strong {
    font-weight: 600;
  }

  .corpus-tag-histogram code {
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

  .corpus-turns {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .corpus-turn {
    border-radius: 0.75rem;
    border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.16));
    background: var(--vp-c-bg-alt, #ffffff);
    padding: 0.6rem 0.9rem 0.75rem;
  }

  .corpus-turn-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.5rem;
    margin-bottom: 0.3rem;
  }

  .corpus-turn-header-left {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .corpus-turn-role {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--vp-c-text-2, #64748b);
  }

  .corpus-turn-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.05rem 0.35rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid rgba(148, 163, 184, 0.6);
    background: rgba(148, 163, 184, 0.12);
  }

  .corpus-turn--assistant .corpus-turn-badge {
    border-color: rgba(59, 130, 246, 0.6);
    background: rgba(59, 130, 246, 0.12);
    color: #1d4ed8;
  }

  .corpus-turn--user .corpus-turn-badge {
    border-color: rgba(16, 185, 129, 0.6);
    background: rgba(16, 185, 129, 0.12);
    color: #047857;
  }

  .corpus-turn-index {
    font-size: 0.75rem;
    color: var(--vp-c-text-2, #64748b);
  }

  .corpus-turn-blocks {
    margin-top: 0.25rem;
    display: grid;
    gap: 0.4rem;
  }

  .corpus-turn-block-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--vp-c-text-2, #64748b);
    margin-bottom: 0.1rem;
  }

  .corpus-turn-block pre {
    margin: 0;
    border-radius: 0.5rem;
    padding: 0.4rem 0.5rem;
    background: var(--vp-c-bg-soft, #f8fafc);
    font-size: 0.8rem;
    white-space: pre-wrap;
    word-break: break-word;
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

  .corpus-turn--assistant {
    border-left: 3px solid rgba(59, 130, 246, 0.9);
  }

  .corpus-turn--user {
    border-left: 3px solid rgba(16, 185, 129, 0.9);
  }

  @media (max-width: 768px) {
    .corpus-session-meta-body {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>

<script>
  (function () {
    if (typeof window === "undefined") return;
    const root = document.getElementById("corpus-session-root");
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const siteBase = (window.__VP_SITE_DATA__?.site?.base || "/").replace(/\/$/, "");

    if (!id) {
      root.innerHTML = "<p><em>Missing ?id=… query parameter.</em></p>";
      return;
    }

    const url = withBase("/corpus/v1.4/sessions/" + encodeURIComponent(id) + ".json");
    loadSession(url, id);

    function withBase(path) {
      if (!path) return path;
      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
      }
      const normalized = path.startsWith("/") ? path : "/" + path;
      return (siteBase || "") + normalized;
    }

    async function loadSession(url, id) {
      try {
        root.innerHTML = "<p><em>Loading session " + id + "…</em></p>";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load session: " + res.status);
        }
        const session = await res.json();
        renderSession(session);
      } catch (err) {
        console.error(err);
        root.innerHTML =
          "<p><em>Unable to load session: " +
          (err?.message || String(err)) +
          "</em></p>";
      }
    }

    function renderSession(session) {
      const turns = Array.isArray(session.turns) ? session.turns : [];
      const meta = session.meta || {};

      const tagCounts = { g: 0, q: 0, o: 0, c: 0, o_f: 0, other: 0 };
      turns.forEach((t) => {
        const tag = t?.tag;
        if (!tag) return;
        if (tagCounts.hasOwnProperty(tag)) {
          tagCounts[tag] += 1;
        } else {
          tagCounts.other += 1;
        }
      });

      const wrapper = document.createElement("div");

      const metaEl = document.createElement("section");
      metaEl.className = "corpus-session-meta";

      const headerEl = document.createElement("div");
      headerEl.className = "corpus-session-meta-header";

      const idEl = document.createElement("div");
      idEl.className = "corpus-session-id";
      idEl.textContent = session.id || "(unknown id)";
      headerEl.appendChild(idEl);

      const badgesEl = document.createElement("div");
      badgesEl.className = "corpus-session-badges";

      if (meta.challenge_type) {
        badgesEl.appendChild(makeBadge(meta.challenge_type, "badge--challenge"));
      }
      if (meta.condition) {
        badgesEl.appendChild(makeBadge(meta.condition, "badge--condition"));
      }
      if (meta.model) {
        badgesEl.appendChild(makeBadge(meta.model, "badge--model"));
      }
      if (session.protocol_version) {
        badgesEl.appendChild(
          makeBadge("protocol=" + session.protocol_version, "badge--protocol")
        );
      }

      headerEl.appendChild(badgesEl);
      metaEl.appendChild(headerEl);

      const bodyEl = document.createElement("div");
      bodyEl.className = "corpus-session-meta-body";

      const createdEl = document.createElement("div");
      if (meta.created_at) {
        const label = document.createElement("span");
        label.textContent = "Created: ";
        const time = document.createElement("time");
        time.dateTime = meta.created_at;
        time.textContent = meta.created_at;
        createdEl.appendChild(label);
        createdEl.appendChild(time);
      } else {
        createdEl.textContent = "Created: —";
      }

      const backEl = document.createElement("div");
      backEl.className = "corpus-session-backlink";
      const backLink = document.createElement("a");
      const qsParts = [];
      if (meta.challenge_type) {
        qsParts.push("challenge_type=" + encodeURIComponent(meta.challenge_type));
      }
      if (meta.condition) {
        qsParts.push("condition=" + encodeURIComponent(meta.condition));
      }
      const qs = qsParts.length ? "?" + qsParts.join("&") : "";
      backLink.href = withBase("/corpus" + qs);
      backLink.textContent = "Back to corpus browser";
      backEl.appendChild(backLink);

      bodyEl.appendChild(createdEl);
      bodyEl.appendChild(backEl);
      metaEl.appendChild(bodyEl);

      const histEl = document.createElement("div");
      histEl.className = "corpus-tag-histogram";
      const pieces = [];
      ["g", "q", "o", "c", "o_f"].forEach((tag) => {
        if (tagCounts[tag]) {
          pieces.push(tag + ": " + tagCounts[tag]);
        }
      });
      if (tagCounts.other) {
        pieces.push("other: " + tagCounts.other);
      }
      histEl.innerHTML =
        "<strong>Tags:</strong> " +
        (pieces.length ? pieces.map((p) => "<code>" + p + "</code>").join("  ") : "none");
      metaEl.appendChild(histEl);

      wrapper.appendChild(metaEl);

      const turnsContainer = document.createElement("section");
      turnsContainer.className = "corpus-turns";

      turns.forEach((turn) => {
        const card = document.createElement("article");
        const role = turn.role === "assistant" ? "assistant" : "user";
        card.className = "corpus-turn corpus-turn--" + role;

        const header = document.createElement("div");
        header.className = "corpus-turn-header";

        const left = document.createElement("div");
        left.className = "corpus-turn-header-left";

        const roleEl = document.createElement("div");
        roleEl.className = "corpus-turn-role";
        roleEl.textContent = turn.role || "unknown";

        const badgeEl = document.createElement("div");
        badgeEl.className = "corpus-turn-badge";
        badgeEl.textContent = turn.tag || "—";

        left.appendChild(roleEl);
        left.appendChild(badgeEl);

        const idxEl = document.createElement("div");
        idxEl.className = "corpus-turn-index";
        idxEl.textContent = "Turn " + (turn.turn_index ?? "?");

        header.appendChild(left);
        header.appendChild(idxEl);
        card.appendChild(header);

        const blocks = document.createElement("div");
        blocks.className = "corpus-turn-blocks";

        if (turn.raw_header) {
          blocks.appendChild(makeBlock("Header", turn.raw_header));
        }

        blocks.appendChild(makeBlock("Body", turn.body || ""));

        if (typeof turn.footer === "string" && turn.footer.trim()) {
          blocks.appendChild(makeBlock("Footer", turn.footer));
        }

        card.appendChild(blocks);
        turnsContainer.appendChild(card);
      });

      wrapper.appendChild(turnsContainer);

      root.innerHTML = "";
      root.appendChild(wrapper);
    }

    function makeBadge(text, extraClass) {
      const span = document.createElement("span");
      span.className = "badge " + (extraClass || "");
      span.textContent = text;
      return span;
    }

    function makeBlock(label, text) {
      const container = document.createElement("div");
      const lbl = document.createElement("div");
      lbl.className = "corpus-turn-block-label";
      lbl.textContent = label;
      const pre = document.createElement("pre");
      pre.textContent = text;
      container.className = "corpus-turn-block";
      container.appendChild(lbl);
      container.appendChild(pre);
      return container;
    }
  })();
</script>
