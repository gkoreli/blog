# Complete interval and field hardening — October 25 Pacific / October 26 UTC

The owner authorized proceeding from the field-semantics review. This extends the detailed audit to the entire period after the last feature release and implements bounded prospective repairs. Existing snapshots stay frozen. [ADR-0016.9](../../../../../docs/adr/0016.9-observation-provenance-and-referrer-boundaries.md) records the semantic choices.

## Complete retained-data coverage

Window: **September 9, 2026 02:07:43 UTC inclusive through October 26 02:17:00 UTC exclusive**. Start is the observed September release version's activation; first/last days are partial. The original audit's September 27 start and October 26 01:03:18 cutoff remain explicit segment boundaries. One statement uses a shared materialized population and eleven aggregate sections, including daily/weekly composition, paths, referrers, kinds/signatures, provenance, repeated-client distributions, transitions, owner marks and migrations. It aggregates daily IDs inside D1 without exporting identifiers. It analyzes all retained events in the window through those dimensions, not every HTTP request ever served.

[Exact SQL](full-interval.sql), [generator](build-full-interval-query.mjs), [sanitized results](full-interval.json), [local-D1 acceptance](full-interval-local.json). Unknown referrer names use private-mapped aliases; R1 was matched against the prior raw capture's exact hostname, without publishing it. Policy remains `2026-09-06.2`, hash `25d4655bd67b0a63e9fc1f59586c6d85f924671024874198a678e8b82a00d7c4`. Inclusion reflects the stored classifications and this pinned reporting policy, not a recreation of every earlier dashboard version.

| Segment | Included | Owner excluded | Referral excluded |
|---|---:|---:|---:|
| Previously missed interval, release to September 27 | 6,431 | 9 | 18 |
| September 27 to original fixed audit cutoff | 8,384 | 0 | 0 |
| Original cutoff to October 26 02:17 | 20 | 0 | 4 |
| Total | **14,835** | **9** | **22** |

The original all-traffic report had 8,385 events at a slightly later calculation time; the fixed cutoff excludes the event observed at 01:03:34 UTC, placing it in since-audit instead. This one-row difference is a boundary difference, not data deletion or a failed reconciliation. Daily, weekly, path and kind sums all reconcile. Daily-ID counts scoped to groups or segments must not be added as a person/whole-period count.

Included composition: **2,425 Browsers; 1,321 Assistants & signed clients; 2,055 Crawlers; 9,034 Automation**. Group codes remain stable, and historical signature-first classifications remain unchanged.

## Comparable complete weeks

UTC Monday through the following Monday, with only complete weeks shown:

| Week beginning | All included | Browsers | Assistants & signed clients | Crawlers | Automation |
|---|---:|---:|---:|---:|---:|
| September 14 | 2,286 | 306 | 62 | 229 | 1,689 |
| September 21 | 2,087 | 259 | 45 | 306 | 1,477 |
| September 28 | 1,860 | 253 | 88 | 278 | 1,241 |
| October 5 | 2,090 | 266 | 329 | 313 | 1,182 |
| October 12 | 1,738 | 168 | 371 | 319 | 880 |
| October 19 | 2,507 | 711 | 351 | 373 | 1,072 |

The last week's Browser count is 2.32 times the first full week's. R1 supplies **388 of those 711 events**. A sensitivity calculation without R1 gives **323 versus 306** (+5.6%), not an accepted exclusion or a corrected count of people. Other repeated/self-generated/unknown activity remains unresolved. October 21's 195 Browser events include 182 in whole-day daily-ID cohorts with at least ten events; the old 180 figure was scoped by referrer host, so these are different aggregations, not contradictory counts.

The missed interval's Browser leaders were `/` (213), `/which-ai-fetchers-send-which-headers` (188), and `/how-i-separate-readers-from-bots-without-javascript` (137). These are page events. HN supplied 28 reported Browser referrals in the missed segment, versus five in the original audit segment. Header claims do not authenticate clicks. Full path/weekly/referrer tables are in the sanitized capture.

## Provenance and transition lessons

- All retained events in this window have referrer categories. Three included early events lack ASN/request-source provenance; zero non-null ASNs fail the proposed integer/range boundary. The later original-audit segment has complete request-source markers. This refines, rather than generalizes, the earlier 30-day result.
- Of 2,365 included internal-referrer events, **1,540** store `/` as source and **89** have no recognized source path. A root URL can be the actual homepage or an origin-only value. Its original source cannot be recovered from this record.
- The pair aggregate contains 2,276 HTML records with known paths, including **925 same-page** records. There are **1,351 different-page pairs**, with repeated requests counted separately. This is not 1,351 people, sessions or complete journeys.
- The only owner mark remains September 9 and covers nine controlled events. It does not cover the owner's later normal browser. Four later referral-excluded events are the labelled Exa/Ahrefs controls. Policy exclusion and authenticated owner coverage are different mechanisms.

## Method, cost and failures

The exact statement is 68,602 bytes, below D1's SQL-size bound. Before production, local D1 checked eleven sections, an inclusive start, exclusive end, owner/referral exclusions, invalid ASN detection and root-source counting. The declared production ceiling was 750,000 reads. The single SELECT used **361,147 metered reads**, **zero writes**, and 451.2705 ms SQL duration. No public report fill was needed for this capture. This cost is separate from the prior 630,169 audit/follow-up reads and the twelve-read classification acceptance.

The first D1 metadata call failed with Cloudflare authentication error 10000 before the aggregate ran. Ordinary `wrangler whoami` confirmed the OAuth account and D1 scope; one subsequent metadata retry and the aggregate succeeded. No credential extraction, new grant or database query retry occurred. Raw metadata, logs, aliases and responses remain private. A metadata failure is not zero data.

## Prospective engineering

[Decision](../../../../../docs/adr/0016.9-observation-provenance-and-referrer-boundaries.md): preserve hostname grouping; keep unsupported forms explicit; omit ambiguous new root source paths; disclose old root ambiguity; validate integer ASN boundaries; add per-observation collection/classifier versions without backfilling old rows. A new unindexed `/owner` form exposes the existing endpoint safely to the actual owner browser. It sends no credential in URLs or bodies, clears the field, stores none in browser storage, and is itself excluded from counting.

Local checks: 59 analytics tests and 106 blog tests pass; workspace typechecks pass. [Local D1 migration/ingestion](field-hardening-local.json) preserves an old row's null versions and checks two new writes through the actual collector: known ASN retained, invalid ASN null, internal root path unknown, both versions set. These are fixtures, not live native vendor verification. [Reproducer](check-field-hardening-local.mjs) runs after compiling analytics tests.

Migration application, source delivery, activation and measured post-release acceptance are separate and will be recorded in the release receipt. No actual owner-browser mark or navigation is claimed before the owner enters the existing credential in that browser. The owner has confirmed they can do so once the page is ready.

Remaining: actual-browser exclusion and paired navigation/beacon trials, native entitlement/retained-log coverage, supported signature-profile acceptance and R1 attribution/reporting policy. Complete retained-data interval coverage does not establish unrecorded-request coverage or authenticate readership.

**Pre-delivery checkpoint:** migration 0010 was the only pending migration and was applied successfully through Wrangler before code publication. The isolated 31-post build caught missing owner-page social metadata and a live-region tag collision with the existing subscription validator; both were corrected and the final build passed. The local browser check exercised rejected and successful fixture credentials, field clearing and the explicit still-pending verification state. RUM comparison filtering now also excludes /owner and descendants.
