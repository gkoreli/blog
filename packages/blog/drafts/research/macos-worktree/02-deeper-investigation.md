# Deeper investigation, October 28–29, 2026

This supersedes the first pass's tiny-fixture-centered argument. The readable article remains an unpublished four-to-five-minute draft. UTC measurement dates may be October 29 while the author's local date is October 28.

## What the source history adds

### T3's install cleanup preceded the chart

[T3 PR 22718](https://github.com/pingdotgg/t3code/pull/22718), merged October 21 at 07:50:23 UTC, reports an October 20–21 fleet audit:

- Mainbook's architecture settings installed 142 unused packages, reported as 2.2 GB. The fix retains extra Linux binaries only for Windows, where WSL shares the installed tree.
- BB-1 had 169 worktrees with full dependency copies. Its package store was on ext4 and worktrees on XFS. The PR reports approximately 3 GB per copy. These are the project's figures; neither physical disk use nor the old fleet was independently measured here.
- Agents sometimes started their own install while background setup was still running. The fix adds running, success and failure markers so agents can wait.

[Pinned setup code](https://github.com/pingdotgg/t3code/blob/125b61954dbba5822a8108c8ca47a4846b4b4328/scripts/setup-worktree.ts) calls `vp i --frozen-lockfile -- --yes`. After installation it compares the store and dependency directory's device IDs and warns on a mismatch. [The hook](https://github.com/pingdotgg/t3code/blob/125b61954dbba5822a8108c8ca47a4846b4b4328/.pnpmfile.cjs) limits the extra architecture configuration to Windows.

This identifies a concrete historical Linux setup problem. It does **not** establish that this was the exact fix used to select every after-fix chart sample: the chart's raw records and harness remain unavailable.

[T3 PR 22738](https://github.com/pingdotgg/t3code/pull/22738), merged October 21 at 08:07:46 UTC, pins pnpm 12.14.0. Its reported warm-store clean-install runs using `vp 1.3.0` are:

| pnpm | Reported seconds | Median calculated from the table |
| --- | --- | ---: |
| 11.10.0 | 15.1, 11.2, 11.2 | 11.2 |
| 12.14.0 | 4.7, 2.5, 2.4 | 2.5 |

The body rounds its comparison to 11.2→2.4; the actual listed median is 2.5. Hardware is unspecified. The PR discloses AI authorship. Its data are useful project reports, not independent corroboration or a controlled Mac/Linux comparison. Both PRs predate the October 28 chart, so an older pnpm benchmark cannot establish the current T3 result.

### pnpm 12 already avoids some per-file Mac work

The [tested release's directory-clone cache](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/dir_clone_cache.rs) creates a cached package directory and clones that directory into the checkout. This can replace one import operation per file with one per eligible package. It works for local isolated or hoisted layouts on macOS when cloning is possible; explicit hardlink/copy modes and ineligible mutable or build-sensitive slots take other paths. Cross-volume or unsupported filesystems disable this cache and fall back to per-file imports.

This is distinct from the experimental global virtual store: default directory clones remain independent local package copies with copy-on-write storage; a global virtual store reuses shared package directories across projects. The first draft missed the default optimization and overemphasized the opt-in setting. A current-version comparison must test default behavior first.

The source comments attribute the optimization to serialized APFS metadata writes and report their own throughput experiments. That is an implementation rationale, not independent proof that the entire viral gap is APFS. [Issue 14231](https://github.com/pnpm/pnpm/issues/14231) also records a macOS regression in **12.0.0**, including slower clone and hardlink results; it must not be presented as a measurement of **12.14.0**. The two visible follow-up comments are automated triage, not additional independent experiments. [Pacquet issue 273](https://github.com/pnpm/pacquet/issues/273) is another maintainer profiling lead, not a substitute for testing the selected release.

## Discussion coverage and reader questions

The deeper browser pass saved 65 article observations representing 33 distinct status URLs in the captured data. This includes Theo's method reply, selected Relevant-order reply groups, several page advances, two question subthreads and a focused Latest search for Theo's pnpm/filesystem/optimization/ZFS follow-ups dated October 27–29. The focused search showed the already-known ZFS reply. Root-post metrics changed while browsing; this sample does not cover all replies or establish how common any view is. Raw social captures remain outside Git.

Additional useful questions:

- [Where does setup stall?](https://x.com/JacobPetterle/status/2115484058042126735): separate source checkout, dependency installation, package build scripts and agent work. The chart only establishes the stated install boundary.
- [Were copy-on-write and sparse checkout used?](https://x.com/rbbydotdev/status/2115343300714713297): no complete Mac optimization list was found in the inspected source set. Modern pnpm already has a package-directory clone path; that is not proof the measured machines used it.
- [What if Linux runs in a VM on the same Mac?](https://x.com/BrennerSpear/status/2115398840912085356): test guest-native storage, not a host folder mounted inside Linux. Virtualization, kernel, filesystem and resource allocation remain changed together.
- [Does this make an entire coding task faster?](https://x.com/jackson_felty/status/2115398687455395893): an install multiplier is not an end-to-end agent multiplier. The reply's model-generated timing estimates were not adopted.

No outreach, replies or social shares were sent. Windows/WSL, ZFS compression effects and concurrent-agent saturation remain outside this short article's measured scope.

## Corrections caught before acceptance

1. The `node` mise shim selected global Node 20.20.2 inside `/tmp`, despite Node 24.14.1 in the blog checkout. The original small fixture recorded the parent's runtime, not the child's. Its timing claim is superseded; retain the historical JSON but remove it from the article. Accepted new runs use an absolute binary, put its directory first in child `PATH`, and verify the version inside the workload.
2. pnpm 12 automatically handed off to the old workload's pinned pnpm 10.2.1, even on a `--version` probe. The initial two `seed12` runs were actually pnpm 10 and are excluded from every pnpm 12 comparison. The corrected driver sets `npm_config_manage_package_manager_versions=false` and checks the executing version against the requested CLI package's own manifest. A version-looking label is not evidence of a version.
3. A sandboxed Mac install failed on Prisma's external cache timestamp update. It is excluded. The inspected script is run outside the Codex filesystem sandbox for accepted host measurements, matching the unconfined guest install. This does not disable OS protections or indexing.
4. An earlier zero-exit seed stopped at an interactive prompt. The runner now closes stdin, sets CI mode, rejects observed prompts, checks an install completion message and verifies every requested direct dependency. This catches an empty or incomplete install masquerading as a fast result.
5. A sample-assisted initial full install used Node 20 and incurred profiling overhead. It is diagnostic only. Its thread stack samples often showed `clonefileat`, `mkdir`, `symlink` and `stat`; the counts are neither syscall counts nor percentages of elapsed time.
6. A genuine pnpm 12 frozen install of the unchanged old benchmark failed on both platforms with `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`. Its root and 34 project locks record `autoInstallPeers: false`; Aurelia's lock records `true`. pnpm 10 accepted the old workload; pnpm 12 rejects the mismatch. The source and locks were not rewritten to manufacture an upgrade result. The actual T3 project supplies a contemporary frozen-lockfile workload instead. These are different projects; their relative times cannot establish a version-only speedup.

## Environment and measurement boundary

Host: Apple M5, 10 logical CPUs, 24 GiB RAM, macOS 27.0.1, APFS data volume. Guest: Debian 13.7 aarch64, kernel 6.12.111+deb13-cloud-arm64, four vCPUs, four GiB configured RAM, native ext4 volume under Apple's Virtualization.framework via Lima 2.2.1. Packages and worktrees live in guest-native storage. The shared research mount is only for transferring tools and source. This controls the physical computer, not the entire software stack or CPU allocation. It is neither a bare-metal Linux benchmark nor an isolated APFS experiment.

The host's data volume reported indexing enabled when queried outside the command sandbox. Filesystem event processing was active. No indexing or OS protection settings were changed; unrelated host services and sessions remained running. A sandboxed `mdutil` command misleadingly reported its service unavailable/disabled, another reason to distinguish the tool sandbox from the measured host environment.

The public 35-project workload is pinned at `535aef76843fe52d6336604111708d884110a0e5`; its tracked-input hash is `7b02a3c17df832a6984ca9de2b2838c0441c2b864da122811c901074b793be17`. It uses Node 24.14.1. One Sails project requests Node ^22.11 and warns under Node 24; keep this limitation. The actual T3 baseline is pinned at `125b61954dbba5822a8108c8ca47a4846b4b4328` and uses its exact Node 26.12.1 requirement.

Official Node 26.12.1 archive SHA-256 values checked against the vendor's SHASUMS256.txt:

- Darwin arm64: `18830bf448fe187c650dc28c98aa8c968ed1d40b6dd032c081e70a384a1bf660`
- Linux arm64: `42aa04922591ee5d4dbc7740d452621acf28508239daa512f5ee8c47ee224fdb`

Online cache filling, package extraction, guest provisioning and profiled diagnostics are outside accepted timed series. Installs use frozen lockfiles and cached package mode. `--offline` prevents registry cache misses from silently downloading; it is not proof that arbitrary lifecycle children never use the network. Record scripts-on and scripts-off separately. Cleanup is separately timed and excluded from install figures. No production build, running application benchmark or whole-agent comparison is implied.

Accepted results and exact commands are recorded below and in the derived ledger. Excluded warmups, failed attempts and compatibility controls remain separate.

## A fast install failed the next useful check

On the actual T3 project, three warmed shared-store installs completed in 0.867, 0.710 and 0.702 seconds. All 599 requested direct dependencies were present, the complete tracked-input hash remained unchanged, node-pty loaded and sharp encoded a valid PNG. Local dependency directories contained 266 regular files, 315 directories and 2,110 symlinks, counted without following package targets outside the checkout. The default layout contained 179,943 regular files, 20,250 directories and 5,704 symlinks. This counts local entries, not deleted package data or physical disk savings.

But `vp run --filter @t3tools/web typecheck` failed in shared mode with 64 errors in 38 files. A repeat preserved the same failure. Restoring the default layout, retaining the identical T3 source and lockfile, made the same command pass. The default check's output shows the actual `tsc --noEmit` command; it was not an empty task selection. This is a compatibility failure in the tested project and toolchain, not a claim that every shared-store project fails. The exact resolution defect has not been diagnosed. Native loading checks alone were insufficient to establish application compatibility. Do not recommend this setting for T3 on the strength of installation speed.

Raw compiler output remains outside Git. The release ledger records the command, exit status and error count; a new-path control checks that the result is not simply a leftover checkout artifact.

## Cross-filesystem control

The guest's primary worktree and store use ext4. A new, named 6 GiB regular-file image was formatted as XFS and loop-mounted inside the disposable guest, with reflinks enabled. No host disk or preexisting guest block device was formatted. Only the public T3 source and Git metadata were copied into its new worktree directory. With the cache still on ext4, store device ID 65025 differs from checkout ID 1792. This recreates the **configuration class** in T3's BB-1 report, not that machine's full environment.

Three cross-filesystem installs passed the input, dependency and native checks. The follow-up copies the existing cache onto the same XFS filesystem and keeps the checkout path, kernel and tools fixed. The initial copy ran out of space while the old installed tree still occupied the image; the subsequent offline warmup therefore failed on missing cached data. Both failures are excluded. Clearing the duplicate installed tree releases room before finishing the cache copy. Do not count an incomplete cache's early failure as a fast install.

XFS lives inside a file on the guest's ext4 volume, itself virtualized on the Mac. These layers limit extrapolation to bare metal. Comparing cross-device and same-device stores for the **same XFS checkout** is the relevant control; comparing its raw time to ext4 alone would change both placement and filesystem.

The second copy completed package files but reported an already-existing project-tracking symlink. Copied `v11/projects` tracking metadata was removed. A subsequent byte-for-byte comparison of **147,761 cache files** under `v11/files` and `v11/index` found identical relative names and content hashes in both stores. The sorted manifest SHA-256 was `e507cca13a7ff2c22b8bcd1f4c9ca5201ac6bbf74cd9c41abe6c94cc73226202`. The successful aligned warmup and three-run series started only after this check. Successful native-module loading and the web typecheck were verified on the aligned XFS install.

For one representative package file, `node_modules/@types/node/index.d.ts`, its SHA-512 content hash located the cache entry. Installed file and cache entry shared the same device and inode, with two hardlinks, in both successful ext4 and aligned XFS layouts. This observes actual file reuse; it is not a count of all imports.

## Accepted results and decision

The [derived ledger](repro/full-results.json) preserves every accepted sample, not only its median. Each row below contains three successful installs. Cleanup is separately recorded and excluded from installation times.

| Workload / configuration | Median install | Observed range |
| --- | ---: | ---: |
| Older 35-project fixture, pnpm 10.2.1, macOS | 44.208 s | 44.183–44.246 s |
| Same fixture and tools, Linux ext4 | 7.904 s | 7.883–9.113 s |
| Actual T3, pnpm 12.14.0, macOS default | 7.753 s | 7.420–8.046 s |
| Same T3/tools, Linux ext4 default | 1.286 s | 1.217–1.425 s |
| Same T3/tools, Mac shared dependencies | 0.710 s | 0.702–0.867 s |
| Same T3/tools, XFS checkout / ext4 store | 7.613 s | 7.552–7.939 s |
| Same XFS checkout / byte-identical XFS store | 1.380 s | 1.367–1.397 s |

All 21 installs completed, preserved the tracked-input hash and matched their expected direct-dependency inventories. The two inventories for the older fixture differ only in project-name serialization: removing the newer `frameworks/` prefix makes all 457 requested names and versions equal. All T3 series and compatibility paths share the same 599-entry direct inventory hash. This counts dependency requests across workspaces, not 599 unique packages. Native optional/transitive dependencies legitimately differ by platform.

The actual T3 Mac/Linux ratio is about **6.03×** for this cached installation boundary. The cache-placement ratio within the same XFS checkout is about **5.52×**. These are descriptive ratios of small-sample medians, not confidence intervals or a forecast for other projects. The old fixture and T3 differ in dependency graph and tools; their times do not establish a version-only speedup.

The shared-store failure also reproduced in a **new Git worktree at a different path**. Invoking its compiler directly, without the task runner, produced 64 errors. Restoring default dependencies in that same fresh worktree made the direct compiler pass. Both source/input hashes and all direct package versions remained unchanged. This resolves the task-cache/leftover-checkout alternative sufficiently for the article; the exact type-resolution defect remains uninvestigated. No upstream issue was filed or maintainer contacted.

### Remaining limits

- Three-run series were grouped, not randomized. Later default-layout and fresh-path controls support the compatibility comparison but are excluded from medians; some overlapped excluded cache preparation. Accepted timed series did not overlap heavy research setup or other benchmark installs. Unrelated host activity remained running.
- Host data volume was approximately 90% used when inspected. Guest ext4 and the nested XFS image had their own free-space conditions. These are real machine conditions, not a clean hardware lab.
- The pnpm 10 worker formula subtracts `abs(PNPM_WORKERS)` from available parallelism, then reserves one worker. With the observed host/guest allocations its defaults differ. Equal runtime versions do not imply equal concurrency. No worker-count recommendation follows from these tests.
- All accepted T3 logs lack fetching/downloading messages and reuse warmed package/build caches. `--offline` does not enforce packet-level isolation for child scripts; the excluded first script warmup explicitly fetched mobile native artifacts.
- Source history and 33 captured reply URLs do not recover the original chart's raw samples, all Mac commands or the exact relationship between its after-fix filter and PR 22718. The article reports its own experiment instead of claiming to reproduce those unknowns.
- No Windows/WSL comparison, ZFS compression measurement, whole application build, production-load test or entire agent-task speedup was measured.

The surviving article gives three bounded results: a Linux guest materially reduces this T3 install wait; cache placement can substantially change Linux's result; the faster shared-store install fails this project's compatibility check. That is sufficient to finish this research iteration without turning unresolved OS-wide causality or an upstream compatibility fix into prerequisites.

## Research resources and handoff

Lima 2.2.1 was installed from official Homebrew to run a Debian guest after the first Podman guest failed during Ignition provisioning. The failed guest never supplied a performance result. Its diagnostic logs were preserved outside Git and only that newly created, stopped machine was removed. The working Lima guest was stopped cleanly after all measurements, releasing its configured RAM; its source, package caches, disk images and private logs remain in the temporary research directory for review. No preexisting VM or other session's server was stopped.

The guest was provisioned with four CPUs, 4 GiB RAM, a 32 GiB disk, Virtualization.framework, no container runtime, and only the research directory shared. Timed files stayed in its native home directory. The resolved official Debian image was `https://cloud.debian.org/images/cloud/trixie/20261001-2618/debian-13-genericcloud-arm64-20261001-2618.qcow2`, verified by Lima against SHA-512 `d8470b8c6c38fead046c794b5800a5a7b96672d5bcf543cc230ceb0c4b8ace05ed341a0c8928045422243fde26b2f1f2f58e99244c65709ffda2e3d4b674dd5a`.

Private guest result directories and compiler logs were archived to `/tmp/macos-worktree-research/linux-private-evidence.tar.gz` before shutdown. Host logs and the original social captures stay in that same private scratch area. SSH keys, browser profiles, credentials and complete session logs are excluded from the archive and public evidence. Reopening this task does not require rerunning experiments unless a claim, tool version or input changes.
