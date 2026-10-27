# Controlled production-stage protocol — October 27, 2026 UTC

Continues [matched local calibration](07-matched-classifier-calibration.md), [TASK-0120](../../../../../docs/tasks/TASK-0120.md), [TASK-0119](../../../../../docs/tasks/TASK-0119.md) and [ADR-0016.16](../../../../../docs/adr/0016.16-controlled-production-stages.md). The objective is to observe stages through the real Worker and preserve disagreements, errors and missing evidence. This document separates prepared capability from executed production controls.

## Why the local results are insufficient

The 24 local trials showed twelve earlier Browser results becoming Unresolved under missing edge network evidence, three known automated Browser results under injected unlisted-ASN evidence, blocked beacons and independent storage failures. They did not test actual production request metadata, Worker routing/crypto, owner exclusion for today's browser, or a production beacon receiver. Synthetic planned labels cannot fill the missing human/device controls.

## Mechanism and primary-source cross-reference

| Source / implementation | Measurement consequence |
|---|---|
| [Cloudflare `ctx.waitUntil`](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil) | Background work extends execution within platform limits; scheduling does not establish persistence. Count actual stored rows separately. |
| [Beacon processing model](https://www.w3.org/TR/beacon/), Candidate Recommendation Draft August 3, 2022 | Queue acceptance and receiver receipt are separate stages. Do not call the draft a final Recommendation. |
| [MDN `sendBeacon()` return value](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon#return_value) | A true result is queue acceptance, not an application receipt. Record false and thrown outcomes independently. |
| [MDN CSP `connect-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src) | CSP can restrict beacon/fetch destinations. The blocked-beacon condition allows exact stage/receipt paths while omitting the beacon endpoint. |
| Existing [`owner.ts`](../../../../analytics/src/owner.ts), [`hash.ts`](../../../../analytics/src/hash.ts), collector and public owner predicate | Reuse the same daily client derivation to verify exclusion before a page is served. Do not treat IP/UA grouping as a person's identity. |
| [`calibration.ts`](../../../../analytics/src/calibration.ts), [`Worker composition`](../../../src/worker/index.ts), [migration 0016](../../../../analytics/migrations/0016_calibration_trials.sql) | Off-by-default, expiring registered trials, shared D1 counters, guarded actual collection, bounded same-origin reports and a receipt usable without JavaScript. |

Activation accepts at most 32 registered UUIDs for at most fifteen minutes. Page/asset/report/receipt requests require a current-day owner mark. Pages then pass a server-verified exclusion option into the real collector, persisting `is_owner = 1`; deleting a daily mark cannot later expose these controlled observations. Anonymous/unmarked requests and expired configurations never start the trial. There is no extra device probe, raw diagnostic activation or new general reader identifier.

A guarded ready screen starts no observation or counter; a person can take over there and choose Start trial themselves. Preparing the page is therefore not counted as human execution.

Each trial records **responses prepared**, client-reported script execution and beacon attempt, queue true/false/thrown reports, beacon receipt, and actual observation rows/classifications. A response counter is not proof the client received all bytes. An absent row is pending/failure/interruption unknown, not an inferred zero delivery. The receipt reports planned operator labels and explicitly requires independent execution evidence before treating them as known labels.

Native D1 supplies shared atomic state across isolates; isolate memory and per-colo cache cannot establish a universal missing receipt. Stage bodies contain only the literal `1`, not arbitrary browser text. Origin, body and per-stage/per-page bounds reject unregistered writes. Raw experiment IDs/paths, activation values, owner grant and operational captures stay outside Git; public evidence contains aggregate counts, versions, methods and source commitments.

## Native local acceptance

The [maintained helper](../../../scripts/check-production-calibration.mjs) bundles and executes the **actual blog Worker in local workerd**, using native D1 and crypto. Four synthetic HTTP/stage fixtures check normal, script-blocked-header, beacon-blocked-header and HTTP-client paths. The source compiles its client script, marks the fixture profile through the real owner endpoint, persists actual excluded observations, denies unmarked/cross-origin access, serves the non-JS receipt, and keeps public totals zero after deleting the daily mark. Migration preserves an earlier row. Native expiry SQL and the ordinary analytics/Worker suites are separate checks.

These fixtures supply stage reports from a Node harness: they do not establish browser CSP enforcement, actual curl operation, a human label, physical devices or production behavior. The [native receipt](production-stage-local.json) records those limits. Browser-enforced conditions must be executed after activation, not inferred from successful server tests.

## Production procedure and budgets

1. Apply only migration 0016 after native acceptance. Publish checked code, verify activation and confirm the inactive namespace rejects requests.
2. Prepare a private expiring allowlist and a separate endpoint-scoped owner-marking grant. Preserve exact trial/operator plans privately; no planned human label is counted as a completed human trial.
3. Mark the actual agent-operated browser and the actual curl profile, then verify guarded page admission. A missing mark, changed IP/UA or expired activation is a failed precondition, not a classifier error.
4. Run three repeats of normal, CSP-script-blocked, CSP-beacon-blocked and actual curl conditions. Record response/UI evidence, current request classifications, received stages, queue outcomes, stored counts and exclusions. Do not inject a real production DB failure; the local failure experiment remains separate.
5. Accept independent human/browser/JavaScript-off/device controls only when those actions actually happen and can be labelled. Report skipped/unrun cases and decision/abstention denominators. No human false-positive rate is inferred from automated controls.
6. Remove temporary activation and owner-grant bindings; verify the namespace is inactive. Keep routine raw diagnostics off. Receipt reads expire immediately with activation; counters become deletion-eligible a day later, with physical cleanup dependent on the nightly job. Routine excluded observations retain their existing lifecycle.

Direct operational acceptance SELECTs must be time/path bounded and locally accepted before production, with a 500-read ceiling for this phase. Per-request guard checks, stage writes, receipt queries, ordinary collector writes, migration bookkeeping and public cache fills are additional service work; direct-query metering is not the experiment's total database cost. No broad all-traffic report is needed. Native log sampling/retention, actual Cloudflare beacon ingestion and original historical population reconciliation remain separate open work.

## Prepared-state checkpoint before activation

Prepared code and native tests only. Migration, source activation, actual production controls, human participation and temporary-binding removal have not yet been accepted in this record. Do not promote the planned procedure into an executed experiment.

[Source checks](production-stage-source-checks.json) pass 133 analytics tests, 106 site tests, workspace types, four bundled native workerd fixtures, a 32-post isolated build and the linked reference checks. The [pre-release receipt](production-stage-pre-release.json) records migration 0016 as the only pending migration and successfully applied before source publication. Optional owner/calibration/raw-diagnostic binding names were absent at preflight, preserving existing configuration. Source activation, actual production controls and removal of any later temporary bindings remain to verify.

## Executed production controls — October 27 UTC

[Release receipt](production-stage-release.json) accepts migration 0016, checked source `87ed725`, native build `1e0460a8`, 100% source activation at 18:17:54 UTC and the subsequent temporary configuration. Off-mode returned 404 before activation. An unmarked controlled request returned 403. The actual browser was marked through the owner form; actual curl was marked through the real endpoint. No existing admin credential was read or rotated.

The [aggregate automated receipt](2026-10-27-production-automated-controls.json), produced by [the maintained summarizer](../../../scripts/summarize-production-calibration.mjs), reconciles the private controller actions with twelve registered trial IDs and actual stored rows. Nine visits were agent-operated in the real browser and three used actual curl. Each has one observed response and one stored owner-excluded observation. These are repeated selected controls from two marked profiles, not independent people or a population sample.

| Condition, three repeats each | Stored observations | Script reports | Queued true | Server beacon receipts | Actual stored kind |
|---|---:|---:|---:|---:|---|
| Normal browser | 3 | 3 | 3 | 3 | Browser |
| Beacon blocked by CSP | 3 | 3 | 3 | 0 | Browser |
| Scripts blocked by CSP | 3 | 0 | 0 | 0 | Browser |
| Actual curl | 3 | 0 | 0 | 0 | Other bot |

All nine automated browser requests retained `navigation-shaped-network-unlisted`, network `not-listed` and navigation shape true from actual production inputs. Browser therefore remains a descriptive rule match even with the missing-network gap repaired. The earlier local Unresolved results used different, missing edge inputs; these runs are not a paired accuracy comparison. Script/beacon execution also cannot authenticate a human operator. The first-party receiver is proven, not Cloudflare's separate beacon ingestion.

The evaluation-only operator mapping makes three agreeing automation-candidate decisions and nine abstentions across twelve known-automated stored controls. It does not turn Browser into a human prediction. No human false-positive rate follows. A ready screen was shown and human action requested; at closing cutoff, no server trial rows existed for the six planned human IDs and no human execution was accepted. Absence does not establish that nobody attempted after expiry.

The [final acceptance SQL](production-stage-acceptance.sql) explicitly uses the existing owner/path/time index and checks **both** owner values, so a leaked `is_owner=0` row would not disappear from verification. [Native query-plan acceptance](production-stage-query-local.json) confirms indexed owner/path/time searches. The automated check uses 178 direct reads and the closing human-plan check 14: **192 acknowledged reads, zero SELECT writes**, within the 500-read phase ceiling. Per-request guard/receipt queries, stage/collector writes, migration bookkeeping and public fills are additional work. A fresh All/7d public report for one completed trial path is empty; all twelve D1 observations have permanent owner flags.

An early UI read raced the asynchronous receipt; the same trial completed without a reload or duplicate response. A later broad status locator matched both analytics and subscription status elements; scoping the locator fixed screenshot capture without another visit. No CSP console message was captured at the final ready page, so the blocked-condition finding rests on delivered policies and measured stages, not a fabricated console trace.

Configured expiry was 18:34:54 UTC. A subsequent ready-endpoint check returned 404 before configuration removal. Both temporary bindings are removed and absent; optional raw diagnostics remain absent/off. The revoked code file was removed locally, with no secure-erasure or provider-log-retention claim. Counter deletion eligibility, the later nightly cleanup and routine excluded-row retention remain distinct.

Completed: actual production routing/collector/D1, marked-client exclusion, normal and CSP script/beacon controls, actual curl, bounded stage receipts, indexed metered acceptance, public exclusion, natural expiry and temporary-binding cleanup. Next: reopen a short window when a human is available, accept independently operated browser/actual-JavaScript-off/real-device controls, and separately reconcile Cloudflare native sampling/beacon receipt and organic signed vendor inputs. Neither task nor the full objective is complete.
