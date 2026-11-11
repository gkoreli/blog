# Cold public report performance

November 11, 2026 Pacific. Engineering follow-up to the completed [D1 availability repair](05-public-stats-503-2026-11-10.md). Status: implementation delivered and measured; correctness, cost and server-generation checks are complete. The original sub-second client target is not consistently met on the verification routes.

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

Private profiling files initially reside under `/private/tmp/gkoreli-stats-*`; durable copies and reproduction conditions are now in the ignored `packages/blog/worklog/operations/stats-performance-20261111/` archive. The final production record commits to its manifest. No raw author messages belong in this record.


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


## Compact reporting facts: revised acceptance candidate

The narrow projection activates from checked source `f783c9ab` via native build `1d065b85-0944-47a6-9fe4-784cc80ebae5`, Worker `8eda81dd-2249-4aba-8af6-135370f08572` at 100%. A subsequent report pair is served by successor Worker `0009b52d-2aed-4067-941e-ff43597f2822`; its exact build/source join remains separate. The seven-day/all MISS takes **1.661 seconds** with **835.4181 ms SQL / 920 ms binding wall time**, **335,259 reads / zero writes**. Its immediate same-connection SJC repeat is **136.9 ms / HIT**, byte-identical with unchanged calculation time. Five statements run once. Cache reuse passes; cold latency fails, so no 30-day fill is attempted at this gate.

Migration 0018 applies alone. The fixed rebuild through ID 42,033 writes 9,902 facts at 106,509 reads; verification finds 9,902/9,902 current facts and zero missing (51,935 reads). Four later pre-activation records are separately reconciled at 36 reads / four writes. No retained source row is changed. These are intermediate derived-write costs, not report reads.

The final candidate broadens the read model to compact event reporting facts under [ADR-0016.23](../../../../../docs/adr/0016.23-cold-report-projections.md). It shares the exact evidence policy expressions with source reporting. Ordered nullable metric arrays avoid retaining raw evidence or repeating long metric keys per observation. Reporting still computes dynamic exclusions and exact daily-client sets. A transactional coverage guard discards incomplete projected reports and invokes the complete source interpreter; costs and snapshots remain separate.

On Workerd 1.20261108.1, 66 exact comparisons now include 211 synthetic observations covering historical/current signatures, all Fetch Metadata parser cases, cache evidence/access states, network cases and device hints. Missing/stale projections, dimension invalidation, deletion, no-op rebuilds, current owner/referral policy and empty-filter all-time boundaries have dedicated tests. Three- and four-statement compact candidates still hit the engine expansion regression locally; preserve the proven five-part plan. The first local compact-object prototype also spends too much time repeatedly extracting named metrics; the final compact arrays and exact cohorts supersede it without a production fill.

### Final delivery gate

Apply only migration 0019. Capture the retained source ID window with a separately reviewed 100,000-read metadata ceiling. Rebuild every retained event in at-most-1,000-ID chunks; stop after unknown/failing costs, any batch above 200,000 reads, or cumulative **5,000,000 reads / 100,000 writes** for this separate complete-projection rebuild. The write ceiling includes its index entries; it replaces no earlier receipt or cost. Verify current-rule coverage at the fixed high-water mark, then reconcile a bounded tail after activation. Source updates invalidate facts; missing facts retain source fallback throughout delivery.

Activate cache namespace `2026-11-11.3`, join exact build/source/Worker, and repeat the existing seven-day gate with the same sub-second latency and 1,000,000-read review ceiling. Only if it passes, permit the default 30-day pair with the original sub-second / 2,000,000-read review gate. Preserve all failed intermediate gates and private raw captures.

[Final native controls](2026-11-11-report-facts-performance.json) preserve exact reports with 4,500 repeated, distinct and uniquely varying network records and 15,000 events over 29 dates. The distinct 4,500-event case falls from 878 ms to 42.9 ms; the wider 15,000-event case falls from 2,802 ms to 204.7 ms. These local values do not establish production latency. Final checks pass: 456 analytics tests, 445 site tests, workspace types, fresh-install/minimal-Worker portability, validation, isolated 45-post build and Worker dry-run.


## Compact five-part gate and referral projection follow-up

Source `b89d0caf6b6435e7211979f52808411cf02beda5`, native build `8060bcf0-8a37-4a54-a70c-49845d8f882e`, activates Worker `8f9ee22d-e637-4084-8ed1-a66d38d3fc28` at 100%. Its seven-day SJC MISS is **1.141 seconds**, with **472.7581 ms SQL / 530 ms binding wall time**, **247,310 reads / zero writes**. The byte-identical same-connection HIT is **152.0 ms**. The five-part projection is used without source fallback. Latency still fails, so no default 30-day fill is attempted.

The complete evidence-fact rebuild covers all **42,039** retained observations, IDs 2–42,040, at **1,376,909 reads / 84,078 derived/index writes**. Verification finds 42,039 current facts and zero missing at 84,078 reads / zero writes. The source window control costs 42,039 reads; the post-activation tail is empty (one read). Source observations remain unchanged. Migration 0019 applies alone (four commands, 2.41 ms); its ledger command does not expose complete row counters.

The intermediate narrow-projection measurement is now joined exactly: native build `20165191-475f-4c40-b765-9111854979a2`, source `8b644fac3f971b6ad0d9890be9c52278584a29f8` (a descendant of `f783c9ab`), serves Worker `0009b52d-2aed-4067-941e-ff43597f2822`. Native builds use pnpm 9.15.4 / Node 24.22.1; local checks use Node 24.14.1.

The revised ADR accepts separately versioned referral exclusion facts. The guarded ingestion projector computes the domain policy once; a policy-only rebuild uses its equivalent SQL evaluator. The final direct-table adapter needs two statements in one transaction, rather than repeatedly expanding recursive policy/population CTEs. One statement still fails the affected engine locally. The expanded 66 exact comparisons pass for both complete projection and source fallback. Tests also cover stale referral fingerprints, a concurrent host repair, current owner/publication policy and custom referral-policy fallback.

### Referral delivery gate

Apply only migration 0020 after final tests, types, portability, isolated build and Worker dry-run. Reuse the already verified frozen evidence-fact window through 42,040. Rebuild referral decisions in at-most-1,000-ID chunks, stopping after unknown/failed costs, any batch over 200,000 reads, or cumulative **1,000,000 reads / 50,000 writes** for this separate policy rebuild. Verify both current fingerprints and a present exclusion bit through that mark. Reconcile later source/fact rows after activation. No source repair, report refresh bypass or TTL extension is introduced.

The exact local CLI ID-gap fixture verifies only `(10,11]` is projected and the earlier row stays unassessed. Local Wrangler omits row meters, so both rebuild commands intentionally stop after the acknowledged first batch; native metering and complete remote meters remain required. Wrangler renders local SQL NULL as a string in JSON; direct `IS NULL` predicates verify storage without inferring from that representation.

Activate cache namespace `2026-11-11.4`. Preserve the original sub-second response target and seven-day / 30-day read-review ceilings, exact deployment attribution, same-connection reuse checks and stop conditions.


## Two-part production gate and covering-index follow-up

Source `d7b69c812749f792a98a8a4adbdd1de034790dc0`, build `6693c680-81e5-4617-95e3-6893b790c74f`, activates Worker `d209b240-3881-4569-95f0-653d5d32bedc` at 100%. Seven-day/all SJC passes: **689.5 ms MISS / 103.6 ms HIT**, **298.5944 ms SQL / 341 ms binding wall**, **157,313 reads / zero writes**. Both statements run once, current projections are used and bytes/calculation time are identical on reuse.

The permitted default 30-day/all SEA pair returns **1,133.0 ms MISS / 42.9 ms HIT**, **882.4282 ms SQL / 943 ms binding wall**, **483,205 reads / zero writes**. Its core statement costs 752.7619 ms / 447,364 reads. Read ceilings pass; the 30-day sub-second target fails. No further fills occur at that gate.

Migration 0020 applies alone (three commands, 1,600.96 ms; complete row counters unavailable). The policy-only rebuild through 42,040 costs **367,925 reads / 42,039 derived writes**. Both fingerprints cover all 42,039 source rows afterward (84,079 reads / zero writes). At activation, nine newer rows include four already maintained by the live projector and five missing only referral facts. The bounded evidence tail is a no-op (23 reads); policy reconciliation writes five rows at 2,385 reads. A repeat tail control finds nine/nine current facts, zero missing (18 reads). The pre-reconciliation receipt is preserved separately.

The final query-plan correction prefilters included core rows once, avoiding repeated automatic indexes on the same wide intermediate table. Migration 0021 adds a partial covering index for core dimensions; a conservative full-window coverage count uses the authoritative source time index and current fact covering index in one snapshot. The foreign-key/copied-dimension/invalidation lifecycle makes current facts a subset of source, so equal counts prove coverage. Missing facts outside the requested public filter can conservatively trigger source fallback. Native plans verify both covering range searches, and all 66 expanded exact comparisons still pass.

### Cover delivery gate

After final checks, create only the reviewed covering index through the metered remote query path: stop after unknown/failed cost or more than **100,000 reads / 50,000 writes** for that one creation. Apply migration 0021 idempotently to record it and run `PRAGMA optimize`. Verify the actual production first-statement plan uses covering range searches without executing a report. Retained observations/fact values remain unchanged; no interpretation rebuild is needed.

Activate namespace `2026-11-11.5` and repeat the same exact-source seven-day gate, then the default 30-day gate only after seven-day acceptance. Targets and review ceilings remain unchanged. Preserve all intermediate failed gates and the evidence archive.

[Final covering/prefilter controls](2026-11-11-covering-report-performance.json) preserve exact reports: the 15,000-event case takes 79.0 ms versus 2,810.6 ms for frozen source, and 4,500 distinct events take 29.4 ms versus 865.1 ms. The separate with/without-index comparison isolates the covering index; earlier controls also contain repeated automatic-index work. Final checks pass: 458 analytics tests, 445 site tests, types, fresh-schema/minimal-Worker portability, 66 native comparisons with explicit covering plans, isolated 45-post build and Worker dry-run.


## Covered delivery and optional-cache budgets

The core covering index is created through the metered command path at **90,182 reads / 42,028 index writes / 452.8327 ms SQL**, within its reviewed gate. Migration 0021 then records it idempotently and optimizes statistics (three commands, 71.88 ms; ledger row counters unavailable). Production `EXPLAIN QUERY PLAN` confirms source/fact covering range searches at **zero reads / zero writes**, without executing a report.

The Git push of `919127533558ea4783de32c3ce5fd0bb459c1a1f` has no Cloudflare build or GitHub check in the inspected delivery window, although builds are enabled on `main` with include path `*` and no excluded paths. No configuration repair is inferred. The checked commit is built locally with the existing public build variable, verified in home/stats HTML, and deployed through Wrangler with runtime variables preserved. Tagged Worker **`5faf1772-434d-4325-80be-ad744fc7fb40`** serves 100%; source tag `stats-cover-91912753` and deployment message identify the exact commit. Local Node is 24.14.1; this is a direct deployment, not a native-build acceptance claim.

A first LAX seven-day/all natural miss is **825.4 ms**, with a byte-identical **112.1-ms HIT**, but its initial tail has no usable calculation record. A later equivalent recovery includes one transport timeout (HTTP status zero, no new body) followed by a **12.1-second YYZ MISS** without a usable calculation trace. Curl's process exit reflects its last operation; per-operation status/exit must be checked. The retained preexisting body on the failed operation is explicitly not a returned response. Preserve all captures rather than treating this pair as acceptance.

Header-filtered tails capture an asset control but do not provide the required API events in this recovery. A supervised stats-log filter with a rejected-range, zero-D1 control succeeds. The marked BOS seven-day pair is **715.2 ms MISS / 130.3 ms HIT**, **171.6511 ms SQL / 288 ms binding wall**, **123,195 reads / zero writes**, exact tagged Worker, two statements once, current projections, byte-identical reuse. That gate passes.

The permitted DFW 30-day pair is **1,273.0 ms MISS / 110.4 ms HIT**, **471.8495 ms SQL / 823 ms binding wall**, **378,431 reads / zero writes**. The core statement is 315.2037 ms and evidence 156.6458 ms. This confirms reduced SQL work; the response target still misses and binding/transport time matters. Both report traces are exact-version, complete and write-free. The owned supervised streams stop after capture.

The final delivery correction budgets optional cache lookup at 250 ms and defers cache publication through `waitUntil`, with a 1,000-ms best-effort publication/coalescing budget. It adds separate stage telemetry and retains complete reports, existing expiry/key/privacy rules and strict primary-database behavior. This addresses an unbounded optional dependency visible in source; it does not assign an unsupported cause to the unmetered YYZ delay or claim control over external networking.

Checks pass: **448 site tests**, including never-settling lookup/publication, late-body release, background coalescing and capacity recovery; workspace types; fresh-schema/minimal-Worker portability; isolated 45-post public-variable build and Worker dry-run. SQL is unchanged from the previously checked 458 analytics tests / 66 native exact comparisons. Activate namespace `2026-11-11.6`, verify exact source/version, and use the supervised stats-log/rejected-range control before the final seven-day then 30-day pairs under the same latency/read targets.


### Final measurement boundary

The cache-budget source `8c4ff039` is directly activated as Worker `95e7dc4b-3f23-433c-b666-bf2ad347981d`; the native build of the same commit subsequently activates `bf267c7e-a166-46c9-bc97-a96cc2f2d65e` (build `bf0c9b86-4eaa-4c39-94c6-ee3fd2ed0eba`). Native source/build/version are joined from the dashboard log and deployment metadata.

On the direct release, seven-day server wall time is 726 ms, SQL 286.7812 ms, binding 617 ms, lookup 44 ms and background publication 43 ms; the client miss is 1,142.0 ms. Its HIT takes 121 ms server-side but 1,044.1 ms client-side. On the native release, seven-day server wall time is 684 ms, SQL 133.2275 ms, binding 431 ms, lookup 172 ms and background publication 45 ms; the client miss is 1,102.4 ms. Its HIT takes 21 ms server-side but 835.1 ms client-side. Each calculation reads 124,196 rows, writes zero, uses two statements once and requires no fallback; each repeat is byte-identical. Thus the original sub-second **client** target is not consistently met on these routes, including the warm controls, despite the measured server improvement.

Two asset-only network controls return 316.5 ms over IPv4 and 318.4 ms over IPv6, so a stable address-family explanation is not established. Do not choose an address family to conceal the slower captures. No database is touched by these controls.

Given the measured external transit/binding variation, permit one final native-release **30-day server-profile diagnostic** under the unchanged 2,000,000-read ceiling. Keep client latency, Worker wall time, database SQL/binding time and optional-cache operation timings separate, and keep the original client target flag explicit. This is a measurement-method refinement, not a claim that a missed target passed. No further source redesign is justified solely by latency outside the Worker; a fixed client route is needed before assigning such delay to application code.


## Delivered state and remaining latency limit

[Final production record](2026-11-11-production-performance.json) joins source **`8c4ff039d8cbe42f6d38d210f77d1ade2861306c`**, native build **`bf0c9b86-4eaa-4c39-94c6-ee3fd2ed0eba`**, and 100%-activated Worker **`bf267c7e-a166-46c9-bc97-a96cc2f2d65e`**. The native build uses Node 24.22.1 / pnpm 9.15.4 and builds 45 posts; local checks use pinned Node 24.14.1. The native release contains the same cache-budget source as the earlier directly tagged deployment; they are separate version receipts.

| Final native sample | 7-day/all, EWR | 30-day/all, DFW |
|---|---:|---:|
| Client MISS / HIT | 1,102.4 / 835.1 ms | 1,287.4 / 395.5 ms |
| Worker MISS wall, including background publication | 684 ms | 965 ms |
| Worker HIT wall | 21 ms | 19 ms |
| SQL / binding wall | 133.2275 / 431 ms | 612.4931 / 888 ms |
| D1 reads / writes | 124,196 / 0 | 378,657 / 0 |
| Lookup / background publication | 172 / 45 ms | 15 / 31 ms |

Each marked pair has one complete two-statement calculation, one byte-identical HIT on the same connection, unchanged calculation/expiry time, complete row meters, one returned attempt per statement, no source fallback and no exceptions. Rejected-range controls demonstrate the supervised stats-log stream before each pair without database work. Private Ray/marker correlation verifies the exact requests. All owned live-tail processes are stopped.

The read model, index-only coverage, prefiltered charts and bounded optional cache ports are delivered. Counts, historical interpretations, exact daily-client sets, live owner/publication policies, source fallback and the one-hour/midnight freshness cap remain intact. No retained source values were changed by the rebuilds. The earlier availability incident and Google-referrer investigations are not reopened.

The original **sub-second client response target remains a measured limit**, not a passed gate. Server wall time is below one second in both final samples, but neither final cold client sample meets it; the warm controls also contain substantial outside-Worker delay. No universal region/network SLA or specific provider cause is established. Wider live filters/ranges are unmeasured; native differential checks cover them. Projection failure can be slower through the correct complete-source fallback.

The next bounded action, if a strict client-latency target is required, is a fixed-route browser/network and binding-latency profile using these saved stage receipts. Do not repeat a production filter grid or add infrastructure solely to explain delay outside the measured application stages. Further rollups, replication or placement changes remain proposals requiring their own consistency/privacy and cost evidence.

Local acceptance is **458 analytics tests, 448 site tests**, workspace typechecks, validation, fresh-schema/minimal-Worker portability, 66 exact native comparisons over 211 mixed events, isolated 45-post build and Worker dry-run. Meaningful failure tests cover source invalidation, missing/stale facts, policy changes, acknowledged-write preservation, hanging lookup/publication, late-body release, coalescing and capacity recovery. Raw captures and private headers remain in the ignored durable operations archive; its manifest commitment is recorded in the production JSON.

The frozen private archive contains **608 files / 4,651,371 bytes**; manifest SHA-256 **`602c498e6b90fdb5bdc46d431baefda043076a305602b0353f0e7abcc457ea1f`**. Every file hash/size and private mode is verified before handoff. Wrangler debug logs, credentials/dependencies and local D1 state are excluded. The original code reference, native binary/lock hashes, complete checks, build/source/version joins, rebuild cursors, successful and failed transport captures, and final marked traces are retained privately.
