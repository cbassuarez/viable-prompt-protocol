import { generatedCycleControllerScript } from "./generated-widget";

export const CYCLE_CONTROLLER_URI = "ui://vpp/cycle-controller-v1.1.0.html";
export const CYCLE_CONTROLLER_MIME_TYPE = "text/html;profile=mcp-app";

export const cycleControllerHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      color-scheme: light dark;
      --bg: #fffaf6;
      --surface: #ffffff;
      --text: #17130f;
      --muted: #625a53;
      --line: #c9bdb3;
      --strong-line: #17130f;
      --orange: #b43a12;
      --orange-text: #ffffff;
      --warning: #9a6a00;
      --error: #a72b24;
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    html.dark {
      --bg: #090807;
      --surface: #15110e;
      --text: #fff9f4;
      --muted: #c8bbb0;
      --line: #5a4639;
      --strong-line: #fff9f4;
      --orange: #ff7540;
      --orange-text: #17130f;
      --warning: #e0ae32;
      --error: #ff6258;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: transparent; color: var(--text); }
    button, input { font: inherit; }
    button {
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 2px;
      background: var(--surface);
      color: var(--text);
      font-weight: 650;
      cursor: pointer;
      transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease, transform 140ms ease;
    }
    button:hover { border-color: var(--strong-line); }
    button:active { transform: translateY(1px); }
    button:focus-visible, input:focus-visible { outline: 3px solid var(--orange); outline-offset: 2px; }
    button[aria-pressed="true"] { background: var(--text); border-color: var(--text); color: var(--surface); }
    button:disabled { cursor: not-allowed; opacity: .52; }
    fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
    legend, .section-label {
      margin: 0 0 7px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 760;
      letter-spacing: .09em;
      text-transform: uppercase;
    }
    code, output { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .controller {
      display: grid;
      gap: 14px;
      width: 100%;
      max-width: 720px;
      padding: 14px;
      border: 1px solid var(--line);
      border-radius: 3px;
      background: var(--bg);
    }
    .status-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
    .metric { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 10px 12px; background: var(--surface); }
    .metric span { color: var(--muted); font-size: 11px; font-weight: 760; letter-spacing: .08em; text-transform: uppercase; }
    .metric strong { overflow: hidden; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
    .path-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .text-button { min-height: 32px; padding: 3px 7px; border-color: transparent; background: transparent; font-size: 12px; }
    .path-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .path-node { padding: 6px 8px; border: 1px solid var(--line); background: var(--surface); font: 650 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .empty { margin: 0; color: var(--muted); font-size: 13px; }
    .choice-grid { display: grid; grid-template-columns: repeat(5, minmax(44px, 1fr)); gap: 6px; }
    .choice-grid button, .pair button { padding: 8px 10px; }
    .flag-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .locus-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: end; }
    .locus-choice { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .skip { padding: 8px 12px; border-color: var(--warning); }
    .locus-input { display: grid; gap: 6px; margin-top: 8px; }
    .locus-input label { color: var(--muted); font-size: 12px; font-weight: 650; }
    .locus-input input { min-height: 44px; width: 100%; padding: 8px 10px; border: 1px solid var(--line); border-radius: 2px; background: var(--surface); color: var(--text); }
    .error { margin: 0; color: var(--error); font-size: 12px; }
    .diagnostics { padding: 10px 12px; border: 1px solid var(--error); background: var(--surface); font-size: 13px; }
    .diagnostics strong { color: var(--error); }
    .diagnostics ul { margin: 6px 0 0; padding-left: 18px; }
    .locus-history { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; color: var(--muted); font-size: 12px; }
    .locus-history code { padding: 3px 5px; border: 1px solid var(--line); color: var(--text); }
    .command-block { display: grid; gap: 7px; }
    .command-preview { display: block; min-height: 40px; padding: 10px 12px; overflow-wrap: anywhere; border: 1px solid var(--strong-line); background: var(--surface); color: var(--text); font-size: 13px; }
    .actions { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
    .primary { padding: 9px 14px; background: var(--orange); border-color: var(--orange); color: var(--orange-text); }
    .primary:hover { background: var(--text); border-color: var(--text); color: var(--surface); }
    .secondary { padding: 9px 14px; }
    .action-status { min-height: 18px; margin: -5px 0 0; color: var(--muted); font-size: 12px; }
    [hidden] { display: none !important; }
    @media (max-width: 430px) {
      .controller { padding: 11px; }
      .flag-row, .locus-row { grid-template-columns: 1fr; }
      .choice-grid { grid-template-columns: repeat(3, 1fr); }
      .skip { width: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
    }
  </style>
</head>
<body>
  <main class="controller" data-vpp-controller aria-label="VPP cycle controller">
    <div class="status-row">
      <div class="metric"><span>Cycle</span><strong id="cycle-value">1/3</strong></div>
      <div class="metric"><span>Locus</span><strong id="locus-value">default</strong></div>
    </div>

    <section aria-labelledby="path-label">
      <div class="path-head">
        <h2 class="section-label" id="path-label">Active DAG path</h2>
        <button class="text-button" id="expand-path" type="button" aria-expanded="false" hidden>Show all</button>
      </div>
      <div class="path-list" id="path-list"></div>
      <p class="empty" id="path-empty">No realized transitions in this cycle yet.</p>
    </section>

    <fieldset>
      <legend>Next mode</legend>
      <div class="choice-grid">
        <button type="button" data-mode="g" data-value="g" aria-pressed="true">G</button>
        <button type="button" data-mode="q" data-value="q" aria-pressed="false">Q</button>
        <button type="button" data-mode="o" data-value="o" aria-pressed="false">O</button>
        <button type="button" data-mode="c" data-value="c" aria-pressed="false">C</button>
        <button type="button" data-mode="o_f" data-value="o_f" aria-pressed="false">FINAL</button>
      </div>
    </fieldset>

    <div class="flag-row">
      <fieldset>
        <legend>Correctness flag</legend>
        <div class="pair">
          <button type="button" data-correctness="correct" data-value="correct" aria-pressed="false">Correct</button>
          <button type="button" data-correctness="incorrect" data-value="incorrect" aria-pressed="false">Incorrect</button>
        </div>
      </fieldset>
      <fieldset>
        <legend>Severity flag</legend>
        <div class="pair">
          <button type="button" data-severity="minor" data-value="minor" aria-pressed="false">Minor</button>
          <button type="button" data-severity="major" data-value="major" aria-pressed="false">Major</button>
        </div>
      </fieldset>
    </div>

    <section>
      <h2 class="section-label">Locus</h2>
      <div class="locus-row">
        <div class="locus-choice">
          <button type="button" data-locus-mode="current" data-value="current" aria-pressed="true">Current locus</button>
          <button type="button" data-locus-mode="new" data-value="new" aria-pressed="false">New locus</button>
        </div>
        <button class="skip" id="skip-output" type="button" aria-pressed="false">Skip to output</button>
      </div>
      <div class="locus-input" id="new-locus-wrap" hidden>
        <label for="new-locus-name">New locus name</label>
        <input id="new-locus-name" value="locus-2" maxlength="64" autocomplete="off" spellcheck="false">
        <p class="error" id="locus-error" hidden>Locus must use 1–64 letters, numbers, spaces, periods, underscores, slashes, or hyphens.</p>
      </div>
    </section>

    <div class="locus-history" id="locus-history" hidden></div>
    <aside class="diagnostics" id="diagnostics" role="alert" hidden></aside>

    <section class="command-block" aria-labelledby="command-label">
      <h2 class="section-label" id="command-label">Exact command</h2>
      <output class="command-preview" id="command-preview">!&lt;g&gt;</output>
      <div class="actions">
        <button class="primary" id="continue-command" type="button">Continue</button>
        <button class="secondary" id="copy-command" type="button" hidden>Copy</button>
      </div>
      <p class="action-status" id="action-status" aria-live="polite"></p>
    </section>
  </main>
  <script type="module">${generatedCycleControllerScript}</script>
</body>
</html>`;
