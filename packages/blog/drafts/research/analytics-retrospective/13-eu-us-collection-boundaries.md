# Preserve useful analytics evidence under EU and US privacy guidance

October 25 Pacific / October 26 UTC, 2026. Active continuation of TASK-0119 and TASK-0120. Research and proposed design; not a claim of deployment or a legal compliance certification.

## Requested outcome and completion evidence

The owner wants materially better evidence about future requests, including useful User-Agent information, while respecting EU and US guidance and avoiding direct identifiers. The later instruction explicitly adds US guidance. Existing instructions already rejected a blanket exclusion of useful UA evidence in September: [artifact 13, collection boundaries](../readers-vs-bots/13-two-priority-implementation-plan.md#additional-evidence-and-collection-boundaries). Production still discards the raw UA after classification.

Completion requires a field/purpose/retention/access register; authoritative sources and applicable prior art; an amended collection decision; implemented and tested collection, expiry and disclosure; proof that private diagnostics cannot escape through public reports; separate deployment and controlled production acceptance. History stays historical. Adding nullable columns or passing a parser test alone is insufficient. A claim of zero future lost writes is outside the capabilities of the existing best-effort collector and must not be made.

The owner's response to the initial scope question asks us to study established practice before asking them to choose. No privacy-mode decision is inferred from that reply. Prepare the concrete recommendation and implementation before any unresolved activation decision.

## What the primary sources establish

These are checked sources, not an assumption that one jurisdiction's exemption applies worldwide.

| Source | Supported finding | Design consequence / limit |
|---|---|---|
| [European Commission: GDPR principles](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr_en) | Purpose, necessary data, security, retention and accountability all matter. | Justify fields against specific debugging or publishing decisions. Private does not mean exempt; no invented universal retention period. |
| [EDPB final Guidelines 2/2023, version 2.0](https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf), adopted 7 October 2024, paragraphs 43 and 56 | Header-based collection, including User-Agent, can fall within ePrivacy scope depending on use; applicability and exemptions require assessment. | No claim that cookieless or server-side collection automatically avoids consent requirements. Do not introduce device probing or a new fingerprint. |
| [CNIL: audience-measurement solutions](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience), 4 July 2025 | The French exemption has purpose, output, separation and other conditions; it is not a product certification. Recommended durations include 13-month trackers and 25-month collected information, subject to necessity review. | These are not mandatory defaults or an EU-wide safe harbour for our custom service. Document the applicable basis/exemption and transfers; avoid joining to newsletter identities. |
| [California: personal information](https://privacy.ca.gov/what-is-personal-information/) | Linkability includes household context, browsing history and pseudonymous profiles. | Rows linked by daily client IDs are not categorically non-personal merely because emails and raw IPs are absent. |
| [CPPA minimization advisory 2024-01](https://cppa.ca.gov/pdf/enfadvisory202401.pdf) | Necessity and proportionality cover collection, retention, use and sharing; the advisory is not a safe harbour. | Document why each retained field is useful and why its granularity/window is needed. |
| [FTC: Start with Security](https://www.ftc.gov/business-guidance/resources/start-security-guide-business) | Collect what is needed, limit retention and restrict access. | No indiscriminate request-header dump. Use explicit fields, authorization boundaries and verified deletion. |
| [Colorado Attorney General: CPA](https://coag.gov/resources/colorado-privacy-act/) | Covered entities have transparency, security and consumer-rights duties; scope and thresholds differ from California. | A US assessment cannot stop at a CCPA label. This is a shared engineering baseline, not a fifty-state legal determination. |
| [CPPA rights and preference signals](https://www.cppa.ca.gov/faq.html) | GPC addresses sale/sharing opt-outs for covered businesses. | We do not sell or use cross-context advertising. Voluntarily skipping optional diagnostics on privacy signals is an additional product choice, not a claim that GPC universally forbids first-party analytics. |

Direct identifiers and personal data are different boundaries. A free-form UA can contain arbitrary client-supplied text. Removing familiar identifiers does not prove that every possible name or identifier has been removed. Even structured browser/OS facts can be personal in a sufficiently linked record. Describe this honestly rather than labelling new event-level collection PII-free.

## What established systems actually do

| Implementation / primary source | Actual documented practice | What we should reuse |
|---|---|---|
| [Plausible data policy](https://plausible.io/data-policy) | Derives browser/OS/device information, discards raw UA and IP, and uses daily identifiers with a salt it says is deleted every 24 hours. | Retain useful parsed fields instead of only a three-way class. Its deletion of daily salt differs from our reproducible master-key derivation. Its compliance claims are not a regulator verdict on our design. |
| [GoatCounter privacy policy](https://www.goatcounter.com/help/privacy), 8 June 2025 | Defaults to separate aggregates; individual pageviews are optional. Stores parsed browser/system values and discards the raw UA. A temporary client mapping stays in memory for up to eight hours. | Separate aggregate audience reporting from detailed diagnostics. Do not cite the older pinned bot-UA table as proof of current routine raw-UA retention. |
| [Matomo retention documentation](https://matomo.org/faq/general/configure-data-retention/) and [collected data](https://matomo.org/faq/general/faq_18254/) | Distinguishes raw visit information from aggregate reports, with independently configurable retention; derives device/browser facts from UA. | Use separate lifecycles so deleting diagnostic evidence does not erase audience totals. Documentation alone does not establish that a particular Matomo version persists every original UA. |
| [IETF's own analytics policy](https://www.ietf.org/policies/web-analytics/) | Lists User-Agent collection and configures Matomo with five-day raw visitor retention and twelve-month aggregate retention, subject to its counsel's review. | A concrete precedent for bounded detailed evidence alongside aggregates. Five days is that deployment's choice, not a legal requirement for us. |
| [OpenTelemetry UA attributes](https://opentelemetry.io/docs/specs/semconv/registry/attributes/user-agent/) | Distinguishes original UA from parsed name/version, OS fields and synthetic-traffic classification. | Keep the original evidence and derived interpretation distinct, with explicit fidelity/version. This vocabulary neither requires installing the SDK nor establishes a lawful basis. |

The systems make different tradeoffs. A blanket statement that good analytics always retains raw UA, or always discards it, is unsupported. Our demonstrated need is rule replay after a classifier gap; routine browser compatibility analysis needs substantially less detail.

## Proposed field and purpose register

This register is a recommendation to implement, not a list of already populated production fields. Existing fields are preserved unless a separately reviewed migration changes them.

| Evidence | Question it answers | Placement and boundary |
|---|---|---|
| Browser/engine family and major version; OS family and major version | Which compatibility paths and browser-version rules actually matter? | Bounded structured facts. Unknown remains unknown; no guessed model/build. Linked rows remain pseudonymous. |
| Declared client name/token, browser/WebView/headless/HTTP-client form, Fetch Metadata support premise | Did classification use the right declaration and rule? | Known vocabulary plus source/version; no inference of human intent. Preserve bounded UA privately for replay. |
| Bounded UA evidence, redaction/truncation/fidelity flags | Can a later parser fix recover a missed declared client? | Private expiring diagnostics. Explicit cap; no public API/export. Never claim redaction proves anonymity. |
| Accept evidence and parsed HTML/Markdown quality/preference; existing Fetch Metadata | Did negotiation or request-shape parsing misread the input? | Parsed facts plus bounded source evidence where needed for replay. Exclude unrestricted headers and label incomplete replay. |
| Primary language only | Is another language or presentation worth investigating? | Coarse parsed language; no full ordered language fingerprint. |
| Response status and representation; HTTP/TLS version and cipher; edge colo | Did platform/transport differences explain a failed delivery or parser case? | Platform-provided enums/bounded values in diagnostics; no TLS handshake secrets, JA3/JA4 or derived persistent fingerprint. |
| Collection/classifier/parser/verifier version and bounded verification outcome | Did traffic change, or did the method change? | Small IDs resolving to source; absence/failed/unavailable distinct. No raw signature, nonce, authorization credential or key material. |
| Existing country and ASN context | Is traffic mix or hosting context changing? | Keep current coarse network interpretation. City/coordinates have no demonstrated current decision and are deferred. Network is not a person. |
| Known public page paths and recognized internal transitions | Which published content receives recorded delivery? | No unrestricted URL/query/fragment storage. Unknown or token-bearing routes must not become new diagnostic strings. |
| Allowlisted campaign labels | Did a deliberate distribution experiment change a signal? | Only predefined campaigns when an actual experiment needs them. No click IDs, arbitrary query strings or external full referrer URLs. |
| Attempt/stored/failed stage and bounded failure code | Is the collector silently losing evidence? | Structured health outside the D1 write it measures; no raw exceptions or header dumps. Best effort and sampling remain limits. |

Always exclude raw IP persistence, account/newsletter joins, email/name/contact fields, cookies, authorization, form bodies, unrestricted queries, full external referrers, precise location, device advertising IDs, cross-day identity and active fingerprinting. Do not request high-entropy Client Hints or add a browser beacon merely to fill columns.

## Storage, access and lifecycle recommendation

1. Keep compact observation facts and source versions separate from a private diagnostic table. Link with a local observation key; do not duplicate or introduce a cross-day client identity.
2. The earlier fourteen-day proposal addressed calibration only. For the demonstrated roughly six-week review gap, the prepared recommendation is sixty days of private diagnostic evidence. Measure actual size and review the need; this is an engineering choice, not a legal minimum or maximum. Public queries never select diagnostic columns. CLI access uses existing authenticated Cloudflare access; no new public diagnostic endpoint.
3. Apply explicit input caps, direct-identifier redaction and fidelity flags. A sanitized/truncated value supports only the replay it actually preserves. Test adversarial headers and absence, not just standard Chrome examples.
4. Enforce expiry on reads and scheduled bounded cleanup. State the physical cleanup lag. Retention must cover exports and backups too: [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) can retain paid-plan database history for thirty days, so live-table expiry is not a complete-erasure guarantee for backup copies. Purge before serving a restored database.
5. Preserve aggregate history when diagnostics expire. Existing indefinite pseudonymous event retention needs an explicit review; do not silently delete history or pretend aggregate retention equals individual-row retention.
6. Update privacy text to distinguish routine analytics, private diagnostics, operational logs and RUM. Document purpose, access, lifecycle and a rights/request route. Do not claim worldwide exemption, anonymous linked data or regulator certification.
7. Review provider terms/transfers: [Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/) and [D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/). A location hint is not a jurisdiction guarantee; this existing binding has no recorded EU-only acceptance. Do not move or recreate a production database as an incidental change.

## Current access and acceptance state

The latest [native access receipt](11-native-access-receipt.md) established a populated HTTP-request view, not comprehensive Worker invocation-header coverage. The October 26 attempt to resume Chrome inspection failed because the Mac is locked; the owner has been asked to unlock it. No credential was read or altered. Existing raw-UA recoverability remains unverified, not disproven.

Completed in this continuation: current collector/schema/privacy review, primary EU and US guidance review, current analytics-system comparison, field/purpose/lifecycle recommendation. Next bounded engineering: typed extraction and privacy/fidelity fixtures, then private persistence/expiry/public-isolation acceptance under the settled boundary. No new production collection is active from this research record.

## Prepared local implementation

[ADR-0016.10](../../../../../docs/adr/0016.10-private-request-evidence.md) records the concrete proposal and gates. The current working source adds an explicit optional profile, trusted-page gating, structured software/language/status facts, bounded/redacted source evidence, a private table with separate expiry, read-side exclusion, bounded cleanup, public-report isolation and a signature-verification deadline. The profile remains off by default and no production migration or capture has been activated. The sixty-day candidate specifically addresses the observed six-week review gap; it is not inferred from the IETF's five-day choice or the CNIL's maximum recommendation.

Local analytics tests currently pass 80/80, including timeout, malformed/oversized input, retained base event on diagnostic failure, public canaries and migration/history preservation. Native local-D1, Worker integration and typechecks have separate passing receipts below. Isolated generated content and production activation remain separate acceptance steps. The code does not claim redaction makes arbitrary UA text non-personal. The existing indefinite event-retention policy remains a recorded gap rather than being silently treated as compliant because new diagnostics expire.


[Native local-D1 acceptance](request-evidence-local.json) and its [reproducer](check-request-evidence-local.mjs) exercise migration 0011 and actual collector calls across nine cases: ordinary capture, disabled mode, two preference signals, unknown path, failed signature, signature timeout, diagnostic-write failure and trusted-index timeout. Four rows have structured evidence, three have private payloads; the current report has nine views. Expiry makes the private reads empty; cleanup removes three diagnostics while all ten audience rows, including the historical fixture, remain. Synthetic payloads serialize to 518–540 bytes in this cohort; this is neither a production size distribution nor metered production write cost. At 1,000 such events per day a sixty-day window would contain roughly 32 MB of payload bytes; the enforced 4-KiB payload ceiling would allow about 246 MB before row/index overhead. Those are planning examples, not observed traffic or billing.

Worker tests pass 106/106 and workspace typechecks pass. An initial disclosure import pulled server-only Worker types into the static-site compiler; moving the shared retention constant into the worker-independent contract fixed that boundary. The failed check and subsequent passing log are retained privately. The native harness also initially split a semicolon inside a SQL comment; stripping line comments before statement splitting fixed the harness, with the migration unchanged. No failed run is being reported as passing.


## Recommendation and outstanding privacy work

Retain compact parsed facts for routine compatibility and traffic analysis; use a distinct expiring source-evidence store only for documented classifier and collection investigations. The sixty-day source window is a candidate driven by the actual review interval, not a regulator-approved duration. Compare it with a shorter rolling window plus explicitly scheduled investigations before activation. Owner approval alone would not establish a GDPR lawful basis or an ePrivacy exemption.

The current code review also found that the public signer section groups and emits stored verified `signature_agent` origins directly (`stats.ts`, signer section), unlike the reviewed referrer catalogue. A verified key does not make an arbitrary personal signing domain safe to publish. This is an existing disclosure surface to assess before claiming the entire public report contains only reviewed names; the new private-payload isolation fixtures do not test that broader claim. Proposed next step: retain source origins privately and publish reviewed signer names plus Other, with unchanged totals and a versioned report contract.

Other unresolved work is concrete: aggregate-preserving expiry for existing indefinitely retained linked observations; lawful-basis and ePrivacy analysis for the applicable jurisdictions; usable rights/contact procedures; provider/transfer review for this account; and actual native-log coverage. These are not repaired by adding a TTL to a new table.

For routine private review, [the summary generator](build-request-evidence-summary.mjs) accepts an inclusive UTC start date and exclusive end date, limited to sixty days. It emits aggregate-only SQL for capture coverage, browser/OS majors, client form, language, HTTP, verification outcomes and collection versions. It includes stored owner/referral-excluded observations on purpose: these are collection-health counts, not the public audience population. No IDs, raw headers or referrer names are returned. The query passed the native local-D1 fixture with 9 stored observations, 4 structured captures and 3 unexpired private payloads. Its first UNION-based version exceeded D1's compound-SELECT limit; the accepted version uses VALUES plus CASE, and no production query was attempted.


[Final source/build checks](request-evidence-source-checks.json) pass: 80 analytics tests, 106 site tests, workspace types, 31 isolated built posts, 145 local references, one article H1 and 22 shaping prompts. The article remains 1,250 words including its glossary. Migration 0011 was the only pending migration and is now applied before source publication; the optional collection setting is absent from source and deployed secret names. This supersedes the earlier unapplied-schema status only. Expanded capture remains off; activation is still unaccepted.


## Delivered with expanded capture off — October 26 UTC

Source `e455766` was pushed after migration 0011. [Off-mode release acceptance](request-evidence-off-release.json) records the 100% Worker version, live article byte match, updated privacy text, 22 prompts and one excluded supplied-UA control. The exact [bounded verification SELECTs](request-evidence-off-verification.sql) passed native local D1 first, then used **two metered reads and zero SELECT writes**, within a 5,000-read ceiling. The control is stored under collection version `2026-10-26.3` with no structured capture, and the new diagnostic table is empty. One cold public policy preflight is additional unmetered report work; the two-read figure is not an account total.

The source profile is absent from both checked configuration and deployed secret names. This accepts the off-mode delivery, not expanded capture or worldwide legal compliance. The article remains 1,250 words and is served byte-for-byte equal to the isolated build. An extra stdin-based native query check stalled; the same query ran successfully from a file, and the task-owned stalled process was stopped. No production SQL ran before that native pass. Original logs remain private.

Next bounded action: settle the requested direct-identifier versus personal-data boundary and the applicable collection/disclosure basis, including retention and rights handling; then accept a deliberately enabled private profile with excluded controls. The pending owner question is not consent from site visitors or a substitute for that assessment. Existing native log recoverability and human-operated calibration remain unaccepted.
