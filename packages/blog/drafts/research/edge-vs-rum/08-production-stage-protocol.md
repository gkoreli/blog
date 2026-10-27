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

## Current acceptance state

Prepared code and native tests only. Migration, source activation, actual production controls, human participation and temporary-binding removal have not yet been accepted in this record. Do not promote the planned procedure into an executed experiment.

[Source checks](production-stage-source-checks.json) pass 133 analytics tests, 106 site tests, workspace types, four bundled native workerd fixtures, a 32-post isolated build and the linked reference checks. The [pre-release receipt](production-stage-pre-release.json) records migration 0016 as the only pending migration and successfully applied before source publication. Optional owner/calibration/raw-diagnostic binding names were absent at preflight, preserving existing configuration. Source activation, actual production controls and removal of any later temporary bindings remain to verify.
