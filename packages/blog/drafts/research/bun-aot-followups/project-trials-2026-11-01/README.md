# Bun AOT in Keryx and next-bun-compile

November 1, 2026. These are executed local experiments on pinned public projects, with source inspection and the tested Bun compiler's official docs. They are not maintainer adoption or endorsement. The [article](../../../../posts/031-oss-radar-08-bun-aot.md) contains the distilled findings.

## Findings that change the decision

**Fix the app's retained timers before judging its runtime memory.** Keryx starts a five-minute action deadline but never cancels it when an action finishes. Twenty good HTTP actions left twenty timers; [the cleanup patch](timer-cleanup.patch) left zero while keeping success, timeout, abort and thrown-error behavior. The actual source-run contract observations are in [timer-contracts.json](results/timer-contracts.json).

| Keryx greeting, real Redis + PostgreSQL, returning cookie | Requests/s, median (range) | App physical MB, median | App CPU, median |
| --- | ---: | ---: | ---: |
| Source JIT, original timer | 40,753 (40,366–41,137) | 842.9 | 120.4% |
| Source JIT, timer cleared | 47,789 (46,631–47,936) | 143.5 | 102.4% |
| Native AOT, original timer | 39,912 (39,535–40,293) | 525.0 | 115.3% |
| Native AOT, timer cleared | 45,307 (44,815–45,983) | 47.6 | 100.0% |

Four rotations give each cell each order position once; two seconds warmup then five measured seconds at eight connections. Exact medians, ranges and all samples are retained. Clearing the timer reduced JIT footprint 83% and native footprint 91%; comparing corrected modes, native used 67% less app memory with 5% fewer requests. CPU 100% means one core. App figures exclude PostgreSQL, Redis and the client.

Four original minute-long processes (JIT/native/native/JIT) kept accumulating memory with stable Redis key counts: final footprints 4,716/2,113/2,192/5,784 MB. Two separate fixed minute checks stayed within 129.2–130.4 MB (JIT) and 46.9–49.2 MB (native) at ten-second checkpoints. These are six measured segments in each unchanged process, not six independent repetitions. No forced GC, five-minute expiry test, long soak or production capacity claim.

**Next's static page succeeded while its real image route failed.** The unmodified packaged JIT build passed. Native first refused an extracted module, then refused Next's console patch after disk loading was enabled. The accepted pair adds the same explicit console-mutation prelude, with native also using `--aot-allow-code-from-disk`.

| Next sharp example + declared fixture | JIT requests/s | Native launcher requests/s | App physical MB, JIT → native |
| --- | ---: | ---: | ---: |
| Force-dynamic JSON | 17,767 | 3,847 | 137.5 → 90.2 |
| Native sharp PNG | 1,377 | 1,342 | 105.3 → 72.3 |
| Static page | 166,479 | 166,006 | 82.3 → 74.2 |
| Static text | 197,603 | 196,876 | 99.1 → 87.5 |

Six interleaved processes per mode; same warmup/duration/connections. JSON served 78% fewer requests. The adapter extracts Next and loads it from disk; Bun interprets that JS. This does not test Bun's separate official native Next standalone recipe. The image route really invokes sharp; every PNG's chunk CRCs and all 1,024 RGBA pixels were checked before timing. Full body/status checks gate every timed response. Image app CPU was about four cores in both modes; JSON about one.

Twelve alternating pre-extracted launches per mode put static readiness at 26.71/18.14 ms, but launch-to-first-JSON at 123.57/120.15 ms. One first-extraction probe per mode is retained separately; it is not a startup median. Final executables were 140,559,010/77,895,970 bytes and each extracted 2,061 regular files totaling about 44.9 MB. Both working binaries passed all selected routes with source/node_modules hidden, a fresh extraction tree, empty working directory and no Bun on PATH. The reproduction builder was actually exercised for both projects; rebuilt Next binaries also passed the source-hidden proof. A Date-extension warning remains; cache components are untested.

## Packaging and competing explanations

- Keryx's minimal standalone JIT **and** native builds missed Lua resources before help. Native additionally needed explicit discovered modules/assets and normalized template paths. The numerical JIT baseline is **Bun running source**, not a working packaged JIT executable. Both measured sources include the template patch. Corrected timer variants add only the deadline cleanup; action handlers stay the same.
- Keryx uses `safeParseAsync`; Zod 4.3.6's generated object fastpass requires `ctx.async === false`. The earlier synchronous Zod microbenchmark does not predict this route.
- No-cookie requests create sessions: twenty new requests added twenty keys; twenty returning requests added none. In-memory Redis retains those inside the app. Separate cookie/real-Redis controls still showed rising app memory, which led to the timer trace. Preserve these earlier profiles rather than averaging unlike workloads.
- Native MCP startup tried `process.execPath build`; native executables omit the Bun CLI. A separate variant prebuilds Keryx's existing browser UI through its own bundler. It passed MCP initialize/list/public status with source hidden and no Bun on PATH. Authenticated tools/browser UI remain unchecked. Its results do not certify a combined timer+MCP variant.
- Varsafe's public release manifest supplies a binary distribution, not verified CLI source or matched JIT/AOT builds. No Varsafe timing result or author participation is claimed.

## Inputs, methods and audit

Bun `3f3a9ff87cdccf3d32d7ec6b648c664eddaae840`, Keryx `d119595bec716ae99b4eca740964343e47f57eee`, adapter `43ab16c93774f23923654d337e6e2d9c205e4fe4`. [Inputs](results/inputs.json) retain locks, compiler/archive digests, official doc URLs, dependency hashes and host conditions. [Conditions](results/conditions.json) retain measured source hashes and pinned Redis 8.0.3. PostgreSQL 17.10 uses a new cluster and the example's actual migrations/initializer. Task workers/rate limiting are off; MCP is off during HTTP load.

Shared Apple M5 Mac / macOS arm64 / 24 GiB; same-host closed-loop client, no CPU/RAM caps. Builds and load tests did not overlap. Light editing/source reads continued; there is no continuous thermal/power trace or remote-client capacity claim. Physical footprint, RSS, heap-used MiB, executable bytes and extracted logical file bytes are different metrics. Filesystem/database caches are warm, not flushed. No cloud cost estimate follows from these tests.

- [Plan and checkpoints](00-plan.md): declared protocols, failures and reason for the timer extension.
- [Source/claim audit](01-source-and-claim-audit.md): code paths, authoritative Bun docs, competing claims and limits.
- [Reproduce](reproduce.md): exact pins, service setup, builds, controls and expected failures.
- [Summary](results/summary.json): all groups/ranges, not just selected article rows.
- [Builds](results/builds.json), [compatibility probes](results/compatibility-probes.json) and [diagnostics](results/diagnostics.json): failures stay visible. The normalized Keryx builder's stale `source_changes: []` is explicitly corrected with its original field preserved.
- [Manifest](results/manifest.json): hashes for every data file and executed Python/TypeScript source, patches and fixture. Full numerical observations are losslessly compressed JSON; private logs/binaries/mail remain outside Git.

Offline audit, without starting services or downloading anything:

```sh
python3 verify.py
```

The initial startup/load/cookie/external-service batches contain 96 fresh processes, 120 timed route windows and 38,603,066 checked timed responses. Minute/timer extensions add 22 processes, 52 windows and 17,473,425 checked timed responses. The 24 first-dynamic launches and functional probes are separate. These are trial counts, not readers or users. All accepted timed windows had zero response mismatches.

Two harness failures are preserved: the first CLI rejection checker read stdout instead of stderr (v2 checks passed), and the first internal session-count process timed out because it lacked explicit exit after shutdown (v2 passed). Native MCP's original failure remains real. The exact earlier runner sources are retained; they were not rewritten to appear as the later successful checker.
