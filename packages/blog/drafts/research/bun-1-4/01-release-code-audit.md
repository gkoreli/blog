# Bun 1.4.0 release and code audit

Research artifact for TASK-0090 / FLDR-0006. This is a single-project OSS Radar deep-dive artifact, not article prose.

## Scope and freeze point

- **Repository baseline:** [`oven-sh/bun@34cbb9a40b4bd1bd767d134a7065e66c2432a676`](https://github.com/oven-sh/bun/tree/34cbb9a40b4bd1bd767d134a7065e66c2432a676)
- **Release tag:** [`bun-v1.4.0`](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0)
- **Tag commit time:** `2026-08-20T00:50:33Z` (`2026-08-19T17:50:33-07:00`)
- **Public release time:** `2026-08-20T14:07:21Z`
- **Code/docs inspection baseline:** the SHA above; every repository code or documentation link in this artifact is pinned to it.
- **Live issue/PR state checked:** `2026-08-27T00:13:05Z`
- **Local reproduction platform:** macOS arm64, Darwin `25.5.0`.

The public release date is **August 20, 2026**. The apparent one-day discrepancy in some reports is a time-zone boundary: the tag commit was made on August 19 in Pacific time, while Bun's [release post](https://bun.com/blog/bun-v1.4), GitHub's release record, and the UTC commit timestamp are August 20. GitHub's [release API record](https://api.github.com/repos/oven-sh/bun/releases/tags/bun-v1.4.0) identifies the release as `Bun v1.4`, targets the full SHA above, records `created_at` as `2026-08-20T00:50:33Z`, and records `published_at` as `2026-08-20T14:07:21Z`.

## Evidence-state legend

- **Code-inspected:** read in source, tests, build scripts, or documentation at the pinned SHA.
- **Reproduced:** run locally against the checksum-verified official `bun-v1.4.0` macOS arm64 binary.
- **Reported:** stated by Bun maintainers or an issue reporter; not independently reproduced here.
- **Proposed:** present in an open issue or PR; not part of the pinned release.
- **Inference:** analysis supported by the cited evidence, not a project claim.

## Executive verdict

The version-number-worthy change in Bun 1.4.0 is the runtime substrate migration: **1.3.14 was the last Zig release and 1.4.0 is the first Rust release**. Bun's own release page is broader than that boundary. It explicitly says it covers everything shipped since 1.3.0 and labels items with their first release. The most visually marketable APIs—including `Bun.Image`—therefore should not be described as newly appearing in the 1.4.0 tag.

The strongest evidence-backed reading is:

1. **The Rust rewrite is the actual release boundary.** It is not a superficial language swap: allocator selection, sanitiser behavior, ownership cleanup, and the native implementation all changed. The team reports 128 bugs reproducible in 1.3.14 fixed in 1.4.0, and reports large memory improvements; the pinned source confirms the new allocator and ASAN wiring, but this audit did not reproduce the full performance or leak claims.
2. **Bun.Image is the clearest example of the product direction.** It pulls a Sharp-shaped, asynchronous image pipeline into the runtime, backed by static native codecs and OS facilities. The complete path is visible in code and its focused upstream test set passed locally. However, it was first shipped in 1.3.14, and this audit reproduced byte-identical output on 1.3.14 and 1.4.0 for one sample.
3. **The release is a credible canary candidate, not a blind production upgrade.** Open reports at the cutoff cover silent Windows file-read completion loss, an HTTP/2 stall under `bun test`, persistent `bun test --parallel` deadlock, an unsafe `bun audit fix --latest` downgrade, and Next.js unhandled rejections. Two of the runtime regressions have open proposed fixes. These are reporter evidence, not reproduced findings, but they touch high-consequence surfaces.

## Release identity ledger

| Fact | Value | Evidence state | Primary source |
|---|---:|---|---|
| Release | Bun v1.4 / `bun-v1.4.0` | Code-inspected | [GitHub release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0) |
| Baseline commit | `34cbb9a40b4bd1bd767d134a7065e66c2432a676` | Code-inspected | [Pinned commit](https://github.com/oven-sh/bun/commit/34cbb9a40b4bd1bd767d134a7065e66c2432a676) |
| Commit subject | `Fix edgecase in v8 CPU profiler` | Code-inspected | [Pinned commit](https://github.com/oven-sh/bun/commit/34cbb9a40b4bd1bd767d134a7065e66c2432a676) |
| Commit parent | `cfa9f8e15b4252a08c483711d835dfe56a8b21ab` | Code-inspected | [Pinned commit](https://github.com/oven-sh/bun/commit/34cbb9a40b4bd1bd767d134a7065e66c2432a676) |
| Commit time | `2026-08-20T00:50:33Z` | Code-inspected | [GitHub release API](https://api.github.com/repos/oven-sh/bun/releases/tags/bun-v1.4.0) |
| Public release time | `2026-08-20T14:07:21Z` | Reported by GitHub | [GitHub release API](https://api.github.com/repos/oven-sh/bun/releases/tags/bun-v1.4.0) |
| Official release date | August 20, 2026 | Reported | [Official release post](https://bun.com/blog/bun-v1.4) |
| Official macOS arm64 artifact SHA-256 | `c669e97f6164e1c96e0701748db98dfa77492908cbd8394c7557134a735de381` | Reproduced and matched to release metadata | [Release assets](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0) |
| Downloaded binary revision | `1.4.0+34cbb9a40` | Reproduced | Official release binary |

## What the release page claims—and what it actually covers

The [official Bun 1.4 post](https://bun.com/blog/bun-v1.4) says it is a roundup of everything shipped since 1.3.0, with items tagged by the version that first shipped them. That editorial choice matters. It is accurate to say “Bun 1.4 presents these capabilities,” but inaccurate to imply every section first appeared in tag `bun-v1.4.0`.

| Official claim | Exact scope in the source | Evidence state | Audit note |
|---|---|---|---|
| Node compatibility | 1,517 Node.js suite tests added; Bun targets Node 26.3.0; 97% pass rates claimed for `http`, `fs`, `cluster`, `timers`, `zlib`, `vm`, and `stream`; 99% for `quic`; 100% for `events`, `trace_events`, and `sqlite` | Reported | Maintainer measurements in the [release post](https://bun.com/blog/bun-v1.4); not rerun here. Percentages alone do not describe excluded tests or semantic depth. |
| Stability | More than 2,900 issues fixed since Bun 1.3; Rust post says 1.4.0 fixes 128 bugs that reproduce in 1.3.14 | Reported | Two differently scoped maintainer counts from the [release post](https://bun.com/blog/bun-v1.4) and [Rust rewrite post](https://bun.com/blog/bun-in-rust). Do not combine them. |
| Idle CPU | 5× lower in the project's idle `Bun.serve()` test; Claude Code p99 CPU 24% → 10% and p50 5.8% → 2.5% | Reported | Maintainer benchmark and production observation in the [release post](https://bun.com/blog/bun-v1.4); not reproduced. |
| HTTP server memory | 13–48% lower across the published suite: Fastify 120 vs 233 MB, Express 92 vs 169 MB, `node:http` 81 vs 135 MB, Elysia 55 vs 91 MB, Next.js 285 vs 397 MB, `Bun.serve` 36 vs 45 MB, Vite 233 vs 268 MB | Reported | Maintainer table in the [release post](https://bun.com/blog/bun-v1.4); workload and measurement details remain part of Bun's methodology. |
| Startup memory and time | Windows “hello” startup 15.5 vs 39 ms and peak memory 16.8 vs 46.5 MB; Linux 5.1 vs 10.9 ms and 14.6 vs 33 MB, comparing 1.4.0 with 1.3.14 | Reported | Maintainer table in the [release post](https://bun.com/blog/bun-v1.4); not reproduced. |
| Binary size | Up to 17% smaller; published sizes range from Linux x64 77.0 vs 88.5 MB and Windows arm64 75.1 vs 90.2 MB to slight increases on macOS | Reported | Maintainer table in the [release post](https://bun.com/blog/bun-v1.4). “Up to” is important; macOS arm64 is 61.2 vs 60.2 MB and x64 is 66.6 vs 66.0 MB. |
| Native dependency displacement | Fifteen package-shaped capabilities listed: Sharp, Puppeteer, Marked, node-cron, node-pty, concurrently, npm-run-all, serve-static, JSON5, fast-xml-parser, tar, string-width, slice-ansi, cli-truncate, and wrap-ansi | Reported and partially code-inspected | The [release post](https://bun.com/blog/bun-v1.4) frames these as built-ins. The audit traces `Bun.Image` rather than assuming behavioral equivalence with all fifteen packages. |
| `Bun.Image` speed | 1.38× Sharp for the highlighted PNG-to-JPEG resize and 1.19× for JPEG-to-WebP | Reported | The [feature PR #30032](https://github.com/oven-sh/bun/pull/30032) specifies Sharp 0.34.5, Linux x64, release CI build, 50 iterations, and Sharp concurrency 1. Not reproduced here. The same PR reports a no-resize PNG-to-JPEG case where Bun is 0.98× Sharp, so the result is workload-dependent. |
| Rust rewrite scale | 535,496 Zig lines mechanically ported; 1,448 Zig files; peak 64 Claude agents; 11 days; landed diff +1,009,272; 6,778 commits; 5.9B uncached input, 72B cached input, 690M output tokens; approximately $165,000 at API pricing | Reported | Maintainer reconstruction in the [Rust rewrite post](https://bun.com/blog/bun-in-rust). These numbers describe the migration process, not runtime quality. The post separately gives 6,502 commits for an animation dataset that excludes some merges; preserve each source's scope rather than “correcting” one with the other. |
| Rewrite verification | Six platforms green; 100% of Bun's test suite passing at merge; Linux Debian x64 table shows 60,624 tests, 4,174 files, and 1,386,826 `expect()` calls | Reported | Maintainer CI reconstruction in the [Rust rewrite post](https://bun.com/blog/bun-in-rust). This audit ran only the focused image subset on one platform. |
| Leak hardening | Eleven security-review rounds; parsers fuzzed 100B times; about 15 resulting PRs; every ASAN-instrumentable leak found during the exercise fixed | Reported, with allocator path code-inspected | Maintainer claims in the [Rust rewrite post](https://bun.com/blog/bun-in-rust) and [PR #30875](https://github.com/oven-sh/bun/pull/30875). “Instrumentable” is the safe boundary: the PR includes suppressions for intentional process-lifetime allocations. |

## Strongest release-level change: the Zig-to-Rust runtime migration

### Why this is the real 1.4 boundary

The [Rust rewrite post](https://bun.com/blog/bun-in-rust) explicitly identifies 1.3.14 as the final Zig release and 1.4.0 as the first Rust release. The migration was intended to be mechanical first, with idiomatic Rust refactoring after 1.4. That limits product-semantic change in theory, while changing the implementation substrate enough to make ownership cleanup and sanitizer coverage first-class.

The code-inspected allocator path at the release SHA is:

1. In ordinary builds, Bun declares `bun_alloc::Mimalloc` as the Rust global allocator. Under `bun_asan`, it selects `std::alloc::System` instead: [`src/bun_bin/lib.rs#L48-L56`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/bun_bin/lib.rs#L48-L56).
2. The build script checks the `bun_asan` configuration, adds `-Zsanitizer=address` for sanitizer builds, and only enables shared generics outside ASAN: [`scripts/build/rust.ts#L494-L510`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/rust.ts#L494-L510).
3. The allocator crate makes mimalloc use conditional on `not(bun_asan)` and routes allocator shims accordingly: [`src/bun_alloc/lib.rs#L212-L242`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/bun_alloc/lib.rs#L212-L242).
4. [PR #30875](https://github.com/oven-sh/bun/pull/30875), merged May 19, 2026 with 251 commits, records the ASAN/LSAN work and the full-test sanitiser strategy. This is a maintainer report around code that is present in the pinned release.

The important bounded claim is not “Rust makes Bun memory-safe.” Bun still embeds C++ systems and crosses FFI boundaries. It is: **the rewrite gave Bun deterministic Rust cleanup for Rust-owned resources and a working sanitizer configuration for native paths, and maintainers report that this exposed and removed a large class of leaks.**

The [Rust rewrite post](https://bun.com/blog/bun-in-rust) illustrates that claim with a maintainer benchmark that repeatedly invokes `Bun.build()` 2,000 times. It reports Bun 1.3.14 rising from 1,914 MB at 500 builds to 6,745 MB at 2,000, while 1.4.0 rises from 526 MB to 609 MB. This audit did not rerun that long-lived benchmark; treat it as **Reported**, not **Reproduced**.

## Strongest user-visible system: `Bun.Image`

### Release-train caveat

The `Bun.Image` section in the [Bun 1.4 post](https://bun.com/blog/bun-v1.4) is labeled **v1.3.14**. The implementation is a flagship example of what the 1.4 release train now contains, not evidence of a new symbol added at the 1.4.0 tag. The local version comparison below confirms that narrow distinction.

### End-to-end implementation path

1. **Lazy global registration.** Bun's global object installs a lazy `Image` property and resolves it through `getImageConstructor`: [`src/runtime/api/BunObject.rs#L325-L333`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/api/BunObject.rs#L325-L333), [`src/runtime/api/BunObject.rs#L1822-L1824`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/api/BunObject.rs#L1822-L1824). There is no runtime feature flag guarding availability.
2. **Input integration.** `Blob`, `Bun.file()`, and compatible object-storage file objects expose `.image()`, which forwards into the image constructor: [`src/runtime/webcore/Blob.rs#L686-L692`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/webcore/Blob.rs#L686-L692).
3. **Source and pipeline state.** Each image stores its source, decoded-header state, and a fixed pipeline. Defaults include `autoOrient: true`, unset target dimensions, and a maximum-pixel limit: [`src/runtime/image/Image.rs#L57-L94`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L57-L94).
4. **A fixed transform plan, not an arbitrary operation log.** Setters overwrite slots, and execution order is fixed as auto-orient → rotate → flip/flop → resize → modulate. The output format defaults to the source format: [`src/runtime/image/Image.rs#L192-L209`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L192-L209). This means fluent call order does not necessarily equal transform order.
5. **Metadata fast path.** In-memory data is header-probed directly; file-path metadata goes through asynchronous work: [`src/runtime/image/Image.rs#L927-L979`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L927-L979).
6. **Terminal snapshots and worker dispatch.** Awaited terminal operations snapshot the pipeline, pin the input, and schedule a `jsc::Job<PipelineTask>` on Bun's work pool: [`src/runtime/image/Image.rs#L1112-L1158`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L1112-L1158).
7. **Safe path opening and decode.** The worker checks file type, applies a 256 MiB encoded-file cap, probes the header, can pass a JPEG downscale hint into decode, performs EXIF orientation, and then runs the fixed pipeline: [`src/runtime/image/Image.rs#L1538-L1765`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L1538-L1765).
8. **Intermediate-size guard.** Before resizing, the implementation checks transformed dimensions to avoid huge intermediate allocations; its comment gives a 17 GiB failure-mode example: [`src/runtime/image/Image.rs#L1942-L1985`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L1942-L1985).
9. **Codec routing.** Header sniffing routes to statically linked JPEG, PNG, and WebP implementations or platform facilities where supported: [`src/runtime/image/codecs.rs#L268-L322`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L268-L322). A pixel-count guard runs before allocation: [`src/runtime/image/codecs.rs#L326-L330`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L326-L330).
10. **Geometry backend.** macOS system-backend builds use vImage for resize; other paths use Highway's runtime SIMD dispatch. The resize path makes one output allocation: [`src/runtime/image/codecs.rs#L658-L690`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L658-L690).
11. **Encoding and ownership handoff.** Format-specific encoders return codec-owned output paired with the matching drop function, then transfer it to JavaScript without an extra encoded-buffer copy: [`src/runtime/image/codecs.rs#L474-L499`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L474-L499), [`src/runtime/image/codecs.rs#L536-L585`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L536-L585).

### Defaults, controls, and external dependencies

| Surface | Pinned behavior | Evidence state | Source |
|---|---|---|---|
| Availability | `Bun.Image` is unconditionally registered; no hidden release flag was found | Code-inspected | [`BunObject.rs#L325-L333`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/api/BunObject.rs#L325-L333) |
| Backend control | `Bun.Image.backend` chooses the exposed backend; compile-time platform gates decide what exists | Code-inspected | [`codecs.rs#L22-L83`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L22-L83), [pinned image docs](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/runtime/image.mdx) |
| Default backend | System backend on macOS and Windows; Bun-native backend on Linux | Code-inspected | [`codecs.rs#L22-L83`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L22-L83) |
| Orientation | `autoOrient` defaults to true | Code-inspected | [`Image.rs#L57-L94`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L57-L94) |
| Resize | Lanczos3, fit `fill`, enlargement allowed unless disabled | Code-inspected | [`Image.rs#L179-L209`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L179-L209) |
| Decode guard | `maxPixels` defaults to `0x3FFF² = 268,402,689` pixels, roughly 1 GiB at four bytes per pixel | Code-inspected | [`codecs.rs#L252-L260`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L252-L260) |
| Encode defaults | Quality 80; PNG compression `-1`; 256 colors; dithering false; progressive false | Code-inspected | [`codecs.rs#L458-L470`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L458-L470) |
| Core formats | Static JPEG, PNG, and WebP; GIF/BMP decode; HEIC/AVIF use platform facilities where present | Code-inspected | [`codecs.rs#L22-L83`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L22-L83), [pinned docs](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/runtime/image.mdx) |
| JPEG dependency | libjpeg-turbo `3.1.4`, commit `e352b02f794f701407b39af08576035ba3360d60`, built statically from selected sources | Code-inspected | [`scripts/build/deps/libjpeg-turbo.ts#L23-L25`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/deps/libjpeg-turbo.ts#L23-L25), [`#L89-L111`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/deps/libjpeg-turbo.ts#L89-L111) |
| PNG dependency | libspng `0.7.4`, commit `fb768002d4288590083a476af628e51c3f1d47cd`, using Bun's zlib-ng | Code-inspected | [`scripts/build/deps/libspng.ts#L1-L40`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/deps/libspng.ts#L1-L40) |
| WebP dependency | libwebp `1.6.0`, commit `b7e29b9d75bd31422b00c2a446d49d7af06c328d`; internal threading disabled in favor of Bun's worker pool | Code-inspected | [`scripts/build/deps/libwebp.ts#L1-L25`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/deps/libwebp.ts#L1-L25), [`#L114-L130`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/deps/libwebp.ts#L114-L130) |
| SIMD dependency | Highway commit `2607d3b5b0113992fe84d3848859eae13b3b52c1` with runtime dispatch | Code-inspected | [`scripts/build/deps/highway.ts#L1-L24`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/deps/highway.ts#L1-L24) |
| OS dependencies | macOS ImageIO/CoreGraphics/vImage; Windows WIC; HEIC/AVIF support depends on OS codecs | Code-inspected | [`codecs.rs#L22-L83`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L22-L83), [pinned docs](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/runtime/image.mdx) |
| Threading exception | Awaited terminals run off-thread; direct `new Response(image)` encoding is synchronous | Code-inspected | [Pinned image docs](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/runtime/image.mdx), [`Image.rs#L1112-L1158`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L1112-L1158) |

### What the upstream tests actually cover

The pinned tests are meaningfully broader than happy-path resizing:

- input integration across `Bun.Image`, `Bun.file`, `Blob`, and `Response`: [`image.test.ts#L145-L179`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/test/js/bun/image/image.test.ts#L145-L179)
- metadata and encode/decode round trips: [`image.test.ts#L237-L266`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/test/js/bun/image/image.test.ts#L237-L266)
- max-pixel, truncated-input, and security cases: [`image.test.ts#L377-L414`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/test/js/bun/image/image.test.ts#L377-L414)
- pipeline order and repeatable terminal behavior: [`image.test.ts#L923-L979`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/test/js/bun/image/image.test.ts#L923-L979)
- backend defaults, backend parity, and HEIC platform gaps: [`image.test.ts#L1548-L1610`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/test/js/bun/image/image.test.ts#L1548-L1610)
- hostile dimensions and intermediate-allocation defense: [`image-adversarial.test.ts#L312-L385`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/test/js/bun/image/image-adversarial.test.ts#L312-L385)
- repeated-operation memory plateau checks: [`image-adversarial.test.ts#L537-L570`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/test/js/bun/image/image-adversarial.test.ts#L537-L570)
- detached, resizable, and shared buffers plus concurrent terminals: [`image-adversarial.test.ts#L644-L740`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/test/js/bun/image/image-adversarial.test.ts#L644-L740)
- reference comparison against Sharp fixtures: [`image-vs-sharp.test.ts#L217-L244`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/test/js/bun/image/image-vs-sharp.test.ts#L217-L244)

## Local reproduction

### Artifact verification

The official `bun-darwin-aarch64.zip` asset was downloaded from the [v1.4.0 release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0).

```console
$ shasum -a 256 /tmp/bun-v1.4.0-darwin-aarch64.zip
c669e97f6164e1c96e0701748db98dfa77492908cbd8394c7557134a735de381  /tmp/bun-v1.4.0-darwin-aarch64.zip

$ /tmp/bun-v1.4.0-darwin-aarch64/bun-darwin-aarch64/bun --revision
1.4.0+34cbb9a40
```

The SHA-256 matched the digest in GitHub's official release metadata.

### Focused upstream tests

Run from a sparse clone pinned at `34cbb9a40b4bd1bd767d134a7065e66c2432a676` with the checksum-verified release binary:

```console
$ /tmp/bun-v1.4.0-darwin-aarch64/bun-darwin-aarch64/bun test ./test/js/bun/image/image.test.ts
97 pass, 0 fail, 407 expect() calls, 246ms

$ /tmp/bun-v1.4.0-darwin-aarch64/bun-darwin-aarch64/bun test ./test/js/bun/image/image-adversarial.test.ts
61 pass, 0 fail, 221 expect() calls, 117ms

$ /tmp/bun-v1.4.0-darwin-aarch64/bun-darwin-aarch64/bun test ./test/js/bun/image/image-kernels.test.ts
37 pass, 0 fail, 6,485 expect() calls, 20ms

$ /tmp/bun-v1.4.0-darwin-aarch64/bun-darwin-aarch64/bun test ./test/js/bun/image/image-vs-sharp.test.ts
29 pass, 0 fail, 29 expect() calls, 19ms
```

Combined local result: **224 passing, 0 failing, 7,142 `expect()` calls across four files**. This is one macOS arm64 run, not a rerun of Bun's cross-platform suite and not evidence for the published performance ratios.

### 1.3.14 versus 1.4.0 feature-boundary check

Using `packages/blog/public/images/backlog-viewer-ui.png` as input, the same script on installed Bun `1.3.14+0d9b296af` and the official 1.4.0 binary:

- loaded a 1,600 × 1,035 PNG;
- resized it to 400 × 259;
- encoded a 20,338-byte WebP;
- produced a 1,226-character PNG data URL placeholder;
- produced byte-identical output in both versions.

The 1.4.0 run reported backend `system`. This is a **Reproduced** one-input check that `Bun.Image` already functioned in 1.3.14; it is not a general parity or performance benchmark.

## Live regressions and proposed fixes

Live state is volatile. The states below were checked at `2026-08-27T00:13:05Z`; issue/PR links intentionally remain live rather than pretending they are repository snapshots.

| Surface | Live state | Evidence state | What is known at cutoff | Adoption implication |
|---|---|---|---|---|
| Windows `Bun.file()` rejected reads | [Issue #39787](https://github.com/oven-sh/bun/issues/39787) **Open**; [PR #39793](https://github.com/oven-sh/bun/pull/39793) **Open** | Reported; fix Proposed | Reporter measured 20/20 silent, exit-zero losses on Windows 1.4.0, 0/20 on Windows 1.3.14, and 0/20 on Linux 1.4.0. Existing-file reads and `node:fs/promises` were not affected. | Canary Windows CLIs that start un-awaited async `main()` flows and rely on rejected `Bun.file` reads. The issue's workaround is an `.exists()` guard; do not present the open PR as shipped. |
| HTTP/2 / gRPC under `bun test` | [Issue #39796](https://github.com/oven-sh/bun/issues/39796) **Open**; [PR #39873](https://github.com/oven-sh/bun/pull/39873) **Open** | Reported; fix Proposed | Reporter observed about 28 seconds without inbound-frame processing or PING responses on 1.4.0 and a canary, while 1.3.14 and Node 22.22.2 passed. It only reproduced under `bun test`; a reduced plain `@grpc/grpc-js` case did not reproduce. | Treat as a high-impact but not yet minimal report. Canary real gRPC integration tests, especially long-lived streams. |
| Parallel test-worker deadlock | [Issue #39987](https://github.com/oven-sh/bun/issues/39987) **Open** | Reported | A roughly 1,100-file suite stalled 2 of 30 randomized `--parallel=4` runs with a 120-second watchdog, versus a reporter-estimated roughly 10% per-run rate on 1.3.14. Also observed once on GitHub Actions Ubuntu. | The rate reportedly improved, but “parallel test fixed” would be too strong. Keep an outer CI watchdog and shard before broad migration. |
| `bun audit fix --latest` downgrade | [Issue #39309](https://github.com/oven-sh/bun/issues/39309) **Open** | Reported | Minimal report shows `aws-sdk` 2.1693.0 downgraded to 1.18.0, changing one low plus one moderate advisory into one high plus one moderate advisory and crossing an API-breaking major boundary. | Run audit fixes in a reviewable branch, inspect manifest and lock diff, and rerun the audit. Do not automate `--latest` unattended while this report is open. |
| Next.js partial prefetching | [Issue #39847](https://github.com/oven-sh/bun/issues/39847) **Open** | Reported | Reporter measured two `NEXT_PRERENDER_INTERRUPTED` unhandled rejections per request with Next 16.3.1 `cacheComponents` + `partialPrefetching`, six over three requests on Bun versus zero on Node, while the page still rendered. | Canary exact Next.js rendering modes; generic “Next.js works” compatibility claims do not bound experimental feature interactions. |

The public [1.4 breaking-change tracker #28792](https://github.com/oven-sh/bun/issues/28792) was also **Open** at the cutoff. It records concrete upgrade boundaries including Node 26.3.0 reporting / `NODE_MODULE_VERSION` 147, baseline-only x64 artifacts, Temporal enabled by default with `BUN_JSC_useTemporal=0` as an escape hatch, a Bun lockfile v2 that older Bun versions cannot read, isolated linker defaults for new monorepos, and changed compiled-executable config loading. These are upgrade-planning facts, not regressions.

## Claim table

| Claim | Product says | Code/test evidence | State | Audit inference | Why it matters |
|---|---|---|---|---|---|
| Bun 1.4 is the Rust release | 1.3.14 last Zig; 1.4.0 first Rust | Release baseline is Rust; allocator and build paths are pinned above | Reported + Code-inspected | This is the cleanest tag-level story | Avoid presenting the entire 1.3.x roundup as new in one tag |
| Rust reduced leak exposure | Ownership/`Drop`, ASAN/LSAN, 128 1.3.14-repro bugs fixed | Mimalloc/system allocator split and ASAN flags are present; PR documents suppressions and full-suite strategy | Reported + Code-inspected | Credible mechanism, but not proof of universal memory safety | The benefit is operational, while FFI/native risk remains |
| Runtime performance improved | 5× lower idle CPU; 13–48% HTTP memory; startup gains | No local performance benchmark run | Reported | Useful directional evidence, not an independently verified ranking | Article must preserve workload and “up to” qualifiers |
| `Bun.Image` replaces common Sharp jobs | Sharp-shaped API and faster highlighted workloads | Global, file bridge, transforms, worker dispatch, codecs, and focused tests are present | Code-inspected + Reproduced for function/tests; speed Reported | A real integrated native pipeline, not a wrapper around installed Sharp | Demonstrates Bun's batteries-included product direction |
| `Bun.Image` is new in 1.4.0 | Release post headline can imply this at a glance | Section is tagged 1.3.14; sample output is byte-identical on 1.3.14/1.4.0 | Reproduced + Reported | False if phrased as “introduced by the 1.4.0 tag” | Release-train chronology is central to honest framing |
| Image terminals stay off the JS thread | Docs say awaited terminals run in a worker | Code snapshots the pipeline and dispatches a work-pool job | Code-inspected | True for awaited terminals; direct `Response(image)` is a synchronous exception | Prevents a blanket “image work never blocks” claim |
| Image safety is designed, not incidental | Max pixels and safe file handling documented | File-size cap, pixel guard, intermediate-dimension guard, hostile tests, memory plateau tests | Code-inspected + Reproduced test subset | Defense-in-depth is substantial on one inspected surface | More meaningful than a speed-only story |
| 1.4 is ready everywhere without canarying | Release emphasizes stability | Five relevant open reports at cutoff; two have open proposed fixes | Reported + Proposed | Stability improved globally can coexist with severe edge regressions | Adoption advice should be workload- and platform-specific |

## Competing theory map

### Maintainer theory: a mechanical port plus the same tests can improve the substrate without changing the product

**Evidence for it**

- The migration was explicitly staged as mechanical before idiomatic refactoring, reducing deliberate semantic churn: [Rust rewrite post](https://bun.com/blog/bun-in-rust).
- Maintainers report all six platforms green and the full suite passing at merge, with no tests skipped or deleted: [Rust rewrite post](https://bun.com/blog/bun-in-rust).
- The new allocator/sanitizer configuration is visible in pinned source, and PR #30875 records leak fixes that flowed from it.
- The local focused image suite passed 224 tests on the release binary, and one image workload stayed byte-identical across 1.3.14 and 1.4.0.
- Maintainers report 128 bugs reproducible in 1.3.14 fixed in 1.4.0 and that a Claude Code build had used the Rust port before public release with little visible disruption.

**What would weaken or disprove it**

- Broad, reproducible semantic drift in ordinary workloads attributable to ported subsystems.
- A sustained stable-release regression rate that outweighs fixes and cannot be bounded to new features.
- Sanitizer gaps that hide rather than eliminate native lifetime errors.

### Rival theory: the rewrite concentrates migration risk, and green tests cannot model all event-loop and ecosystem behavior

**Evidence for it**

- Open stable reports touch event-loop liveness on Windows and inbound HTTP/2 progress specifically under the test runner—state-space interactions that unit suites often miss.
- The HTTP/2 report needs a real client stack and Dockerized gRPC peer; the smaller plain client does not reproduce, showing why compatibility percentages can miss integration-only failures.
- The parallel-runner deadlock reportedly persists at a lower rate despite a prior issue being treated as fixed.
- Native surfaces remain a composition of Rust, C++, JavaScriptCore, networking libraries, codecs, and platform APIs. The rewrite did not erase that boundary complexity.

**What would weaken or disprove it**

- Fast merge and validation of proposed fixes followed by sustained low regression reports across Windows, Linux, macOS, test-runner, and network workloads.
- Public post-release soak data demonstrating that the stable rewrite has fewer high-severity regressions than the prior line.

### Working synthesis

The evidence supports both a **successful substrate migration** and a **need for workload-specific canaries**. Those are not contradictory. The strongest article position is falsifiable: *Bun 1.4's achievement is not that Rust made regressions impossible; it is that the team replaced the engine room while preserving enough behavior to expose migration bugs as bounded edge failures instead of a general product reset.* The open issues are the test of that claim, not material to hide.

## Product map

| Relation | What Bun 1.4 does | Evidence |
|---|---|---|
| Replaces | Separate runtime, package manager, bundler, test runner, and selected package-shaped utilities in workflows that accept Bun's semantics | [Release post](https://bun.com/blog/bun-v1.4) |
| Wraps | JavaScriptCore, native compression/image codecs, OS image stacks, and OS/browser facilities behind Bun APIs | [Rust post](https://bun.com/blog/bun-in-rust), [`codecs.rs`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs) |
| Extends | The JavaScript runtime into assets, automation, scheduling, terminal control, security repair, and multi-process task/test orchestration | [Release post](https://bun.com/blog/bun-v1.4) |
| Relies on | JavaScriptCore; uWebSockets and other native libraries; operating-system codecs and browser engines; Node/npm compatibility expectations | [Rust post](https://bun.com/blog/bun-in-rust), [pinned image docs](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/runtime/image.mdx) |
| May enter | A broader batteries-included native standard library where high-frequency npm tasks become runtime primitives | Inference from the fifteen dependency-displacement examples in the [release post](https://bun.com/blog/bun-v1.4) |

## Adoption decision

**Verdict: adopt by canary, not by ambient upgrade.**

- **Good fit now:** new services, local tooling, asset pipelines, and CI experiments that can pin the exact release, compare Node/Bun output, and roll back quickly.
- **Canary first:** Windows CLIs using `Bun.file`, HTTP/2/gRPC clients exercised under `bun test`, large `bun test --parallel` suites, Next.js 16 partial prefetching, and any workflow that lets `bun audit fix --latest` rewrite manifests.
- **Specific `Bun.Image` guidance:** it is credible for resize/encode/metadata workloads, and its safety/ownership design is stronger than a superficial built-in wrapper. Validate OS-specific codec availability, ICC/format expectations, direct-`Response` blocking behavior, and parity for the exact Sharp operation chain before deleting Sharp.
- **Upgrade mechanics:** rebuild native addons for `NODE_MODULE_VERSION` 147, ensure every collaborator/CI image can read lockfile v2, inspect isolated-linker changes in new monorepos, and account for compiled-executable config changes using the open [breaking-change tracker](https://github.com/oven-sh/bun/issues/28792).

This verdict should change if the linked regressions close with released fixes, or if reproduction against the article's actual target workload contradicts the reporter evidence.

## Source rationale

- [Bun v1.4 official release post](https://bun.com/blog/bun-v1.4): canonical release framing, chronology labels, official benchmarks, compatibility claims, and feature inventory.
- [Bun's Rust rewrite post](https://bun.com/blog/bun-in-rust): canonical migration process, costs, CI counts, leak/performance claims, and explicit 1.3.14/1.4.0 language boundary.
- [GitHub release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0) and [API record](https://api.github.com/repos/oven-sh/bun/releases/tags/bun-v1.4.0): tag, target SHA, timestamps, and artifact digests.
- [Pinned repository tree](https://github.com/oven-sh/bun/tree/34cbb9a40b4bd1bd767d134a7065e66c2432a676): authoritative implementation, docs, dependency pins, and tests at the release baseline.
- [Rust/ASAN PR #30875](https://github.com/oven-sh/bun/pull/30875): maintainer rationale and validation boundary for allocator/sanitizer work.
- [`Bun.Image` PR #30032](https://github.com/oven-sh/bun/pull/30032): feature provenance and benchmark methodology, including cases where Bun did not beat Sharp.
- [Breaking-change tracker #28792](https://github.com/oven-sh/bun/issues/28792): upgrade-specific compatibility boundaries maintained by the project.
- Live issues [#39787](https://github.com/oven-sh/bun/issues/39787), [#39796](https://github.com/oven-sh/bun/issues/39796), [#39987](https://github.com/oven-sh/bun/issues/39987), [#39309](https://github.com/oven-sh/bun/issues/39309), and [#39847](https://github.com/oven-sh/bun/issues/39847), plus proposed fixes [#39793](https://github.com/oven-sh/bun/pull/39793) and [#39873](https://github.com/oven-sh/bun/pull/39873): current adopter reports, clearly separated from locally reproduced facts.

No Wikipedia pages, aggregators, reposted release notes, or search-result summaries are used as factual sources in this artifact.

## Commands and method notes

Repository baseline:

```console
$ git clone --filter=blob:none --no-checkout --depth 1 --branch bun-v1.4.0 https://github.com/oven-sh/bun.git /tmp/bun-1-4-audit
$ git -C /tmp/bun-1-4-audit rev-parse HEAD
34cbb9a40b4bd1bd767d134a7065e66c2432a676
$ git -C /tmp/bun-1-4-audit show -s --format='%H%n%P%n%T%n%aI%n%cI%n%s' HEAD
34cbb9a40b4bd1bd767d134a7065e66c2432a676
cfa9f8e15b4252a08c483711d835dfe56a8b21ab
61453622872e362c02b43a1ec0dc778a9b4a7285
2026-08-20T00:50:33+00:00
2026-08-20T00:50:33+00:00
Fix edgecase in v8 CPU profiler
```

Inspection used `rg`, `sed`, `git show`, GitHub's release API, and primary GitHub issue/PR pages. Only the four focused `Bun.Image` test files and the one-input 1.3.14/1.4.0 comparison were reproduced locally. All suite-wide, benchmark, production, agent-count, token-count, issue-reporter, and proposed-fix claims retain their non-reproduced evidence labels.
