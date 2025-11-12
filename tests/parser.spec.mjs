import fs from "node:fs";
import { parseFirstLine } from "../scripts/parse-first-line.mjs";

function must(cond, msg) { if (!cond) throw new Error(msg); }

const valid = fs.readFileSync("tests/fixtures/transcripts/valid-01.txt","utf8");
const invalid = fs.readFileSync("tests/fixtures/transcripts/invalid-01.txt","utf8");

const r1 = parseFirstLine(valid);
must(r1.ok, "valid-01 should pass");
must(r1.tag === "g", "valid-01 tag should be g");

const r2 = parseFirstLine(invalid);
must(!r2.ok, "invalid-01 should fail");

console.log("parser.spec.mjs: OK");
