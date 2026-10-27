# Labelled calibration: reconcile trials before scoring decisions

October 27, 2026 UTC. Continues [production-stage protocol 08](08-production-stage-protocol.md), [TASK-0120](../../../../../docs/tasks/TASK-0120.md) and [TASK-0119](../../../../../docs/tasks/TASK-0119.md). The production-stage release remains accepted for its recorded conditions. This follow-up strengthens acceptance and evaluation using the same twelve controls; it creates no new visits or human labels.

## The acceptance gap

The earlier [summarizer](../../../scripts/summarize-production-calibration.mjs) checked condition totals, then flattened nested per-trial observation arrays. That could accept two observations for one trial and none for another when the total still matched. Matching response totals could likewise conceal a repeated response and a missing one.

[Native local D1 controls](trial-ledger-local.json), reproduced by [the maintained helper](../../../scripts/check-calibration-ledger.mjs), execute the old helper from pinned source `4222587`. A duplicate/missing observation pair leaves the aggregate at twelve and the old helper accepts it. The repaired grouped-array check rejects it; the new per-trial evaluator marks two trials incomplete. A separate 2/1/0 response-counter fixture also marks two trials incomplete. Deleting a trial-counter record leaves all twelve requested rows in the ledger, with the missing record explicit.

These are synthetic stored records and controller manifests, not new browser/human operations or a finding that the original production cohort was corrupt. [Reinspection of the original saved arrays](trial-ledger-original-reinspection.json) finds every nested observation count was one. The missing assertion weakened acceptance without changing that recorded result.

## Preserve the requested population and the labels

The [new SQL template](production-trial-ledger.sql) starts with the requested IDs and left-joins counters and observations. Missing records cannot silently remove a trial. Observation searches use both owner values and the existing owner/path/time index; an accidentally public observation would fail exclusion acceptance. Raw IDs, paths, controller receipts and SQL containing actual IDs remain private.

[`calibration-evaluation.ts`](../../../../analytics/src/calibration-evaluation.ts) is offline evaluation code. It does not change the deployed classifier, reports or collection. It checks registration/uniqueness, plan consistency, one response and observation per executed trial, recognized kind and permanent owner exclusion. Missing/duplicate observations, counter failures and unknown kinds are integrity issues, not classifier abstentions or proven database write failures.

Labels come from accepted execution provenance, separately from stored kinds. The [production adapter](../../../scripts/summarize-production-trial-ledger.mjs) accepts only the original nine agent-controller executions and three curl receipts. The evaluator can represent a human attestation, but a synthetic unit-test label is not an accepted human control. Six planned human trials have no accepted execution in these inputs; that does not establish nobody attempted a request.

## What we borrowed from established evaluation practice

| Primary source | Applied idea and limit |
|---|---|
| [scikit-learn confusion-matrix documentation](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.confusion_matrix.html) | Known labels are rows, predictions are columns. Our extra abstention column stays explicit; no scikit-learn dependency is added. |
| [Precision/recall documentation](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.precision_recall_fscore_support.html), [pinned implementation](https://github.com/scikit-learn/scikit-learn/blob/afe5bcd80ce17fd8ca88c33beb17534bd36423bc/sklearn/metrics/_classification.py) | Undefined denominators require an explicit policy. The source's `_check_zero_division` permits NaN; our JSON rates use null. No copied implementation or new Python dependency. |
| [El-Yaniv and Wiener, JMLR 2010](https://jmlr.org/papers/v11/el-yaniv10a.html) | Separate the fraction of cases receiving a decision from errors among those decisions. We borrow this framing, not its algorithms or statistical guarantees. |

The evaluation-only mapping abstains on Browser, legacy Browser and Unresolved; other kinds are automation candidates. That is a declared interpretation of existing categories, not a newly deployed human detector. Incomplete measurements and complete-but-unlabelled trials stay outside the labelled decision matrix and retain their own counts. Human error/abstention rates remain null when the relevant denominator is absent.

## Actual production reinspection

[Per-trial aggregate](2026-10-27-production-trial-ledger.json) joins saved execution receipts to one later, read-only Wrangler SELECT: **166 metered reads, zero writes, twelve rows**, below the prepared 500-read ceiling. Observations use the original fixed window, October 27 18:19:52 inclusive to 18:28:40 exclusive UTC. Counter capture completed at 19:43:03 UTC before cleanup eligibility; these later counter values do not reconstruct the original cutoff. No second production query is needed to regenerate the aggregate from the saved capture.

All twelve executed controls individually have one prepared response, one stored observation and permanent owner exclusion. Nine are Browser and three Other bot. Stage counts preserve the earlier result: three normal beacons arrive; three CSP-blocked attempts report queued true but have no receipt; three script-blocked and three curl controls have no script/beacon reports. These are first-party stage receipts, not Cloudflare RUM receipt.

| Evaluation quantity | Result and denominator |
|---|---|
| Planned / accepted executions | 18 / 12; six have no accepted execution |
| Complete / incomplete executed trials | 12 / 0 |
| Known automation / known humans | 12 / 0 |
| Automation decisions / abstentions | 3 / 9 |
| Decision coverage | 3 of 12, 25% |
| Wrong committed decisions | 0 of 3 selected positive controls |
| Human false-positive rate | Undefined; no human controls |

Zero errors among these three committed decisions is not population accuracy. The twelve trials repeat four conditions on two marked profiles; they are not twelve independent readers. An explicitly undeployed counterfactual that treats Browser as human makes nine wrong decisions on the same controls. This diagnoses an unsafe interpretation without calling Browser's descriptive output an erroneous human prediction.

The 166 reads belong to this SELECT only. Earlier production-stage acceptance used 192 direct reads in two separate statements. Guards, receipts, writes, public report fills and unrelated database work are additional; neither figure is the experiment's total cost. No temporary configuration or optional diagnostic mode was activated for this reinspection.

## Delivery and next bounded action

Reproduce the adversarial native fixtures after compiling analytics:

```sh
pnpm -C packages/analytics test
node packages/blog/scripts/check-calibration-ledger.mjs /tmp/new-ledger-local.json /tmp/new-private-ledger-fixtures
```

Replaying the production adapter requires the restricted original manifests, exact SQL, metered result, plan and capture metadata; its aggregate contains hashes, not trial IDs. The temporary investigation archive is `~/.local/share/gkoreli/analytics-evidence/2026-10-27-trial-ledger/`, with an October 31 retention review. This is an investigation-copy review, not automatic deletion or a settled linked-row retention policy.

[Source checks](trial-ledger-source-checks.json) pass 149 analytics tests, 106 site tests, workspace types, post validation and a 32-post isolated build. The 1,250-word retrospective retains 30 shaping prompts and links this reconciliation without importing the full metrics table. Article publication acceptance is separate. Next: accept independently operated human, real-device and actual-JavaScript-off controls in a fresh guarded window when a person is available; separately establish native/vendor agreement, sampling and Cloudflare receipt. Do not infer availability, human labels or full-goal completion from the successful reinspection.
