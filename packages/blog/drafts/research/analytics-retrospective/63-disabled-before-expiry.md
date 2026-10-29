# Disabling the rule changes the header before its deadline

October 28, 2026 UTC. Continues [the live experiment](61-live-native-header-boundaries.md) and [closed failure diagnostics](62-closed-native-capture-failures.md). The previous goal turn made progress through a deployed instrument repair. This turn closes one specific measurement gap: the earlier disabled controls also occurred after expiry, so disabling was not independently isolated.

## Four paired controls, no extension

The [controller](../../../scripts/run-native-bot-capture.mjs) now has a focused `prepare-disabled` mode: four fresh registered UUID paths, two header shapes in each of two phases, a seven-minute rule window, an eight-minute receiver/grant window and a four-GET controller budget. This is not a global server admission counter. Every control is attempted once; no automatic retry or deadline amendment occurs. Controller v4 preserves the existing broader plan separately.

The existing dynamic rule is updated to these four paths and the fixed timestamp interval, saved disabled, then enabled for the first pair. Its action remains `Set x-gk-native-bot-candidate = to_string(cf.client.bot)`. The later static overwrite rule remains disabled with its previous expired paths. The dashboard confirms one active rule before the first pair and zero before the second. We disable the same dynamic rule without changing its expression or time window.

This follows Cloudflare's documented [request-header Set behavior](https://developers.cloudflare.com/rules/transform/request-header-modification/): Set replaces an existing value, and later rules can overwrite earlier changes. The experiment tests delivery in this account; documentation alone is not treated as an observed outcome.

| Supplied shape | Dynamic rule enabled | Same rule disabled, still before expiry |
|---|---|---|
| Literal `true` | Literal `false` | Literal `true` |
| Fixed malformed string | Literal `false` | Other |

[All four responses](disabled-before-expiry-live.json) are valid HTTP 200 captures, each with one identical response/control pair in the filtered invocation logs. There are four expected outcomes, zero unexpected outcomes and zero unavailable measurements. Worker-native `verifiedBot` and `signedAgent` remain unavailable in every capture; none is defaulted to false.

The first capture is at 17:21:56.029 UTC, the last at 17:22:27.125, and the unchanged rule deadline is 17:26:04. All response bodies and controller completion times precede that deadline. The last capture has **216,875 ms of margin**. The receiver deadline is 17:27:04. This cohort isolates disabling from expiry for these supplied inputs; it does not rewrite the earlier confounded cohort or resolve its unexplained 503.

These are sequential controlled curl requests on distinct registered paths inside the same rule filter. The receiver's candidate assessment does not branch on the planned condition. This is not a randomized population study or a propagation-latency estimate. Provider and human accuracy rates remain null. The original twelve page-calibration executions retain their denominator and zero human labels.

**A configured bridge can replace a supplied flag; the flag itself cannot prove that replacement happened.** No result promotes the header into trusted verification, identifies a genuine provider, establishes managed signature agreement or supplies human intent.

## Operational failures stay in the record

The first tail command is rejected locally because Wrangler 4.71.0 does not accept sampling-rate 1. Its installed `parseSamplingRate` rejects both endpoints; the bundle hash and source-review scope are in the checks receipt. A second exact-header-filtered tail exits normally with no events before the controls; its closure cause is unestablished. Only after confirming it terminal do we start a replacement. The replacement captures all four scoped invocation envelopes, with no malformed or incomplete parser fragments. Omitting the sampling option is not an account-wide completeness guarantee.

Four exact filtered tail processes are interrupted after execution and verified absent. No request is replayed to repair a log gap. The first isolated build also stops at a sandbox-denied local tsx IPC socket; the approved same-source build completes. These failures are preserved privately alongside the successful attempts.

## Cleanup, costs and article

Both optional binding names are removed after the four attempts, **before natural expiry**. Fresh name-only Wrangler metadata matches the original four credential names. Existing credential values are never read, supplied or rotated. Both retained rules are disabled, with zero active; they are not deleted. The existing dynamic rule keeps this run's time-bounded expression; its prior expression remains in the earlier evidence archive.

This run uses four diagnostic GETs and one acknowledged owner-mark POST. The GETs route before assets and page collection. Four owner-guard evaluations and the marking operation add unmetered service work; zero direct diagnostic SELECTs or report fills does not mean zero database cost. There are no collection-eligible GETs, new human labels, general-reader raw captures or changes to classification, signature verification, public summaries or authorization policy.

Site tests: 117. Post validation: 21 Markdown posts. An isolated source-copy build passes for all 32 posts, leaving the shared dist untouched. Worker/runtime source and dependencies are unchanged. The article replaces its disabled-and-expired sentence with this isolated result and cross-reference, retaining **1,280 body whitespace words and 31 prompts**. [Checks and publication](disabled-before-expiry-release.json) separate this executed experiment from Git delivery and article activation.

Next: reconcile the retained-data delta since the frozen census through a native-tested bounded query and an explicit read budget. Genuine provider-positive and relay controls, latest-profile signed persistence, native managed-verifier comparison, attribution, privacy/retention decisions and deferred human/device trials remain open. The full analytics goal is not complete.

Publication resumes on October 29 UTC after a pause. The October 28 experiment stays frozen. A fresh rule-page reload still shows zero active rules, and new name-only metadata confirms both temporary names absent. Origin/main is unchanged. No expired control is issued again.
