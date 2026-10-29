# @gkoreli/analytics

Edge-observed, cookieless page analytics for gkoreli.com, running in a Cloudflare Worker with D1. This README describes the repository implementation and its known limitations. The article [Bot Detection Without JavaScript: What My Blog Measured](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript) explains the measured results. Analytics decision records live in [docs/adr](../../docs/adr/). Deployment and migration activation must be checked separately from repository code.

One runtime dependency: pinned `ipaddr.js` 2.5.0 for published-range verification. MIT.

## What a row is

One observation is scheduled per eligible successful, non-prefetch `GET` that served a page as HTML or as the page's negotiated Markdown twin (`eligibility.ts`). The dashboard, assets, API routes, feeds, redirects, errors, and direct requests to `/<slug>.md` do not count. Scheduling with `waitUntil` is not a guarantee that a database write succeeds. Rows retain selected evidence and derived values alongside a classification:

| Column | Evidence |
|---|---|
| `asn`, `as_org` | Autonomous system of the client IP, from Cloudflare's request metadata |
| `sec_fetch_mode`, `sec_fetch_dest`, `sec_fetch_site`, `sec_fetch_user` | Fetch Metadata request headers, NULL when absent |
| `accepts_html`, `has_accept_language` | HTML acceptance for UTF-8 HTML using media-range quality and specificity; whether a nonempty `Accept-Language` is present |
| `agent_name`, `traffic_class` | Named User-Agent rule match (`classify.ts`) and its class |
| `signature_agent`, `signature_status` | Verified signer origin and local status. Current failure reasons/outcomes live in `signature_evidence`; `reader_reason` preserves the role/rule. Earlier records can lack failure detail. |
| `representation` | `html` or `markdown`, the representation served |
| `reader_kind`, `reader_reason` | One kind from the closed set below and one reason, assigned at ingestion (`readerkind.ts`) |
| `asn_source` | Migration 0007 assigned `request` or `zone-sample` to applicable existing rows. New writes record `request` when an ASN is supplied, otherwise NULL |
| `daily_client_id` | HMAC over site, UTC date, IP, and User-Agent; raw IPs and full UAs are not stored in D1 page observations |

Cloudflare Worker logs/traces, client-error collection, and RUM are separate operational collections. The D1 field list is not a description of all telemetry retained by the site or Cloudflare. A daily identifier is not a person, visit, or cross-day identity.

## The reader kinds

Fourteen kinds, one per row, derived from the available request evidence (`contracts.ts`, `READER_KINDS`). The public stats page groups them into five disjoint filters that add up to All (`READER_GROUPS`). These are deterministic rule outcomes, not authenticated statements of human activity. Since the October 26, 2026 UTC catalogue repair, recognized declared roles survive signature verification. Signer evidence is reported independently in `bySigner`. The `agents` filter is labelled Assistants & signed clients and retains historical/unknown-role signed rows without rewriting them. A declared role remains a claim, independent of signature coverage or human intent.

| Group | Kind | Condition | Reason recorded |
|---|---|---|---|
| Assistants & signed clients | `signed-agent` | Historical or unrecognized-role Web Bot Auth signature verified against the signer's `/.well-known/http-message-signatures-directory` | the signer origin |
| Assistants & signed clients | `ai-assistant` | named on-demand fetcher: ExaUser, ChatGPT-User, Claude-User, Perplexity-User, Meta-ExternalFetcher, MistralAI-User, DuckAssistBot, Amzn-User, Google-Agent, Google-GeminiNotebook | the agent name |
| Crawlers | `ai-search` | ExaSearchBot, OAI-SearchBot, Claude-SearchBot, PerplexityBot, MistralAI-Index, Amzn-SearchBot, Meta-WebIndexer, Applebot | the agent name |
| Crawlers | `ai-crawler` | GPTBot, ClaudeBot, MistralAI-Training, Meta-ExternalAgent, Amazonbot, CCBot, Google-CloudVertexBot, Bytespider, PetalBot, Cohere-AI | the agent name |
| Crawlers | `search-crawler` | Googlebot, Bingbot, DuckDuckBot, YandexBot, Baiduspider | the agent name |
| Crawlers | `seo-crawler` | AhrefsBot, AhrefsSiteAudit | the declared client name |
| Crawlers | `preview-or-feed` | FacebookBot, LinkedInBot, Slackbot-LinkExpanding, Slack-ImgProxy; or an unnamed request from an archiver network | the agent name or `archiver-asn:<asn>` |
| Automation | `headless-browser` | `HeadlessChrome/`, `Cypress/`, `Lightpanda/` in the User-Agent | the token |
| Automation | `other-bot` | other bot-class matches, including Meta-ExternalAds, OAI-AdsBot, general Slackbot and generic tokens | rule name or `generic-bot` |
| Automation | `cloud-browser` | browser User-Agent from a network in `networks.ts`, checked before request shape | `hosting-asn:<asn>` |
| Automation | `http-client` | recognized browser-engine claim with a present recognized Fetch Metadata mode whose request is not navigation-shaped | `not-navigation-shaped` |
| Automation | `legacy-browser` | historical pre-repair classification, retained but no longer emitted by current rules | original historical reason |
| Browsers | `browser` | navigation-shaped request with an available, unlisted ASN; or a historical beacon/pre-evidence row | `navigation-shaped-network-unlisted`, `beacon-script-ran`, `user-agent-only` |
| Unresolved | `unresolved` | missing network/shape evidence, incompatible declarations, or inconsistent referrer signals | closed reason from `readerkind.ts` |

Order of evaluation: multiple declarations, named roles, headless tokens, archiver network for unnamed requests, bot class, beacon/pre-evidence cases, hosting network, recognized engine/context, request shape and available network evidence. A verified signature preserves a recognized named role; otherwise it selects the signed-client fallback. An unverified result preserves the rule's kind; failure causes are stored separately. No historical reclassification or schema migration accompanies these repairs. The hosting network runs before shape because, in a three-day sample of the site's raw logs, the largest single cluster (374 of 844 page loads) was navigation-shaped traffic from Google Cloud that passed every header check.

The implemented navigation predicate requires `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, `accepts_html = 1`, and `has_accept_language = 1`. `Sec-Fetch-Site` is recorded but not restricted; `Sec-Fetch-User` is not required. Safari's compatibility evidence is discussed in research artifact 09.

**Accept repair, deployed September 6:** `accept.ts` replaces substring matching with media-range quality and specificity for `text/html; charset=utf-8`, following [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1). Explicit zero-quality HTML overrides a wider positive wildcard; `text/*` accepts HTML. Missing Accept stays null evidence. Invalid weights provide no positive acceptance evidence, and parameters must match the representation. The repair was merged and deployed on September 6; see the release verification linked below. A twelve-case local ingestion experiment changed seven incorrect results to their expected values; historical effect cannot be calculated from stored booleans alone.

## The two rules that matter most

**Hosting network determines a separate classification.** `networks.ts` contains the reviewed hosting-ASN list and verification dates. It deliberately excludes AS15169 Google, AS13335 Cloudflare, AS36183 and AS20940 Akamai, AS54113 Fastly, and several consumer-VPN networks. Those networks can carry legitimate browsing as well as automation. ADR-0016.4 also excludes AS6939 Hurricane Electric, handles AS7941 Internet Archive through the archiver rule, and leaves AS46997 Black Mesa unclassified pending evidence. Research artifact 04 records the public-list review. The analytics tests check that migrations 0006 and 0008 together match the current hosting list. Network membership does not establish whether a person directed a cloud browser.

**Missing Fetch Metadata stays unresolved.** `claimsFetchMetadataBrowser()` reads Chromium 76+, Firefox 90+, and Safari/iOS 16.4+ from the UA. An otherwise eligible request without `Sec-Fetch-Mode` records `fetch-metadata-absent` when its claimed version supports it, or `fetch-metadata-support-unknown` otherwise. Unrecognized engines also abstain. Research artifact 09 records support sources; [the uncertainty repair](../blog/drafts/research/analytics-retrospective/19-explicit-classification-uncertainty.md) changes how absence is interpreted. Support establishes an expected capability, not a measured human-detection error rate. Historical `legacy-browser` classifications remain reportable under Automation.

Browsers can include automation and exclude legitimate access. It is not an established lower or upper bound on readership. September 4–5's 372 browser-UA observations becoming 95 Browsers HTML observations measures classification effect; comparison with 14 non-bot RUM loads remains unresolved. No universal ratio threshold validates accuracy.

## History keeps its provenance

Method changes are dated boundaries, never deletions.

- Rows before 2026-08-26 came from a browser JavaScript beacon (`observation_source = 'beacon'`); they are `browser` / `beacon-script-ran`, because the site's script ran in a page.
- Pre-evidence edge browser-UA rows retain `user-agent-only` provenance unless reconstructed network evidence changes their kind. Migration 0007 reconstructed an ASN for 1,429 of 1,962 pre-evidence observations using the retained zone sample, matched by UTC hour/path/country/device, with assignment only when sampled candidates agreed. It marks them `asn_source = 'zone-sample'`; applicable browser-UA rows on hosting networks became `cloud-browser`. The method is correlation, not a shared-ID request join.
- Migration 0007 marked applicable existing request-derived ASNs as `request`, but the original subsequent ingestion omitted `asn_source`. All 1,797 observations in the inspected September 3 05:05:22–September 6 01:29:53 UTC cohort had NULL. The local future-write repair now records a request source when an ASN is present. Subsequent production writes have been checked; historical reconstruction remains open; do not silently infer a provenance marker for every missing row.

## Client-form claims

[`client-form.ts`](src/client-form.ts) records existing exact UA markers and the already-sent mobile-experience preference, with explicit unknown, unsupported and conflicting states. It never authenticates physical hardware. `?0` does not establish desktop; Android without Mobile does not establish tablet. No additional hints or device probes are requested.

Migration 0015 adds bounded `client_form_evidence`; old rows stay null and the old three-value column is a deprecated compatibility heuristic. Public API `byClientForm` replaces `byDevice`, with `{form, views}` rows. Current, historical-heuristic and unrecognized record counts partition the selected total. Other evidence subsets overlap. Dashboard labels apply to all traffic filters. See [the decision](../../docs/adr/0016.15-client-form-claims.md) and [dated replay/calibration evidence](../blog/drafts/research/analytics-retrospective/22-client-form-and-calibration.md); source, migration and deployment acceptance remain separate.

## Controlled production-stage trials

`calibration.ts` is off by default. An expiring allowlist plus a verified current-day owner mark gates every trial/asset/stage/receipt. The actual collector persists the verified owner exclusion; labels remain planned until independent execution evidence exists. Counter storage is separate from ordinary observations, bounded, expiring and disclosed. The ready screen creates no visit and the receipt works without JavaScript. A missing row is not a failed-write verdict. No raw diagnostic mode, extra device probe or Cloudflare-beacon claim is introduced. See [ADR-0016.16](../../docs/adr/0016.16-controlled-production-stages.md) and [production-stage protocol](../blog/drafts/research/edge-vs-rum/08-production-stage-protocol.md) for local, activation and actual-client acceptance boundaries.

For offline labelled evaluation of controlled visits, see [`calibration-evaluation.ts`](src/calibration-evaluation.ts) and the [per-trial ledger research](../blog/drafts/research/edge-vs-rum/09-trial-ledger-and-selective-evaluation.md). Requested trials, accepted operator provenance, measurement integrity, abstentions and wrong committed decisions have separate denominators. Undefined rates are null; planned humans are not accepted human labels. This evaluator is not imported by the Worker and changes no deployed classification policy.

## Web Bot Auth

The separate [`webbotauth-audit` submodule](src/webbotauth-audit.ts) audits paired, protocol-tagged proofs under a recorded candidate/time/header budget and an explicit resolver transport. It snapshots message context and verification time, retains valid proofs alongside failed/unresolved ones, and leaves unpaired context partial. It emits closed counts and publisher-origin lower bounds, not origin strings, labels, key IDs or acceptance decisions. No default network transport is supplied. The page collector does not call it; its first-valid policy is unchanged. [Independent Python comparison, native controls and retained Exa replay](../blog/drafts/research/analytics-retrospective/40-bounded-signature-audit.md).

[`webbotauth-reuse-audit`](src/webbotauth-reuse-audit.ts) adds bounded offline cohort diagnostics. Exact caller-supplied request references guard duplicate exports; verified proofs are compared independently of outer labels and unsigned fields. Nonce comparisons are scoped to publisher and key. Results separate repeated proofs, reused nonces on different proofs, malformed/missing references, unavailable verification and budget limits. Partial results are lower bounds. Linkable digests live only in the call's working maps and are never returned or persisted; no default network resolver or production nonce store is introduced. [Native controls and the three-request retained cohort](../blog/drafts/research/analytics-retrospective/50-proof-reuse-and-nonce-boundaries.md).

The verifier selects the first valid paired member tagged `web-bot-auth` in Signature-Input order. Coverage evidence `2026-10-28.1` records matched, tagged, attempted and unassessed candidate counts; these are not counts of verified signers or all header members. Reversing two valid proofs can select another origin. The public report separates recorded, missing historical and unrecognized assessments, and counts events with several tagged or unassessed candidates. Receipt `2026-10-28.1` includes this closed selection projection; older/unsigned projections retain receipt `2026-10-27.3`. [Selection experiment and reference comparison](../blog/drafts/research/analytics-retrospective/39-signature-selection-and-unassessed-proofs.md).

The dedicated module is [`src/webbotauth.ts`](src/webbotauth.ts), called before the final reader-kind decision from [`src/index.ts`](src/index.ts). It verifies an Ed25519/directory-discovery subset of [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html); Web Bot Auth remains a separate [evolving protocol draft](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00). Neither full conformance nor native-provider equivalence is claimed.

| Responsibility | Module / observable evidence |
|---|---|
| Parse headers, reconstruct covered components, verify Ed25519 | `webbotauth.ts`; quoted-string and dictionary compatibility, explicit unsupported cases |
| Admit directory URLs | [`directory-discovery.ts`](src/directory-discovery.ts); default-port HTTPS DNS origins, explicit literal/local-name/port rejection before caches or fetch |
| Discover and cache keys | `webbotauth.ts`; no redirects, 64 KiB/128-key limits, freshness, rotation and key-validity checks |
| Reject reviewed public demonstration keys | [`known-test-keys.ts`](src/known-test-keys.ts); two reviewed Ed25519 examples, thumbprint and decoded-material checks, imported-key policy revision |
| Preserve outcome and proof boundaries | [`signature-evidence.ts`](src/signature-evidence.ts); invalid, unsupported, unavailable, policy-rejected, not-applicable and indeterminate; coverage/age/validity/profile |
| Compare documented Exa signing origins | [`vendor-signatures.ts`](src/vendor-signatures.ts); ExaSearchBot and ExaUser map to `https://crawler.exa.ai`, independently of the display catalogue |
| Compare reviewed directory publishers | [`directory-publication.ts`](src/directory-publication.ts); Exa/Ahrefs first-party endpoints, review date, conflicting publishers and partial mappings; separate from per-client promises and verifier trust |
| Preserve native evidence independently | `signature-evidence.ts`; Cloudflare booleans stay null when absent, false when false |
| Preserve provider categories independently | [`native-bot-evidence.ts`](src/native-bot-evidence.ts); 17 reviewed legacy values, separate empty/unavailable/unrecognized/history states, no native-crypto or human-purpose inference |
| Persist and report | `db.ts` / `stats.ts`; bounded derived JSON, same report selection/exclusions, explicit unrecorded history |
| Attribute a declared network | `vendor-ip.ts` and [`vendor-ip-document.ts`](src/vendor-ip-document.ts); fixed per-client lists, separate from signatures |
| Regress attribution and replay boundaries | [`webbotauth-attribution.test.mjs`](test/webbotauth-attribution.test.mjs); independent signing, unsigned member injection, role/path tampering, outer relabelling, repeated nonce and digest-header/body distinction |

Verification runs in `waitUntil` after the response, with a two-second collector deadline and versioned 24-hour lifetime/age policy. Repeated covered identifiers are rejected before discovery, following RFC 9421 §2.5; different dictionary member parameters remain distinct. The failure is retained as `duplicate-component` / `invalid` under verifier profile `2026-10-27.4`. Profile `2026-10-27.5` additionally rejects disallowed discovery URLs as `discovery-policy-rejected` / `policy-rejected`; this is local policy, not a failed cryptographic proof. Profile `2026-10-27.6` additionally rejects two reviewed public example keys as `known-test-key` / `policy-rejected`, including padded-encoding aliases. Mathematical-vector tests stay separate; there is no production bypass. This is not an exhaustive weak/compromised-key detector.

Verifier profile `2026-10-28.7` validates RFC 9421’s known signed-parameter types before discovery: Integer `created`/`expires`, String `alg`/`keyid`/`nonce`/`tag`. Closed `invalid-*-type` reasons preserve the affected parameter without storing its value. This fixes twelve independently signed non-string nonce controls that profile `.6` accepted. Missing required parameters, unsupported algorithms and configured freshness policy remain separate. Unknown extension parameters receive no invented type. Historical rows retain their original profiles. [Parameter and freshness evidence](../blog/drafts/research/analytics-retrospective/51-signed-parameter-types-and-freshness.md).

A verified key association does not authenticate unsigned UA/path values, human intent, a unique request, reading, citation or permission to access content. `covered.contentDigest` means the header was signed; the verifier does not compare it with body bytes and is not a general body-integrity verifier. The page collector admits GET only. Replay mitigation is expiry-only; there is no nonce database. URL admission rejects IP literals, local-name suffixes, single-label hosts and nondefault ports; permitted DNS names can still resolve internally or rebind. Discovery bounds do not constitute complete SSRF protection. Native Cloudflare currently documents a quoted-string profile that rejects the later dictionary form. No Akamai interoperability acceptance is claimed.

The [attribution-boundary review](../blog/drafts/research/analytics-retrospective/24-webbotauth-attribution-boundaries.md) records twelve independently signed controls and the WG draft's tension between matching-label wording, permitted outer relabelling and its own vector labels. We preserve covered-member attribution and RFC relabelling; no speculative matching-label rejection is introduced. The existing proof/result profiles and production behavior are unchanged by these regression checks and comments.

[Native category/entitlement research](../blog/drafts/research/analytics-retrospective/25-native-category-and-entitlement.md) separately adds provider categories to evidence `.4` and collection/report `.7`. The API's `byKindNativeCategory` pairs local classifications with native categories for the same included events, including unrecorded history, without changing existing classifications or signature policy. Native signed-agent booleans require Enterprise Bot Management; Workers Paid does not establish that entitlement. Category presence is not a substitute for the missing boolean or proof that Web Bot Auth was used. The report adds one grouped scan; the research records its actual local row-read delta and release boundaries.

See the [protocol audit and retained Exa evidence](../blog/drafts/research/analytics-retrospective/18-webbotauth-verification.md), its [new before/after component experiment](../blog/drafts/research/analytics-retrospective/signature-components-after.json), [outcome/origin-method audit](../blog/drafts/research/analytics-retrospective/20-verification-outcomes-and-vendor-methods.md) and [ADR-0016.11](../../docs/adr/0016.11-signature-verification-evidence.md). Source checks, activation and organic signed-request acceptance are separate claims.

## Classification and signature intersection

`byKindSignature` uses the same included population as totals and partitions it by stored kind and a closed signature basis. [`signature-basis.ts`](src/signature-basis.ts) preserves UA covered/uncovered/unknown, unverified/unsigned, outcome-only history, missing detail, injection and inconsistent/unrecognized records. Missing kind projects to null. The row sum must equal the selected total. No new collection or historical rewrite; no operator, purpose or human claim. [Research and native comparison](../blog/drafts/research/analytics-retrospective/23-classification-and-signature-basis.md) record the added query cost and separate release acceptance. Native/vendor/IP methods remain independent; kind links scope them to the same cohort.

## Published address methods

[`vendor-ip-sources.ts`](src/vendor-ip-sources.ts) maps 16 declarations to 15 fixed publisher sources. Profile `2026-10-29.1` adds Applebot, Bingbot and separate Amazonbot / Amzn-SearchBot / Amzn-User lists. It does not extend them to related products or general cloud/ASN ownership. Meta-WebIndexer and Meta-ExternalAds remain unconfigured because the checked Meta crawler page supplies no per-client method.

Apple and Bing return JSON. Amazon's published lists are HTML code blocks: the source adapter uses native HTMLRewriter, requires one complete block, normalizes documented bare IPv4 hosts to `/32` or `ip_prefix` fields to family-specific CIDRs, then applies the unchanged strict whole-feed parser. Missing/ambiguous markup or one invalid prefix rejects the feed. No script or page asset is fetched. The original bounded response bytes supply the snapshot hash. [Sources, native controls and limitations](../blog/drafts/research/analytics-retrospective/66-documented-feed-adapters-and-meta-ads.md).

The 1.5-second deadline, four-source request budget, 262,144-byte body limit, 4,096-prefix limit and refresh cooldown remain in place. Listed, not-listed, unavailable and not-assessed are separate states. Stored method profiles preserve their original source scope; history is not rerun against today's feeds. A listed address does not authenticate an unsigned client name or a human trigger.

## Public API

### Referral-abuse defense

[ADR-0016.5](../../docs/adr/0016.5-referral-abuse-defense.md) defines public referral defense; [ADR-0016.6](../../docs/adr/0016.6-versioned-referral-policy-and-matomo-source.md) adds the Matomo source and historical provenance. `src/referral-policy.ts` owns the pure assessment model, `referral-sql.ts` implements the D1 predicate, and `referrals.ts` handles parsing and display. Only exact reviewed hostnames appear in `byReferrer`; other supplied names are counted in `otherReferrerViews`. A display approval does not authenticate a referral. New unreviewed domains cannot advertise through public JSON or the dashboard.

Policy `2026-09-06.2` combines 2,348 domains from a pinned Matomo snapshot with the local investigated-domain rule. That local domain is absent from Matomo. Canonical host/subdomain matching excludes observations from every public metric and traffic group, including All. Local include/exclude rules override the upstream source; more specific hosts and then exact-host scope resolve overlaps. `referralPolicy` reports the active version, definition hash, evaluator, source revision/hash, and `excludedViews` for the same selection after owner exclusion.

Referral evidence stays in D1. New parsing preserves `www` labels, supported HTTP(S)/Android-app hosts, and a 253-character bound; earlier stripped labels cannot be recovered. Rules apply to historical and new rows at read time. The repair adds no tracking field, migration, deletion, classification rewrite, or dependency. Retain source snapshots, use a new policy version for changes, and save actual reports when their historical totals matter. See the [maintenance/replay guide](policies/README.md) for capture, validation, private assessment, report snapshots, and activation bookkeeping. The production build verifies the source and generated policy offline.

Private review, from the repository root (the output contains unreviewed names and must not be published automatically):

```bash
umask 077
referral_review_dir=$(mktemp -d /tmp/blog-referral-review.XXXXXX)
pnpm exec wrangler d1 execute blog-analytics --remote \
  --command="$(cat packages/analytics/scripts/referral-review.sql)" --json \
  > "$referral_review_dir/results.json"
```

The two SELECTs retain the current UTC day and preceding 29 days, owner exclusions, daily host/kind counts, and host/path distributions. Inspect command success and D1 write counts before interpreting output. Save the capture time and policy version with any reviewed evidence. A new case ends in a display approval, an evidence-backed exclusion, or no change. Neither a strange name nor the content of its website proves automation. See [FLDR-0009](../../docs/folders/FLDR-0009.md).

### Queries

`GET /api/stats?range=7d|30d|90d|all&traffic=browser|agents|crawlers|automation|unresolved|all&path=/slug&agent=<rule name>&kind=<reader kind>`. `path`, `agent`, and `kind` scope every panel; combinations whose kind lies outside the chosen group return 400. The response carries totals, per-path, per-country, per-referrer, per-client-form, per-agent, and per-kind-and-reason aggregates over exact UTC windows. Every query excludes rows marked by `is_owner` at ingestion and daily client IDs recorded in `owner_clients`.

### Internal referral context and page transitions

Migration 0009 adds `referrer_state` and `internal_referrer_path`. New ingestion distinguishes external, internal, absent/empty, and unusable headers. Internal paths are stored only when present in the blog's public route set; query strings and fragments are removed. The Worker loads article and prompt paths from its static `posts.json` binding, alongside known public non-post routes. It caches this set for five minutes; an unavailable index records a bounded warning, retries after one minute, and still captures the category with unknown article paths omitted. No database reads are needed to recognize routes.

Old null `referrer_state` values remain unknown. Reports can identify an older non-null external hostname, but cannot reconstruct discarded internal paths. `byReferrerState` reconciles with headline views. For compatibility, `totals.unattributedViews` retains its original host-null calculation, which includes internal and historical unknown rows; use the explicit categories for interpretation.

`internalTransitions` counts HTML destination requests with a recognized, different internal source path. The page filter selects both incoming and outgoing transitions; other panels remain scoped to requests for the selected page. Traffic/agent/kind and UTC filters describe the destination request. `internalReferrerDetails` reports same-page referrals, unrecognized internal paths, and the first detailed-referrer record in that transition scope. A same-page referrer is not proof of a reload. Repeated requests count again; these are reported transitions, not unique people, complete funnels, conversion rates, or measured exits.

All panels share one materialized selection and referral assessment. An additional `(is_owner, internal_referrer_path, observed_at)` index supports outgoing-page selection. Cache report version `2026-09-09.1` separates this response contract from older entries. [Evidence, prior art, and acceptance scope](../blog/drafts/research/article-024-hacker-news/06-transitions-and-funnels.md).

The [September 9 production receipt](../blog/drafts/research/article-024-hacker-news/07-transition-release-acceptance.md) records migration 0009, code `c338059`, nine excluded scripted observations, bounded report cost, and live cache reuse. This release is accepted. Testing browser-sent referrers and complete visit sequences remains separate from those supplied-header checks.

`POST /api/owner` records the authenticated caller's daily client ID in `owner_clients`. It uses `Authorization: Bearer <ADMIN_SECRET>` and the same site, UTC date, IP, User-Agent, and HMAC secret as ingestion. A mark covers one browser, address, and UTC day; a changed address needs another call.

## Development

```
pnpm -C packages/analytics test      # node:sqlite harness, migrations and classifier contracts
pnpm typecheck
npx wrangler d1 migrations apply blog-analytics --remote   # migrations live in ./migrations
```

## Sources

- Media Rating Council, Invalid Traffic Detection and Filtration Standards Addendum (2020 update): data-center traffic and non-browser User-Agent headers as General Invalid Traffic; AWS, Google, Microsoft as the floor.
- Cloudflare bot vocabulary (bot score bands, Verified Bots, Signed Agents) and the Web Bot Auth working group.
- Vendor crawler documentation for each named rule (links in the header comment of `classify.ts`).
- Open-source classifier reading with line references, hosting-list survey, Fetch Metadata prior art, and the log measurements: `packages/blog/drafts/research/readers-vs-bots/`, artifacts 03, 04, and 09.

The [controlled local experiment](../blog/drafts/research/edge-vs-rum/03-local-experiment.md) records both runs and compiled-source hashes. These parser/provenance changes were merged to `main` in PR #15; they add no visitor fields and do not change signer verification, client-role grouping, content negotiation, or historical rows. Browser/beacon trials and the TASK-0119 grouping repair remain open.

[Release verification](../blog/drafts/research/edge-vs-rum/04-release-verification.md) records the activated Worker version and a read-only check of subsequent production provenance.

The completed [Matomo comparison](../blog/drafts/research/agent-readership/01-matomo-and-agent-subscriptions.md) documents established overlap in server collection, AI reports, cookieless operation, and page transitions. It identifies a narrower verification difference against Matomo 5.13.0's ChatGPT provider and preserves a local reproducer. Overall accuracy, reliability, and cost advantages have not been measured. The [agent-authorization and subscription research](../blog/drafts/research/agent-readership/00-worklist-index.md) is also complete; its proposed integration experiments have not run, and this package does not implement an account-authorized agent subscription service.


### October 26 catalogue repair

ExaSearchBot and ExaUser are distinct named declarations; AhrefsBot and AhrefsSiteAudit map to the SEO/site-audit crawler kind. Token boundaries reject prefixed/suffixed lookalikes. Existing `agent_name`, `reader_kind`/reason and `signature_status`/agent columns retain these independent facts prospectively. Original rows with null names remain unknown.

`byAgent` exposes included matched declarations; `bySigner` aggregates only stored verified-key outcomes under the same owner, time, traffic, path and referral-policy selection. They overlap rather than partition each other. The dashboard shows both, and names can be filtered across role groups and the historical signed fallback. Report cache version `2026-10-26.1` prevents reuse of older semantics. The saved before/after evidence and acceptance are maintained in [the retrospective repair record](../blog/drafts/research/analytics-retrospective/08-classification-repair.md). Broader TASK-0119 version/authorization/native-field work and real-browser owner exclusion remain separate.

### Field semantics review

The [October 26 review](../blog/drafts/research/analytics-retrospective/09-field-semantics-and-evidence-boundaries.md) separates populated fields from native-value validation and collection coverage. `asn_source = request` is our non-null-source marker. Internal referrers use normalized hostname grouping rather than browser origin, and origin-only URLs cannot establish an original source path. Unusable includes unsupported legitimate HTTP referrer forms. Supplied-input findings do not establish production frequency; semantic changes remain proposed.

### Prospective field hardening and versions

[ADR-0016.9](../../docs/adr/0016.9-observation-provenance-and-referrer-boundaries.md) records the accepted October 26 repair. Migration 0010 adds nullable collection/classifier versions; new writer constants are `2026-10-26.2` and historical rows stay null. ASN must be an integer in 1–4,294,967,294; this is a numeric boundary, not independent assignment verification. New internal root/origin-only referrers keep the category and omit the ambiguous source path; historical / sources are explicitly labelled. Hostname grouping remains broader than browser origin. /owner is unindexed and excluded from ingestion; it uses the existing authenticated owner endpoint and saves no credential in browser storage. Actual owner-browser acceptance is distinct from a form response or a scripted D1 mark. [Complete interval and release evidence](../blog/drafts/research/analytics-retrospective/10-full-interval-and-field-hardening.md).

Owner marking also accepts an optional OWNER_MARK_GRANT JSON secret with a random 64-hex token and integer issuedAt/expiresAt milliseconds. The accepted window is at most fifteen minutes, and the binding is read only on /api/owner. It does not replace ADMIN_SECRET or grant newsletter/admin access. Issue privately for a requested browser check and remove afterward; never commit or place it in a URL. [Usability and verification record](../blog/drafts/research/analytics-retrospective/12-owner-code-and-verification-correction.md).


### Prepared private request evidence

The new source implements the [private-evidence proposal](../../docs/adr/0016.10-private-request-evidence.md), gated by ANALYTICS_DIAGNOSTICS=private-v1 and the trusted public-page index. It is off by default. Migration 0011 must precede code using its new column/table. Structured browser/OS claims and bounded UA/Accept evidence have distinct lifecycles; private diagnostics expire from reads after sixty days and have scheduled bounded cleanup. Public stats never select diagnostic payloads. GPC/DNT omit this optional layer; the existing base page counter is separate. No new public diagnostic endpoint is added.

Raw source fidelity is explicit: caps and familiar identifier redaction can remove material needed for exact replay. Arbitrary client strings remain potentially personal even when those patterns are absent. No anonymous-data, worldwide consent exemption or complete-erasure claim follows. D1 backup retention and export copies need separate treatment. Native local-D1 acceptance is recorded; production capture acceptance, the owner’s collection boundary, privacy disclosure and activation are tracked in the [EU/US evidence record](../blog/drafts/research/analytics-retrospective/13-eu-us-collection-boundaries.md).


### Observation storage receipts

Successful observation logs include a closed, versioned `receipt` projected from the values bound to the acknowledged D1 insert. It retains classification/declarations, signature source/outcome/reasons/profile and coverage, reviewed signer name, independent native facts and the separate directory-publication assessment. Snapshot before binding; emit only after `success=true` and `meta.changes=1`. Negative or malformed acknowledgements emit no success receipt, even if a row exists, and trigger no retry. Optional diagnostic failure preserves the acknowledged base event. [Acknowledgement evidence](../blog/drafts/research/analytics-retrospective/27-observation-storage-receipts.md).

A separate private `storage` object carries the existing D1 row reference returned as exact text, or an explicit unavailable status. It is never public. Numeric/malformed/multiple references do not invalidate an acknowledged event; optional diagnostic foreign keys use the exact returned string. This prospective link intentionally supersedes the first receipt's no-row-reference choice; historical logs stay unlinked. No raw headers, addresses, arbitrary signer origins or daily client IDs are added to application logs. [Native and production exact-row acceptance](../blog/drafts/research/analytics-retrospective/32-vendor-receipts-and-exact-storage-references.md).

Receipt `.3` adds the closed directory-publication assessment to scalar receipt `.2`. Native booleans and signed-UA states use `true`, `false` or `unavailable`; absent reviewed values use `none`. Coverage has explicit availability. Sorted catalogue declaration/reason names retain counts, with `none` for zero. The delimiter and sentinel are checked against the catalogues; no raw client text is copied. This encoding follows matched live/retained copies where an export omitted nulls and empty arrays. D1 evidence keeps its arrays/nulls. [Export fidelity](../blog/drafts/research/analytics-retrospective/28-receipt-export-fidelity.md), [publisher provenance and release boundaries](../blog/drafts/research/analytics-retrospective/33-reviewed-directory-publishers.md). [Retained v3 recovery](../blog/drafts/research/analytics-retrospective/34-retained-receipt-recovery.md) matches the existing live control through both native individual and array copies; individual nanosecond timestamps must convert exactly. Visible query counts do not establish the copied population.

### Reviewed public signer names

`src/signers.ts` approves exact signing origins for public display. `bySigner.signatureAgent` now holds Exa, Ahrefs, DuckDuckGo or Other; `byKind.reason` uses the same display boundary for signed-agent rows. Original origins and reasons remain in private D1 rows. Mapping precedes SQL grouping and distinct-client counting. Other means the origin is not publicly named; it neither reverses verification nor asserts maliciousness. Declared-role reasons remain independent. Report cache version 2026-10-26.3 prevents reuse of the earlier raw-origin response. [Display evidence and acceptance](../blog/drafts/research/analytics-retrospective/14-public-signer-display.md).

Verification time is guarded and snapshotted once across verifier/audit paths. An unusable caller clock produces an indeterminate `invalid-verification-time` verdict (audit: not-assessed / invalid-options), before discovery. [Before/after and native controls](../blog/drafts/research/analytics-retrospective/41-verification-clock-admission.md).

Directory-key identity and metadata admission are separate. Rejected matching keys and conflicting duplicate metadata have explicit policy reasons; supported algorithm aliases are validated before adapting the older native import API. Directory/imported-key caches carry the admission revision. [Independent fixture, native constraints and retained Exa compatibility](../blog/drafts/research/analytics-retrospective/42-directory-key-constraints.md).

Differing validity windows for one directory key identity are explicit policy conflicts. Imported keys retain activation bounds on cache hits; malformed bounds cannot disappear as missing keys. The compatibility profile accepts exact JOSE aliases plus the WG HTTP token `ed25519`. [Before/after, cache boundaries and native persistence](../blog/drafts/research/analytics-retrospective/43-key-validity-and-cache-boundaries.md).

Supported compatibility forms preserve actual verifier failures. A bare-URI value no longer overwrites invalid, unavailable, policy or mixed outcomes with a format fallback; the old reason remains readable for historical records. [Wire-format matrix, independent library and native persistence](../blog/drafts/research/analytics-retrospective/44-wire-form-failure-fidelity.md).

[Capability and measurement inventory](../blog/drafts/research/analytics-retrospective/45-goal-and-method-coverage-audit.md) distinguishes configured per-declaration methods from display approvals, generic proof verification and traffic-weighted coverage. It preserves the separate human-label and native-agreement gaps.

[Documented method extensions](../blog/drafts/research/analytics-retrospective/46-documented-method-extensions.md) add dedicated DuckDuckBot/Google-Agent IP sources and Google's experimental signing-origin association. Mixed expected origins remain conflicting even when the selected proof matches one; unsigned Google requests remain unverified. Directory-publisher and public signer-name catalogues are separate.

[Google publisher and display history](../blog/drafts/research/analytics-retrospective/47-google-publisher-and-display-history.md) adds Google's reviewed endpoint/name and versions the signer catalogue recorded by receipts. Current report names can improve while exact historical receipt comparisons retain the original display catalogue. Directory review profile/date pairs are checked together.
