# Analytics and D1 Handoff — September 7, 2026 UTC

Resume here after the break. This checkpoint records completed work and open questions; it does not require an agent to remain running. [Decision](../../../../../docs/adr/0016.7-budget-d1-reads-and-cache-public-reports.md), [current production acceptance](02-recovery.md), [task](../../../../../docs/tasks/TASK-0131-d1-analytics-read-budget.md).

## Verified state

- **Billing:** the owner reported upgrading to Workers Paid. The agent did not perform the purchase. Do not ask again for approval to make that already-completed upgrade. Exact plan activation time was not inspected.
- **Deployed engineering:** commit `316eb006a2ab150a56414c93d95e844339dad304` contains one shared report assessment, canonical Worker caching, coalesced fills, an eight-fill limit per isolate, retryable errors, and visible freshness. Cloudflare activated it at September 7 **05:49:21 UTC**; `b9a3ec0` recorded that release.
- **Production acceptance:** the fixed-window response is unchanged, while reads fell **182,388 → 33,259 (81.7647%)**. Two live equivalent requests returned identical JSON with `X-Stats-Cache: HIT`. See `recovery-measurements.json`; do not rerun the benchmark to discover these values.
- **Scale:** **7,010 page observations**, **3,117,056 total database bytes** at the 06:19 capture. Stored observations and cumulative query reads are different quantities.
- **Referral policy:** `2026-09-06.2`, SHA-256 `25d4655bd67b0a63e9fc1f59586c6d85f924671024874198a678e8b82a00d7c4`, using the pinned 2,348-host Matomo list plus one local exclusion. This recovery did not alter the policy or collected evidence.
- **Historical versus live counts:** fixed August 8–September 6 cohort = 937 included + 35 excluded. Captured August 9–September 7 report = 1,028 included + 38 excluded. Preserve each window and timestamp; neither count is a permanent assertion about future reports.
- **Checks:** 49 analytics tests, 30 blog tests, 148 comparisons through local D1, workspace typechecks, and production build passed for the engineering release. Production SQL and cache checks subsequently passed after the owner upgrade. A docs/content build accompanies this bookkeeping update; no new runtime changes require repeating the full test suite.

## Evidence map

| Artifact | Purpose |
|---|---|
| [00-incident.md](00-incident.md) | Cause, free-cap exhaustion, source definitions, and initial evidence. |
| [01-verification.md](01-verification.md) | Local acceptance and the first deployment, including checks blocked at that time. |
| [02-recovery.md](02-recovery.md) | Successful production measurement, cache reuse, current limits, and verification cost. |
| [04-local-query-attribution.md](04-local-query-attribution.md) | Deduplicated known verification calls; explicit limits on caller attribution. |
| [recovery-measurements.json](recovery-measurements.json) | Machine-readable comparison, inventory, cache headers, and report hashes. |
| [private-evidence-manifest.json](private-evidence-manifest.json), [recovery-evidence-manifest.json](recovery-evidence-manifest.json) | Commitments to the original private capture sets. |

Private originals are under `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-09-07-d1-read-budget/`, including `post-upgrade/`. Earlier policy results are under the sibling `2026-09-07-referral-policy/`. These are durable author archives, not `/tmp` dependencies. Reproduction scripts retain the original workspace paths; inspect them before reuse. Never publish credentials, full mailbox captures, subscriber addresses, or raw unapproved-host results.

## Work to resume only when it resolves a question

1. **Observe an operating window:** use metadata for the first complete UTC day after this handoff, **September 8 00:00–September 9 00:00 UTC**, once it has elapsed. Separate cold report reads, other account work, and request counts. Use it to choose another bounded experiment or no action; do not infer a global cache-hit rate from two local hits. No scheduled job was created.
2. **Newsletter reliability:** continue [FLDR-0010](../../../../../docs/folders/FLDR-0010-newsletter-reliability-and-bot-protection-worklist.md) and the [shared reliability checkpoint](../../../../../docs/handoffs/2026-09-07-reliability-checkpoint.md). Restored D1 access does not close Turnstile, delivery, subscription-state, or recovery tasks. Do not send messages or alter real subscriptions without their existing task authorization.
3. **Incident loss and attribution:** precise outage duration, missed observation/signup counts, and callers of the unassigned report activity remain unknown. The saved local audit is bounded. If those questions matter, inspect retained Worker logs/traces promptly within their retention window and join only evidence that supports a claim. Do not blame the referral host or classify people from shared browser characteristics.
4. **Browser QA:** the referral worklist's interactive/visual check remains open; HTTP artifact checks and Node/local-D1 tests do not replace it.

The read-budget implementation and acceptance are complete. Ongoing observation is separate from that completed repair. No database migration, automatic replay, newsletter send, billing operation, or background production polling is left running by this analytics session.
