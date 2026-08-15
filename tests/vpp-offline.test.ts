import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = "plugins/viable-prompt-protocol/skills/viable-prompt-protocol/scripts/vpp.mjs";

function run(operation: string, input: unknown) {
  const result = spawnSync(process.execPath, [script, operation], {
    cwd: process.cwd(),
    input: JSON.stringify(input),
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("bundled offline CLI runs the same prepare and format operations", () => {
  const prepared = run("prepare-turn", { message: "!<g>" });
  assert.equal(prepared.next_state.tag_counts.g, 1);
  const formatted = run("format-response", {
    prepared_turn: prepared,
    body: "Offline body.",
    sources: "none",
    assumption_count: 0
  });
  assert.equal(
    formatted.message,
    "<g>\nOffline body.\n[Version=v1.5 | Tag=g_1 | Sources=none | Assumptions=0 | Cycle=1/3 | Locus=default]"
  );
});
