# Cold public report performance

November 11, 2026 Pacific. Engineering follow-up to the completed [D1 availability repair](05-public-stats-503-2026-11-10.md). Status: in progress; implementation and production acceptance are pending.

## Evidence and architectural question

Read-only checks of the default report and the seven-day report returned already-cached responses in 127 ms and 75 ms respectively from SEA. These establish warm behavior only. No cold SQL duration or current production read cost was measured. The existing six-statement workaround repeats wide materialized populations and domain evidence projections. Cached delivery cannot establish acceptable cold performance.

A local D1 baseline over 4,500 synthetic events takes about 1.1 seconds end to end and reports 726,430 reads, zero writes. Per-statement SQL durations are 203, 99, 129, 132, 159 and 361 ms in that run. The fixture contains historical, recognized and inconsistent signature/network records; this is a diagnostic fixture, not a production forecast. Reproduce before using these provisional values as a comparison.

## Plan and acceptance

1. Read primary D1/SQLite performance, transaction and metering guidance, and reporting-model guidance. Trace observation, evidence interpretation, report assembly and delivery responsibilities.
2. Profile a frozen prior implementation locally. Evaluate query-specific column projection, reuse of evidence assessments and shallow CTE dependencies before introducing a persistent read model. Compare repeated and distinct evidence, and populated and empty windows.
3. Record the chosen design in a child ADR of the analytics decision thread. Keep analytics semantics in its package, SQL storage planning separate from report assembly, and HTTP/cache policy in the Worker. Preserve complete transactional snapshots, exclusions, historical interpretation, daily-client set semantics and private host suppression.
4. Implement the measured design and meaningful regressions. Verify exact reports against the frozen implementation across all ranges/groups, paths, agent/kind filters, malformed records, owners, referral precedence, empty results and all-time boundaries. Exercise the affected Workerd runtime as well as Node SQLite.
5. Run analytics/site tests, typechecks, validation, isolated production build and Worker dry-run. Integrate scoped changes to main without staging unrelated work.
6. Join source to the activated Worker, then make one marked natural seven-day/all-audience cold request and an equivalent repeat with a fixed tail. Capture end-to-end and SQL durations, every statement's read/write meters, bytes, calculation time and cache outcome. Target less than one second for the cold report response on the verification route, with a separately recorded 1,000,000-read review ceiling for that one fill. Stop further fills if the ceiling is exceeded. Consider one default 30-day verification only after the first gate passes. No filter grid or public cache bypass.

## Sources consulted

- [D1 indexes and query plans](https://developers.cloudflare.com/d1/best-practices/use-indexes/): index predicates and joins; verify plans rather than assume an index fixes aggregation.
- [D1 database batch API](https://developers.cloudflare.com/d1/worker-api/d1-database/): sequential transactional batches; concurrent promises do not parallelize one database.
- [D1 return objects](https://developers.cloudflare.com/d1/worker-api/return-object/): distinguish SQL duration from network time and retain row meters.
- [D1 limits](https://developers.cloudflare.com/d1/platform/limits/): single-threaded database, statement/result limits and batch duration.
- [SQLite materialization](https://sqlite.org/lang_with.html#materialization_hints): materialized CTEs prevent flattening and can copy data to ephemeral storage.
- [Fowler on CQRS](https://martinfowler.com/bliki/CQRS.html): separate read/write models where beneficial within a bounded context; complexity must earn its place.
- [Materialized View pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/materialized-view): persisted projections need rebuild, refresh, consistency and freshness policies.

Private profiling files and the frozen reference currently reside under `/private/tmp/gkoreli-stats-performance-*`; archive durable evidence before handoff. No raw author messages belong in this record.


## Chosen implementation and local acceptance

[ADR-0016.23](../../../../../docs/adr/0016.23-cold-report-projections.md) accepts query-specific projections and exact evidence multiplicities. Five prepared statements run in one transaction. The evidence statements group their complete input tuples at the first read, before copying materialized populations or evaluating validators. Core daily-client counts retain event-level set semantics. SQL planning moves to `stats-query.ts`; report parsing, decoding and reconciliation stay in `stats.ts`. The cache freshness policy is unchanged; namespace/calculation metadata advance to `2026-11-11.1`.

A single combined statement remains rejected on the affected runtime. A first four-part candidate also exceeds its expansion budget for the context/transition group; splitting that group yields the accepted five-part native plan. These are local failures, with no production query. Required section reconciliation remains unchanged.

[Paired native measurements](2026-11-11-native-performance.json) use frozen source `d633d3f0`, Workerd `1.20261108.1`, Node 24.14.1 and the same populated database for each before/after pair. Every report matches exactly. No Worker/HTTP report cache is involved; insertion and database page warmth are not isolated. The earlier pre-index 1.1-second diagnostic and these paired controls have different schema/fixture conditions and are retained separately.

| Synthetic condition | Prior / candidate elapsed | Prior / candidate reads |
|---|---:|---:|
| Empty | 25.6 / 17.4 ms | 122 / 117 |
| 4,500 events, repeated evidence | 839 / 68.8 ms | 712,847 / 294,244 |
| 4,500 events, distinct envelopes | 915 / 614 ms | 731,110 / 627,191 |
| 15,000 events over 29 dates | 2,845 / 224 ms | 2,311,116 / 912,737 |

A separate control adds 30,000 archived events outside the selected window: candidate report reads decrease from 1,062,737 to 912,737 with the new owner/time index, with identical output. Elapsed time is 224 / 218 ms in that control, so a large latency gain from the index alone is not established. SQLite's old plan constrains only `is_owner` on an unrelated composite index; the new plan constrains `is_owner` and both raw timestamp bounds. Migration 0017 creates the index idempotently and runs `PRAGMA optimize`; it changes no retained field and the empty-install snapshot stays equivalent to the upgrade chain.

The final affected-runtime differential check passes all 33 selectors over 47 mixed synthetic rows, including all four ranges, all six reader groups, path/agent/kind filters and all-time boundaries. The 4,500-event and 15,000-event controls add repeated/distinct, owner/referral-excluded and current cache-evidence records. SQL timing metadata now distinguishes provider SQL execution from awaited binding wall time; absent/invalid/fractional/zero controls pass without treating missing values as zero.

Local checks pass: 445 analytics tests, 442 site tests, workspace typechecks, Markdown validation, isolated 45-post production build and Worker dry-run. An initial IPC-restricted build fails before compiling and succeeds with the permitted local socket. A small-table index-plan assertion initially permits a legitimate scan; the final test uses selective historical data and preserves every observation byte. Existing event-based Fetch Metadata helper callers remain supported while the report explicitly selects cohort multiplicities.

### Release gate

Reconcile concurrent main changes, rerun affected integrated checks, and apply only the reviewed index migration. Then activate the scoped source and execute the predeclared seven-day cold/repeat pair. A separate 30-day/all cold/repeat pair is permitted only after seven-day acceptance; use a 2,000,000-read review ceiling for that wider single fill and the same sub-second response target. These ceilings are post-execution review gates, not enforced database limits. Preserve raw captures privately and record source, index delivery, activation and measured acceptance separately.


## First production gate: latency target missed

Source `d3afaed842c74ff2c89a04c77e5d0567ac337aae` is activated by native build `a89bd252-78ec-4482-b72b-ff841559a4bb` as Worker `1cd0bcd7-6b7c-4924-9631-a8ca05e155cb`, Ready/100%. The index migration applies alone, and its ledger/index columns plus an actual query-plan check confirm an owner-and-time range search (one total metadata read, zero writes for verification).

The marked seven-day/all report returns 200/MISS from SEA in **1.588 seconds**, with **934.3152 ms SQL / 1,278 ms binding wall time**, **386,030 reads / zero writes**. All five statements succeed once. The final metadata/network statement accounts for **563.6545 ms**. The cost ceiling passes; the sub-second latency target fails, so default 30-day acceptance is deferred.

The equivalent request is routed to SJC and returns another 200/MISS in **1.350 seconds**, with **988.7308 ms SQL / 1,028 ms binding wall time**, **386,392 reads / zero writes**. It has a new calculation and body; this is a second regional fill, not cache reuse. Both costs and unavailable global hit-rate claims remain explicit. The owned filtered tail is stopped. No further report fills are authorized by this checkpoint until a revised candidate is checked.

The remaining measured bottleneck justifies a narrow persistent read projection under the ADR's materialized-view decision gate: retain the exact stored network interpretation by observation and rule fingerprint, invalidate on source changes, maintain it after acknowledged ingestion, and backfill a frozen ID window before activation. Missing/stale projections must run the same validator so data correctness does not depend on projection availability.


## Network read projection candidate

Migration 0018 adds an observation-linked network-state projection and source-update invalidation trigger. The application service projects an acknowledged source row as a separate best-effort operation; the source repository and public JSON contract are unchanged. Current-rule facts are reused across all selectors. Missing/stale facts still use the exact SQL interpreter. Repeated rebuilds skip current facts rather than write them again. The rule fingerprint is pinned by a compatibility test.

The local affected-runtime comparison now runs all 33 selectors in both fallback and projected modes (66 exact comparisons), with no report writes. [Rebuild and report controls](2026-11-11-projection-performance.json) also cover repeated envelopes, uniquely varying network envelopes, distinct signature/network envelopes and 15,000 events over 29 dates. Each projected response equals its fallback and frozen prior report. Projection write costs are separate from report reads. Host contention is uncontrolled, so production latency remains the acceptance gate.

All 449 analytics tests, 442 site tests, types and the isolated 45-post build pass for this candidate. Tests cover missing/stale facts, source invalidation/deletion, exact repeated-event weights, no-op rebuilds, fingerprint changes and a projection failure preserving exactly one acknowledged observation without replay.

### Bounded projection delivery plan

Apply only migration 0018 after final native/Worker checks. Capture the minimum and maximum IDs of retained non-null network evidence, then rebuild that fixed window in at-most-1,000-ID chunks with the prepared projection SQL. Record every result and cursor privately. Stop after any failed/unknown-cost batch, any batch above 200,000 reads, or cumulative 5,000,000 reads / 50,000 writes; these are post-execution review ceilings. Verify current-rule coverage through the fixed high-water mark. Preserve source high-water and any later tail-window reconciliation separately.

Deploy the checked projector/read-adapter source with cache namespace `2026-11-11.2`. Reconcile a bounded post-activation tail if source rows arrived between the frozen high-water mark and forward projection. Repeat the seven-day and default 30-day acceptance using same-connection request pairs, so a connection changing SEA to SJC does not stand in for a cache-reuse test. Stop further report fills on failed cost/latency gates and retain earlier failed acceptance evidence.


The final query adapter also makes host assessment independent of wide event materialization and shares numbered bindings across repeated predicates. Core and evidence populations are read directly with their required projection. Attempts to combine all basic panels still exceed the affected engine's expansion counter; the final plan preserves five bounded statements. All 449 analytics tests and 66 native fallback/projected comparisons pass after this flattening. The source-table read and existing referral evaluator remain the same policies.

Before migration 0018, the CLI query endpoint returns authorization error 7403 during listing. Database metadata remains accessible, then a constant `SELECT 1` succeeds with zero reads/writes. The isolated list succeeds afterward and shows only migration 0018. No credential, role or account repair is inferred. Migration 0018 then applies alone; the fixed source window contains 9,902 non-null network envelopes (IDs 32,131–42,033). Its control query costs 42,032 reads / zero writes and 162.2 ms SQL, within the separately reviewed 100,000-read metadata ceiling.
