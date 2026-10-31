---
title: "OSS Radar #09: tsrs Checks VS Code Faster with 56% Less RAM"
seoTitle: "tsrs vs TypeScript 7.1: Faster Checks, 56% Less RAM"
alternativeHeadline: "The Rust TypeScript compiler checked VS Code 2.7 times faster on my Mac; fast mode saved more memory but changed diagnostics in a small control"
date: "2026-10-30"
description: "tsrs checked VS Code in 1.72s using 2.52GB peak RAM, versus TypeScript 7.1 beta's 4.67s and 5.71GB. I also reproduced a fast-mode compatibility difference."
section: oss-radar
tags: [oss-radar, typescript, rust, compilers, performance]
---

# OSS Radar #09: tsrs Checks VS Code Faster with 56% Less RAM

The Rust TypeScript compiler **tsrs checked VS Code 2.7× faster with 56% less peak RAM** on my M5 Mac: **1.72 seconds and 2.52GB**, against TypeScript 7.1 beta's **4.67 seconds and 5.71GB**. Both used four type-checking workers and printed identical diagnostics.

Its `--fast` option went further: **1.45 seconds and 1.84GB**. I also reproduced a two-file example where that option changed whether the compiler reported an error.

Three things matter before replacing your checker:

- The default mode delivered substantial savings without enabling `--fast`.
- The advertised eightfold speedup depends on the project and TypeScript version.
- Matching errors on a large project still does not establish compatibility everywhere.

## The eightfold claim has conditions

[Cloudflare and VoidZero announced tsrs](https://blog.cloudflare.com/typescript-rust-port/) with up to eightfold faster checking and about 70% less memory than TypeScript 7.0. They already matched the number of checking workers. The same announcement credits TypeScript 7.1 beta with improvements, including optimizations contributed from tsrs.

[A reader asked what “8× faster” actually meant](https://news.ycombinator.com/item?id=50167878), and whether it could check VS Code in under a second. I tested the public VS Code revision in tsrs's benchmark catalog, plus this blog's site and Worker projects.

On VS Code, the answer was 1.72 seconds by default, or 1.45 with fast mode. Against the newer upstream compiler, that was 2.7× and 3.2× faster respectively.

| Checking VS Code | Time | Peak RAM |
| --- | ---: | ---: |
| TypeScript 7.0.2 | 6.63s | 6.05GB |
| TypeScript 7.1 beta | 4.67s | 5.71GB |
| tsrs default | 1.72s | 2.52GB |
| tsrs `--fast` | 1.45s | 1.84GB |

These are five-run medians with four checkers throughout. RAM means peak resident set size, measured the same way for every native executable; GB are decimal. This was a fresh command-line type check with emission and incremental reuse disabled, not a VS Code build.

The pinned VS Code project reported 371 diagnostics under TypeScript 7.1 beta and both Rust modes. Their complete output matched byte for byte and stayed unchanged through the timed runs. TypeScript 7.0 reported 359, so that older row also includes a language-version difference.

On my blog's site project, default tsrs cut checking from 111ms to 50ms and peak memory from 203MB to 101MB against 7.1 beta. The saving was real, but 61ms would not justify a disruptive migration by itself. The Worker showed the same direction, with smaller absolute savings.

## Fast mode can change your errors

[Current tsrs defaults](https://github.com/oxc-project/tsrs/blob/77d3cddb44540734abc33a42ccca4d3f33bee527/docs/DEFAULTS.md) follow the pinned TypeScript compiler's checker settings. Fast mode changes file scheduling, checker caches and when some type members get resolved. It preserves options such as `strict`; its [documented exceptions](https://github.com/oxc-project/tsrs/blob/77d3cddb44540734abc33a42ccca4d3f33bee527/docs/USAGE.md#side-effects) concern checking behavior near recursive-type and depth limits.

I reran the maintainers' [two-file constraint-cache example](https://github.com/oxc-project/tsrs/blob/77d3cddb44540734abc33a42ccca4d3f33bee527/notes/determinism-base-constraint-depth.md). At four checkers:

| Order of the two files | TypeScript 7.1 beta | tsrs default | tsrs `--fast` |
| --- | --- | --- | --- |
| `a.ts`, then `b.ts` | TS2339 error | Same error | No error |
| `b.ts`, then `a.ts` | No error | No error | TS2339 error |

The generic type in the example explicitly has the property named in the error. This demonstrates a cache/history problem, not that fast mode simply skips valid errors. TypeScript itself also changed its answer with checker count. Default tsrs matched it across all eight order/count combinations I tested; fast mode differed in several.

The mechanism is useful to understand: a checker caches the result of exploring a deep type constraint. Another file can later reuse that result. Changing which file gets checked first can therefore change the answer. A performance option that rearranges this work can expose or remove the error.

That matters even if your benchmark's error count stays unchanged. Test the code your team actually checks, including known failures.

## What the Rust port changes

tsrs follows TypeScript's Go implementation and language decisions. Cloudflare's stated reason for backing it includes running development tools with tighter memory budgets in Workers and WebAssembly environments. Its direction is a faster implementation of the same language.

The port also has its own allocation machinery. Its [arena implementation](https://github.com/oxc-project/tsrs/blob/77d3cddb44540734abc33a42ccca4d3f33bee527/crates/tsrs_core/src/arena.rs) allocates objects in chunks, recycles eligible blocks and can discard speculative parsing allocations. Those design choices and the fast preset's caches and lazy work belong to the implementation. These measurements compare released compilers; they do not isolate a speed advantage caused by Rust alone.

## Try the default mode first

I would test tsrs beside the existing compiler before changing CI:

```bash
pnpm add -D tsrs@0.20.1-ts7.1.0-beta
pnpm exec tsrs -p tsconfig.json --noEmit --fast false
pnpm exec tsrs -p tsconfig.json --noEmit --fast
```

Compare errors and exit codes against the TypeScript version this release follows, 7.1 beta, as well as your current compiler. Otherwise an upstream TypeScript change can look like a Rust-port bug. Treat fast mode as another comparison.

I used released native binaries, warm filesystem caches and rotating run order on a 10-core, 24GB M5 Mac. Deliberately wrong assignments failed in every variant. My first setup attempt rejected the site's composite configuration before checking source; the controls caught it, and I corrected the cold-cache procedure before timing. [The protocol, scripts and individual samples are public](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10).

For a large project short on memory, the default mode is already worth testing. Keep the official compiler available, check the release's compatibility limits, and measure editor or incremental workflows separately. The strongest result here is the saving available before opting into different checker behavior.

---

## Glossary

| Term / claim | Primary source | Date |
| --- | --- | --- |
| Eightfold claim and intended use — establishes the original comparison and WebAssembly goal. | [Cloudflare announcement](https://blog.cloudflare.com/typescript-rust-port/) | October 20, 2026 |
| Compatibility defaults — identifies the reference version and differences a migration must check. | [Pinned defaults](https://github.com/oxc-project/tsrs/blob/77d3cddb44540734abc33a42ccca4d3f33bee527/docs/DEFAULTS.md) | Release 0.20.1 |
| File-order control — supplies the exact small example independently rerun here. | [Maintainer investigation](https://github.com/oxc-project/tsrs/blob/77d3cddb44540734abc33a42ccca4d3f33bee527/notes/determinism-base-constraint-depth.md) | Pinned release source |
| Independent measurements — records versions, conditions, controls, failures and samples. | [Research artifacts](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-claim-checks-2026-10) | October 30, 2026 |
