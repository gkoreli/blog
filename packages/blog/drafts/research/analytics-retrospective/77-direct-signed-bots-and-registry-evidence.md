# Signed crawlers can be Direct bots

October 29, 2026 UTC. Continues [Research 76](76-native-bot-signals-and-public-diagnostic.md). **Cloudflare lists ExaSearchBot as Direct/Search while showing its signature directory.** A signed request does not automatically belong to the intermediary class described by `signedAgent`. This distinction changes the native comparison we can honestly claim.

## Compare each named client

| Declaration | Current vendor documentation | Reviewed Cloudflare registry metadata |
| --- | --- | --- |
| ExaSearchBot | Search/index crawling; every request signed | Verified, Direct, Search; signature directory displayed |
| ExaUser | Live fetch requested by a user or API application; every request signed | Entry unresolved in one exact public search |
| AhrefsBot | Ahrefs/Yep database crawling; published IPs and rDNS | Verified, Direct, SEO; no signature-directory field shown |
| AhrefsSiteAudit | Users launch site audits; published IPs and rDNS | Verified, Direct, SEO; no signature-directory field shown |

Sources: vendor [ExaSearchBot](https://crawler.exa.ai/), [ExaUser](https://crawler.exa.ai/exauser) and [Ahrefs](https://ahrefs.com/robot); registry [ExaSearchBot](https://radar.cloudflare.com/bots/directory/exasearchbot), [AhrefsBot](https://radar.cloudflare.com/bots/directory/ahrefsbot) and [Site Audit](https://radar.cloudflare.com/bots/directory/ahrefssiteaudit). These are service descriptions and declarations, not authenticated triggers of our individual requests.

Three direct CLI registry captures fail with `HTTPError`; response status/body were not retained, so no particular rejection code is inferred. Fresh browser DOM captures establish all three entries separately. Radar's public WebMCP search for `ExaUser` returns no matches. That scoped result does not prove registry-wide absence, rejected registration or lack of native support. We leave ExaUser unreviewed in the new assessment.

Ahrefs' published Site Audit UA uses a different informational URL from Radar's displayed example. Both retain the exact client token. Our matcher already accepts the current desktop/mobile forms; the URL discrepancy supplies no evidence of impersonation.

## Registration, verification and field exposure are separate

Cloudflare's [`signed_agent` reference](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.bot_management.signed_agent/) describes a known WBA agent classified as intermediary, with Enterprise Bot Management required. Its [taxonomy](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/) describes Direct/Intermediary access and potentially multiple behaviors. The three observed Direct entries cannot be assumed eligible for a universal signature-verification boolean. A surprising true value would need investigation; false alone would not establish cryptographic rejection.

Exa's statement about automatic edge validation and our missing Worker field concern different surfaces. Neither source proves what the other surface did on a particular request. Research 76's Free-plan observation remains dated evidence, not a new account inspection here.

Fresh HTTPS captures of the [Exa](https://crawler.exa.ai/.well-known/http-message-signatures-directory) and [Ahrefs](https://ahrefs.com/.well-known/http-message-signatures-directory) directories each expose two Ed25519 keys. Response-signature verification is not executed. Publication does not establish a signing promise for every related client, historical resolver equivalence or provider enrollment. Ahrefs remains outside the per-client signing-promise registry; its separately reviewed first-party directory and [retained replay evidence](75-frozen-signed-cohort-and-export-boundaries.md) remain intact.

Ahrefs' own [Bot Analytics documentation](https://help.ahrefs.com/en/articles/14297049-about-bot-analytics) separates declared names from verification, using published ranges and a Cloudflare fallback. It explicitly retains claimed names when verification is unavailable. We keep that useful boundary, while declining to treat generic known-bot recognition or a missing range match as universal cryptographic truth.

## A dedicated offline assessment preserves the unknowns

[`native-bot-comparison`](../../../../analytics/src/native-bot-comparison.ts) is an explicit package subpath. It compares exact supplied declarations with the three reviewed entries and reports native true, false, unavailable and unrecognized separately. It retains declared provenance, injected cases, partial review and unresolved registry names. It emits counts and closed labels, without copying supplied names or arbitrary native values. Every result leaves managed cryptographic agreement null and human-trigger/operator authentication unestablished.

This capability is absent from the current Worker dependency graph. It changes no collection policy, stored classification, public report, migration or cache version. Its review date is current metadata, not a reconstruction of historical registry state.

The [native harness](../../../scripts/check-native-bot-comparison.mjs) checks twelve synthetic conditions and the **same 52 archived D1 rows** accepted in Research 75. It verifies the frozen archive manifest and readback digests first. Node and local workerd agree on all **64 assessment contexts per runtime**. The 51 ExaSearchBot and one AhrefsBot declarations map to current Direct entries; all 52 stored native values remain unavailable. The archived provenance remains unestablished as a fresh provider assertion. These are interpretation checks, not new cryptographic replays, requests or managed-verifier comparisons.

Both altered-readback and altered-manifest controls reject without accepted output. [Local results](native-bot-registry-local.json), [source commitments](native-bot-registry-sources.json) and [checks](native-bot-registry-checks.json) retain the limits. All 285 analytics tests, workspace types and targeted checks pass. Raw operational data and browser captures stay in the restricted archive; the previous 52-row archive is unchanged.

## Next work

The [comparison proposal](native-verifier-comparison-plan.json) now links the actual Direct entries and leaves ExaUser unresolved. No genuine eligible request-level native comparison is complete. The retrospective article remains 1,362 words/31 prompts; this detailed source review stays in research to preserve its concise form.

Next: prepare a refreshed retained-population correctness census, checking exclusions and missing/conflicting evidence across the full retained window. Native-test and budget the exact SQL before any Wrangler execution. No own-site request, production D1 statement, new human label or privacy decision occurs in this iteration. Human trials remain deferred; the full goal stays open.
