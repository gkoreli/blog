---
title: "Why Setting Up a Worktree Can Be Slow on a Mac"
description: "T3 installed in 7.8 seconds on macOS and 1.3 seconds in Linux on the same Mac. Cache placement changed the result, and a faster Mac setting failed the project's checks."
section: engineering
tags: [macos, linux, pnpm, git]
readTime: "5 min read"
---

# Why Setting Up a Worktree Can Be Slow on a Mac

Theo's [chart](https://x.com/theo/status/2115338547620401326) reports **29.7 seconds on optimized Macs versus 3.8 seconds on Linux**. I tested T3 Code on the same M5 Mac and got **7.8 seconds on macOS versus 1.3 seconds in a Linux VM**. The gap is real in this test, even without buying another computer.

But configuration changed the result too. Moving Linux's package cache onto the checkout's filesystem cut installation from **7.6 to 1.4 seconds**. Sharing installed dependencies brought the Mac below a second, then failed the project's typecheck. Those details matter before copying a setting or changing machines.

## What took so long?

A Git worktree is another checkout of your project. Creating it and installing its dependencies are separate jobs. Theo's graphic says it measures `pnpm install` inside a new worktree.

His price caption emphasizes a $12,000 Mac and a $700 PC. The [follow-up method](https://x.com/theo/status/2115338762830184877/photo/1) describes **three Macs and two Linux machines**: take each machine's middle timing, then average those values. Linux includes only runs after a fix. I couldn't find the raw runs or all the Mac optimization commands.

That supports a large reported install gap. It doesn't establish an 8× improvement for an entire coding task, which also includes model responses, builds, tests and time spent thinking.

## Same Mac, different software and storage

I used a [pinned T3 revision](https://github.com/pingdotgg/t3code/tree/125b61954dbba5822a8108c8ca47a4846b4b4328), its required Node 26.12.1, and pnpm 12.14.0. Packages were already cached. Each run removed the installed dependencies before reinstalling with a frozen lockfile and `--offline`; allowed install scripts stayed enabled.

| T3 dependency installation | Median of three runs |
| --- | ---: |
| macOS, APFS | **7.8 s** |
| Linux VM, ext4 | **1.3 s** |

The 24 GB Mac had ten logical CPUs; Linux had four virtual CPUs and 4 GB RAM. The project and cache lived inside Linux's own filesystem. The physical computer stays the same, but the operating system, filesystem and available resources change. This test cannot tell us how much of the gap comes from APFS itself.

Both found all **599 requested dependencies** without changing the source or lockfile. Dependency-loading checks and the web project's typecheck passed. Git checkout, cleanup and VM startup are outside these install times. The [scripts, conditions and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/macos-worktree) are available to inspect.

## Linux can waste the same work

T3's [October 21 install cleanup](https://github.com/pingdotgg/t3code/pull/22718) reports that one Linux machine had its package cache on ext4 and worktrees on XFS. Every worktree received full dependency copies. T3 now warns about that arrangement.

A package cache saves downloads. Installation still has to make packages available in each checkout. When the cache and checkout share a filesystem, pnpm can reuse existing file data through links or clones. Across filesystems, those operations can't do the same job, so files get copied.

I tested that configuration inside Linux. With the checkout on XFS and cache on ext4, installation took **7.6 seconds**. Moving a byte-identical copy of the cache onto that same XFS filesystem brought it to **1.4 seconds**. Source, tools and checkout path stayed fixed.

That's a useful fix regardless of which computer you own. Check where the cache actually lives:

```sh
df -h . "$(pnpm store path)"
```

Different folders on the same SSD can still belong to different filesystems.

## The fastest Mac setting failed the next check

Current pnpm already has a [Mac optimization](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/dir_clone_cache.rs) that clones eligible package directories instead of importing every file separately. Older pnpm benchmarks don't automatically describe this version.

I also tested its experimental **global virtual store**: several checkouts point at shared installed package folders. After warming it, the Mac's median install dropped to **0.71 seconds**. Local dependency directories held 266 regular files instead of roughly 180,000; the package contents remained in the shared store.

Installation and native-module checks passed. **The web typecheck failed with 64 errors.** Restoring default dependencies made it pass. The same errors appeared in a fresh worktree with the compiler run directly.

So this saved installation time but failed the compatibility check for this project. I wouldn't recommend enabling it for T3 from these results. Other projects need their own checks; shared package files also become shared writable state.

## Before changing your setup

Time checkout and installation separately in a disposable worktree:

```sh
time git worktree add --detach ../setup-test HEAD
cd ../setup-test
time pnpm install --offline --frozen-lockfile
```

Populate the cache first, use the project's pinned tools, and repeat in fresh checkouts. Then run the actual project checks after any change.

A Linux VM is a practical option if this wait matters in your workflow. Keep the project and cache inside it; a Mac folder mounted into Linux follows a different storage path. My result supports investigating that option. The cache-placement test also shows why the OS name alone doesn't tell you how fast setup will be.

---

## Glossary

| Term / claim | Primary source | Date |
| --- | --- | --- |
| Worktree: another checkout sharing Git history | [Git manual](https://git-scm.com/docs/git-worktree) | Checked Oct 28, 2026 |
| Chart aggregation and after-fix samples | [Theo's method](https://x.com/theo/status/2115338762830184877/photo/1) | Oct 28, 2026 |
| Cache placement and unnecessary platform packages | [T3 install cleanup](https://github.com/pingdotgg/t3code/pull/22718) | Oct 21, 2026 |
| Shared dependencies and compatibility limits | [pnpm 12.14.0 guide](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/global-virtual-store.md) | Checked Oct 28, 2026 |
