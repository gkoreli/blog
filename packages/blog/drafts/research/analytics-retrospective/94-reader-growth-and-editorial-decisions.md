# What the traffic can tell us to write next

October 29, 2026 UTC. The owner asks who reads, whether readership grows, what people search for and where to develop expertise. Better bot diagnostics have not yet supplied those answers. [ADR-0016.1](../../../../../docs/adr/0016.1-analytics-purpose-and-decision-loop.md) already requires analytics to support editorial decisions; this audit returns to that purpose.

## The apparent doubling depends on one source

The screenshot totals 1,551 visible referrer events but shows no date/filter. This separate audit covers **four complete UTC weeks, October 1–28**: all 1,463 retained stored-Browser rows, 1,429 after 34 owner exclusions. These are rule matches, not identified readers. There are no referral-policy exclusions in this selection.

| UTC dates | Browser signals | R1-reported source | Other sources |
|---|---:|---:|---:|
| October 1–7 | 235 | 0 | 235 |
| October 8–14 | 253 | 2 | 251 |
| October 15–21 | 312 | 7 | 305 |
| October 22–28 | 629 | 388 | 241 |

The last week doubles the recorded total. Setting R1 aside changes the last comparison from **312→629 to 305→241**. The remaining series is broadly flat across the month. Neither comparison establishes human growth or decline: rules changed October 26–27, and unattended clients can match Browser. R1 remains included under the reporting policy; the second column comparison is sensitivity analysis, not a corrected readership count.

Of 1,429 events, **624 send no referrer, 328 are internal navigation and 477 report external hosts**. R1 contributes 397 of those 477 external events. Familiar approved hosts account for Google 12, X nine, GitHub four, Hacker News four and Kagi two; an additional GitHub Gist event is retained privately. The small recorded referral totals do not bound those platforms' actual contribution. Missing referrer means unavailable attribution. Internal navigation is not new acquisition. “Other reported referrers” is a display-approval bucket; it does not mean the underlying hostname is missing or that the traffic is untrusted.

## Rank articles after inspecting concentration

| Article | All events | Outside R1 | Interpretation |
|---|---:|---:|---|
| ChatGPT plugin apps | 133 | 42 | Most remaining events are internal (27); 20 repeated same-day client/page requests occur across the full article cohort. Two Kagi-reported events, no established search demand. |
| OSS Radar 02: toolchain | 116 | 13 | The high rank depends on R1; do not choose a sequel from this count. |
| AI-fetcher headers | 67 | 63 | Least dependent on the spike among these leaders; 51 events have no referrer. A useful provisional reference topic, not authenticated human interest. |
| GHX origin | 56 | 19 | Three GitHub-reported events over two days suggest a specific tool audience. |
| Bot detection without JavaScript | 53 | 37 | Five Google/X/Hacker News-reported events across five days; broader visible discovery than several higher-ranked articles. |

Home and section hubs are excluded from this article table. Publication ages differ. Counts measure deliveries, not useful reading, completion, adoption or approval. Daily pseudonyms can expose repeated same-day client/page requests; they cannot establish distinct people or return readers across days. The source audit and exclusions are preserved in [the closed results](audience-audit-production.json).

A fresh aggregate-only subscriber query finds **one current active subscription; zero active records created or last confirmed in October 1–28**. It selects no emails, addresses, tokens or other direct identifiers. Current status/latest timestamps do not reconstruct deleted records, all confirmation actions or article attribution. This supplies no evidence that the spike built a continuing subscriber audience.

## Editorial decision and next bounded work

**Develop practical expertise in how agents interact with real software: fetching, native application tools, shared state and failures that can be reproduced.** This fits the existing work and a provisional concentration-resistant signal. It is an editorial hypothesis, not a market-demand measurement. The evidence does not establish Goga as an orchestration-framework vendor or justify abandoning other publication subjects.

1. **First, review the AI-fetcher reference for a dated update.** Its original September 3 captures are dated evidence. Cross-reference the later signing/coverage and ambiguity findings; identify claims that need narrowing. New current behavior requires fresh labelled tests. Prefer improving the useful reference to publishing another overlapping analytics retrospective.
2. **Then test one concrete native-app workflow article.** The existing plugin-app article proposes an evidence workspace and a format-specific editor. Choose one small task, demonstrate operation/conflict/undo/save behavior and compare with the current workflow. The traffic supports a bet worth testing, not a proven acquisition winner. No new app or article is claimed here.
3. **Use Search Console before choosing search-driven expansions.** The Google account is signed out in the in-app browser; owner sign-in is pending. Compare the latest complete 28-day window available there with the preceding 28 days, retaining the actual endpoints and preliminary-data flags. Inspect query/page pairs for the fetcher, bot-detection and plugin-app pages; separate branded from problem queries and record clicks, impressions, CTR and position. Do not invent search terms from page titles or HTTP referrers. An unavailable/private query is not a zero-demand query. [Google's report documentation](https://support.google.com/webmasters/answer/7576553).
4. **Make the next reporting change answer these decisions.** Add an article-only view with completed-week comparisons, article age, internal versus external versus unattributed events, dominant-source share and an explicitly chosen source sensitivity. Keep display approval separate from authenticity. Link query evidence and reader corrections/confirmed following where available. Accept it against the frozen rows and a native metered/cache plan; no broad new tracking or production UI change is included in this audit.

Judge each editorial trial after its first seven and 28 complete days, with exact UTC endpoints, source concentration, search query evidence and concrete replies/corrections/use where available. Prefer one useful correction or tested continuation over a schedule generated from a noisy leaderboard. [Google's people-first guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) supports audience focus and firsthand evidence, not a promised ranking gain.

## Evidence and limits

The [audience helper](../../../scripts/audience-audit.mjs) and [native checks](audience-audit-native.json) cover 13 cases, 12 transport negatives and a 32,768-row fixture with 4,096 selected rows. The original helper chose the largest host without display approval; the final helper requires an explicit sensitivity host. A display-policy-change control proves that approval cannot silently change that cohort. [Reanalysis](audience-audit-reanalysis.json) preserves every existing count from the same frozen production rows; no repeat production export was needed.

Two one-attempt browser-data SELECTs cost **17,548 reads**; the separate subscriber aggregate costs **three**. Both have zero diagnostic writes. Including [Research 93](93-frozen-delta-and-reusable-evidence.md), this slice totals **17,745 reported reads over five statements**. No own-site traffic, human labels, runtime changes, new collection, public source approval or article revision occurred. [Sources](audience-audit-sources.json) and [subscriber native controls](audience-newsletter-native.json) preserve the method. Raw hosts, daily IDs and captures remain private under hashed manifests; October 31 is a review date, not automatic deletion.

The wider goal remains open. Search terms, sustained readership, R1 operator/trigger, human/device accuracy and native managed-verifier agreement have not been established. Human-operated trials remain deferred. The next useful dependency is authenticated Search Console evidence; the prepared source-aware brief is usable now.
