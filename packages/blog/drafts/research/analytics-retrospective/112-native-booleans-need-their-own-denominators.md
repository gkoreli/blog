# A missing signed-agent result was indistinguishable from false

October 30, 2026 UTC. Continues [the active goal checkpoint](111-weekly-history-in-the-retrospective.md) and [native comparison prerequisites](native-verifier-comparison-plan.json). The prior turn published the concise article. This iteration finds a report ambiguity while checking the remaining native-verifier gate; it does not obtain that oracle or resume deferred human trials.

## Reproduce the ambiguity before adding a counter

Two separate one-row synthetic populations supply identical stored local evidence and native `verifiedBot=true`. One has `signedAgent=null`; the other has `signedAgent=false`. On the pinned `31abaf4` analytics graph, **every public report field is equal**: the native union is available in both, and neither has a true signed-agent result. The database preserves a useful distinction that the aggregate cannot show.

The [actual workerd/D1 comparison](native-boolean-availability-native.json) reproduces this counterexample independently of the earlier Node SQLite run. These are supplied native-field fixtures, not actual Cloudflare verdicts, signed packets, or two observed production requests.

## Give each field its own denominator

The API now returns `nativeVerifiedBotAvailableViews` and `nativeSignedAgentAvailableViews`. Each counts explicit true/false values under the existing recognized native-envelope rules. Existing true counts remain unchanged; the UI derives false as available minus true. The combined availability counter remains the union: at least one field is usable. Its label now says so.

The decoder checks each positive count against its own availability and checks the union between the larger denominator and their sum. The local-verified/native-verified-bot-false counter is bounded by actual false verified-bot results. Missing, malformed or contradictory counts reject the response rather than becoming zero. An unrecognized envelope still supplies neither field, even if one member looks valid; no new historical interpretation is introduced.

The two denominators can overlap. Subtracting either from the headline combines all events without that usable field, including missing/unrecognized history; it is not a count of headers observed absent. Stored test-injected evidence remains under its existing provenance rules. This report does not attest a field’s transport or promote header candidates into native metadata.

Collector, classifier, verifier, schema, exclusions, article and 32 shaping prompts remain unchanged. Full-stats cache version becomes `2026-10-30.3` so older cached responses cannot satisfy the new contract. The separate readership report is unchanged.

## What the authoritative documentation establishes

[Cloudflare’s variables reference](https://developers.cloudflare.com/bots/reference/bot-management-variables/) describes verified-bot recognition using broader methods and separately documents signed-agent recognition for intermediary agents. Its [signed-agent field reference](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.bot_management.signed_agent/) requires Enterprise Bot Management. A false generic known-bot flag is not a cryptographic disagreement with our verifier; a missing signed-agent flag is not a negative native decision.

[Cloudflare’s Web Bot Auth integration guide](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/) also requires key-directory registration before verified requests. We do not register an identity, publish a key, upgrade a plan or change capture settings. These public docs were reread today; they do not revalidate account entitlement, an eligible identity or a request-level native result. Those gates remain in the existing comparison plan.

[D1’s documented limits](https://developers.cloudflare.com/d1/platform/limits/) are 32 arguments per SQL function, 100,000 SQL bytes and 100 bound parameters. The new statement stays at 77,032 bytes for seven days / 77,403 all-time and seven parameters. The bounded JSON builder retains 46 explicit null fields on empty aggregation; a separate SQLite runtime constrained to 32 arguments executes all 13 captured statement selections. That is a compatibility check, not evidence of production enforcement.

## Acceptance and cost

[Checks](native-boolean-availability-checks.json) cover all nine boolean/null combinations, malformed envelopes, history, owner/referral exclusions, empty selection and eight contradictory-summary controls. The native harness compares 13 selections against the complete pinned baseline graph. Every common output field and binding agrees.

In the paired local 512-row cases, reported reads are unchanged: 33,061 mixed / 29,860 history / 30,375 all-time; the empty path is 102. Every candidate returns zero writes. These are synthetic local comparisons, not production savings, population prevalence or account-wide cost.

322 analytics tests, 166 site tests, workspace types, 22-post metadata validation, isolated 33-post build and Wrangler dry-run pass. Actual built-client previews render available/true/false values at 1280 and 390 pixels without document overflow. Missing and contradictory responses show an error and hide the dashboard; “Try again” restores the valid report. Preview stopped, temporary tab closed and viewport reset. An initial Node fixture missed required `is_owner`; correcting the fixture preceded the baseline run. The native fixture oracle was also tightened to explicit boolean/null checks; its final run preserves the original SQL/results.

Source delivery, actual hosted activation and a bounded public API/cache/assets acceptance remain separate. No production request, diagnostic SELECT, new population capture or human label occurs in this local iteration. The concise article stays unchanged: this narrow denominator lesson belongs here until it changes the reader’s central argument. The full goal remains active and incomplete.

The private 33-file local archive has manifest SHA-256 `b8793855b9ed7f67bb637d9a3619cd9f2d6110d19185e711ca1cbfd7890c6c9b`. Investigation-copy review is October 31, not automatic erasure. Raw captures, SQL snapshots and session material remain outside Git.
