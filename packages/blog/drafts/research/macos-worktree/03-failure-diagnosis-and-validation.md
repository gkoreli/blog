# Failure diagnosis and additional validation

New goal, October 28 local / October 29 UTC: “Why did macOS fail? Also we need more validations”. This continues the completed [first deeper pass](02-deeper-investigation.md), rather than treating its 21 installs as sufficient for the new request. The article remains unpublished and four to five minutes long.

## Separate the two questions

macOS completed the default dependency installs and the web typecheck. The failure was the web typecheck after enabling shared dependencies. Explaining that failure is different from explaining why default installs take longer on macOS. The prior article correctly recorded the failure but did not diagnose it; it must not be described as an OS-specific failure without a Linux control.

## Resolution trace and reduced reproduction

Using the same pinned T3, Node 26.12.1 and pnpm 12.14.0, the native `@tsc-rs/typescript` 0.8.0 compiler's `--traceResolution` output shows:

1. A declaration in shared `lucide-react` or `@effect/atom-react` imports `react`.
2. Lookup starts from that library's real path in the external shared store, not the project's dependency directory.
3. The compiler finds React's JavaScript. React does not bundle its own TypeScript declarations.
4. The nearby `node_modules/@types` directories do not exist, and the project's `@types/react` sits outside this ancestor chain.
5. The import resolves to `react/index.js` instead of the React declaration file. The library consequently loses useful React types: SVG props such as `className` disappear and context-based inference degrades.

The declaration package is installed: this is a **lookup-path failure**, not a missing download or changed application source. The full trace remains outside Git. The selected public trace excerpt retains the importing file, lookup failure and final resolution with machine paths normalized.

The two-line reduced case is:

```ts
import type { LucideProps } from "lucide-react";
export const props: LucideProps = { className: "hello" };
```

| Layout / control | Result with pinned native compiler |
| --- | --- |
| Default layout, valid string prop | Pass |
| Default layout, deliberately invalid numeric prop | Reject: number is not assignable to string |
| Shared layout, valid string prop | Reject: `className` does not exist in `LucideProps` |
| Shared layout with explicit React declaration mapping, valid prop | Pass |
| Same mapping, deliberately invalid numeric prop | Reject: number is not assignable to string |

The negative control matters: the repair restores the expected type, rather than making the compiler accept arbitrary values or suppressing errors.

The official `typescript` 6.0.3 compiler already installed in T3's marketing workspace reproduces the same reduced-case outcomes. This is not specific to the project's native Rust compiler. Explicit `typeRoots` also fails the reduced case with both compilers. The [probe source](repro/react-types-probe.ts) is intentionally small; it explains declaration lookup, not installation performance.

## Cross-platform control and repair

The unchanged shared layout produces **the same 64 errors on Linux**. A temporary compiler configuration mapping `react` and `react/*` to the already-installed project `@types/react` clears all 64 errors on **both macOS and Linux**. Original strictness flags, source files and dependency versions stay unchanged. The existing `~/*` source alias is retained. The override and compiler output are outside the source checkout.

This diagnoses the tested web failure. It is not yet a general pnpm fix or proof that every workspace in T3 needs the same mapping. Explicit type paths need to follow the project's declaration version; a global type-directory hack could mix versions between projects.

Two alternatives were tested and rejected for this toolchain: explicit `typeRoots` left the 64 full-project errors unchanged; `preserveSymlinks` increased them to 2,863. Do not recommend the latter as a generic cure. The [TypeScript symlink option](https://www.typescriptlang.org/tsconfig/preserveSymlinks.html) changes the paths used for resolution; the [typeRoots reference](https://www.typescriptlang.org/tsconfig/typeRoots.html) describes visible ambient declaration folders. These documents explain the concepts; the actual native-compiler behavior is established by the tests.

## Broader project checks

- Default Mac web unit suite: 318 files, 4,302 tests pass.
- Shared Mac web unit suite: the same 318 files and 4,302 tests pass.
- Shared Linux web unit suite: the same 318 files and 4,302 tests pass.
- Shared Mac production web build passes; default Mac build also passes.
- Shared Linux production web build passes.
- Full web typecheck with the targeted declaration mapping passes on both systems.

Unit/build checks do not replace typechecking: in this case runtime-oriented checks pass while the unchanged shared-layout typecheck fails. No model-task speedup, mobile/desktop application acceptance or entire production deployment is implied.

## Performance control design

The pinned pnpm [pool implementation](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/package-manager/src/rayon_pool.rs) uses twice available parallelism, with a floor of four and ceiling of sixteen. An explicit `RAYON_NUM_THREADS` bypasses that override. Thus the original host/guest defaults are expected to differ: sixteen versus eight file-work threads for the recorded allocations. A four-thread control on both systems addresses this specific difference; it does not equalize the entire CPU scheduler, memory allocation or kernel.

The pinned [file-import ladder](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/link_file.rs) starts with hardlinks on Linux and clones on macOS. The [Mac directory cache](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/dir_clone_cache.rs) clones eligible whole package directories; mutable, patched/build-sensitive and other ineligible packages take other paths. The current-version profile and installer trace identify observed operations rather than promote those source comments to a complete APFS causal diagnosis.

The predeclared timing protocol uses fresh paths, counterbalances platform/configuration order, retains all samples and repeats the real web typecheck outside the install timer. Diagnostics, traces, source checkout, cache population and builds remain outside accepted timings.

## Current-version profile

A separate macOS diagnostic run used the exact pnpm 12.14.0 native executable and Node 26.12.1. `TRACE=pacquet::dir_clone_cache=trace` with JSON formatting recorded **1,621 successful whole-package directory clones**, one event per distinct package key. There were no clone-fallback events from that target. This confirms that the modern optimization is actually active in the tested default layout, rather than merely present in source.

A two-second, one-millisecond `sample` capture of that native process frequently found worker stacks inside `clonefileat`. Its collapsed top-of-stack table contains 14,970 `clonefileat` samples, 690 rename samples, 447 mkdir samples, 262 stat samples and 215 symlink samples. Idle/wait stacks also appear. These counts span threads: they are neither syscall counts nor percentages of total wall time. The profiled install's elapsed time is excluded from accepted timing series.

Together with the observed local package-file count and the shared-store control, this supports a specific explanation: much of the tested default Mac install is work creating independent package trees through filesystem calls. It does not isolate the contribution of every APFS implementation detail, OS file monitor or kernel scheduling decision. Linux's source path and representative-file inode check show hardlink reuse; source comments alone do not quantify its contribution to the entire gap.

The host's actual `clonefile(2)` manual also explains that cloning a directory reproduces its hierarchy as individual cloned items: one userspace call does not make the internal file-entry work disappear. Each cloned file has independent attributes and subsequent writes are private to that file. The manual discourages directory cloning in favor of `copyfile(3)`; this investigation does not claim to validate that alternative API. A content-matched `@types/node/index.d.ts` file in the default Mac checkout has a different inode from its cache entry, with one link, whereas the Linux observation shares the cache inode. The default import strategies therefore also differ in file-sharing semantics; this is not a pure CPU comparison.

## Fresh-path timing validation completed

The predeclared [paired-worktree driver](repro/paired-worktrees.py) completed **30 trials**: five fresh worktrees for each platform/configuration combination. Platform order alternates; configuration order rotates by pair. Every trial passed its native checks and real web typecheck (using the targeted declaration mapping for shared mode), retained the same input hash and matched all 599 requested dependency entries.

| Configuration | macOS median / range | Linux median / range |
| --- | --- | --- |
| Defaults | 8.120 s / 7.996–8.404 | 2.098 s / 1.941–2.258 |
| Four file-work threads on each | 6.548 s / 6.372–6.772 | 2.019 s / 1.629–2.425 |
| Shared dependencies, mapped React types | 0.943 s / 0.797–1.014 | 0.962 s / 0.790–1.155 |

Ratio of default medians: **3.87×**. Ratio with the four-thread control: **3.24×**. Shared-mode ratio: **0.98×**, essentially similar absolute waits in this small sample. The Mac four-thread median is about 19% lower than its default median; the Linux difference is small relative to its observed range. Do not call this full resource equivalence: host/guest memory, kernel and CPU scheduling still differ.

These fresh-path results supersede the earlier 7.8 / 1.3-second cleaned-directory figures as the article's main comparison. The older results remain valid observations of their stated method and are retained separately; do not pool them or silently replace their samples. New paths, file layout and preparation state can change measured overhead. The revised headline should say approximately **4× in this test**, not claim an independently reproduced 8× multiplier.

## Browser check exposes a separate baseline limit

The first browser attempt could not launch its required Chromium headless binary. The correct binary was installed through the pinned Playwright 1.60.0 CLI into a dedicated research cache; no user browser profile was used. The test server binds loopback.

The complete default-layout browser suite then ran 108 files / 472 tests: **107 files and 471 tests passed; one GuestPage scrolling test failed**. It expected a scroll distance under two pixels but observed 2,074. The matched shared-layout results follow below. This baseline failure is not evidence against shared dependencies and prevents claiming that all browser checks are green. Preserve the result and compare the same assertion before any adoption verdict.

The complete shared-layout suite produced the **same 107/108 passing files and 471/472 passing tests**, with the same GuestPage assertion and the same observed 2,074-pixel distance. Targeted reruns of that three-test file in each layout again passed two tests and failed the same one. No additional failing browser test was observed under shared dependencies. This is a reproduced baseline limit, not full application acceptance; the scrolling defect was not repaired or attributed to a new install setting.

## Check the launcher and the actual recipe

The failing web typecheck was also run through `pnpm --config.enableGlobalVirtualStore=true exec tsc`, explicitly enabling the same shared-layout configuration in the launcher. It still produced 64 errors. Thus the failure is not explained by bypassing pnpm's runtime environment or its ESM hoisting hook.

The copyable [typecheck-only example](repro/react-typecheck.example.json) was placed at `apps/web/tsconfig.research-typecheck.json` in the disposable shared checkout and run with that explicit project argument through pnpm. It passed. The original `tsconfig.json` remained byte-identical to Git (SHA-256 `c3c0f8d47676bb1eeda5bfaa5ebd501007224b63f65bd7ca224091b6c8de3c48`), application source and dependency versions stayed unchanged, and the real production web build passed with the separate configuration present.

Keep this scope precise: the experiment did **not** merge React declaration aliases into the bundler's base configuration. T3 enables `resolve.tsconfigPaths` in its [Vite configuration](https://github.com/pingdotgg/t3code/blob/125b61954dbba5822a8108c8ca47a4846b4b4328/apps/web/vite.config.ts), so aliases used only for compiler declarations should not casually be repurposed as runtime module aliases. The [TypeScript paths reference](https://www.typescriptlang.org/tsconfig/paths.html) describes compiler lookup overrides; it is not a guarantee about another bundler's resolver. The tested recipe uses a separate compiler-only file and command.
