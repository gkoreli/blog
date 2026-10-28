# Query access recovered; native verification still needs its own evidence

October 27 Pacific / October 28 UTC. Continues [Google publisher/display acceptance](47-google-publisher-and-display-history.md). The previous turn delivered source, activation, one live receipt and an explicit eligibility correction. Human trials remain deferred. This iteration adds fresh read-only evidence; it changes no analytics runtime/profile or capture mode.

## Establish the failing boundary before changing access

The earlier fixed-window aggregate returned authorization error 7403. Its failure and unavailable counts/metering remain preserved. We did not assume missing scope, a quota problem or a broken database from that response.

Fresh Wrangler `whoami --account` and `d1 info` succeed for the expected account/database. The former is an account-visibility snapshot, not a role audit. [Cloudflare's authorization guidance](https://developers.cloudflare.com/workers/authorization/) distinguishes Worker permissions from direct bound-resource access: deploying or using a Worker does not establish permission to query its D1 binding through the API.

[Installed Wrangler 4.71 source](query-access-cli-source.json) shows `d1 info` reading database metadata and then GraphQL adaptive hourly metrics. It does not execute an observation SELECT. Its reported 24-hour counters are database-wide, rolling/adaptive values; they cannot be used as UTC-day quota, remaining allowance or this task's cost. Its metric accumulators start at zero, so an unavailable/empty response must not become a measured zero. Our captured counters are positive, but source inspection still limits their interpretation.

We then native-test `SELECT 1 AS query_access_control` in isolated local D1, execute it once remotely, and receive the expected constant with zero row reads/writes and no database-change flag. This establishes current query-endpoint access without requesting observation rows. Only after that positive control do we retry the original aggregate once, preserving its exact SQL hash and fixed interval.

[Access and aggregate evidence](query-access-recovery.json) records all steps. There is no deliberate login, credential, role, permission or plan change. Access works now; the earlier failure's cause remains unestablished. Successful metadata and a later query do not identify a repaired server-side mechanism.

## What the recovered window actually contains

For **October 28 02:51:51 inclusive–02:59:52 exclusive UTC**, the aggregate returns:

| Stored evidence | Events |
|---|---:|
| All stored rows | 4 |
| Collection `.28.7` | 4 |
| Stored verified outcomes | 3 |
| Exa-origin verified outcomes | 2 |
| Ahrefs-origin verified outcomes | 1 |
| Detailed local verified results with verifier `.28.6` | 3 |
| Single Google-Agent / DuckDuckBot declaration | 0 / 0 |
| Native verification boolean available | 0 |
| Google-Agent / DuckDuckBot listed-IP result | 0 / 0 |

This includes public-excluded traffic by design. Four is not readership. These are stored outcomes, not three newly replayed original packets or native-agreement measurements. Zero named observations in this eight-minute window says nothing about earlier or later traffic. Collection `.28.8` was deployed later, so its absence here is expected, not a persistence failure.

The successful retry costs **seven reads / zero writes**, with no database change. The original failed attempt still has unavailable metering; it is not silently counted as free.

## Exact readback closes the new receipt's persistence gap

Research 47 retained an actual `.28.8` canonical-Markdown publication control, its version/header-filtered invocation, one acknowledged stored receipt and its exact returned row reference. Query access had prevented independent row readback.

We reuse that saved reference, native-test the single-primary-key SQL and execute it once through Wrangler command mode. [All thirty closed receipt fields match](query-access-exact-readback.json), including receipt `.28.2`, signer-display `.28.1` and the new directory profile/date. Canonical path, Markdown representation and absent optional capture also match. The exact stored referrer is excluded by the current versioned assessor. This is a row-and-policy check, not a new public report fetch or owner-browser test.

That read costs **one read / zero writes**. The three successful remote diagnostics together acknowledge **eight reads and zero writes**: constant, aggregate and exact readback. Local tests, metadata/GraphQL, prior normal collection and provider costs are additional. The old failed attempt's metering remains unknown. No new eligible publication control is needed for this readback.

This closes independent persistence acceptance for that one **unsigned** current-profile control. It does not authenticate a vendor, count a human, prove complete provider retention or establish native cryptographic agreement.

## Native comparison requires a native oracle

[The Request documentation](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) says `botManagement` is only set when using Bot Management. [Its variable reference](https://developers.cloudflare.com/bots/reference/bot-management-variables/) documents `request.cf.botManagement.signedAgent` and separates it from generic verified-bot status and provider category. Our measured four-event window has no native verification booleans, and the saved unsigned control has them unavailable. That is missing evidence, not false.

[The comparison proposal](native-verifier-comparison-plan.json) therefore remains **not ready / not executed**. It requires an actual request-level signed-agent result, a controlled and accepted test identity, one eligible proof per request and exact exclusion/receipt/row links. A local generated-key workerd result is our verifier, not Cloudflare's managed verifier. A public Google directory does not authorize us to sign as Google.

The proposed cases compare independently signed structured-string and `g` dictionary forms, plus invalid, expired, unsigned and unregistered-key controls. They separate mathematical validity, published identity, provider registration and native result availability. This tests the conflicting [Google](https://developers.google.com/crawling/docs/crawlers-fetchers/web-bot-auth) and [Cloudflare](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) guides without treating either guide as an observed verdict. Expected native outcomes are recorded as questions until the prerequisites hold. The native boolean is itself a provider assertion; negative controls must test its meaning. Rates retain executed and unavailable denominators and remain null without eligible observations. No test key, public directory, registration, rule, purchase or permission change is made here.

## Continuity

The [original-goal audit](45-goal-and-method-coverage-audit.md) remains incomplete: there are no accepted human labels, no genuine Google proof or managed-native comparison, and retention/rights and earlier measurement-stage gaps remain open. The restored fixed-window query now gives a concrete next cohort: two Exa and one Ahrefs stored detailed verified results under verifier `.28.6`. Next: obtain their bounded row records, seek exact retained receipts/original signing inputs, and compare only facts that can actually be joined. Do not expand the time window or infer a human trigger to make the result look complete.

Runtime and the thirty-one shaping prompts remain unchanged. The article's existing acceptance sentence links this new evidence without adding another operational narrative. Private account/database captures and row references stay outside Git. Source publication and current production health remain separate; no deployment claim follows solely from this documentation checkpoint.

[Checks and commitments](query-access-checks.json) retain fresh SQL/readback controls and the unchanged runtime-suite boundary. [Primary-source captures](query-access-doc-sources.json) commit to the current authorization/request-variable documentation.

Private captures are archived under `2026-10-28-query-access` with a hash manifest and four links to the earlier failed-query/control evidence. The October 31 review date is not an automatic erasure claim.

[Publication acceptance](query-access-release.json) records source `542bd50`, Ready in 46 seconds and 100% activation on Worker `ad4d2bb2-3ffd-403c-908d-93351df3ad82`. One direct `.md` alias GET confirms the article bytes and new evidence link against the isolated build; that route is intentionally collection-ineligible. It adds no D1 diagnostic query or eligible observation. Runtime and native-comparison readiness remain unchanged.
