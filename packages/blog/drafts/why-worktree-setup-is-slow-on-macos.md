---
title: "Why Setting Up a Worktree Can Be Slow on a Mac"
description: "What Theo's Mac-versus-Linux chart measures, what it leaves out, and a pnpm setting worth testing before changing machines."
section: engineering
tags: [macos, linux, pnpm, git]
readTime: "4 min read"
---

# Why Setting Up a Worktree Can Be Slow on a Mac

Theo's [Mac-versus-Linux chart](https://x.com/theo/status/2115338547620401326) reports **29.7 seconds on optimized Macs versus 3.8 seconds on Linux**. Repeatedly creating worktrees makes that wait add up. But the $12,000-versus-$700 caption leaves out something important: the chart combines **three Macs and two Linux machines**, and measures dependency installation inside new worktrees.

There are three useful questions here:

- What does “8× faster” actually compare?
- Why can a fast Mac still spend so long setting up a project?
- Can we avoid some of that work without changing computers?

## What the chart actually measures

A Git worktree is another checkout of your project, so two tasks can change files separately. Installing its packages is a separate step. The chart's small print says it times `pnpm install` in that new checkout.

In a [follow-up screenshot](https://x.com/theo/status/2115338762830184877/photo/1), Theo shares the method: take the middle timing for each machine, then average those timings. The Linux results include only runs after a fix, which the graphic does not mention. It also does not explain that fix.

Giving every run equal weight produces a different result: **29.2 seconds versus 4.6 seconds**, reported as 6.4×. One Linux machine contributed 233 samples; one Mac had only five after-fix samples. Giving each machine equal weight is reasonable, but readers need to know which comparison they are looking at.

The gap remains large either way. These are reported installation results across several setups, rather than a clean two-computer test.

## A fast SSD does not make every file operation fast

Installing packages involves creating directories, files and links. A large-file disk speed test does not tell you how quickly that work finishes. Downloading packages once also leaves work to do when another checkout needs them.

The [older public benchmark](https://github.com/NullVoxPopuli/disk-perf-git-and-pnpm/blob/535aef76843fe52d6336604111708d884110a0e5/README.md) behind [Theo's video](https://www.youtube.com/watch?v=9tGrhrVKCrE&t=826s) makes that distinction useful. It fills pnpm's cache, removes installed files, then times installation again. It uses several generated framework projects and pins pnpm 10.2.1. It is a different test from the new chart.

One contributor reports **34.9 seconds on an M5 Pro running macOS and 14.6 seconds in Linux inside OrbStack on that Mac**. The Linux files lived inside the guest's own filesystem. That is evidence to look beyond the processor and SSD, although it changes several software layers at once.

Spotlight is not a reliable explanation by itself either. That contributor's macOS install went from 34.9 to 34.4 seconds after excluding the project. Another M4 Air report barely changed.

These are contributor reports, with different machines and conditions. They support investigating the storage and software setup; they do not isolate APFS as the entire cause. Theo also [reports using ZFS compression on Linux](https://x.com/theo/status/2115349652195389659), another detail missing from a simple OS comparison.

## Stop rebuilding the same package tree

pnpm has an option worth testing: keep the installed dependencies in one shared place, then point each checkout at them. The setting is called the [global virtual store](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/global-virtual-store.md).

I tested it on an **M5 Mac with 24 GB RAM**, using pnpm 12.14.0 and a small project with 90 packages. Each install started in a fresh directory, used cached packages offline, and skipped install scripts. After warming both modes, I ran five alternating pairs.

| Install | Middle time | Regular files in that checkout's `node_modules` |
| --- | ---: | ---: |
| Default | 122 ms | 3,124 |
| Shared dependencies | 66 ms | 9 |

Both loaded the five requested libraries successfully, and the lockfile stayed unchanged. The [script, lockfile and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/macos-worktree/repro) are available to repeat the test.

That saved **56 milliseconds** here. This small test demonstrates reuse; it does not reproduce Theo's project, include native package builds, or establish a Mac-versus-Linux speedup.

For the pnpm version I tested, add this to `pnpm-workspace.yaml`:

```yaml
enableGlobalVirtualStore: true
```

Run the project's actual build and tests afterward. The feature is experimental, some tools may have compatibility problems, and installed package files become shared writable state. Separate source checkouts still need care around those shared dependencies.

## Measure the wait you actually have

Before changing machines, time these separately in a disposable checkout:

```sh
time git worktree add --detach ../install-check HEAD
cd ../install-check
time pnpm install --offline --frozen-lockfile
```

The install needs a populated cache. Repeat with fresh checkout directories, then compare the shared-store option using the same pnpm version and build checks. An install in an already prepared directory answers a different question.

If dependency installation accounts for your delay, test reuse first. If a comparable Linux setup still removes a meaningful wait from your actual project, that is a reason to move the work. The decision should follow the time your project saves, rather than the prices above a chart.

---

## Glossary

| Term / claim | Primary source | Date |
| --- | --- | --- |
| Worktree: separate checkout, shared Git history | [Git manual](https://git-scm.com/docs/git-worktree) | Checked Oct 28, 2026 |
| Chart task and averaging | [Theo's method screenshot](https://x.com/theo/status/2115338762830184877/photo/1) | Oct 28, 2026 |
| Dependency reuse and compatibility limits | [pnpm 12.14.0 guide](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/global-virtual-store.md) | Checked Oct 28, 2026 |
