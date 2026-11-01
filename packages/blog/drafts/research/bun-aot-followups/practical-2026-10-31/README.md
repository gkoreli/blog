# Does lower RAM buy more useful work?

**Measured October 31 local / November 1 UTC.** The preceding [application study](../validation-2026-10-31/README.md) already established lower app memory and slower database routes in single-process native AOT. This follow-up asks what happens when you actually run more copies, and gives readers a small tool for their own app. [Plan and acceptance](00-plan.md).

## What changes the decision

**Two native copies handled 52% more checked requests than one JIT copy, using 49 rather than 55 MB of app memory. They also used 2.6 rather than 1.4 CPU cores; PostgreSQL used about three times as much CPU.** This is useful when spare CPU is available. It does not establish a cheaper deployment.

The final comparison held both twelve DB connections and four local request-sending processes steady, with 32 HTTP connections. Medians of four five-second windows on the JWT + cached-user route:

| Mode | App copies | Requests/s | End app MB | Sampled peak app MB | App CPU cores | DB CPU cores |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| JIT | 1 | 44,166 | 55.2 | 55.2 | 1.37 | 0.40 |
| JIT | 2 | 71,214 | 102.2 | 102.2 | 2.69 | 1.38 |
| JIT | 4 | 80,807 | 186.3 | 186.3 | 4.39 | 1.63 |
| Native | 1 | 37,994 | 28.3 | 28.3 | 1.25 | 0.34 |
| Native | 2 | 67,244 | 49.1 | 49.1 | 2.60 | 1.20 |
| Native | 4 | 75,355 | 86.9 | 86.9 | 4.25 | 1.50 |

The two-native/one-JIT request ratios were 1.49–1.54 within the four blocks. Four native copies improved on two by only 12%, while using 77% more app memory and 64% more app CPU. More processes have diminishing returns. Each native pool handled fewer requests than the same-count JIT pool here.

The separate five-minute checks kept app and DB pools alive, with clients reconnecting between five one-minute segments. These use one/two sender processes, so keep them separate from the matched short comparison:

| Run order | Mode / copies | Requests/s across five minutes | End app MB | Maximum sampled app MB | Sum of lifetime app peaks MB |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | JIT / 1 | 40,630 | 61.4 | 62.0 | 68.0 |
| 2 | Native / 2 | 63,713 | 49.4 | 49.4 | 49.5 |
| 3 | Native / 2 | 66,226 | 48.4 | 48.7 | 49.0 |
| 4 | JIT / 1 | 43,905 | 56.3 | 58.3 | 70.6 |

Lower app memory persisted across these windows. A sum of individual lifetime peaks need not occur simultaneously. Neither this nor sampled footprints establishes a hard packing limit, unique machine RAM or permanent memory use.

All four batches retain **88 pools, 140 timed route windows and 172,505,295 checked responses, with zero response failures**. [Summary](results/summary.json) keeps the main, fixed-DB, sustained and matched batches separate. No CPU or RAM quota was imposed. These are our controlled measurements, not a maintainer endorsement or independent operator adoption.

## Inputs and method

Bun `1.4.4-canary.1+da867c60b`, official October 29 macOS arm64 canary. Same M5, 10 CPUs and 24 GiB, with the previously pinned upstream API revision `d58f3d10daa53f8e6c7b085fc3b2b2d9c38b8056`, Elysia beta.12, Drizzle, Bun SQL and PostgreSQL 17.10. [Original pinned inputs and packaging adjustment](../validation-2026-10-31/README.md#framework-and-api).

The ordinary packaged API uses the earlier explicit TypeBox registration; route handlers and seeded data are unchanged. The main trial verifies every reused executable hash before measurement. Bytecode remains a distinct ESM/JIT mode. None of this compares Rust or proves language equivalence.

- **Main:** 3 modes × 1/2/4 app copies × 4 blocks, two routes, 3 seconds warmup and 10 measured seconds. Each process retains its original maximum of 10 DB connections.
- **Fixed DB limit:** JIT/native × 1/2/4 copies × 4 blocks, JWT + read only, 3 seconds warmup and 8 measured seconds. The only source overlay changes the existing `max: 10` to `max: Number(process.env.DB_POOL_MAX ?? 10)` in both driver configurations; 12/6/3 per copy keeps the configured total at 12. The original file is restored after building. The actual connection count is checked before load.
- **Sustained:** one JIT copy / two native copies under that same total DB limit, two blocks in JIT/native/native/JIT order, five seconds warmup, then five successive 60-second load windows on the same app processes. Sampling is one second here; shorter trials sample every 250 ms. The client reconnects between minutes, while app and database pools stay alive; the short gaps and each minute remain visible.

- **Matched clients (primary short comparison):** JIT/native × 1/2/4 copies × 4 blocks, twelve total DB connections, four C request-sending processes in every cell, eight HTTP connections each. Two seconds warmup and five measured seconds. Endpoint lists repeat ports when fewer than four app processes run; app PIDs are deduplicated for resource accounting. This replaced an unrun one-app diagnostic before measurement.

Every trial used **32 total persistent HTTP connections**, evenly split across the app ports, no front proxy, no pipelining. Each app responds correctly before timing. The same checked C client verifies the status and complete body of every timed response. Requests hit the same cached user row (4242); echo does no database work. Fixed query/data/cache conditions are deliberate and do not represent random reads, large data or a remote database.

Main, fixed-DB and sustained batches use one client process per app copy. The final matched batch holds it at four. Primary aggregate throughput is total checked responses divided by the outer dispatch-to-last-client interval; individual client elapsed times and launch skew remain available. Cell counts are equal and positions rotate/reverse; four blocks do not constitute a complete nine-position Latin square. Route order alternates. Every retained trial, including slow trials, contributes to the summary.

Memory is the sum of app processes' macOS physical footprints, in decimal MB. RSS and lifetime peaks remain separate. Process sums are not uniquely occupied machine RAM. PostgreSQL process accounting is separate and may include shared pages; do not add it into a purported unique-RAM total. A route's retained memory can include earlier route activity. CPU uses the checked Mach timebase; 100% means one CPU core. Database CPU and persistent foreign-process CPU are recorded separately. The latter misses processes that start and exit between snapshots.

An AC-power observation was captured during the main batch, not throughout it. Thermal/performance status was unavailable from `pmset`; the study cannot claim no throttling. Ordinary editing, short Python syntax checks and bounded condition reads continued; no Bun/C/site compilation or additional load run overlapped performance trials.

## Tool acceptance

The released source passed seven integration gates, twelve fresh-process example runs across four modes, and eighteen real-API runs with 36 timed route windows. Deliberately bad JSON types, changed response bodies, startup crashes, occupied ports, syntax failures and native type-check failure are retained as expected failures. The API and example reports retain their own timings; they are functional acceptance of the tool, not extra pool-study trials.

A previous self-test attempt imposed a one-second launch deadline and rejected a valid fresh executable. The suite now uses the tool’s ten-second default; the final accepted run passed. First checked launches are recorded separately from repeated fresh-process starts: the example’s first observations took 283–670 ms, subsequent medians about 10–11 ms. The cause was not isolated.

## Run it

Start with the [earlier preparation guide](../validation-2026-10-31/reproduce.md) for the pinned source/compiler/database. Use fresh output directories; never overwrite accepted captures. The database port is an explicit start option, not a saved default:

```sh
export NEW_OUT="$(mktemp -d /tmp/bun-aot-pools-XXXXXX)"
"$LAB_DIR/postgres/bin/pg_ctl" -D "$LAB_DIR/pgdata" -l "$NEW_OUT/postgres.log" -o '-h 127.0.0.1 -p 55439' -w start
python3 pool-study.py --root "$LAB_DIR" --out "$NEW_OUT/main" --blocks 4 --warmup 3 --seconds 10
python3 build-pool-control.py --root "$LAB_DIR" --out "$NEW_OUT/control-builds"
python3 pool-fixed-connections.py --root "$LAB_DIR" --binary-dir "$NEW_OUT/control-builds" --builds "$NEW_OUT/control-builds/builds.json" --out "$NEW_OUT/fixed" --pool-total 12 --blocks 4 --warmup 3 --seconds 8
python3 pool-sustained.py --root "$LAB_DIR" --binary-dir "$NEW_OUT/control-builds" --builds "$NEW_OUT/control-builds/builds.json" --out "$NEW_OUT/sustained" --pool-total 12 --cells jit:1,native:2 --blocks 2 --warmup 5 --seconds 60 --segments 5 --sample-seconds 1
python3 matched-client-pools.py --root "$LAB_DIR" --binary-dir "$NEW_OUT/control-builds" --builds "$NEW_OUT/control-builds/builds.json" --out "$NEW_OUT/matched-clients" --pool-total 12 --blocks 4 --warmup 2 --seconds 5
python3 summarize-pools.py --main "$NEW_OUT/main" --fixed "$NEW_OUT/fixed" --sustained "$NEW_OUT/sustained" --matched "$NEW_OUT/matched-clients" --out "$NEW_OUT/accepted"
```

The initial preflight restarted this owned cluster on its default port and failed before any timed window. It was stopped and restarted on the declared port; the corrected nine-cell pilot passed. Both remain outside the main results. The public setup note retains the failure; raw command logs stay private.

## Reader comparison tool

[Source and instructions](../../../../tools/bun-aot-check/README.md). It builds JIT, bytecode, native and optional trimmed-native executables, checks complete expected responses, and measures startup, file bytes, warmed request speed, memory and CPU. A prebuilt-executable mode keeps framework plugins and caller-specific packaging under the caller's control. It is a local comparison aid, not a universal winner picker.

macOS is the exercised host. The Linux accounting path is experimental until an actual Linux run is captured. Fixed HTTP/1.1 responses with Content-Length, stable test data and one server process per mode are supported. Streaming, child-process apps, dynamic timestamps and remote capacity tests need another setup. The reports keep failures, sample spread, hashes and measurement units. The tool's request/response temporary files are removed; app/build logs stay in its private output subdirectory.

All four pool batches and final tool acceptance passed; publication acceptance is recorded in the [plan](00-plan.md). No author supplied a new case in the two scoped email conversations or the inspected public reply at the check; no new promotional message was sent. An operator using the supplied tool successfully is a future adoption outcome; this study can already establish its own concrete correctness and comparison behavior.

## Inspect the saved data without rerunning the apps

The final public numeric captures are losslessly gzip-compressed to keep the source review usable. `summary.json` and the tool reports are ordinary JSON/Markdown. The manifest records both stored-file and original uncompressed hashes. No samples are dropped by compression; raw command/app/mail logs are not included.

```sh
python3 verify-evidence.py
```

That checks file integrity, the expected trials and route windows, actual connection counts, status/body-check counters and the tool's accepted/failing gates. It does not prove independent replication or establish why the host varied.
