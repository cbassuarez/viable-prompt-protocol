import { parseFirstLine } from "./parse-first-line.mjs";
import fs from "node:fs";

function must(cond, msg) { if (!cond) throw new Error(msg); }

const clean = (s) =>
  s.split(/\r?\n/)
   .map(l => l.trim())
   // drop empty lines, comments, and code fences ```
   .filter(l => l && !l.startsWith("#") && !/^`{3,}/.test(l));

const good = clean(fs.readFileSync("tests/fixtures/good-first-lines.txt","utf8"));
const bad  = clean(fs.readFileSync("tests/fixtures/bad-first-lines.txt","utf8"));

for (const l of good) {
  const r = parseFirstLine(l);
  must(r.ok, `should pass: ${l}`);
}

for (const l of bad) {
  const r = parseFirstLine(l);
  must(!r.ok, `should fail: ${l}`);
}

console.log("VPP parser tests: OK");
