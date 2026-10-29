# Show parsing evidence without turning it into a human count

October 29, 2026 UTC. Continues [Research 91](91-live-metadata-controls-and-redacted-correlation.md): two of four controlled curl requests matched the Browser rule. Human-operated trials remain deferred. This iteration changes report visibility and wording; it adds no human labels or new collection fields.

## Name the evidence we have

The main filter and classification labels now say **Browser signals**. The nearby explanation says that browsers, automated clients and relays can supply those signals. This is the consequence of the measured curl controls, not a new claim that we can identify all automation.

A new Request context table reports Mode, Destination, Site context and Activation. Each field accounts for the same included population as the headline, after owner/client/referral exclusions and time/path/traffic filters. Rows describe overlapping facts about those observations; adding rows would count the population repeatedly. Parameter flags also overlap state counts.

| Stored evidence | Public treatment |
|---|---|
| Supported format/profile and checked parsing facts agree | Decode the six field states: unassessed, absent, valid, unrecognized, invalid, processing limit |
| No record, or a recognized earlier format without parsing bits | Parsing not recorded; all four fields unassessed |
| Unsupported format or provenance | Unsupported record/profile; all four fields unassessed |
| Known record with conflicting profile, encoding, scalar or activation facts | Inconsistent parsing facts; all four fields unassessed |

**Missing history is not evidence that a header was absent.** The supported pair is collection `2026-10-29.6`, classifier `2026-10-29.3`, with classification evidence `2026-10-29.2`. Future profiles require review; the report will not interpret them optimistically. These checks do not revalidate every other classification fact or authenticate the original request.

The [W3C Fetch Metadata draft, §2.4](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/#sec-fetch-user-header) distinguishes Boolean syntax from browser generation: its algorithm omits the activation header when false. We expose parsed true claims and false values separately. A parsed `?0` is not proof of conformant browser generation; a `?1` is not human attestation. The [earlier relay experiment](89-local-browser-relays-and-fetch-metadata.md) also shows why absence cannot identify an engine or operator.

## Validate stored facts and public totals

The [report module](../../../../analytics/src/fetch-metadata-report.ts) guards JSON before accessing it. It checks JSON integer type, bounded encoding, supported codes, parameter/state combinations, duplicate top-level keys, allowed retained scalars and assessed activation labels. SQLite's [JSON guide](https://www.sqlite.org/json1.html) matters here: extracted SQL values can obscure JSON type distinctions, so `json_type` remains part of validation. Cloudflare [documents JSON querying in D1](https://developers.cloudflare.com/d1/sql-api/query-json/).

The [shared contract](../../../../analytics/src/fetch-metadata-report-contract.ts) requires safe nonnegative counts, exact keys, record totals, per-field totals, parameter bounds and activation subtotals. The server rejects inconsistent grouped output; the client rejects missing or inconsistent summaries. A stale response cannot quietly become a table of zeros. The report cache version advances from `.29.4` to `.29.5`; collector/classifier/verifier/schema versions stay unchanged. The collector's token sets are shared without changing their contents or parser behavior.

An early test incorrectly expected a valid `cors` scalar to contradict a generic valid-state bit. That encoding does not identify which valid token was parsed. The corrected negative uses a noncanonical scalar; no historical value-recovery capability is claimed.

## Native checks and the cost of scrutiny

The [native harness](../../../scripts/check-fetch-metadata-report.mjs) pins every baseline analytics module to `e5fbbd7`. Seventeen before/after calculations cover empty selections, four ranges, six traffic groups and paths. All existing decoded fields and raw sections match. Twenty-five individual record cases exercise current/earlier/unsupported/inconsistent provenance, malformed encodings, duplicate keys and non-object JSON. Actual malformed JSON is rejected by the schema. Early fixture attempts violated that constraint, then omitted required columns; the corrected complete synthetic row tests the intended rejection. These were local harness failures, not production findings.

The initial report validated every observation separately. On the same 512-row, 22-case synthetic fixture, the seven-day `/fixture` report rose from **24,657 to 33,247 reads**. Grouping identical retained parsing records before validation reduces the candidate to **25,857**, a **4.9% increase** over baseline. This preserves event multiplicity. It is not an assumption that production inputs repeat at the same rate. The final expanded 25-case fixture has its own [paired meters](public-parsing-native.json); do not compare different fixtures as an optimization result.

Exhausting all **6,561 supported encoding/activation cohorts** produces **408,277 bytes** in native local D1. Three additional grouped states cover unavailable records. Candidate statements remain below 100,000 bytes. A [separate SQLite check](../../../scripts/check-fetch-metadata-report-limit.py), with statement caching disabled and the function limit set to 32, matches all seventeen native outputs. These test [D1's documented statement, row and argument limits](https://developers.cloudflare.com/d1/platform/limits/); they do not establish production enforcement or latency.

The full 303 analytics tests, 117 site tests and workspace type checks pass. The isolated build produces 33 posts; Markdown validation covers 22. Desktop/mobile checks use synthetic data, keep table overflow inside a focusable region and reject missing/inconsistent API summaries visibly. Native SQL is executed by local D1; decoding is in the Node controller. No provider detection service, human accuracy rate or production cost is inferred.

The article gains one concise explanation of Browser signals and missing-history semantics: **1,450 whitespace words, 31 unchanged shaping prompts**. The supporting receipts retain [checks](public-parsing-checks.json), [sources](public-parsing-sources.json), [native meters](public-parsing-native.json) and [constrained SQLite results](public-parsing-sqlite-limit.json).

At this local checkpoint, source delivery, activation, cache reuse and served assets remain separate acceptance work. No production request or diagnostic SELECT has occurred in this iteration. Next: freeze a small empty-selection API/cache and asset-check plan after exact-source activation. The full goal remains open: native managed comparison, human/device/RUM measurements, historical proof recovery, R1 attribution and privacy decisions remain incomplete.
