# What proof evidence survives, and what can still be recovered?

October 29, 2026 UTC. Continues [Research 80](80-seven-proof-slice-reconciliation.md). The previous goal turn made progress by recovering the seventh signed request. Human-operated trials remain deferred. This iteration uses existing private proof archives and a new aggregate-only timestamp query; it creates no site visit, collection setting or runtime change.

## Count observations once, then test proof reuse

The selected reports have **65 source memberships but 59 distinct stored observations**. Research 80's seven-request result includes the four requests from [Research 69](69-current-verifier-signed-cohort.md) and two from [Research 72](72-latest-signed-proofs-and-log-identifiers.md). Adding their headlines would count those six twice.

The [inventory helper](check-proof-inventory.mjs) verifies archive manifests and selected file commitments, then reconciles every selected invocation/attempt/receipt chain with its full stored projection and recorded replay input. The canonical groups are 52 older requests, four current-verifier requests, two latest-collector requests and the newly recovered older request. It checks their private ID partitions before combining them.

**Deduplication uses exact stored-observation identity, not signature equality.** Multiple exports of one observation merge only when their complete projections and request contexts agree. Two observations carrying the same proof remain two observations, so reuse remains detectable. Conflicting projections/contexts stop acceptance; adjacent IDs above JavaScript's exact numeric range stay distinct, and numeric references are rejected.

Fresh Node and native workerd reuse audits agree on all **59** selected original requests using their recorded times and later captured publisher keys. They find **59 verified proofs, 59 usable nonces, zero repeated proof groups and zero repeated nonce groups**. The audited publishers are Exa and Ahrefs. Resolver calls use captured directories only; nothing is sent to a crawler or the site.

This extends the prior per-cohort checks across their union. It is not a unique-action count, an attack rate or proof of no replay elsewhere. [RFC 9421 §7.2.2](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.2) discusses combining component coverage, freshness and nonce tracking. Finding distinct nonces in saved inputs does not implement replay prevention. [The earlier enforcement experiment](70-replay-policies-atomicity-and-cost.md) remains a prototype.

## There is no defensible whole-history replay percentage yet

The [Research 78 census](78-refreshed-retained-population.md) has **86 included detailed verified outcomes** and **1,181 outcome-only records**. Our selected archived union has 59 exact linked proofs. The arithmetic difference, 27, is not an independently enumerated list of missing proofs: readbacks came from different times, the census is aggregated, and this inventory does not exhaust every saved archive.

The [production record](proof-inventory-production.json) therefore leaves the proof-coverage rate null and marks same-snapshot membership and an exact unrecovered remainder unestablished. It preserves the useful scoped result without turning a collection of passing checks into a whole-history correctness claim.

## The outcome-only gap has a recovery deadline

Cloudflare currently documents a **maximum seven-day Workers Logs retention period**; its plan table lists three days for Workers Free and seven for Workers Paid. Sampling and log-size truncation add other coverage limits. These are documented product limits, not proof of this account's historical capture settings or an actual record's presence. [Workers Logs documentation](https://developers.cloudflare.com/workers/observability/logs/workers-logs/).

The new query uses the same maximum ID as Research 78. It counts raw stored `verified` flags with null signature detail, using a fixed **October 29 06:55 UTC** reference time and **October 22 06:55 UTC** seven-day boundary. It returns aggregates only:

| Recorded-time state | Outcome-only records |
| --- | ---: |
| Older than the documented maximum age | 980 |
| Within that maximum age | 201 |
| Future recorded time | 0 |
| Unrecognized recorded time | 0 |
| **Total** | **1,181** |

Their recorded dates span **September 3 06:29:44 through October 27 14:48:36 UTC**. The bounded raw population remains 33,189 rows, matching the prior count without establishing old-row immutability.

The **201** are the next recovery candidates. Being within seven days does not establish retained headers, unsampled export coverage, valid proofs or exact row linkage. The **980** fall outside the normal documented maximum by stored time; this does not prove absence from existing exports, Logpush destinations or another archive. Stored observation time is also not an independent wire timestamp or signature creation time.

[Workers Logpush](https://developers.cloudflare.com/workers/observability/logs/logpush/) can export trace events to a configured destination and supports filters and sampling. It is prospective capability, not retroactive recovery. No destination, job, retention policy or expanded capture is activated. The unresolved privacy decisions still govern any new collection proposal.

## Native checks and measured cost

The [age-query helper](../../../scripts/check-outcome-only-age.mjs) tests empty input, exact date boundaries, future/impossible/missing times, nonclaim records, concrete/parameterized SQL equality, malformed output and the over-limit sentinel. A 65,536-row local D1 scale costs **196,609 reads and zero query writes**. It has a 200,000-read post-execution review threshold, not a server-enforced cap.

Fresh Worker metadata matches the configured D1 binding. A separately tested constant SELECT establishes query access. The immutable ten-file plan archive precedes both production statements, using Wrangler `--command` with private prepared SQL passed as one subprocess argument:

| Statement | Reads | Writes | Provider attempts |
| --- | ---: | ---: | ---: |
| Constant access control | 0 | 0 | 1 |
| Recorded-age aggregate | 99,569 | 0 | 1 |
| **Total** | **99,569** | **0** | **2** |

No query retry, public report fill or collection-eligible GET occurs. The statements do not share a held snapshot. [Native results](proof-inventory-native.json), [source captures](proof-inventory-sources.json) and [checks](proof-inventory-checks.json) preserve the conditions and limits.

An initial inventory attempt selects a similarly named archive result file instead of its input file and stops before replay/output. Two age fixtures initially violate existing owner-flag/client-key constraints; corrected fixtures and a final constant-control run pass before production. Python's first public-doc request gets 403; the web reader and curl retrieve the pages. The client-dependent cause is unknown, and the source receipt preserves both attempts.

Private inputs, raw captures, exact references and headers remain outside Git with restricted modes and a hash manifest. The October 31 review date is not automatic erasure. The concise retrospective remains unchanged at 1,376 words/31 prompts: these findings refine recovery operations without changing its distinction between identity, role and trigger.

Next: native-test an exact bounded selection of the 201 age-eligible outcome-only records and a retained-source extraction plan. Recover inputs where available, keeping candidate association separate from exact storage linkage. Do not mark a stored outcome freshly verified merely because a nearby request replays. Human/device accuracy, managed-verifier agreement, R1 attribution and privacy/retention decisions remain open.
