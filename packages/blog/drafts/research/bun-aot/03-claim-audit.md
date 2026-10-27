# Claim audit, product theory and experiment conditions

Check date 2026-10-27. Baselines and artifact verification are in [the worklist](00-worklist-index.md). Research questions are in [the source map](02-reader-questions.md).

## Claim table

| Claim | Product or report | Code/test | Evidence state | Inference | Why it matters |
| --- | --- | --- | --- | --- | --- |
| Bun AOT emits native code before deployment | AOT proposal and docs | Official CI binary builds working standalone executables; driver and engine image loader inspected | Reproduced; code-inspected | These programs can ship without an installed Bun | Single-file packaging alone is not proof of native compilation; this experiment uses `--aot`. |
| The memory result can exceed a halving | Peter reports halving on his fork | TypeScript 6 on Effect: five measured pairs after one warm-up pair, AOT median peak physical footprint 934,413,800 bytes versus JIT 2,624,866,896 bytes | Reproduced | Avoiding a rewrite deserves measurement before assuming it is required | The result applies to this application and preview build on macOS arm64. |
| AOT speeds this compiler workload substantially | Maintainer's compiler benchmark | Same TypeScript source entry, same Bun, same Effect config: AOT 1.54 s, JIT 5.02 s median | Reproduced | This is enough to change a CLI deployment decision | It is not a local Rust comparison or a warmed-server benchmark. |
| An annotation is not blindly trusted at runtime | Internals distinguish facts from predictions | JSON string passed through a `number` parameter remains a string and multiplies to 6 under both executables | Reproduced | AOT need not redefine ordinary coercion to use types | One counterexample checks one contract, not full language conformance. |
| Four-byte object references contribute to savings | Internals describe Cell32 | Bun's pinned WebKit `MarkedBlockCage::encode/decode`; compiler control changes references with `--aot-huge-heap` | Code-inspected; reproduced | More than JIT machine code contributes to memory differences | The control changes representation and potentially allocation/GC behavior; do not assign the entire JIT/AOT gap to pointer compression. |
| File-backed read-only native code can reduce private allocation | Internals image model | `AOTImageLoading.cpp::mapCode` maps the executable descriptor with read/execute protections | Code-inspected | Code pages can be shared; private footprint and RSS differ | Shareable pages can still count in per-process RSS. No process-tree capacity test was run. |
| Halving is not universal | The supplied discussion asks about other apps | Small server at 100,000 retained objects: longer matched load shows far smaller RSS saving | Reproduced | Report the metric and workload beside the number | Do not treat byte size or compiler peak footprint as the server's RSS. |
| Warmed throughput is not a universal 2–3x | Maintainer docs publish losses on some frameworks | Local typed microserver: five alternating pairs, 20,000 warm-up requests then two million measured requests per process | Reproduced | Startup and throughput need separate answers | Custom tiny API on a shared laptop; not a framework, Node or production test. |
| Runtime-generated validators can lose speed | Jarred identifies `new Function` | Zod 4.3.6, two million successful parses: default AOT 0.278 s, JIT 0.0586 s median | Reproduced | Test actual dependencies and settings | The jitless setting also loses to JIT here; it is not equivalent to build-time-generated validation. |
| Built-ins have intentional compatibility restrictions | Compatibility docs | Reflect.set of Array.prototype.push returns true on JIT, false on AOT | Reproduced | Some valid JavaScript changes behavior by design | Reflect.set returns false; ordinary assignment can throw. Do not claim this exact test threw. |
| Computed imports and late plugins differ | Compatibility docs | Dedicated plugins-folder prefix loads compiled alpha; explicit entry point loads relatively; unembedded absolute path needs disk-code opt-in | Reproduced | Hot-reloadable application plugins need a separate migration check | The initial root-folder `./` glob failed under both JIT and AOT. Do not silently turn that into a unique AOT failure. |
| The preview has a concrete compiler failure | Issue 47044 is open at check time | Its CJS/sibling-declaration reproducer aborts both AOT and AOT+trim builds on this baseline; plain compiled executable prints 42 | Reproduced | A trial recommendation is stronger than a production swap recommendation | State the failing case; do not extrapolate to all CommonJS modules. No upstream message or report was posted. |
| Trimming saves disk bytes independently of RAM | Size docs distinguish flags | Small server: JIT 121,463,442 bytes, AOT 51,848,850, AOT+trim 30,333,730; AOT versus trimmed warmed RSS nearly equal | Reproduced | A smaller file does not establish the same RAM reduction | Five short comparison pairs are sufficient for this bounded observation, not a universal identity. |
| Some builds are reproducible byte for byte | Reader question | Three same-input/same-output-path AOT+trim builds have identical SHA-256 | Reproduced | Determinism can be tested | One fixture and platform, not every app or build environment. |
| OpenClaw is not a released drop-in AOT migration | Peter's replies | He identifies his fork and hot-reloadable plugin work | Reported | Readers should not confuse a trial report with release availability | No local OpenClaw migration was run. |

## Reconstruct the bet

| Theory | Whose view | For | Against or limit | Direction state | Disproof test |
| --- | --- | --- | --- | --- | --- |
| Native compilation of existing typed code can avoid application rewrites | Maintainer's stated motivation; author's decision under test | Integrated type checker, fixed layouts, source compiler reproduction | Retains GC/runtime, build cost and compatibility restrictions | Stated; implemented in the preview | On a real tool, equal outputs but no useful time or memory improvement under matched conditions |
| AOT is chiefly a startup, packaging and memory option; warm JS servers still need JIT | Plausible operator reading | Small warm-server gains; generated-validator regression; maintainer framework losses | TypeScript compiler also saves substantial CPU, so startup alone does not explain all useful gains | Author's interpretation of reproduced and reported evidence | Repeated representative warm applications improve broadly without costly source/library changes |

The article should give one decision: try AOT before an efficiency-driven rewrite, while measuring the actual program and preserving a JIT fallback during the preview. Neither theory supports universal Rust equivalence.

## Product map

| Role | Layer | Basis |
| --- | --- | --- |
| Replaces | Parsing/JIT compilation for the code visible at build time; potentially the performance reason for some rewrites | Compiler/image path and measurements |
| Wraps | Existing application source, npm modules and Bun runtime APIs | Both standalone build paths |
| Extends | Type information into layout and code generation, instead of erasing it before execution | Front end, flow/layout model |
| Relies on | Bun's runtime, JavaScriptCore, native system APIs and garbage collection | Pinned engine and compatibility docs |
| May enter | More libraries shipping analyzable typed sources or doing generation at build time | Enabled by compiler design; not a promise of ecosystem adoption |

## Measurement conditions and limits

- Host: macOS 27.0.1, Darwin arm64, shared developer laptop. No CPU affinity or exclusive-machine claim. No production traffic or model inference.
- Runtime: official preview artifact identified and hashed in the worklist. All compared executables in each experiment use that same runtime revision.
- Compiler: TypeScript 6.0.3 tagged source, its ordinary generated diagnostic file produced with the repository's own generator, no handwritten compiler changes. Both builds use the same source entry, production defines and library path. The workload uses Effect's pinned source and explicit nonincremental checking options. Every measured run exits zero, sees 688 files and 371,335 TypeScript lines. One pair warms the filesystem; five alternating pairs count. Extended diagnostics are enabled in both. `/usr/bin/time -l` records wall, CPU, peak RSS and peak physical footprint; these metrics must retain their names.
- Compiler pointer control: one warm-up pair and three measured pairs, default AOT versus `--aot-huge-heap`. This is a separate run series, with its own default control, not an extra JIT comparison.
- Server: custom Bun.serve microserver retains typed linked objects, answers state and traverses 1,000 links per measured request. Five alternating pairs use eight native C client threads, 20,000 warm-up requests and two one-million-request windows per process. Every response body is checked, and response hashes match across modes. RSS is sampled every approximately 200 ms while the server runs. The test covers seconds and request volume, not a days-long production soak.
- The earlier small-server memory sweep used a Python client only for behavior/allocation, so its timings must not be used as server-throughput results. Its startup rows overlapped compiler preparation; the later native-client experiment supplies the accepted server timing.
- Validator: Zod 4.3.6, a three-field schema and two valid input objects parsed from JSON. Two million successful safeParse calls per fresh process; one warm-up series, five measured alternating series, end-to-end monotonic wall time. Payload validity and stdout checked. This does not benchmark invalid-input reporting or a complete HTTP endpoint.
- Raw logs, crash traces and binary artifacts stay outside Git. Public result JSON is a numeric experiment record with methods and hashes, not a private production capture.

## Source paths

- [Bun driver](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/src/aot/compile.rs): source/check/link/engine compilation state.
- [Pinned WebKit version](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/scripts/build/deps/webkit.ts#L6): engine baseline, rather than a second arbitrary revision.
- [Object format](https://github.com/oven-sh/WebKit/blob/3c80db265b51f90243aba1fa141e03d551a6e80b/Source/JavaScriptCore/aot/object/AOTCellFormat.h): fixed field/header offsets.
- [Narrow references](https://github.com/oven-sh/WebKit/blob/3c80db265b51f90243aba1fa141e03d551a6e80b/Source/JavaScriptCore/heap/MarkedBlockCage.h): four-byte encode/decode implementation.
- [Image loading](https://github.com/oven-sh/WebKit/blob/3c80db265b51f90243aba1fa141e03d551a6e80b/Source/JavaScriptCore/aot/image/AOTImageLoading.cpp#L123): file-backed mapping and protections.
- [Compiler internals](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/internals.mdx): ties the code mechanisms to types, objects, initialization and collection.
- [Compatibility](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/compatibility.mdx): restrictions and plugin/native-addon paths.
- [Executable size](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/size.mdx): separates AOT from trimming.
- [AOT overview and framework comparisons](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/aot.mdx): existing benchmark counterevidence, including Rust comparisons.
- [Issue 47044](https://github.com/oven-sh/bun/issues/47044): reported CJS case, reproduced locally; open at check time.

## Dependency trace and final source-state check

Zod 4.3.6 npm metadata identifies `ca3c8629c0c2715571f70b44c2433cad3db7fe4e` as its gitHead. The installed source path runs `safeParse` into object parsing, whose fast path uses generated code unless jitless is set. [Its pinned Doc.compile implementation](https://github.com/colinhacks/zod/blob/ca3c8629c0c2715571f70b44c2433cad3db7fe4e/packages/zod/src/v4/core/doc.ts) calls `new F`, where `F = Function`. The Bun compatibility document establishes that runtime-generated code is interpreted; the local benchmark establishes the regression. The trace does not attribute every nanosecond of that regression to one mechanism.

Immediately before publication on October 27, PR 45631 remains open and unmerged, with live head `d01f72b4adf66ddd9337553a94b283b49156591a`. Issue 47044 remains open. Experiments and code citations deliberately retain the earlier verified `06888611` baseline; the article makes no claim about behavior of the later head.

## Positioning

Reader language comes directly from the linked questions: half the RAM, cold start, long-running servers, dynamic imports and avoiding rewrites. The proposed title is a recommendation to measure Bun AOT before a Rust rewrite, not a claim of language equivalence. The payoff is a bounded adoption decision backed by a compiler reproduction, a warm-server control, a library regression and a failing compatibility case. No search-volume or traffic claim is made.

The earlier Bun 1.4 article explains the runtime's Rust rewrite and larger built-in toolchain. Link it only for that relationship; the new article's subject is application AOT compilation.
