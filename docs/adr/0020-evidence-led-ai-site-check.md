# ADR-0020: Evidence-led AI site check and request inspector

## Status

Accepted implementation direction, November 5, 2026 Pacific / November 6 UTC. Delivery, activation and measured acceptance remain separate in the [worklist](../../packages/blog/drafts/research/ai-site-audit/00-worklist.md). This decision implements the owner's requested tool and article within the [analytics ambition](0019-agentic-engineering-publication-and-analytics-ambition.md).

## Context

The owner requested a more informative article and tool inspired by [Laxman Kafle's post](https://x.com/laxmankafle1995/status/2118569422554365981), with a possible five-to-ten-use free daily API, DDD boundaries and an ADR. The complete shaping message is preserved in the article's [prompt record](../../packages/blog/prompts/ai-site-check-evidence.prompts.md).

Official X oEmbed and the linked [Exepal checker](https://exepal.com/check) identify a site audit: robots product rules, discovery files, rendering-related checks, metadata and synthetic User-Agent comparisons. Inspecting public presentation establishes its advertised workflow; it does not reproduce its hidden implementation or validate its score.

Our [provider investigation](../../packages/blog/posts/041-ai-fetcher-browser-crawler-headers.md) demonstrates why evidence boundaries matter. Eleven controlled Grok requests were stored Browser without Grok declarations; Dot browser and curl requests had verified ChatGPT publisher signatures; Gemini declared only Google. Client text, network, signature coverage and controlled attribution answer different questions. Copying a provider User-Agent is useful for response comparison, not provider authentication.

## Decision

Provide `/ai-check`, JSON `POST /api/ai-check` accepting `{ "url": "https://public.example/path" }`, and complementary `GET /api/request-check` for the current received request. Use ten accepted checks per trusted public edge source address per UTC day, shared between endpoints. A native rate limiter also bounds bursts. Address sharing and address changes limit the interpretation of this allowance; it is not an account or person quota.

### Bounded contexts and dependencies

| Owner | Responsibility |
| --- | --- |
| `packages/site-audit` | Public target policy, robots/HTML/discovery parsers, report contracts, findings and bounded audit orchestration |
| Site-audit Cloudflare adapter | DNS/transport integration, validated redirects, cancellation, request/byte/time limits and public fetch |
| `packages/analytics` | Current-request declarations, request shape, client form, network and available verification evidence |
| `packages/blog` | HTTP routing, input decoding, shared quota persistence, page rendering and native component enhancement |

Keep parsing and findings independently testable through explicit contracts and injected fetch/clock dependencies. Do not let a parsed site's content select privileged bindings or mutate quota policy. Reuse the committed analytics baseline; this project must not absorb unrelated concurrent detector or newsletter changes. Avoid a new DDD framework, general-purpose crawler or browser dependency.

### Assessment semantics

- Evaluate robots policy for the requested page path and named product, exposing matched groups/rules and retrieval state. Apply tested RFC 9309 matching semantics without claiming every vendor's complete behavior or standards certification.
- Report response status, media type, redirects, bytes, timing and unavailable outcomes. Preserve partial results and limit exhaustion.
- Inspect initial HTML: title, description, canonical, headings/text/links, robots directives, alternate links and structured-data observations. Do not claim JavaScript rendering, complete schema validation or rich-result eligibility.
- Inspect a bounded set of public discovery resources and negotiated Markdown. Optional `llms.txt`, citation links and agent/discovery declarations are informational. Their presence is not a ranking or citation guarantee, and their absence carries no invented readiness penalty.
- Label every changed-User-Agent request as a synthetic probe from the checker. Differences concern those responses from this infrastructure. Do not call them real provider fetches or a proof of provider access.
- Keep current-request evidence independent from remote site observations. Header claims, network context and available native/local verification remain distinct, with missing or unassessed inputs explicit. Do not identify people or infer intent from a browser shape.
- Publish findings with evidence and an actionable next check rather than a universal numerical AI-readiness score.

### Egress boundary

Accept only public HTTPS DNS hostnames on the standard port, without credentials, query or fragment. Reject IP literals and special-use names. Fetch fixed audit resources and bounded comparison probes; do not execute scripts, follow arbitrary discovered links, forward caller credentials or serve raw upstream bodies as a proxy.

Validate each manual redirect, prohibit downgrades, cap hops and cancel discarded bodies. Construct outgoing headers afresh. Enforce stream-byte limits, per-resource deadlines and an overall request budget; do not trust Content-Length alone.

Enable Cloudflare's `global_fetch_strictly_public` compatibility flag. Its [documented behavior](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#global-fetch-strictly-public) prevents legacy same-zone origin bypass. The [workerd public-network contract](https://github.com/cloudflare/workerd/blob/main/src/workerd/server/workerd.capnp) filters resolved destinations, and the [upstream explanation](https://github.com/cloudflare/workerd/discussions/1523) describes SSRF protection under the default public network. Use only public global fetch, not private-network bindings. A DNS preflight does not pin the subsequent fetch destination and cannot independently prove rebinding prevention; connection-time public egress remains a runtime dependency.

[`resolveOverride`](https://developers.cloudflare.com/workers/runtime-apis/request/) is zone-restricted and cannot pin arbitrary third-party targets. [TCP sockets](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/) block Cloudflare IPs, making a custom socket HTTP transport unsuitable for broad site audits. A portable implementation on another runtime requires its own enforceable connection-time destination policy.

### Quota and storage

Consume the daily allowance atomically before external work. Use a purpose-specific HMAC of trusted edge address and UTC date; retain counter/date data without audited URL, raw address or submitted headers in the quota table. Enforce concurrency at the store rather than trusting per-isolate memory. Reject missing configuration, unusable edge metadata and storage failures explicitly. Return rate-limit information and a clear 429 when exhausted. Define and execute expiry cleanup.

This is the quota store's scope. It does not imply that platform request logs or existing site analytics see no request metadata. Public documentation must distinguish them.

## Alternatives and costs

An all-in-one score is easy to compare but would combine unrelated stages without a calibrated denominator. A named-bot-only checker misses the demonstrated browser paths. Running real providers for every check would add account access, cost, changing product behavior and answer-quality evaluation. A full browser would answer a rendering question but expands the dependency and security surface. These may be separate future capabilities justified by actual use; they are not silently simulated here.

The selected service adds bounded outbound traffic and quota writes to the existing Worker/D1 deployment. A successful own-site run does not establish broad compatibility, operator adoption, detector accuracy or million-site readiness. DNS, CDN policy, network location and changing source documents can change a later report. Version report semantics and retain timestamps.

## Acceptance

Require tests for robots precedence/encoding/groups and retrieval states; malformed HTML and metadata; target/redirect rejection and payload limits; synthetic-probe provenance; partial/time-budget outcomes; quota concurrency/midnight/error behavior; absence of sensitive quota fields; current-request evidence boundaries; HTML availability without JavaScript and working native enhancement. Validate frontmatter, generated HTML and machine-readable article representations.

Commit/push, activated deployment, served API behavior and actual operator use each need their own evidence. The [worklist](../../packages/blog/drafts/research/ai-site-audit/00-worklist.md) owns their evolving state; this ADR is not an acceptance receipt.
