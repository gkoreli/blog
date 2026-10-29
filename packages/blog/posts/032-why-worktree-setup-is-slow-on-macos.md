---
title: "A Linux VM on My Mac Beat macOS at Installing Dependencies"
description: "A Linux VM on my Mac installed T3 Code dependencies almost 4× faster than macOS. I tested four repos, traced the file work and checked the fixes."
date: 2026-10-28
lastModified: "2026-10-29"
section: engineering
tags: [macos, linux, pnpm, git]
readTime: "5 min read"
---

# A Linux VM on My Mac Beat macOS at Installing Dependencies

A Linux VM running on my M5 Mac installed dependencies faster than macOS in every repository I tested. **T3 Code took 2.10 seconds inside the VM versus 8.12 seconds on macOS**—almost four times faster.

The VM had **four virtual CPUs and 4 GB of RAM**. The Mac had **ten logical CPUs and 24 GB**.

Across T3 Code, Next.js, Vite and SvelteKit, I found:

- macOS created independent package files; Linux usually shared files with its cache.
- Using fewer installer workers made the Mac faster. Reusing installed packages cut Vite from **1.82 to 0.68 seconds**, but exposed type errors.
- A Linux build changed cached files and broke the next install. Independent copies prevented it.

## Four repositories, one physical Mac

These are package-install times in fresh Git worktrees. Creating the checkout is a separate step.

| Repository | macOS median | Linux VM median |
| --- | ---: | ---: |
| [T3 Code](https://github.com/pingdotgg/t3code/tree/125b61954dbba5822a8108c8ca47a4846b4b4328) | **8.12 s** | **2.10 s** |
| [Next.js](https://github.com/vercel/next.js/tree/7fd2d0a69534e26cfa10c7c11acc7c8450bf7cd5) | **4.56 s** | **1.56 s** |
| [Vite](https://github.com/vitejs/vite/tree/cce559ab158cc6b177d0911a0bea73436b48faff) | **1.82 s** | **0.48 s** |
| [SvelteKit](https://github.com/sveltejs/kit/tree/f22e6210a51bc0e43bd52882be12d759eff5a2c6) | **0.59 s** | **0.13 s** |

Each cell contains five runs. T3 came from an earlier 30-install block; the other repositories added 90 trials across defaults, four installer workers and shared dependencies. Those blocks remain separate in the [results and methods](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/macos-worktree).

All used Node 26.12.1 and their own pinned pnpm 12 version. Package and build caches were populated; allowed install scripts stayed enabled. Timed installs used `--offline --frozen-lockfile`. CI mode skipped Next's optional native-compiler download. Checks ran outside the timer.

Linux's project and cache lived inside its own filesystem. This compares software and storage paths with different resources, rather than isolating APFS alone.

Theo's [29.7-second Mac versus 3.8-second Linux chart](https://x.com/theo/status/2115338547620401326) prompted this investigation. His [disclosed method](https://x.com/theo/status/2115338762830184877/photo/1) describes five machines, averaging their individual middle timings, with Linux's after-fix runs. His price caption isn't a controlled two-machine experiment.

## The Mac creates independent files

For ordinary packages, pnpm's default Linux importer starts with **hardlinks**: multiple names for the same file. macOS starts with **clones**: independent files that initially share their disk data.

Current pnpm already [clones eligible whole package directories](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/dir_clone_cache.rs). My Mac trace recorded 1,621 successful directory clones. The resulting T3 dependency tree still contained roughly 180,000 regular files. A process sample repeatedly found workers inside the filesystem's clone operation.

Sharing an already-installed tree avoids much of that repeated work. It also changes what happens when something writes into a dependency.

## Next.js exposed the write problem

Next uses `@vercel/ncc@0.38.4`. Its packaged loaders [write compiled-code caches](https://github.com/vercel/ncc/blob/e72d34d97e7cb2348af19993b6cdb6fec5374ac9/src/index.js#L520) back into their own package when the process exits.

The Linux build changed four packaged files. They were the same files as pnpm's cached copies, so the cache changed too. On Mac, the installed copies changed while the original cache bytes still matched the published package.

I reduced this to one package compiling a tiny program. Linux's default hardlinks reproduced the failure: compilation worked, then the next offline install failed. With `--package-import-method=clone-or-copy`, compilation and the next install both passed; the cache stayed unchanged.

The failed trial remains in the ledger. Restoring that exact package repaired the original checkout. Disabling integrity checks would conceal the problem.

## What helped without weakening checks

Four installer workers lowered every Mac median in these tests. T3 dropped from **8.12 to 6.55 seconds**; Next.js from **4.56 to 3.90 seconds**.

```sh
RAYON_NUM_THREADS=4 pnpm install --offline --frozen-lockfile
```

Measure it first. SvelteKit's Linux median got worse with that setting, and its default Mac/Linux gap was only 0.46 seconds anyway.

Also check cache placement:

```sh
df -h . "$(pnpm store path)"
```

A cache on another filesystem forces different import work. My separate XFS control dropped from 7.6 to 1.4 seconds when the cache moved onto the checkout's filesystem.

Shared installed packages were faster still: Mac medians reached **0.68 seconds for Vite, 0.28 for SvelteKit and 0.96 for Next.js**. But Vite and Next failed typechecks. T3 had previously produced 64 errors.

For T3, I declared four libraries' optional React type dependencies. Its original compiler configuration then passed on both systems, alongside 4,302 unit tests and the web build. Separate React 18 and 19 controls found their own type files and still rejected an invalid prop. No special compiler paths or weaker checking were needed.

Vite and Next also exposed missing type dependencies. Their [version-scoped metadata patches](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/macos-worktree/repro) preserve package versions. SvelteKit passed its core typecheck and unit suite unchanged. Next's complete Linux build remains unaccepted; the 4 GB guest also hit memory limits. Earlier T3 browser runs passed 471/472 tests in both layouts, failing the same scrolling assertion.

## Keep writes private too

A fully read-only cache protected the small ncc case, but refused a fresh T3 worktree that needed a new local-package entry.

I then tested private writable views over a frozen cache: Linux overlays and Mac disk-image shadow files. Two simultaneous T3 views passed normal typechecks; unit suites and web builds passed on both systems. A write in one view left the other unchanged. The entire Mac base image also kept its original hash.

That's a working isolation prototype, with cache preparation and mount costs. It hasn't established a general Mac speed win. The simpler supported choice for independent package files is `clone-or-copy`; on filesystems without cloning, that means copying.

Compare installation time, typechecking and write isolation together. A faster install can be doing less work because it promises less isolation.

---

## Glossary

| Term / claim | Primary source | Date |
| --- | --- | --- |
| Worktree: another checkout sharing Git history | [Git manual](https://git-scm.com/docs/git-worktree) | Checked Oct 28, 2026 |
| Platform import order and private copies | [pnpm import methods](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/settings/node-modules.md#packageimportmethod) | Checked Oct 28, 2026 |
| Shared packages and trust boundary | [Global virtual store](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/global-virtual-store.md) | Checked Oct 28, 2026 |
| Read-only stores need explicit support | [pnpm frozenStore](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/settings/store.md#frozenstore) | Checked Oct 28, 2026 |
