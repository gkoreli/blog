# Hermes memory trial

Declared November 17, 2026, before execution. This is a trial of the released memory store and its real import/scan/write paths, not an agent task, a learning benchmark or a hosted deployment evaluation.

## Question and controls

At [v0.23.2 / ae2a81c](https://github.com/NousResearch/hermes-agent/tree/ae2a81ccc00e9b7c06301523e5bb09608397149c), does strict load-time scanning remove an ordinary profile fact from the prompt while preserving its original bytes? Does the `§` entry boundary change how much clean material is masked? What do successful writes, stale writers and recovery look like?

Use unchanged upstream source from the pinned archive, Python 3.14.6 and an owned temporary venv. Install only the actual import path's required dependencies, with versions from the pinned manifest. Use fresh `HERMES_HOME` directories and authored facts. Do not read the author's real Hermes profile or launch a model/provider. Do not stub storage, scanning, filesystem locks or imports.

The [fixture](memory_trial.py) declares and checks these conditions:

1. Clean profile text loads into the prompt unchanged.
2. A non-instructional sentence mentioning editing drafts and `CLAUDE.md` is compared with a neutral filename and a filename-only sentence. An explicit instruction override supplies a positive scanner control.
3. A clean fact and the ordinary scanner-matching sentence in one free-form entry are compared with the same facts separated by `\n§\n`. Inspect prompt, live entries and exact file bytes.
4. A normal add persists, while the existing prompt snapshot remains frozen; reopening includes the new fact. A blocked add must leave bytes unchanged.
5. Two stores loaded before either write must preserve both later additions. This checks stale snapshots, not a concurrent stress test.
6. An oversized external entry must make an attempted patch refuse, retain the original and create an exact backup. Pruning that entry must also preserve a backup.
7. An invalid UTF-8 file must refuse an add without overwriting its bytes.

Acceptance is the observed prompt/state/file behavior above, checked with assertions and saved JSON, not merely process success. Keep failed setup/execution attempts. Save source hashes for the executed import closure, dependency versions, case artifacts and normalized results. A reader-facing conclusion must distinguish entry masking from disk deletion and the frozen prompt from live state.

After the first execution, a fixture correction added a repeated-span refusal control. The original oversized input repeated the span selected for patching, so the store rejected the ambiguous edit before reaching the intended drift check. The next attempt retains that refusal and uses a unique span for the drift condition; it does not reinterpret the first run as a product failure.

## Evidence boundary

The originating [profile report #156389](https://github.com/NousResearch/hermes-agent/issues/156389) is firsthand but used a locally modified v0.23.0 checkout, with a separate scanner check on main. Our pinned store trial can establish a narrower result on v0.23.2. It cannot establish how often users encounter the case, model recall, skill learning, or all agent/provider behavior. A local workaround involving delimiters is not evidence that the scanner should be disabled.

The [November 17 fieldwork record](../04-tuesday-discovery-and-memory.md) records the completed trial. [Normalized results](results/memory-2026-11-17.json), [attempt dispositions](results/attempts-2026-11-17.json) and the [27 executed-source hashes](source-hashes.json) preserve the conditions and limits. Raw runtime logs and full upstream source stay in the owned temporary workspace; this folder contains only authored reproduction material and normalized evidence.

## Reproduce

Use Python 3.14 in a fresh venv. Install `ruamel.yaml==0.18.16` and `ruamel.yaml.clib==0.2.15` from the pinned Hermes manifest. Unpack the [pinned source archive](https://codeload.github.com/NousResearch/hermes-agent/tar.gz/ae2a81ccc00e9b7c06301523e5bb09608397149c) into an owned directory. Run the fixture with the upstream source root and a fresh output path:

```sh
python memory_trial.py /path/to/hermes-source /path/to/fresh-output
```

Keep `source-hashes.json` beside the fixture. It verifies the executed source files before import and checks the observed import closure afterward. All ten recorded conditions passed on Darwin arm64, Python 3.14.6. The fixture deliberately refuses an existing output directory so a new attempt cannot overwrite its predecessor. This is the checked environment, not a cross-platform result.
