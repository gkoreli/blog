---
title: "OSS Radar #18: When a File Looks Unchanged"
seoTitle: "OSS Radar #18: File Reuse in mise, Dagger, and restic"
alternativeHeadline: "How Three Tools Handle a File Edit That Preserves Size and Modification Time"
date: "2026-11-30"
description: "A file kept its size and modification time after an edit. Dagger used the old bytes, mise's artifact cache rebuilt, and restic captured the edit."
section: oss-radar
series:
  id: oss-radar
  title: OSS Radar
  order: 18
tags: [oss-radar, open-source, build-cache, backup, mise, dagger, restic]
---

# OSS Radar #18: When a File Looks Unchanged

We changed a file and kept its size and modification time. Dagger's cached copy returned the old bytes. With the same kind of edit, mise's artifact cache rebuilt the output and restic read the new bytes into its next backup. All three made a decision about which work they could skip.

The useful question is where each tool decides a file has changed. A checksum can describe the exact bytes it receives. The tool still has to decide whether to read those bytes again.

## Sources and selection

This issue started with 21 public GitHub release lookups on November 24. The pool included task runners, build tools, data tools, and projects from [the first OSS Radar](/oss-radar-01-vercel-winter-2026-cohort). Three releases had a file decision we could exercise locally. mise added a sandbox for cached tasks, Dagger narrowed the checksum used for Dockerfile copies, and restic fixed a restore over hard links. The selection favors tools that can be tested on synthetic files. [Source pool and trial records](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18).

## The projects

### mise — declare the files that decide a build

mise runs project tasks and can save their outputs in an artifact cache. Its experimental `cache.sandbox` in v2026.11.14 derives the Linux sandbox from the task declaration. This gives a team a way to catch a file its build reads but forgot to list as an input. On macOS the release warns that Linux enforces the sandbox and runs the task. [Release and sandbox rules](https://github.com/jdx/mise/releases/tag/v2026.11.14).

Our task built a text file from the app source and a file containing the build mode. Only the app source appeared in `sources`. After changing the mode from `debug` to `release`, the ordinary artifact cache restored the previous output on both platforms. With the sandbox requested, Linux denied the undeclared read and the task failed. The macOS run still restored `debug`. Adding the mode file to `sources` made the same edit rebuild the correct output on both platforms. [Task fixture and platform results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18/mise).

We also edited a declared file in place, preserving its length and modification time. With `sources` and `outputs` alone, mise's default freshness check skipped the task and left `edition-A` in the output. The artifact cache missed, produced `edition-B`, and later restored it under a new key. Enabling `settings.task.source_freshness_hash_contents` rebuilt correctly without the artifact cache. Both content-checking paths can reuse a saved per-file digest, and the status-change time, `ctime`, is part of that reuse check on the tested systems. If your build tools preserve timestamps, choose content freshness for the paths you want compared. Exercise the sandbox on Linux when you want a missing input declaration to fail the task. [Freshness implementation](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_source_checker.rs) · [Edit controls](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/mtime-alpine-2026-11-25.json).

### Dagger — check what reached the engine

Dagger runs container builds as workflows. In 0.21.11, an unfiltered Dockerfile `COPY` obtained its content identity by hashing the result directory. In 0.21.12, Dagger combines the destination parent's identity and copy arguments with the content and paths of the sources selected by the copy. A CI user reported slower builds after an engine upgrade and a Dockerfile change. The maintainers traced a copy-related cost and backported the narrower checksum. [CI report](https://github.com/dagger/dagger/issues/14749) · [Backport](https://github.com/dagger/dagger/pull/15040).

We built a tiny two-stage Dockerfile on both releases. Changing an adjacent file in the source stage kept the final file's contents the same. Changing the selected file changed the final contents. In both edited runs, the 0.21.11 copy trace requested a checksum for the result root. The 0.21.12 trace requested one for the selected file. In a separate 0.21.12 run, `COPY --exclude` still requested the checksum of the result root. The measurements show what the copy asked to hash in small scratch-based builds. [Engine images, fixtures, and trace results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18/dagger).

The preserved-timestamp edit stopped earlier. Both engines' host directories still read `selected-v2` when the same-size local file contained `selected-v3`. The cached copy returned `selected-v2`. Advancing the file's modification time brought `selected-v3` into the host directory and the build. Dagger's host sync uses file size and modification time as part of its change check. If a generator preserves both, read the imported file at least once before diagnosing the layer cache. [Host file comparison](https://github.com/dagger/dagger/blob/6ccf00943c1b4f065dea791b6d6ee956573fdabe/engine/filesync/diff.go#L173-L190) · [Per-run host and output reads](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/dagger/dagger-comparison-2026-11-24.json).

### restic — verify the recovered file

In an incremental backup, restic can reuse a file's existing data chunks when its metadata matches the parent snapshot and those chunks are still in the repository. The default comparison checks `ctime` and inode along with file size and modification time. In our local repositories on Linux and macOS, the unchanged repeat added zero data chunks. After the same-size, time-preserving edit, `ctime` advanced and the next backup added one data chunk. Reading the file from that snapshot returned the edited bytes, matching a forced reread. [Archive implementation](https://github.com/restic/restic/blob/9c88ff768f10c192dc6a87619a65a16374080e33/internal/archiver/archiver.go#L632-L659) · [Backup comparison](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18/restic).

The change that brought restic into this issue affects the other end of a backup. A user reported damaged sections in an older version after restoring over a hard-linked copy of an earlier restore. The restorer had found matching chunks in the existing file. Replacing that file to preserve its other links meant those bytes needed writing again. Version 0.20.0 clears the matches when it has to replace a hard-linked file. In a local macOS restore, we tested an 8 MiB sample whose snapshots shared seven of eight data chunks. The new file matched the expected bytes and the earlier copy retained its bytes. A second, unchanged file kept its shared inode. [User report](https://github.com/restic/restic/issues/22085) · [Restore fix](https://github.com/restic/restic/pull/22086) · [Restore hashes and inode checks](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/restic/macos-2026-11-24.json).

## What the projects show

A task declaration says which files the cache will account for. A file transfer decides which bytes the build engine sees. A restore decides whether it can keep the target's existing bytes. mise can check a task's declaration, Dagger can show the files its copy asked to checksum, and restic can read back a file from a recorded snapshot.

If you depend on reuse across runs, make one representative edit and inspect the bytes at the point your workflow will use them. For a build, that may mean reading one imported input next to the final artifact. For a recovery that starts from an earlier restore, compare the new file's hash and check the earlier copy as well. A clean second run is a useful control for either test.

## Sources

- [Issue research and selection](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-18) records the full pool, release pins, and the two-platform edit fixture.
- [mise's release guide](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/docs/tasks/caching.md) explains the cache declarations and the Linux sandbox.
- [Dagger's comparison receipt](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/dagger/dagger-comparison-2026-11-24.json) includes both released engines, host inputs, and copy traces.
- [restic's release notes](https://github.com/restic/restic/releases/tag/v0.20.0) include the hard-link restore change. The [fixture](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-18/restic/restore_links_trial.py) exercises it on local files.
