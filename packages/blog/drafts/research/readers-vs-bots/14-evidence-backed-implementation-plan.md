# Analytics iteration 3: evidence-backed implementation plan

Proposed September 6, 2026 UTC. Research and planning only. This document refines [the two-priority plan](13-two-priority-implementation-plan.md), retaining [TASK-0119](../../../../../docs/tasks/TASK-0119.md) and [TASK-0120](../../../../../docs/tasks/TASK-0120.md) as the implementation scope. It adds concrete data contracts, prior art, experiment conditions, and release gates. It does not authorize or perform a deployment, historical rewrite, or new production collection.

**Subsequent scope clarification:** the owner directed us to existing Cloudflare traces and to preserve the identity machinery. Start with retained observations; any new collection below requires a demonstrated evidence gap. The immediate identity fix is grouping and wording. Full calibration and identity studies belong to separate existing series slots, with the correction boundary and evidence gates recorded in [FLDR-0008](../../../../../docs/folders/FLDR-0008.md).

## Decision and evidence

Make the analytics explain what requested an article, why we classified it that way, and whether collection succeeded. Then use controlled clients to investigate the remaining disagreement with the script counter. Success is an explainable measurement and a publishing decision, not a lower Browser count.

The fixed baseline is September 4–5 UTC, recorded in [artifact 12](12-production-followup-2026-09-05.md), its [SQL](12-production-followup.sql), and its [RUM query and response](12-web-analytics-results.json): 95 D1 Browser events versus 14 non-bot script page loads after removing `/stats`. The ratio is 6.79; removing the 22 repeated-referrer events as a sensitivity calculation still leaves 5.21. Neither calculation estimates a bot fraction. These are complete days with matching host and page scope; the returned RUM groups have sample interval 1.

Additional direct inspection in this session covered 1,797 D1 observations from September 3 05:05:22 through September 6 01:29:53 UTC. All had null `asn_source`; the current INSERT omits that column. The diagnostic export remains private at `/tmp/blog-analytics-deep-rows.json`, contains daily pseudonymous identifiers, and is not a public artifact. Its count is a separate window from the fixed baseline. Reproduce the provenance defect with `SELECT asn_source, COUNT(*) FROM page_observations WHERE observed_at >= '2026-09-03 05:05:17' AND observed_at <= '2026-09-06 01:29:53' GROUP BY asn_source;` rather than publishing the rows.

## What research changed in the initial plan

| Initial direction | Evidence that refines it | Revised choice |
|---|---|---|
| Preserve parsed browser facts | GoatCounter retains bot reason and UA; source UA exposed the Redroid clue in artifact 12 | Keep parsed facts for routine queries and bounded source UA in private diagnostics, as allowed by artifact 13. A parsed summary alone cannot support future parser corrections. |
| Separate identity and purpose | Matomo separates AhrefsBot from AhrefsSiteAudit; Exa publishes its own search-crawler documentation | Resolve exact service identity before assigning a documented role. Matomo's `ExaBot` is Dassault/Exalead, not Exa AI. |
| Add collection health | Plausible emits buffered/dropped outcomes, parser timeouts, and pipeline timings separately | Record observation stages in operational telemetry. A successful HTTP response and a successful D1 write are different outcomes. |
| Compare edge and JS with known clients | Plausible explicitly handles visibility and back/forward-cache restoration; Beacon specifies queuing separately from receipt | Add lifecycle and cache conditions. Do not assume each page display issues one fresh edge request. |
| Wait for a fourteen-day comparison | Cloudflare retains unsampled RUM data for seven days before longer-term aggregation | Preserve complete-day exports within seven days, including sample intervals. Keep the September 17 analysis date without waiting to collect its evidence. |
| Capture a compact Accept category | A local reproduction shows the current substring check treats `text/html;q=0` as accepting HTML | Preserve parsed quality and preference semantics; a mutually exclusive preferred-format label alone is insufficient. |

The first four rows are supported by the pinned source review below. The RUM and Accept findings are supported by the platform and HTTP references. No external project establishes the accuracy of our classifier.

## Sequence and acceptance gates

### Step 0 — Freeze the baseline and resolve deployment state

The read-only [evidence extractor](../../../scripts/analytics-evidence.md) now implements repeatable D1/RUM snapshots, deployment capture, sampling/path/reconciliation checks, and file commitments. It does not implement new ingestion, owner marking, deployment, or controlled-client trials. Use a new private output directory per capture.

Record local commit, deployed Worker version, applied migrations, rule-list version, query time, and collection boundaries separately. The last observed Worker deployment was September 3 06:49:05 UTC; migration 0008 ran September 4 18:30:09. Recheck before implementation because these are operational facts, not permanent configuration.

Save daily D1 and RUM aggregate exports over identical complete UTC days. Include bot filter, `/stats` exclusion, valid-page scope, representation, sample intervals, and query errors. Keep views separate from daily clients and RUM visits. This preservation is a manual research operation initially, not a new scheduled service.

Prepare the already-written owner/network repair for release. Verify owner marking from the actual controlled browser and address: a shell request has a different UA and can mark the wrong daily identity. The mark covers that UTC day; it cannot remove known September 3 owner rows when called on a later date. Any historical owner marks need separately preserved identity evidence and an explicit audit record. Never exclude an ASN as the author.

**Gate:** saved baseline and deployment manifest exist; a controlled owner observation stays in storage but disappears from every intended public aggregate after the correct mark; no claim that migration completion proves ingestion code is deployed.

### Step 1 — TASK-0119: independent identity and role evidence

Keep one disjoint role classification for additive totals. Expose signature status as a separate facet, not an additional population. Retain the old `reader_kind` and reason as historical verdicts until the new read contract is accepted; use additional fields or a versioned projection rather than silently changing the existing API's meanings.

Proposed facts and interpretations:

| Field | Contract |
|---|---|
| `agent_name` | Existing UA rule result; a declaration, independent of signatures |
| `signature_status`, signer identity | Verification result under a named verifier version; preserve failed/absent/verified distinctions |
| `client_role` | Existing documented role vocabulary plus explicit unknown; signed identity is not a role |
| `role_basis` | Vendor documentation, UA declaration mapped through documented rules, request-shape inference, or unknown; never inferred per-request human intent |
| `role_rule_id` | Stable rule identifier linking to a small checked-in registry with source URL and checked date |
| collection/classifier/verifier versions | Small build-provided IDs linked to commit and rule data; no runtime network lookup |

Unknown signers remain visible as signed traffic without a claim of assistant use. Keep arbitrary signer strings bounded and private by default; expose named services through a reviewed registry. Resolve conflicts between signer and UA explicitly rather than taking the first match silently. The current signature-first branch in [readerkind.ts](../../../../analytics/src/readerkind.ts) demonstrates why this separation is necessary.

Ahrefs' signer origin alone does not distinguish its crawler from Site Audit; preserve a broad documented service role or unknown subtype. Exa's published `ExaSearchBot` identity supports a search-crawler rule, but the two historic signer-only rows lack the original UA in D1. Record a vendor-supported inference separately from an observed UA match. The two known DuckAssist tests are experiment evidence, not independently acquired audience.

Audit the verifier's supported draft/profile against its fixtures before publishing a compliance statement. The repository claims a draft identifier that this research did not substantiate; the inspected IETF document is `draft-meunier-webbotauth-httpsig-protocol-01`. Do not silently claim conformance to that newer document or update crypto behavior as a side effect of taxonomy work.

**Gate:** signed crawler, signed assistant, signed unknown, signer/UA conflict, unsigned declaration, and failed verification all have explicit outcomes. Per-role totals reconcile. Signature facets cannot be added to role totals. The nine historical verified facts remain nine; reconstructed roles identify their basis. Any historical rewrite appends `reader_kind_revisions` or an equivalent disclosed projection record.

### Step 2 — Record enough evidence to explain new verdicts

These additions serve the two tasks, not a general telemetry warehouse. Use additive nullable migration columns for history; require values at new ingestion through typed construction and tests. Do not invent old UA, transport, or version values. A small manifest can map version IDs to code/list hashes instead of repeating hashes in every row.

| Evidence | Placement and proposed bound | Named decision |
|---|---|---|
| `asn_source = request`; collection and rule versions | Observation facts; versions resolve through a checked-in manifest | Did a rule or traffic change? Can a verdict be reproduced? |
| Claimed engine/version, WebView flag, matched automation token, support-gate result | Compact observation fields; strings/enums bounded by schema | Did the browser-version gate make the right decision? |
| Source UA and relevant Accept/Fetch Metadata headers | Private diagnostic record, initially 14-day retention; proposed UA cap 1,024 bytes and explicit truncation flag | Can parser corrections and new tokens be investigated? |
| Parsed HTML quality, Markdown quality, explicit/wildcard/absent/invalid evidence, served representation | Observation facts; bounded numeric/enum fields | Did negotiation or classification misunderstand the request? |
| HTTP/TLS version and cipher | Private diagnostics and controlled-run manifests | Do otherwise matched clients differ by transport? |
| City-level network geolocation | Only when a recorded investigation requires it; private diagnostic field | Does apparent geographic spread reflect network exits? It is not a person's location. |
| Signature form, outcome/reason, elapsed time, verifier profile | Compact diagnostics; separately retain sanitized expired signature fixtures if required for replay | Is a failure syntax, retrieval, expiry, or cryptographic verification? |

Raw UA retention and diagnostic detail follow the current scope in artifact 13; this is not a proposal to remove that capability. Avoid a new UA parsing dependency initially: preserve the inputs and outputs of the existing bounded parser. Source evidence permits later correction without pretending a boolean support result is immutable truth.

**Reproduced Accept defect:** invoking `extractRequestMetadata()` locally returns `1` for `text/html;q=0`, `*/*;q=0`, and `text/html;q=0, */*;q=1`, but `0` for `text/*`. RFC 9110 gives more specific media ranges precedence and zero quality means unacceptable. Test positive wildcards, specific exclusions, ties, malformed qualities, absent Accept, and mixed Markdown/HTML. Coordinate with [negotiate.ts](../../../src/worker/negotiate.ts); neither its current parser nor analytics' substring check should be presumed a complete shared implementation. Historical impact cannot be calculated from the stored boolean.

**Gate:** all new observations carry honest provenance; truncation is visible; absent and unknown remain distinct; controlled inputs can be replayed; no backfill claims recovery of evidence never stored.

### Step 3 — TASK-0120: measure collection reliability

Emit structured stages around eligible observations: attempt, verification outcome, write acknowledged, and failure with bounded stage/error code. Include build version, event timestamp, and diagnostic correlation reference. Keep health telemetry outside the D1 write whose failure it measures. Aggregate by time and version; inspect current Worker logs before introducing storage or another service.

The current [ingestion](../../../../analytics/src/index.ts) waits for verification before inserting. [Directory fetch](../../../../analytics/src/webbotauth.ts) has no explicit deadline. Reproduce slow headers, stalled response body, bad JSON, missing key, invalid signature, and failed D1 writes with injected dependencies. No production loss has been established from this mechanism.

Start with one bounded verification attempt and one observation insert; on verification timeout retain the page fact with an unverified timeout result. Set a measured deadline with room for the write inside the platform budget; 2 seconds is an initial local experiment parameter, not an IETF requirement. Bound directory body size and cache growth as well as fetch time. Escalate to deferred enrichment or a queue only if measured requirements cannot fit this design.

Health logs are also best effort. An attempt without a terminal outcome is unresolved, not automatically a failed write; duplicate log delivery and sampling affect reconciliation. Use a generated observation-operation ID for joins if needed, with a short retention policy and no client continuity. Cloudflare Ray ID is supplementary correlation, not uniqueness. Do not implement automatic write retries without an idempotency contract.

**Gate:** every controlled injected failure has the expected stage outcome; slow signature retrieval cannot erase the eligible page in the tested path; successful response latency remains independent of persistence; health reports declare missing/sampled data. No claim of globally exact loss accounting.

### Step 4 — Execute a known-input matrix

Use an isolated dataset and route through the production extraction/classification functions. Exclude it structurally from audience metrics; a query flag alone is insufficient. Synthetic identifiers identify runs, not ordinary readers. Keep the existing browser-free audience collection unchanged during the experiment.

| Paired condition | What it isolates | Evidence required |
|---|---|---|
| Manual Chrome/Firefox/Safari, JS on versus off | Execution availability | Independently known browser/version, edge observation, execution stage |
| Same browser, beacon allowed versus explicitly blocked | Delivery loss | Blocker/rule version, attempt or queue result, collector receipt |
| Visible versus background tab; prerender then activation | Lifecycle mismatch | Visibility and activation events, whether a request occurred, count timing |
| Fresh navigation, reload, browser-cache hit, back/forward restore | Page display versus network request | Navigation type, `pageshow.persisted`, driver network trace; avoid inferring cache solely from a missing row |
| Default headless versus changed UA; HTTP client versus copied browser headers | Classifier dependence on claims | Exact configuration outside the UA; request evidence and verdict |
| Real-device WebView versus Redroid; manually versus automatically driven | Actual engine versus claimed environment | Available device/container versions and driver provenance; missing environments remain untested |
| Known client on normal versus available hosting network | Network-rule contribution | Actual test setup, observed ASN, paired behavior; no universal hosting verdict inferred from the pair |
| Successful, redirect, error, HEAD, prefetch, HTML and Markdown responses | Eligibility boundary | Request/response status, representation, exclusion reason |

Run ten repetitions per available condition initially, varying only the named factor. Expand unstable or failing cells. This is deterministic diagnostic coverage, not a population accuracy study. Record all attempted runs, including harness failures, and preserve the exact denominator at each stage.

Measure stages separately: driver navigation attempted, response observed, script executed, beacon queued/attempted, collector received, persistence acknowledged. The Beacon API's true return value proves queuing, not receipt. A blocked beacon cannot reliably report its own failure through the same blocked channel; collect driver/network evidence independently. Require unique run/stage records and expiry/replay rejection for the synthetic collector.

**Gate:** provide a runnable command, frozen manifests, classification matrix, stage counts, and unexplained cases. A reproducing mechanism does not establish its prevalence in production. The experiment ends with a specific collection repair, rule correction supported by counterexamples, narrower wording, or no change.

### Step 5 — Release only the supported repair

Prepare additive migrations, compatibility behavior for old rows and APIs, backfill SQL if justified, revision records, updated metric/privacy wording, and an exact deployment/rollback sequence. Verify migration and Worker activation separately. Rollback keeps old data and revisions; do not drop diagnostic or history tables to restore code compatibility.

Run analytics contract tests, affected Worker tests, package typechecks, and the blog build when API or served content changes. Check dashboard partitions, scoped paths, signature facets, all-time boundary, owner exclusion, empty/error states, and old/new data coexistence. Use known fixtures for tests, never assertions that the production population must reach a target ratio.

After release observe 24 hours for health and seven complete UTC days for method behavior. Continue the September 17 comparison using preserved daily exports. Stop when the declared questions are answerable; no permanent beacon, new classifier list, or analytics framework follows automatically from residual disagreement.

## Deferred publishing measurements

Attribution is useful but does not block these two priorities. Propose a separate bounded change only when selecting a distribution or internal-link experiment:

- Retain referrer kind (internal/external/absent/invalid) and a known-public internal path. Current [metadata extraction](../../../../analytics/src/metadata.ts) collapses internal referrals to null. Preserve external host only; browser policy often withholds external paths.
- Accept allowlisted campaign IDs/values for deliberately distributed links. Do not accept unrestricted query strings or retain click IDs by default. [Newsletter source collection](../../../src/client/subscribe.ts) already preserves path and selected campaign context; use its confirmed outcomes before building another event stream.
- Query existing representation facts before adding a public panel. Direct `.md`, bibliography downloads, blocked requests, and errors belong to separately defined artifact/access diagnostics, not silently enlarged page-view totals. Requests blocked before the Worker require edge/security evidence.

No repeated request interval, external referrer, or TLS property by itself establishes automation. No fetch or beacon establishes reading, usefulness, or a citation. Stronger publishing outcomes remain replies, supported corrections, confirmed subscriptions, and verifiable references under [ADR-0016.1](../../../../../docs/adr/0016.1-analytics-purpose-and-decision-loop.md).

## Storage, retention, and public disclosure

First measure existing log availability, redaction, volume, and export capabilities. Reuse it if it supports the required window and joins. Otherwise propose a narrow private diagnostic table keyed to observation IDs, with 14-day expiration for new diagnostics only. At 1,024 bytes per UA, a hypothetical 1,000 observations/day would use roughly 14 MB over fourteen days for UA bytes alone; measure actual rows, other fields, indexes, and write cost before selecting storage.

Keep routine aggregate history and classification revisions. Diagnostic expiration must not delete page observations or silently change past totals. Proposed bounds and retention are implementation defaults to validate, not deployed policies. Diagnostic access remains private; public research exports contain reviewed aggregates and selected sanitized fixtures. Exclude authorization, cookies, form bodies, unrestricted URL queries, TLS secrets/randoms, and raw IP persistence. Do not merge daily identifiers into cross-day identity.

The served privacy explanation must distinguish D1, private operational logs, and Cloudflare RUM. Bot scores and JA3/JA4 are not assumed available: Cloudflare documents `botManagement` as conditional on that product. Ordinary HTTP/TLS version and cipher are separate fields; fingerprinting is not required by this plan.

## Pinned open-source review

Cloned and read on September 6 UTC; no third-party code copied into the blog. These are selected precedents, not an exhaustive ecosystem survey or proof that a combination is novel. Earlier artifact 04's broad claims that no tool combines particular signals should not be repeated as established facts. Study designs and behaviors; do not import lists or copyleft implementation code without a separate dependency decision.

| Project and exact revision | Inspected code | Applicable prior art and boundary |
|---|---|---|
| Plausible `543b30185c104ce17900d03c95d95429180acc0b` | [Pipeline telemetry](https://github.com/plausible/analytics/blob/543b30185c104ce17900d03c95d95429180acc0b/lib/plausible/ingestion/event.ex#L89-L169), [UA and attribution](https://github.com/plausible/analytics/blob/543b30185c104ce17900d03c95d95429180acc0b/lib/plausible/ingestion/event.ex#L263-L324) | Outcomes, parse timeouts, timings, tracker version, parsed browser attributes, and explicit campaign fields. Its drop policy differs from our retained composition. The repo consumes an upstream IP classification; this is not evidence that its private classifier is available to self-hosters. |
| Plausible, same revision | [Lifecycle](https://github.com/plausible/analytics/blob/543b30185c104ce17900d03c95d95429180acc0b/tracker/src/autocapture.js), [Transport](https://github.com/plausible/analytics/blob/543b30185c104ce17900d03c95d95429180acc0b/tracker/src/networking.js) | Visible-page startup and persisted `pageshow` handling; keepalive fetch with response/error callbacks. Borrow experiment cases, not this tracker's counting semantics as ground truth. License: AGPL-3.0. |
| GoatCounter `c957f51c43eb56dcc462b7e9d7a4550955b71846` | [Collection](https://github.com/arp242/goatcounter/blob/c957f51c43eb56dcc462b7e9d7a4550955b71846/handlers/count.go#L37-L96), [bot storage](https://github.com/arp242/goatcounter/blob/c957f51c43eb56dcc462b7e9d7a4550955b71846/db/schema.gotxt#L92-L99), [UA validation](https://github.com/arp242/goatcounter/blob/c957f51c43eb56dcc462b7e9d7a4550955b71846/hit.go#L285-L321) | Retained bot reason plus UA and bounded inputs; server classification overrides client-reported low bot codes. This does not certify human traffic or require our adopting its separate table. License: modified EUPL-1.2, inspect before reuse. |
| Matomo Device Detector `5a6f5d0184b5a867c1db9c0733f6b89686c5c47b` | [Ahrefs variants](https://github.com/matomo-org/device-detector/blob/5a6f5d0184b5a867c1db9c0733f6b89686c5c47b/regexes/bots.yml#L61-L75), [Exalead identity](https://github.com/matomo-org/device-detector/blob/5a6f5d0184b5a867c1db9c0733f6b89686c5c47b/regexes/bots.yml#L634-L640) | Separate exact UA pattern, name, category, producer, and source. `ExaBot` is associated with Dassault, not Exa AI. Vendor documentation must settle identity collisions. License: LGPL-3.0. |
| Anubis `4578023de7b631537e3a43d89b1998e802beb7e0` | [Browser-shaped rules](https://github.com/TecharoHQ/anubis/blob/4578023de7b631537e3a43d89b1998e802beb7e0/data/common/acts-like-browser.yaml) | Header combinations adjust a weight and the file warns of bypasses. Use as counterexample to treating header presence as authenticated humanity; a challenge system has a different objective from audience measurement. License: MIT. |

## Authoritative references and their limits

All checked September 6, 2026 UTC. These sources establish protocol or product behavior; field choices and priorities above are our engineering judgment.

| Reference | Supports | Does not establish |
|---|---|---|
| [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), especially security considerations | Integrity/authenticity of covered components and application-specific coverage/replay concerns | Human intent, reading, benign purpose, or complete verifier conformance |
| [Web Bot Auth protocol draft 01](https://datatracker.ietf.org/doc/html/draft-meunier-webbotauth-httpsig-protocol-01), §§4.1–4.6 and 6.8 | URL/key association, distinction from trust/delegation, retrieval limits | A final IETF standard or a compliance claim for our existing implementation |
| [Ahrefs bots](https://ahrefs.com/robot), [Exa Search Crawler](https://crawler.exa.ai/) | First-party client roles; Exa names `ExaSearchBot` and documents signing | The precise action behind each historical signer-only request |
| [W3C Fetch Metadata](https://www.w3.org/TR/fetch-metadata/) | Navigation metadata, `none`, and browser-context semantics | That a custom HTTP client cannot imitate the headers |
| [RFC 9110 §12.5.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-12.5.1) | Accept quality, specificity, and wildcard interpretation | Attention or whether any particular production row had a rejected quality |
| [W3C Beacon](https://www.w3.org/TR/beacon/), [Navigation Timing draft, September 1, 2026](https://www.w3.org/TR/2026/WD-navigation-timing-2-20260901/) | Queuing versus delivery; navigation timing/type and cache-related experiment observations | Humanity or representative production prevalence |
| [Cloudflare RUM FAQ](https://developers.cloudflare.com/web-analytics/faq/) | Seven-day unsampled storage, query sampling, beacon behavior and blockers | A ground-truth human counter or exact comparability without matching filters |
| [Cloudflare `waitUntil`](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil) | Up to thirty seconds after response/disconnect, shared across background tasks | Durable guaranteed analytics persistence |
| [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/), [Ray IDs](https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/) | Operational outcomes and correlation; Ray IDs need not be unique | Lossless logging or an idempotency key |
| [Worker request metadata](https://developers.cloudflare.com/workers/runtime-apis/request/) | Available connection fields and conditional Bot Management object | That the current account receives every documented field |
| [OpenTelemetry service](https://opentelemetry.io/docs/specs/semconv/resource/service/) and [UA attributes](https://opentelemetry.io/docs/specs/semconv/registry/attributes/user-agent/) | Version provenance and structured UA vocabulary | A requirement to install OpenTelemetry or capture every attribute |
| [W3C Referrer Policy](https://www.w3.org/TR/referrer-policy/), [campaign parameters](https://support.google.com/analytics/answer/10917952?hl=en) | Referrer limitations and deliberate campaign attribution | Authenticated referral origin or causality |

## Cross-references and remaining decisions

- [ADR-0016](../../../../../docs/adr/0016-analytics-observation-semantics.md): collection and history; an amendment is needed before new production diagnostic fields alter its no-UA contract.
- [ADR-0016.1](../../../../../docs/adr/0016.1-analytics-purpose-and-decision-loop.md): engineering threshold and successful no-action outcome.
- [ADR-0016.2](../../../../../docs/adr/0016.2-browser-evidence-and-reader-tier.md) and [ADR-0016.3](../../../../../docs/adr/0016.3-audience-composition-and-citable-articles.md): browser evidence and current role partition; update the latter alongside the new identity/role contract.
- [ADR-0016.4](../../../../../docs/adr/0016.4-owner-exclusion-and-network-evidence.md): owner marking and revision history.
- [Artifact 04](04-open-source-and-asn-lists.md), [artifact 09](09-fetch-metadata-prior-art.md): earlier prior art; preserve as dated research rather than silently replacing conclusions.
- [Artifact 12](12-production-followup-2026-09-05.md), [artifact 13](13-two-priority-implementation-plan.md): measured problem and accepted planning scope.

Before coding, settle the compatibility shape of role/identity fields and whether existing logs satisfy diagnostic retention. Before release, settle exact retention/storage cost, supported verifier profile, and any historically reconstructed roles. None of these open decisions prevents preparing typed contracts, fixtures, local experiments, and the reviewable implementation.
