# Express/SQLite: lower memory, with a smaller CPU change

Accepted November 1, 2026: eighteen warmed windows, six fresh processes per mode, **5,615,327 responses checked against the complete expected status/body**. The guarded Express phase completed before a competing process appeared during the following cold test. Only this completed phase is accepted here.

| Same Express app | Bun JIT | Bun bytecode | Bun native AOT |
| --- | ---: | ---: | ---: |
| Requests/s, median | 38,922 | 38,771 | 39,708 |
| Requests/s, min–max | 37,808–39,000 | 38,004–38,949 | 39,146–39,746 |
| App CPU, microseconds/request | 26.15 | 26.27 | 25.15 |
| End app physical footprint, MB | 39.86 | 38.47 | 16.87 |

AOT's median footprint was **57.7% lower** than JIT; CPU/request was **3.8% lower**, with **2.0% more requests**. These are ratios of cell medians, not a claim that every request improved by those percentages. Six runs on one host support a small observed speed/CPU change and a much larger memory change on this fixture. They do not certify production capacity or a general compiler speedup.

The app makes four prepared `node:sqlite` reads against a preseeded, read-only file and returns exactly 2,215 JSON bytes. Eight persistent connections, three seconds warmup, eight seconds measured per fresh process; all six mode-order permutations were used. The client shares the host. Health, success and three rejection paths were checked before load. No extra TypeScript annotations or framework rewrite were added.

Compiler: `1.4.4-canary.1+3f3a9ff87`, executable SHA-256 `cbecab3f05a0c8bc11ea0164e5868db0b5da12067fdb13dfcacfc9bf87b68b6a`; Express 5.3.0. macOS 27.0.1 arm64, ten logical CPUs. All modes use the same compiler revision, source, data and dependencies. [Inputs/hashes](results/express-warm-inputs.json), [full summary](results/express-warm-summary.json), [numeric observations](results/express-warm-guarded.json.gz), [integrity manifest](results/express-warm-manifest.json).

Memory is macOS app physical footprint in decimal MB, including in-process SQLite. It is not heap size or uniquely occupied machine RAM. The end measurement follows the warmed window; sampled peaks and RSS remain separate in the capture. CPU/request is measured app CPU divided by checked responses. It does not measure electricity or hosting cost. Reads repeatedly select the same cached user. No writes, remote DB, resource quota, random user distribution or long soak were tested.

## Why this phase is accepted separately

The guard waited for sixty quiet seconds. The [phase conditions](results/express-warm-conditions.json) retain 196 one-second snapshots without a detected >10% CPU process from either known competing study path, excluding our descendants. The first later conflict was at 17:17:26 UTC, after this phase ended at 17:17:19 UTC. At that point the guard interrupted our cold test, leaving this completed phase intact. Unknown or short-lived host activity can be missed; this is not proof of an idle or unthrottled Mac.

The earlier overlapping captures stay excluded, even where they appear similar. No individual slow run was removed from this accepted phase. The first checked launch of each newly built file was recorded separately (about 861 / 811 / 458 ms for JIT / bytecode / AOT). Repeated readiness medians in this batch were 27.3 / 17.1 / 14.8 ms. These are readiness at `/health`, before the business request; the separately accepted [cold/startup controls](08-cold-startup-results.md) examine those other boundaries.

[Jarred's report](https://x.com/jarredsumner/status/2116679973448945762) describes a different app and unspecified measurement conditions. This result supports trying the same comparison on an Express API. It neither verifies his exact 40%/14% figures nor explains the difference between them and this fixture.

Recheck this phase against its private capture with `audit-express-warm.py`; that audit recomputes the summary, checks all response counts/histograms, CPU/request arithmetic, mode positions, source/database/binary hashes and the guard's phase boundary. It does not independently reproduce execution. The [study plan](00-plan.md) links the completed Fastify and serializer controls.
