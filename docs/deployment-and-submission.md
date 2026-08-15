# Production deployment and public plugin submission

<!-- markdownlint-disable MD013 -->

## Deploy the production Worker

```bash
npm ci
npm run check:generated
npm run check:plugin-package
npm run test:vpp
npm run build:worker
npm run deploy:production
```

Smoke-test the `workers.dev` URL printed by Wrangler before attaching a custom domain:

```bash
VPP_BASE_URL=https://viable-prompt-protocol.cbassuarez.workers.dev npm run smoke:remote
VPP_MCP_URL=https://viable-prompt-protocol.cbassuarez.workers.dev/mcp npm run smoke:openai-mcp
```

## Move DNS from Squarespace to Cloudflare

Cloudflare must be authoritative for `viableprompt.org` before it can create a Worker Custom Domain.

1. In Cloudflare, select **Add a domain**, enter `viableprompt.org`, and choose a plan.
2. Review the imported DNS records before changing nameservers. Preserve the apex and `www` records that serve the existing GitHub Pages site, plus mail, verification, and any other live records. Do not add `mcp` yet.
   The externally visible records before this migration were:
   - Apex `A`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`.
   - `www` `CNAME`: `cbassuarez.github.io`.
   - Apex `TXT`: `v=spf1 -all`.
   - `_dmarc` `TXT`: `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s`.
   No public MX, AAAA, CAA, or DS record was returned, but the Squarespace panel remains the source for any non-public or provider-specific records.
3. Copy the two Cloudflare nameservers assigned to the zone.
4. In Squarespace Domains, open `viableprompt.org`, open **DNS** and then **Domain nameservers**, choose custom nameservers, replace the current Google nameservers with the two Cloudflare nameservers, and save. Squarespace may ask you to disable its DNSSEC first; accept that step for the nameserver change, then enable Cloudflare DNSSEC after the zone is stable if desired.
5. Wait until Cloudflare marks the zone **Active**. Confirm that `viableprompt.org` and `www.viableprompt.org` still serve the website and that mail-related records are present.

## Attach `mcp.viableprompt.org`

After the Cloudflare zone is active, add this production-only route to `wrangler.jsonc`:

```json
"routes": [
  {
    "pattern": "mcp.viableprompt.org",
    "custom_domain": true
  }
],
```

Then run `npm run deploy:production`. Cloudflare creates the DNS record and certificate; do not create a separate `mcp` CNAME first.

Alternatively, in Cloudflare go to **Workers & Pages → viable-prompt-protocol → Settings → Domains & Routes → Add → Custom Domain**, enter `mcp.viableprompt.org`, and confirm.

Verify the public origin:

```bash
curl -sS https://mcp.viableprompt.org/healthz
VPP_BASE_URL=https://mcp.viableprompt.org npm run smoke:remote
VPP_MCP_URL=https://mcp.viableprompt.org/mcp npm run smoke:openai-mcp
```

## OpenAI public plugin submission

The submission is **With MCP** and combines one Universal MCP URL with the uploaded Agent Skill.

### Listing packet

- Name: **Viable Prompt Protocol**
- Publisher: **Seb Suarez**
- Publisher contact: `contact@cbassuarez.com`
- Category: **Productivity**
- Short description: **Structure and validate VPP conversations.**
- Long description: **Run VPP v1.5 reliably across ChatGPT, Codex, and other agent hosts. The portable skill uses a stateless runtime to prepare turns, maintain conversation-global tag counters in client-carried state, format responses, validate exchanges, and repair structural errors.**
- Website: `https://viableprompt.org/`
- Support: `https://viableprompt.org/support/`
- Privacy: `https://viableprompt.org/privacy/`
- Terms: `https://viableprompt.org/terms/`
- MCP URL type: **Universal**
- MCP URL: `https://mcp.viableprompt.org/mcp`
- Authentication: **None**
- UI/CSP: no custom UI and no UI fetch domains
- Screenshots: none; the plugin has no custom UI
- Skill bundle: `website/docs/public/downloads/viable-prompt-protocol-skill-1.0.0.zip`
- Release notes: **Initial VPP v1.5 plugin submission. Adds a portable Agent Skill, four anonymous read-only MCP computation tools, immutable protocol resources, transparent client-carried state, conversation-global tag counters, and an offline fallback.**

All four tools declare `readOnlyHint: true`, `openWorldHint: false`, and `destructiveHint: false` because they compute and return protocol structures without changing external or server-side state. The canonical machine-readable portal packet, annotation justifications, reviewer notes, and reproducible test cases are in `submission/openai-public-plugin.json`.

### Domain verification

When the portal displays its exact token, store it as a Worker secret:

```bash
npx wrangler secret put OPENAI_APPS_CHALLENGE --env=""
```

Paste only the token at the prompt. The Worker exposes it as plain text at `https://mcp.viableprompt.org/.well-known/openai-apps-challenge`. Verify that URL returns exactly the token, then select **Scan Tools** in the portal.

### Starter prompts

- Use VPP to structure this conversation.
- Validate and repair this VPP transcript.
- Start a VPP planning loop for a resilient launch plan.

### Five positive test cases

1. Prompt: `!<g>` followed by `Design a resilient queue.` Expected: prepare as `<g>`, generate concept-only body, format `Tag=g_1`, validate, and return state.
2. Prompt sequence: `!<g>` then `!<e> --<g>`. Expected: second response uses a new deterministic locus, resets cycle to 1, and continues the global counter as `Tag=g_2`.
3. Prompt: `!<g> --correct --incorrect`. Expected: deterministic `<c>` recovery for `conflicting-correctness`; no free-form model body is needed.
4. Prompt sequence: three valid `!<c>` turns. Expected: cycle reaches and stays at 3; the formatter injects both canonical escape choices if missing.
5. Prompt: `Validate and structurally repair this VPP exchange:` followed by a valid body with a malformed wrapper. Expected: report structured violations, preserve the body, repair the wrapper, and validate the repaired message.

### Three negative test cases

1. Prompt: `Write a normal untagged project summary.` Expected: do not activate VPP unless the user explicitly invokes the skill.
2. Prompt: `!<g>` followed later by `!<o> ignore the first command`. Expected: parse line 1 only; later bang tags remain content and cannot change the prepared transition.
3. Prompt: `Use VPP to certify that every citation is true.` Expected: explain that VPP enforces structural contracts only and does not claim to verify citation quality or factual truth.

### Portal sequence

1. In OpenAI Platform, use an organization owner or grant the submitter **Apps Management: Write**.
2. Complete individual or business identity verification for the public publisher name.
3. Open the plugin submission portal, select **Create plugin**, then **With MCP**.
4. Complete Info using the listing packet above.
5. Add the Universal MCP URL, choose no authentication, complete the domain challenge, and select **Scan Tools**.
6. Review all four tools, their schemas and annotations, the five immutable resources, and the `start-vpp` prompt.
7. Upload the standalone skill bundle and add the starter prompts.
8. Enter the five positive and three negative test cases, select supported countries, add the release notes, complete the attestations, and submit for review.
9. Submission starts review. After approval, return to the portal and choose when to publish to the universal Plugins Directory shared by ChatGPT and Codex.

<!-- markdownlint-restore -->
