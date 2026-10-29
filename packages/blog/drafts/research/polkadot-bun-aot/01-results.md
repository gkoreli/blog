# Polkadot CLI: Bun AOT halves memory for cached metadata inspection

Tested October 28, 2026, on an Apple M5 / 24 GiB shared macOS arm64 laptop. This follow-up is separate from [OSS Radar #08](../../../posts/031-oss-radar-08-bun-aot.md) and its frozen measurements.

**The unchanged CLI's cached metadata command took 42.1 ms with a normal Bun executable and 18.5 ms with AOT. Peak physical memory fell from 39.6 MB to 19.4 MB.** Help took 32.1 ms versus 11.7 ms. AOT produced a 70.7 MB executable, or 59.7 MB with trimming, that passed the selected offline commands with access to the original checkout blocked.

The practical catch was packaging: the cryptographic command needs an explicit `--asset node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm`. A successful compile and working help command did not prove that it worked. The normal Bun executable also relied on the WASM file in the checkout; adding `--asset` did not fix that JIT path in this compiler. Its timing results below are valid with the checkout present, but it is not a verified portable package.

## Why this project

[Issue #218](https://github.com/paritytech/polkadot-cli/issues/218) is an open feasibility proposal for a Rust rewrite, citing startup, memory, native library integration and other goals. Checked October 28: open, no comments, last updated May 26. It is decision input, not an approved implementation. The proposal discusses v1.19.0; this experiment uses **v1.25.1**, commit [`8e85fdac1fb81c5996a4ecc4c93178a54f37f2d5`](https://github.com/paritytech/polkadot-cli/tree/8e85fdac1fb81c5996a4ecc4c93178a54f37f2d5).

The current [package build](https://github.com/paritytech/polkadot-cli/blob/8e85fdac1fb81c5996a4ecc4c93178a54f37f2d5/package.json) targets Node and leaves dependencies external. That is why the comparison includes its Node build, Bun source execution and a normal Bun executable. All Bun modes use **the same** official canary, `1.4.4-canary.1+73b53109f` ([full compiler commit](https://github.com/oven-sh/bun/commit/73b53109f704b85ca889ef4e76285eb083c8d5f6)). This is a preview, not a stable-release recommendation. The CLI source, package file and lock remained unchanged.

## Fresh-process latency

Medians in milliseconds, **20 runs per cell**, after two untimed warm-ups. Each command starts a new process with warm filesystem caches. Timing includes process launch, the measurement wrapper, initialization, command work and exit. It is not a cold-disk or isolated algorithm benchmark.

| Command | Node package build | Bun source | Bun executable | AOT + asset | AOT + asset + trim |
| --- | ---: | ---: | ---: | ---: | ---: |
| `--version` | 96.8 | 54.5 | 30.9 | 11.7 | 12.7 |
| `--help` | 98.6 | 55.9 | 32.1 | 11.7 | 12.5 |
| SHA-256, 16 MiB file | 153.6 | 122.8 | 102.8 | 70.4 | 70.8 |
| Cached `inspect System.Account` | 112.2 | 64.8 | 42.1 | 18.5 | 19.4 |
| Full Bandersnatch member key | 102.8 | 67.2 | 41.5 | 25.2 | 26.0 |

Against the regular Bun executable, AOT was **2.74× faster for help**, **2.27× for cached metadata inspection**, **1.46× for the file hash** and **1.64× for member-key derivation**. These are whole-command ratios. They do not establish a faster SHA-256 or WebAssembly implementation.

## Peak physical memory

Medians in **decimal MB**, from macOS `/usr/bin/time -l`'s **peak memory footprint**. This is distinct from RSS; the [structured summary](repro/results/summary.json) retains both.

| Command | Node package build | Bun source | Bun executable | AOT + asset | AOT + asset + trim |
| --- | ---: | ---: | ---: | ---: | ---: |
| `--version` | 69.2 | 29.6 | 17.4 | 9.8 | 9.8 |
| `--help` | 69.5 | 30.0 | 17.6 | 9.8 | 9.8 |
| SHA-256, 16 MiB file | 103.1 | 66.2 | 52.6 | 42.9 | 42.8 |
| Cached `inspect System.Account` | 71.5 | 53.7 | 39.6 | 19.4 | 19.4 |
| Full Bandersnatch member key | 70.0 | 75.5 | 61.6 | 48.8 | 48.8 |

Cached metadata inspection used **50.9% less peak physical memory** under AOT than the normal Bun executable. The crypto command saved **20.8%**, and the file hash **18.5%**. The project [loads its verifiable crypto stack lazily](https://github.com/paritytech/polkadot-cli/blob/8e85fdac1fb81c5996a4ecc4c93178a54f37f2d5/src/features/verifiable/register.ts); a small help-process footprint does not describe that heavier command. Trimming did not materially lower these measured memory peaks.

## Executable size and portability

| Build | File size, decimal MB | Selected crypto command with checkout reads denied |
| --- | ---: | --- |
| Normal Bun executable | 123.0 | Fails: needs WASM at its original dependency path |
| Normal Bun executable + asset | 130.4 | Still fails at the original dependency path |
| AOT, no asset | 63.3 | Already fails in ordinary execution: missing virtual WASM path |
| AOT + trim, no asset | 52.3 | Same missing-asset failure |
| **AOT + asset** | **70.7** | Passes |
| **AOT + asset + trim** | **59.7** | Passes |

These are executable file sizes, not RAM or installed-package totals. The regular Bun file sizes do not include any external files still required at runtime. Node's JavaScript entry plus external dependencies and runtime is a different packaging format, so no Node executable-size comparison is claimed. The compiler warned that dynamic code generation and dynamic imports retained APIs during trimming; the article's 30.3 MB tiny-server result does not transfer to this CLI.

## Correctness and limits

- **70 successful command checks:** 14 cases in each of five modes. Expected invalid-input exits were checked too. Outputs and exits matched the Node build byte for byte, except the intended runtime identification in `--version`. SHA-256 results and two upstream pinned member keys received independent expectations. Two additional checks preserved the unembedded AOT failures.
- **28 standalone checks:** both AOT+asset variants passed the same 14 cases with reads from the source checkout and dependencies denied. Three negative controls confirmed the blocked Node entry and both JIT variants' external WASM dependency. Ordinary system libraries and scratch input files remained available.
- **500 accepted measurements:** 20 processes × five modes × five commands, in balanced rotating/reversed order. All measured outputs and exits passed their expectations. [Individual observations](repro/results/measurements.json) retain ranges and hashes; no observations were removed. An earlier exploratory run preceded the portability check and is not the accepted table above.

This is one shared laptop, one preview and an offline command matrix. It does not measure live RPC/query dumps, signing or transaction submission, complete upstream-suite parity, Linux/Windows behavior, server throughput or a Rust implementation. It cannot settle direct Rust-library integration, light clients, crate reuse or the other reasons in the rewrite proposal. The mutable canary download also limits exact future input retrieval; the [reproduction guide](repro/README.md) pins its bytes and rejects substitutions.

**Result for maintainers:** AOT merits a bounded packaging/compatibility trial before using startup or memory alone to justify a rewrite. The concrete next check is the project's existing transaction-parity fixtures and live-query behavior on its target platforms. This experiment has not completed that gate.

[Runner and setup](repro/README.md) · [Input and evidence hashes](repro/results/manifest.json) · [Prepared maintainer comment](02-maintainer-draft.md). No upstream comment or message has been sent.
