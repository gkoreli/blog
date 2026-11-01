# A fresh day of stored traffic: 72 verified signatures still left the page unsigned

November 1, 2026 UTC / October 31 Pacific. Follows [the frozen complete-day plan](10-live-data-plan.md). These findings come from a fresh Wrangler export of production D1 observations, followed by offline analysis of those exact rows. They are separate from [the new browser trials](07-live-trial-plan.md), which start after this selected UTC day.

## What the production selection contains

The accepted export contains **628 stored observations** dated October 31, 2026 UTC. Preflight and export agree on the count, exact ID bounds, **1,214,734 selected UTF-8 text bytes** and the maximum row size. Both statements stayed inside the frozen limits; neither was retried. Capture completed at `2026-11-01T00:31:23.203Z`.

The common owner/referral assessment includes all 628: **zero owner exclusions, zero referral exclusions and zero unassessed rows**. That is a policy result, not proof that every request was organic or that no unmarked experiment remains. The export contains no raw IPs, User-Agents, daily-client IDs or diagnostic payloads. Exact row references and referrer strings remain private.

| Resource role | Included stored events |
| --- | ---: |
| Canonical articles | 447 |
| Public prompt/evidence pages | 51 |
| Hubs and other registered site pages | 130 |
| Unmapped | 0 |

The 447 article events cover all **39 registered article paths**. The 51 evidence events cover the public prompt pages attached to **20 articles**. These are useful, separate reach observations: supporting research pages receive requests too. They do not establish that a requester read, understood or applied the work.

Resource relationships come from the prior accepted isolated 39-post publication catalogue, using its explicit `url` and `prompts` fields. The shared main checkout's old 33-post `dist/posts.json` was inspected and rejected as stale for this analysis. Catalogue labels describe that accepted snapshot; they do not reconstruct historical titles or establish equal publication exposure.

## The signature limitation is visible in actual recent records

**72 of the 628 records retain a recognized local verified outcome and recognized coverage details.** They divide into 63 Exa-origin results carrying the ExaSearchBot declaration and nine Ahrefs-origin results carrying AhrefsBot. All 72 record coverage of the destination authority. None records coverage of method, path, query, target URI, User-Agent or body digest.

This is authority-only **request binding**. Other message components can still be signed; authority is not asserted to be the sole line in every signature base. A successful stored result therefore does not authenticate a particular requested article or the unsigned client declaration by itself. The Exa rows retain an AI-search classification; Ahrefs retains an SEO-crawler classification. The signed flag does not turn both roles into an assistant conversation.

The positive outcomes span three recorded verifier profiles:

| Recorded verifier profile | Recognized verified events |
| --- | ---: |
| `2026-10-31.1` | 22 |
| `2026-10-31.2` | 32 |
| `2026-10-31.3` | 18 |

These are freshly retrieved **stored verification outcomes**, assessed for consistency using current shared code. The selected original signed packets were not recovered or independently replayed in this lane. Do not describe these 72 as a new cryptographic replay or 72 newly authenticated user actions. No unverified outcome is stored in this selection; that observed zero does not establish universal verifier reliability or new-draft compatibility.

The other **556 records retain absent-signature outcomes**. Both managed-provider verification booleans are unavailable in all 628 records. Missing native values are not false, a disagreement with local verification, or evidence that Cloudflare performed no verification elsewhere.

## Browser-shaped access remains a large part of the unknown

| Stored kind | Events |
| --- | ---: |
| Unresolved | 173 |
| Cloud browser | 167 |
| Browser | 122 |
| AI search | 93 |
| Other bot | 30 |
| AI crawler | 20 |
| SEO crawler | 9 |
| Search crawler | 7 |
| HTTP client | 5 |
| AI assistant | 2 |

The 122 Browser outcomes are not 122 people. The 167 Cloud browser outcomes describe the stored network/rule evidence, not authenticated unattended operators. The separate real-browser trial can test one known automated operator; it cannot label this entire retained population.

All 628 rows retain collection/classifier stamps, edge-source provenance and HTML/Markdown representation. The classifier changes within the day: 260 records carry `.29.3`, and 368 carry `.31.1`, while collection is `.30.1` throughout. Of the events, 599 are HTML and 29 are negotiated Markdown. These retained method records make comparisons more inspectable; they do not guarantee stable rules or make a mixed-method day suitable for a normalized growth rate.

## The reference and follow-up already have separate access

| Resource | Article events | Separate prompt-page events |
| --- | ---: | ---: |
| Original AI-fetcher study | 18 | 1 |
| First published version of this follow-up | 8 | 3 |

The original study's 18 canonical events contain four ExaSearchBot declarations, two Meta-WebIndexer, one OAI-SearchBot, one AhrefsBot and ten unnamed records. Five retain verified outcomes: four Exa-origin results and one Ahrefs-origin result. Its stored kinds are seven AI search, one SEO crawler, three Browser, four Cloud browser and three Unresolved.

The follow-up's eight canonical events contain one ClaudeBot declaration and seven unnamed Cloud browser outcomes; all eight have absent-signature outcomes. Its three prompt-page events remain separate. The follow-up was published partway through the day, so eight versus eighteen is not a fair article-preference ranking.

This is fresh positive evidence of access to the publication and its working material. The separately checked Arcjet citation establishes a stronger, different outcome: another technical publisher uses the original capture to teach a signature distinction. Neither outcome needs a proved human visit before it can matter.

## Keep the older 397-row capture separate

[Research 124](../analytics-retrospective/124-retained-agent-reach-delta.md) analyzes a 397-row selection from October 29 20:39:23 through October 30 09:38:03 UTC. Its 243 article, 68 evidence-page and 86 site events remain valid observations under that selection's method. Today's selection is a complete different UTC day, with a larger/newer catalogue and a different method mix. **397→628 is not a growth rate**, and 68→51 is not evidence that interest in process pages fell. Do not add reports or convert unequal windows into a trend.

The improvement is a fresh, bounded view with exact retrieval and accounting, alongside actual independent technical reuse. A normalized growth claim still needs comparable windows, method history and exposure.

## Checks, costs and preservation

- Two production SELECTs acknowledge **629 + 1,257 = 1,886 reads**, zero writes, no database change and one attempt each. The parent's prior constant access control costs zero reads; metadata, dashboard, normal ingestion and other work are additional.
- Current source APIs were bundled from **47 source inputs**, with every generated `.test-dist` import replaced by its current TypeScript source. Five imported CLI entry guards were removed solely to expose the existing offline APIs. Source hashes matched before and after analysis.
- Current native D1 inclusion/signature/network assessments reconcile per row and in grouped results. All 628 retained network assignments are assessed consistent by the shared assignment checker; this is retained-field consistency, not authenticated identity or accuracy.
- A separate pure-JavaScript referral assessor agrees with the SQL decision on all 628 records. Independent resource-map arithmetic reproduces 447/51/130, stored-kind totals, signature scalars, coverage counts and native unavailability. Input bytes remain unchanged.
- Offline reconstructed-D1 analysis acknowledges 141,163 local reads and zero writes. These are additional local processing meters, not production query cost or distinct events. Synthetic replacement client keys are used only to reproduce the exported owner-existence flags in the private analysis relation; no client, retention or people metric is computed.
- The first bundle attempt detected a leftover `.test-dist` input and stopped. Its script is retained; the resolver was widened to cover relative fixture imports before accepting the fresh-source bundle. Initial unreviewed local analysis failed on loopback permission before SQL; the reviewed local run completed. Failed invocations, raw export, frozen SQL, source manifest and processing receipts remain outside Git.

[Minimized public findings](live-day-findings.json) preserve the counts, method partitions, source commitments and query meters. Private capture commitments include export SHA-256 `88c264a201fca46942f172a70bdae7d303e7716ce4e52da9b57e2980cca26d40`, selected-row SHA-256 `be1adcf8bed0f0525da6ba504a45eb337d158a2ecef61d520e88c9fa631b3bdf` and accepted catalogue SHA-256 `a1b96d127130bfc7b7c41a5cc462290d71509dc3b00cec170279fa2f4463226b`. The public result contains no observation IDs, operation IDs, reader addresses, private referrer hosts or raw request payloads.

No runtime, classifier, query scope, exclusion policy, capture binding or production record was changed by this analysis lane. Human count and growth rate remain null. The parent's live assistant observations and article revision have their own acceptance work.
