// Minimal first-line parser for VPP
const LINE1 = /^!<(g|q|o|c|o_f|e|e_o)>(?:\s+--(?:correct|incorrect|minor|major|g|q|o|c|o_f|e|e_o))*\s*$/;

export function parseFirstLine(s) {
  if (!s) return { ok: false, error: "empty" };
  const line = String(s).split(/\r?\n/, 1)[0];
  const ok = LINE1.test(line);
  if (!ok) return { ok, error: "line1-not-match", line };
  const tag = line.match(/^!<(.*?)>/)[1];
  const mods = Array.from(line.matchAll(/--([a-z_<>]+)/g)).map(m => m[1]);
  return { ok, tag, mods };
}

// CLI usage: node scripts/parse-first-line.mjs "<payload>"
if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv.slice(2).join(" ");
  const res = parseFirstLine(input);
  console.log(JSON.stringify(res, null, 2));
}
