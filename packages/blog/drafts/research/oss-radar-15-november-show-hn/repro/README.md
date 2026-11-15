# Reproduction scope

These authored controls support the [participant dossiers](../03-participant-dossiers.md), following the [declared protocol](../02-review-protocol.md). They exercise real inspected implementations with synthetic inputs. They are not a product benchmark suite. November 14, 2026 runs used temporary runtimes and checkouts on macOS arm64; no user editor/browser configuration, real meeting, game asset, training checkpoint, model provider or embroidery machine was used.

Use a fresh temporary directory and receipt path for each invocation. Pin repositories to [baselines](../baselines.json), verify the working source, and keep raw logs outside public Git. Commands below use placeholders; they do not install dependencies or download files automatically. Passed receipts are historical observations, not evidence that current upstream behavior is unchanged.

| Fixture | Actual environment | Evidence and limit |
| --- | --- | --- |
| [neovim-context.lua](neovim-context.lua) | Official Neovim 0.12.6 macOS arm64, Apple Clang 21.0.0 | `arguments` versus quoted `command`; saved-file/unsaved-buffer mismatch. No executable or complete UI trial |
| [jax-mechanisms.py](jax-mechanisms.py) | Python 3.12.12, CPU; JAX/jaxlib 0.4.34, Optax 0.2.5, NumPy 2.5.4 | Tiny routing/cache/contraction controls. No training, throughput or full upstream test-suite result |
| [zigzag-export.py](zigzag-export.py) | Rust 1.96.1, locked core CLI build, no default features | Two synthetic exports and one PES reopen. No GUI, Bluetooth or sew-out |
| [yogurt-mcp.mjs](yogurt-mcp.mjs) | Node 24.14.1 type stripping; unchanged pinned server/socket modules | Two same-user clients, off/on/off global gate, socket 0600. No full application or recording |
| [yogurt-queue.mjs](yogurt-queue.mjs) | Node 24.14.1 type stripping; unchanged pinned queue, synthetic small-Mac branch | Wait/interrupt/restart and unload callback request. No actual capture/model/RAM measurement |
| [agentrun-recovery.mjs](agentrun-recovery.mjs) | Verified Node 24.22.3; unchanged source-built DSL/kernel/adapter | Three bridge/kernel interruption/reopen cases with an upstream memory store and owned journal. No disk-store/process-kill/model trial |
| [agentrun-learning-score.mjs](agentrun-learning-score.mjs) | Node 24.22.3; beta.38's unchanged scoring module bundled with TypeBox 1.3.27 | Declared accuracy/hand-back/failure-denominator comparisons; no model, persistent promotion or learned-quality result |
| [fursoy-csr-seip.py](fursoy-csr-seip.py), [C++ fixture](fursoy-csr-seip.cpp) | Verilator 5.054; pinned actual CSR/package source and a one-operand mutation | CSRRC external/software interrupt distinction plus no-pin/software-set/pin-only controls. No historical-checkout/Linux/timing/hardware trial |
| [agweb-profiles.py](agweb-profiles.py) | Official verified Agweb 0.2.0 app, macOS 27.2 arm64; unique nondefault data root | Five workspaces at one loopback origin distinguish named sharing and separate profiles. Source build failed for missing full-Xcode plugin; no focus/memory benchmark |
| [takumi-font-alias.mjs](takumi-font-alias.mjs) | Node 24.14.1, published native core 2.19.0 / 2.20.0, verified Geist WOFF2 | Copied-buffer and shared-buffer conditions pass in both; exact-same-object condition distinguishes the registration fix. PNG equality alone misses the old wrong family |
| [takumi-prepared-resources.mjs](takumi-prepared-resources.mjs) | Node 24.14.1, native core 2.20.0; owned loopback HTTP and authored HTML/image | Drawn/hidden resource selection, prepared PNG/SVG/measurement reuse, supplied bytes and denied URL. No layout-cache or performance result |
| [takumi-font-shadow.mjs](takumi-font-shadow.mjs) | Node 24.14.1, native core 2.20.0, Fontsource Geist 5.3.0 Cyrillic WOFF2 | Fresh-renderer built-in/same-name/alias/removal controls at weight 400. Successful registration can still select boxes; removal loses Latin fallback |

## Commands

```sh
NVIM_LOG_FILE="$trial_root/nvim.log" "$nvim_bin" --headless --clean -u NONE -i NONE \
  -l repro/neovim-context.lua "$plugin_checkout" "$trial_root/nvim-case" "$trial_root/nvim.json"

JAX_PLATFORMS=cpu "$jax_python" repro/jax-mechanisms.py "$jax_checkout" "$trial_root/jax.json"

# Run in the ZigZag checkout, with CARGO_TARGET_DIR under the temporary trial root.
mise x rust@1.96.1 -- cargo build --locked --bin zigzag --no-default-features
# Then run this fixture from this directory's parent.
python3 repro/zigzag-export.py "$zigzag_bin" "$trial_root/zigzag-case" "$trial_root/zigzag.json"

node --experimental-strip-types repro/yogurt-mcp.mjs \
  "$pinned_mcp_modules" "$trial_root/yogurt-case" "$trial_root/yogurt.json"
node --experimental-strip-types repro/yogurt-queue.mjs \
  "$pinned_queue_module" "$trial_root/yogurt-queue.json"

"$agentrun_node" repro/agentrun-recovery.mjs \
  "$agentrun_checkout" "$trial_root/agentrun-case" "$trial_root/agentrun.json"

python3 repro/agweb-profiles.py "$agweb_release_cli" "$trial_root/agweb-root" \
  "$trial_root/agweb-pages" "$trial_root/agweb.json" release-v0.2.0

node repro/takumi-font-alias.mjs "$takumi_219_runtime" "$takumi_220_runtime" \
  "$verified_geist_font" "$trial_root/takumi-copied.json"
node repro/takumi-font-alias.mjs "$takumi_219_runtime" "$takumi_220_runtime" \
  "$verified_geist_font" "$trial_root/takumi-shared.json" shared-buffer
node repro/takumi-font-alias.mjs "$takumi_219_runtime" "$takumi_220_runtime" \
  "$verified_geist_font" "$trial_root/takumi-same-object.json" same-object
node repro/takumi-prepared-resources.mjs "$takumi_220_runtime" \
  "$trial_root/takumi-resources" "$trial_root/takumi-resources.json"
node repro/takumi-font-shadow.mjs "$takumi_220_runtime" "$fontsource_runtime" \
  "$trial_root/takumi-font-shadow" "$trial_root/takumi-font-shadow.json"
```

`pinned_mcp_modules` contains the exact `app/src/main/mcp/server.ts` and `socket.ts` files from Yogurt's pin, with Git blob identities checked before execution. A synthetic store supplies the application dependency. Node dependencies for each Takumi version were installed in separate temporary directories with install scripts disabled; the package lock's version/integrity is included in each receipt. The font is the release tree's 63,660-byte Geist variable WOFF2, Git blob `d101f19f443c1eb7158f98cb2deebacd97224538`, SHA-256 `c46b00cf667277d22cc237e58149520daec19542edc3f05e7daff4581dc23d2a`.

The Neovim archive was verified against upstream SHA-256 `1dbd148222b051ba6c307c4d17a318ed083df018a4f6a5a0ce46955ffc9ab87b`. Its initial invocation could not use the usual log destination; the raw notice was retained and the public result omits that unrelated machine path. Set `NVIM_LOG_FILE` explicitly when reproducing. The public Neovim receipt retains a seven-line excerpt and full line count for each rendered output; the script writes the complete normalized output.

The first Yogurt attempt failed at Unix-socket listening with sandbox `EPERM`, before protocol execution. The separately named second attempt ran with permission for that owned local socket and closed both clients and server. The failure is not a protocol failure and was not overwritten by success.

The JAX environment intentionally excludes Metal/training dependencies. ZigZag's Rust selection was per command; no global toolchain was changed. Output hashes identify these artifacts under these conditions; cross-platform PNG/compiler bytes need not be identical. Do not replace receipts in place when testing another version or input.

AgentRun used an isolated official Node 24.22.3 macOS arm64 archive, verified SHA-256 `ff6e17d4874b76d272212b908cc020d6e815fba5a6c7eaaa06add725840307fd`. Only the source checkout's DSL and run-adapters packages were compiled, with TypeScript 5.9.3, @types/node 22.19.7, Ajv 8.18.0 and TypeBox 1.3.27 in a separate dependency runtime. Install scripts were disabled; temporary node_modules links supplied those packages without editing the source or system configuration. Commands were `tsc -p packages/dsl/tsconfig.json`, then `tsc -p packages/run-adapters/tsconfig.json`. Three upstream tests in `packages/run-adapters/test/faux-recover-calls.test.mjs` also passed separately. The full workspace's build/tests and service were not run.

Yogurt's queue module was copied unchanged and verified as Git blob `6cbf8a4788b13cdc74db0f5830ae29c430f3cb78`. The fixture selects a scheduling branch explicitly; `onIdle` is an observed callback request, not an actual model unload. Takumi's three conditions retain distinct input identities and receipts. The old facade's object-keyed cache explains why shared bytes in different objects did not trigger the same condition as reusing one object.

Agweb's `scripts/build.sh --test` failed with the SwiftUI State macro plugin missing from this Command Line Tools environment; full Xcode was unavailable. The source was not patched to make it compile. The subsequent released-binary fallback was declared separately. The official v0.2.0 DMG's SHA-256 was `ef06374e05c2f1dd5fffaba81b8b98840ae8d22422c76a91f434fa97b07a8d17`; its copied app passed `codesign --verify --deep --strict`, and the release tag matches the inspected source pin. It ran from the temporary directory with `AGWEB_ROOT`, local adblock URLs and owned download/home paths, without CLI/skill installation. The fixture quits only that root's instance and shuts down its own loopback server in `finally`. A prepared `source-test-build` mode remains unexecuted; the accepted receipt explicitly says `release-v0.2.0`.

The afternoon Takumi controls add no upgrade to the existing core runtime. The resource fixture serves only its authored PNG on loopback, restricts its fetch hook to that origin, records actual HTTP requests and closes the owned server. It writes all images/SVG/measurement outside Git and publishes normalized hashes. It deliberately compares raw native rendering against explicit preparation; do not substitute the high-level `takumi-js` wrapper, which prepares itself, without declaring a different case.

`fontsource_runtime` contains only the pinned `@fontsource-variable/geist@5.3.0` data package, installed with scripts disabled. Its Cyrillic WOFF2 is 15,084 bytes, SHA-256 `6894439694946a589d157ece003086960a6a4013d74a813dab7602efdb3d8c09`, under OFL-1.1. The receipt records package integrity. The font-shadow fixture uses a fresh renderer per condition and keeps Cyrillic/ASCII outputs; actual PNGs were visually inspected. It tests the reported matching condition at weight 400, not every font range or the older-version regression onset. Removing bundled fallback is a diagnostic contrast with an observed cost.

## Sunday additions

Use the [Sunday declarations and outcomes](../07-sunday-fieldwork.md), with fresh output paths. `agentrun_beta38` is source `d10f0053e09cd7ac0186006b13f7a6a52aa8bc22`; `scoring_dependencies` supplies the declared TypeBox 1.3.27 package. `fursoy_checkout` is source `377ae9563ab1b88ee0a037f2223ab49822968396`. The CSR wrapper checks the two source-file hashes before compiling. The temporary mutation changes only the read-modify-write operand, preserving the original checkout.

```sh
NODE_PATH="$scoring_dependencies/node_modules" esbuild \
  "$agentrun_beta38/packages/serve/src/learn/promote.ts" \
  --bundle --platform=node --format=esm --outfile="$trial_root/promote.mjs"
node repro/agentrun-learning-score.mjs "$trial_root/promote.mjs" "$trial_root/score.json"

PATH="$verilator_prefix/bin:$PATH" VERILATOR_ROOT="$verilator_prefix/share/verilator" \
  python3 repro/fursoy-csr-seip.py "$fursoy_checkout" "$trial_root/csr"
```

The unchanged upstream Fursoy suite is `python3 tools/run_s1_m9_phase_a.py`, run from that checkout with Verilator on PATH. It passed 7 properties and 25,500 stress operations, but explicitly disables instruction fetching and uses direct operation injection. Its two local-temporary latch warnings are retained in the result record. The Verilator bottle was fetched with a task-specific Homebrew cache and extracted into `/tmp`; no system-wide Verilator installation was performed.
