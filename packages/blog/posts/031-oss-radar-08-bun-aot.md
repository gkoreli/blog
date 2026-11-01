---
title: "OSS Radar #08: Bun AOT — Don't Rewrite TypeScript in Rust Yet"
seoTitle: "Bun AOT: Before You Rewrite TypeScript in Rust"
alternativeHeadline: "Bun AOT cuts memory, run time and executable size on existing TypeScript applications, with limits for servers and dependencies"
date: "2026-10-27"
lastModified: "2026-11-01"
description: "Bun AOT made my TypeScript compiler 3.3× faster with 64% less peak memory. A server executable shrank from 121.5 MB to 30.3 MB with AOT and --trim."
section: oss-radar
series:
  id: bun-aot-field-notes
  title: Bun AOT field notes
  order: 1
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
  scope: "One linked session through the frozen research cutoff, including experiments, writing and publication preparation. Tokens count cumulative usage epochs, including cached input; elapsed time is not human hands-on time. Six committed Markdown research artifacts, plus reproduction sources and numeric results. Prompts are omitted at the author's request. Private logs stay private; the linked manifest records accounting and prefix commitments. Later deployment checks and application trials are outside this cutoff."
---

# Bun AOT: Don't Rewrite TypeScript in Rust Yet

The TypeScript compiler I tested finished **3.3× faster with 64% less peak physical memory**, without rewriting its source. My server executable shrank from **121.5 MB with JIT to 51.8 MB with AOT, then 30.3 MB with `--trim`**.

Try compiling your TypeScript before rewriting it in Rust.

That recommendation has limits:

- My database API used roughly half the memory, but served fewer warmed requests.
- Faster startup does not promise faster warmed requests.
- A Next.js variant answered its static page faster, but handled **78% fewer requests** on a dynamic JSON route.

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

Try a test deployment first. [The AOT pull request merged October 27](https://github.com/oven-sh/bun/pull/45631); my follow-ups use October 29 and November 1 canaries. [OpenClaw's reloadable plugins needed work at launch](https://x.com/steipete/status/2114885726701785500).

My computed-import test loaded plugins included at build time. Loading an unembedded plugin from disk required an opt-in; that code is interpreted. The October 29 canary passes my original [CommonJS/declaration-file fixture](https://github.com/oven-sh/bun/issues/47044), which crashed the first preview. The wider report remained open at the November 1 check.

The server's AOT executable was **51.8 MB** before trimming and **30.3 MB** afterward. [Trimming removes unused runtime features](https://github.com/oven-sh/bun/blob/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler/size.mdx). It barely changed the server's warmed RSS: savings on disk and in RAM need separate measurements.

[My Bun 1.4 review](/oss-radar-05-bun-1-4) covered the runtime's Rust rewrite. AOT targets the applications running on it. These tests do not establish TypeScript/Rust equivalence. Bun's original server comparison put Rust ahead in throughput and memory.

Try the macOS-tested [comparison tool](/downloads/bun-aot-check-0.1.0.zip) on your own server. It checks responses and compares regular Bun, bytecode and AOT on startup, requests, memory, CPU and file size. [Instructions and limits](https://github.com/gkoreli/blog/tree/main/packages/blog/tools/bun-aot-check).

The [Express and Fastify follow-up](/bun-aot-express-fastify-serializers) measures CPU per completed request and tests generating Fastify’s serializer before the native build.

---

## Sources and evidence

The [application trials](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/validation-2026-10-31) and [multiple-copy checks](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/practical-2026-10-31) answer different decisions:

| Check | Finding |
| --- | --- |
| Prebuilt validation | With matching outputs, one million valid nested checks fell from **264 ms to 50 ms** under AOT; regular Bun took **34 ms**. The raw module changes returned data, defaults and errors. |
| Elysia and Hono | At eight connections: about **30% less physical memory after warm-up**, with throughput from **5% slower to 7% faster**. Small changes overlap run variation. |
| One API copy | Roughly **half the server memory**, but **12–21% fewer requests** on the database routes at eight connections. Prebuilding routes recovered most validation throughput. |
| API with bytecode | JIT startup fell from **29.2 ms to 14.8 ms** (native AOT: **11.3 ms**), while retaining JIT-like warmed throughput. |
| Two API copies | With **12 DB connections total**, two AOT copies served **52% more requests** than one JIT copy: **49 vs 55 MB** of app memory and **2.6 vs 1.4 cores** of app CPU. PostgreSQL needed more CPU too. |

The database tests repeatedly read one cached user; app memory excludes PostgreSQL. The linked five-minute checks retain each minute separately. No CPU or RAM quota was enforced.

### Keryx and Next.js: what happened in real apps

**Fixing one Keryx timer bug saved more memory than switching compilers. Next.js showed how a working homepage can hide a broken API.** These November 1 trials include [source traces, patches and reproducible results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot-followups/project-trials-2026-11-01).

| Requests/second | Bun JIT | AOT variant |
| --- | ---: | ---: |
| Keryx, original timer | **40,753** | **39,912** |
| Keryx, timer cleared | **47,789** | **45,307** |
| Next.js JSON | **17,767** | **3,847** |
| Next.js sharp PNG | **1,377** | **1,342** |

| App physical memory | Bun JIT | AOT variant |
| --- | ---: | ---: |
| Keryx, original timer | **843 MB** | **525 MB** |
| Keryx, timer cleared | **144 MB** | **48 MB** |
| Next.js JSON | **137.5 MB** | **90.2 MB** |
| Next.js sharp PNG | **105.3 MB** | **72.3 MB** |

Keryx tests its greeting action; Next.js tests dynamic JSON and a generated PNG. Medians from four runs per Keryx cell, six per Next.js mode. Eight connections, two seconds warmup, five measured seconds; every timed response matched. Memory is the app's footprint at the end, excluding external services. These are local tests on one shared Mac, without a CPU or RAM limit.

**Keryx left every completed action's five-minute timeout running.** Its [action runner](https://github.com/actionhero/keryx/blob/d119595bec716ae99b4eca740964343e47f57eee/packages/keryx/classes/Connection.ts) races the action against a timer but never clears that timer. Twenty successful calls left twenty timers; [a small cleanup patch](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/bun-aot-followups/project-trials-2026-11-01/timer-cleanup.patch) left zero. Success, timeout, abort and thrown-error checks still passed.

With real Redis, PostgreSQL and a returning cookie, the patch cut JIT memory **83%** and AOT memory **91%**, while both served more requests. With the fix in both, AOT used **67% less memory**, serving **5% fewer requests**. In separate one-minute checks, the original app climbed to **4.7–5.8 GB under JIT and 2.1–2.2 GB under AOT** despite stable Redis key counts. After the fix, the ten-second checkpoints stayed at **129–130 MB and 47–49 MB**, respectively. Those minute checks cover two original processes per mode and one fixed process per mode; they do not establish a production memory budget.

Packaging needed work too. Minimal standalone builds failed on missing Lua files under both JIT and AOT. The measured native build includes discovered modules/assets and a normalized template path; its baseline is Bun running the same source. Keryx's async Zod parser also skips the generated synchronous path from the earlier slowdown example.

MCP was off during HTTP timing. Native MCP startup invoked itself as Bun's build tool, but [native executables omit the Bun CLI](https://github.com/oven-sh/bun/blob/3f3a9ff87cdccf3d32d7ec6b648c664eddaae840/docs/compiler/executables.mdx#act-as-the-bun-cli). A separate variant prebuilt the same browser UI and passed initialization and the public health call with source hidden and no Bun on `PATH`. Authenticated tools and browser interaction remain unchecked.

**Next.js returned HTTP 200 for its static page while its image route returned 500.** Allowing disk-loaded code exposed another failure in console patching. The measured variant declares the console properties Next replaces; both final builds passed page, JSON, static-file and PNG checks with the source hidden and no Bun on `PATH`.

The [adapter compiles a launcher](https://github.com/ramonmalcolm10/next-bun-compile/blob/43ab16c93774f23923654d337e6e2d9c205e4fe4/src/build.ts), then extracts Next and loads it later. AOT's disk-loading option interprets that JavaScript. The JSON route handled **78% fewer requests**; sharp's native image work stayed much closer. This integration does not compile all of Next to native code.

After pre-extraction, static readiness fell from **27 to 18 ms**, while the first dynamic JSON response took **124 versus 120 ms**, across twelve fresh processes per mode. The executable shrank from **140.6 to 77.9 MB**; both still extracted **44.9 MB** of runtime files. A Date-extension warning remains; cache-component behavior is untested.

[Original experiments](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/bun-aot) preserve versions, methods and failures. [Pinned compiler docs](https://github.com/oven-sh/bun/tree/06888611e2cf51ef28fd7b19eba61cbbf3cdf4ea/docs/compiler) explain memory mechanisms and compatibility limits.

Checked November 1, 2026. Original measurements use Bun `06888611e`; earlier application follow-ups use `da867c60b`; Keryx/Next.js trials use `3f3a9ff87`. These are macOS arm64 previews, without stable-release guarantees.
