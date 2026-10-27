# Reproduce the Bun AOT experiments

These scripts use an official Bun preview on macOS arm64, not the stable release. They create binaries and local servers; run them in a fresh scratch copy of this folder, outside the blog checkout. Keep the checked-in `results/` intact. Raw stdout, stderr and binaries stay outside Git.

## Inputs

- [Official Bun CI artifact](https://buildkite.com/organizations/bun/pipelines/bun/builds/133741/jobs/01a17da4-c4f4-4975-bd0f-67d302e5c705/artifacts/01a17dac-1cd3-41d4-b162-247a1d9da01b), `bun-darwin-aarch64.zip`; SHA-256 `b7ef38afea38fc313296629cae1a01c880782c4350f125b796c98c1ab79d4194`.
- Bun `06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea`; its pinned WebKit is `3c80db265b51f90243aba1fa141e03d551a6e80b`.
- TypeScript tag `v6.0.3`, commit `050880ce59e30b356b686bd3144efe24f875ebc8`.
- Effect commit `8b0eac6ac46a689a7208500e2ccf9e3b80fc3898`.
- The experiment-only npm lock pins TypeScript 6.0.3, Zod 4.3.6, Node declarations 26.6.5 and source-map-support declarations 0.5.10. These add no dependency to the site.
- Node 24, Python 3, Git, npm and Apple's C compiler. Python scripts use only the standard library. The load client uses C/POSIX sockets and pthreads.

Download the artifact from the public CI listing above. `prepare.py` verifies its hash, clones the two sources at the fixed revisions, installs the locked experiment dependencies, runs TypeScript's own diagnostic generator, writes local configs and builds the compiler executables and C client. It refuses to reset an existing checkout at another revision.

```sh
python3 prepare.py --bun-zip /absolute/path/bun-darwin-aarch64.zip
python3 measure-compiler.py
python3 measure-pointer-control.py
python3 measure-servers.py
python3 measure-throughput.py
python3 measure-validators.py
python3 measure-trim-memory.py
python3 run-manual.py
```

Run the measurement scripts sequentially on an otherwise quiet machine. Do not run compiler builds during throughput measurements. The original laptop was shared and had no CPU affinity; the article does not claim a dedicated-machine result.

The compiler runner executes one warm-up pair and five measured alternating pairs. It requires successful exit, records TypeScript's diagnostics and macOS `/usr/bin/time -l` metrics. `real_s` is elapsed wall time. `peak_footprint_bytes` and `peak_rss_bytes` are distinct measurements in bytes. The separate pointer-control runner uses one warm-up pair and three measured pairs.

`measure-servers.py` first builds the server in four configurations, then sweeps retained-object counts. Its Python HTTP client tests memory and responses, not maximum server speed. The initial sweep overlapped compiler preparation; use the later native-client run for accepted timing claims.

`measure-throughput.py` uses eight native client threads. Each fresh server holds 100,000 linked objects. It receives 20,000 warm-up requests, followed by two one-million-request windows; each request walks up to 1,000 links. Every response body must equal its reference, and the result hashes must also match across JIT/AOT runs. RSS samples are approximately 200 ms apart. Each of the five processes per mode is observed for roughly 11–12 seconds. This is a bounded request-volume test, not a multi-day soak.

`measure-validators.py` runs two million successful `safeParse` calls on two valid objects with a three-field schema. It compares Zod default and `jitless` settings under both runtimes. It times whole fresh processes; it does not measure invalid inputs or an HTTP endpoint. The jitless setting is not a build-time-generated validator.

`run-manual.py` records ordinary behavior, false type annotations, a generated function, locked built-ins, compiled plugin imports, unembedded disk plugins and the reported CommonJS case. The CommonJS fixture is derived from [issue 47044](https://github.com/oven-sh/bun/issues/47044). On the accepted preview it crashes the compiler; the script records that diagnostic without sending a crash report. These are observed cases, not full language conformance.

The byte-identical-build check ran three identical AOT+trim build commands against `server.ts`, with the same output path. The three hashes match in `results/determinism-results.json`. That does not establish determinism for other programs, platforms or toolchains.

## Accepted observations

`results/accepted-summary.json` contains the medians used in the article. The other JSON files preserve the numeric observations, including the counterexamples. `artifact-manifest.json` hashes the experiment sources, inputs and accepted binaries. Binary hashes commit to the author's local artifacts; the files themselves are not stored here.

Use [the claim audit](../03-claim-audit.md) for conditions, scope, source paths and the distinction between reproduced behavior, inspected implementation and maintainer reports. No prompt transcript or private session log is included.
