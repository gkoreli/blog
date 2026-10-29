# Cross-repository investigation and publication

October 28 local / October 29 UTC, 2026. This expands the [previous diagnosis](03-failure-diagnosis-and-validation.md), whose accepted T3 timings remain a separate series. The new goal is preserved in the [worklist](00-worklist-index.md): test additional well-known repositories, investigate mechanisms and less fragile mitigations, then publish a four-to-five-minute article.

## Selection and fixed inputs

The three additional repositories use pnpm 12 themselves. Their native pins avoid converting a foreign lockfile or silently changing the package manager to obtain a passing comparison.

| Repository | Source revision | Project pnpm pin | Node used |
| --- | --- | --- | --- |
| [Vite](https://github.com/vitejs/vite/tree/cce559ab158cc6b177d0911a0bea73436b48faff) | `cce559ab158cc6b177d0911a0bea73436b48faff` | 12.15.0 | 26.12.1 |
| [SvelteKit](https://github.com/sveltejs/kit/tree/f22e6210a51bc0e43bd52882be12d759eff5a2c6) | `f22e6210a51bc0e43bd52882be12d759eff5a2c6` | 12.14.0 | 26.12.1 |
| [Next.js](https://github.com/vercel/next.js/tree/7fd2d0a69534e26cfa10c7c11acc7c8450bf7cd5) | `7fd2d0a69534e26cfa10c7c11acc7c8450bf7cd5` | 12.9.1 | 26.12.1 |

Source archives were exported from these exact Git objects, copied through the research mount, and extracted into guest-native ext4. Linux Git snapshots explicitly include every upstream tracked path, including fixtures a new Git index would otherwise ignore. Full tracked-file content and symlink hashes must match the Mac inputs. There are no Gitlink entries in these three revisions.

The same M5 host and existing four-vCPU/four-GiB Linux VM are used. This does not isolate the OS, filesystem, CPU allocation or virtualization independently. No installed dependency tree is transferred between operating systems.

## Predeclared timing protocol

[cross-repo-trials.py](repro/cross-repo-trials.py) writes a 90-case schedule before accepted runs: five new worktrees per configuration/platform/repository. Configuration order rotates, project order rotates, and platform order alternates. Defaults, an explicit four-worker pool, and the global virtual store are separate configurations. Only compare a repository to itself; package-manager versions differ between repositories.

[cross-repo-install.py](repro/cross-repo-install.py) times the whole installer subprocess. Source checkout, one-second settling, hashing, inventory checks and worktree cleanup fall outside that timer. Every sample gets a new Git worktree; completed worktrees are removed after their evidence is saved to limit disk use. The driver refuses changed tracked inputs, version handoff, missing direct dependencies, interactive prompts and absent completion messages. Workspace membership comes from pnpm itself, including exclusion patterns. Installed requested names/versions and the complete source hash must match across all accepted samples for a project.

Packages, allowed dependency-build results and browser downloads are populated before timing. Accepted runs use `--offline --frozen-lockfile`; `npm_config_offline=true` also prevents Vite's `npx` preinstall helper from doing an online lookup. This is not a packet-level isolation claim. Normal allowed lifecycle scripts remain enabled. `CI=true` is explicit on both systems: Next's own native-install hook skips downloading Next SWC in this mode. The install result is not a full local-development startup or native compiler build.

Each nested `pnpm` lifecycle call uses a launcher pinned to the same absolute Node and CLI as the top-level command. Initial Linux checks exposed an isolated npm tool package's uninstalled native-binary placeholder (exec-format failure); that preparation error was corrected before any accepted trial. The launcher does not change project code, security policy or dependency resolution.

Default and shared warmups are excluded. An explicit start-file barrier keeps accepted timings from overlapping project checks, profiling, seeding or other research diagnostics. Unrelated host activity is not isolated. All samples and ranges, rather than just favorable minima, must be retained.

### Preparation failures excluded from accepted results

The first inventory collector encountered a valid UTF-8 BOM in an installed dependency manifest. After that correction, a tracked Vite fixture manifest exposed the same case. The collector now decodes both as UTF-8 with optional BOM; it hashes the original source bytes unchanged. One retry correctly refused a pre-existing evidence filename. Those attempts stopped during warmups, before the measured schedule; their timings are diagnostic only. No failed install is silently converted into a successful sample.

## A dependency-graph repair for the T3 type failure

Four published libraries import React declarations but do not declare the optional `@types/react` peer. Adding version-scoped pnpm package extensions for `lucide-react@0.564.0`, `@effect/atom-react@4.0.5`, `@legendapp/list@3.3.5` and `@pierre/trees@1.0.0-beta.6` makes the installed graph supply those declarations next to the importing library.

The first two extensions reduced 64 errors to 13. Inspection of the remaining importing declarations identified the latter two libraries. With all four, the original full web typecheck passes with no compiler path aliases. The normal base tsconfig and application source are unchanged. Lockfile regeneration is intentional: peer identities and graph hashes change. All 2,069 package keys across both YAML documents remain identical; no package version is added, removed or upgraded.

On the Mac, the repaired graph passes all 4,302 unit tests and the production web build. A sandboxed unit attempt initially passed 4,301 and failed a loopback-server bind with EPERM; the full suite passes when run with the local networking it requires. That environmental failure is not attributed to the metadata repair.

The shared store remains experimental shared writable state. Correct declaration metadata does not provide mutation isolation or certify every other workspace. The previous declaration-path recipe is retained as historical diagnosis, not the preferred new remedy.

## Broader check boundaries

Vite's normal build, full repository typecheck and unit command pass in the baseline layout on both platforms after correcting nested tool invocation. SvelteKit's type-generation/prepublish step, Kit check and Kit unit command also pass on both platforms. Exact commands and counts belong in the final result ledger.

Next's first type/unit attempts lacked the built `next/dist` tree, as its [build documentation](https://github.com/vercel/next.js/blob/7fd2d0a69534e26cfa10c7c11acc7c8450bf7cd5/contributing/core/building.md) predicts. The documented Mac source build passes; its root typecheck and selected cookie unit suite then pass. The four-GiB guest's first concurrent build/validation attempts were killed with exit 137; the kernel records an out-of-memory kill. These are diagnostic preparation attempts, outside timings. They must not be misreported as shared-store regressions or complete Linux acceptance.

## Clone-template experiment

A separate Mac diagnostic clones complete installed workspace dependency directories through `clonefile`, then runs the normal offline frozen install to reconcile the new checkout. Workspace membership must be used instead of recursively copying every directory called node_modules: source repositories deliberately track fixtures with that name. A content mutation to the cloned installed manifest leaves the template bytes unchanged and uses a distinct inode; the manifest is restored before typechecking.

Initial unresolved `/tmp` versus `/private/tmp` store spellings caused a complete reimport despite referring to the same host location. Canonical paths are an explicit subsequent control. Preliminary timings overlap preparation work and are excluded from any speed recommendation. Copying a node_modules tree alone is not yet a hardened recommendation: pnpm's reconciliation, relocation, template invalidation and subsequent tool use must be checked before treating a fast clone as a ready worktree.

## Package-cache mutation during Next validation

The first measured schedule stopped at its fifteenth case: Next's Linux default install failed offline because the ncc snapshot was no longer present. Fourteen successful cases remain accepted; the failed attempt remains saved. The exact `@vercel/ncc@0.38.4` tarball from the official npm registry (SHA-256 `288fd3538e04a96df50fea256e849ada51c9dfcf4541a6f637c4b6eb5facb845`) supplies 127 packaged files for comparison.

Its published loader explicitly registers an exit handler that writes `Script.createCachedData()` back into packaged `.cache` files. The Linux build changed four such files. Each still shared its inode with the address under pnpm's content store, and the bytes at that original content address no longer matched the original tarball. On the Mac, five loaded cache files changed inside the installed package, but their inodes were independent and the content-store bytes still matched. These are observed byte/inode checks, not an inference from a missing tarball alone.

pnpm's [12.9.1 importer](https://github.com/pnpm/pnpm/blob/v12.9.1/pnpm/crates/deps-restorer/src/create_virtual_dir_by_snapshot.rs) already gives known lifecycle-build/patch writes private clones or copies. ncc declares no install lifecycle script: these writes happen during normal tool use. Default hardlinks therefore carry that runtime mutation into the cache. Turning integrity verification off would hide the corruption and is rejected.

The supported `pnpm store add @vercel/ncc@0.38.4` command restores the exact package, and the same previously failing checkout then completes offline. The continuation preserves the first fourteen successes and the failed attempt, then uses fresh paths for the remaining schedule. It does not rerun Next's build against that measurement cache. Broad project validation and warmed-cache install timing are different gates.

## Supported hardening controls completed

pnpm documents `packageImportMethod: clone-or-copy` for independent package inodes and `frozenStore` for an actually read-only, fully populated store. Neither is equivalent to `--frozen-lockfile`: the latter protects resolution inputs while permitting store writes. Frozen-store documentation also forbids concurrent mutation of the backing SQLite store.

The [reduced ncc control](repro/ncc-cache-write-probe.py) compiles a program that outputs `42`, checks packaged files against the exact original tarball, and attempts a second fresh offline install. Default Linux hardlinks change three cache files and their CAS inodes; the second install fails. With `clone-or-copy`, the three installed files change independently, the CAS bytes remain original, and the second install passes. A snapshot mounted read-only, backed by a private publisher-owned parent also passes the compilation and second install while blocking a direct write. No integrity check is disabled. The first reduction used a relative entry path the ncc API does not accept; it is a preparation failure, not a successful compiler comparison. The accepted control uses an absolute entry.

A fully read-only T3 snapshot fails a genuinely fresh worktree: pnpm needs to create a new path-derived slot for `@t3tools/mobile-source-text`. The OS returns EROFS. This is recorded as a limit, not papered over by filtering out the mobile workspace or changing the compiler. The [read-only driver](repro/readonly-store-trials.py) preserves that failed attempt.

### Private writable views

The next intervention uses a frozen base with a separate writable view for each worktree. Linux uses two overlayfs mounts over the same read-only lower snapshot, with separate upper/work directories. Mac uses two simultaneously attached native disk-image shadow files over one read-only APFS image. The Mac attachments have different device IDs and both expose their own mounted filesystem.

Both complete T3 installs and normal web typechecks pass in both views on both systems, with the four type-peer metadata corrections. Writing harmless whitespace to an installed package manifest in view A leaves the same package in view B unchanged; the write is restored before broader checks. Each platform's first view then passes all 4,302 unit tests and the production web build. Registry package targets are checked to stay inside their own view. The entire 6,731,286,528-byte Mac base image keeps the same SHA-256 before and after both views, real project checks and ncc compilation.

The exact [proof script](repro/cow-store-proof.py) contains the disposable lab paths; it is experimental reproduction code, not a general cache manager. The reduced ncc probe also runs against private writable views on both platforms: compilation outputs `42`, installed cache files change privately, original CAS bytes remain unchanged, and a second offline install passes.

These prototype install durations overlap cache/image preparation or unrelated validation and are diagnostic only. They establish function and tested write isolation, not a new speed median. The first Mac image attachment took 6.40 seconds and the second 0.26; later Mac prototype installs took roughly seven seconds. Preparation, mounting and per-view storage are real costs. Do not promote the ordinary shared-store timing table to a claim about these isolated views.

Example setup used for the Linux private view, with a fully copied, checkpointed base under a private publisher-owned parent:

```sh
sudo mount --bind /path/to/frozen-store /path/to/readonly-base
sudo mount -o remount,bind,ro /path/to/readonly-base
sudo mount -t overlay overlay \
  -o lowerdir=/path/to/readonly-base,upperdir=/path/to/private/upper,workdir=/path/to/private/work,nosuid,nodev \
  /path/to/private/view
pnpm install --offline --frozen-lockfile \
  --config.virtualStoreType=global --store-dir /path/to/private/view
```

The Mac experiment uses the built-in disk-image compatibility commands on macOS 27:

```sh
hdiutil create -srcfolder /path/to/seed-store -fs APFS -format UDRO /path/to/base.dmg
hdiutil attach /path/to/base.dmg -shadow /path/to/private.shadow \
  -mountpoint /path/to/private-view -noautoopen
pnpm install --offline --frozen-lockfile \
  --config.virtualStoreType=global --store-dir /path/to/private-view
```

These are disposable-lab commands. The snapshot must be quiescent and its SQLite WAL checkpointed before copying; do not modify the backing snapshot while consumers use it. Protect the backing source/image from consumer writes, retain per-worktree upper/shadow files, and cleanly unmount only those owned test views afterward. No shared writable global store is declared an isolation boundary.

## Current completed timings and validation boundary

The continuation completed all **90 accepted installs**, five per project/configuration/platform, while preserving the earlier failed Next install separately. Median seconds:

| Project | Default Mac / Linux | Four workers Mac / Linux | Shared Mac / Linux |
| --- | --- | --- | --- |
| Vite | 1.818 / 0.477 | 1.594 / 0.469 | 0.679 / 0.176 |
| SvelteKit | 0.589 / 0.135 | 0.545 / 0.178 | 0.278 / 0.122 |
| Next.js | 4.557 / 1.559 | 3.903 / 1.554 | 0.960 / 0.393 |

Vite's core package build and 1,089 unit tests (three skipped) pass in shared mode on both systems, but the full typecheck initially fails on compiler-sfc's missing TypeScript API dependency. A version-scoped existing-version dependency repair exposes a further fdir/picomatch declaration dependency after building. The final version-scoped correction supplies both dependencies and passes the complete normal build, full typecheck and 1,089-test unit suite on both systems. All 1,345 package keys and their resolution entries remain unchanged. A pre-build typecheck alone was not accepted as completion.

SvelteKit's Kit type generation, core typecheck and 1,116 unit tests (one skipped) pass unchanged in default and shared modes on both platforms. These are the selected core checks, not every adapter/browser deployment.

Next's Mac default and shared source builds pass; a metadata correction for Octokit's direct declaration imports clears the shared root typecheck's nine errors without changing any of the 3,685 package keys. The ten selected cookie tests pass. Linux's complete build remains unaccepted: forced/default attempts include a kernel-confirmed OOM kill in the four-GiB guest; shared attempts also expose incomplete generated artifacts and three Window.__NEXT_P errors in a companion build. Subsequent missing-dist type errors are not counted as independent declaration-lookup defects. A bounded final attempt explicitly builds the Next core first, then the repository: the core is killed, the repository reports another companion build failure, and the root typecheck exhausts its JavaScript heap. The ten cookie tests still pass. No general Next Linux application acceptance is claimed.

Workspace resolution audits pass in all three shared checkouts on both systems. In particular Vitest's real package path resolves its Vite workspace peer into the current fresh checkout, rather than the warmed source checkout. Thus passing checks are not credited to accidentally importing the baseline tree.

The ordinary importer comparison, the read-only refusal, the private-view prototype, the version-preserving metadata fixes and full application checks are separate evidence. Do not pool their timings or treat an install inventory as proof of complete app readiness.

## Final research boundary and publication work

The [complete public ledger](repro/cross-repo-results.json) retains eighteen five-sample series, the one measured failure, byte/inode audits, metadata controls, project-check outcomes and private-view results. All locked package versions and resolution entries remain identical in the T3 (2,069), Vite (1,345) and Next (3,685) metadata repairs.

The private views reject a dependency-manifest change under `--frozen-lockfile` on both platforms with `ERR_PNPM_OUTDATED_LOCKFILE`; their lockfiles stay unchanged and the disposable manifests are restored. The isolation prototype is not a production cache manager or a demonstrated general Mac speed win.

The full public investigation has reached a supported boundary: additional repositories, distinct mechanisms, successful ordinary fixes, a controlled cache-write failure, a functional isolation prototype and material counterexamples are documented. No more performance fan-out is needed to support the current article. The remaining work is independent evidence/wording checks, publication with exact shaping prompts, and verification of the real deployed article.

Resources: the obsolete, unmounted six-GiB XFS image and the old pnpm 10 cache were removed only after their measurement records were archived, to make room for this work. Current raw guest evidence is saved outside Git in a 260-file archive. Temporary source caches are not evidence of a live process or service. Publication/deployment acceptance remains separate from research completion.
