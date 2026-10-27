# Bun AOT testing: source note

Historical capture, checked 2026-10-27. Later reproductions and the accepted measurements supersede its pending experiment status: see [the claim audit](03-claim-audit.md), [reproduction records](repro/README.md) and [final review](04-review-and-acceptance.md). Additional source supplied by Goga:
https://x.com/jarredsumner/status/2114930223024361680

This is a 68.9-second video attached to Jarred Sumner's post of October 26. The downloaded media has a video stream and no audio stream. Text was extracted with Apple Vision at eight frames per second (551 frames); selected numerical claims were also checked visually. OCR can miss or misread brief text. No compiler tests or benchmarks were reproduced in this session.

## Claims and evidence

| Claim | Video location | Evidence state | Limits and use |
| --- | --- | --- | --- |
| Generated-program testing, with an on-screen count of 145,811 programs | About 13–14 seconds | Reported | A displayed run/corpus count, not an independently verified coverage measure. |
| Fuzzilli testing, with TypeScript annotations that can be accurate, vague, false, or absent; eight million programs in 21 hours | About 24–42 seconds | Reported | The video demonstrates examples and reports volume. It does not independently establish completeness or compiler correctness. |
| 37 build configurations should produce the same result | About 43–45 seconds | Reported; related harness code inspected | Configurations include collection stress, inlining changes, prediction failures, and verification. Do not infer every case runs in all configurations on every commit. |
| 1,480 Bun test files are compared test by test | About 46–47 seconds | Reported | A reported bounded test-file count. |
| Six framework fixtures receive 157 requests; 81 OSS projects and their own suites are exercised | About 48–55 seconds | Reported | Tested fixtures/suites do not establish compatibility with all applications using those dependencies. |
| The runner compares AOT results with ordinary execution and additionally compiles TypeScript with types erased | Runner code | Code-inspected | Expected-output files cover intentional differences; this is not an unconditional promise that every program is identical. |

## Pinned code

Baseline: `oven-sh/bun`, branch `claude/compile-aot-on-check`, commit `06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea`, established in the preceding research turn.

- [Test runner](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/test/aot/run-programs.ts#L905): `run()` builds the test variants, obtains the reference result, and compares results with `toEqual`; cases with stored expectations follow those instead.
- [Test groups and operating conditions](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/test/aot/README.md): documents collection stress, variants, suite comparisons, and sampling. Full runs differ from sampled CI runs.
- [Compatibility](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/compatibility.mdx): records intentional behavior changes and platform limits.
- [AOT proposal and benchmarks](https://github.com/oven-sh/bun/pull/45631): live PR; recheck state and select a fresh baseline before an article audit.

## Article implication

The source supports a section on how Bun tests whether TypeScript-directed optimization preserves JavaScript behavior, including cases where annotations misdescribe runtime values. It increases the substance available for an OSS Radar investigation. It does not establish general Rust performance equivalence, universal npm compatibility, or readiness for production.

Next bounded action: select one generated counterexample and one real application, inspect their complete harness paths, and reproduce correctness plus startup, warmed throughput, memory, and build-cost measurements on a pinned AOT build.

## Owner direction: reader questions and persistent memory savings

Goga supplied a screenshot of a discussion asking whether speed gains survive JIT warm-up and why memory could be halved immediately. He wants the article to answer and test these practical questions, with particular emphasis on the reported persistent RAM saving.

The article's governing question is whether Bun AOT makes an existing TypeScript application efficient enough to avoid a rewrite. Lead with the memory result when reproduced; explain startup and warmed throughput separately. Preserve the author's enthusiasm without converting the report into a universal 50% guarantee.

| Reader question | Current answer | Required evidence |
| --- | --- | --- |
| Is 2–3x speed mostly startup? | It depends on workload. Existing server comparisons show warm throughput can lose to JIT. | Same runtime revision, same source, separate cold and warmed measurements. |
| Why could memory fall before optimizing JIT tiers run? | AOT also avoids parsing/bytecode work for statically compiled code; uses file-backed read-only code and tables with lazy initialization; uses compact object slots and 32-bit references in eligible fields. These mechanisms exist before hot tier compilation. | Inspect engine paths and profile the target app. Mechanisms alone do not assign the observed MB saving to individual causes. |
| Does half RAM mean half the application's data? | No fixed ratio follows. Retained application data, buffers, caches and load affect the total. | Record idle, ready, warmed, sustained-load and recovery measurements at equivalent application state. |
| Which memory figure is halved? | RSS and private memory can move by different ratios. The pinned overview reports Express RSS 83.5 to 54.7 MB and peak private memory 51.0 to 23.4 MB under its stated conditions. | State platform, metric and sampling phase beside every number. |
| Can the warmed JIT be faster while AOT still uses less memory? | Yes; throughput and memory are independent outcomes in the documented comparisons. | Measure both rather than infer one from the other. |

Mechanism source: [compiler internals](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/internals.mdx), especially the object model, image/startup and 32-bit reference sections. Result source: [AOT overview](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/aot.mdx). Do not attribute Peter's precise reduction to any one mechanism without his configuration and a memory breakdown.

Proposed acceptance experiment, not completed: compare AOT with the same revision's JIT executable, verify outputs, then record startup and memory through ready, warm-up, a fixed sustained workload, and recovery. Collect per-process RSS and private/PSS accounting where available; keep aggregate multi-process accounting separate so shared executable pages are not double-counted. Vary retained application data separately from request rate. A sustained-memory claim needs repeated comparable-state samples, not just a startup reading or one peak value.

Local acquisition: `/tmp/bun-aot-testing-2114930223024361680-network/`; OCR: `/tmp/bun-aot-testing-2114930223024361680-ocr-network/`; visually checked count sheet: `/tmp/bun-aot-testing-key-counts.jpg`. Raw media and operational artifacts remain outside Git.
