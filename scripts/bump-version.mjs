#!/usr/bin/env node
/**
 * VPP bump-version script.
 * Usage:
 *   node scripts/bump-version.mjs [major|minor|patch|vX.Y[.Z]]
 *
 * - Updates vpp.json "version" and "latest"
 * - Copies docs/spec/<new>/ to docs/latest/
 * - Updates README badge links if necessary
 */
import fs from "node:fs";
import path from "node:path";

const manifestPath = "vpp.json";
const docsRoot = "docs/spec";

function readJSON(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function writeJSON(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n"); }

function semverBump(v, kind) {
  const m = v.replace(/^v/,"").split(".").map(n=>parseInt(n,10));
  while (m.length < 3) m.push(0);
  let [maj, min, pat] = m;
  if (/^\d+\.\d+(\.\d+)?$/.test(kind)) return "v" + kind;
  if (kind === "major") maj++, min=0, pat=0;
  else if (kind === "minor") min++, pat=0;
  else pat++;
  return `v${maj}.${min}${pat? "."+pat : ""}`;
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  const mf = readJSON(manifestPath);
  const current = "v" + mf.version;
  const arg = process.argv[2] || "patch";
  const next = arg.startsWith("v") ? arg : semverBump(mf.version, arg);

  // Create new version folder by copying the previous
  const prevDir = path.join(docsRoot, current);
  const nextDir = path.join(docsRoot, next);
  if (!fs.existsSync(prevDir)) {
    console.error(`Missing ${prevDir}. Ensure ${current} exists before bumping.`);
    process.exit(1);
  }
  if (fs.existsSync(nextDir)) {
    console.error(`${nextDir} already exists.`);
    process.exit(1);
  }
  copyDir(prevDir, nextDir);

  // Update latest/
  const latestDir = path.join("docs/latest");
  fs.rmSync(latestDir, { recursive: true, force: true });
  copyDir(nextDir, latestDir);

  // Update manifest
  mf.version = next.replace(/^v/, "");
  mf.latest = next;
  writeJSON(manifestPath, mf);

  console.log(`Bumped: ${current} → ${next}`);
}
main();
