# Controlled collection-stage experiment — October 26, 2026 UTC

The owner clarified the objective: explain our measurements independently, with better visibility into their limits; agreement with Cloudflare is not acceptance. This executed local experiment advances TASK-0120. It does not close the historical 694-versus-117 investigation or replace the planned production/human/device trials.

## Method and evidence

The [local lab](../../../scripts/analytics-calibration-lab.mjs) serves isolated pages on loopback, invokes the actual compiled analytics collector, and writes to native local D1 through Miniflare/workerd. It creates three trial IDs for each of six conditions. Fifteen browser visits were operated by the agent in the Codex in-app browser; three controls used actual curl. No lab request reached production.

For each unique trial path we recorded page delivery, collector acknowledgement/failure, a separate script-executed report, beacon-attempt report, `sendBeacon()` return value, server beacon receipt, and the latest stored D1 kind. This is not an independent exactly-once row-count audit. Trial IDs were local experiment markers, not persistent visitor identifiers.

The [sanitized receipt](2026-10-26-stage-lab.json) retains all condition totals, versions, source hash and commitments to the private browser/report artifacts. The 18-row report and manifest IDs were checked for equality; each condition was asserted against its expected stage results. The executed lab source hash is `17895ebc9cda62e8e28452b25b7fc0760cfa3bd3793d29e78eb3bb3ed5e46108`. Runtime Node 24.14.1; collection/classifier `2026-10-26.3`. The local server was stopped after capture; no unattended experiment remains.

| Condition (3 trials each) | Deliveries | D1 acknowledgements | Script reports | Beacon attempts | Queued true | Server beacon receipts | Stored kind |
|---|---:|---:|---:|---:|---:|---:|---|
| Normal browser | 3 | 3 | 3 | 3 | 3 | 3 | Browser |
| Beacon blocked by CSP | 3 | 3 | 3 | 3 | 3 | 0 | Browser |
| Script blocked by CSP | 3 | 3 | 0 | 0 | 0 | 0 | Browser |
| Injected D1 write failure | 3 | 0 | 3 | 3 | 3 | 3 | Not stored |
| curl | 3 | 3 | 0 | 0 | 0 | 0 | Other bot |
| Narrow browser viewport | 3 | 3 | 3 | 3 | 3 | 3 | Browser |

The three failed-write trials also recorded three failures, so a missing observation was not treated as zero traffic. CSP restricted only the local beacon destination in the blocked-beacon condition; stage reports and receipt checks remained allowed. The script-blocked condition used `script-src 'none'`. These are controlled mechanisms, not measured historical prevalence.

## What this establishes

1. **Queue acceptance is not receipt.** All three blocked-beacon cases returned true from `sendBeacon()`, while the server received none. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#return_value) describes the return as queue success; the [Beacon processing model](https://www.w3.org/TR/beacon/) does not turn it into an application receipt. The cited Beacon text is a Candidate Recommendation Draft, not a final Recommendation.
2. **Browser and beacon are not human labels.** All fifteen browser visits were known automation. Twelve stored successfully as Browser; nine delivered beacons. That is consistent with our header-rule definition and disproves treating either observation as authenticated human reading.
3. **Storage can fail independently.** In the three injected write failures, page delivery and beacon receipt succeeded but the observation was absent. This verifies a controlled failure boundary, not the production rate of write loss.
4. **Viewport and hardware are different.** The narrow trials used a 390 × 844 viewport; the default document width was 1,280. Software still declared Chromium 156/macOS 10. These are browser claims; neither physical OS nor a mobile device was authenticated. The viewport override was reset.

Cross-origin stage submissions returned 403, oversized submissions returned 400, and trial evidence stayed unchanged. The last healthy browser case had no captured console errors. No CSP-error console entry was retained; the block condition rests on the delivered CSP and controlled stage results, not an invented console receipt.

## Remaining production acceptance

This lab uses a local first-party beacon, not Cloudflare ingestion or the complete blog Worker routing chain. Actual JavaScript-off, human-operated browsers, real iOS/Android hardware, warm/back-forward navigation, network changes and delayed/provider dashboard receipt remain untested here. CSP script blocking must not be relabelled JavaScript disabled. Production trials must reverify the actual test browser's owner exclusion before generating eligible events.

Next bounded action: design an excluded, time-bounded production trial with response/operation identifiers and an explicit missing-stage report. Use the local cases as controls, then test real clients. Record native-provider sampling and unmatched cases. A date/path coincidence remains a candidate correlation, not an authenticated join. Do not activate the optional diagnostic profile merely to achieve numeric agreement.

The [native recovery](../analytics-retrospective/15-native-input-recovery.md) and [improvement plan](../analytics-retrospective/05-improvement-plan.md) own the input-replay and independent correctness work. Discovery and citations have an additional boundary: [a brand-ranking benchmark](../analytics-retrospective/16-ai-discovery-benchmark-fit.md) is not readership measurement.
