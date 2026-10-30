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

## Exact-source publication and live public acceptance

[Release receipt](native-boolean-availability-release.json) joins source `47daee3b57f8906f266f3ee04e89bc3136176f7c`, successful GitHub check `124071828741`, native build `80f5a4a7-63ae-46f0-bd90-f14ed090fd61` and full Worker `766c612c-5ee9-4001-b50f-42558dd0d47f` at a fresh Wrangler 100% allocation. Hosted Node 24.22.1 and pinned local 24.14.1 remain distinct. Later bookkeeping deployments have separate identities.

Before live execution, the actual native handleStats route returns the planned privacy/Other-bot/Automation/seven-day selection on two synthetic records. It reports verified-bot availability 2 / true 2 / false 0 and signed-agent availability 1 / true 0 / false 1. Six altered-report cases fail both the exported checker and its actual CLI path. This proves the acceptance checker exercises the added distinction; it supplies no real provider verdict.

The frozen plan executes six single-attempt GETs: owner readiness, two matching filtered report requests, stats HTML and its JS/CSS. All six uniquely join exact controlled URL/header, full Worker version and response Ray; no observation attempt/storage log appears. Source eligibility keeps those routes/responses outside collection. No direct D1 diagnostic SELECT, new population capture, raw mode or human label occurs. CLI D1 authorization is not retried or declared repaired.

At 12:52:24.239 UTC the report includes six stored events. Both field availability/true/false families are zero; four events explicitly store unavailable native values and two have no record. These are missing evidence, not six native negative decisions. Genuine current native-positive/false field results remain unobserved by this production selection; the nonzero cases above are synthetic only.

The ordinary same-socket/SEA pair is MISS→HIT with identical bytes, calculation time and expiry 13:52:24 GMT, and no second calculation. One submitted/returned statement and one captured attempt report 7,683 reads/zero writes, below the frozen 50,000 review threshold. The threshold is not server enforced or an account-wide total. Provider retries and unreported/background work remain outside this returned-attempt meter; no production before/after saving is claimed.

The 1,333-byte verification-section fragment and exact 97,153-byte JS / 9,242-byte CSS match the checked build. No full HTML equality or fresh production interactive/device/human acceptance is inferred. Frozen 26-file plan/program inputs reconcile; the final 59-file private archive has manifest `87c551a7e936628b3c95f07f79775079e579b09cfb239fcf5f07d080ee458680`. Tail shutdown is awaited and its owned group has no members; provider deletion is not independently confirmed. Review remains October 31, not automatic erasure.

This closes this reporting repair. The native request-level oracle and accepted intermediary identity, source operator/trigger, authenticated search evidence, privacy decisions and deferred human/owner-browser measurements remain separate. The full goal remains active and incomplete.
