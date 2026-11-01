# Bun executable comparison

Completed: yes

6 runs per build; 8 connections; 1.0 s warmup and 2.0 s measured per route.
Memory: physical_footprint_bytes, decimal MB. CPU cores are process CPU seconds / elapsed seconds; no CPU cap is imposed.

| Build | File MB | Startup ms | Route | Requests/s median (min–max) | App MB | App CPU cores |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| jit | 122.5 | 33.83 | echo | 189,258 (186,238–195,877) | 45.1 | 1.02 |
| jit | 122.5 | 33.83 | user | 52,632 (52,243–52,975) | 51.7 | 1.05 |
| bytecode | 126.8 | 16.96 | echo | 189,394 (186,092–195,135) | 40.9 | 1.02 |
| bytecode | 126.8 | 16.96 | user | 52,488 (51,577–53,044) | 48.9 | 1.05 |
| aot | 64.7 | 13.27 | echo | 159,122 (153,063–162,350) | 20.8 | 1.00 |
| aot | 64.7 | 13.27 | user | 41,644 (41,431–42,039) | 21.8 | 1.00 |

First checked launch (separate from the repeated fresh-process starts in the table): jit: 39.63 ms, bytecode: 23.69 ms, aot: 20.65 ms. Fresh files may incur one-time OS work; the tool does not isolate its cause.

## Conditions

Host: macOS-27.0.1-arm64-arm-64bit-Mach-O / arm64.
Bun: prebuilt executables; see hashes in observations.json.

Outputs were checked for the selected cases. JSON expectations preserve types; every measured response matches the checked bytes. These checks do not certify the entire application.

- One local client and one server process; closed-loop HTTP/1.1 with fixed Content-Length responses under 120 KB.
- macOS physical footprint and Linux RSS are different metrics. Server memory excludes external databases/services.
- Readiness is the first expected ready response. One checked launch is recorded separately before repeated fresh-process starts; warm request speed excludes startup. Filesystem caches are not flushed.
- Every measured response must match the checked reference bytes. Selected checks do not certify the whole application.
- No CPU/RAM limit, independent arrival rate, remote load generator, production soak or cloud-cost claim.
- Build flags are ESM JIT / ESM bytecode / native AOT; framework build plugins require a separately prepared entry or --binary.

Raw observations, hashes, sample spread and per-route peaks are in observations.json / summary.json. Review reports before sharing; application/build logs stay in private/.
