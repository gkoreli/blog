---
title: "OSS Radar #18: When a File Looks Unchanged"
seoTitle: "OSS Radar #18: File Reuse in mise, Dagger, and restic"
alternativeHeadline: "How Three Tools Handle a File Edit That Preserves Size and Modification Time"
date: "2026-11-30"
description: "An older restic restore returned damaged bytes and a success status. Tests in mise, Dagger, and restic show when each tool reads a file again."
section: oss-radar
series:
  id: oss-radar
  title: OSS Radar
  order: 18
tags: [oss-radar, open-source, build-cache, backup, mise, dagger, restic]
---

# OSS Radar #18: When a File Looks Unchanged

On Alpine, restic 0.19.1 restored an 8 MiB file over a hard-linked copy. The result matched the snapshot's size and modification time. Its SHA-256 differed. Retrying with `if-changed` and `--verify` reported zero files verified. Version 0.20.0 recovered the expected bytes from the same snapshot.

mise and Dagger also use file metadata when they reuse build work. In all three tools, a decision about whether to read a file can come before the checksum you see in a trace or verification report.

## Sources and selection

This issue started with 21 public GitHub release lookups on November 24. The pool included task runners, build tools, data tools, and projects from [the first OSS Radar](/oss-radar-01-vercel-winter-2026-cohort). Three releases had a file decision we could exercise locally. mise added a sandbox for cached tasks, Dagger narrowed the checksum used for Dockerfile copies, and restic fixed a restore over hard links. The selection favors tools that can be tested on synthetic files. [Source pool and trial records](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18).

## The projects

### mise — declare the files that decide a build

mise runs project tasks and can save their outputs in an artifact cache. Its experimental `cache.sandbox` in v2026.11.14 derives the Linux sandbox from the task declaration. This gives a team a way to catch a file its build reads but forgot to list as an input. On macOS, mise warns that sandbox enforcement requires Linux and then runs the task. [Release and sandbox rules](https://github.com/jdx/mise/releases/tag/v2026.11.14).

Our task built a text file from the app source and a file containing the build mode. Only the app source appeared in `sources`. After changing the mode from `debug` to `release`, the ordinary artifact cache restored the previous output on both platforms. With the sandbox requested, Linux denied the undeclared read and the task failed. The macOS run still restored `debug`. Adding the mode file to `sources` made the same edit rebuild the correct output on both platforms. [Task fixture and platform results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18/mise).

On Linux, giving the sandbox `--allow-read=build-mode.txt` also made the task run. Changing the mode still restored `debug`. The task read `release` only after a declared input changed and the cache missed. A read allowance puts the allowed path in the cache key. A `sources` entry puts the file's contents there. [Read allowance rules](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/docs/tasks/caching.md#cache-sandbox) · [Linux control](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/mise/allowance-alpine-2026-11-26.json).

We also edited a declared file in place, preserving its length and modification time. With `sources` and `outputs` alone, mise's default freshness check skipped the task and left `edition-A` in the output. The artifact cache missed, produced `edition-B`, and later restored it under a new key. Enabling `settings.task.source_freshness_hash_contents` rebuilt correctly without the artifact cache. Both content-checking paths can reuse a saved per-file digest, and the status-change time, `ctime`, is part of that reuse check on the tested systems. If your build tools preserve timestamps, choose content freshness for the paths you want compared. Exercise the sandbox on Linux when you want a missing input declaration to fail the task. [Freshness implementation](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_source_checker.rs) · [Edit controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/mtime-alpine-2026-11-25.json).

We made the same kind of edit to the generated output, with the source untouched. The artifact cache's default freshness check called the task up to date and left the edited bytes in place. With content freshness enabled, mise restored the saved artifact. A normal task with content freshness rebuilt the same expected bytes. [Existing-output controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/destination-alpine-2026-11-25.json).

### Dagger — check what reached the engine

Dagger runs container builds as workflows. In 0.21.11, an unfiltered Dockerfile `COPY` obtained its content identity by hashing the result directory. In 0.21.12, Dagger combines the destination parent's identity and copy arguments with the content and paths of the sources selected by the copy. A CI user reported slower builds after an engine upgrade and a Dockerfile change. The maintainers traced a copy-related cost and backported the narrower checksum. [CI report](https://github.com/dagger/dagger/issues/14749) · [Backport](https://github.com/dagger/dagger/pull/15040).

We built a tiny two-stage Dockerfile on both releases. Changing an adjacent file in the source stage kept the final file's contents the same. Changing the selected file changed the final contents. In both edited runs, the 0.21.11 copy trace requested a checksum for the result root. The 0.21.12 trace requested one for the selected file. In a separate 0.21.12 run, `COPY --exclude` still requested the checksum of the result root. The measurements show what the copy asked to hash in small scratch-based builds. [Engine images, fixtures, and trace results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18/dagger).

The preserved-timestamp edit stopped earlier. Both engines read `selected-v2` from the imported host directory while the same-size local file contained `selected-v3`. The cached copy returned `selected-v2`. Advancing the file's modification time brought `selected-v3` into the host directory and the build. Dagger's host sync uses file size and modification time as part of its change check. If a generator preserves both, read the imported file at least once before diagnosing the layer cache. [Host file comparison](https://github.com/dagger/dagger/blob/6ccf00943c1b4f065dea791b6d6ee956573fdabe/engine/filesync/diff.go#L173-L190) · [Per-run host and output reads](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/dagger/dagger-comparison-2026-11-24.json).

### restic — verify the recovered file

In an incremental backup, restic can reuse a file's existing data chunks when its metadata matches the parent snapshot and those chunks are still in the repository. The default comparison checks `ctime` and inode along with file size and modification time. In our local repositories on Linux and macOS, the unchanged repeat added zero data chunks. After the same-size, time-preserving edit, `ctime` advanced and the next backup added one data chunk. Reading the file from that snapshot returned the edited bytes, matching a forced reread. [Archive implementation](https://github.com/restic/restic/blob/9c88ff768f10c192dc6a87619a65a16374080e33/internal/archiver/archiver.go#L632-L659) · [Backup comparison](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18/restic).

The restore change began with a user report about keeping successive restores with hard links. A hard link gives the same file another name. When restic has to restore a linked file, it replaces the target to preserve the bytes at the other name. The old restorer had already marked matching chunks as present before the writer created the empty replacement. Version 0.20.0 clears those marks and writes the whole file. [User report](https://github.com/restic/restic/issues/22085) · [Restore fix](https://github.com/restic/restic/pull/22086).

We backed up two versions of an 8 MiB file and used the same pair of snapshots on both releases within each platform. Ordinary copies of the earlier restore updated correctly. The hard-linked target on 0.19.1 came back mostly zero-filled on Alpine and more than a million bytes short on macOS. Both restores exited successfully. Version 0.20.0 recovered the expected bytes on both systems. The earlier copy retained its bytes and an unchanged file kept its hard link. [Alpine comparison](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/restic/comparison-alpine-2026-11-26.json) · [macOS comparison](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/restic/comparison-macos-2026-11-26.json).

On 0.19.1, `--verify` caught the damaged file when we enabled it on the first restore. On Alpine, adding it on the second `if-changed` restore left the full-size damaged file in place. The policy had accepted its size and modification time. The verification pass checks files that went through content restoration. In a separate 0.20.0 test, the same policy retained an edited target with matching metadata and checked zero files. `--overwrite always --verify` recovered the snapshot's bytes and checked one. [Size and time check](https://github.com/restic/restic/blob/9c88ff768f10c192dc6a87619a65a16374080e33/internal/restorer/restorer.go#L734-L769) · [Verification scope](https://github.com/restic/restic/blob/9c88ff768f10c192dc6a87619a65a16374080e33/internal/restorer/restorer.go#L645-L682) · [Destination controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/destination-alpine-2026-11-25.json).

## What the projects show

Content checks and metadata checks can coexist in the same workflow. restic's backup considered `ctime` when it picked up a same-size edit. Its `if-changed` restore could keep an existing file based on size and modification time alone. Dagger's narrower copy checksum still depended on what the host import had read. A trace or verification count tells you more when you know which files reach that step.

## The distillation

mise's sandbox is worth trying on a Linux build whose inputs and output directory you can name. Change one real input and inspect the artifact you get back. If a generator feeds Dagger and preserves timestamps, compare a local file with what the engine sees before chasing a cache hit. For a restic recovery drill, start with an empty target and verify the result. When reusing a restore directory, you can compare the file with a `restic dump` of the same snapshot. If two paths initially shared the file, read the earlier copy too.

## Sources

- [Issue research and selection](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18) records the full pool, release pins, and the two-platform edit fixture.
- [mise's release guide](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/docs/tasks/caching.md) explains the cache declarations and the Linux sandbox.
- [Dagger's comparison receipt](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/dagger/dagger-comparison-2026-11-24.json) includes both released engines, host inputs, and copy traces.
- The restic release notes describe the hard-link change. The fixture compares both releases on matched snapshots and destinations. [Release notes](https://github.com/restic/restic/releases/tag/v0.20.0) · [Two-version fixture](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/restic/compare_hard_link_restores.py).
