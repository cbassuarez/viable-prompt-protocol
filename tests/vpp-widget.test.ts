import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  composeControllerCommand,
  isValidControllerLocus,
  visibleCyclePath,
  type ControllerSelection
} from "../src/widget-model";
import {
  CYCLE_CONTROLLER_MIME_TYPE,
  CYCLE_CONTROLLER_URI,
  cycleControllerHtml
} from "../src/widget-resource";

const base: ControllerSelection = {
  mode: "g",
  correctness: null,
  severity: null,
  locusMode: "current",
  nextLocus: "locus-2",
  skipToOutput: false,
  path: []
};
const controllerSource = readFileSync(new URL("../widget/cycle-controller.ts", import.meta.url), "utf8");

test("controller composes ordinary, flagged, locus, skip, and accepted-output commands", () => {
  assert.deepEqual(composeControllerCommand(base), { command: "!<g>", kind: "ordinary" });
  assert.deepEqual(
    composeControllerCommand({ ...base, mode: "c", correctness: "incorrect", severity: "major" }),
    { command: "!<c> --incorrect --major", kind: "ordinary" }
  );
  assert.deepEqual(
    composeControllerCommand({ ...base, mode: "q", locusMode: "new", nextLocus: "review" }),
    { command: "!<e> --<q>", next_locus: "review", kind: "new-locus" }
  );
  assert.deepEqual(
    composeControllerCommand({ ...base, correctness: "correct", severity: "minor", skipToOutput: true }),
    { command: "!<e_o> --correct --minor", kind: "skip-output" }
  );
  assert.deepEqual(
    composeControllerCommand({
      ...base,
      mode: "o_f",
      correctness: "correct",
      severity: "major",
      path: [{ command_tag: "o", response_tag: "o", tag_index: 2, modifiers: [] }]
    }),
    { command: "!<o> --correct --major --<o_f>", kind: "accepted-output-pipeline" }
  );
});

test("controller locus validation rejects footer and markup injection", () => {
  assert.equal(isValidControllerLocus("release/review-2"), true);
  for (const value of ["", "../<script>", "x] | Cycle=3/3", "line\nbreak", "x".repeat(65)]) {
    assert.equal(isValidControllerLocus(value), false, value);
  }
  assert.throws(
    () => composeControllerCommand({ ...base, locusMode: "new", nextLocus: "bad]footer" }),
    /Locus/
  );
});

test("active path collapses to the latest five nodes and expands without mutation", () => {
  const path = Array.from({ length: 8 }, (_, index) => index + 1);
  assert.deepEqual(visibleCyclePath(path, false), [4, 5, 6, 7, 8]);
  assert.deepEqual(visibleCyclePath(path, true), path);
  assert.deepEqual(path, [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("controller resource has semantic fallbacks, accessible sizing, and no validity badge", () => {
  assert.equal(CYCLE_CONTROLLER_URI, "ui://vpp/cycle-controller-v1.1.0.html");
  assert.equal(CYCLE_CONTROLLER_MIME_TYPE, "text/html;profile=mcp-app");
  assert.match(cycleControllerHtml, /<main class="controller"/);
  assert.match(cycleControllerHtml, /<fieldset>/);
  assert.match(cycleControllerHtml, /aria-live="polite"/);
  assert.match(cycleControllerHtml, /min-height: 44px/);
  assert.match(cycleControllerHtml, /prefers-reduced-motion: reduce/);
  assert.match(cycleControllerHtml, /html\.dark/);
  assert.match(cycleControllerHtml, /Current locus/);
  assert.match(cycleControllerHtml, /New locus/);
  assert.match(cycleControllerHtml, /Skip to output/);
  assert.match(cycleControllerHtml, />Continue</);
  assert.match(cycleControllerHtml, />Copy</);
  assert.match(cycleControllerHtml, /ui\/message/);
  assert.match(cycleControllerHtml, /ui\/update-model-context/);
  assert.doesNotMatch(cycleControllerHtml, /VALID|INVALID/);
  assert.doesNotMatch(cycleControllerHtml, /linear-gradient|radial-gradient/);
});

test("correctness and severity are represented as two exclusive clearable groups", () => {
  assert.equal((cycleControllerHtml.match(/data-correctness="/g) ?? []).length, 2);
  assert.equal((cycleControllerHtml.match(/data-severity="/g) ?? []).length, 2);
  assert.equal((cycleControllerHtml.match(/data-correctness="correct"/g) ?? []).length, 1);
  assert.equal((cycleControllerHtml.match(/data-correctness="incorrect"/g) ?? []).length, 1);
  assert.equal((cycleControllerHtml.match(/data-severity="minor"/g) ?? []).length, 1);
  assert.equal((cycleControllerHtml.match(/data-severity="major"/g) ?? []).length, 1);
});

test("native keyboard controls and Continue-to-Copy fallback remain available", () => {
  assert.match(cycleControllerHtml, /button:focus-visible, input:focus-visible/);
  assert.doesNotMatch(cycleControllerHtml, /tabindex="-1"/);
  assert.match(controllerSource, /copyButton\.hidden = connected && hostCanMessage/);
  assert.match(controllerSource, /app\.sendMessage\(/);
  assert.match(controllerSource, /navigator\.clipboard/);
  assert.match(controllerSource, /document\.execCommand\("copy"\)/);
});
