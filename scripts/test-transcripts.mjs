import { parseFirstLine } from "./parse-first-line.mjs";
import fs from "node:fs";

function must(cond, msg) { if (!cond) throw new Error(msg); }

const good = fs.readFileSync("tests/fixtures/good-first-lines.txt","utf8").trim().split("\n");
const bad  = fs.readFileSync("tests/fixtures/bad-first-lines.txt","utf8").trim().split("\n");

for (const l of good) {
  const r = parseFirstLine(l);
  must(r.ok, `should pass: ${l}`);
}

for (const l of bad) {
  const r = parseFirstLine(l);
  must(!r.ok, `should fail: ${l}`);
}

console.log("VPP parser tests: OK");
