# Matched classifier and collection-stage controls — October 27, 2026 UTC

Extends [the eighteen October 26 trials](06-controlled-stage-experiment.md), [TASK-0120](../../../../../docs/tasks/TASK-0120.md) and [client-form research](../analytics-retrospective/22-client-form-and-calibration.md). The old capture remains frozen. This is an executed 24-trial local comparison, not a new production or human-readership measurement.

## Method and reproducible boundaries

The [lab](../../../scripts/analytics-calibration-lab.mjs) invokes the real collector and native local D1 while serving isolated loopback pages. Eight conditions run three times each: twenty-one visits in the agent-operated Codex browser and three actual curl requests. Operator labels come from who executed each trial, independently of the classifier. The narrow condition uses a 390 × 844 viewport and resets it afterward; it is not a phone. CSP `script-src 'none'` is script blocking, not a JavaScript-off browser setting.

For every delivered request, an adapter also runs the earlier pure classifier from commit `24c7c5010f6f41d8c8c81ac5a6b9e2cad65614fc` on those same request inputs. The baseline has no separate D1 write. The [exact adapter source](../../../scripts/calibration-baseline-adapter.mjs) is copied to the root of a checkout/archive of that pinned commit as `adapter.mjs`, after compiling its analytics test target; its relative imports intentionally resolve only against that earlier checkout. Its adapter SHA-256 is `62095991b0c156657f1d2ee4672e1b8b60b190ae1e209e3edec670c81922f4bd`. Two conditions deliberately supply ASN 12345 (unlisted in our reviewed list) or 16509 (listed). These are injected policy inputs, not a measurement of the browser's source network. Other local requests have no edge ASN.

The [aggregate receipt](2026-10-27-stage-lab-v5.json) and [summarizer](../../../scripts/summarize-calibration-lab.mjs) check 24 manifest/report IDs, three repeats per condition, exactly one recorded delivery per trial, actual stored-row counts, acknowledgements/failures, stage totals, closed kinds/forms and paired transitions. Raw headers, local identifiers, browser states, screenshots and operation logs stay outside Git. The receipt commits to their report/manifest hashes and the executed lab/collector sources. No complete-runtime attestation is claimed. The summarizer requires the preserved executed-source tree and checks its hashes against the frozen receipt, preventing a later rerun from attributing newer source to the old trials.

The experiment ran collection/classifier `.5` before the separate Web Bot Auth `.4` repair. Its receipt's version-file hash identifies that exact earlier working file; all controls are unsigned, and that later verifier change supplies no result for this experiment. Subsequent API naming/summary-partition repairs are accepted separately through native D1. Frozen receipts are not regenerated to make their hashes match newer code.

## Results

All conditions have three deliveries. Acknowledgements mean stored collector operations, not human visits.

| Condition | Stored / failed | Script reports | Queued true | Beacon receipts | Earlier → stored kind |
|---|---:|---:|---:|---:|---|
| Normal | 3 / 0 | 3 | 3 | 3 | Browser → Unresolved |
| Beacon blocked by CSP | 3 / 0 | 3 | 3 | 0 | Browser → Unresolved |
| Script blocked by CSP | 3 / 0 | 0 | 0 | 0 | Browser → Unresolved |
| Injected write failure | 0 / 3 | 3 | 3 | 3 | Browser → not stored |
| curl | 3 / 0 | 0 | 0 | 0 | Other bot → Other bot |
| Narrow viewport | 3 / 0 | 3 | 3 | 3 | Browser → Unresolved |
| Injected unlisted ASN | 3 / 0 | 3 | 3 | 3 | Browser → Browser |
| Injected listed hosting ASN | 3 / 0 | 3 | 3 | 3 | Cloud browser → Cloud browser |

Twelve earlier Browser results now abstain into Unresolved because the local server supplies no edge network evidence. Three independently known automated browser visits with injected unlisted-network evidence still match Browser. Therefore the repair makes missing evidence visible; it does not turn Browser into an authenticated human class. Normal/narrow browser trials both retain non-mobile preference, never physical-desktop proof; curl retains unknown form.

## Error, abstention and failure denominators

The runtime produces descriptive request classes, not a human/automation predictor. For a separately declared **evaluation-only** mapping, Browser, Legacy browser and Unresolved abstain; the other kinds are automation candidates. Among **21 stored known-automated controls**, this yields six decisions agreeing with the known automated operator, zero disagreements among those six, and fifteen abstentions. The **three storage failures** are censored from this classifier denominator and retained as failures. All 24 deliveries still belong to the collection-stage experiment.

If someone incorrectly interpreted Browser as human, the same 21 paired records would produce fifteen wrong labels with the baseline versus three with the current rules. That is a hypothetical misuse comparison, not a deployed human classifier or general accuracy rate. There are **zero human-operated negative controls**: human false-positive rate, overall population accuracy, prevalence and physical-device accuracy remain unmeasured. Six agreeing decisions on selected positive controls do not establish a reliable detector.

## What the experiment explains and what remains

The beacon-blocked trials reproduce true queue acceptance with zero receipt. [MDN's return-value contract](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#return_value) and the [Beacon processing model](https://www.w3.org/TR/beacon/) explain why those stages differ. Write failures independently remove server observations while page delivery and beacon receipt succeed. Neither mechanism estimates its historical or production frequency, and the first-party local beacon is not Cloudflare ingestion.

The local server is stopped and the viewport override reset. No scheduled capture or lab remains active. Private evidence and the pinned baseline source/adapter have a manual October 31 retention review, not an automatic deletion claim. Next: a bounded excluded production-stage protocol, human-operated browser controls, actual JavaScript-off and real mobile/tablet hardware; native sampling/receipt and exact join acceptance stay separate. These results do not explain the historical 694-versus-117 gap's proportions.
