# Know what calculating a report costs

October 27 Pacific / October 28 UTC. Continues [the retained census](54-retained-signature-applicability.md); human trials remain deferred.

**The report query already returns a meter, but our application discarded it.** Earlier MISS/HIT checks proved reuse while leaving production calculation cost unknown. A fast report and correct totals cannot fill that gap. This iteration retains the existing D1 result metadata in closed operational events, separately from cache outcomes. It adds no query, database schema or reader-tracking field.

## A returned counter is not complete billing

[Cloudflare's return-object reference](https://developers.cloudflare.com/d1/worker-api/return-object/) documents one result per submitted statement, with rows read, rows written and total attempts. SQL duration excludes network time. More subtly, the [provider's implementation](https://github.com/cloudflare/workerd/blob/main/src/cloudflare/internal/d1-api.ts) and our installed Workers types state that metadata other than attempt count applies to the **last attempt**. We preserve that scope. Multiplying its read count by attempts would invent work for earlier attempts.

The [closed projector](../../../../analytics/src/report-cost.ts) records safe nonnegative integer counters, nullable missing/invalid fields and complete/partial/unavailable metadata. Zero is accepted only when explicitly returned. Unexpected writes are retained and flagged, not reset to zero. A failed batch emits unavailable counters and rethrows; malformed batch cardinality or explicit failure rejects the report after recording its inconsistent state. The event describes the batch result before report decoding, so a decoder failure cannot hide measured query work.

No SQL, parameters, filter values, row identifiers, raw provider metadata or raw exceptions enter the new events. Observer failures cannot break report delivery. Existing invocation logs remain a separate source with their own request context; this is not a claim that all provider logs contain only these fields.

## Reuse has its own denominator

[Cache events](../../../src/worker/stats-cache.ts) distinguish HIT, MISS, COALESCED, invalid requests and capacity rejection, with response status. MISS means the loader was invoked; it does not promise success or persistence. COALESCED shares an isolate's pending calculation. HIT reuses a valid stored response. None claims account-wide zero reads.

[Cloudflare's Cache API documentation](https://developers.cloudflare.com/workers/runtime-apis/cache/) limits storage to the originating data center. A resolved `put()` does not itself prove storage; a subsequent accepted `match()` supplies the hit evidence. Existing TTL remains one hour capped at UTC midnight. Public body, calculation time, cache key and report version `2026-10-28.5` stay unchanged. Logging alone does not justify invalidating cached reports.

## Check the real query, not a mock cost

[Native acceptance](report-cost-native.json) compares the previous `8825937` report and instrumented report on the same 512-row workerd D1 fixture. SQL, bindings and complete public output match. Both calculations read **35,510 rows**, write zero and return no attempt count in this local runtime: metadata is therefore partial, not a fabricated single attempt.

A concurrent pair and later hit produce MISS/COALESCED/HIT with **one additional D1 batch and one calculation event**, identical response bodies and no public cost fields. [The helper](../../../scripts/check-report-cost.mjs) makes this repeatable without production calls. Source tests additionally exercise malformed/unsafe metadata, returned failure, thrown database error, decoder error, observer failure and private-field canaries. Analytics 240/site 108 and workspace types pass.

Operational logs are inspectable evidence, not an immutable billing ledger. [Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) describes sampling, size/volume limits and finite plan-dependent retention. Configured sampling of one does not prove complete receipt. The existing sampling/configuration is unchanged; exact production observation and private capture remain separate acceptance gates.

The article's cost paragraph now links this distinction while keeping its short form and thirty-one shaping prompts. No collector/classifier/verifier change, historical rewrite, expanded diagnostic capture or human trial occurs. The recent census is reused; this implementation needs no direct production SELECT. A planned narrow cold report will itself incur additional database work and must be measured through the new event rather than called free.

Next: accept source activation and one narrow production calculation/reuse pair. Human/device error rates, native cryptographic agreement, R1 attribution, missing historical proofs and privacy/retention decisions remain open under [the goal audit](45-goal-and-method-coverage-audit.md).

[Checks](report-cost-checks.json) include the isolated 32-post build and post/policy validation. Raw checks remain outside Git in `2026-10-28-report-cost-pre-release`: twelve files, 0700/0600 modes, manifest SHA-256 `c4f2ab20568178f88c123213778de32f59e766d2918b197f9d7a484c1cd9461b`. October 31 is a review date, not automatic erasure. [Source cross-references](report-cost-sources.json) distinguish the installed types, moving upstream source and observed runtime.
