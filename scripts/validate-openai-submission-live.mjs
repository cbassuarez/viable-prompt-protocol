import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const submission = JSON.parse(await readFile(resolve(root, "chatgpt-app-submission.json"), "utf8"));
const schemaUrl = new URL(submission.$schema);
assert.equal(schemaUrl.protocol, "https:");
assert.equal(schemaUrl.hostname, "developers.openai.com");

const response = await fetch(schemaUrl, { redirect: "follow" });
assert.equal(response.status, 200, `Could not fetch live OpenAI schema: ${response.status}`);
const schema = await response.json();
assert.equal(schema.$id, submission.$schema, "The live OpenAI schema ID and submission $schema must match.");

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(schema);
assert.equal(validate(submission), true, ajv.errorsText(validate.errors, { separator: "\n" }));

console.log(`chatgpt-app-submission.json conforms to the live schema at ${submission.$schema}.`);
