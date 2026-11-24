---
title: "OSS Radar #17: What Still Works After an Upgrade?"
seoTitle: "OSS Radar #17: Bun, flagd, pgroll, and Hot Updater"
alternativeHeadline: "Four tested upgrades in compression, feature flag assignment, Postgres schema changes, and React Native updates"
date: "2026-11-24"
description: "Bun changed what Zstandard wrote and kept old decoders working. Trials of flagd, pgroll, and Hot Updater show what survives a rollout."
section: oss-radar
series:
  id: oss-radar
  title: OSS Radar
  order: 17
tags: [oss-radar, open-source, bun, postgres, react-native, feature-flags]
---

# OSS Radar #17: What Still Works After an Upgrade?

Bun's November 20 canary took nine bytes out of each Zstandard stream we tested. Stable Bun and Node decoded every one. The same canary's compiled program still read an old config file after we pointed a symlink at its replacement.

That difference is worth looking for during any rollout. What still reaches the right reader, user, connection, or installed app once the implementation changes?

## Sources and selection

Bun returns from [Radar #5](/oss-radar-05-bun-1-4) and [the AOT tests in #8](/oss-radar-08-bun-aot). The new work came from Bun's public stable and canary builds and the implementation changes behind them. Hot Updater returns from [the first Radar](/oss-radar-01-vercel-winter-2026-cohort) after a React Native developer reported that changing a store build number also changed which updates their app could receive. flagd and pgroll came from public release and maintainer work. The [research record](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-17) covers the working selection and the fixtures run with AI assistance.

## The projects

### Bun — check what changes on the wire and in the executable

Bun combines a JavaScript runtime, bundler, test runner, and package manager. Its August release moved the runtime from Zig to Rust. The new work replaces compression implementations behind APIs people already use and revises parts of ahead-of-time compilation. The stable release checked on November 20 was 1.4.5. The recent changes below are from the November 20 canary, which reported `1.4.6-canary.1+7bb427f3b`. [Stable release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.5) · [Tested canary source](https://github.com/oven-sh/bun/tree/7bb427f3be953a1a9bf575ee8c87dc0946106de1).

#### The same data through three new codecs

Three changes replace the linked DEFLATE, Brotli, and Zstandard implementations on Bun's compression paths. The `node:zlib` bindings now call Bun's Rust codecs. This matters if you use Bun through Node-compatible APIs and your compressed files live longer than the process that wrote them. Some of the same codec work also backs web streams and HTTP decompression. [DEFLATE change](https://github.com/oven-sh/bun/pull/49187) · [Brotli change](https://github.com/oven-sh/bun/pull/49035) · [Zstandard change](https://github.com/oven-sh/bun/pull/49205) · [Pinned Node-compatible bindings](https://github.com/oven-sh/bun/tree/7bb427f3be953a1a9bf575ee8c87dc0946106de1/src/runtime/node/zlib).

The trial used 4,000 synthetic API log lines, the Markdown source of Radar #8, and 128 KiB of seeded binary data. Stable Bun, the canary, and Node 24 each encoded all three inputs as gzip, Brotli, and Zstandard, in one buffer and in chunks. Each runtime decoded all 54 outputs both ways. All **324 decode checks** matched the original bytes. Both Bun builds also read all nine compressed HTTP responses served on loopback by Node. [Fixture and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-17/bun).

The nine one-buffer outputs matched byte for byte between the two Bun builds. The three chunked Zstandard outputs were each nine bytes shorter in the canary. In each case the canary's output was the exact prefix of the stable output, and Node decoded the remaining nine bytes as an empty frame. That matches a change the maintainers describe in the stream writer. Store the compressed size and check the decoded data when you compare these artifacts across releases. [Zstandard stream change](https://github.com/oven-sh/bun/pull/49205) · [Byte comparisons](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-17/bun/codecs-2026-11-20.json).

Speed moved in both directions. These are medians for 13 in-memory operations on the same 584 KB log input, measured across five alternating runs of each build in one ARM64 Linux guest. Both decoders read the same bytes produced by Node. Compression used gzip level 6, Brotli quality 4, and Zstandard level 3. [All samples and input hashes](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-17/bun/codecs-2026-11-20.json).

| API log operation | Bun 1.4.5 | November 20 canary |
| --- | ---: | ---: |
| Gzip decode | 6.63 ms | 3.87 ms |
| Brotli decode | 4.65 ms | 3.97 ms |
| Zstandard encode | 6.13 ms | 7.04 ms |

Gzip decoding also took less time on the article and binary inputs. Brotli's fastest and slowest log runs overlapped between builds. The Zstandard encode result is a reason to replay a representative batch before counting on an upgrade to speed up a service that writes compressed logs. The comparison includes the full binaries and one machine, so it gives you a workload to check on your own deployment. [Timing samples](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-17/bun/codecs-2026-11-20.json).

#### AOT can keep using the old config file

The latest compiler changes include how `require.resolve()` handles an absolute path. We built a small reader on a Mac with the November 19 and 20 canaries. `active.json` pointed to `v1.json` at build time. After the first run, we pointed the symlink at `v2.json` and ran the same executable again. The older AOT build failed when the literal path went through `require.resolve()`. The newer build opened `v1.json` successfully. After the symlink changed, it still opened `v1.json`, even when we passed `active.json` as an argument to `require.resolve()`. Running the source read `v2.json`. So did a direct file read of the argument in the same AOT executable. [Compiler change](https://github.com/oven-sh/bun/pull/49145) · [Path test and exact outputs](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-17/bun/aot-2026-11-20.json).

A small TypeScript program that compared two rollout lists returned the same JSON from source, a regular standalone build, and an AOT build. The last two executables were 139.3 MB and 53.4 MB on that Mac. In the test runner, an ordinary preload order check agreed between `bun test` and `bun test --aot` on both canaries. A later attempt to replace a module whose earlier import failed still failed in both modes in our fixture. A team moving to AOT can test the actual executable against its normal inputs and against the changes it expects operators to make after building, such as rotating a config file. [Compiler and test fixtures](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-17/bun).

### flagd — keep people assigned as an experiment grows

An application can ask flagd to resolve a feature flag for a user. The default fractional operation hashes the flag key and the user's targeting key together. The hash picks a point in cumulative ranges laid out in the order of the variants. Editing the ranges changes which people get a variant even when their keys are stable. [flagd v0.19.0](https://github.com/open-feature/flagd/releases/tag/flagd/v0.19.0) · [Range selection](https://github.com/open-feature/flagd/blob/11037220611eab982261d2348b13147b4450b562/core/pkg/evaluator/fractional.go#L278-L293).

On the released daemon, increasing a rollout from 10% to 25% kept all 12 early identities in the new variant. Reversing the two weight pairs at the same 25% sent all 32 identities back to the old variant. Twenty-one other identities took their place. The daemon reloaded the file for both edits, with the same 128 test keys. [Versioned fixture and results](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-17/flagd).

The maintainers' experiment guide uses two fractional rules, one for enrollment and one for assignment to test or control. We tried that and the flat rule on the daemon. Raising flat enrollment from 20% to 80% moved all nine original test identities into control. With separate seeds for enrollment and assignment, all 18 early participants kept their original arms and 86 more joined. With the same seed for both steps, all 26 early participants landed in test. The counts describe these 128 keys. The reason for the last result is general to that rule. At 20% enrollment, the first fifth of a hash range also lies entirely inside the first half. [Maintainer guide](https://github.com/open-feature/flagd/blob/11037220611eab982261d2348b13147b4450b562/docs/guides/experimentation.md) · [Assignment transitions](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-17/flagd/experiment-ramp-2026-11-19.json).

If an experiment needs consistent test and control groups, use separate seeds from the start and check membership across the exact changes you expect to make. A percentage describes the size of a range. To find out who stayed in it, compare the assignments.

### pgroll — keep old and new database clients writing

pgroll lets two application versions use different Postgres schemas while a migration runs. We changed an inventory column from text to integer. The old view read `007` while the new one read `7`. Both versions wrote through their views in the same migration. After the integer client changed the row and pgroll rolled back, the old schema and the intervening writes were there. The first row now read text `7`. Converting the integer back to text had already discarded the leading zeroes. [pgroll v0.16.3](https://github.com/xataio/pgroll/releases/tag/v0.16.3) · [Conversion and rollback results](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-17/pgroll/results-2026-11-19.json).

The next check kept one physical PostgreSQL 17.12 connection open through a real migration and rollback. `SET LOCAL search_path TO public_v2` selected the new view for a transaction. After commit or transaction rollback, the same connection returned to the old schema it had selected before. A session-level `SET` persisted after commit. When pgroll removed the new schema, that session still held `public_v2` and got a missing-relation error until it selected `public_v1`. Its committed writes were visible there. [Connection fixture and results](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/oss-radar-17/pgroll/connection-2026-11-20.json).

There is another detail to check in a connection pool. `public_v2, public` let us read the integer view, yet a new write failed a `NOT NULL` constraint. The generated trigger compares the whole `search_path` string to the new schema name to choose the conversion. A collaborator's issue describes why that can conflict with clients that already use the setting. Try one real checkout, commit, return, and reuse with your driver before planning a rollback. This trial exercised a single reused backend and a small table. [Generated trigger](https://github.com/xataio/pgroll/blob/777a5350e09012b29d26b9611122046d8a96fc1c/pkg/backfill/templates/function.go#L17-L27) · [Client configuration discussion](https://github.com/xataio/pgroll/issues/829).

### Hot Updater — keep compatible mobile builds eligible for updates

Hot Updater sends JavaScript bundles to React Native apps over the air. It can match an update to a fingerprint that represents what a native build exposes to JavaScript. A user on 1.0.2 followed the guide and included their Xcode project and Android Gradle files in that fingerprint. Those files also held the store build numbers. Bumping the numbers alone created new fingerprints, which split otherwise compatible builds into separate update targets. [User report](https://github.com/gronxb/hot-updater/issues/1552) · [Maintainer's implementation](https://github.com/gronxb/hot-updater/pull/1570).

We reproduced the build-number change in 1.0.2. With the default bare adapter in 1.1.0 and 1.1.17, the same edit kept both platform hashes stable. Adding a method to a shared React Native codegen spec changed both. An iOS-only spec changed only iOS. Keeping the old build files in `extraSources` brought back the change on every tested build-number bump. A Swift edit outside the tracked inputs left the default fingerprint alone. Explicitly listing that Swift file let a later edit change the iOS fingerprint. [Pinned input selection](https://github.com/gronxb/hot-updater/blob/08a4cbca00214511ddb983a76a0a2b5781f7c8e1/packages/cli-tools/src/interfaceFingerprint.ts#L630-L841) · [Three-version trial](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-17/hot-updater).

The shipped iOS SDK script added a wrinkle. With a changed spec and an old saved fingerprint, the Debug script wrote the saved hash and the Release script recomputed it. Both invocations used a synthetic project. To upgrade a real app, review the files you used to track and the native interfaces that matter to JavaScript. A change outside the default inputs can be declared with `extraSources` or a `nativeVersion` marker. The maintainer calls for fresh store builds at the original engine transition, when older binaries still report their old fingerprints. [Build script](https://github.com/gronxb/hot-updater/blob/08a4cbca00214511ddb983a76a0a2b5781f7c8e1/packages/react-native/ios/scripts/generate-fingerprint-hash.zsh#L48-L84) · [Maintainer's upgrade note](https://github.com/gronxb/hot-updater/issues/1552#issuecomment-6259374272).

## What the projects show

An upgrade test gets more useful once it includes something from before the change. A pipeline may need to recover the original data from a newly written file. An experiment may need to keep the same people in each group. A deployment may need an open connection to pick up a schema change or a compiled program to read a config file that moves after the build. The success conditions are different. Record the result at the point where the old decoder, user, connection, or binary encounters the new behavior.

## What to try

For Bun, start with saved compressed artifacts that your application will have to read after the upgrade. Give AOT its own check if the app depends on files that operators can move or replace. For flagd, compare the assignment set before the first ramp on a new experiment. The higher-cost checks are database and mobile deployments. A pool's reset policy and a Release build's embedded fingerprint are worth exercising with the actual clients before the old and new versions have to coexist.

## Sources

- [Bun release and canary trials](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-17/bun) include archive checksums, runtimes, fixture hashes, and timing samples.
- [flagd's experiment guide](https://github.com/open-feature/flagd/blob/11037220611eab982261d2348b13147b4450b562/docs/guides/experimentation.md) explains the two-stage rule. [Daemon fixtures](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-17/flagd) record the observed assignments.
- [pgroll's application guide](https://pgroll.com/docs/latest/guides/clientapps) describes setting the version on a client connection. [Database fixtures](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-17/pgroll) cover the type change and the reused backend.
- [Hot Updater's return visit](https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/oss-radar-17/hot-updater) records the release pins, package integrity, and iOS script outputs.
