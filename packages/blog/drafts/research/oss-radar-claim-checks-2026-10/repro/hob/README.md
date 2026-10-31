# Reproduce the two offline Hob tasks

This is a source/engine test, not desktop automation. Use `FrigadeHQ/hob@74a09d6a69b87eb3297e19107c6410998c53ee79`, Node24.14.1 and its declared pnpm10.7.0. Install with `corepack pnpm install --frozen-lockfile`. Native `node-llama-cpp` postinstall must succeed. The tested Mac has Apple M5/24GiB unified memory and Metal. Model/results are in [the evidence record](../../results/hob-tasks.json).

Copy this directory to `oss-radar/` immediately below the source checkout. `build.mjs` bundles the actual engine, agent loop, store and file tools. Its sole source transform expands Vite's eager locale glob to the same pinned JSON tables. `bootstrap.mjs` adapts Electron's parent-port message envelope to Node child-process IPC. No model response or tool result is fabricated. An initial plain-esbuild attempt failed on the locale glob before any task; the corrected adapter ran both tasks once.

Set a temporary `HOB_RESEARCH_ROOT` containing `hob-models/gemma-4-26B_q4_0-it.gguf`. Download the immutable catalog URL in the results and verify SHA-256 `3eca3b8f6d7baf218a7dd6bba5fb59a56ee25fe2d567b6f5f589b4f697eca51d` before execution. Download measured14,439,363,584bytes; it is not included in Git.

From `oss-radar/`:

```sh
node build.mjs
sandbox-exec -p '(version 1)(allow default)(deny network-outbound)' \
  node run.mjs "$HOB_RESEARCH_ROOT"
node picks.mjs "$HOB_RESEARCH_ROOT/hob-hypothetical-picks.json"
```

The run refuses to continue unless a direct outbound TCP control fails with `EPERM`. The sandbox applies to the parent and its engine child, not the user's whole machine. Work is synthetic and confined to the chosen root. Expected outputs are fixed before generation. It uses the real SQLite store, runTurn prompt/effort policy and read/write tools, with explicit fixture-only approval handling and no Python/web tools. It unloads the model and stops its child in `finally`. Never reuse an existing task database for a fresh measurement; choose a fresh root and copy/link the verified model there.

Two acceptance criteria: exact three-key JSON with Nika/2026-11-18/7300, and an actual Markdown file with total5000 and exactly Atlas1290/Cedar2435 selected. The runner's initial CSV predicate is a coarse string check; final publication independently re-read the actual output, parsed the total and complete selected-row map, and matched those exact values. Recorded times are single attempts, not repeated latency benchmarks or desktop-install times. Hypothetical M1 picks exercise rules only; they do not run the model on M1.
