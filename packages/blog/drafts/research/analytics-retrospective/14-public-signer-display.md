# Keep signing origins private without losing signer counts

October 26, 2026. Continuation of [the EU/US collection review](13-eu-us-collection-boundaries.md) and TASK-0119. Source implementation and local acceptance; production activation is recorded separately below.

## Finding and repair

The current report emitted arbitrary stored `signature_agent` origins through `bySigner.signatureAgent`. The same value also reached `byKind.reason` for the signed-agent fallback. Rendering a value as text prevents a clickable promotion but does not make a personal signing domain non-personal or approved for publication. This review establishes an output path; it does not establish that an actual reader's personal domain was published.

Keep the original origin and reason in private D1. Public reports now map exact reviewed origins to Exa, Ahrefs and DuckDuckGo, with Other for everything else. Both channels apply the mapping **before SQL aggregation**. This matters for daily clients: two unreviewed origins used by one daily client must produce two events and one daily client in the combined Other reason, not a sum of two already-aggregated client counts.

This is a public-display policy. It neither adds a trusted verifier directory nor changes an observed signature outcome. Other means not publicly named, not failed verification, maliciousness or unknown purpose resolved. Service names do not recover ExaUser versus ExaSearchBot from old signer-only rows. Declared client roles remain independent. No rows are rewritten or deleted, and expanded request diagnostics remain disabled.

## Primary-source review

| Reviewed origin / public name | Basis and boundary |
|---|---|
| `https://crawler.exa.ai` / Exa | [Official crawler page](https://crawler.exa.ai/) links its signing directory and distinguishes search crawling from [ExaUser](https://crawler.exa.ai/exauser). Both use this directory; the name is not a role or human-trigger claim. |
| `https://ahrefs.com` / Ahrefs | [Official bot documentation](https://ahrefs.com/robot) identifies the service and its crawling/auditing functions. Its public well-known directory was retrieved directly; that page's IP/DNS guidance is not a claim that this Worker performs those checks. |
| `https://assistbot.duckduckgo.com` / DuckDuckGo | [Official DuckAssistBot documentation](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot) establishes the product relationship. [The September probe](../../../posts/023-which-ai-fetchers-send-which-headers.md) recorded this signing origin and deliberate requests. Its public well-known directory is available now; current key availability does not reverify the old requests. |

[Directory receipt](public-signer-directories.json): all three exact HTTPS well-known endpoints returned 200 without redirects on this check. The JSON contained two Ed25519 public keys for Exa, two for Ahrefs and one for DuckDuckGo. The receipt records time, content type, byte size and SHA-256, without copying key bytes into the article. The web reader could not render these content types, so ordinary direct HTTPS reads supplied the primary endpoint evidence. No private account credentials or production reader rows were accessed for that research.

[HTTP Message Signatures, RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) defines verification of covered components; it is not a publication-approval catalogue. [Commission principles](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en) and [California's linkability definition](https://privacy.ca.gov/what-is-personal-information/) support assessing the disclosure boundary. Neither source mandates this exact catalogue or certifies the service as compliant. The existing indefinite retention and expanded-capture lawful-basis/disclosure questions remain open.

## Source cross-reference

| Component | Implemented boundary |
|---|---|
| [signers.ts](../../../../analytics/src/signers.ts) | Exact origin-to-display-name approvals; no hostname suffix matching or changes to verification trust. |
| [stats.ts](../../../../analytics/src/stats.ts) | Map both signer and signed-agent reason fields before grouping; preserve distinct daily-client counting. Decoder rejects unexpected signer names in either channel. |
| [contracts.ts](../../../../analytics/src/contracts.ts) | The existing `signatureAgent` response field now carries a closed display-name type, not an arbitrary URI. |
| [Stats UI](../../../src/pages/stats.ts) and [client labels](../../../src/client/stats.ts) | Reviewed names and stored verification outcomes, with an explicit Other explanation. Text remains non-linked. |
| [Report cache](../../../src/worker/stats-cache.ts) | Version 2026-10-26.3 prevents an earlier raw-origin response being reused under the new code. |
| [ADR-0016.8 amendment](../../../../../docs/adr/0016.8-declared-client-roles-and-signer-evidence.md#public-display-boundary--october-26-2026-continuation) | Public naming is separate from key verification and declared purpose. |

## Local acceptance

Analytics tests pass **83/83**; site tests pass **106/106**, and workspace types pass. The new cases cover both disclosure channels, shared daily clients across different private origins, exact-origin lookalikes/schemes/ports/subdomains, unverified outcomes, absent stored origin, preserved declared roles/history, and fail-closed decoding. Existing selection-boundary tests still cover owner, referral, time, path, traffic, agent and kind filters.

[Native local-D1 receipt](public-signer-local.json) and [reproducer](check-public-signers-local.mjs) execute the actual report on ten synthetic rows. Six included events become Exa 2, Other 2, Ahrefs 1 and DuckDuckGo 1; Other has one distinct daily client. Owner marks, ingestion owner flags, excluded referrals and future rows stay excluded. Fixed/all-time and combined filters pass, and every original observation remains unchanged. No organic vendor request is reverified by these fixtures.

The harness also prepares the actual seven-day signed-agent report for a later metered production SELECT, literalizes and executes it in native D1, and records its byte size/hash privately. The declared production read ceiling is 50,000, followed by a stop if exceeded. Native fixture work is not production billing. The first test run had one wrong expected error message; the initial native harness omitted its required owner-mark date and its first edit had a quoting error. Those fixture errors were corrected, and passing logs are separate from the retained failed runs.

## Delivery and remaining work

Source push, Worker activation, production cost, response inspection, cache reuse and served article acceptance remain separate from the local checks above. The article's existing privacy paragraph gains one sentence describing this display boundary; its length remains within the requested five-to-six-minute target. The 22 human shaping prompts remain unchanged; automatic goal-control messages are not human prompts.

The older `check-classification-local-d1.mjs` receipt remains frozen for its original raw-origin response at the earlier repair commit. Run it against that historical source to reproduce that response; use the new reproducer for the current public-name contract. Do not edit old evidence into a claim that this display boundary existed earlier.


## Pre-publication production query acceptance

The [actual proposed report SELECT](public-signer-production-query.json) returned **273 included signed-agent events**, split Exa 243 and Ahrefs 30, with 173 daily client IDs. The kind/reason split reconciles to the same 273 events. These are stored verifier outcomes for October 20–partial October 26 UTC, not 273 people or independently reverified signatures. No unreviewed name is published in this receipt.

The exact statement passed native D1 after literalizing its parameters: 70,063 SQL bytes. Production reported **41,993 row reads and zero writes**, within the 50,000 direct-SELECT ceiling. This is one report query, not an account total or a demonstrated cost reduction. Final HTTP acceptance is budgeted separately as one cold public fill and one immediate cache repeat; those service reads are additional and will not be called part of the metered direct-query total. No second extraction is planned.

[Source/build checks](public-signer-source-checks.json) accept 31 isolated built posts, one article H1, 1262 article words and 22 unchanged shaping prompts. Public dashboard and client labels match the new contract. This prepared-source acceptance precedes source push and Worker activation.
