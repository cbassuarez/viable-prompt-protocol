// Minimal first-line parser for VPP (accepts --q and --<q>)
const TAG  = '(g|q|o|c|o_f|e|e_o)';
const MODS = `(?:correct|incorrect|minor|major|<?${TAG}>?)`;
const LINE1 = new RegExp(`^!<${TAG}>(?:\\s+--${MODS})*\\s*$`);

export function parseFirstLine(s) {
  if (!s) return { ok: false, error: "empty" };
  const line = String(s).split(/\r?\n/, 1)[0];
  const ok = LINE1.test(line);
  if (!ok) return { ok, error: "line1-not-match", line };
  const tag = line.match(/^!<([^>]+)>/)[1];
  // Capture either ordinary modifiers OR pipeline tags with/without <>
  const modMatches = Array.from(
    line.matchAll(/--(?:(correct|incorrect|minor|major)|<?(g|q|o|c|o_f|e|e_o)>?)/g)
  );
  // Normalize: drop angle brackets on pipeline tags
  const mods = modMatches.map(m => m[1] ?? m[2]);
  return { ok, tag, mods };
}

// CLI usage: node scripts/parse-first-line.mjs "<payload>"
if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv.slice(2).join(" ");
  const res = parseFirstLine(input);
  console.log(JSON.stringify(res, null, 2));
}
