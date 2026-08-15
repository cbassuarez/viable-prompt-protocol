---
title: 'Privacy Policy'
description: 'Data practices for the Viable Prompt Protocol website, plugin, and public runtime.'
---

<!-- markdownlint-disable MD013 -->

Effective and last updated: August 15, 2026.

This policy explains the data practices for the Viable Prompt Protocol website, downloadable plugin and skill, and public runtime at `mcp.viableprompt.org`. VPP is an open-source project published by Seb Suarez.

## Data the service processes

The public runtime processes only the content supplied to the operation you choose: VPP commands, assistant responses, transparent client-carried state, or transcript turns. That content may contain personal data if you include it. The service does not require an account, request a user profile, read unrelated files, or collect contacts, payment details, or precise location data.

Cloudflare, the hosting and network provider, necessarily processes technical request information such as IP address, request headers, hostname, timing, and security signals to deliver and protect the service. The VPP website does not set first-party application cookies or use advertising trackers.

## Why the data is used

Submitted content is used only to perform the requested structural operation: prepare a turn, format a response, validate or repair an exchange, or validate a transcript. Technical request information is used to route traffic, enforce request-size and rate limits, prevent abuse, and maintain service availability.

VPP does not sell personal information, build advertising profiles, or use submitted content to train models.

## Sharing and processors

Submitted content and technical request information are processed by Cloudflare as the infrastructure provider. VPP does not disclose submitted content to data brokers or advertising networks. A host such as ChatGPT, Codex, or another agent may process the same content under that host's own terms and privacy policy before or after it calls VPP.

## Retention

The VPP application does not persist request bodies, responses, or conversation state. Application-level request-body logging and Worker observability are disabled, so VPP's application retention period for that content is zero beyond the time required to complete the request.

The service does not maintain user accounts or a server-side conversation database. Cloudflare may retain limited network, security, and abuse-prevention information under its own policies and infrastructure settings; VPP does not control those provider-level retention periods.

## Your choices and controls

Do not submit secrets or personal data that are unnecessary for structural protocol processing. You can use the bundled offline script instead of the public endpoint, stop using the service at any time, and begin a new conversation without prior state. Because VPP stores no account or conversation record, it generally has no server-side content to access, correct, export, or delete after a request finishes.

For a privacy question or request, email [contact@cbassuarez.com](mailto:contact@cbassuarez.com) or use the public [support page](/support/). Include no sensitive transcript content in a public GitHub issue.

<!-- markdownlint-restore -->
