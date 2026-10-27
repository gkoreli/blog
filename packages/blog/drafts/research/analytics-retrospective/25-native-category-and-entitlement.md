# Native bot evidence: category is not a signature verdict

October 27, 2026 UTC. Continues [TASK-0119](../../../../../docs/tasks/TASK-0119.md), [native access research](11-native-access-receipt.md) and the [Web Bot Auth audit](18-webbotauth-verification.md). The owner has deferred human-operated trials for now; this work adds no human label or trial activation.

## What the native fields actually mean

[Cloudflare's signed-agent field](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.bot_management.signed_agent/) requires Enterprise Bot Management. The [Workers Request reference](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) says botManagement is populated only with Bot Management. [Its variables reference](https://developers.cloudflare.com/bots/reference/bot-management-variables/#workers-variables) separately exposes request.cf.verifiedBotCategory. These are different inputs; missing booleans cannot be replaced with a category or treated as false.

A fresh read-only zone overview at 20:07 UTC shows a Free zone and a Workers Paid subscription. This revalidates the earlier product distinction; a compute subscription does not establish Enterprise bot-field access. No plan, setting, logging price, protection or credential was changed. This context and the documented entitlement explain why missing booleans should remain expected uncertainty, not a negative native verification result. They do not identify the cause of every individual missing field.

[Cloudflare's category reference](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.verified_bot_category/) describes provider-assigned bot categories. Its [current taxonomy documentation](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/#legacy-categories) distinguishes newer behaviors from legacy rule-field values. We retain the 17 reviewed legacy strings exactly; the UI does not translate them into our own role classes. Cloudflare may verify bots through different methods, so a category alone does not establish that Web Bot Auth ran, which product initiated a request, or whether a person asked for it.

## A useful signal was being discarded

The [category-only replay](native-category-retained-exa.json) revisits the same 19 retained Exa records used by the signature audit: every record carries **Search Engine Crawler**; native verification booleans remain absent. There are 18 distinct provider IDs. The input hash matches the frozen signature-replay capture. [The maintained replayer](replay-native-categories.mjs) uses the actual new category normalizer and emits only closed aggregates.

This supplies additional provider metadata for those captured records. It adds no fresh vendor request, request-time directory proof, exact D1 join, complete log sample or unique-event count. The earlier cryptographic replay still used recorded times and a later public directory. The provider's search-crawler category and our ExaSearchBot declaration can be shown side by side without claiming that either proves the exact request's purpose. Historical D1 rows are not backfilled from candidate joins.

## Implementation and visibility

The dedicated [`native-bot-evidence.ts`](../../../../analytics/src/native-bot-evidence.ts) accepts only reviewed category strings from request.cf, with separate known, empty, unavailable and unrecognized states. Unknown values are discarded, not copied into storage or public output. A client-supplied header is not an input. Native true/false booleans remain independent; empty category does not mean human, and unavailable does not mean unverified.

New verification evidence version 2026-10-27.4 adds the closed category facts within the existing 2,048-byte JSON field. Collection advances to .7; classifier .5 and verifier .6 stay unchanged because categories do not affect classification or signature policy. Existing migration 0012 is sufficient. No raw diagnostic mode, new fingerprint, source address or arbitrary category string is added. These facts remain linked to observations under the existing unresolved retention/rights boundaries, disclosed on /privacy; no general compliance claim is made.

The API adds byKindNativeCategory, pairing our stored classification with provider category evidence for the same events. Known categories plus explicit empty/unavailable/unrecognized/unrecorded buckets partition exactly the included population; missing or unrecognized kinds remain null instead of removing events. Missing, duplicate or invalid decoded buckets reject the report rather than silently dropping events. Owners, referral exclusions, time/path/kind filters and empty selections use the same report population. The new dashboard section names this as provider metadata; the existing boolean metric is labelled more precisely. Report-cache version advances to .7, preserving original calculation times on reuse.

## Executed checks and cost

[Native local acceptance](native-category-local.json), reproduced by [the helper](../../../scripts/check-native-category.mjs), executes the actual collector/persistence in workerd/D1 with deliberately supplied provider fixtures. Seven controls cover known, empty, unavailable, unrecognized, known-with-false-booleans, owner exclusion and referral exclusion. A history row remains unrecorded. These are fixture metadata, not real native Cloudflare verdicts, organic vendor requests or human controls.

The local report includes six records after exclusions and preserves category/boolean independence. Scoped/empty reports, closed output, private canaries, history and the [indexed prospective-control SELECT](native-category-control-acceptance.sql) pass. The first fixture used /owner, which page eligibility correctly excluded; switching to /fixture-owner repaired the harness without changing eligibility. Initial checks also found the shared module needed an unknown cf input rather than a server-only Request type in the browser build, and the closed report decoder needed the new section fixture.

On 512 stored historical/null-evidence fixtures, the pinned baseline SQL entry at ce2eecd uses **21,648 reads**; the new report uses **22,675**, an increase of **1,027**. All common output is identical. This is one extra grouped scan in the same statement, not a query-cost reduction or a forecast for production. Shared helpers are current; the chosen older/null dataset exercises their unchanged behavior. Public cold fills, control writes and other account work are additional to direct acceptance SELECT metering.

## Release boundary and next work

[Source checks](native-category-source-checks.json) pass 151 analytics tests, 106 site tests, workspace types, post validation and a 32-post isolated build. The 1,249-word article retains 30 shaping prompts. Local UI acceptance checks the paired table on six fixture events and a 390-pixel viewport without overflow; this is a layout check, not device/operator evidence. The existing empty-report flow hides the dashboard and shows its explicit zero-total status. The owned preview process is stopped and the viewport reset.

Source checks, source push, actual activation, live API/UI/privacy and a referral-excluded prospective write must be accepted separately. The direct production-control SELECT has a 50-read ceiling and must use the locally accepted indexed shape. Do not repeat an expensive broad historical report to accept this field.

This iteration makes existing native evidence more inspectable. It does not close organic signed-request acceptance under the new collector or native signature-verifier agreement. Human-operated trials are deferred at the owner's request; keep those rates unmeasured. Next useful vendor work is a safely joined real signed request, preserving local coverage, documented origin, provider category and native boolean availability as separate facts. DNS/egress, replay diagnostics, provider sampling/receipt and privacy/retention remain separate open work.
