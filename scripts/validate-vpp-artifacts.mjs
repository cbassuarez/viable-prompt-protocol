import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageMetadata = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const pluginRoot = resolve(root, "plugins/viable-prompt-protocol");
const skillRoot = resolve(pluginRoot, "skills/viable-prompt-protocol");
const skillText = await readFile(resolve(skillRoot, "SKILL.md"), "utf8");
const frontmatter = skillText.match(/^---\n([\s\S]*?)\n---\n/);
assert.ok(frontmatter, "SKILL.md must begin with YAML frontmatter");
const lines = frontmatter[1].split("\n");
assert.equal(lines.length, 2, "SKILL.md frontmatter must contain only name and description");
assert.equal(lines[0], "name: viable-prompt-protocol");
const description = lines[1]?.replace(/^description:\s*/, "") ?? "";
assert.ok(description.length >= 20 && description.length <= 1024, "skill description must be 20-1024 characters");
assert.doesNotMatch(skillText, /\bTODO\b/);

for (const relative of [
  "references/protocol.md",
  "references/failure-codes.md",
  "references/transcripts.md",
  "references/adoption.md",
  "scripts/vpp.mjs",
  "agents/openai.yaml"
]) {
  await access(resolve(skillRoot, relative));
}

const openAiYaml = await readFile(resolve(skillRoot, "agents/openai.yaml"), "utf8");
assert.match(openAiYaml, /type: "mcp"/);
assert.match(openAiYaml, /url: "https:\/\/mcp\.viableprompt\.org\/mcp"/);
assert.match(openAiYaml, /allow_implicit_invocation: true/);

const manifest = JSON.parse(await readFile(resolve(pluginRoot, ".codex-plugin/plugin.json"), "utf8"));
assert.equal(manifest.name, "viable-prompt-protocol");
assert.equal(manifest.version, packageMetadata.version);
assert.equal(manifest.skills, "./skills/");
assert.equal(manifest.mcpServers, "./.mcp.json");
assert.equal(manifest.author.name, "Seb Suarez");
assert.equal(manifest.author.email, "contact@cbassuarez.com");
assert.equal(manifest.interface.developerName, "Seb Suarez");
assert.deepEqual(manifest.interface.capabilities, ["Interactive", "Read"]);
assert.equal(manifest.interface.websiteURL, "https://viableprompt.org/");
assert.equal(manifest.interface.privacyPolicyURL, "https://viableprompt.org/privacy/");
assert.equal(manifest.interface.termsOfServiceURL, "https://viableprompt.org/terms/");
assert.ok(Array.isArray(manifest.interface.defaultPrompt));
assert.ok(manifest.interface.defaultPrompt.length >= 1 && manifest.interface.defaultPrompt.length <= 3);

const mcp = JSON.parse(await readFile(resolve(pluginRoot, ".mcp.json"), "utf8"));
assert.deepEqual(mcp.mcpServers["viable-prompt-protocol"], {
  type: "http",
  url: "https://mcp.viableprompt.org/mcp"
});
await access(resolve(pluginRoot, "assets/icon.png"));

const marketplace = JSON.parse(await readFile(resolve(root, ".agents/plugins/marketplace.json"), "utf8"));
assert.equal(marketplace.name, "viable-prompt-protocol");
assert.deepEqual(marketplace.plugins[0], {
  name: "viable-prompt-protocol",
  source: { source: "local", path: "./plugins/viable-prompt-protocol" },
  policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
  category: "Productivity"
});

for (const archive of [
  `viable-prompt-protocol-plugin-${packageMetadata.version}.zip`,
  `viable-prompt-protocol-skill-${packageMetadata.version}.zip`
]) {
  await access(resolve(root, "website/docs/public/downloads", archive));
  await access(resolve(root, "website/docs/public/downloads", `${archive}.sha256.txt`));
}

console.log("VPP skill and plugin artifacts are structurally valid.");
