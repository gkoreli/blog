# Small Mac install control

This is **not Theo's benchmark**. It tests whether one pnpm setting reduces repeated local package setup on the available Mac. It does not establish the Mac/Linux ratio or explain its entire cause.

## Accepted run

- October 28, 2026, M5 / 24 GiB / 10 logical CPUs, macOS 27.0.1 / APFS, Node 24.14.1, pnpm 12.14.0.
- Five direct dependencies, 90 installed packages; complete [package manifest](package.json) and [lockfile](pnpm-lock.yaml).
- One populated store shared by both modes; store and checkouts on the same APFS filesystem. Default mode explicitly disables the global virtual store; shared mode enables it.
- Fresh directories for every install. Offline, frozen lockfile, install scripts disabled. One warmup per mode, then five alternating pairs. Retain both warmups in the JSON but exclude them from medians.
- Time the complete installer subprocess. Fixture creation, library checks and filesystem traversal fall outside the timer. The installer is invoked through its Node launcher, so launcher startup is included.
- Require all five direct libraries and exercise simple operations after every run; repeat with ESM imports. Check the lockfile stays byte-identical. Count local regular files, directories and symlinks without following symlinks. Shared package targets remain outside the checkout and are not counted as removed data.
- Shared host with other work running; no CPU isolation or filesystem cache purge. No Git checkout, T3 Code, native package builds, full application build, Linux leg, cold-cache comparison or end-to-end task timing.

[Results](results.json): median 122 ms default versus 66 ms shared; 3,124 versus 9 local regular files. Approximately **56 ms saved**, rather than a prediction of seconds saved on another project. All twelve installs and both sets of library checks passed.

An earlier exploratory run measured 127 ms versus 78 ms with CommonJS checks. The accepted run added ESM checks after each timing and retained the same file counts. Published draft values use the accepted run. Later driver edits generalize runtime metadata and scratch-path normalization; the measured install sequence and timing boundaries are unchanged.

## Repeat

Use Node 24.14.1 and Python 3. Run from this repository root. The first two installs below access the public npm registry to obtain the pinned package manager and fill the isolated cache; those downloads are outside measured runs. No repository or global pnpm setting is changed.

```sh
export BENCH_ROOT="$(mktemp -d /tmp/worktree-install.XXXXXX)"
export REPRO_SOURCE="$PWD/packages/blog/drafts/research/macos-worktree/repro"
mkdir "$BENCH_ROOT/template"
cp "$REPRO_SOURCE/package.json" "$REPRO_SOURCE/pnpm-lock.yaml" "$BENCH_ROOT/template/"
npm exec --cache "$BENCH_ROOT/npm-cache" --yes --package=pnpm@12.14.0 -- pnpm --version
export PNPM_CLI="$(rg --files "$BENCH_ROOT/npm-cache/_npx" | rg '/pnpm/bin/pnpm.mjs$')"
cd "$BENCH_ROOT/template"
node "$PNPM_CLI" install --frozen-lockfile --ignore-scripts --store-dir "$BENCH_ROOT/store"
python3 "$REPRO_SOURCE/measure.py"
```

Use a new scratch directory for each run. The driver refuses existing per-run directories by using `mkdir` without overwrite. Set `BENCH_FILESYSTEM` to a filesystem name only after checking it on the test host; otherwise metadata records “unreported.” A separate `BENCH_STORE` can point at an already populated temporary store, as in the accepted run. Results and install logs stay in the scratch directory until selected for publication.

The lockfile is pnpm 12's multi-document YAML, including the package manager's own dependency document. Preserve all documents. The script checks the complete bytes, not just its first importer section.

## Implementation basis

Tested release: [pnpm v12.14.0](https://github.com/pnpm/pnpm/tree/fe4a0c232384289de82be3d502896ca7e070050c).

The [shared-store layout](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/virtual_store_layout.rs#L3) puts packages under graph-dependent shared paths. The [import options](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/create_virtual_dir_by_snapshot.rs#L399) allow completed immutable slots to be skipped in this mode. The [guide](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/global-virtual-store.md) marks project usage experimental and describes shared-write and module-resolution limits. A successful small library check is not a compatibility guarantee for another application.
