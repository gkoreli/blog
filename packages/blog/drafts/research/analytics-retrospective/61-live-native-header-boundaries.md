# The live transform works; its header still cannot authenticate itself

October 28, 2026 UTC. Continues [the guarded instrument](60-guarded-native-capture-and-fixture-provenance.md). The previous turn deployed and accepted its off-mode behavior. This turn executes the actual Cloudflare request-header experiment, preserving unknowns, timing qualifications and cleanup. Human-operated trials remain deferred.

## Scope and execution

[The controller](../../../scripts/run-native-bot-capture.mjs) prepares 23 registered controls and a hard controller budget of 32 attempts, at most once per control. The receiver's unchanged window is eight minutes; its HTTPS origin is `gkoreli.com`. The existing owner-profile guard admits only the controlled curl profile after a one-time owner-mark operation. These are non-HTML diagnostic requests, not page observations or calibration predictions.

The initial native rule was saved as a disabled, contradictory-host draft, then changed to the exact registered paths and a timestamp interval. [`http.request.timestamp.sec`](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/http.request.timestamp.sec/) is Cloudflare's request-receipt Unix timestamp. The actual zone accepted it with dynamic `to_string(cf.client.bot)`. Request-header **Set**, rather than Add, is the [documented replacement operation](https://developers.cloudflare.com/rules/transform/request-header-modification/). A later static rule was scoped to only the two overwrite controls and visibly ordered second.

One upload attempt was rejected by automatic approval review because an unspecified secrets file could overwrite credentials. Before retrying the same payload, a closed schema/hash check established exactly two previously absent keys: the native-capture configuration and an eight-minute grant for the existing owner-mark endpoint. The installed Wrangler bulk implementation inherits unsupplied binding names. The scoped retry was approved and succeeded. Existing credential values were neither read nor supplied; no permission, account plan, provider enrollment or expanded raw-reader capture changed. The private payload and its proof remain outside Git.

## What the requests actually show

[The closed live receipt](native-capture-live.json) keeps planned, attempted, received, valid, unavailable and log-joined populations separate. Every control was attempted once; all 23 received HTTP responses. Nineteen valid capture bodies have one identical response/control pair in the filtered tail. Four other responses comprise one owner denial, one unavailable guard result and two post-expiry rejections.

| Phase | Attempts | Measured result | Limit |
|---|---:|---|---|
| Before owner marking | 1 | 403, as planned | Guard denial is not a bot verdict. |
| Rule disabled with contradictory host filter | 7 | Missing, literal true/false and combined/malformed shapes survive as expected | The controller supplies repeated fields; Worker headers do not reconstruct original wire multiplicity. |
| Dynamic rule active, before original deadline | 7 | All seven candidate values become literal false, including supplied true, malformed and repeated fields | Independent `request.cf.botManagement` booleans remain unavailable. This is a generic Rules-engine known-bot bit, not native cryptographic agreement. |
| Rule disabled after original deadline | 2 | Supplied true and malformed shapes survive | Both disabled and expired conditions hold; these controls do not isolate disabling from expiry. |
| Original deadline elapsed, rule re-enabled | 2 | No supplied header becomes missing; supplied-true control returns 503 | The unavailable result cannot establish whether a supplied true would survive an enabled expired rule. No retry fills the gap. |
| Later static overwrite active | 2 | Both candidate values become other; dynamic rule is first and static rule second | Receiver retains only closed shape. Attribution uses the recorded configuration plus actual execution, not a self-authenticating header. |
| Receiver naturally expired, configuration still present | 2 | Both return 404 with empty JSON | Observed before removing bindings; this isolates receiver expiry from cleanup. |

**22 expected outcomes / one unavailable / zero unexpected measured outcomes** describes this selected instrument cohort. It is not provider accuracy, a human false-positive rate or a production-population estimate. The controller reports both accuracy rates as null. The prior twelve page-calibration executions retain their original denominator.

The single 503 stays **guard unavailable, cause unestablished**. The route's current closed response cannot distinguish its owner-lookup deadline from a storage or other guarded failure. HTTP receipt is known; header assessment is unavailable. The tail contains all 23 scoped invocation envelopes and all nineteen capture pairs, with no ambiguous joins or malformed/incomplete parser fragments. A finite tail remains subject to collection limits; it is not an account-wide completeness guarantee.

## A necessary timing correction

The original four-minute rule deadline elapsed before the disabled controls ran. After recording those results honestly, the rule was re-enabled with its original expired interval for the two expiry controls. The original plan bytes and hash are preserved. Only then was the rule deadline amended to seven minutes after issue, still inside the unchanged eight-minute receiver window, to execute the remaining overwrite controls. The amendment did not change the origin, registered controls, owner grant, receiver expiry, request budget or public classifications. Both native configurations and the before/after timestamps remain private and inspectable.

No claim of an isolated disabled-before-expiry experiment follows. The baseline already demonstrates that a caller header can survive without an effective transform. Seven active replacements do not make a marker header, expected hostname or periodic configuration check authenticate every future request during bypass or drift. **The candidate remains untrusted and never enters verified-bot summaries.**

After execution, controller v2 adds the missing before-expiry check to the disabled phase, both before starting and before each request. A regression test rejects the confounded timing while accepting a genuinely in-window disabled control. The exact v1 executable used for this run is preserved privately with its source hash; the checked current source is recorded separately. This repair prevents repeating the mistake without rewriting the measured cohort.

## Costs, cleanup and remaining evidence

There are 23 diagnostic GETs and one acknowledged owner-marking POST. All GETs route before assets/page collection. Twenty-one registered requests reach the guard evaluation before receiver expiry; two expire before it. Owner lookup and marking are additional service work, with row-read/write metering unavailable here. No direct diagnostic SELECT, public report fill or page-collector invocation is added. No observation write count is invented from an HTTP success; the source boundary and scoped invocation logs support the no-collection claim.

Both temporary binding names were removed after expiry. Fresh Wrangler name-only inventories match the original four credential names. The two created rules remain **disabled and expired**, with zero active request-header rules; their configurations are retained, not described as deleted. The exact owned tail processes were interrupted and verified absent. No preview, viewport override, new browser tab, persistent relay or bot registration was created. Private evidence retains restricted modes and an October 31 review date, not automatic erasure.

The genuine provider-positive case, independently isolated disabling before expiry, workers.dev and same/cross-zone relays remain unexecuted. The owner guard does not automatically admit a vendor request; do not mark unrelated vendor traffic as owner traffic to create a positive. Managed Web Bot Auth comparison still needs its own accepted identity and request-level oracle. R1 attribution, historical proof recovery, human/device calibration and privacy/retention decisions remain open in [the full audit](current-goal-audit.json).

The article adds the live provenance lesson within the six-minute target. [Checks](native-capture-live-checks.json) preserve controller tests, source commitments, private archive manifests and publication acceptance separately. Next: make the actual guard-unavailable cause observable through closed diagnostics, then rerun only the missing bounded conditions when their prerequisites are available. No human trial is opened.
