# Install experiment sources

The current iteration is the [cross-repository investigation](../04-cross-repository-and-hardened-mitigations.md) and [90-install/project-check ledger](cross-repo-results.json). The earlier [30-trial T3 block](validation-results.json), [failure diagnosis](../03-failure-diagnosis-and-validation.md), and 21-install ledger below remain separate experiments. Do not pool their medians.

## Cross-repository extension

The [new investigation](../04-cross-repository-and-hardened-mitigations.md) and [final cross-repository ledger](cross-repo-results.json) test the full Vite, SvelteKit and Next.js workspaces at their own pnpm 12 pins. [cross-repo-install.py](cross-repo-install.py) collects frozen install, source, inventory and runtime evidence. [cross-repo-trials.py](cross-repo-trials.py) predeclares rotating configuration/project order and alternating platform order, with five fresh paths per group. Node is 26.12.1 on both systems. Separate warmups and a start-signal barrier keep builds and diagnostics out of accepted timings.

The plan supplies `pairs`, `settleSeconds`, `results`, `limaHome`, `limaMachine`, and `runner`; each `macos`/`linux` section supplies `sources` and `cli` maps keyed by `vite`, `kit`, `next`, plus `worktrees`, `store`, `node`, `results` and `browsers`. Sources and logs must be disposable, and guest files must live on its own filesystem. `startSignal` optionally holds accepted trials until preparation finishes. An explicit `resumeFrom` controller directory plus a written `resumeReason` retains successful earlier rows and preserves failed attempts separately; it never silently replaces an earlier result. The Next.js cache-write incident caused such a continuation.

```sh
python3 cross-repo-trials.py --config plan.json \
  --allow-create-disposable-worktrees
```

All install scripts allowed by the project stay enabled. `CI=true` is explicit; Next's own hook skips its optional native compiler download in CI. Browser binaries and package/build caches are populated before timing. Accepted installs use both pnpm offline mode and npm's offline environment flag. These are installer measurements, not complete application readiness claims.

## Preferred T3 declaration repair

The separate declaration aliases below explain the first diagnosis. The newer [version-scoped metadata patch](t3-react-type-peers.patch) supplies four missing optional React-type peers through pnpm's existing `packageExtensions` mechanism. The [YAML snippet](t3-react-type-peers.yaml) shows only those additions; merge it with the project's existing extensions rather than replacing them. Its lockfile is intentionally regenerated and frozen afterward. No package version changes, compiler-path aliases, strictness changes or application edits are part of the patch.

Apply the patch only to the tested T3 revision `125b61954dbba5822a8108c8ca47a4846b4b4328`, using its pinned runtime and package manager:

```sh
git apply /absolute/path/to/t3-react-type-peers.patch
pnpm install --frozen-lockfile --config.virtualStoreType=global
pnpm --dir apps/web --config.virtualStoreType=global exec tsc --noEmit
```

The original web configuration passes with the corrected graph. Positive/negative reduced controls also resolve separate React 18 and React 19 declaration versions correctly. Shared packages still need a shared trust boundary; metadata repair does not make their files independently writable.

Vite's [separate metadata patch](vite-shared-type-deps.patch) supplies the existing TypeScript 6 API to compiler-sfc and an optional picomatch-type peer to fdir. Its normal build, complete typecheck and 1,089 unit tests pass on both systems. Next's [Octokit type-dependency patch](next-shared-type-deps.patch) clears the nine Mac declaration errors with no package/resolution upgrade; Mac build and the ten selected cookie tests pass. The complete Next Linux build remains unaccepted, as recorded in the ledger. Do not describe all three repositories as universally certified.

## Cache-write and isolation controls

[ncc-cache-write-probe.py](ncc-cache-write-probe.py) exercises one exact package, compiles output that must print `42`, compares published package files with their original content-store addresses, and attempts a second fresh offline install. The normal Linux hardlink case must reproduce the corruption/failure. `clone-or-copy`, an actual read-only global view, and private writable views preserve the original CAS bytes and pass the second install. The read-only variant additionally requires the OS mount flag and rejects a direct file write. Inputs are disposable and the driver refuses an existing root.

[readonly-store-trials.py](readonly-store-trials.py) preserves the attempted full T3 read-only workflow. It fails on a new local-package slot, so its planned five-run acceptance is **not complete and is not claimed**. [cow-store-proof.py](cow-store-proof.py) is the exact bounded private-view proof from the lab paths: two distinct views, full T3 installs, normal typechecks, a write-isolation test, then unit/build checks. Prepare the mounts/shadow files using the [methods](../04-cross-repository-and-hardened-mitigations.md#private-writable-views). It is experiment source, not an install-and-forget cache service. Its recorded install durations are diagnostic; keep them out of the eighteen accepted timing series.

## New validation protocol

[paired-worktrees.py](paired-worktrees.py) creates five fresh worktrees per platform/configuration, rotating the three configuration orders and alternating the two platforms. It runs one install at a time, then checks native modules and the real web typecheck outside the timer. Its three configurations are defaults, `RAYON_NUM_THREADS=4`, and shared dependencies. The pinned pnpm source confirms that explicit worker variable overrides its normal global file-work pool policy; it is not a CPU or memory quota.

The controller takes a JSON configuration with `pairs` (at least five), `settleSeconds`, `controllerResults`, `limaHome`, `limaMachine`, and `runner`. Both `macos` and `linux` objects supply `source`, `worktreeRoot`, `results`, `store`, `node`, and `cli` absolute paths. Source checkouts must use the pinned T3 commit; all worktree/output roots must be disposable and new. `runner` is the exact full-workload script at a shared path visible to both systems. The Linux source, store, worktrees and results use guest-native storage.

```sh
python3 paired-worktrees.py --config plan.json \
  --allow-create-disposable-worktrees
```

The controller writes its complete schedule before the first trial and refuses an existing controller results directory. It aborts on an install, inventory, native or web-typecheck failure, preserving logs. The one-second checkout settling interval used here is outside install times. Runtime, pool settings, input hash, inventory hash, complete sample order and all results are retained in the ledger. No browser suite, build, profile or package download overlapped accepted timing trials.

## React declaration lookup reproduction

[react-types-probe.ts](react-types-probe.ts) is the reduced valid case. The default layout accepts its string `className`; the shared layout rejects it because `react` resolves to JavaScript instead of the installed declaration package. [Selected trace excerpts](react-resolution-excerpts.json) show the lookup and final paths. Both the pinned native compiler and the official TypeScript 6.0.3 compiler reproduce this result. Replacing the string with `42` is the negative control: after the targeted repair, the compiler still rejects the number as invalid.

To repeat the full **T3 web typecheck-only workaround**, copy [react-typecheck.example.json](react-typecheck.example.json) to `apps/web/tsconfig.research-typecheck.json`. Run from that `apps/web` directory with its pinned Node and pnpm:

```sh
pnpm --config.enableGlobalVirtualStore=true exec tsc \
  --project tsconfig.research-typecheck.json --pretty false
```

This example retains T3's existing `~/*` alias and points React imports at its existing declaration files. It is a separate compiler-only configuration; the original `tsconfig.json` stays unchanged. T3's bundler reads its base path aliases, so this experiment does not endorse merging declaration-only targets into that base configuration. The exact copied example passed through pnpm, and the production web build still passed with it present. The unmodified shared-layout typecheck still fails through pnpm's own launcher, with shared mode explicitly enabled.

All 30 new trials passed their checks, including the targeted typecheck configuration for shared mode. The broader unit suites passed 4,302 tests per run and production web builds passed in the recorded layouts. The complete Mac browser comparison is **not green**: both layouts passed 471/472 tests and failed the same GuestPage scrolling assertion, including targeted repeats. These gates and their limitations remain separate in [validation-results.json](validation-results.json).

The active investigation uses [full-workload.py](full-workload.py) on two pinned public repositories. The driver evolved during preparation: T3 mode, symlink/Gitlink auditing and native checks were added after the older host series. Its timing function and accepted install command boundaries stayed the same. The artifact receipt hashes the final checked source; it does not claim every earlier run used byte-identical driver source. Read the [deeper source and methods notes](../02-deeper-investigation.md) and [accepted result ledger](full-results.json) before interpreting a comparison. The small fixture below is historical and is no longer the article's evidence.

## Full-workload driver

Requires Python 3.9 or later. Only use disposable clones. The driver checks the pinned commit, tracked-file/symlink hashes, runtime, actual package-manager version, frozen inputs, successful completion and installed direct-dependency inventory. Scripts-enabled T3 runs additionally load node-pty and encode a PNG with sharp, outside the install timer. It times cleanup separately. `--seed` fills the isolated store online and is excluded from measured series; normal runs add `--offline`. For pnpm 12 it explicitly disables automatic handoff to the old project's package-manager pin. `--ignore-scripts` and `--shared` are controls, not production setup recommendations.

Example for the older 35-project stress test, after obtaining pnpm 10.2.1 from the official npm registry:

```sh
python3 full-workload.py \
  --repo /absolute/path/to/disposable-benchmark-clone \
  --store /absolute/path/to/separate-test-store \
  --node /absolute/path/to/node-v24.14.1/bin/node \
  --cli /absolute/path/to/pnpm-10.2.1/bin/pnpm.cjs \
  --out /absolute/path/to/separate-results \
  --label warmup --seed --allow-clean-disposable-clone
```

Then use a unique label without `--seed`, with `--runs 3`. The benchmark clone must be at `535aef76843fe52d6336604111708d884110a0e5`. The pnpm 12.14.0 attempt preserves independent workspace lockfiles and disables automatic peers explicitly, but the unchanged old workload fails frozen installation: its Aurelia lock disagrees with the other locks about that setting. This failed attempt is evidence, not a successful version comparison. Do not regenerate locks and call it identical input.

For actual T3 use `--workload t3`, source commit `125b61954dbba5822a8108c8ca47a4846b4b4328`, Node 26.12.1 and pnpm 12.14.0. Its workspace configuration and architecture hook remain intact. Reference-only nested submodules are recorded as Git object IDs and left uninitialized; they are outside the T3 install workspace. This tests dependency installation, not T3's complete setup hook, application build or an agent task. Native dependencies legitimately differ by OS; compare requested dependency inventory as well as the complete input hash.

Use guest-native directories for a Linux VM. A Mac-hosted shared folder inside the guest tests a different storage path. Do not run host and guest timed installs simultaneously. Keep source archives, downloads and cache warmups outside the accepted windows. Other host activity is not isolated; use the recorded ranges rather than treating a small sample as a population estimate.

## Historical small-fixture context

The original small test was **not Theo's benchmark**. It tested whether one pnpm setting reduced repeated local package setup on the available Mac. It did not establish the Mac/Linux ratio or explain its entire cause.

**Runtime correction, deeper investigation:** the initial receipt below inferred the install runtime from the repository/parent process. The mise shim selects a different runtime inside `/tmp`. Its timings and file counts are retained as historical observations, but the Node 24 attribution is unverified and superseded. The corrected driver requires `NODE_BIN`, uses that absolute binary in every subprocess, prepends its directory to child `PATH`, and verifies the version in the scratch directory. The deeper investigation replaces this small comparison with full workloads; do not use the old receipt as a Node 24 measurement.

## Historical small-fixture run (superseded)

- October 28, 2026, M5 / 24 GiB / 10 logical CPUs, macOS 27.0.1 / APFS, pnpm 12.14.0. The recorded Node 24.14.1 attribution was not verified inside the installer subprocess.
- Five direct dependencies, 90 installed packages; complete [package manifest](package.json) and [lockfile](pnpm-lock.yaml).
- One populated store shared by both modes; store and checkouts on the same APFS filesystem. Default mode explicitly disables the global virtual store; shared mode enables it.
- Fresh directories for every install. Offline, frozen lockfile, install scripts disabled. One warmup per mode, then five alternating pairs. Retain both warmups in the JSON but exclude them from medians.
- Time the complete installer subprocess. Fixture creation, library checks and filesystem traversal fall outside the timer. The installer is invoked through its Node launcher, so launcher startup is included.
- Require all five direct libraries and exercise simple operations after every run; repeat with ESM imports. Check the lockfile stays byte-identical. Count local regular files, directories and symlinks without following symlinks. Shared package targets remain outside the checkout and are not counted as removed data.
- Shared host with other work running; no CPU isolation or filesystem cache purge. No Git checkout, T3 Code, native package builds, full application build, Linux leg, cold-cache comparison or end-to-end task timing.

[Results](results.json): median 122 ms default versus 66 ms shared; 3,124 versus 9 local regular files. Approximately **56 ms saved**, rather than a prediction of seconds saved on another project. All twelve installs and both sets of library checks passed.

An earlier exploratory run measured 127 ms versus 78 ms with CommonJS checks. The accepted run added ESM checks after each timing and retained the same file counts. The initial draft used those values; the deeper revision removes them. The corrected small-fixture driver is retained for future experiments, but the deeper article uses the full-workload driver below.

## Repeat the small fixture

Use Node 24.14.1 and Python 3. Run from this repository root. The first two installs below access the public npm registry to obtain the pinned package manager and fill the isolated cache; those downloads are outside measured runs. No repository or global pnpm setting is changed.

```sh
export BENCH_ROOT="$(mktemp -d /tmp/worktree-install.XXXXXX)"
export REPRO_SOURCE="$PWD/packages/blog/drafts/research/macos-worktree/repro"
export NODE_BIN="$(mise which node)"
mkdir "$BENCH_ROOT/template"
cp "$REPRO_SOURCE/package.json" "$REPRO_SOURCE/pnpm-lock.yaml" "$BENCH_ROOT/template/"
npm_config_manage_package_manager_versions=false npm exec --cache "$BENCH_ROOT/npm-cache" --yes --package=pnpm@12.14.0 -- pnpm --version
export PNPM_CLI="$(rg --files "$BENCH_ROOT/npm-cache/_npx" | rg '/pnpm/bin/pnpm.mjs$')"
cd "$BENCH_ROOT/template"
"$NODE_BIN" "$PNPM_CLI" install --frozen-lockfile --ignore-scripts --store-dir "$BENCH_ROOT/store"
python3 "$REPRO_SOURCE/measure.py"
```

Use a new scratch directory for each run. The driver refuses existing per-run directories by using `mkdir` without overwrite. Set `BENCH_FILESYSTEM` to a filesystem name only after checking it on the test host; otherwise metadata records “unreported.” A separate `BENCH_STORE` can point at an already populated temporary store, as in the accepted run. Results and install logs stay in the scratch directory until selected for publication.

The lockfile is pnpm 12's multi-document YAML, including the package manager's own dependency document. Preserve all documents. The script checks the complete bytes, not just its first importer section.

## Implementation basis

Tested release: [pnpm v12.14.0](https://github.com/pnpm/pnpm/tree/fe4a0c232384289de82be3d502896ca7e070050c).

The [shared-store layout](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/virtual_store_layout.rs#L3) puts packages under graph-dependent shared paths. The [import options](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/create_virtual_dir_by_snapshot.rs#L399) allow completed immutable slots to be skipped in this mode. The [guide](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/global-virtual-store.md) marks project usage experimental and describes shared-write and module-resolution limits. A successful small library check is not a compatibility guarantee for another application.
