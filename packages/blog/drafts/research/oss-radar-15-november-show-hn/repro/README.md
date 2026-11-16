# Reproduction scope

The [evening participant pass](../09-evening-due-diligence.md) adds current-release and broader workflow controls below. Earlier receipts retain their dated environments and limits; in particular, earlier no-disk/no-model statements do not describe the later AgentRun and Yogurt trials.

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

The unchanged upstream Fursoy suite is `python3 tools/run_s1_m9_phase_a.py`, run from that checkout with Verilator on PATH. It passed 7 properties and 25,500 stress operations. The randomized stress disables fetching and injects operations; property 7 also includes fetched trap probes. The earlier description of the entire suite as injection-only was too broad. Its two local-temporary latch warnings are retained in the result record. The Verilator bottle was fetched with a task-specific Homebrew cache and extracted into `/tmp`; no system-wide Verilator installation was performed.

## Sunday evening additions

The [additional diligence record](../09-evening-due-diligence.md) connects these controls to the project judgments. Each new receipt is separate from earlier runs. Source revisions are in [baselines](../baselines.json); version-specific limits above remain attached to those older fixtures. The new runs used the isolated verified Node **24.22.3**, Rust **1.96.1** and Python **3.12.12** where applicable. `radar_repro` below denotes this directory's absolute path. All runtime, source, output and receipt variables denote owned temporary paths; prepare and verify the stated dependencies before invoking a fixture.

| New control | Environment and input | Material scope |
| --- | --- | --- |
| [Yogurt backfill](yogurt-backfill.test.ts) | 0.3.24 source; Vitest 5.0.4, Electron 44.7.2 and chrono-node 2.10.3 imports, install scripts disabled | Real persisted store with deterministic transcriber; complete, no-model and partial-pause states, including reopen |
| [Yogurt recognition](yogurt-recognition.test.ts) | Same source; official signed 0.3.24 Mac decoder/server; catalog-pinned Whisper small q5_1; [authored speech](yogurt-synthetic-speech.txt) | Actual saved-recording decode/recognition/pipeline/SQLite; synthetic English speech, no capture or summary |
| [Neovim selection/Rust](neovim-selection-rust.lua) | Clean Neovim 0.12.6, bundled C parser, Clang 21, Rust/Cargo 1.96.1 | Actual normal-mode callback and assembly; explicit parse, feature and target contrasts; no fixture executable run |
| [ZigZag planning](zigzag-current-plan.py) | Current 0.1.5 locked core CLI; independent pyembroidery 1.5.1 | Authored curved ring/leaves; generic/Melco/minimum settings; PES/EXP decoding and over-hoop export, no sew-out |
| AgentRun's unchanged upstream tests | Published server beta.38 and pi-durable/chord/pi-ai 1.5.2, scripts disabled | Actual SIGKILL/local SQLite recovery and separate production journal fencing; no full agent/model/provider or Postgres trial |
| [bo2 shader controls](bo2-shader-controls.py), [C++](bo2-shader-controls.cpp), [Metal](bo2-metal-compile.mm) | Apple Clang 21, 26 vendored HLSLcc sources and unchanged bridge; system Metal runtime | Authored minimal DXBC plus supplied reflection records; Metal library/function creation, no proprietary asset or frame |
| [Fursoy fetched program](fursoy-fetched-program.py) | Verilator 5.054, unchanged S1 Sail testbench and actual RTL | Authored RV64 instruction words, fetched loop/store/load, independent register oracle and changed-instruction contrast; no Sail differential |
| [JAX PRNG](jax-prng.py) and unchanged upstream CPU tests | JAX/jaxlib 0.4.34, Optax 0.2.5, NumPy 2.5.4; pytest 9.1.1, requests 2.34.2, tokenizers 0.23.3 | Same-seed/config contrast and all 39 tests including tiny training; no corpus/GPU/performance result |
| [Agweb restart](agweb-restart.py) | Verified official 0.2.0 then 0.3.0; new nondefault roots and owned loopback origin | Form actions, current covered-click refusal and named/unnamed state across restart; no real login or user browser |
| [Takumi wrapper/backends](takumi-wrapper-backends.mjs) | Published takumi-js/core/helpers/wasm 2.20.0, scripts disabled | Explicit native/ESM WASM renderer injection, owned resources and CommonJS initializer; no browser/bundler/Cloudflare claim |

### Yogurt

The upstream test files are `backfill.test.ts`, `transcription.test.ts`, `pipeline.test.ts` and `deleteRecording.test.ts` under `app/test`; all 69 tests passed unchanged. Copy the two authored fixtures into that same `test` directory in the pinned temporary checkout. Its `node_modules` must resolve the declared Vitest/Electron/chrono imports. `ELECTRON_OVERRIDE_DIST_PATH` supplies a path for the import without downloading or launching Electron; these tests use Node's SQLite, not the Electron UI.

Run from that checkout's `app` directory:

```sh
ELECTRON_OVERRIDE_DIST_PATH="$trial_root/electron-import-only" "$node_bin" \
  "$yogurt_runtime/node_modules/vitest/vitest.mjs" run \
  test/backfill.test.ts test/transcription.test.ts test/pipeline.test.ts test/deleteRecording.test.ts
RADAR_YOGURT_BACKFILL_RESULT="$trial_root/backfill.json" \
  ELECTRON_OVERRIDE_DIST_PATH="$trial_root/electron-import-only" "$node_bin" \
  "$yogurt_runtime/node_modules/vitest/vitest.mjs" run test/yogurt-backfill.test.ts

say -v Samantha -o "$trial_root/speech.aiff" -f "$radar_repro/yogurt-synthetic-speech.txt"
afconvert -f m4af -d 'aac ' "$trial_root/speech.aiff" "$trial_root/speech.m4a"
RADAR_WHISPER_BIN="$yogurt_app/Contents/Resources/bin/whisper-server" \
  RADAR_AUDIO_BIN="$yogurt_app/Contents/Resources/bin/yogurt-audio" \
  RADAR_WHISPER_MODEL="$verified_whisper_model" RADAR_AUDIO_FILE="$trial_root/speech.m4a" \
  RADAR_RECOGNITION_RESULT="$trial_root/recognition.json" \
  ELECTRON_OVERRIDE_DIST_PATH="$trial_root/electron-import-only" "$node_bin" \
  "$yogurt_runtime/node_modules/vitest/vitest.mjs" run test/yogurt-recognition.test.ts
```

The official release ZIP is **174,770,942 bytes**, SHA-256 `47ea7397fe040712a35dae4612123401ed55266d9ee2d461be8d6a71a73d5951`. The catalog's `whisper-small-q5_1` model is **190,085,487 bytes**, SHA-256 `ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb`, at Hugging Face revision `5359861c739e955e79d9a303bcbc70fb988958b1`. Verify these and the app signature before execution. The recognition fixture validates the model digest and closes its server/store. AAC conversion and macOS trust services were unavailable inside the sandbox; the same system operations succeeded with normal host-service access. No security setting or signature was changed.

### Other authored controls

Run from the issue directory unless a command names another working directory. The Rust toolchain must be on the Neovim process's PATH. The current ZigZag binary was built in its own checkout with `cargo build --locked --bin zigzag --no-default-features` and a separate `CARGO_TARGET_DIR`.

The final Neovim fixture, including the explicit target reference, has a separate [reproduction verification](../results/neovim-selection-rust-02.json); the first observation remains intact.

```sh
NVIM_LOG_FILE="$trial_root/nvim.log" mise x rust@1.96.1 -- "$nvim_bin" \
  --headless --clean -u NONE -i NONE -l repro/neovim-selection-rust.lua \
  "$plugin_checkout" "$trial_root/nvim-selection" "$trial_root/nvim-selection.json"
"$embroidery_python" repro/zigzag-current-plan.py "$zigzag_015_bin" \
  "$trial_root/zigzag-current" "$trial_root/zigzag-current.json"
python3 repro/bo2-shader-controls.py "$bo2_checkout" \
  "$trial_root/bo2-shaders" "$trial_root/bo2-shaders.json"
clang++ -std=c++17 -fobjc-arc -framework Foundation -framework Metal \
  repro/bo2-metal-compile.mm -o "$trial_root/metal-compile"
"$trial_root/metal-compile" "$authored_msl"
PATH="$verilator_prefix/bin:$PATH" VERILATOR_ROOT="$verilator_prefix/share/verilator" \
  python3 repro/fursoy-fetched-program.py "$fursoy_checkout" \
  "$trial_root/fetched-program" "$trial_root/fetched-program.json"
JAX_PLATFORMS=cpu "$jax_python" repro/jax-prng.py "$jax_checkout" "$trial_root/jax-prng.json"
python3 repro/agweb-restart.py "$agweb_030_cli" "$trial_root/agweb-root" \
  "$trial_root/agweb-pages" "$trial_root/agweb-restart.json" 0.3.0
"$node_bin" repro/takumi-wrapper-backends.mjs "$takumi_js_220_runtime" \
  "$trial_root/takumi-wrapper" "$trial_root/takumi-wrapper.json"
```

For bo2, `authored_msl` is the shader text in `bo2-shaders/run.log`, between `--- authored shader MSL ---` and the following `RADAR_RESULT` line. Extract only that block to a new `.metal` file. The Python receipt covers bridge translation/reflection; the separately compiled Objective-C++ program covers actual Metal library/function creation. Metal device access requires normal host GPU services. Supplied reflection records exercise packing/map helpers; this is not a resource-bearing game shader or a rendered frame.

Fursoy's optional fourth argument is an already compiled harness binary from the same source and command. The accepted run reused the exact binary after the host cross-assembler failed. The final fixture directly authors standard RV64 instruction words and requires no cross-assembler. It adds `--assert` and `-Wno-fatal` to the Sail runner's build; the independent result check remains separate from the harness's stop condition.

Agweb 0.3.0's official DMG is **2,058,936 bytes**, SHA-256 `3e48229ca465a91b46fca3b47610834a1a4de3a24685c8bb3110453bf1c7c287`. The signed binary reports build `c9e2e41874c3b7b3778ee14a40c7de4e0d263b68`; its source differs from the release tag only by Info.plist version metadata. The restart fixture uses a persistent cookie, one-second settle interval and the same owned origin. Its `finally` quits only the new root's application and closes the server. Version `0.2.0` selects the historical baseline without the current-only covered-click case.

### Unchanged upstream suites

For AgentRun, copy the pinned `packages/serve/test` directory into a new runtime root and link its `dist` to the published `@parcha/agentrun-serve@0.1.0-beta.38/dist`. Install the exact server and `@earendil-works/pi-durable`, `chord` and `pi-ai` **1.5.2** there with scripts disabled. Run from that root:

```sh
AGENTRUN_TEST_PG_URL= "$node_bin" --test --test-reporter=tap \
  test/durable-crash-sweep.test.mjs test/store-journal-fence.test.mjs
```

The [receipt](../results/agentrun-disk-crash-fence-01.json) records package integrities and unchanged test hashes. Both sweep modes are local; the two-machine-labelled mode copies a stopped directory on the same host. The workflow sweep uses pi-durable Node SQLite storage. Separate fencing tests exercise AgentRun's production Connection/RunStorage. The counted HTTP effects are synthetic and owned; no paid effect or provider was used.

For JAX, run `JAX_PLATFORMS=cpu "$jax_python" -m pytest -q` from the pinned checkout with the table's exact dependencies. This includes small synthetic training and checkpoint writes, so the older mechanism fixture's no-training limit does not describe this later run. The merged ROCm contributor's full GPU training remains an attributed report.

## Monday release controls

The [Monday follow-up](../10-monday-release-follow-up.md) declares the changed questions. Earlier successful speech, crash and other controls retain their actual versions; no full current-release product evaluation is implied.

Copy [yogurt-legacy-recovery.test.ts](yogurt-legacy-recovery.test.ts) unchanged into `app/test` in separate pinned 0.3.24 and 0.3.34 source checkouts. Use the same declared Node 24.22.3, Vitest 5.0.4, Electron 44.7.2 import and chrono-node 2.10.3 runtime as Sunday's tests. The fixture constructs old SQLite state in a new owned database, then tests actual store opening, candidate selection and another reopen. It does not reach private fields or transcribe audio. Run from each checkout's `app` directory with a fresh output path:

```sh
RADAR_YOGURT_RELEASE=0.3.24 RADAR_LEGACY_RESULT="$trial_root/legacy-024.json" \
  ELECTRON_OVERRIDE_DIST_PATH="$trial_root/electron-import-only" "$node_bin" \
  "$yogurt_runtime/node_modules/vitest/vitest.mjs" run test/yogurt-legacy-recovery.test.ts

# Run this second command from the separate 0.3.34 app checkout.
RADAR_YOGURT_RELEASE=0.3.34 RADAR_LEGACY_RESULT="$trial_root/legacy-034.json" \
  ELECTRON_OVERRIDE_DIST_PATH="$trial_root/electron-import-only" "$node_bin" \
  "$yogurt_runtime/node_modules/vitest/vitest.mjs" run test/store.test.ts \
  test/backfill.test.ts test/hallucination.test.ts test/yogurt-legacy-recovery.test.ts
```

The [receipt](../results/yogurt-legacy-recovery-01.json) separates the 56 unmodified upstream tests in the current snapshot, the authored current test and the baseline contrast. It records source hashes and the partial-state limit. A passing migration is not a new summary or recognition-quality result.

[agentrun-current-learning.mjs](agentrun-current-learning.mjs) imports the exact published beta.38 and beta.40 modules directly. Prepare separate dependency runtimes with `@parcha/agentrun-serve` at those versions and scripts disabled; beta.40's trial also pins pi-durable/chord/pi-ai 1.5.2. The [receipt](../results/agentrun-current-learning-01.json) records package integrities and actual module hashes. Run from this directory's parent:

```sh
"$node_bin" repro/agentrun-current-learning.mjs "$agentrun_beta38_runtime" \
  "$agentrun_beta40_runtime" "$trial_root/current-learning.json"
```

The fixture calls actual scoring/refit/cost functions on authored rows. `clears` is a predicate, not full replay settlement or promotion. The old wrong-workflow-answer comparison is arithmetic only: beta.38's normal selector used agent-path grades. The current supported-path result and the supplied-expected-answer controls are separate. Cost rows are artificial and establish selection rules, not spending or savings. No server, provider, mailbox or database upgrade is used.
