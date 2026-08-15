import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packetPath = resolve(root, "submission/openai-public-plugin.json");
const packet = JSON.parse(await readFile(packetPath, "utf8"));
const importPath = resolve(root, "chatgpt-app-submission.json");
const submissionImport = JSON.parse(await readFile(importPath, "utf8"));
const manifest = JSON.parse(
  await readFile(resolve(root, "plugins/viable-prompt-protocol/.codex-plugin/plugin.json"), "utf8")
);
const toolNames = [
  "vpp_prepare_turn",
  "vpp_format_response",
  "vpp_validate_exchange",
  "vpp_validate_transcript"
];

assert.equal(packet.submission_type, "with_mcp");
assert.equal(packet.listing.name, manifest.interface.displayName);
assert.equal(packet.listing.category, manifest.interface.category);
assert.equal(packet.listing.short_description, manifest.interface.shortDescription);
assert.equal(packet.listing.long_description, manifest.interface.longDescription);
assert.equal(packet.listing.website_url, manifest.interface.websiteURL);
assert.equal(packet.listing.privacy_policy_url, manifest.interface.privacyPolicyURL);
assert.equal(packet.listing.terms_of_service_url, manifest.interface.termsOfServiceURL);
assert.equal(packet.publisher.display_name, manifest.interface.developerName);
assert.equal(packet.publisher.display_name, manifest.author.name);
assert.equal(packet.publisher.contact_email, manifest.author.email);
assert.equal(packet.mcp.url, "https://mcp.viableprompt.org/mcp");
assert.equal(packet.mcp.url_type, "universal");
assert.equal(packet.mcp.authentication, "none");
assert.equal(packet.mcp.custom_ui, true);
assert.equal(packet.skill.version, manifest.version);
assert.match(packet.mcp.content_security_policy, /no connect or resource domains/i);
assert.deepEqual(packet.starter_prompts, manifest.interface.defaultPrompt);
assert.equal(packet.positive_test_cases.length, 5);
assert.equal(packet.negative_test_cases.length, 3);
assert.deepEqual(packet.expected_annotations, {
  readOnlyHint: true,
  openWorldHint: false,
  destructiveHint: false
});

assert.equal(
  submissionImport.$schema,
  "https://developers.openai.com/plugins/schemas/chatgpt-app-submission.v1.json"
);
assert.equal(submissionImport.schema_version, 1);
assert.equal(submissionImport.custom_ui, true);
assert.equal(submissionImport.app_info.display_name, packet.listing.name);
assert.equal(submissionImport.app_info.category, packet.listing.category.toUpperCase());
assert.ok(submissionImport.app_info.subtitle.length <= 30);
assert.deepEqual(Object.keys(submissionImport.tools), toolNames);
assert.equal(submissionImport.test_cases.length, 5);
assert.equal(submissionImport.negative_test_cases.length, 3);

for (const name of toolNames) {
  const tool = submissionImport.tools[name];
  assert.deepEqual(tool.annotations, packet.expected_annotations);
  assert.ok(tool.justifications.read_only_justification);
  assert.ok(tool.justifications.open_world_justification);
  assert.ok(tool.justifications.destructive_justification);
}

for (const testCase of submissionImport.test_cases) {
  assert.ok(testCase.description && testCase.user_prompt && testCase.expected_output);
  const triggeredTools = testCase.tools_triggered.split(",").map((name) => name.trim());
  assert.ok(triggeredTools.length > 0);
  for (const name of triggeredTools) assert.ok(toolNames.includes(name), `Unknown tool in positive test: ${name}`);
}
for (const testCase of submissionImport.negative_test_cases) {
  assert.ok(testCase.description && testCase.user_prompt && testCase.expected_output);
  assert.equal(testCase.tools_triggered, null);
}

for (const [name, justification] of Object.entries(packet.tool_annotation_justifications)) {
  assert.match(name, /^vpp_(prepare_turn|format_response|validate_exchange|validate_transcript)$/);
  assert.ok(justification.length >= 80, `${name} annotation justification is too short`);
}
assert.equal(Object.keys(packet.tool_annotation_justifications).length, 4);

for (const url of [
  packet.listing.website_url,
  packet.listing.support_url,
  packet.listing.privacy_policy_url,
  packet.listing.terms_of_service_url,
  packet.mcp.url,
  packet.mcp.domain_challenge_url
]) {
  assert.equal(new URL(url).protocol, "https:");
}

for (const testCase of packet.positive_test_cases) {
  assert.ok(testCase.user_prompt && testCase.expected_behavior && testCase.expected_result_shape && testCase.fixture_data);
}
for (const testCase of packet.negative_test_cases) {
  assert.ok(testCase.user_prompt && testCase.expected_behavior && testCase.why_not);
}

await Promise.all([
  access(resolve(root, packet.listing.logo_path)),
  access(resolve(root, packet.skill.bundle_path)),
  access(resolve(root, `${packet.skill.bundle_path}.sha256.txt`))
]);

console.log("OpenAI public plugin submission packet and portal import are structurally valid.");
