# @gkoreli/analytics

Cookieless page analytics for a Cloudflare Worker and D1. It records eligible page responses, preserves client declarations and verification separately, and reports included request events. People and agents both count as audience at their observed stages; a request alone establishes neither reading nor its initiating party. See [ADR-0016.19](../../docs/adr/0016.19-agent-mediated-audience-growth.md).

This is private workspace source with one pinned runtime dependency, `ipaddr.js`. Code is MIT. This document describes the checked implementation; code, migration, deployment activation and measured production behavior require separate evidence. The [User-Agent trust worklist](../blog/drafts/research/analytics-retrospective/136-user-agent-trust-and-hardening.md) continues the [accepted detection investigation](../blog/drafts/research/analytics-retrospective/128-detection-improvement-worklist.md).

## Start locally

Use the repository's pinned runtime and pnpm versions, then run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm -C packages/analytics test
pnpm -C packages/analytics test:portability
pnpm typecheck
```

The [minimal Worker example](examples/minimal-worker/README.md) provides a local integration and a generator for a separate evaluation project. It serves pages, calls `observePageResponse`, handles `/api/owner` and returns the real report without the blog application. It creates no cloud resources and does not establish another installation's production readiness. [The standalone trial](../blog/drafts/research/discovery-experiment-02/15-standalone-install-and-operator-decisions.md) records its measured scope.

| Binding | Purpose |
| --- | --- |
| `DB` | D1 database for observations, owner marks and dormant optional tables |
| `ANALYTICS_HASH_KEY` | Required secret for site/day/IP/User-Agent HMACs; empty configuration fails collection |
| `ADMIN_SECRET` | Authentication for owner marking |
| `OWNER_IPS` | Optional comma-separated owner addresses for ingestion exclusion |
| `OWNER_MARK_GRANT` | Optional private owner-only grant, valid for at most fifteen minutes and read only by `/api/owner` |

Use a separate database per site: observations have no tenant column. The blog's [`migrations/`](migrations/) upgrade site-specific history, including legacy data backfills; do not apply them to another site's data. [`schema/`](schema/) is the empty-install baseline. Changing an applied baseline is not an upgrade; schema changes need a deliberate migration and fresh-schema parity checks. Follow the example's [schema ownership guidance](examples/minimal-worker/README.md#schema-ownership-and-deployment-boundary).

## Collection and privacy

Call `observePageResponse(request, response, representation, env, ctx, options)` after producing the page response. Applications own content negotiation; [`eligibility.ts`](src/eligibility.ts) accepts successful HTML or negotiated Markdown page `GET`s. HEAD, prefetch/prerender, owner/dashboard/API routes and direct `/<slug>.md` requests are excluded. Assets and feeds with their normal non-page content types do not count.

`ctx.waitUntil` schedules work; the response does not acknowledge persistence. A success receipt is emitted only after D1 acknowledges one inserted row. Uncertain acknowledgement causes no automatic retry and does not prove no row exists. Optional diagnostic failure preserves an acknowledged base observation. Exact database references remain private. See [acknowledgement semantics](../blog/drafts/research/analytics-retrospective/27-observation-storage-receipts.md) and [exact storage references](../blog/drafts/research/analytics-retrospective/32-vendor-receipts-and-exact-storage-references.md).

Base observations retain normalized page/referral context, Cloudflare-supplied ASN/country evidence, Fetch Metadata parsing, acceptance/language flags, representation, daily identifier, derived client/form/classification evidence, verification facts and their profiles. Raw client IPs and full User-Agents are not stored in ordinary D1 page observations. The HMAC uses site, UTC date, IP and User-Agent; a daily ID is not a person, visit, hardware identity or cross-day identifier. [Client-form evidence](src/client-form.ts) uses existing request markers and mobile preference without requesting extra hints or probes.

Optional source diagnostics are **off by default**. `ANALYTICS_DIAGNOSTICS=private-v1` also requires a trusted public-page index; GPC/DNT omit this layer. Structured browser/OS evidence follows base-observation retention, while bounded source diagnostic rows expire from reads after sixty days and have bounded scheduled cleanup. Redaction and byte caps are lossy and do not make arbitrary client text anonymous or safe to publish. Public reports never select diagnostic payloads. Base retention, copies/backups and Cloudflare logs/traces are separate; there is no complete-erasure or worldwide consent-exemption claim. [Decision and field register](../../docs/adr/0016.10-private-request-evidence.md).

`ANALYTICS_CALIBRATION` and `ANALYTICS_NATIVE_CAPTURE` are separate, off-by-default, expiring owner-gated experiments. Planned operators do not become accepted labels without independent execution evidence. See [controlled stages](../../docs/adr/0016.16-controlled-production-stages.md), [native capture](src/native-bot-capture.ts) and [offline labelled evaluation](src/calibration-evaluation.ts).

## Domain architecture

| Domain | Current owner | Boundary |
| --- | --- | --- |
| Received facts | [`metadata.ts`](src/metadata.ts), [`accept.ts`](src/accept.ts), [`fetch-metadata.ts`](src/fetch-metadata.ts) | Parsed claims and source availability; no operator authentication |
| Lexical declarations | [`user-agent-products.ts`](src/user-agent-products.ts), [`client-registry.ts`](src/client-registry.ts), [`classify.ts`](src/classify.ts) | Exact products, aliases and all candidates; current names, sources and declared roles live together |
| Reader-kind policy | [`readerkind.ts`](src/readerkind.ts), [`networks.ts`](src/networks.ts) | Versioned role, navigation and local network rules; abstain on insufficient evidence |
| Independent verification | [`webbotauth.ts`](src/webbotauth.ts), [`vendor-signatures.ts`](src/vendor-signatures.ts), [`vendor-ip.ts`](src/vendor-ip.ts), [`native-bot-evidence.ts`](src/native-bot-evidence.ts) | Covered components, signing-origin associations, published address comparisons and provider categories answer different questions |
| Evidence and persistence | [`classification-evidence.ts`](src/classification-evidence.ts), [`retained-client-products.ts`](src/retained-client-products.ts), [`signature-evidence.ts`](src/signature-evidence.ts), [`db.ts`](src/db.ts) | Bounded records and acknowledged writes; frozen profiles/bit positions remain independent of the mutable registry |
| Public reports | [`stats.ts`](src/stats.ts), [`client-evidence.ts`](src/client-evidence.ts) | Shared selection, reconciled event partitions and same-event evidence groups; no historical re-verification |

The [generated client catalogue](CLIENTS.md) lists current canonical names, exact aliases, declared roles and source-review basis. Generic automation conventions and browser/network policy are separate. A missing selected scalar name can mean no recognized declaration, several compatible/conflicting declarations or missing historical data.

[`contracts.ts`](src/contracts.ts) defines fourteen stored kinds and five disjoint public groups: Browser signals, Assistants & signed clients, Crawlers, Automation and Unresolved. Known declared roles survive signature verification; unknown-role verified clients can use the signed-client fallback. Conflicting declared categories stay unresolved even when a signature verifies. Historical classifications remain stored as originally assigned.

Browser signals require a recognized engine claim, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`, positive HTML acceptance, a nonempty language header and an available locally unlisted ASN. Activation is not required and never authenticates a human. Missing/invalid context and conflicting referrer/site claims can abstain. Automation and relays can supply matching signals; an unlisted ASN does not establish a residential network. [Controlled counterexamples and parser boundaries](../blog/drafts/research/analytics-retrospective/130-detection-domain-audit.md) cover URL substrings, CUBOT phones, Phantom wallet strings, version claims and the rejected recall tradeoff.

Hosting-list membership precedes browser shape for unnamed requests; it does not identify the tenant or operator. [`networks.ts`](src/networks.ts) retains the September snapshot separately from prospective additions such as AS7979. Migrations 0006/0008 preserve their historical snapshot, **not today's entire list**. Consumer relays, mixed transit/VPN networks and the separate archiver rule have explicit exceptions in that source and [ADR-0016.4](../../docs/adr/0016.4-owner-exclusion-and-network-evidence.md).

## Verification and network methods

The collector uses a bounded Ed25519/directory-discovery subset of RFC 9421 and Web Bot Auth compatibility forms. It has a two-second signature deadline and a one-day maximum lifetime/age policy. Selection is first-valid in input order; matched, tagged, attempted and unassessed counts do not imply multiple valid signers. Invalid, unsupported, unavailable, policy-rejected, not-applicable and indeterminate outcomes remain distinct. [Verifier source](src/webbotauth.ts), [profile history](src/verifier-profile.ts) and [the evidence decision](../../docs/adr/0016.11-signature-verification-evidence.md) define its scope; full conformance or native-provider equivalence is not claimed.

A verified proof authenticates only covered components against a key. It cannot authenticate an unsigned User-Agent, resource or purpose. Signing `Content-Digest` records header coverage; the request verifier does not compare the digest with body bytes. Replay mitigation is expiry-only, without a nonce database. Key validity/metadata and reviewed demonstration-key rejection are separate admission policies, not an exhaustive compromised-key detector. Human intent, authorization, unique actions, reading, indexing and citation need their own evidence.

Directory admission requires a default-port HTTPS DNS origin, rejects IP literals/local-name suffixes/single-label hosts and follows no redirects. The request verifier limits directory responses to 64 KiB and 128 key entries. A permitted DNS name can still resolve internally or rebind: these rules do **not** establish complete SSRF protection. Discovery, key-publisher review and documented per-client signing promises remain separate. [Discovery policy](src/directory-discovery.ts) and [publisher assessment](src/directory-publication.ts).

Current method scope lives in [`vendor-signatures.ts`](src/vendor-signatures.ts) and [`vendor-ip-sources.ts`](src/vendor-ip-sources.ts). Related clients do not inherit a method automatically. Unsigned requests can have positive address evidence; an absent signature or nonlisted address does not establish impersonation. Missing native verified-bot/signed-agent booleans remain unavailable, independently of the top-level provider category. Workers Paid alone does not establish Bot Management entitlement. [Native-field evidence](../blog/drafts/research/analytics-retrospective/25-native-category-and-entitlement.md).

Published-IP checks use fixed reviewed publisher URLs, no request-derived feed URL and no reverse DNS. They distinguish listed, not-listed, unavailable and skipped results. Current bounds are a 1.5-second deadline, four sources per request, 262,144 response bytes and 4,096 prefixes. JSON feeds and documented HTML code blocks pass whole-feed validation; invalid/ambiguous content rejects the feed without loading page assets. Cache snapshots, policy/reuse reasons and refresh cooldowns retain their recorded scope; they do not prove present freshness or a shared cache instance. [Feed adapters](src/vendor-ip-document.ts), [cache evidence](src/vendor-ip-cache-evidence.ts) and [assignment consistency](src/vendor-declaration-assessment.ts) remain separate assessments.

## Inspect supplied User-Agent claims without a collector

`@gkoreli/analytics/user-agent` exports `assessUserAgent(userAgent, mobileHint?)` as a pure supplied-input assessment. The package remains private workspace source; this is not an npm installation promise. The local [inspection command and regression pack](../blog/tools/user-agent-check/README.md) require no Worker, database, account, network request or private traffic export.

The result distinguishes missing/empty/present input, all catalogue-name candidates, selected browser and platform claims, conflicting/unusable versions, form markers/mobile preference, and a compatibility claim about Fetch Metadata. `authentication` is always `not-performed`. Cautions flag known frozen-version patterns and policy tokens; they do not recover the actual OS, hardware, operator or purpose. A false automation declaration result is not a human verdict. Raw input, arbitrary product names, addresses and URL details are not returned.

Ordinary Chrome+Safari and Chrome+Edge/Opera compatibility tokens survive. Competing Edge/Opera selections and conflicting OS families or versions abstain instead of choosing a priority match. Android/Linux and ChromeOS/Linux compatibility markers remain usable. The same browser/platform values now supply optional request diagnostics under profile `2026-11-10.1`. Mobile hint parsing uses HTTP SP/HTAB padding, leaving NBSP-padded values unsupported; collection, form and incoming-request profiles advance prospectively while old profiles remain readable. Classifier/signature profiles and historical rows are unchanged. A claimed OS version may be a browser compatibility value.

The extractor intentionally supports a reviewed lexical dialect, not every HTTP product/comment syntax or every browser/device. Client Hints are client claims too. It consumes only an already-supplied mobile preference and requests no high-entropy hints. Use feature detection for actual client capabilities and independent network/signature evidence for attribution, preserving each method's limits. The [twelve-family evidence map](../blog/drafts/research/analytics-retrospective/137-user-agent-pain-point-map.md) describes scope and incidents.

## Public API and interpretation

```text
GET /api/stats?range=7d|30d|90d|all&traffic=browser|agents|crawlers|automation|unresolved|all
               &path=/slug&agent=<canonical name>&kind=<reader kind>
```

The default includes all recorded categories. Valid filters scope the report; incompatible group/kind/agent combinations return 400. UTC windows can include a partial current day. Reports exclude ingestion owner marks, matching daily IDs in `owner_clients` and the current versioned referral-abuse policy. Save historical reports when their exact policy-dependent totals matter. [Policy maintenance and private review](policies/README.md).

| Response facet | Interpretation |
| --- | --- |
| `totals`, `byPath`, `timeSeries`, `byKind` | Included events and classifications; daily IDs can repeat across hourly buckets and are not additive |
| `byAgent`, `clientNameCoverage` | Selected scalar names and the selected/not-selected partition; no selected name does not necessarily mean zero declarations |
| `bySigner`, `byKindSignature` | Stored verified signer display and detailed local signature basis/profile; separate evidence channels |
| `byKindNativeCategory`, `byKindClientEvidence` | Provider category and joint kind × selected-name state × provider-category × signature/profile groups; missing/unrecognized stored kinds remain null in evidence tables |
| `verification`, `vendorNetwork`, `vendorCache` | Stored verification and network/cache assessments; method/outcome counts can overlap |
| `fetchMetadata`, `byClientForm`, `clientFormEvidence` | Parsed request-context/form claims and missing/unsupported/history states; no hardware or human authentication |
| `byReferrerState`, `internalTransitions`, `internalReferrerDetails` | Reported source context and known page-to-page referrals; no complete journey, conversion or measured-exit claim |

Joint evidence rows count each event once; their name, signature/profile and category marginals reconcile with existing facets. Aggregate consistency cannot independently reconstruct original requests or prove every correlation. Earlier missing records remain explicit; report generation does not reverify proofs. [Joined-evidence investigation](../blog/drafts/research/analytics-retrospective/132-joined-client-evidence-and-retained-headers.md).

Public signer display uses reviewed names or Other; Other is not a verification failure. Public referrer names require exact display approval; other names remain private or appear as aggregate remainder. A display approval authenticates neither a signer role nor an acquisition source. `totals.unattributedViews` retains the older host-null definition; use explicit referral states to distinguish absent, internal, unusable and historical unknown evidence.

Internal source paths must belong to the trusted public route set and omit query strings/fragments. Hostname grouping is broader than browser origin. A path filter includes incoming and outgoing transitions, while other panels stay scoped to that page's destination requests. Destination traffic/kind filters apply to transitions. Unknown routes and missing history cannot be recovered. [Referral/transition contract](../blog/drafts/research/article-024-hacker-news/06-transitions-and-funnels.md).

`POST /api/owner` accepts `Authorization: Bearer <ADMIN_SECRET>` or the supported private expiring grant. A mark covers the same host, IP, User-Agent, HMAC key and UTC day, including matching earlier rows. A changed client/day needs another mark. Never place credentials in a URL or Git; the blog's `/owner` form stores none in browser storage. [Owner grant and actual-client boundaries](../blog/drafts/research/analytics-retrospective/12-owner-code-and-verification-correction.md).

The library handler does not provide the blog's calculation cache or a global read budget. The [blog cache](../blog/src/worker/stats-cache.ts) reuses successful calculations for at most an hour, capped at UTC midnight, preserving calculation time and validated filter/policy/version keys. Cache locality and isolate coalescing do not impose a global quota. Query work consumes D1 reads even when few rows return; inspect statement meters and total cold-fill work. After a quota rejection, stop expensive retries and inspect metadata. [Read-budget decision](../../docs/adr/0016.7-budget-d1-reads-and-cache-public-reports.md) and [operational procedure](../../.agents/skills/blog-maintenance/references/operations-and-handoffs.md).

## Maintaining declarations and evidence profiles

1. Start from a concrete missing declaration or reproduced error. Inspect evidence and competing explanations; an OSS pattern is a research lead. Review first-party product spellings, aliases, roles and method scope.
2. Update [`client-registry.ts`](src/client-registry.ts) deliberately. Preserve legacy/generic exceptions and all candidates. Add boundary, lookalike, URL, ordering, conflict, signed/unsigned and software-role fixtures as relevant. Generic rules must not manufacture named identities.
3. Review collection/classifier and evidence profiles. New aliases require a **new frozen product profile** in [`retained-client-products.ts`](src/retained-client-products.ts); never reorder historical bit positions or derive them from the live registry. Preserve old array/bitset decoders and historical declaration/network snapshots. Check the complete catalogue against the persisted JSON budget and native D1 constraints.
4. Update independent signing, publisher or IP-source maps only when their own sources support the change. Preserve method omissions, conflicting origins and historic-profile/assignment checks; a new declaration need not gain verification.
5. Compile, regenerate documentation, reject drift and run relevant package/native checks. Record implementation, activation and measured production acceptance separately. Do not automatically import OSS rules or relabel history.

```sh
pnpm -C packages/analytics exec tsc -p tsconfig.test.json
node packages/analytics/scripts/client-catalogue.mjs
node packages/analytics/scripts/client-catalogue.mjs --check
pnpm -C packages/analytics test
```

Classification evidence has a 2,048-byte database budget; the frozen product encoding preserves closed aliases without truncating candidates. Current collection/classifier constants live in [`versions.ts`](src/versions.ts); verifier, network, signer-display and directory-review profiles have their own contracts. A version is implementation provenance, not per-request deployment proof. Historical missing stamps remain unknown.

## Offline analysis and historical evidence

Offline modules do not add collector behavior merely by existing. Their explicit inputs, clocks, resolver policies and budgets govern their results.

| Work | Source and evidence |
| --- | --- |
| Multi-proof checks, repeated proofs/nonces, retained replay | [`webbotauth-audit.ts`](src/webbotauth-audit.ts), [`webbotauth-reuse-audit.ts`](src/webbotauth-reuse-audit.ts), [`retained-signature-audit.ts`](src/retained-signature-audit.ts); [bounded audit](../blog/drafts/research/analytics-retrospective/40-bounded-signature-audit.md), [reuse limits](../blog/drafts/research/analytics-retrospective/50-proof-reuse-and-nonce-boundaries.md) |
| Directory response profiles and reassessment advice | [`directory-response-audit.ts`](src/directory-response-audit.ts); [body-digest profiles](../blog/drafts/research/analytics-retrospective/115-offline-directory-response-profiles.md), [reuse clocks/key admission](../blog/drafts/research/analytics-retrospective/116-directory-cache-clocks-and-key-admission.md) |
| Forwarded operator/use claims and managed-provider comparison | [`forwarded-purpose.ts`](src/forwarded-purpose.ts), [`native-bot-comparison.ts`](src/native-bot-comparison.ts); [assertion boundaries](../blog/drafts/research/analytics-retrospective/71-forwarded-operator-and-purpose-claims.md) |
| Discovery, search, resource reach and labelled access stages | [Discovery workbench](../blog/scripts/agent-discovery-evidence.md), [resource accounting](../blog/scripts/resource-reach.md), [`search-evidence.ts`](src/search-evidence.ts), [`access-evidence.ts`](src/access-evidence.ts); evidence-resource access remains separate from article events and comprehension |

The former README's dated verifier journal, catalogue snapshots, migration counts and release claims remain in the [exact pre-cleanup README](https://github.com/gkoreli/blog/blob/4f9db12777d8b2edc13e3f0d2248de8827c7a6df/packages/analytics/README.md). They are historical evidence, not current configuration. This coverage map keeps consequential records discoverable:

- [Original experiment](../blog/drafts/research/edge-vs-rum/03-local-experiment.md), [provenance release](../blog/drafts/research/edge-vs-rum/04-release-verification.md) and [field hardening/history](../blog/drafts/research/analytics-retrospective/10-full-interval-and-field-hardening.md) retain measured rule effects, sampled ASN reconstruction and correlation limits. Missing historical provenance must not be invented.
- [Role repair](../blog/drafts/research/analytics-retrospective/08-classification-repair.md), [explicit uncertainty](../blog/drafts/research/analytics-retrospective/19-explicit-classification-uncertainty.md) and [signature intersections](../blog/drafts/research/analytics-retrospective/23-classification-and-signature-basis.md) retain dated acceptance boundaries.
- [Publisher review](../blog/drafts/research/analytics-retrospective/33-reviewed-directory-publishers.md), [key constraints](../blog/drafts/research/analytics-retrospective/42-directory-key-constraints.md), [wire failures](../blog/drafts/research/analytics-retrospective/44-wire-form-failure-fidelity.md), [typed parameters](../blog/drafts/research/analytics-retrospective/51-signed-parameter-types-and-freshness.md), [feed adapters](../blog/drafts/research/analytics-retrospective/66-documented-feed-adapters-and-meta-ads.md) and [key-import lifecycle](../blog/drafts/research/analytics-retrospective/117-key-import-and-request-lifecycle-races.md) replace copied profile-by-profile prose.
- [Receipt export fidelity](../blog/drafts/research/analytics-retrospective/28-receipt-export-fidelity.md), [network receipts](../blog/drafts/research/analytics-retrospective/67-published-address-receipts.md) and [retained receipt evidence](../blog/drafts/research/analytics-retrospective/68-network-receipt-retention.md) preserve missing-null/array and acknowledged-input versus readback distinctions.
- [Matomo comparison](../blog/drafts/research/agent-readership/01-matomo-and-agent-subscriptions.md) and [delegation/subscription research](../blog/drafts/research/agent-readership/00-worklist-index.md) remain dated research. Overall accuracy, reliability, cost superiority and an account-authorized subscription service have not been established.
