# Seven signed Exa outcomes, seven linked proofs

October 29, 2026 UTC. Continues [Research 79](79-cohort-reasons-and-historical-records.md), using the exact **114-row new-ID slice** from [Research 78](78-refreshed-retained-population.md). Human-operated trials remain deferred by the owner. No new site request, collection setting, runtime policy or human label is introduced.

## What is now established

The slice contains **107 locally absent signatures and seven locally verified outcomes**. Six verified projections match the complete private records already accepted in [Research 69](69-current-verifier-signed-cohort.md) and [Research 72](72-latest-signed-proofs-and-log-identifiers.md): four plus two distinct references, with no overlap, changed field or missing row. Their archive manifests, recorded replay-input commitments and retained chain/receipt projections are rechecked. This reuses their accepted cryptographic evidence rather than calling them six fresh replays.

The seventh outcome uses verifier `.28.7`, collector `.28.10` and classifier `.27.5`. Its **01:53:47 UTC** request predates those two cohorts. A native Observability query for its exact private storage reference finds one retained receipt in **01:53–01:55 UTC**. The linked request-reference query returns four records: invocation, attempt, stored receipt and span. Both acknowledged exports agree on the receipt; its full projection matches the fresh D1 row. These copies share Cloudflare's retained source and are not independent wire captures.

The [production ledger](signed-slice-production.json) now reconciles all seven projections with linked proof evidence. No status-only or count-only join closes the gate. The [diagnostic helper](../../../scripts/check-signed-slice.mjs) preserves owner/excluded rows, contradictory status claims, exact large text IDs, changed/missing archive entries and overlapping archive memberships. It is absent from ingestion and public reporting.

## The proof still leaves purpose unsigned

The recovered request is replayed at its recorded time using the later, already archived Exa directory capture. Node and native workerd agree under both the recorded `.28.7` source and current `.29.1` verifier. A pinned independent RFC 9421 implementation agrees on the same three contexts:

| Captured-context experiment | Local profiles and independent RFC result |
| --- | --- |
| Original request | Verifies |
| Changed destination authority | Signature fails |
| Changed User-Agent and path | Still verifies |

The original coverage and candidate-selection facts match the stored evidence. This proof binds the authority, while leaving UA, method and resource unsigned. Keys from the reviewed Exa publisher support the origin comparison; they do not authenticate the ExaSearchBot role declaration, search operation, human trigger or readership. No altered request is sent to production.

The [replay receipt](signed-slice-replay.json), [independent comparison](signed-slice-reference.json) and [input reconciliation](signed-slice-preflight.json) preserve these boundaries. The one-observation reuse audit cannot establish nonce uniqueness across all seven cohorts. The replay helper now accepts an explicit bounded cohort size, retaining 52 as its default. Rerunning the earlier 52-proof inputs reproduces every prior result and reuse field unchanged; those are regression checks, not new observations.

This applies the component-coverage boundary in [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html) to a recovered request. [Cloudflare's logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) and [query-builder documentation](https://developers.cloudflare.com/workers/observability/query-builder/) supply the retained-source context reviewed in Research 75. [Source commitments](signed-slice-sources.json) cross-reference those existing captures, historical source and the independent library. No fresh primary-page or key fetch is claimed here. Later directory keys do not reconstruct original resolution; historical source replay does not attest deployed bytes or native managed-verifier agreement.

## Costs and unsuccessful attempts remain visible

An immutable eleven-file native-tested plan precedes the two production SELECTs. Wrangler `--command` receives prepared SQL as one subprocess argument; no import or query retry occurs.

| Statement | Reads | Writes | Provider attempts |
| --- | ---: | ---: | ---: |
| Constant access control | 0 | 0 | 1 |
| Complete fixed slice | 343 | 0 | 1 |
| **Total** | **343** | **0** | **2** |

The native fixture costs **130 reads** for its 114 rows. Production costs 343. The fixture does not establish production cost equivalence; both remain under the 500-read review threshold, which is not server enforced. Native query/export costs are unavailable and additional.

D1 metadata first fails authentication with code 10000. Separate Worker metadata identifies the configured binding; the constant control separately accepts query access. No credential/permission repair or failure cause is inferred. Parsing the failed non-JSON metadata stops local plan assembly; the initially created archive directory is empty. Corrected plan assembly is frozen before either SELECT.

Local workerd initially cannot open its sandboxed loopback listener, then passes with approved local execution and a fresh output path. Two acceptance-assembly errors—wrong bounds envelope and comparison against a compact public receipt without full results—stop before acceptance; corrected checks use the hash-matched private full result. The raw absent count is 107, while included-only absent is 103; no query is repeated to correct that distinction. Five negative controls reject altered receipt linkage/coverage and invalid cohort sizes.

The [checks](signed-slice-checks.json) pin the separate plan and 57-file data archives. Raw captures, references, request headers and signatures remain outside Git with restricted modes. October 31 is a review date, not automatic erasure. Article and its 31 shaping prompts remain unchanged at 1,376 words; no new publication acceptance is claimed.

This closes recovery for these seven outcomes. It does not close the **1,181 outcome-only historical records**, whole-history cryptographic correctness, R1 attribution, privacy decisions, managed-verifier comparison or human/device/JS-off/RUM accuracy. Next: consolidate proof-recovery coverage and retained-source limits across the existing frozen cohorts before deciding whether another retrieval can add evidence. Human trials stay deferred.
