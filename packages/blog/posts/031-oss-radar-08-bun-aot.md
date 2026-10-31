---
title: "OSS Radar #08: Bun AOT — Don't Rewrite TypeScript in Rust Yet"
seoTitle: "Bun AOT: Before You Rewrite TypeScript in Rust"
alternativeHeadline: "Bun AOT cuts memory, run time and executable size on existing TypeScript applications, with limits for servers and dependencies"
date: "2026-10-27"
lastModified: "2026-10-31"
description: "Bun AOT made my TypeScript compiler 3.3× faster with 64% less peak memory. A server executable shrank from 121.5 MB to 30.3 MB with AOT and --trim."
section: oss-radar
tags: [oss-radar, bun, typescript, rust, performance]
researchFootprint:
  sessions: 1
  artifacts: 6
  totalTokens: 36800373
  inputTokens: 36723676
  cachedInputTokens: 36072064
  outputTokens: 76697
  reasoningOutputTokens: 27036
  wallClockMinutes: 46
  startedAt: "2026-10-27T14:49:02.355Z"
  measuredAt: "2026-10-27T15:34:24.348Z"
  provenanceUrl: "https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot"
  scope: "One linked session through the frozen research cutoff, including experiments, writing and publication preparation. Tokens count cumulative usage epochs, including cached input; elapsed time is not human hands-on time. Six committed Markdown research artifacts, plus reproduction sources and numeric results. Prompts are omitted at the author's request. Private logs stay private; the linked manifest records accounting and prefix commitments. Later deployment checks and the October 31 application trials are outside this cutoff."
---

# Bun AOT: Don't Rewrite TypeScript in Rust Yet

The TypeScript compiler I tested finished **3.3× faster with 64% less peak physical memory**, without rewriting its source. My server executable shrank from **121.5 MB with JIT to 51.8 MB with AOT, then 30.3 MB with `--trim`**.

Before moving a TypeScript application to Rust for efficiency, I would try Bun's ahead-of-time compiler.

That recommendation has limits:

- My database API used roughly half the memory, but served fewer warmed requests.
- Faster startup does not promise faster warmed requests.
- This preview still needs plugin and packaging checks.

[Peter Steinberger's report](https://x.com/steipete/status/2114879798434758905) raised three questions: does it help long-running servers, where does the RAM go, and what breaks? I tested an official preview on macOS arm64. [Code, conditions and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot).

## How much RAM does it save?

I built TypeScript 6.0.3 twice with the same Bun revision, using Bun's just-in-time compiler (JIT) and AOT. Both checked the pinned Effect source successfully. Five alternating runs per build, after warming the filesystem, gave these medians:

| TypeScript 6 checking Effect | Bun JIT | Bun AOT |
| --- | ---: | ---: |
| Elapsed time | 5.02 s | 1.54 s |
| Peak physical footprint | 2,625 MB | 934 MB |
| Peak RSS | 2,742 MB | 980 MB |

These are decimal MB. Physical footprint and RSS (resident set size) are separate macOS measurements; both fell about 64%. Neither measures executable size, JavaScript heap size, or Rust performance.

The small server saved less. Across two million measured requests per process, its median peak RSS fell from **51.6 MB to 46.9 MB**, about **9%**. Every response matched. Peter's halving is a report about his application; it isn't a multiplier to apply to yours.

## Where does memory go before the JIT gets hot?

[One reader asked exactly that](https://x.com/gyankarn/status/2115022381358166098). Removing hot optimized code cannot explain every startup saving.

Bun uses types for fixed object layouts and direct field access, checking values it cannot prove fit. Static code needs no runtime parsing or bytecode generation; code and read-only tables can share executable pages. Some runtime structures wait until needed. Eligible object references take four bytes instead of eight. [The implementation explains these mechanisms](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/internals.mdx).

I tested that last contribution by rebuilding the compiler with `--aot-huge-heap`, which uses 64-bit references. In a separate three-pair control, median peak physical footprint rose from **951 MB to 1,303 MB**. Narrow references contribute materially; they don't explain the whole JIT-to-AOT difference.

There is still a garbage collector and runtime. And shareable code can still count in RSS. Ask which memory metric fell before translating a screenshot into server capacity.

## Does it stay faster after warm-up?

Sometimes. After 20,000 warm-up requests, my tiny typed-object API served **197,000 requests/second** with AOT versus **186,000** with JIT: about **6% faster**, across five alternating pairs. That falls far short of a universal 2–3×. The application follow-ups below add framework and database cases.

[Bun's comparisons also include warmed JIT wins](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/aot.mdx). JIT learns from incoming objects; AOT needs enough proof at build time.

Dependencies matter too. A whole process doing two million successful validations of a small Zod 4.3.6 schema took **0.278 seconds under AOT versus 0.0586 under JIT**. Zod's jitless setting helped AOT, but still didn't beat JIT in this test. [Runtime-generated functions are interpreted](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/compatibility.mdx#code-from-strings); working code can become slower.

Measure the application after warm-up, including its validators. A faster gateway also won't make a remote model generate tokens faster, as [Peter points out](https://x.com/steipete/status/2114881876322312359).

## Can I ship it today?

Try a test deployment first. [The AOT pull request merged October 27](https://github.com/oven-sh/bun/pull/45631); my follow-ups use an October 29 canary. [OpenClaw's reloadable plugins needed work at launch](https://x.com/steipete/status/2114885726701785500).

My computed-import test loaded plugins included at build time. Loading an unembedded plugin from disk required an opt-in; that code is interpreted. The October 29 canary passes my original [CommonJS/declaration-file fixture](https://github.com/oven-sh/bun/issues/47044), which crashed the first preview. The wider report remained open at the October 31 check.

The server's AOT executable was **51.8 MB** before trimming and **30.3 MB** afterward. [Trimming removes unused runtime features](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/size.mdx). It barely changed the server's warmed RSS: savings on disk and in RAM need separate measurements.

[My Bun 1.4 review](/oss-radar-05-bun-1-4) covered the runtime's Rust rewrite. AOT targets the applications running on it. These tests do not establish TypeScript/Rust equivalence. Bun's original server comparison put Rust ahead in throughput and memory.

Before an efficiency-driven rewrite, use `bun build` to compare your usual executable with `--compile --bytecode --format=esm` and `--compile --aot`. Check outputs, warmed performance, memory and plugin paths before keeping a build.

---

## Sources and evidence

The [October 31 application trials](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/validation-2026-10-31) test code generation, frameworks and a PostgreSQL API separately:

| Check | Finding |
| --- | --- |
| Prebuilt validation | With matching outputs, one million valid nested checks fell from **264 ms to 50 ms** under AOT; regular Bun took **34 ms**. The raw module changes returned data, defaults and errors. |
| Elysia and Hono | At eight connections: about **30% less physical memory after warm-up**, with throughput from **5% slower to 7% faster**. Small changes overlap run variation. |
| PostgreSQL API | Roughly **half the server memory**, but **12–21% fewer requests** on the database routes at eight connections. Prebuilding routes recovered most validation throughput. |
| API with bytecode | JIT startup fell from **29.2 ms to 14.8 ms** (native AOT: **11.3 ms**), while retaining JIT-like warmed throughput. |

The database tests repeatedly read one cached user; server memory excludes PostgreSQL. The memory gap persisted in two one-minute runs per mode, which is no proof of permanent savings.

| Source | What it establishes |
| --- | --- |
| [Reproduction and question map](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot) | Versions, methods, failures and local measurements. |
| [Bun AOT proposal](https://github.com/oven-sh/bun/pull/45631) | Preview status and maintainer rationale. |
| [Pinned compiler docs](https://github.com/oven-sh/bun/tree/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler) | Memory mechanisms, compatibility, size and comparison conditions. |

Checked October 31, 2026. Original measurements use Bun `06888611e`; application follow-ups use `da867c60b`. Both are macOS arm64 previews, without stable-release guarantees.
