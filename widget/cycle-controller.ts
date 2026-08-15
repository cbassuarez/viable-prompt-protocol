import {
  App,
  PostMessageTransport,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
  type McpUiHostContext
} from "@modelcontextprotocol/ext-apps";
import {
  CONTROLLER_MODES,
  composeControllerCommand,
  isValidControllerLocus,
  visibleCyclePath,
  type ControllerCorrectness,
  type ControllerLocusMode,
  type ControllerMode,
  type ControllerPathNode,
  type ControllerSelection,
  type ControllerSeverity
} from "../src/widget-model";

type VppWidgetState = {
  protocol_version: "v1.5";
  cycle: {
    sequence: number;
    iteration: 1 | 2 | 3;
    locus: { index: number; name: string };
    path: ControllerPathNode[];
    closed: boolean;
  };
  tag_counts: Record<ControllerMode, number>;
  closed: boolean;
};

type ValidationResult = {
  violations?: Array<{ code?: string; message?: string }>;
  exchanges?: Array<{ state?: VppWidgetState }>;
  state?: VppWidgetState;
};

const root = document.querySelector<HTMLElement>("[data-vpp-controller]");
if (!root) throw new Error("VPP controller root is missing.");

const app = new App(
  {
    name: "vpp-cycle-controller",
    title: "VPP Cycle Controller",
    version: "1.1.0",
    websiteUrl: "https://viableprompt.org/"
  },
  { autoResize: true, strict: true }
);

let result: ValidationResult = {};
let state: VppWidgetState | null = null;
let expanded = false;
let connected = false;
let hostCanMessage = false;
let selection: ControllerSelection = {
  mode: "g",
  correctness: null,
  severity: null,
  locusMode: "current",
  nextLocus: "locus-2",
  skipToOutput: false,
  path: []
};

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing widget element: ${id}`);
  return element as T;
};

const cycleValue = byId<HTMLElement>("cycle-value");
const locusValue = byId<HTMLElement>("locus-value");
const pathList = byId<HTMLElement>("path-list");
const pathEmpty = byId<HTMLElement>("path-empty");
const expandButton = byId<HTMLButtonElement>("expand-path");
const newLocusInput = byId<HTMLInputElement>("new-locus-name");
const newLocusWrap = byId<HTMLElement>("new-locus-wrap");
const locusError = byId<HTMLElement>("locus-error");
const commandPreview = byId<HTMLOutputElement>("command-preview");
const continueButton = byId<HTMLButtonElement>("continue-command");
const copyButton = byId<HTMLButtonElement>("copy-command");
const skipButton = byId<HTMLButtonElement>("skip-output");
const diagnostics = byId<HTMLElement>("diagnostics");
const locusHistory = byId<HTMLElement>("locus-history");
const statusText = byId<HTMLElement>("action-status");

function applyHostContext(context?: McpUiHostContext): void {
  if (!context) return;
  if (context.theme) applyDocumentTheme(context.theme);
  if (context.styles?.variables) applyHostStyleVariables(context.styles.variables);
  if (context.styles?.css?.fonts) applyHostFonts(context.styles.css.fonts);
}

function updateSelection(patch: Partial<ControllerSelection>): void {
  selection = { ...selection, ...patch };
  renderControls();
}

function activeButton(selector: string, value: string | null): void {
  root.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
    const pressed = button.dataset.value === value;
    button.setAttribute("aria-pressed", String(pressed));
  });
}

function currentComposition() {
  return composeControllerCommand(selection);
}

function renderControls(): void {
  activeButton("[data-mode]", selection.mode);
  activeButton("[data-correctness]", selection.correctness);
  activeButton("[data-severity]", selection.severity);
  activeButton("[data-locus-mode]", selection.locusMode);
  skipButton.setAttribute("aria-pressed", String(selection.skipToOutput));
  newLocusWrap.hidden = selection.locusMode !== "new" || selection.skipToOutput;

  const locusValid = selection.locusMode !== "new" || isValidControllerLocus(selection.nextLocus);
  locusError.hidden = locusValid;
  try {
    const composed = currentComposition();
    commandPreview.value = composed.command;
    continueButton.disabled = !locusValid;
  } catch {
    commandPreview.value = "Choose a valid locus name";
    continueButton.disabled = true;
  }
  copyButton.hidden = connected && hostCanMessage;
}

function renderPath(): void {
  const path = state?.cycle.path ?? [];
  selection.path = path;
  pathList.replaceChildren();
  pathEmpty.hidden = path.length > 0;
  const visible = visibleCyclePath(path, expanded);
  for (const node of visible) {
    const item = document.createElement("span");
    item.className = "path-node";
    item.textContent = `${node.response_tag}_${node.tag_index}`;
    item.title = `!<${node.command_tag}> → <${node.response_tag}>`;
    pathList.append(item);
  }
  expandButton.hidden = path.length <= 5;
  expandButton.textContent = expanded ? "Show latest" : `Show all ${path.length}`;
  expandButton.setAttribute("aria-expanded", String(expanded));
}

function renderDiagnostics(): void {
  const violations = result.violations ?? [];
  diagnostics.replaceChildren();
  diagnostics.hidden = violations.length === 0;
  if (violations.length === 0) return;
  const heading = document.createElement("strong");
  heading.textContent = "Needs attention";
  diagnostics.append(heading);
  const list = document.createElement("ul");
  for (const violation of violations.slice(0, 3)) {
    const item = document.createElement("li");
    item.textContent = violation.message || violation.code || "Structural issue";
    list.append(item);
  }
  diagnostics.append(list);
}

function renderLocusHistory(): void {
  const loci = new Map<number, string>();
  for (const exchange of result.exchanges ?? []) {
    const locus = exchange.state?.cycle.locus;
    if (locus) loci.set(locus.index, locus.name);
  }
  if (state?.cycle.locus) loci.set(state.cycle.locus.index, state.cycle.locus.name);
  const earlier = [...loci.entries()].filter(([index]) => index !== state?.cycle.locus.index);
  locusHistory.replaceChildren();
  locusHistory.hidden = earlier.length === 0;
  if (earlier.length === 0) return;
  const label = document.createElement("span");
  label.textContent = "Earlier loci";
  locusHistory.append(label);
  for (const [, name] of earlier) {
    const item = document.createElement("code");
    item.textContent = name;
    locusHistory.append(item);
  }
}

function render(nextResult: ValidationResult): void {
  result = nextResult;
  state = nextResult.state ?? null;
  if (state) {
    cycleValue.textContent = `${state.cycle.iteration}/3`;
    locusValue.textContent = state.cycle.locus.name;
    selection.nextLocus = `locus-${state.cycle.locus.index + 1}`;
    newLocusInput.value = selection.nextLocus;
  }
  renderPath();
  renderDiagnostics();
  renderLocusHistory();
  renderControls();
}

root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    updateSelection({ mode: button.dataset.mode as ControllerMode, skipToOutput: false });
  });
});

root.querySelectorAll<HTMLButtonElement>("[data-correctness]").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.correctness as Exclude<ControllerCorrectness, null>;
    updateSelection({ correctness: selection.correctness === value ? null : value });
  });
});

root.querySelectorAll<HTMLButtonElement>("[data-severity]").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.severity as Exclude<ControllerSeverity, null>;
    updateSelection({ severity: selection.severity === value ? null : value });
  });
});

root.querySelectorAll<HTMLButtonElement>("[data-locus-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    const locusMode = button.dataset.locusMode as ControllerLocusMode;
    updateSelection({ locusMode, skipToOutput: false });
    if (locusMode === "new") newLocusInput.focus();
  });
});

newLocusInput.addEventListener("input", () => updateSelection({ nextLocus: newLocusInput.value }));
skipButton.addEventListener("click", () => updateSelection({ skipToOutput: !selection.skipToOutput }));
expandButton.addEventListener("click", () => {
  expanded = !expanded;
  renderPath();
});

copyButton.addEventListener("click", async () => {
  const command = currentComposition().command;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(command);
    } else {
      const fallback = document.createElement("textarea");
      fallback.value = command;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.append(fallback);
      fallback.select();
      if (!document.execCommand("copy")) throw new Error("Copy is unavailable.");
      fallback.remove();
    }
    statusText.textContent = "Command copied.";
  } catch {
    statusText.textContent = "Copy is unavailable. Select the command preview instead.";
  }
});

continueButton.addEventListener("click", async () => {
  const composed = currentComposition();
  statusText.textContent = "Sending command…";
  continueButton.disabled = true;
  try {
    if (!connected || !hostCanMessage) throw new Error("Messaging is unavailable.");
    await app.updateModelContext({
      content: [
        {
          type: "text",
          text: composed.next_locus
            ? `VPP controller staged ${composed.command}. Pass next_locus=${composed.next_locus} to vpp_prepare_turn and reuse the supplied state.`
            : `VPP controller staged ${composed.command}. Reuse the supplied state for vpp_prepare_turn.`
        }
      ],
      structuredContent: {
        vpp_controller: {
          command: composed.command,
          kind: composed.kind,
          ...(composed.next_locus ? { next_locus: composed.next_locus } : {}),
          state
        }
      }
    });
    const delivered = await app.sendMessage({
      role: "user",
      content: [{ type: "text", text: composed.command }]
    });
    if (delivered.isError) throw new Error("The host rejected the command.");
    statusText.textContent = "Command sent.";
  } catch (error) {
    statusText.textContent = error instanceof Error ? error.message : "Could not send the command.";
    copyButton.hidden = false;
  } finally {
    continueButton.disabled = false;
  }
});

app.ontoolresult = (params) => render((params.structuredContent ?? {}) as ValidationResult);
app.onhostcontextchanged = (params) => applyHostContext(params);

const compatibilityOutput = (window as Window & { openai?: { toolOutput?: ValidationResult } }).openai?.toolOutput;
if (compatibilityOutput) render(compatibilityOutput);
else render({});

try {
  await app.connect(new PostMessageTransport(window.parent, window.parent));
  connected = true;
  const context = app.getHostContext();
  applyHostContext(context);
  hostCanMessage = Boolean(app.getHostCapabilities()?.message && app.getHostCapabilities()?.updateModelContext);
} catch {
  connected = false;
  hostCanMessage = false;
}
renderControls();
