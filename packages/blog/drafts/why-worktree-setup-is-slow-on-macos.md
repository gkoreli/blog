---
title: "Why Setting Up a Worktree Can Be Slow on a Mac"
description: "T3 installs took 8.1 seconds on macOS and 2.1 in Linux on the same Mac. Shared dependencies cut both medians below a second, after a React type lookup fix."
section: engineering
tags: [macos, linux, pnpm, git]
readTime: "5 min read"
---

# Why Setting Up a Worktree Can Be Slow on a Mac

Theo's [chart](https://x.com/theo/status/2115338547620401326) reports **29.7 seconds on optimized Macs versus 3.8 seconds on Linux**. I tested T3 Code in fresh worktrees on the same M5 Mac: **8.1 seconds on macOS and 2.1 seconds in a Linux VM**. That's about 4× for this test.

Changing how dependencies were installed brought both systems to **roughly 0.95 seconds**. That setting initially produced 64 type errors. Linux had the same errors, and tracing them revealed a fix. The useful question became which work we could avoid while keeping the project working.

## What the chart measures

Creating a Git worktree gives you another checkout. Installing its packages is a separate job. Theo's graphic times `pnpm install` in the new checkout.

His caption emphasizes a $12,000 Mac and a $700 PC. The [follow-up method](https://x.com/theo/status/2115338762830184877/photo/1) describes three Macs and two Linux machines: average each machine's middle timing. Linux includes only after-fix runs. I couldn't find the raw runs or all the Mac optimization commands.

An installation result also doesn't establish an equivalent speedup for an entire coding task, which includes model responses, builds and tests.

## Thirty fresh worktrees, with project checks

I used a [pinned T3 revision](https://github.com/pingdotgg/t3code/tree/125b61954dbba5822a8108c8ca47a4846b4b4328), Node 26.12.1 and pnpm 12.14.0. Packages and build results were already cached. Install scripts stayed enabled; package fetching used `--offline` with a frozen lockfile.

I ran five fresh worktrees per configuration on each OS, alternating platform order and rotating configurations. Each install was followed by dependency-loading checks and the real web typecheck. Shared dependencies used the typecheck fix explained below.

| Median package installation | macOS | Linux VM |
| --- | ---: | ---: |
| Default settings | **8.1 s** | **2.1 s** |
| Four main installer workers | **6.5 s** | **2.0 s** |
| Shared installed packages | **0.94 s** | **0.96 s** |

Requested package versions matched in all 30 trials, and the source and lockfiles stayed unchanged. Checkout, cleanup, validation and VM startup are outside these times.

The Mac had ten logical CPUs and 24 GB RAM; Linux had four virtual CPUs and 4 GB. Its files lived inside the guest's own filesystem. The thread control addresses one installer difference; the test still changes the OS, filesystem and available resources together.

## Where the Mac spends the time

Current pnpm already [clones eligible package directories](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/dir_clone_cache.rs) on a Mac, saving many individual import calls. My diagnostic trace recorded **1,621 successful package-directory clones**. A separate process sample repeatedly found worker stacks inside the filesystem's clone operation.

That still creates a local package tree containing roughly **180,000 regular files**. A directory clone shares data blocks but recreates the file hierarchy. Linux's default importer starts with hardlinks to existing files instead. Those strategies also differ in whether later writes share the same file; this comparison isn't just testing processor speed.

The four-thread control made the Mac faster, but a substantial gap remained. Sharing the already-installed package folders avoids most of that repeated local tree creation.

## Why the faster setting failed

pnpm calls this experimental option the **global virtual store**. Checkouts point into shared package folders. My earlier cleaned-directory test reached 0.71 seconds; the stronger fresh-worktree trials above measured about 0.95 seconds. These are separate experiments.

The 64 errors came from React declaration lookup. The compiler followed libraries into the external shared store, found React's JavaScript, then failed to find the project's React type files. Properties such as `className` disappeared from library types.

**The same failure occurred on Linux.** Pointing the compiler to the existing React declarations in a separate, typecheck-only configuration cleared all 64 errors on both systems. A deliberately invalid numeric `className` still failed, so the repair hadn't simply weakened checking. A second compiler reproduced the reduced case.

The shared setup also produced web builds and passed **4,302 web unit tests on each OS**. Browser checks exposed a separate limit: default and shared layouts each passed 471 of 472 tests, failing the same guest-page scrolling assertion. That failure also repeated in isolation.

The [reproduction notes](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/macos-worktree/repro) include the compiler configuration and results. I kept declaration aliases out of the bundler's base configuration. These checks cover the web project. Editing a shared package file can affect other checkouts.

## Check where the cache lives

T3's [install cleanup](https://github.com/pingdotgg/t3code/pull/22718) reports a Linux machine copying every package because its cache and worktrees occupied different filesystems.

In a separate control, I kept one Linux checkout on XFS and its cache on ext4: **7.6 seconds**. Moving a byte-identical cache onto that same XFS filesystem brought it to **1.4 seconds**. Across filesystems, pnpm cannot reuse files through the same links or clones.

```sh
df -h . "$(pnpm store path)"
```

Different folders on one SSD can still occupy different filesystems.

Before changing machines, time the actual steps with the project's pinned tools and a populated cache:

```sh
time git worktree add --detach ../setup-test HEAD
cd ../setup-test
time pnpm install --offline --frozen-lockfile
```

Repeat in fresh checkouts and run the project's checks after changing installation settings. For this T3 setup, package reuse removed more waiting than switching operating systems. A Linux VM remains another tested option; keep its project and cache inside the guest.

---

## Glossary

| Term / claim | Primary source | Date |
| --- | --- | --- |
| Worktree: another checkout sharing Git history | [Git manual](https://git-scm.com/docs/git-worktree) | Checked Oct 28, 2026 |
| Chart aggregation and after-fix samples | [Theo's method](https://x.com/theo/status/2115338762830184877/photo/1) | Oct 28, 2026 |
| Shared dependencies and limitations | [pnpm 12.14.0 guide](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/global-virtual-store.md) | Checked Oct 28, 2026 |
| Declaration lookup override | [TypeScript paths](https://www.typescriptlang.org/tsconfig/paths.html) and [tested evidence](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/macos-worktree) | Checked Oct 28, 2026 |
