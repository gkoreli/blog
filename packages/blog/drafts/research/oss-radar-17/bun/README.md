# Bun compression and AOT fieldwork

November 20, 2026. The [latest GitHub release](https://github.com/oven-sh/bun/releases/latest) and npm `latest` both reported 1.4.5 at 07:45 Pacific. GitHub returned no matching `bun-v1.5` tags. The November 20 preview is the official canary at `7bb427f3be953a1a9bf575ee8c87dc0946106de1`. Its binary reported `1.4.6-canary.1+7bb427f3b`; npm packaged that same source under `1.4.5-canary.20261120.1`. Version claims in the issue should follow verified stable and binary artifacts when they become available. [1.4.5 release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.5) · [Canary source](https://github.com/oven-sh/bun/tree/7bb427f3be953a1a9bf575ee8c87dc0946106de1) · [npm canary pin](https://www.npmjs.com/package/bun/v/1.4.5-canary.20261120.1).

The August [Bun 1.4 review](../../../../posts/021-oss-radar-05-bun-1-4.ts) covered the Rust runtime. The October [AOT review](../../../../posts/031-oss-radar-08-bun-aot.md) tested native executable size, performance and app compatibility. This return tests byte compatibility, a concrete post-build config change, and selected test-runner cases. Bun uses MIT for its own code and lists separately licensed components, including JavaScriptCore and WebKit. [Pinned license](https://github.com/oven-sh/bun/blob/7bb427f3be953a1a9bf575ee8c87dc0946106de1/LICENSE.md).

## Codec replacement

The merged changes route `node:zlib` compression to [NativeZlib](https://github.com/oven-sh/bun/blob/7bb427f3be953a1a9bf575ee8c87dc0946106de1/src/runtime/node/zlib/NativeZlib.rs), [NativeBrotli](https://github.com/oven-sh/bun/blob/7bb427f3be953a1a9bf575ee8c87dc0946106de1/src/runtime/node/zlib/NativeBrotli.rs), and [NativeZstd](https://github.com/oven-sh/bun/blob/7bb427f3be953a1a9bf575ee8c87dc0946106de1/src/runtime/node/zlib/NativeZstd.rs). These call the Rust codec crates. Bun still integrates native bindings and SIMD kernels. The maintainers describe broader shared uses and changes in stream and option handling. They also report a few Brotli inputs where timing gains disappear and occasional ARM64 output-byte differences. The positive compatibility matrix checks a smaller independent set. [DEFLATE](https://github.com/oven-sh/bun/pull/49187) · [Brotli](https://github.com/oven-sh/bun/pull/49035) · [Zstandard](https://github.com/oven-sh/bun/pull/49205).

The [codec fixture](codec_matrix.mjs) uses three inputs and three compression formats. Stable Bun 1.4.5, the November 20 canary, and Node v24.22.3 each emit one-buffer and 4,093-byte-chunk stream outputs. Every runtime reads the resulting 54 files twice, once by each decoder path, and compares all expanded bytes. All 324 comparisons passed. Both Bun binaries also fetched and checked nine ordinary compressed responses from the same loopback HTTP origin. The fixture sends explicit `Content-Encoding` values.

Nine of nine paired Bun buffer outputs and six of nine stream outputs match by SHA-256. All three stable Zstandard streams included the same nine-byte suffix, `28b52ffd2000010000`. In each case the new stream is exactly the old prefix. Node's Zstandard decoder expanded the isolated suffix to zero bytes. The maintainer's [PR](https://github.com/oven-sh/bun/pull/49205) explains removal of an extra empty frame on a stream ending while writes are queued. [Encoding hashes, sizes, comparisons and samples](codecs-2026-11-20.json).

The timing loop measured synchronous buffer operations. It warmed each case three times and ran five fresh processes per build, alternating which went first. Decoders read the same Node-produced bytes. On the 583,748-byte log file, each sample represents 13 calls. Gzip decode medians were 6.63 and 3.87 ms, with ranges 6.37–7.56 and 3.67–5.31 ms for stable and canary. Brotli decode medians were 4.65 and 3.97 ms, with overlap in the sample ranges. Zstandard encode medians were 6.13 and 7.04 ms. The ARM64 Linux results include the entire runtime revision and one VM on a shared host. x64, memory use, other levels, dictionaries, and streaming throughput remain outside these timing observations.

## Native AOT

The [AOT patch](https://github.com/oven-sh/bun/pull/49145) changes module resolution and more specific test-runner cases around mocks and preload order. Its [lowering](https://github.com/oven-sh/bun/blob/7bb427f3be953a1a9bf575ee8c87dc0946106de1/src/aot/lower/module/loads.rs#L2695) has separate paths for statically answered and computed `require.resolve` calls. The [standalone graph](https://github.com/oven-sh/bun/blob/7bb427f3be953a1a9bf575ee8c87dc0946106de1/src/resolver/standalone_module_graph.rs) retains mappings for embedded files and source paths. The experiment checks the resulting file data through both the literal and argument cases. The observations do not identify which layer retained the old symlink target.

On ARM64 macOS, both builds compiled the same config reader while `active.json` pointed at `v1.json`. The November 19 canary `ca7729d01` failed with `ENOENT` for the literal `require.resolve` branch. The newer one read `v1.json` through both branches. After switching the symlink to `v2.json`, running source read version 2 via `require.resolve`; the newer compiled executable still read version 1, even when passed the path as an argument. Reading the argument directly through `fs.readFileSync` yielded version 2 from the same packaged executable. The standalone comparison program, a different typed fixture, returned the same exact JSON from source, regular compile, and native AOT. Canary executable sizes were 139,294,322 and 53,365,874 bytes for regular and AOT. [Reproduction](aot_trials.py) · [Results](aot-2026-11-20.json).

An initial preload test asserted a sequence that also failed under the JIT. The accepted fixture follows the observed JIT order `observer`, `provider`, `factory`. Both canaries preserve it with and without `--aot`. Stable 1.4.5 did not supply the callable `load` helper to that `vi.mock` factory. The separate failed-then-mocked fixture had one passing test and one failing test in every tested mode. It keeps the original failure visible after the later file registers a mock. This is our `mock.module` plus rejected dynamic-import case. The upstream patch reports different specific cases, and this check does not overturn those tests. The later runs added the retargeted symlink, argument, and direct-read controls.

## November 20 afternoon HTTP follow-up

GitHub published a second November 20 canary at `3f3202e4225011f4ebc10ea705f284b8df070a1b`. Its response handling change paces compressed reads with the consumer. The targeted macOS check serves 393,631 bytes of synthetic API logs from one Node HTTP/1.1 origin as identity, gzip, Brotli, and Zstandard. Each encoding has a `Content-Length` response and a response sent in 4,093-byte pieces that the client reads with a short pause. Bun 1.4.5 and both November 20 canaries recovered the identical body in all 24 reads. [Merged response change](https://github.com/oven-sh/bun/pull/49203) · [Pinned fetch path](https://github.com/oven-sh/bun/blob/3f3202e4225011f4ebc10ea705f284b8df070a1b/src/runtime/webcore/fetch/FetchTasklet.rs) · [Fixture](fetch_followup.mjs) · [Results](fetch-followup-2026-11-20.json).

JavaScript received different chunk boundaries. For the buffered gzip response the largest observed piece was 262,144 bytes in the morning canary and 377,247 bytes in the afternoon canary. Those sizes describe one program and one run. The earlier codec timing and native compilation measurements still refer to their original binaries. GitHub and npm continued to list 1.4.5 as stable at the afternoon check. [Stable release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.5).

## November 21 AOT build flags

Bun's CLI and JavaScript build API now check whether the caller requested both ahead-of-time compilation and bytecode. The earlier implementation ignored bytecode when the caller requested native compilation. [Merged change](https://github.com/oven-sh/bun/pull/49336) · [CLI check](https://github.com/oven-sh/bun/blob/b15f51302d72e1cd9038ecd0cf33782c02ee7681/src/runtime/cli/compile_options.rs#L1174-L1191) · [Build API](https://github.com/oven-sh/bun/blob/b15f51302d72e1cd9038ecd0cf33782c02ee7681/src/runtime/api/JSBundler.rs#L1713-L1724).

On macOS ARM64, both canaries built and ran one TypeScript program with AOT alone, bytecode alone, `bun compile --no-aot --bytecode`, and the AOT-only `Bun.build` call. Stable 1.4.5 also built and ran the bytecode-only command. The November 20 afternoon canary accepted three requests for both modes. It printed a note for each CLI invocation. The next canary returned status 1 and produced no executable for all three requests. [Fixture](aot_flags.py) · [All 15 build outcomes](aot-flags-2026-11-21.json).

| Build request | November 20 afternoon, `3f3202e42` | November 21 UTC, `b15f51302` |
| --- | --- | --- |
| `bun build --compile --aot --bytecode` | Built, with a note | Rejected |
| `bun compile --bytecode` | Built, with a note | Rejected |
| `Bun.build` with `compile.aot` and `bytecode` enabled | Built | Rejected |

A build script moving to the canary can keep its bytecode by using `bun build --compile --bytecode` or by passing `--no-aot` to `bun compile`. To produce the native executable, keep the AOT option and remove bytecode. This check covered one standalone program and the Mac ARM64 builds. The newer official ZIP matched SHA-256 `14f4c8961a7a221b4aee42b5da5cc3f9d75eaaf857d1fd0239bd1f650c95f223`. [November 20 afternoon source](https://github.com/oven-sh/bun/tree/3f3202e4225011f4ebc10ea705f284b8df070a1b) · [November 21 UTC source](https://github.com/oven-sh/bun/tree/b15f51302d72e1cd9038ecd0cf33782c02ee7681).

## Run the fixtures

The Linux codec run used checksummed official Linux ARM64 musl ZIP assets and Node v24.22.3 in a disposable Alpine 3.23.4 VM. Use [the exact #8 source bytes](https://github.com/gkoreli/blog/blob/a109684af05ffab07ae4d2c2a550dbd2e2df926e/packages/blog/posts/031-oss-radar-08-bun-aot.md) for the Markdown input. The macOS AOT runs used checksummed GitHub assets and the npm integrity pin for the earlier binary. The receipts identify the tested binary revisions or hashes. The canary download tag moves over time, so check the source revisions next to the receipts.

```sh
node codec_matrix.mjs /path/to/stable /path/to/canary /tmp/fresh-codecs /path/to/radar-eight.md
python3 aot_trials.py /path/to/stable /path/to/nov19 /path/to/nov20 /tmp/fresh-aot
node fetch_followup.mjs /path/to/stable /path/to/morning-canary /path/to/afternoon-canary /tmp/fresh-fetch
python3 aot_flags.py /path/to/stable /path/to/nov20-afternoon /path/to/nov21-utc /tmp/fresh-aot-flags
```
