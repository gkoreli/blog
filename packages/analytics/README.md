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
| `signature_agent`, `signature_status` | Web Bot Auth: the verified signer origin, or `unverified` with the failure reason in `reader_reason` |
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
| Crawlers | `preview-or-feed` | FacebookBot, LinkedInBot, Slackbot; or an unnamed request from an archiver network | the agent name or `archiver-asn:<asn>` |
| Automation | `headless-browser` | `HeadlessChrome/`, `Cypress/`, `Lightpanda/` in the User-Agent | the token |
| Automation | `other-bot` | any other bot-class match, including generic tokens | rule name or `generic-bot` |
| Automation | `cloud-browser` | browser User-Agent from a network in `networks.ts`, checked before request shape | `hosting-asn:<asn>` |
| Automation | `http-client` | browser User-Agent whose request is not navigation-shaped, or a modern engine claim with no `Sec-Fetch-Mode` | `not-navigation-shaped` or `no-fetch-metadata` |
| Automation | `legacy-browser` | no `Sec-Fetch-Mode` and a User-Agent that predates Fetch Metadata or cannot be versioned | `pre-fetch-metadata-ua` |
| Browsers | `browser` | navigation-shaped request with an available, unlisted ASN; or a historical beacon/pre-evidence row | `navigation-shaped-network-unlisted`, `beacon-script-ran`, `user-agent-only` |
| Unresolved | `unresolved` | missing network/shape evidence, incompatible declarations, or inconsistent referrer signals | closed reason from `readerkind.ts` |

Order of evaluation: derive the declared role from named rules, headless tokens, archiver network for unnamed requests, bot class, beacon/pre-evidence cases, hosting network and request shape. A verified signature preserves a recognized named role; otherwise it selects the signed-client fallback. An unverified signature keeps the role with a failure reason. Key outcomes stay in their existing signature fields; no historical reclassification or schema migration accompanies this repair. The hosting network runs before shape because, in a three-day sample of the site's raw logs, the largest single cluster (374 of 844 page loads) was navigation-shaped traffic from Google Cloud that passed every header check.

The implemented navigation predicate requires `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, `accepts_html = 1`, and `has_accept_language = 1`. `Sec-Fetch-Site` is recorded but not restricted; `Sec-Fetch-User` is not required. Safari's compatibility evidence is discussed in research artifact 09.

**Accept repair, deployed September 6:** `accept.ts` replaces substring matching with media-range quality and specificity for `text/html; charset=utf-8`, following [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1). Explicit zero-quality HTML overrides a wider positive wildcard; `text/*` accepts HTML. Missing Accept stays null evidence. Invalid weights provide no positive acceptance evidence, and parameters must match the representation. The repair was merged and deployed on September 6; see the release verification linked below. A twelve-case local ingestion experiment changed seven incorrect results to their expected values; historical effect cannot be calculated from stored booleans alone.

## The two rules that matter most

**Hosting network determines a separate classification.** `networks.ts` contains the reviewed hosting-ASN list and verification dates. It deliberately excludes AS15169 Google, AS13335 Cloudflare, AS36183 and AS20940 Akamai, AS54113 Fastly, and several consumer-VPN networks. Those networks can carry legitimate browsing as well as automation. ADR-0016.4 also excludes AS6939 Hurricane Electric, handles AS7941 Internet Archive through the archiver rule, and leaves AS46997 Black Mesa unclassified pending evidence. Research artifact 04 records the public-list review. The analytics tests check that migrations 0006 and 0008 together match the current hosting list. Network membership does not establish whether a person directed a cloud browser.

**Fetch Metadata absence is checked against a claimed version.** `claimsFetchMetadataBrowser()` reads Chromium 76+, Firefox 90+, and Safari/iOS 16.4+ from the UA. Missing `Sec-Fetch-Mode` under those claims produces `http-client`; older or unreadable claims produce `legacy-browser`. Research artifact 09 records the browser support sources, including Android WebView and Safari observations. Support establishes an expected capability, not a measured zero false-positive rate for every request. Although the current public group puts `legacy-browser` under Automation, the rule itself does not prove automation.

Browsers can include automation and exclude legitimate access. It is not an established lower or upper bound on readership. September 4–5's 372 browser-UA observations becoming 95 Browsers HTML observations measures classification effect; comparison with 14 non-bot RUM loads remains unresolved. No universal ratio threshold validates accuracy.

## History keeps its provenance

Method changes are dated boundaries, never deletions.

- Rows before 2026-08-26 came from a browser JavaScript beacon (`observation_source = 'beacon'`); they are `browser` / `beacon-script-ran`, because the site's script ran in a page.
- Pre-evidence edge browser-UA rows retain `user-agent-only` provenance unless reconstructed network evidence changes their kind. Migration 0007 reconstructed an ASN for 1,429 of 1,962 pre-evidence observations using the retained zone sample, matched by UTC hour/path/country/device, with assignment only when sampled candidates agreed. It marks them `asn_source = 'zone-sample'`; applicable browser-UA rows on hosting networks became `cloud-browser`. The method is correlation, not a shared-ID request join.
- Migration 0007 marked applicable existing request-derived ASNs as `request`, but the original subsequent ingestion omitted `asn_source`. All 1,797 observations in the inspected September 3 05:05:22–September 6 01:29:53 UTC cohort had NULL. The local future-write repair now records a request source when an ASN is present. Subsequent production writes have been checked; historical reconstruction remains open; do not silently infer a provenance marker for every missing row.

## Client-form claims

[`client-form.ts`](src/client-form.ts) records existing exact UA markers and the already-sent mobile-experience preference, with explicit unknown, unsupported and conflicting states. It never authenticates physical hardware. `?0` does not establish desktop; Android without Mobile does not establish tablet. No additional hints or device probes are requested.

Migration 0015 adds bounded `client_form_evidence`; old rows stay null and the old three-value column is a deprecated compatibility heuristic. Public API `byClientForm` replaces `byDevice`, with `{form, views}` rows. Current, historical-heuristic and unrecognized record counts partition the selected total. Other evidence subsets overlap. Dashboard labels apply to all traffic filters. See [the decision](../../docs/adr/0016.15-client-form-claims.md) and [dated replay/calibration evidence](../blog/drafts/research/analytics-retrospective/22-client-form-and-calibration.md); source, migration and deployment acceptance remain separate.

## Web Bot Auth

The dedicated module is [`src/webbotauth.ts`](src/webbotauth.ts), called before classification from [`src/index.ts`](src/index.ts). It verifies an Ed25519/directory-discovery subset of [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html); Web Bot Auth remains a separate [evolving protocol draft](https://datatracker.ietf.org/doc/html/draft-ietf-webbotauth-httpsig-protocol-00). Neither full conformance nor native-provider equivalence is claimed.

| Responsibility | Module / observable evidence |
|---|---|
| Parse headers, reconstruct covered components, verify Ed25519 | `webbotauth.ts`; quoted-string and dictionary compatibility, explicit unsupported cases |
| Discover and cache keys | Same module; HTTPS origin-only directory, no redirects, 64 KiB/128-key limits, freshness, rotation and key-validity checks |
| Preserve outcome and proof boundaries | [`signature-evidence.ts`](src/signature-evidence.ts); invalid, unsupported, unavailable, policy-rejected, not-applicable and indeterminate; coverage/age/validity/profile |
| Check documented Exa identity | [`vendor-signatures.ts`](src/vendor-signatures.ts); ExaSearchBot and ExaUser map to `https://crawler.exa.ai`, independently of the display catalogue |
| Preserve native evidence independently | `signature-evidence.ts`; Cloudflare booleans stay null when absent, false when false |
| Persist and report | `db.ts` / `stats.ts`; bounded derived JSON, same report selection/exclusions, explicit unrecorded history |
| Attribute a declared network | `vendor-ip.ts`; separate published-range method, not a replacement for Exa's signatures |

Verification runs in `waitUntil` after the response, with a two-second collector deadline and versioned 24-hour lifetime/age policy. Repeated covered identifiers are rejected before discovery, following RFC 9421 §2.5; different dictionary member parameters remain distinct. The failure is retained as `duplicate-component` / `invalid` under verifier profile `2026-10-27.4`.

A verified key association does not authenticate unsigned UA/path values, human intent, a unique request, reading, citation or permission to access content. Replay mitigation is expiry-only; there is no nonce database. Discovery bounds do not constitute complete SSRF protection. Native Cloudflare currently documents a quoted-string profile that rejects the later dictionary form. No Akamai interoperability acceptance is claimed.

See the [protocol audit and retained Exa evidence](../blog/drafts/research/analytics-retrospective/18-webbotauth-verification.md), its [new before/after component experiment](../blog/drafts/research/analytics-retrospective/signature-components-after.json), [outcome/origin-method audit](../blog/drafts/research/analytics-retrospective/20-verification-outcomes-and-vendor-methods.md) and [ADR-0016.11](../../docs/adr/0016.11-signature-verification-evidence.md). Source checks, activation and organic signed-request acceptance are separate claims.

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


### Reviewed public signer names

`src/signers.ts` approves exact signing origins for public display. `bySigner.signatureAgent` now holds Exa, Ahrefs, DuckDuckGo or Other; `byKind.reason` uses the same display boundary for signed-agent rows. Original origins and reasons remain in private D1 rows. Mapping precedes SQL grouping and distinct-client counting. Other means the origin is not publicly named; it neither reverses verification nor asserts maliciousness. Declared-role reasons remain independent. Report cache version 2026-10-26.3 prevents reuse of the earlier raw-origin response. [Display evidence and acceptance](../blog/drafts/research/analytics-retrospective/14-public-signer-display.md).
