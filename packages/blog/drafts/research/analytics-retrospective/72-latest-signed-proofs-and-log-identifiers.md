# Latest-collector proofs pass; native log IDs still need scoped joins

October 29, 2026 UTC. Continues [operator/use diagnostics](71-forwarded-operator-and-purpose-claims.md). The previous turn delivered a tested diagnostic capability: progress. Human trials remain deferred.

Two retained Exa-origin proofs now have complete request/receipt chains, independent recorded-time verification and exact stored-row agreement under **collector `.29.3`, receipt `.29.1`, verifier `.29.1`**. This closes latest-collector signed acceptance for these two observations. The same investigation finds a concrete reason not to deduplicate native exports by log ID.

## Freeze the scope before interpreting absence

The native log window is **October 29, 03:15:00–04:15:00 UTC**, end exclusive in the offline checks. The historical four-request filter was removed. Intermediate loading views displayed old counts; only settled queries support the findings.

The field selector exposes `x-forwarded-proto`, giving us a positive header-indexing control. Its presence query returns 409 events. A native export capped at 500 returns **409 invocation objects**, each with that header and a distinct request reference. This is a selected retained-log cohort including assets and other request types, not 409 article views, readers or complete traffic.

No captured header object contains `Forwarded`. Its explicit presence query returns zero; the field selector's related-key search lists only `x-forwarded-proto`. These observations do not establish positive indexing of Forwarded when present, wire-complete capture, absent purpose on the original requests, or prevalence outside this selection. [Query Builder](https://developers.cloudflare.com/workers/observability/query-builder/) describes the query interfaces; [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) documents sampling, truncation and retention limits. Neither supplies an independent packet capture. The visible pricing/sampling notice was not accepted or changed.

## A native log ID is not a safe deduplication key here

The export contains **409 distinct request references but 402 distinct `$metadata.id` values**. Seven ID groups contain two records each, with different request references. A blanket log-ID deduplication would collapse seven of those distinct request representations. The collision's cause and the provider's intended global uniqueness contract are not established; this is not a vendor-wide bug or loss-rate claim.

The initial offline analyser rejected the broad export because it assumed log-ID uniqueness. The corrected method preserves all seven collision groups, requires unique request references in this cohort, and rejects a selected signed record if its log ID is ambiguous. The two selected signed records are outside those groups. Broader identifier ambiguities must not disappear merely because a narrower join succeeds.

## Recover and verify two latest-collector proofs

Two invocation objects contain all three signing headers and declare ExaSearchBot. Selecting their exact native request references returns eight records: **two invocations, two attempts, two stored receipts and two spans**. Every chain is complete and its scoped integrity checks pass. The invocation copies agree with the independent 409-record download. A separate public-field query for collector `.29.3`, receipt `.29.1` and verified outcome returns two receipts; both exported source objects and timestamps agree with the chain copies.

Their recorded execution Worker is `2c022398`. This identifies those historical invocations, not the currently active deployment. Both retain declared AI-search classifications and an Exa-origin verified result. Their new network receipts explicitly record **one unmapped declaration and zero configured IP checks**. All network-summary flags are false because no IP method was assessed; that is not an IP nonmatch or verification failure.

At **04:20:25 UTC**, Exa's reviewed [public directory](https://crawler.exa.ai/.well-known/http-message-signatures-directory) returns HTTP 200, the signature-directory media type and two keys. Its digest matches the earlier capture, but this does not reconstruct the original resolver snapshot. [Exa's documentation](https://crawler.exa.ai/) distinguishes indexing/search from user-requested fetches; that distinction still cannot authenticate an unsigned UA declaration for an individual request.

Our [maintained analyser](analyze-latest-signed-inputs.mjs) executes the same six contexts in Node and native local workerd. Both originals verify; both changed-authority controls fail with `signature-invalid`; both changed unsigned UA/path controls still verify. The pinned Python implementation agrees on all six outcomes, after rechecking eighteen source files and five dependency versions. It uses the exact frozen inputs and recorded clocks, not present-time freshness or a managed Cloudflare verdict.

All proofs cover authority, leaving method, resource and UA unsigned. Exhaustive candidate audits find one valid eligible proof per request with none unassessed. The bounded reuse audit finds two distinct proofs/nonces and no repeats within these two records; it performs no enforcement and establishes no unique-action count. Native verification booleans remain unavailable.

## Metadata failure did not establish query failure

One Wrangler `d1 info` attempt returns authentication error **10000**. Its automatic account-visibility output is not a successful database-metadata read, budget estimate or proof of query permission. We preserve the failure and its unavailable metering; we make no deliberate login, credential, role or plan change.

Installed Wrangler 4.71 source confirms separate metadata and command-query paths. The latter uses the `query` action through POST; `--file` would use an import path and is not used. Different paths and sequential responses do not isolate a permissions cause or a repaired credential.

Before either SELECT, an immutable eight-file private plan fixes one constant-control attempt and one conditional exact read, no agent retries, two exact references and a 100-read review threshold. That threshold is not a provider execution cap. Current native D1 tests accept both statements, retain contradictory/missing/owner fixtures, distinguish adjacent text IDs beyond JavaScript's safe-integer range, and confirm the primary-key plan.

| Successful Wrangler diagnostic | Reported reads | Reported writes |
|---|---:|---:|
| `SELECT 1 AS query_access_control` | 0 | 0 |
| Exact two-reference readback | 4 | 0 |
| Total | **4** | **0** |

The constant succeeds before the [exact SELECT](latest-signed-storage.sql) runs. Both report one attempt and no database-change flag. All stored receipt projections match, including network provenance and zero-check state. Both application `request_evidence` fields are null; that does not describe other records or provider logging. Metadata/UI/export work has additional unreturned costs. This is not account-wide daily accounting, and the earlier metadata failure's cause remains unknown.

## Acceptance and remaining work

The [final acceptance adapter](accept-latest-signed-storage.mjs) binds the source exports, exact references, independent copies, replay input, pinned implementation and SQL template. Three negative controls reject a selected log-ID collision, a changed invocation copy and a wrong row reference without writing accepted output. Twenty-one targeted tests, script syntax and Markdown validation pass. [Production evidence](latest-signed-production.json) and [checks](latest-signed-checks.json) preserve the separate scopes.

No runtime/profile/schema/capture setting changes, deliberate site visits or new human labels are introduced. The article stays at 1,358 words/31 prompts, with this follow-up linked through its existing evidence trail. No new build, activation, served-page or present-health claim is made.

The older 52 `.28.7` outcome-only records remain unrecovered. These two different latest-collector records do not repair historical proofs, establish managed-provider agreement, identify R1 or prove actual content use. Next: inspect native header provenance and redaction against current authoritative documentation before using vendor-branded transport fields for attribution. A header name alone is no identity proof. The broader [goal audit](current-goal-audit.json) and deferred human/device measurements remain open.

The private data archive contains 83 captured files plus its manifest, with 0700 directories/0600 files. Manifest SHA-256: `334e3e35e1c04c68bc9ea983c166520a577b319abc06b7489fd54ac708fa1f5a`. The separate eight-file pre-execution plan archive is immutable; older archives remain unchanged. October 31 is a review date, not automatic deletion or a provider-wide retention guarantee.
