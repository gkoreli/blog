# Substantial client uncertainty remains in the current reports

November 5, 2026 Pacific / November 6 UTC. Goga asked whether unknown clients, unsigned hosting clients, uncertain browser signals, unsigned bots and unidentified AI crawlers remain substantial. The fresh public reports support that concern, with separate boundaries for missing names, missing signatures and unknown operators. This is a new aggregate investigation, following [the historical all-kind census](102-all-kind-delta-and-verification-unknowns.md) and [the later unsuccessful refresh](124-retained-agent-reach-delta.md).

## Fresh scope and counts

Two public `/api/stats` GETs return HTTP 200 and `X-Stats-Cache: HIT`. The seven-day report covers October 31–November 6 UTC, with November 6 partial; its calculation time is **November 6 at 05:42:48.678 UTC**, or November 5 at 21:42 Pacific. Capture is at 05:54:44 UTC. The thirty-day report covers October 8–November 6 and was calculated at 05:42:28.713 UTC. These overlapping rolling windows are not a growth comparison.

[Aggregate receipt and body commitments](2026-11-06-unknown-client-summary.json) preserve the returned report fields used below. Counts are included stored events, not unique clients, people or every edge request. Each facet has its own meaning; rows in this table overlap.

| Evidence | Seven-day events | Share of 3,960 | Thirty-day events, out of 12,004 |
|---|---:|---:|---:|
| No recognized client declaration | 2,810 | 71.0% | 9,300 |
| Unresolved request evidence | 836 | 21.1% | 1,266 |
| Hosting-list matches | 689 | 17.4% | 2,816 |
| Browser signals | 571 | 14.4% | 1,889 |
| Other bots | 622 | 15.7% | 1,556 |
| AI-crawler declarations | 164 | 4.1% | 634 |
| Explicitly absent signature headers | 3,250 | 82.1% | 5,191 |

The unnamed count is independently reproduced as total events minus the named `byAgent` table and as `vendorNetwork.noDeclarationViews` in the seven-day report. It means no catalogue-recognized declaration, not an unknown operator verdict: 73 events without such a declaration have verified signing outcomes. The thirty-day report contains substantial earlier missing verification detail; its 4,984 `not-recorded` events cannot be called unsigned.

## What remains unknown

**Unresolved is substantial and mostly missing context.** Of 836 events, 602 have a supporting browser-version claim but absent Fetch Metadata, 168 lack a recognized browser-family claim, 65 have unresolved browser/version support with absent metadata, and one has conflicting referrer/context claims. All 836 explicitly lack signature headers. Missing browser context alone cannot establish AI use or automation.

**Hosting infrastructure remains easier to identify than its clients.** All 689 hosting-list events lack signature headers. The largest stored matches are Tencent AS132203 (183), Google Cloud AS396982 (172), Hetzner AS24940 (95), OVH AS16276 (68), and Contabo AS51167 (68). Those providers do not identify the software, customer or initiating party. The [network rule](../../../../analytics/src/networks.ts) added AS7979 prospectively on November 5; the report retains earlier stored classifications and does not expose their classifier-version distribution.

**Browser signals remain operator-unknown.** All 571 are unsigned, but ordinary browser navigation is not expected to authenticate itself through bot signatures. The label describes a recognized browser claim, navigation shape and network-list nonmembership. [The October 30 production controls](113-fresh-current-production-calibration.md) put all nine agent-operated browser visits in Browser signals. That proves a limitation of human inference; it does not measure automation prevalence among these 571 events.

**Generic bots still lack useful names.** Other bots contains 620 generic-token events and two GoogleOther declarations. Of all 622, 618 explicitly lack signature headers and four have a local result that is not verified. The API does not join those four outcomes to their failure reasons, so no per-kind invalidity cause is claimed.

## AI evidence is stronger than a blanket unknown label

The 164 stored AI-crawler events all lack signatures, but have declared names: Amazonbot 64, PetalBot 53, Bytespider 16, ClaudeBot 13, GPTBot 12 and Meta-ExternalAgent six. Names are declarations; unsigned does not mean nameless, nor does it exclude a published-IP match. The seven-day report separately contains 461 positive vendor-range matches and 697 locally verified signatures. Their overlap is not available here, so they are not added into a unique verified-event total. [Cloudflare's current verification documentation](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/) also recognizes IP-based verification alongside Web Bot Auth.

There is evidence of AI-related traffic outside the named AI buckets. Ten Other-bot events carry Cloudflare's `AI Crawler` category, and two carry `AI Search`. Because only two Other-bot events have any recognized client declaration, **at least eight of those ten AI Crawler-category events lack a recognized name**. This is a conservative inference from aggregate set counts, not an exact row join or authenticated operator determination. Thirteen Unresolved events also carry `Search Engine Crawler`, which does not specifically establish AI use.

All 697 detailed verified signatures leave User-Agent unsigned; 693 have authority-only request binding and none bind the resource. Those stored checks authenticate covered components against keys, not the declared client name, user, reading, citation or purpose. This boundary does not require every ordinary browser or bot to implement signing.

Native verification booleans are unavailable on all 3,960 events. Separately, provider categories are known on 1,373 and explicitly empty on 2,587. The [category reader](../../../../analytics/src/native-bot-evidence.ts) uses top-level `cf.verifiedBotCategory`; the [boolean reader](../../../../analytics/src/signature-evidence.ts) uses `cf.botManagement`. Their different availability is not inherently contradictory, and unavailable booleans are not false verdicts.

## Decision and next bounded action

The identity gap is real and large. Its size does not establish that most unknown traffic is AI or malicious. Missing declarations, missing signatures, generic role signals and missing human/operator evidence need separate measures.

The next useful investigation is a bounded retained-row reconciliation of the 620 generic-token events against their existing provider categories, names, verification outcomes and collection/classifier versions. Other bots already contains 100 SEO-category, 36 preview-category, 30 archiver-category, 25 search-category, ten AI-crawler-category, seven monitoring-category and two AI-search-category events. Preserve those independent facts before deciding whether catalogue coverage or presentation should change. A separate native-field access check can diagnose `botManagement` availability against existing account evidence; this report establishes neither the cause nor a repair.

This requested aggregate diagnosis is complete. TASK-0119 and its broader identity/purpose requirements remain open; no runtime change or new calibration is accepted here.

## Method and evidence limits

Offline arithmetic checks reconcile both reports' kind, signature, provider-category, time-series and path partitions to their respective totals. The seven-day verification, vendor-network and Fetch Metadata records have no earlier missing-record remainder. The windows still span collection/classifier revisions and a partial current day. Owner exclusions and the existing referral policy apply; zero referral exclusions in the seven-day report do not prove absence of unmarked owner traffic.

There are two successful cache-hit report GETs, zero direct production SQL statements and no controlled page visits. Request headers are `User-Agent: gkoreli-analytics-evidence/1.0` and `Sec-Purpose: prefetch`. The first sandbox attempt failed DNS resolution before an HTTP response; authorized network access then succeeded. Cache responses expose no D1 meter, so no numeric read-cost claim follows. No protection, credential, collection, schema, classifier or article change occurs. This observes served reports; it does not certify per-request source identity or reproduce every stored proof.

Raw responses, headers and capture metadata stay in `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-11-06-unknown-clients/`. The six-file private manifest has SHA-256 `c048ea7480869a7a40570f025414f2ab99b35772f680da9c3fd3e2b77e930627`. The committed receipt contains selected aggregates and raw-body hashes, excluding raw headers, referrer hosts and observation-level data. Documentation delivery and later build activation are separate from this measurement; no deployment acceptance is claimed.
