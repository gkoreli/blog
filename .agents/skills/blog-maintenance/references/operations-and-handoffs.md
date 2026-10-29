# Operations and Handoffs

## Investigations

Read the task, latest dated handoff, and saved captures before repeating work. Historical observations do not establish current service health. Save a cited result and relevant receipts, link them from the task, and mark the requested work complete when its acceptance criteria are met. Keep proposed experiments separate from completed research.

Record code commit, deployment activation, local checks, and observed production behavior separately. Verify the actual flow being claimed: a homepage response or small successful query does not prove newsletter completion, report health, cache reuse, or account-wide quota recovery.

For recovery claims, identify the stores, fields, and windows inspected and histories still inaccessible. A request rejected before persistence creates no row from that attempt; it does not prove no older provider record exists. Error counts and shared browser properties cannot identify people. Keep addresses and tokens out of public evidence and ordinary diagnostics.

Separate Worker binding access from CLI/API authorization. After an authorization error, inspect existing account/database metadata before repeating a data query; metadata success alone does not establish query access. A native-tested constant SELECT can check that endpoint without scanning observations. Preserve the original error and unavailable metering; retry a bounded data query only after fresh positive evidence, without inferring a specific repaired credential, role or service cause. [Measured example](../../../../packages/blog/drafts/research/analytics-retrospective/48-query-access-and-native-comparison-boundaries.md).

## D1 reads and report caching

Follow [ADR-0016.7](../../../../docs/adr/0016.7-budget-d1-reads-and-cache-public-reports.md).

- `rows_read` is cumulative query work, not distinct observations, visitors, or returned rows. Record every statement's reads and the report total, with the window, sampling, and attribution limits.
- Wrangler 4.71 `d1 info` rolling counters can be zero when optional GraphQL data/groups are absent: its implementation initializes them to zero. Without raw response coverage, treat zero as ambiguous rather than unused quota. Keep per-statement meters separate and preserve conflicting captures without guessing their cause. [Source and measured example](../../../../packages/blog/drafts/research/analytics-retrospective/79-cohort-reasons-and-historical-records.md).
- Dashboard and CLI queries consume reads too. Inspect saved evidence and service metadata, test fixtures locally, then run bounded production checks. After a quota rejection, stop expensive retries and inspect allowance through metadata.
- For remote diagnostic SELECTs, use Wrangler's `--command` query path. Read prepared SQL from a private file and pass it as one subprocess argument, without shell interpolation. Wrangler 4.71's remote `--file` path uses D1 import, can affect availability, and returns an import summary instead of selected rows. Intentional imports, local file tests and explicitly authorized migrations retain their existing workflows. [Source-backed incident and metering](../../../../packages/blog/drafts/research/analytics-retrospective/25-native-category-and-entitlement.md#wrangler-execution-path-correction).
- Compare total report cost with cold requests, other account activity, and the applicable plan. Fewer statements or lower local latency does not prove fewer metered reads.
- Reuse captures across authorized workers. Compare GraphQL windows only after inspecting the saved query and variables; rolling totals, UTC-day totals, and adaptive profiles differ. Shared CLI logs alone do not attribute work to a task or person.
- Cache the shared report assessment for at most one hour, capped at UTC midnight. Include validated filters, referral-policy hash, and `STATS_REPORT_VERSION` in keys. Bump the version when report semantics, public selection, or storage binding changes.
- Preserve calculation time on cache reuse. Verify expiry, errors, and an actual cache hit. Cache storage is per data center and request coalescing per isolate; neither sets a global read budget.
- Execute SQL through local D1 before production acceptance; Node SQLite may accept SQL D1 rejects.

## Checkpoints and working copies

Before a break, update the worklist with completed evidence, remaining checks, blockers, artifact locations, and the next bounded action. Keep unfinished tasks unfinished. `in_progress` identifies work to resume, not a running agent.

Inspect linked worktrees when work spans checkouts. Preserve uncommitted work outside temporary storage with its base commit, file manifest, hashes, and recovery instructions. Compare recovered changes with current `main` before integration. Keep private logs outside Git and later housekeeping outside frozen article footprints.

Before a production build, check for another session writing to `dist/`. Use an isolated checkout when outputs conflict; do not stop another session's server. Commit and push the authorized changes after checks.

For existing incidents, start from the [newsletter worklist](../../../../packages/blog/drafts/research/newsletter-reliability/00-worklist-index.md) or [analytics handoff](../../../../packages/blog/drafts/research/d1-read-budget/03-handoff.md), then follow newer receipts linked there.
