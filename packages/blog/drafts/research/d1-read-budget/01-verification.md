# D1 Read-Budget Repair Verification

September 7, 2026 UTC. [Decision](../../../../../docs/adr/0016.7-budget-d1-reads-and-cache-public-reports.md), [incident](00-incident.md).

**Later acceptance completed:** after the owner's reported upgrade, production comparison and cache reuse passed at 06:18–06:21 UTC. [Recovery record](02-recovery.md). References below to unverified or blocked checks describe the initial release checkpoint; they are not the current task status.

## Local acceptance

- **49 analytics tests passed**, including one shared report statement, policy precedence, owner and scope exclusions, all panel contracts, empty dimensions, and rejection of malformed report sections.
- **30 blog tests passed**, including ten cache tests: canonical filters and ignored parameters, validation before reads, policy/version invalidation, hour and UTC expiry, coalescing with independent response bodies, error/cookie exclusion, cache-store failure, and the eight-fill limit.
- **148 comparisons passed** between the old projection at `3d92b10` and the revised projection executing through **Miniflare 4.20260301.1's D1 binding**. The fixture has 624 observations, all reader kinds plus unclassified rows, six dates, eight hostname variants, repeated daily identifiers, two owner-exclusion mechanisms, null dimensions, and composed filters. All 144 populated selections and four empty-range selections return deeply equal public responses. [Machine-readable result](parity-workerd.json).
- Workspace `pnpm typecheck`, `pnpm build`, and `git diff --check` passed. The build produced 25 posts and verified the unchanged referral policy hash offline.

The differential baseline uses the old aggregation code with the same legacy hostname evaluator. Its purpose is projection parity, not an independent reevaluation of every archived policy rule. The existing policy tests cover those boundaries. The local D1 adapter is closer to production than Node SQLite but does not establish production quotas, deployment behavior, or billed-read savings.

## Production evidence and unperformed checks

The first candidate used a long compound `SELECT`. Local SQLite accepted it; production D1 rejected compilation with `too many terms in compound SELECT` at approximately 05:27 UTC. It was not deployed. The revised statement uses a section table and JSON payloads, preserving shared materialization while avoiding that compound query.

At **05:41:47 UTC**, D1 rejected the revised fixed-window benchmark because the account's free daily read allowance was exhausted. The candidate returned no result or `rows_read` metadata. At **05:43:07 UTC**, a metadata-only request reported 5,055,350 account reads for the UTC day; the separate query profile attributed 5,028,734 reads to 225 referral-matcher statement executions. [Sanitized exhaustion capture](usage-at-exhaustion.json). Those executions do not identify callers.

At that checkpoint, **production compilation/result parity, measured read reduction, and successful live cache reuse were unverified**. Do not derive a percentage reduction from statement count or local elapsed time. A one-statement report still scans materialized data for its different panels. Neither rejected production attempt returned metering metadata; their read cost is unknown. The later [recovery measurement](02-recovery.md) supplies the missing production evidence.

Deploying the correction does not itself restore a spent account allowance. Cloudflare documents the UTC reset and plan upgrade as ways past the free cap. The agent did not change billing or mutate the database for this repair. The owner later reported completing the upgrade, and the subsequent [recovery checks](02-recovery.md) completed production acceptance. The small query below was an earlier, narrower access observation.

### Later access observation — 06:11 UTC

The newsletter recovery follow-up successfully ran `SELECT * FROM client_errors` at 06:11:07.753 UTC, returning thirteen rows with thirteen metered reads and zero writes. [Sanitized evidence](../newsletter-reliability/recovery-log-recheck.json). This verifies that one small query succeeded after the earlier quota rejection. It does not verify production compilation or parity of the revised analytics query, read reduction, a successful stats report, or a cache hit. No billing change or reset is inferred from it.

## Retained evidence

The author's private archive is `analytics-evidence/2026-09-07-d1-read-budget/`. [File commitments](private-evidence-manifest.json) cover the account responses, query insights, failed candidate response, local comparison scripts, baseline modules, and independent query/cache reviews. No authentication token, session log, or raw email is committed. These hashes support an audit by the author; the private source bytes are required to reproduce the account evidence.

The new correction changes code and report delivery, while policy `2026-09-06.2` retains SHA-256 `25d4655bd67b0a63e9fc1f59586c6d85f924671024874198a678e8b82a00d7c4`. No collection fields, observations, referral rules, or database schema were changed. The article's cost section and ADR-0016.6 now point to the operating-budget correction without replacing their historical measurements.

## Initial production acceptance plan, completed in recovery

1. Read account metadata first. Do not run the wider evidence extractor or repeatedly refresh the public dashboard during the incident.
2. Run the retained candidate once for the fixed August 8–September 6 UTC window. Record statement count, `meta.rows_read`, writes, and comparison with the old saved report. Investigate late writes or owner changes if it differs; do not assume a transactional comparison with the earlier capture.
3. Capture one live `/api/stats?range=30d&traffic=browser` response and one equivalent request with reordered or irrelevant parameters. Confirm the unchanged policy, approved-name projection, report timestamp, and a cache hit with identical received JSON. Record the Cloudflare data-center indicator; a different data center may have a separate cold cache.
4. Append release/version metadata and received-byte hashes. Update the task and article with measured results only after these checks succeed.

## Deployment and served-artifact verification

Commit `316eb006a2ab150a56414c93d95e844339dad304` was pushed to `main`. Cloudflare activated deployment `4f84a84d-9132-4d6f-9788-d4db6a8997ab` at **05:49:21.201035 UTC**, with version `b0e713a8-c2fe-4094-acba-ea57e3ae9457` serving 100%. The commit's Workers Build check completed successfully at 05:49:25 UTC.

Checks at **05:50–05:51 UTC** verified the served stats freshness disclosure, the corrected article's Markdown representation, and the replacement of real-time discovery wording. All returned HTTP 200. An invalid stats selection returned the expected HTTP 400 and `Cache-Control: no-store`, exercising the new validation path before database access. [Response hashes and deployment metadata](release-verification.json).

No valid stats request was issued for this initial release check while the account was capped. That check did not verify a successful production query, a cache hit, or the live database-failure response. The ten cache tests covered error handling locally. The owner's later limit-exceeded email corroborated the database quota rejection without authorizing a billing change. Successful report acceptance was still required then; it subsequently completed in the [post-upgrade recovery record](02-recovery.md).
