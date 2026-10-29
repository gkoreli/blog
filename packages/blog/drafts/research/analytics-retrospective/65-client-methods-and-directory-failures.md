# Client declarations, method gaps and hidden directory failures

October 29, 2026 UTC. Continues [the 712-record delta](64-retained-delta-and-unresolved-reasons.md). The previous turn completed its investigation and accepted publication: progress. This iteration keeps the same frozen ID range; human-operated trials remain deferred.

## What the client declarations establish

One [bounded follow-up](client-methods-production.json) accounts for the same 712 retained records: **711 included and one referral-excluded**. Of the included records, 126 have a single reviewed client candidate; 585 have none. All stored selected names agree with those candidate projections. No missing, multiple or unrecognized candidate projection occurs here. This validates the selected stored fields, not a replay of original User-Agent parsing.

| Retained declaration | Included | Current configured method | Stored result |
|---|---:|---|---|
| ExaSearchBot | 51 | Signing-origin comparison | 51 verified, matching origin |
| AhrefsBot | 1 | Published IP feed | Listed; local signature verified |
| ChatGPT-User | 1 | Published IP feed | Listed; no signature headers |
| GPTBot | 3 | Published IP feed | One listed, two not assessed; no signature headers |
| Googlebot | 4 | Published IP feed | Four listed; no signature headers |
| OAI-SearchBot | 2 | Published IP feed | Two listed; no signature headers |
| PerplexityBot | 9 | Published IP feed | Nine listed; no signature headers |
| Amazonbot | 7 | Neither configured | No signature headers |
| Applebot | 1 | Neither configured | No signature headers |
| Baiduspider | 1 | Neither configured | No signature headers |
| Bingbot | 1 | Neither configured | No signature headers |
| Bytespider | 20 | Neither configured | No signature headers |
| Meta-WebIndexer | 19 | Neither configured | 18 absent; one directory unavailable |
| PetalBot | 6 | Neither configured | No signature headers |

Seven of the fourteen observed names have a configured method: **71 events**, versus **55 named events without either configured method**. Unconfigured means this implementation has no method for that declaration; it does not mean the vendor offers none or that the request is fake. The 20 IP-configured events reconcile with the earlier 18 listed/two not-assessed outcomes. Stored consistency does not rerun original address comparisons or current feeds.

All 51 Exa declarations are **ExaSearchBot**. There is no ExaUser declaration in this cohort. [Exa's crawler documentation](https://crawler.exa.ai/) distinguishes indexing from [ExaUser's on-demand application/user fetches](https://crawler.exa.ai/exauser). Even the latter description would not establish a human trigger for an individual request. The earlier census independently establishes that all 52 stored verified outcomes leave User-Agent and resource unsigned; no new crypto replay or complete proof chain is recovered here. [RFC 9421 §7.2.1](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) limits integrity claims to covered components.

[Ahrefs documents](https://ahrefs.com/robot) its crawler/audit roles and published addresses. Its one stored verified signature remains separate from that per-client IP method; the signing-origin catalogue does not claim every Ahrefs client signs.

## The unverified outcomes are not three cryptographic mismatches

The unavailable event declares **Meta-WebIndexer**, not Exa. Its retained primary and complete closed reason set are both `directory-unavailable`. Two other events have no reviewed declaration and record only `missing-signature-agent`. Those two are invalid protocol-input outcomes, not measured signature-math failures. The follow-up selects no raw header, signature, key ID, origin, IP or reader identifier.

The historical directory code is too broad to establish an HTTP error, bad media type, body failure, malformed JSON or resource-limit cause. Fetching today's directory would not explain an earlier lookup. That cause remains unknown.

## Directory failures were collapsed

[Before/after controls](directory-failures.json) use independently signed synthetic requests and actual `Response`/`ReadableStream` objects in Node and workerd. Before repair, eleven directory-failure conditions collapse into `directory-unavailable`. Thirteen cases exercise default verification, selected-proof verification and the all-proof audit: **39 paths per runtime before and after**. Valid and empty-key controls retain their respective verified and key-not-found outcomes.

The verifier now retains ten closed codes: `dir-concurrency-limit`, `dir-fetch-failed`, `dir-http-status`, `dir-media-type`, `dir-body-limit`, `dir-body-missing`, `dir-body-read-failed`, `dir-json-invalid`, `dir-shape-invalid` and `dir-key-limit`. All remain **unavailable**, distinct from cryptographic rejection. The concurrency budget has a separate existing-origin-sharing unit control. No exception text, HTTP body, arbitrary URL or numeric status is added to evidence. The old code remains readable.

The controls also reproduce a pending-cache defect. A synchronously throwing fetcher completes before its promise is registered; cleanup ran too early, leaving a completed failure in the pending map. A later request reused that failure without another fetch. Cleanup now runs after registration, checks promise identity, and removes the completed entry. The Node replay changes from one fetch/two failures to two fetches/second request verified. A real composed collector in local workerd also succeeds after this failure. This establishes a local failure mode and repair, not the cause of the historical Meta event.

The first full test run rejects verbose new codes because the complete reason set exceeds the 2,048-byte evidence contract. Compact `dir-*` names preserve every reason; the worst tested complete set with all 48 declarations is **2,039 bytes**. No schema expansion or silent truncation is used. Fourteen actual collector/D1 controls preserve exact stored-reference/receipt agreement, native unavailability and absent optional request evidence.

The [pinned Cloudflare implementation](https://github.com/cloudflare/web-bot-auth/blob/2c3eb0bb9afb648ab9b8c1440701c20cc9bdd5f0/packages/http-message-sig/src/errors.ts) distinguishes resolver failure from verification failure; its [Web Bot Auth API](https://github.com/cloudflare/web-bot-auth/blob/2c3eb0bb9afb648ab9b8c1440701c20cc9bdd5f0/packages/web-bot-auth/src/index.ts) accepts a caller-supplied resolver. We borrow that separation. These local refinements are not Cloudflare service verdicts or independent accuracy validation. [Source commitments](client-methods-sources.json) preserve the exact revision and hashes.

[Cloudflare's integration guide](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) specifies registration and directory transport requirements, including the directory media type. Its [Verified bots guide](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/) separates verification methods and behavior. Neither substitutes for unavailable request-level signals in this account.

## Query, checks and release boundary

The exact lower/upper inputs match the frozen private archive manifest. The helper rejects ID spans above 712, closes candidates and reasons before output, and uses current owner/referral precedence. [Fifteen native fixtures](client-methods-native.json) cover missing/ambiguous/unknown candidates, duplicate candidates, other profiles, legacy disagreement, exclusions, closed reason sets, reordered duplicate aggregates and adjacent IDs above JavaScript's safe integer range. The full 712-row fixture uses **23,823 reads / zero query writes**.

One Wrangler `--command` SELECT uses **20,384 reported reads / zero writes / one reported attempt**, under its separately recorded 60,000-read post-execution review threshold. This threshold is not database-enforced. This adds to research 64's closed three-statement plan; it is not silently included in it. No new preflight, public-report fill, site visit or human label occurs in data investigation. Fixed IDs exclude newer inserts but do not freeze existing rows against updates or deletions.

The executed SQL and helper imports predate the new reason vocabulary. Exact executed source/template/import commitments are preserved privately; the expanded current helper passes native acceptance and validates the captured result without another production query. Shared stored-state projectors check consistency, not original cryptographic truth.

Collection/verifier and report-cache profiles become `2026-10-29.1`; classifier, schema, method registries and optional-capture settings are unchanged. Fresh checks pass: **262 analytics tests, 117 site tests and workspace types**. [Release acceptance](client-methods-release.json) separates these local results from source delivery, activation and publication. Genuine new-profile signed persistence and production observation of the new specific failures remain prospective. The article incorporates the causal distinction at 1,328 words, with 31 unchanged shaping prompts.

Next: accept activation, then research documented verification methods for the 55 named events without a configured method, starting with Meta-WebIndexer. Preserve human, native-verifier, R1, historical-recovery and privacy gaps from [the goal audit](current-goal-audit.json).

The frozen private archive contains 45 files with 0700/0600 modes. Its manifest SHA-256 is `e6c231529f2283bc9a9bbdee855727a16be68a6cfc55dee354aefa07723ae14d`. October 31 is a review date, not automatic deletion. Raw query responses, exact bounds, failed attempts and source captures remain outside Git. The checked article builds at 1,328 words; post validation accepts 21 Markdown posts and the isolated build produces 32 posts.
