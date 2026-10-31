# Bun AOT: validation and real-server experiments

**Experiments complete and audited, October 31.** Validator, framework, database, driver, bytecode, one-minute memory, concurrency and relocated-packaging checks are complete. The article's publication receipt belongs in the [worklist](00-plan.md). No maintainer has reviewed these tests; no independent operator replication is established.

This extends the [October 27 article](https://gkoreli.com/oss-radar-08-bun-aot) and the [October 28 CLI experiments](../../polkadot-bun-aot/03-optimization-experiments.md). The older measurements retain their original compiler, source and conditions. [Questions and acceptance](00-plan.md) · [claim audit](01-claim-audit.md) · [reproduction guide](reproduce.md).

## Findings from completed batches

- **Prebuilding helps native validation, with a substantial remaining gap.** After restoring returned data and error fields, one million valid nested checks took 263.5 ms under the runtime's native-AOT default and 49.5 ms with a prebuilt module plus adapter. Runtime JIT took 34.0 ms; prebuilt JIT with the same adapter took 33.2 ms. This is about a 5.3× improvement within native AOT, while remaining about 1.5× slower than runtime JIT.
- **Invalid inputs change the tradeoff.** With 25% invalid inputs and returned data/error paths consumed, native prebuilt-plus-adapter took 76.8 ms versus 39.1 ms for runtime JIT. Native runtime took 367.0 ms; adapted prebuilt JIT took 50.5 ms. These are synthetic validation loops, not HTTP request speed or a Zod migration benchmark.
- **The raw module does less work.** The initial 360-process comparison checked verdicts, mutations and normalized error descriptors. Expanded checks found that the raw emitter also omits the successful `data` field and enriches errors even when runtime `richErrors` is false. Its 36.0 ms raw native result cannot be presented as matching the full runtime API at 35.3 ms JIT. The [original numeric observations](results/validator/summary.json) remain available as a different-API comparison.
- **Behavior gates are specific.** All six expanded raw configurations agree with 133 hand-labeled valid/invalid answers. The schema-specific adapter additionally matches full serialized results, input mutation and successful-data identity on all 103 selected cases of the two timed schemas under JIT/native. The untimed defaults schema still differs in one multiple-error ordering case; the raw module also omits configured defaults. This is not certification of a general drop-in replacement, nested defaults, coercion, custom formats, the JSON Schema specification or ata's whole suite.
- The library's normal package import selects its own interpreted validator under native Bun AOT. Explicit `ENGINE=auto` forces its code-generation path. The runner records the actual engine; silently bypassing the package entry compares another configuration.
- All six framework executables pass the selected body/status/header/file checks. Elysia's original fixture ignores a Range request in every mode; Hono honors it in both modes. This is an existing difference between fixtures, not a native-AOT regression.
- The API's source execution and four packaged modes agree on the selected valid/invalid/auth/database/CPU cases. The original plain JIT and native executables both failed to resolve a dynamically loaded TypeBox dependency. An explicit [`setupTypebox` registration](wire-typebox.ts) fixes packaging while preserving runtime route construction. Elysia's full build plugin remains a separate factor. The API source, route handlers, driver and seeded data are unchanged.
- Twenty-four fresh starts per mode gave median first healthy response times of 30.1 ms for the static-wired API JIT executable and 11.6 ms for its native counterpart. The Elysia plugin versions measured 29.2 and 11.7 ms. A healthy response does not open a database connection or establish warmed performance.
- The current canary builds and runs the original CommonJS/declaration-file fixture correctly in both JIT/native modes (`42`), whereas the October 27 preview crashed. Issue 47044 remained open at the fresh check, so this establishes that the minimal fixture now passes, not that every related case is fixed.

The retained server data cover **13 batches, 312 startup observations, 340 timed route windows and 360,095,582 checked timed HTTP responses**, with zero response failures. The raw validator batch has 360 measured processes; the matching-output batch has another 192. The [summary](results/summary.json) and [hashed evidence manifest](results/evidence-manifest.json) distinguish these counts. Warmups and verification-only requests are not added to the timed-response total.

## Warmed servers and controls

The main pass used eight persistent connections, two seconds of warmup and eight measured seconds per route. Values below are medians of six balanced framework blocks or eight API blocks. Memory means end-of-route application physical footprint in decimal MB; PostgreSQL is excluded. Routes share a process, so earlier routes can affect retained memory.

| Fixture / route | JIT requests/s | Native requests/s | JIT MB | Native MB |
| --- | ---: | ---: | ---: | ---: |
| Elysia runtime / dynamic | 220,986 | 209,207 | 24.7 | 16.8 |
| Elysia runtime / JSON | 199,972 | 190,953 | 24.9 | 17.9 |
| Elysia plugin / dynamic | 221,096 | 217,291 | 24.2 | 16.0 |
| Elysia plugin / JSON | 198,644 | 203,038 | 24.2 | 17.5 |
| Hono / dynamic | 212,436 | 217,140 | 23.7 | 16.0 |
| Hono / JSON | 184,292 | 196,917 | 24.4 | 16.9 |
| API wired / health | 228,533 | 226,907 | 48.4 | 23.4 |
| API wired / validated echo | 193,564 | 159,907 | 35.7 | 20.6 |
| API wired / user read | 52,656 | 41,416 | 51.4 | 22.3 |
| API wired / JWT + read | 41,864 | 35,141 | 49.6 | 21.9 |
| API plugin / health | 228,363 | 228,106 | 45.3 | 24.0 |
| API plugin / validated echo | 191,926 | 187,412 | 38.7 | 20.7 |
| API plugin / user read | 52,703 | 42,462 | 45.3 | 22.9 |
| API plugin / JWT + read | 41,697 | 36,741 | 44.9 | 22.5 |

Framework native throughput ranged from about 5% lower to 7% higher; small changes overlap run variation. The API's native database routes served 12–21% fewer requests, across runtime and plugin builds, despite roughly halving application memory. Prebuilding routes recovered most validated-echo throughput. It did not eliminate the database-route gap. [Main framework data](results/framework/load.json) · [main API data](results/api/load.json).

**Bytecode is a useful alternative here.** In a separate three-way batch, 24 fresh starts per mode measured 29.20 ms JIT, 14.79 ms bytecode and 11.32 ms native. Six warmed-load blocks gave 188,911 / 191,278 / 159,481 requests/s on validated echo and 41,299 / 41,393 / 35,380 on JWT + read, respectively. Bytecode retained JIT-like throughput; it did not achieve native's memory reduction. The corresponding executable sizes were 122,528,738 / 126,788,834 / 64,720,226 bytes. `--bytecode --format=esm` handles this app's top-level `await`; the initial default-format failure is retained as a configuration failure. [Startup](results/bytecode/startup.json) · [load](results/bytecode/load.json) · [build options](results/expanded-checks/bytecode-esm-build.json).

**Changing the driver did not remove the native gap.** Four balanced blocks per cell compared Bun SQL with postgres.js, keeping the same app and data. Bun SQL user reads measured 52,893 JIT versus 41,962 native requests/s; postgres.js measured 36,683 versus 32,081. JWT + read measured 41,928 versus 35,391 with Bun SQL and 29,754 versus 27,400 with postgres.js. The smaller percentage gap with postgres.js comes with lower absolute throughput. This does not isolate a cause inside the driver, ORM or compiler. [Driver data](results/driver/load.json).

**The memory benefit lasted through a minute of requests.** Two fresh processes per JIT/native mode ran for 60 measured seconds after five seconds of warmup. Elysia JSON ended at 22.3–23.3 MB JIT versus 15.3–15.6 MB native, serving about 199,289 versus 191,274 requests/s. The API's JWT + read ended at 46.6–48.5 MB versus 21.9–22.0 MB, serving about 41,502 versus 35,198 requests/s. This is a minute-long check, not a production soak or proof of permanent savings. [Framework](results/framework/soak.json) · [API](results/api/soak.json).

**The decision was not unique to eight connections.** Four shorter blocks at one and 32 connections retained lower native memory without a universal warmed speedup. For API JWT + read, JIT/native medians were 15,566/14,379 requests/s at one connection and 44,528/38,116 at 32. Elysia JSON measured 61,728/59,223 and 199,740/190,572 respectively. All four batches remain separate in the [summary](results/summary.json), with their raw min/max and checked-response counts. A same-host closed-loop client cannot establish independent server capacity.

**Seven relocated API configurations passed.** JIT, native, Elysia-plugin and bytecode modes, including both drivers where selected, ran from a separate directory with the build source and its `node_modules` temporarily hidden and a system-only PATH. Each passed the selected application checks against the study's PostgreSQL server. This checks dependency packaging; it does not make PostgreSQL part of the executable or promise every optional import works. [Packaging results](results/packaging.json). The framework video remains a 14.15 MB external asset and is excluded from executable sizes.

## Design

The [plan](00-plan.md) pins all public source revisions and the compiler ZIP. The official October 29 macOS arm64 canary identifies as `1.4.4-canary.1+da867c60b`; ZIP SHA-256 `67ede5394a7da4a8b1a1eb0788b72325f480bc956cb1155b6be962919c9aa581`. This is separate from the original article's `06888611e` and the CLI follow-up's `73b53109f`.

Host: Apple M5, 10 CPUs, 24 GiB, macOS arm64, AC power attached. It is a shared laptop. `pmset -g therm` could not expose thermal/performance status; no temperature or absence-of-throttling claim is supported. Balanced order, same-mode spread measurements and a longer repeated comparison address some host variation, without proving isolated production capacity.

### Validator

**Use the matching-output batch for the API comparison.** [`validator/measure-contract.py`](validator/measure-contract.py) checks the full selected result values, returned-data identity and input mutation before timing. Its [adapter](validator/adapted.mjs) restores `data`, the selected legacy error fields and top-level defaults for these fixtures. It is deliberately limited; the untimed defaults error-order difference is retained. The two timed schemas have no defaults, and all their 103 hand-labeled cases match exactly across four configurations.

The new batch has **192 measured processes**: four configurations × two schemas × valid/mixed traffic × twelve balanced rotating/reversed blocks, after two warmup processes per cell. Each process warms 200,000 checks and measures one million over 256 varying inputs. The loop consumes `result.data.id` on success and error counts/paths on failure; an independent Python oracle checks both checksums. This avoids treating a skipped return value or skipped error work as an optimization. [Matching-output summary](results/validator-contract/summary.json) · [behavior checks](results/validator-contract/parity.json).

**The earlier raw-module batch remains separate.** It is useful for code-generation/engine controls and callers who need only a verdict, with the result-shape difference made explicit. In its valid-only nested case, raw JIT prebuilding appeared to reduce peak physical footprint from 25.3 to 12.2 MB; matching-output JIT values are 23.3 and 22.7 MB. The corresponding matching-output native values are 15.8 and 15.1 MB. Giving the compiler or the build step credit for the whole earlier memory reduction would conflate different returned work.

[`validator/measure.py`](validator/measure.py) builds runtime and standalone JIT/native/trim executables, records size and hashes, checks behavior, and runs six timed configurations in balanced rotating/reversed order. Every mode receives two untimed fresh-process warmups and twelve measured processes per workload: one first-check case and four warmed-loop cases, **360 measured processes** total. Hot valid and 25%-invalid loops use 256 varying inputs; checksums and consumed errors prevent accepting a skipped validator. The standalone schemas derive from ata's pinned benchmark; they are small synthetic payloads, not application traces.

`hot_ms` excludes imports, validator construction and 200,000 warmup checks. `first_ms` includes construction and the first check, after static imports. `elapsed_ms` covers the entire process, warmup and exit. The zero-iteration case still constructs the 256-input fixture corpus; its whole-process elapsed time is not a minimal validator startup measurement. macOS `/usr/bin/time -l` supplies lifetime peak RSS and physical footprint. The native addon is disabled with `ATA_NO_NATIVE=1`, and the tested `validate` API uses the JS validator path. No input JSON parsing or network request is timed in this loop.

### Framework and API

[`prepare-servers.py`](prepare-servers.py) wraps the pinned public fixtures. Frameworks use Elysia 2.0.0-beta.29 and Hono 4.13.13. The API retains its locked Elysia 2.0.0-beta.12, Drizzle 0.45.2, jose 6.2.11, TypeBox 1.3.26 and Bun SQL pool limit of ten. Framework and API Elysia versions differ deliberately because the two pinned studies differ; do not pool their results as one Elysia-version comparison.

The factors are regular Bun versus native Bun AOT, and ordinary runtime route construction versus Elysia's own build plugin. The API's ordinary packaged baseline requires the static dependency registration described above; this is a documented packaging adjustment, not an unchanged command. It does not precompile routes or validators.

PostgreSQL 17.10 was built from the official source into temporary storage, without ICU, readline or zlib. A new cluster binds only loopback port 55439. Upstream's deterministic seed is changed only to that host/port: 50,000 users and 200,000 orders. The parity tests add a small known number of orders; timed routes only read the database. No existing database or service is used.

The read cases repeatedly request the same seeded user (4242); the paged-list correctness case reads IDs 121–140. This is a hot-row test with warm database/filesystem caches. It does not measure random-user access, a database larger than RAM, cold storage, transaction contention or a remote database. Dataset row count alone must not imply those workloads.

[`server-study.py`](server-study.py) verifies responses before timing. Its startup clock starts before spawning and ends after receiving the expected healthy response. Warm throughput excludes startup. The [C HTTP client](http-load.c) uses fixed concurrent persistent HTTP/1.1 connections, no pipelining, and checks the expected status and every response byte before counting it. HTTP errors, connection failures, truncation and incorrect bodies fail a trial. This is a closed-loop same-host client; the results are not maximum server capacity or open-loop latency under an independent arrival rate.

Latency histograms have eight buckets per doubling of microseconds; reported percentiles are bucket upper bounds, not exact values. Server RSS and physical footprint are sampled every 200 ms through macOS `proc_pid_rusage` v4; lifetime peak physical footprint is also recorded. Per-route lifetime peaks can include earlier routes in the same process, so they cannot attribute all retained memory to that route. The API's PostgreSQL process memory is separate from server memory.

The final load runner also records aggregate CPU consumed by foreign persistent processes, excluding the benchmark runner/server and temporary PostgreSQL process tree. It cannot see a process that starts and exits between the two snapshots. The earlier API noise-control field accidentally included PostgreSQL and is not usable as a foreign-workload estimate; throughput and body checks are unaffected. No observation is silently discarded.

The host's `proc_pid_rusage` CPU counters require the Mach timebase conversion, **125/3 nanoseconds per tick**. A passive check of a running test server observed 12,212,139 ticks while `ps` accumulated 0.51 CPU seconds; conversion gives 0.509 seconds. Early captures named these raw fields `user_ns`/`system_ns` incorrectly; later captures use `user_ticks`/`system_ticks`. The summarizer converts both, preserves raw values and does not treat them as nanoseconds. Monotonic elapsed time, memory and response checks are unaffected.

The byte-identical [framework main runner](runners/framework-main.py) and [API main runner](runners/api-main.py) match their batches' recorded SHA-256 values. The current runner adds optional controls and corrects the clock-field labels; the main protocol is unchanged. The older names are retained in those historical captures rather than rewriting the observations.

## Reproduction status

Fixtures, runners, pinned lockfiles, the [preparation guide](reproduce.md), numeric observations and final summaries are saved here. The summarizer accepted all declared batches and checked run positions, count/histogram agreement, zero response failures and memory consistency. Original runner hashes match the main-batch metadata; the manifest checks the retained result bytes. Downloaded code, executables, raw command logs and operational captures stay outside Git. No performance process remains running, and the study's isolated PostgreSQL cluster was stopped after packaging checks.

The guide assembles this operator's executed steps. It has not been independently rerun end to end on a fresh machine. The [claim audit](01-claim-audit.md) states the supported decisions and limits; publication and outreach are recorded separately in the [worklist](00-plan.md).
