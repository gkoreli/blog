# A valid native expression still needs a trusted delivery path

October 27 Pacific / October 28 UTC. Continues [the full goal audit](58-independent-cache-comparison-and-goal-audit.md), [the native boundary](35-goal-coverage-and-native-signal-boundary.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). Human-operated trials remain deferred. This checkpoint clears expression validation; it does not activate a rule or add a trusted signal.

## What the actual zone accepts

The signed-in dashboard shows an active Free zone and a Workers Paid subscription. Its request-header Transform Rule editor reports zero of ten available rules. Those observations alone establish neither Bot Management entitlement nor field delivery.

The unsaved form used **Set dynamic**, header `x-gk-native-bot-candidate`, and value **`to_string(cf.client.bot)`**. One **Save as Draft** attempt rejected the initial filter `false` as an unknown identifier. This is a filter-parser rejection, not rejection of the bot field. Replacing it with the contradiction below produced the visible status **“Rule validation passed”** without a second save:

```text
(http.host eq "gkoreli.com" and http.host ne "gkoreli.com")
```

The exact candidate expression, corrected filter, validation status and enabled Save as Draft/Deploy controls are preserved together in private accessibility and screenshot captures. Cancel returned to Rules Overview. **No successful draft save, rule enablement or deployment occurred.** We observed the dashboard result, not an independently captured Rulesets API success body. The earlier CLI authorization failure remains historical evidence; this UI success does not establish repaired CLI credentials or roles.

[Cloudflare's validation contract](https://developers.cloudflare.com/ruleset-engine/rulesets-api/dry-run/) says Rules Overview validates configuration before publication, including syntax, field/function availability, permissions, entitlements and quotas. The [request-header creation guide](https://developers.cloudflare.com/rules/transform/request-header-modification/create-dashboard/) distinguishes draft save from Deploy. The visible validation state supplies the actual-zone gate missing from research 35, within the tested configuration. No broad field entitlement or runtime-delivery claim follows.

## What this bit could tell us

[`cf.client.bot`](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.client.bot/) is a known-good-bot/crawler assessment, documented as the same information as `cf.bot_management.verified_bot`. It does not identify which verification method succeeded, authenticate an Exa product role, or establish a human trigger. It cannot satisfy [the managed signature-comparison plan](native-verifier-comparison-plan.json), which needs a request-level signed-agent oracle and an accepted controlled identity.

The [allowed request-header fields](https://developers.cloudflare.com/rules/transform/request-header-modification/reference/fields-functions/) and [`to_string` function](https://developers.cloudflare.com/ruleset-engine/rules-language/functions/#to_string) explain the candidate; actual validation supplies a different piece of evidence. The existing [`verificationEvidence`](../../../../analytics/src/signature-evidence.ts) still reads typed Worker-native booleans. No header is promoted into those values.

## The delivery experiment we can safely build next

[The proposed machine-readable plan](native-bot-capture-plan.json) separates implementation, activation, executed controls, captured results and trust. Reuse the off-by-default, fifteen-minute guard/exclusion pattern from [the production-stage protocol](../edge-vs-rum/08-production-stage-protocol.md), but do not reactivate its expired window or count this as a new calibration cohort. A dedicated non-HTML diagnostic route should return closed states without calling the page collector. Its local acceptance must prove zero observation writes, including rejected and expired requests.

The candidate remains **untrusted header evidence**, even when it contains exactly `true` or `false`. Capture only its closed shape, independent actual native booleans, and privately joined control/configuration references. No reader IP, raw User-Agent, arbitrary header text or new general reader identifier is needed. Duplicate headers can be coalesced before JavaScript sees them; the receiver must not claim it reconstructed the original wire multiplicity.

| Condition to execute | What would be established | What would remain unknown |
|---|---|---|
| Direct zone request; no supplied candidate | Whether this configured path delivers a value | Other ingress paths and a true native-positive case |
| Single and duplicate spoofed values | What Set overwrites and the Worker receives | Universal header sanitization outside the tested path |
| Missing, malformed, comma-combined values | Closed parsing and abstention | Whether the sender originally used one or several wire fields |
| Rule disabled, absent, expired, or later overwritten | Whether a caller value survives and how the capture distinguishes configuration | Per-request native authenticity from a stale expected configuration |
| workers.dev and controlled same/cross-zone relay | Routing and overwrite behavior on each actual ingress | Unexecuted or unavailable routes; a relay is not the original client |
| Genuine provider-positive request | Whether an actual positive reaches the capture | Product identity, cryptographic coverage and human intent |

[Cloudflare's header contract](https://developers.cloudflare.com/rules/transform/request-header-modification/) says Set replaces existing values, later rules can replace earlier results, and expressions within the phase see immutable original fields. These facts motivate the controls; they do not prove our ingress boundary. [The subrequest example](https://developers.cloudflare.com/rules/transform/examples/add-request-header-subrequest-other-zone/) and [`cf.worker.upstream_zone`](https://developers.cloudflare.com/ruleset-engine/rules-language/fields/reference/cf.worker.upstream_zone/) motivate separate relay conditions. That Rules field is not automatically a Worker runtime property.

A rule marker, secret-looking header name, expected hostname or periodic configuration check does not authenticate each received bit. Disabling the transform can leave a caller's header intact between checks. Monitoring reduces detection delay; it does not close that trust gap. **Successful capture must not automatically become verified-bot reporting.** Trusted adoption needs a separate design decision with a per-request provenance argument or an explicit, narrower operational assumption. A missing native-positive control stays missing; injecting `request.cf` cannot replace it.

## Delivery and continuity

This is research/design only: runtime, schemas, registries, collection/report profiles, article prose, optional raw capture and production configuration are unchanged. No direct D1 statement, own-site visit, vendor-feed retrieval, tail, preview, new browser tab or viewport override occurs. Dashboard navigation and one rejected draft-save attempt are additional service activity; their internal cost is unavailable. The existing article remains 1,196 body whitespace words/31 prompts; no fresh served-content or runtime-suite claim is made.

The private capture archive and scoped checks are recorded in [the closed receipt](native-expression-validation.json). The [current goal audit](current-goal-audit.json) retains all unresolved requirements from research 58. The next bounded action is to implement and locally accept the off-by-default closed-state capture route and harness before any live activation. Human trials, genuine current signed persistence, native cryptographic comparison, R1 attribution, historical proof recovery and the privacy/retention decisions remain open.
