# First business work and repeated process readiness

Accepted November 1, 2026: two guarded cold traces, six fresh processes per mode/framework, five one-second client windows per process. **180 timed windows and 7,043,742 fully checked responses**. A separate readiness control used thirty fresh starts per mode/framework, **180 additional processes**. The guard completed normally with 188 running snapshots and no detected high-CPU activity from the two known competing study paths.

## Readiness is separate from the first business call

Thirty-start control, medians in milliseconds:

| Health readiness | JIT | Bytecode | Native AOT |
| --- | ---: | ---: | ---: |
| Express | 27.1 | 17.2 | 13.8 |
| Fastify | 37.8 | 18.0 | 13.6 |

Express ranges were 26.5–28.3 / 16.9–17.5 / 13.3–15.2 ms; Fastify ranges were 37.4–39.9 / 17.5–18.7 / 13.3–15.0 ms. These are fresh processes with warm filesystem caches, not first launches of new files or an uncached machine. Readiness ends at the first checked `/health` response. Opening SQLite and preparing statements happen during startup; seeding happens outside it.

The earlier excluded overlapping batches had reversed native readiness medians. The guarded thirty-start control does not reproduce that reversal. The difference does not identify a specific OS, cache, scheduling or thermal cause.

In the separate six-process cold trace, the **first checked business call after health readiness** took these medians:

| First checked API call, ms | JIT | Bytecode | Native AOT |
| --- | ---: | ---: | ---: |
| Express | 0.803 | 0.678 | 0.560 |
| Fastify | 0.891 | 0.784 | 0.721 |

This measurement includes a new loopback connection, receiving the full body, Python's JSON validation and closing the connection. It is not server-only latency or a production p99. Health already exercises common HTTP/framework paths; this is first business-route work after readiness, not the first HTTP request of the process. Do not add this number to readiness to claim total process-to-business time: bookkeeping occurs between those observations.

## The first load window does not promise the highest throughput

Median requests/s across six runs. Windows are measured after the first checked business call:

| App / mode | First 1 s window | Fifth 1 s window |
| --- | ---: | ---: |
| Express JIT | 38,013 | 38,796 |
| Express bytecode | 37,999 | 38,639 |
| Express AOT | 39,664 | 39,799 |
| Fastify JIT | 39,324 | 40,000 |
| Fastify bytecode | 39,358 | 39,770 |
| Fastify AOT | 38,179 | 38,129 |

Fastify AOT's faster checked first call coexists with a lower first-window request rate than JIT. Native output removes JIT compilation, but that alone does not establish the fastest request rate. The small window-to-window changes do not isolate JIT, socket, allocation or cache effects. The full five windows, spread, memory, CPU and gaps remain in the [summary](results/cold-startup-summary.json).

Each window starts a new checked C client at eight connections. Client dispatch and report handling leave recorded gaps, so this is not a continuous subsecond chart from process launch. The accepted runner anchors window offsets at completion of the first business check; earlier excluded captures used its start. This correction changes the time-axis label, not the accepted elapsed request windows.

## Evidence and limits

[Express cold observations](results/express-cold-guarded.json.gz), [Fastify cold observations](results/fastify-cold-guarded.json.gz), [readiness-control observations](results/startup-control-guarded.json.gz), [guard conditions](results/cold-startup-conditions.json), [integrity manifest](results/cold-startup-manifest.json). `audit-cold-startup.py` recomputes all summary statistics and checks response hashes, histogram/request counts, CPU arithmetic, source/helper identities, mode positions, original warm-binary capture commitments and guard completion.

The same pinned macOS arm64 preview, sources, dependencies and read-only cached SQLite data apply. Clients share the host, ordinary or short-lived work may evade the bounded guard, and no resource quota or thermal guarantee is imposed. These short traces do not establish serverless cost, uncached deployment time, long-term behavior or results on another OS.
