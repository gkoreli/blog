# Zod under the current Bun AOT preview

**The slowdown still reproduces. It is already documented by Bun, so this is a useful small counterexample, not a new bug report.** No upstream issue or message has been posted.

The current official macOS arm64 canary asset was checked again through GitHub: asset 686547070, SHA-256 `72a0f84c6a632790592ad363cb231d8e090cbaf1356d0b1cd9785698646b77d8`, revision `1.4.4-canary.1+73b53109f`. It matched the compiler already downloaded for the Polkadot trial. The canary URL is mutable; the [earlier input guide](../../polkadot-bun-aot/repro/README.md) records exact bytes and retrieval limits.

## Result

Median **whole fresh-process milliseconds**, 20 runs per mode after two warm-ups, two million successful `safeParse` calls on the same three-field schema and two valid inputs. This retains the original workload; the new small fixture adds command-line controls and separate correctness checks. Its source is not byte-identical to the original two fixtures. Both Zod versions were explicitly installed and recorded; 4.6.7 was the current version reported by the package registry at the check.

| Zod | JIT default | AOT default | JIT jitless | AOT jitless |
| --- | ---: | ---: | ---: | ---: |
| 4.3.6 | 81.0 | 337.7 | 142.8 | 241.9 |
| 4.6.7 | 88.4 | 357.4 | 176.8 | 241.9 |

On Zod 4.6.7, default AOT took roughly **4.0×** the default JIT time. `jitless` helped AOT here but remained slower than the default JIT. These are whole-process times, including startup; they do not isolate validation cost or prove a single mechanism. Every observation is retained, including the shared-laptop outliers. The default/jitless comparisons use balanced rotating/reversed order and warm filesystem caches. Do not compare these absolute times against the prior day's run as a measured compiler regression.

A separate sequential control built with both `--trim` and `--disallow-code-generation-from-strings=strict`: 236.7 ms on Zod 4.3.6 and 372.4 ms on 4.6.7. That is not a controlled attribution to one flag: it changes two options and was not interleaved with the main four modes. It provides no general speed-fix recommendation. Its negative-input results also matched.

## Why no new issue

Bun's pinned [AOT docs](https://github.com/oven-sh/bun/blob/73b53109f704b85ca889ef4e76285eb083c8d5f6/docs/compiler/aot.mdx#what-to-expect) already discuss slower Zod validation, and [compatibility docs](https://github.com/oven-sh/bun/blob/73b53109f704b85ca889ef4e76285eb083c8d5f6/docs/compiler/compatibility.mdx#code-from-strings) explain runtime-generated code. A bounded GitHub search for `repo:oven-sh/bun is:issue aot zod` found no dedicated issue, while the pull-request search returned the AOT launch PR and a type-checker PR. That does not prove no other report exists; the first-party documentation alone establishes that the limitation is known. A new duplicate issue would add little.

The value here is an executable, current-version example with output checks. It can accompany a maintainer discussion about code generation or build-time validators, without presenting expected behavior as a newly discovered defect.

## Run it

Save `package.json`, `bun.lock`, `bench.ts` and `measure.py` in an empty folder. Use a Bun build with experimental AOT support and Python 3:

```sh
bun install --frozen-lockfile --ignore-scripts
python3 measure.py --bun "$(command -v bun)" --out /tmp/zod-aot-results
```

The runner builds both executables, compares default and `--jitless` modes, and saves all observations. It also tests six positive/negative cases across five configurations, checking matching parsed values, stripped extra keys and failure results. This is a small behavior check, not Zod's whole suite. Only valid small objects are in the timed loop.

For an even smaller manual build:

```sh
bun build bench.ts --compile --outfile jit
bun build bench.ts --compile --aot --outfile aot
./jit
./aot
./aot --jitless
```

Each prints `{"passed":2000000}`. Equal counts are necessary but not sufficient; use the runner's positive/negative checks before trusting performance.

[Zod 4.3.6 observations](results/4.3.6/results.json) · [Zod 4.6.7 observations](results/4.6.7/results.json). The fixture and runner need no other dependencies. Raw command logs and executable files stay outside Git.
