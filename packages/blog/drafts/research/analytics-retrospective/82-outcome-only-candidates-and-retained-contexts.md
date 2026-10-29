# Recovering requests does not recover row identity

October 29, 2026 UTC. Continues [Research 81](81-proof-inventory-and-recovery-age.md). That goal turn made progress by separating duplicate proof reports and measuring outcome-only record ages. Human trials remain deferred. This iteration selects the frozen 201 candidates and recovers retained request representations, keeping those two populations separate.

## The candidate rows

The [native-tested selector](../../../scripts/select-outcome-only-candidates.mjs) returns **201 raw verified flags without signature detail** under the prior maximum ID and fixed October 22 06:55–October 29 06:55 UTC window. Its private projection excludes raw client identifiers and request headers; exact row references, paths and other operational fields stay outside Git.

| Stored signer display | Candidates |
| --- | ---: |
| Exa | 171 |
| Ahrefs | 29 |
| Other | 1 |

All 201 record edge collection: 116 HTML and 85 Markdown representations. Forty-two have collection/classifier stamps—two `.26.2`, forty `.26.3`—and 159 lack those stamps. Forty-one have a client name. No owner flag or optional request capture is present. These are stored facts, not new identity or trigger findings.

## Check the export, not just the counter

An initial blank query submission accepts an autocomplete `NOT` suggestion while retaining the previous request-reference filter. Inspecting the scope catches it; its zero result is discarded as evidence of availability.

The corrected native `exists($workers.event.request.headers.signature)` query spans October 22 06:55 through October 27 14:49 UTC. Its first result explicitly warns of incompleteness. One Load More settles the table. The dashboard displays **277**, acknowledged Copy as JSON returns **100**, and a download capped at 1,000 returns **240** records.

Daily partitions supply a second view:

| UTC partition | Displayed count | Acknowledged export |
| --- | ---: | ---: |
| October 27 through 14:49 | 25 | 25 |
| October 26 | 40 | 40 |
| October 25 | 44 | 44 |
| October 24 | 50 | 50 |
| October 23 | 58 | 49 |
| October 22 from 06:55 | 32 | 32 |
| **Total** | **249** | **240** |

The broad download and daily union contain the **same 240 request references, timestamps and request contexts**. The initial 100-copy set is a subset. Across these representations, 580 memberships deduplicate to 240 requests. Their 239 native log IDs include one collision group, so log ID alone is not a safe deduplication key. None reports truncation.

This agreement does not reconcile the counters or prove complete retention. October 23's nine-record difference remains unexplained. [Cloudflare documents Count as matching events and distinguishes aggregate, invocation and event views](https://developers.cloudflare.com/workers/observability/query-builder/); the checked page does not establish a cause for this discrepancy. No sampling, deletion or deduplication cause is assigned.

The retention clock also moves. The frozen age reference was 06:55 UTC; at the later **15:00 UTC** check, **22 of these 201 stored dates** were older than the documented seven-day maximum. That is an age assessment, not proof of provider deletion or the cause of any export difference. [Workers Logs retention](https://developers.cloudflare.com/workers/observability/logs/workers-logs/) remains a limit on the normal product, not a search of other archives.

## What the recovered contexts verify

The [offline analyzer](analyze-outcome-recovery.mjs) parses exact signing-agent claims and restricts its resolver to already captured Exa/Ahrefs keys. Node and **local workerd** agree on all 240 originals and four controls:

| Retained-context assessment | Requests |
| --- | ---: |
| Exa context verifies | 152 |
| Ahrefs context verifies | 68 |
| Signing publisher outside this reviewed scope | 19 |
| Signature-Agent missing | 1 |

All **220 verified captured contexts bind only the authority**. Both vendors' altered-authority controls fail, while altered UA/path controls still pass. Pinned `pyauth/http-message-signatures` independently agrees on those 220 originals plus four controls: **224 contexts**, including two expected signature failures. Its eighteen source files are rechecked. No request is replayed to a publisher or the site.

The nineteen unassessed claims span four unreviewed signing origins. Today's closed UA registry recognizes fourteen DuckDuckBot declarations, one Meta-WebIndexer and four with no recognized declaration. Those names do not authenticate the publishers. Public signer display stays Other, and no arbitrary directory is fetched. Absence of diagnostic/control headers in the export does not establish organic traffic.

These results concern supplied retained representations at recorded times using later keys. They do not reconstruct original directory resolution or wire-complete requests, and local workerd is not Cloudflare's managed verifier. [Closed production results](outcome-recovery-production.json), [independent groups](outcome-recovery-reference.json) and [source commitments](outcome-recovery-sources.json) preserve those limits.

## The exact-link gap remains

A literal diagnostic compares stored UTC seconds and paths with captured GETs to the site. It finds **101 single candidate correspondences, twelve ambiguous and 88 without one**. It fits no time offset. None is an authenticated storage join, and no correspondence does not prove that an input is missing: timing and representation can differ.

The latest correspondence has a retained four-record invocation/attempt/stored/span chain. Its attempt and storage-success log share an operation identifier and collector `.26.3`. The retained success object exposes only message, operation identifier and collection version—**no returned storage reference or detailed receipt**. The request-to-native-log chain is established; its D1-row identity is not. Nothing rewrites a stored verification flag or promotes it to freshly verified evidence.

## Cost and acceptance

The native selector exercises date boundaries, negative/zero IDs, owner records, nonclaims, impossible times, adjacent large IDs, concrete/parameterized equality and a 202nd-row rejection sentinel. Its 65,536-row fixture returns 201 candidates for **402 reads/zero query writes**; that distribution is not production cost equivalence.

Fresh Worker metadata matches the D1 binding. An immutable nine-file plan precedes both single-attempt Wrangler `--command` SELECTs: constant control **0 reads**, candidate selection **3,096 reads**, **zero writes**. The 200,000-read review threshold is not server enforced. Native UI/export metering is unavailable and additional.

The [checks](outcome-recovery-checks.json) retain incomplete/stale scope attempts, the download/copy discrepancy and a disabled date-range form that required committing its edited end field. The official Observability API documentation exceeds the web reader's size limit; this establishes no API authorization or response-contract result.

Private references, raw exports, signatures and headers remain in the restricted evidence archive; October 31 is a review date, not automatic erasure. No site request, public report fill, runtime policy, capture setting or human label changes. The concise article remains unchanged at 1,376 words/31 prompts.

Next: privately review the four unassessed publisher origins against authoritative vendor sources before considering directory/key replay, keeping names, signer evidence and purpose independent. Historical linkage and export completeness remain explicit gaps; human/device accuracy, managed-verifier agreement, R1 attribution and privacy decisions stay open.
