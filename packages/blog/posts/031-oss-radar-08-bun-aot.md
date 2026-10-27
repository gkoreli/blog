---
title: "OSS Radar #08: Bun AOT — Don't Rewrite TypeScript in Rust Yet"
seoTitle: "Bun AOT: Before You Rewrite TypeScript in Rust"
alternativeHeadline: "Bun AOT cuts memory, run time and executable size on existing TypeScript applications, with limits for servers and dependencies"
date: "2026-10-27"
lastModified: "2026-10-27"
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
  scope: "One linked session through the frozen research cutoff, including experiments, writing and publication preparation. Tokens count cumulative usage epochs, including cached input; elapsed time is not human hands-on time. Six committed Markdown research artifacts, plus reproduction sources and numeric results. Prompts are omitted at the author's request. Private logs stay private; the linked manifest records accounting and prefix commitments. Later deployment checks are outside this cutoff."
---

# Bun AOT: Don't Rewrite TypeScript in Rust Yet

The TypeScript compiler I tested finished **3.3× faster with 64% less peak physical memory**, without rewriting its source. My server executable shrank from **121.5 MB with JIT to 51.8 MB with AOT, then 30.3 MB with `--trim`**.

Before moving a TypeScript application to Rust for efficiency, I would try Bun's ahead-of-time compiler.

That recommendation has limits:

- The memory saving can be substantial, but it isn't always half.
- Faster startup does not promise faster warmed requests.
- This is a preview with real compatibility failures.

[Peter Steinberger's report](https://x.com/steipete/status/2114879798434758905) drew the questions I wanted answered: does it help long-running servers, where does the RAM go, and what breaks? I read the replies and tested an official Bun AOT preview on macOS arm64. [The code, conditions and results are here](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot).

## How much RAM does it save?

I built TypeScript 6.0.3 from the same source twice, using the same Bun revision: one executable with its just-in-time compiler, one with AOT. Both checked the pinned Effect source successfully. Five alternating measured runs per build, after warming the filesystem, gave these medians:

| TypeScript 6 checking Effect | Bun JIT | Bun AOT |
| --- | ---: | ---: |
| Elapsed time | 5.02 s | 1.54 s |
| Peak physical footprint | 2,625 MB | 934 MB |
| Peak RSS | 2,742 MB | 980 MB |

Those are decimal MB. Physical footprint and RSS (resident set size) are separate macOS measurements; both fell about 64% here. They aren't the executable's size, JavaScript heap size, or a Rust comparison.

The small server saved less. Across two million measured requests per process, its median peak RSS fell from **51.6 MB to 46.9 MB**, about **9%**. Every response matched. Peter's halving is a report about his application; it isn't a multiplier to apply to yours.

## Where does memory go before the JIT gets hot?

[One reader asked exactly that](https://x.com/gyankarn/status/2115022381358166098). Removing hot optimized code cannot explain every startup saving.

Bun uses types to choose fixed object layouts and direct field access, with checks where it cannot prove a value fits. Statically compiled code needs no runtime parsing or bytecode generation. Its native code and read-only tables live in the executable, with pages the operating system can share. Some runtime structures are created only when used. Eligible object-reference fields take four bytes instead of eight. [The implementation explains these mechanisms](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/internals.mdx).

I tested that last contribution by rebuilding the compiler with `--aot-huge-heap`, which uses 64-bit references. In a separate three-pair control, median peak physical footprint rose from **951 MB to 1,303 MB**. Narrow references contribute materially; they don't explain the whole JIT-to-AOT difference.

There is still a garbage collector and runtime. And shareable code can still count in RSS. Ask which memory metric fell before translating a screenshot into server capacity.

## Does it stay faster after warm-up?

Sometimes. My tiny API traverses typed objects. After 20,000 warm-up requests, AOT served about **197,000 requests/second**, versus **186,000** with JIT: roughly **6% faster**, across five alternating pairs. That is useful, and far from a universal 2–3×. This was a custom microserver on one laptop, not a framework or production benchmark.

Bun's own [framework comparisons](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/aot.mdx) include warmed workloads where JIT wins. It can learn from the objects that actually arrive; AOT must prove enough at build time or retain slower paths.

Dependencies matter too. Two million successful validations of one small Zod 4.3.6 schema took **0.278 seconds under AOT versus 0.0586 under JIT**. Zod's jitless setting helped AOT, but still didn't beat JIT in this test. [Runtime-generated functions are interpreted](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/compatibility.mdx#code-from-strings); working code can become slower.

Measure the application after warm-up, including its validators. A faster gateway also won't make a remote model generate tokens faster, as [Peter points out](https://x.com/steipete/status/2114881876322312359).

## Can I ship it today?

Try it on a test deployment first. On October 27, [the AOT pull request remained open](https://github.com/oven-sh/bun/pull/45631). Peter [used his own fork](https://x.com/steipete/status/2114933452357452194), and [OpenClaw's reloadable plugins still needed work](https://x.com/steipete/status/2114885726701785500).

My computed-import test loaded plugins included at build time. Loading an unembedded plugin from disk required an opt-in; that code is interpreted. I also reproduced [a reported CommonJS/declaration-file case](https://github.com/oven-sh/bun/issues/47044): plain compilation worked, while the pinned AOT compiler crashed during the build.

The server's AOT executable was **51.8 MB** before trimming and **30.3 MB** afterward. [Trimming removes unused runtime features](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/size.mdx). It barely changed the server's warmed RSS: savings on disk and in RAM need separate measurements.

[My Bun 1.4 review](/oss-radar-05-bun-1-4) covered the runtime's Rust rewrite. AOT targets the applications running on it. It hasn't made TypeScript equivalent to Rust. Bun's own server comparison still puts Rust ahead in throughput and memory.

If your reason for a rewrite is startup, CPU or RAM, try the same entry point with `bun build --compile` and `bun build --compile --aot`. Check identical outputs, warmed performance, memory and plugin paths. Keep the faster, smaller result only if it also runs your application correctly. That experiment is worth doing before a rewrite.

---

## Sources and evidence

| Source | What it establishes |
| --- | --- |
| [Reproduction and question map](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot) | Versions, methods, failures and local measurements. |
| [Bun AOT proposal](https://github.com/oven-sh/bun/pull/45631) | Preview status and maintainer rationale. |
| [Pinned compiler docs](https://github.com/oven-sh/bun/tree/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler) | Memory mechanisms, compatibility, size and comparison conditions. |

Research checked October 27, 2026. The measurements use Bun `1.4.4-canary.1+06888611e`; they are not stable-release guarantees.
