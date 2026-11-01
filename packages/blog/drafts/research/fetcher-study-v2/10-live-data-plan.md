# Read a complete recent day before interpreting growth

November 1, 2026 UTC. This is the frozen read plan for the owner-requested revision, alongside [the live browser trials](07-live-trial-plan.md). It specifies a fresh production selection; its local preflight results are SQL-contract checks, not audience findings.

## Select the day, preserve every retained kind

Select stored observations with `observed_at >= '2026-10-31 00:00:00' AND observed_at < '2026-11-01 00:00:00'`. The interval is one complete UTC calendar day. A later query cannot establish that every request in that day reached storage or that no delayed insert will appear afterward.

The selector uses the existing `idx_page_observations_observed_at` index explicitly. Preflight selects at most 1,025 rows, then returns the row count, exact minimum/maximum IDs as decimal strings, summed selected UTF-8 text bytes and maximum selected bytes per row. The extra row is an overflow sentinel, not a truncated sample to analyze. Export only if the preflight fits all limits:

| Limit | Bound |
| --- | ---: |
| Selected observations | 1,024 |
| Selected text bytes | 2,000,000 |
| Selected text bytes per row | 16,384 |
| Production SELECT statements | Two: one preflight, one conditional export |
| Attempts per statement | One |
| Read-review threshold per statement | 10,000 acknowledged reads |

The read-review threshold is a post-execution stop, not a database-enforced cap. Empty preflight requires no export. A failed, oversized or over-threshold preflight stops the plan; it does not authorize a narrower window or automatic retry. A successful preflight freezes its exact upper ID into the export, alongside the same day predicate. Preflight and export are separate reads without a held snapshot transaction. The export must reproduce the count and exact byte sums, and contain unique exact IDs inside both the frozen ID and time boundaries.

## Keep the existing transport contract

Reuse the 24 text fields, five flags and ASN selected by [the evidence-delta helper](../../../scripts/evidence-delta.mjs), rather than adding request headers or client identity. In particular, select no IP address, raw User-Agent, daily-client ID, request diagnostic payload, credential or newsletter field. Return only an `EXISTS` owner-client flag from the private owner table. Referrer hosts and exact row references remain private.

The retained fields preserve each stored kind, representation, collection/classifier stamp, signing result, signature evidence, client declarations, network evidence, client-form evidence and referrer assessment inputs. No kind is filtered out to make the results resemble a human-audience count. Any later public inclusion assessment must use the shared owner/referral rules and retain excluded/unassessed partitions explicitly. Resource accounting must use the catalogue's explicit article/prompt relationships; a `/prompts` event is a separate evidence-resource event, not another canonical article view.

Run SQL through Wrangler `--command=<SQL>` as one subprocess argument. Do not use the remote import-oriented `--file` path. Save raw stdout/stderr, attempt markers, SQL hashes and response meters privately. The preparer refuses a previously attempted phase and validates zero writes, `changed_db=false`, a single acknowledged attempt and the read threshold before allowing the next phase. An authorization failure remains a failure, without a data-query fallback.

## Native preflight accepted

The actual prepared SQL ran against the current fresh schema in local Miniflare/workerd D1. Checks passed for an empty day, inclusive start/exclusive end, UTF-8 byte accounting, exact IDs above JavaScript's safe-integer range, owner-table existence without exporting client IDs, frozen upper-ID behavior and the 1,025-row overflow sentinel. `EXPLAIN QUERY PLAN` uses the observed-time index for both queries and the owner-client covering index for export; it performs no observation-table scan. The export additionally reports a temporary sort for the last order term.

The first local invocation failed at a sandbox loopback permission boundary before SQL execution. A reviewed local rerun passed at `2026-11-01T00:30:39.842Z`. These are generated local SQL fixtures used to validate the query path, not real traffic or a new article finding. No production SELECT was made by this preparation lane.

Frozen commitments:

- Preflight SQL SHA-256: `cf112acc85b133b970e5bf6b55725d6d6eba1651f9cb444c5d635f64479fb634`.
- Export-template SHA-256: `032418811b779c2441b916c388ea16358b2faa32b715ac08617e3cb2096522b4`.
- Shared helper SHA-256: `bcafff42fe5d017e0b4d2e7163b020c502210020358158994b1dc2144f52d31d`.
- Fresh-schema SHA-256: `a53392e14c69a62ce1c73c9f8c24afff2e773f68d55831490896e45fa6f93099`.

Private files live in the task's restricted `fetcher-live-20261101` working directory: `day-read-plan.json`, `day-preflight.sql`, `day-export-template.sql`, `check-day-read.mjs`, `day-native-check.json` and `run-day-read.py`. The parent investigator owns the conditional production execution and accepted data analysis. The current plan alone establishes no growth rate, people count, organic-demand result, provider accuracy or fresh signature replay.
