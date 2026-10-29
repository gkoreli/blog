# Install experiment sources

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
