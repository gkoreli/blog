# Verification outcomes and documented vendor methods — October 27 UTC

Continues [research 19](19-explicit-classification-uncertainty.md), [the dedicated verifier audit](18-webbotauth-verification.md), [TASK-0119](../../../../../docs/tasks/TASK-0119.md) and [ADR-0016.13](../../../../../docs/adr/0016.13-verification-outcomes-and-vendor-methods.md). This phase implements failure distinctions and one documented signing-origin method. IP/DNS methods and independent population calibration remain proposed work.

## What the specification means here

The local module already verifies an Ed25519/directory-discovery subset of RFC 9421 with dictionary and legacy wire compatibility. It is not full RFC/draft conformance or equivalent to every provider's native profile. The previous audit preserves exact versions, cache/rotation limits, replay policy and retained Exa evidence. Native booleans remain independent, nullable inputs; a vendor's automatic-edge statement cannot establish which assessment fields this account receives.

A valid signature proves selected components against the resolved key. A documented vendor origin supplies an additional attribution method. Neither tells us who asked for a page, what they did with it, whether a physical person read it, or whether an accepted message was replayed. The retained 19 Exa records bind neither UA nor article path and were checked at recorded times using a later directory snapshot; that boundary remains unchanged.

## Primary sources and cross-references

Checked October 27, 2026. Vendor statements describe their service; retained measurements establish only what was captured.

| Primary source | Applicable fact and implementation consequence |
|---|---|
| [ExaSearchBot](https://crawler.exa.ai/), updated July 30, 2026 | Documents signed requests and its public directory. Recognized declaration plus verified documented origin is a separate method result; the UA is not automatically authenticated. |
| [ExaUser](https://crawler.exa.ai/exauser), updated September 30, 2026 | Explicitly documents the same signing directory, as well as user **or application** initiated fetching. This supports both registry entries without extending a crawler-only statement by inference. |
| [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421.html), February 2024 | Component coverage and application policy determine the proof boundary. Local rejection is not a claim that every RFC-compliant verifier rejects the message. |
| [Cloudflare Web Bot Auth](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/), updated October 8, 2026 | Documents its registered-key profile, legacy quoted-string form, rejected dictionary form and expiry-based replay mitigation without a nonce database. Our dictionary support does not prove native equivalence. Compare [pinned reference-code review](18-webbotauth-verification.md). |
| [Google request verification](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests), updated March 20, 2026 | Uses role-specific published ranges or reverse lookup followed by forward confirmation. Reverse-host suffix alone is insufficient; generic Google Cloud membership is weaker than the crawler-specific feed. |
| [Ahrefs verification](https://ahrefs.com/robot) and [its linked public ranges](https://api.ahrefs.com/v3/public/crawler-ip-ranges) | Publish shared crawler IP ranges and reverse-DNS suffixes. The page does not document an Ahrefs signing-origin binding; its public signer display approval remains a display rule, not a verification trust grant. |
| [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) | Documents separate search, training, user-action and ad-validation clients and IP feeds. OAI-AdsBot is not silently mapped to training. Supported next method: role-specific feed membership, not ASN association or an inferred human trigger. |
| [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | Lists separate Bot/User feeds and combines UA with address conditions. Feed membership would support network attribution, not prove a particular user's task. |
| [ipaddr.js source](https://github.com/whitequark/ipaddr.js/blob/main/lib/ipaddr.js) and [types](https://github.com/whitequark/ipaddr.js/blob/main/lib/ipaddr.d.ts) | Candidate CIDR library, not installed in this phase. Its parser deliberately accepts noncanonical IPv4/octal/hex and scoped IPv6. A future collector wrapper must enforce its own strict address grammar, public-address policy, mapped-IPv6 behavior and feed validation. This moving-main inspection is not a pinned package adoption. |

The Exa method registry lives in `packages/analytics/src/vendor-signatures.ts`, independent of `signers.ts` display approvals. Both Exa declarations have the same documented origin. Other declarations, including Ahrefs, are explicitly unmapped by this method. Matching and different-origin states do not select a client name or change the classification group. With multiple declarations, the method covers its documented subset and records how many declarations remain unmapped; it does not resolve the others.

## Failure evidence and reporting

`signature-evidence.ts` maps every emitted local failure code to a closed category. Invalid input/cryptographic mismatch, unsupported format/algorithm, directory/key/deadline unavailable, time/coverage policy rejection, outside-profile signatures and indeterminate cases stay separate. Missing keys can mean rotation or unavailable evidence; they are not labelled impersonation. Combined unsupported-or-missing-component failures stay indeterminate because the old reason cannot distinguish those mechanisms.

Two verifier fixes preserve that distinction. A thrown crypto operation now returns verification-error; only a negative cryptographic result is signature-invalid. Multiple failed candidate signatures retain all distinct reason codes. Mixed categories abstain into indeterminate rather than letting the final label choose the explanation. A successful supported candidate still wins. Unknown injected error text is normalized before routine persistence, preventing free-text evidence leakage.

New evidence stores outcome, reason codes and the documented-origin comparison in the existing bounded signature JSON. Collection/verifier/evidence versions are `2026-10-27.3`, classification remains `.2`, and the public cache version changes. No migration, historical rewrite, optional diagnostics activation or raw reader-address retention occurs. Earlier unsuccessful rows lacking the new detail stay explicitly unrecorded. Public counts share the report's owner/referral/time/path selection; coverage and vendor-method rows overlap and are not extra events.

## Executed local checks

[Local D1 acceptance](verification-outcomes-local.json), produced by [the helper](check-verification-outcomes-local.mjs), runs twelve actual collector fixtures through workerd D1, with Node 24.14.1 crypto. Ephemeral keys and intercepted public-directory URLs test method mechanics; they do **not** authenticate Exa or any vendor. Trials cover minimal/bound matching origins, a different origin, tampering, unsupported algorithm, unavailable directory, expiry, absence, another signature profile, an unmapped declaration, mixed failures and a labelled injected verdict. The current native assessment fields are unavailable in these fixtures.

History, native nulls, owner/referral exclusions, empty results, literalized production SQL, new versions and the 2,048-byte budget pass. The helper initially needed loopback permission and a correction to its assertion's report field name; those harness failures are not production failures. The analytics suite passes 111 tests, including every emitted failure code, order reversal, actual Ed25519 tampering, simulated crypto exceptions and privacy canaries. Remaining checks and delivery are recorded below.

## Production budget check

One locally validated all-traffic seven-day SELECT (October 21–27 UTC) succeeded at **109,116 row reads, zero writes**, exceeding its planned **50,000** ceiling. This is a failed budget acceptance, not a successful bounded-read claim. Its exact SQL hash, plan, private response and metering are retained. The previous narrower unresolved/signed selections do not establish the cost of this all-traffic report. No repeated broad query is authorized by this receipt. Public cold fills and unrelated account work are additional. Narrow prospective controls will use indexed time/path bounds and their own metering; this phase claims no query-cost reduction.

## Next bounded work

Accept source activation, served API/UI/article, cache reuse and excluded prospective unsigned controls separately. An organic signed request is still needed to accept production coverage and origin comparison under actual Worker crypto; fixture acceptance cannot supply that result. For public IP-feed methods, pin a reviewed parser version/source, inspect actual feed schemas, enforce body/prefix/fetch/cache/deadline bounds, retain source digest/freshness and missing/unavailable states, keep addresses in memory and validate native/local failure behavior before activation. Exa's signatures do not require an IP-membership assumption.

Then run independently labelled human/browser/device/network and automation trials with explicit eligibility, stage receipt, errors and abstention denominators. A dataset of header fixtures cannot establish population accuracy. The recovered R1 spike has no recognized named declaration, so these vendor methods do not identify its operator. Unknown remains the truthful result where evidence is missing.

[Source checks](verification-outcomes-source-checks.json) pass 111 analytics tests, 106 site tests, workspace types, 21 Markdown validations and an isolated 32-post build. The retrospective remains 1,250 words, one H1 and 30 original shaping messages. The exact [narrow control SELECT](verification-outcomes-control-acceptance.sql) also passes native local D1. Initial pnpm build hit sandboxed tsx IPC; direct node-import checks and the isolated build passed. Source push, activation and live acceptance remain separate.

## Release acceptance — October 27 UTC

[Release receipt](verification-outcomes-release.json) separately records source `87b381f`, its exact Cloudflare build, 100% activation at 16:32:20 UTC, served article bytes, new API fields, browser rendering and byte-identical cache reuse. The browser shows 225 historical signed-client views with **225 vendor checks not recorded**, avoiding a retrospective attribution claim. New outcome and vendor sections render without captured errors or warnings.

Three prospective /privacy controls under the locally tested and live-confirmed exclusion policy store unsigned Exa as documented/not-verified, Ahrefs as unmapped/not-configured, and malformed Exa signature input as invalid. All preserve their independently declared category and have no optional structured capture. The [exact narrow SELECT](verification-outcomes-control-production.sql) reads six rows and writes zero. A fresh ExaUser /privacy report has zero included views and three exclusions in the historical selection, including the two new Exa controls; it is not described as three new Exa requests.

Total acknowledged direct SELECT work is **109,122 reads, zero writes**, including the broad ceiling failure; public report fills, three observation writes and unrelated account work are additional. The code adds no report statements, but this phase claims no metered cost reduction or passed broad-read budget. Temporary private execution copies remain outside Git with an October 31 manual review date.

Completed: closed failure distinctions, retained mixed-candidate reasons, crypto-error abstention, documented Exa origin registry, coverage-aware reporting, preserved history, twelve local collector fixtures, three excluded production controls, activation, cache/API/article and browser acceptance. Organic signed Worker acceptance, IP/DNS feed methods, device-default repair and independent labelled error/abstention experiments remain open. Next bounded work is a source-pinned, failure-aware published-IP-feed prototype, tested locally before any routine activation. The dedicated Web Bot Auth article remains an outline in research 18; this phase updates the existing concise retrospective without claiming a new article publication.
