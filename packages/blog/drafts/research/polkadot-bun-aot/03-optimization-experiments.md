# Further Polkadot CLI optimization: compile the WASM too

October 28, 2026. Same CLI and Bun input pins as [the original experiment](01-results.md). These are new tests; the original results are preserved. No live chain, real account or transaction submission was used.

**The useful win was in offline ring-proof verification: 608.9 ms → 66.9 ms after adding a reachable static import of the WASM file.** The regular Bun executable took 72.8 ms and the Node package build 132.9 ms in the same balanced comparison. The AOT executable grew from **59.7 MB to 68.5 MB**, and this command used more peak physical memory. This helps a crypto-heavy command, not every CLI invocation.

## What the native docs suggested

- [Smaller executables](https://github.com/oven-sh/bun/blob/73b53109f704b85ca889ef4e76285eb083c8d5f6/docs/compiler/size.mdx): remove embedded function source, or disallow runtime code generation if the app can tolerate that policy. Locale trimming has no effect on macOS, so it was not used as a claimed optimization.
- [WebAssembly compatibility](https://github.com/oven-sh/bun/blob/73b53109f704b85ca889ef4e76285eb083c8d5f6/docs/compiler/compatibility.mdx#webassembly): imported WASM is compiled at build time; unrecognized bytes are interpreted. The package currently reads its file through CommonJS fs APIs.
- [Typed library exports](https://github.com/oven-sh/bun/blob/73b53109f704b85ca889ef4e76285eb083c8d5f6/docs/compiler/libraries.mdx): an `aot` export can expose a dependency's TypeScript. `@noble/hashes` 2.4.0 already ships that source.
- [Explain](https://github.com/oven-sh/bun/blob/73b53109f704b85ca889ef4e76285eb083c8d5f6/docs/compiler/explain.mdx): a higher typed-access percentage is a diagnostic, not a speed measurement. The actual trim report identified runtime code generation in the WASM binding and a dynamic require.

## Compiler flags: small file savings, no clear speed gain

Every candidate was built from the unchanged CLI entry. Each passed the original 14-command output/exit matrix and a standalone member-key check before measurement, except JIT bytecode: it still needed the external WASM file at its original path and is excluded from the accepted optimization timings. The WASM candidate uses the extra wrapper shown below.

| Candidate | Executable MB | Help ms | Cached metadata ms | Member key ms |
| --- | ---: | ---: | ---: | ---: |
| AOT + trim + asset | 59.71 | 11.64 | 18.58 | 24.96 |
| Also remove function source | 58.85 | 11.66 | 18.52 | 24.94 |
| Also disallow generated code (strict) | 59.64 | 11.60 | 18.60 | 24.95 |
| Both restrictions | 58.79 | 11.75 | 18.51 | 25.10 |
| Static WASM import | 68.49 | 11.69 | 18.58 | 40.95 |

Removing function source saved **858,624 bytes (0.86 MB)**, about 1.4%. Its help, hashing, metadata and member-key timings and peak memory stayed near the baseline. Disallowing generated code saved only **66,048 bytes**. Neither justifies a broad performance claim. Both options change supported behavior; passing these offline commands does not prove arbitrary runtime APIs, plugins or function-source consumers work. The combined executable is 58.79 MB, not a certified replacement for every CLI feature.

## The heavier crypto test changes the answer

The original member-key test was too small to show the WASM compute benefit. A new fixed synthetic ring proof, generated with the pinned source CLI and its built-in Alice development account, exercises actual offline proof verification. Each mode accepted the valid proof and rejected a changed message. The same alias and output bytes matched across modes.

| Mode | Median whole process ms | Peak physical MB |
| --- | ---: | ---: |
| Node package build | 132.9 | 83.9 |
| Regular Bun executable | 72.8 | 77.9 |
| AOT + asset + trim | 608.9 | 51.3 |
| AOT + static WASM import + trim | 66.9 | 56.5 |

The static-import build was **9.1× faster than the AOT asset-only build** on this proof. That reverses a serious counterexample: asset-only AOT was about **8.4× slower than regular Bun**. The static import was only about 8% faster than regular Bun, and the test does not compare a Rust implementation.

It is a tradeoff. The executable gained **8.78 MB**, peak physical footprint on proof verification rose from **51.3 MB to 56.5 MB**, and a member-key-only process got slower (**24.96 → 40.95 ms** in the separate option batch). Help and cached metadata were essentially unchanged. Do not advertise it as a universal startup or memory improvement.

## Reproduce the WASM build

Create this wrapper **beside** `src/cli.ts` in a fresh scratch clone. The CLI files themselves remain unchanged. Keep `--asset` so the existing CommonJS loader still finds the file. An earlier wrapper outside `src` changed the virtual path and failed; that build is not accepted.

```ts
import wasmPath from "../node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm";
import "./cli.ts";
if (process.env.DOT_WASM_PROBE === "1") console.error(wasmPath);
```

```sh
bun build src/cli-aot-wasm.ts --compile --aot --trim \
  --asset node_modules/verifiablejs/pkg-nodejs/verifiablejs_bg.wasm \
  --outfile dot-aot-wasm
```

The environment branch keeps the import reachable without changing normal CLI output. Bun documents recognizing the imported WASM by its bytes. A separate runtime-log check showed no interpreter-fallback warning; absence of that warning is not disassembly proof of native execution. The measured result and the documented mechanism are distinct evidence.

## Exposing the dependency's TypeScript

The experiment temporarily added `aot` exports pointing to the shipped `@noble/hashes/src/*.ts`, leaving default JavaScript exports intact, and restored the exact original package bytes after building. No crypto implementation was edited. All selected command and standalone checks passed. Dependency typed accesses rose from 19.3% to 19.9%.

In a separate 20-run paired batch, SHA-256 of a 16 MiB file went from **70.92 ms to 68.02 ms**; other command changes were small. This is a modest roughly 4% local difference, not enough to promise a package-wide speedup or skip the library's own tests. [Exact export patch](optimization-results/noble-exports-patch.json).

## Method and limits

- Compiler-option batch: 400 fresh processes, five accepted modes × four commands × 20 runs; two untimed warm-ups per mode/command. Balanced rotating/reversed order.
- Dependency-source batch: 160 processes, two modes × four commands × 20 runs, separately recorded.
- Proof batch: 80 processes, four modes × 20 runs, plus eight valid/tampered checks. Four further checks passed with reads from the original checkout denied for both AOT builds.
- Same M5 / 24 GiB developer laptop and pinned Bun preview. Filesystem caches warm, no CPU pinning. Wall time includes launch and the time wrapper. RSS and physical footprint are separate. Every accepted observation is retained.
- No full upstream suite, live query, transaction signing/submission, broad crypto audit, other-platform certification or production soak. The larger proof changes the workload, so it is not a replacement measurement for the earlier member-key test.

Run [optimize.py](repro/optimize.py) with `build`, `check` and `measure` stages; use `--modes baseline,no-source,no-codegen,no-source-codegen,wasm-import --batch options` for the flag batch and `--modes baseline,noble-source --batch noble` for the source-export batch. The `--checkout`, `--bun` and `--out` arguments use scratch paths as in the original guide. Read the small scripts before running them: `build` creates an untracked wrapper and temporarily changes one dependency package file, then restores it in `finally`.

[crypto-verify.py](repro/crypto-verify.py) uses the committed [synthetic proof fixture](optimization-results/proof-fixture.json), the two AOT binaries in `--out`, the regular Bun executable passed with `--jit`, and Node passed with `--node`. Add `--check-only` to run the current twelve proof checks without timing. The fixture contains no real account secret.

[Selected observations and hashes](optimization-results/manifest.json) · [Maintainer draft](02-maintainer-draft.md). Preparation only; nothing has been posted upstream.
