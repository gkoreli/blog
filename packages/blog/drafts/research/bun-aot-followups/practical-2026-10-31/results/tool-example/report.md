# Bun executable comparison

Completed: yes

3 runs per build; 8 connections; 0.5 s warmup and 1.0 s measured per route.
Memory: physical_footprint_bytes, decimal MB. CPU cores are process CPU seconds / elapsed seconds; no CPU cap is imposed.

| Build | File MB | Startup ms | Route | Requests/s median (min–max) | App MB | App CPU cores |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| jit | 121.1 | 10.35 | echo | 204,807 (203,589–205,622) | 20.4 | 1.01 |
| bytecode | 121.1 | 10.14 | echo | 205,574 (205,320–205,987) | 20.5 | 1.01 |
| aot | 52.0 | 10.03 | echo | 210,779 (209,505–211,587) | 18.3 | 1.00 |
| aot-trim | 31.0 | 10.48 | echo | 210,045 (207,265–211,100) | 17.9 | 1.00 |

First checked launch (separate from the repeated fresh-process starts in the table): jit: 669.56 ms, bytecode: 640.88 ms, aot: 298.23 ms, aot-trim: 283.06 ms. Fresh files may incur one-time OS work; the tool does not isolate its cause.

## Conditions

Host: macOS-27.0.1-arm64-arm-64bit-Mach-O / arm64.
Bun: 1.4.4-canary.1+da867c60b.

Outputs were checked for the selected cases. JSON expectations preserve types; every measured response matches the checked bytes. These checks do not certify the entire application.

- One local client and one server process; closed-loop HTTP/1.1 with fixed Content-Length responses under 120 KB.
- macOS physical footprint and Linux RSS are different metrics. Server memory excludes external databases/services.
- Readiness is the first expected ready response. One checked launch is recorded separately before repeated fresh-process starts; warm request speed excludes startup. Filesystem caches are not flushed.
- Every measured response must match the checked reference bytes. Selected checks do not certify the whole application.
- No CPU/RAM limit, independent arrival rate, remote load generator, production soak or cloud-cost claim.
- Build flags are ESM JIT / ESM bytecode / native AOT; framework build plugins require a separately prepared entry or --binary.

Raw observations, hashes, sample spread and per-route peaks are in observations.json / summary.json. Review reports before sharing; application/build logs stay in private/.
