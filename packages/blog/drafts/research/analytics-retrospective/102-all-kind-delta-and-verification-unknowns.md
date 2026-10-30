# The next 397 requests: what is known and what still is not

October 30, 2026 UTC. Continues [the last all-kind audit](93-frozen-delta-and-reusable-evidence.md), separately from [the completed-day Browser refresh](100-readership-delta-and-source-concentration.md) and [article-source report](101-article-specific-source-concentration.md). This audit uses Wrangler to select every retained row above the previous exact-ID cutoff through a newly frozen upper ID. It does not select whole history, today's eventual total or requests that never reached storage.

## Coverage is stronger than identity

[The closed census](all-kind-delta-production.json) contains **397 rows**, stored October 29 20:39:23 through October 30 09:38:03 UTC. All 397 are included under the current owner/referral policy. All have current collection/classifier stamps, detailed evidence, recognized Fetch Metadata parsing records and edge-source provenance. That proves retained-field coverage for this selection, not wire completeness, per-request deployed-source identity or classifier accuracy. Zero exclusions does not establish zero unmarked owner/test traffic.

| Stored kind | Events |
|---|---:|
| Unresolved |185|
| Cloud browser |95|
| AI search |41|
| Browser |29|
| Search crawler |17|
| Other bot |14|
| AI crawler |7|
| HTTP client |4|
| AI assistant |2|
| SEO crawler |2|
| Headless browser |1|

These are stored rule outcomes, not identified people. Cloud browser is a network-based category, not proof of an unattended operator. Browser is not a human verdict. Native verified-bot/signed-agent booleans are unavailable for all 397; unavailable is not false or proof that the provider performed no verification.

## The largest unknown is missing context

[The derived explanation](all-kind-delta-explanation.json) finds 185 Unresolved events: 181 Chromium-family claims, one Firefox, one WebKit and two unrecognized browser claims. All lack the retained mode/destination/site/activation scalars, and the current parsing records distinguish absence from unassessed historical fields. Their ASNs are outside the local hosting/archiver lists; that is **not** a vendor-IP mismatch or residential/human authentication.

Of these events, 184 report no referrer and one reports internal navigation. They touch all 33 canonical articles, with 103 article events; 133 occur during October 30 00:00–01:00 UTC and 33 during 06:00–07:00. This defines a concentrated investigation cohort. It does not establish one client, operator, crawl job or intent. No actual daily client IDs are in this export, so it cannot measure client repetition or retention.

The [Fetch Metadata Working Draft](https://www.w3.org/TR/2026/WD-fetch-metadata-20260921/) defines browser request context. Its Sec-prefix protection against web-script modification does not authenticate arbitrary HTTP clients or a human operator. Missing metadata does not establish JavaScript-off traffic. Across this census, 35 requests have a valid true activation claim. [Research 97](97-fresh-automated-fetches-and-measurement-gaps.md) already measured an agent-operated browser with that claim and a Browser outcome. That separately labelled, excluded trial is not added to this population or to the earlier twelve calibration controls. Human trials remain deferred.

## Signed search/SEO is still not human-directed reading

The Exa/Ahrefs repairs remain visible: 29 ExaSearchBot events retain AI-search roles and two AhrefsBot events retain SEO roles, alongside 31 stored local verified outcomes. All 31 have authority-only **request binding**, with UA, method and resource uncovered. Other components can still be signed; authority is not asserted to be the only covered component. None of these 31 proofs is newly recovered or cryptographically replayed here.

[RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html#section-7.2.1) makes coverage and application requirements consequential. Stored verification counts do not establish 31 independent authorized actions, a human trigger, useful reading, citation or indexing. [Cloudflare's Verified taxonomy](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/) also includes provider identity/behavior requirements; our local cryptographic outcome is not its native verdict.

Seventy events have one recognized client declaration. Fifty-four have at least one current configured per-declaration method; sixteen do not. Missing local configuration does not prove the vendor publishes no method. Stored positive facts occur on **52 distinct event rows**: 31 signature outcomes plus 23 published-range matches, with two rows in both groups. These overlapping methods must not be added as 54 independently identified requests, people or operations. The 52 are positive stored checks, not a measured accuracy rate.

## Two Google skips reveal a provenance limit

Of 15 Googlebot declarations, thirteen have stored matches to the common-crawler IP feed. Two are explicitly `not-assessed / refresh-cooldown`; neither is nonlisted, a bad signature or a provider outage verdict. All thirteen listed snapshots have `freshUntil == fetchedAt`, giving no positive recorded reuse interval. Publisher response headers are absent from the selected evidence, so the historical reason for that boundary is not established. Adjacent requests do not prove a shared cache instance.

[Google documents IP-list and forward-confirmed DNS verification](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests). No reverse lookup or reader-address transmission occurs here. Its [experimental signing guide](https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth) describes partial Google-Agent signing at agent.bot.goog. Our method registry already limits that mapping to Google-Agent; this is not a Googlebot signing promise. No brand-wide signing rule is added. Key-cache lifetime and signature expiry remain separate checks.

The maintained [cache-policy diagnostic](../../../scripts/check-vendor-cache-provenance.mjs) compares six labelled conditions in Node and local workerd. Each gets two verifier calls, one second apart, with a fixed clock and explicit synthetic responses. Positive max-age reuses its feed. **Five different causes—no-cache, no-store, private, max-age zero and exhausted Age—produce identical retained first/second projections**, even though their internal storage states differ. Each performs one mocked upstream fetch; the second check remains unassessed under the existing cooldown. Node and workerd agree on all twelve calls per runtime. These are cache-policy labels, not new bot/operator labels or reconstructed Google headers.

[RFC 9111](https://www.rfc-editor.org/rfc/rfc9111.html#section-5.2.2.4) distinguishes validation-before-reuse from storage restrictions. The [native receipt](vendor-cache-provenance-native.json) measures our observability gap; it does not assert universal HTTP-cache conformance or require that ambiguity to persist after a repair. Next bounded implementation: retain a closed cache-policy/reuse rationale with future checks, preserving old records as unknown and keeping skipped membership checks unassessed. Do not fabricate freshness or weaken the cooldown from this experiment alone.

## Reconcile windows before comparing numbers

[Cross-window reconciliation](all-kind-delta-readership-reconciliation.json) matches seven overlapping Browser rows across twelve fields each against the hash-verified earlier capture. This all-kind suffix contains 42 events on late October 29, including seven Browser, and 355 on partial October 30, including 22 Browser. The earlier 86 raw / 84 included Browser rows cover the entire October 29 day. **86 versus 29 is not growth**, and overlapping captures cannot be summed. The rolling readership report deliberately omits October 30's partial day.

## Cost, checks and continuity

Two frozen, single-attempt Wrangler `--command` SELECTs report **794 reads / zero writes**, 397 each. Preflight and export agree on count, exact upper ID, 758,224 selected text bytes and a maximum 2,646 bytes per row. The 1,024-row / 2,000,000-byte limits pass without truncation. Review thresholds are post-execution gates, not server-enforced caps; preflight/export are not one held transaction. The shared assessment keeps its earlier 16:47:57 event reference; a separate canonical-time check against the immediately preceding cohort’s 20:33:06 reference finds no backdated or malformed timestamps among these 397.

The shared native transport/assessment helper passes its existing 64 cases, 17 transport negatives, exact Int64/UTF-8/size controls and per-row/group reconciliation. All 397 rows are independently accounted for in local native D1 assessments. The new six-condition diagnostic and syntax checks pass. Reproduce it after compiling the analytics test modules with `pnpm -C packages/analytics exec tsc -p tsconfig.test.json`, then run `node packages/blog/scripts/check-vendor-cache-provenance.mjs /tmp/new-receipt.json` with a fresh output path. An initial exploratory explanation uses the wrong network enum and stops; it is corrected from the source type without another production read, with both versions/logs preserved.

[Primary source cross-references](all-kind-delta-sources.json) connect the vendor, native, metadata and cache contracts to current code. Runtime collection/classification/verification, UI, exclusion policy, credentials, optional capture settings and article prose/prompts stay unchanged. The only added code is the reusable diagnostic and its fixtures. No own-site HTTP request, new proof replay or human label occurs. All owned local commands are terminal and local runtime disposal is awaited.

The private 70-file archive preserves exact selectors, raw captures, source snapshots, native results and earlier failed exploratory tooling under manifest SHA-256 `0d6fef628964411d409a063c9430be67cc18af9823a2b0e2d663ae3404211079`. October 31 is review, not automatic deletion. This advances the accepted all-kind cutoff; later requests need a separate bounded delta. Whole-history correctness, genuine reader demand, native managed-verifier agreement and the wider goal remain open.
