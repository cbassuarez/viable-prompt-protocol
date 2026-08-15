import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = resolve(root, "plugins/viable-prompt-protocol");
const manifest = JSON.parse(await readFile(resolve(pluginRoot, ".codex-plugin/plugin.json"), "utf8"));
const downloadsRoot = resolve(root, "website/docs/public/downloads");
const check = process.argv.includes("--check");

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else if (entry.isFile() && entry.name !== ".DS_Store") files.push(path);
  }
  return files.sort((left, right) => left.localeCompare(right));
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function localHeader(name, compressed, original, crc) {
  const nameBuffer = Buffer.from(name, "utf8");
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(33, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(compressed.length, 18);
  header.writeUInt32LE(original.length, 22);
  header.writeUInt16LE(nameBuffer.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, nameBuffer]);
}

function centralHeader(name, compressed, original, crc, offset) {
  const nameBuffer = Buffer.from(name, "utf8");
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(0x0314, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(0, 12);
  header.writeUInt16LE(33, 14);
  header.writeUInt32LE(crc, 16);
  header.writeUInt32LE(compressed.length, 20);
  header.writeUInt32LE(original.length, 24);
  header.writeUInt16LE(nameBuffer.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE((0o100644 << 16) >>> 0, 38);
  header.writeUInt32LE(offset, 42);
  return Buffer.concat([header, nameBuffer]);
}

async function buildArchive(sourceRoot, prefix) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const files = await listFiles(sourceRoot);
  for (const path of files) {
    const info = await stat(path);
    if (info.size > 0xffffffff) throw new Error(`Plugin file is too large for ZIP32: ${path}`);
    const original = await readFile(path);
    const compressed = original;
    const name = posix.join(prefix, relative(sourceRoot, path).split("\\").join("/"));
    const crc = crc32(original);
    const local = localHeader(name, compressed, original, crc);
    localParts.push(local, compressed);
    centralParts.push(centralHeader(name, compressed, original, crc, offset));
    offset += local.length + compressed.length;
  }
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, central, end]);
}

const artifacts = [
  {
    name: `viable-prompt-protocol-plugin-${manifest.version}.zip`,
    sourceRoot: pluginRoot,
    prefix: "viable-prompt-protocol"
  },
  {
    name: `viable-prompt-protocol-skill-${manifest.version}.zip`,
    sourceRoot: resolve(pluginRoot, "skills/viable-prompt-protocol"),
    prefix: "viable-prompt-protocol"
  }
];

if (check) {
  for (const artifact of artifacts) {
    const archive = await buildArchive(artifact.sourceRoot, artifact.prefix);
    const checksum = createHash("sha256").update(archive).digest("hex");
    const checksumText = `${checksum}  ${artifact.name}\n`;
    const output = resolve(downloadsRoot, artifact.name);
    try {
      const [existing, existingChecksum] = await Promise.all([readFile(output), readFile(`${output}.sha256.txt`, "utf8")]);
      if (!existing.equals(archive) || existingChecksum !== checksumText) throw new Error("stale");
      console.log(`Package is current: ${artifact.name}`);
    } catch {
      console.error(`Package is missing or stale: ${artifact.name}. Run npm run package:plugin.`);
      process.exitCode = 1;
    }
  }
} else {
  await mkdir(downloadsRoot, { recursive: true });
  for (const artifact of artifacts) {
    const archive = await buildArchive(artifact.sourceRoot, artifact.prefix);
    const checksum = createHash("sha256").update(archive).digest("hex");
    const output = resolve(downloadsRoot, artifact.name);
    await Promise.all([
      writeFile(output, archive),
      writeFile(`${output}.sha256.txt`, `${checksum}  ${artifact.name}\n`, "utf8")
    ]);
    console.log(`Packaged ${artifact.name} (${archive.length} bytes, sha256 ${checksum}).`);
  }
}
