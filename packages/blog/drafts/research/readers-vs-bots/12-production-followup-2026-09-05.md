# Production follow-up: the browser count still differs substantially

Checked on September 5, 2026 PDT / September 6 UTC through Cloudflare D1, the Web Analytics GraphQL dataset, Wrangler deployment history, and the signed-in dashboard. This is an observational follow-up, not a ground-truth accuracy benchmark. No classifier, production rows, or deployment was changed.

## Fixed comparison window

Use **2026-09-04 00:00:00 inclusive to 2026-09-06 00:00:00 exclusive, UTC**: two complete days after the September 3 deployment. Do not include the current partial UTC day or mix in pre-evidence rows.

| UTC day | All eligible D1 page observations | UA-browser class | Stored Browsers views | Web Analytics page loads, bots excluded and `/stats` removed | Browsers / script |
|---|---:|---:|---:|---:|---:|
| September 4 | 275 | 224 | 49 | 7 | 7.00 |
| September 5 | 192 | 148 | 46 | 7 | 6.57 |
| Total | 467 | 372 | 95 | 14 | 6.79 |

The classification reduces the UA-browser population by **277/372 = 74.5%**. That establishes classification impact, not accuracy. Comparing the old UA class with the same script window gives 26.57×; the current stored Browsers class gives 6.79×. These are same-window counterfactuals, not a comparison to the article's older eleven-to-one week.

Web Analytics returned 16 non-bot page loads, including two `/stats` loads on September 4. D1 explicitly excludes `/stats`; removing those gives 14. Every retained RUM path is a valid public page; all retained rows report navigation type `navigate`. All 95 D1 browser-class rows served HTML. Every returned RUM group has `avg.sampleInterval = 1`. With Cloudflare-flagged bot loads included, there are 16 eligible-path RUM loads, giving 95/16 = 5.94×; the gap is not explained by that filter alone.

Limitations: the RUM query does not independently establish human visits or match requests row by row. Script blocking, failed beacon delivery, cache behavior, different eligibility, and undetected automation remain possible differences. Owner exclusion is incomplete: `owner_clients` is empty, and none of the browser rows in this window is marked `is_owner`. Two September 4 browser rows use AS62887, previously observed for the author; the ASN alone cannot establish that they are the author. Do not silently subtract them. Daily clients and visits are different metrics and are not used for the ratio.

## Which evidence changes the count

Within the fixed 372-row UA-browser population, cross-tabulate stored hosting classification and the literal navigation predicate (`navigate`, `document`, accepts HTML, has language):

| | Navigation-shaped | Fails navigation predicate | Total |
|---|---:|---:|---:|
| Stored `cloud-browser` | 60 | 123 | 183 |
| Other stored kinds | 95 | 94 | 189 |
| Total | 155 | 217 | 372 |

Requiring the navigation shape alone leaves 155; excluding stored cloud-browser rows alone leaves 189; combining these predicates leaves 95. The intersection of the two exclusion signals is 123. This is a predicate ablation over recorded evidence, not a replay of every branch of the TypeScript classifier. D1 does not retain the original User-Agent needed to re-evaluate browser-version gates.

The network signal still contributes independently: **60 requests carry the complete navigation shape but are classified as cloud browsers**. A particularly clear cluster consists of 34 Google Cloud requests, one daily-client identifier, 32 paths, from `2026-09-05 07:25:00` through `07:25:01` UTC. All four navigation checks pass. The burst is strong behavioral evidence of automation; hosting identity alone is not the ground truth.

## A repeated client remains inside Browsers

**22 of 95 browser views (23.2%)** are on AS17638 with referrer `uniuit.com`: 12 on September 4 and 10 on September 5, one daily-client identifier on each day. They alternate between the homepage and post 023, usually as close pairs separated by longer intervals. Every row carries `Sec-Fetch-Site: none` despite the external referrer. This extends the cluster already recorded in post 023's `08-metrics.md`; it is not a newly discovered identity.

The timing and repeated page pair support a polling/automation hypothesis. They do not authenticate the referrer or prove who operates it. Do not fetch the referrer and treat its content as proof of request origin. Do not link identifiers across UTC days as if D1 established cross-day identity.

Sensitivity calculation only: removing all 22 would leave **73/14 = 5.21×**. This cluster therefore cannot explain the whole discrepancy. No rows were removed.

## Signed requests have arrived

Between the evidence cutover and September 6 00:00 UTC, the production verifier recorded:

| Verified signer origin | Requests | Context |
|---|---:|---|
| `https://assistbot.duckduckgo.com` | 2 | September 3; these align with deliberate post-deployment tests in post 023's probe record, not independent audience discovery |
| `https://crawler.exa.ai` | 2 | Post 023 on September 3 and the Bun issue on September 5 |
| `https://ahrefs.com` | 5 | September 4–5; includes post 024 itself |

Two additional DuckDuckBot requests were stored as unverified with `malformed-signature-agent`. Nine verified requests is a stored production result, not an independent re-verification of saved signatures. Original signatures are not retained in D1.

Article 024's claim that no signed request has arrived is now false. Its taxonomy also conflates verified identity with user-directed purpose: all signed requests become `signed-agent`, and the public page puts that kind under AI agents. A signature establishes a signer under the verifier's checks; it does not establish that a person requested this fetch. Ahrefs and Exa require purpose evidence before being described as assistant readership.

## Deployment and migration are different boundaries

Wrangler reports the latest Worker deployment at **2026-09-03 06:49:05 UTC**, version `6b353593-53d8-41ba-b5ab-3a79de332845`. Migration 0008 ran later, at **2026-09-04 18:30:09 UTC**. It recorded 38 revisions: 18 browser → cloud-browser, 19 browser → preview-or-feed, and one legacy-browser → cloud-browser.

The local owner-marking code and expanded network list postdate that Worker deployment. The deployed read path must not be assumed to include local changes merely because migration 0008 exists. The fixed window contains reclassified historical rows as well as later ingestion. No rows on the eight newly added hosting ASNs or Internet Archive ASN arrived between migration 0008 and the window end, so this sample cannot test whether the older deployed ingestion would classify those future requests correctly. The empty owner table is also not evidence that owner exclusion works.

## Article and experiment consequences

1. Replace the proposed under-two calibration claim with the measured two-day comparison and its limits. Keep the fourteen-day comparison open; do not interpret 6.79× as a measured bot fraction.
2. Show the 372 → 95 reduction beside the 95 versus 14 disagreement. Both results belong in the article.
3. Use the 34-request cloud burst and the 22-request residential-network cluster as paired cases: a pattern the current partition separates and a pattern it admits.
4. Correct the no-signatures claim and separate signer identity from purpose.
5. Prioritize controlled browser/automation trials and matched beacon-delivery experiments. The remaining question is how much of the discrepancy is undetected automation versus collection loss; aggregate counters cannot settle that.

## Reproduction and evidence

- `12-production-followup.sql`: eleven read-only statements; results in `12-production-followup-results.json`, with the database query timestamp. The collection run verified every statement reported zero rows written. For result rows, execute the file's SQL through Wrangler `--command` (strip leading SQL comments); `--file` runs the read-only statements but returns an execution summary instead of their result sets.
- `12-web-analytics-results.json`: exact GraphQL query and response for the fixed window, host, and bot filter, including per-group sample intervals. Credential not included.
- Additional transient diagnostics, including the exact 22 request timestamps, are in `/tmp/readers-bots-20260905/` on the author's machine. No IP addresses or daily-client identifiers are included in the repository artifacts.
- Raw-log REST access with the current Wrangler OAuth credential returned HTTP 403 / code 10000. D1 and RUM API access succeeded. The signed-in Chrome dashboard provided raw-log access without changing permissions.

These are author-accessible first-party measurements with public aggregate exports, not public access to the private Cloudflare account and not a certified ground-truth dataset.

## Raw-log corroboration: Android WebView in the repeated-referrer cluster

In the Worker Observability dashboard, searched `uniuit.com` over the same exact UTC window (displayed as September 3 17:00 through September 5 17:00 PDT). The chart showed 22 successful events and zero errors. The event list warned that results may be incomplete; do not use its displayed row count as a complete log export. The independent D1 query remains the source of the 22-row count.

Inspected the event at **September 5 09:15:10.998 PDT / 16:15:10.998 UTC**, `GET /which-ai-fetchers-send-which-headers`, matching the D1 row at 16:15:10. The raw User-Agent was:

```text
Mozilla/5.0 (Linux; Android 12; redroid12_arm64 Build/SQ1D.220205.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.119 Mobile Safari/537.36 uni-app
```

The raw Fetch Metadata was:

```http
sec-fetch-dest: document
sec-fetch-mode: navigate
sec-fetch-site: none
sec-fetch-user: ?1
```

[Redroid's own documentation](https://github.com/remote-android/redroid-doc#overview), checked September 6 UTC, describes Android instances on Linux hosts using Docker, Podman, or Kubernetes, with virtual phones and automation testing among its uses. The declared `redroid12_arm64` token plus the repeated page-pair behavior strengthens the automation interpretation. This is still a declared UA, not remote attestation; manual use of a virtual phone is also possible. One inspected event does not prove that every event in the cluster carried that UA.

This observation gives a concrete controlled experiment: compare real-device WebView navigation with a Redroid/WebView session, manually and automatically driven, and measure edge shape, beacon execution/delivery, and classification. Preserve environment provenance independently of the UA. Do not add a universal Redroid-exclusion rule based on this one inspection.
