# mise task inputs

mise v2026.11.14 shipped experimental `cache.sandbox` on November 24. A developer can put ordinary build inputs in `sources` and outputs in their own directory as usual. On Linux, the new mode derives Landlock access from that declaration. The previous tag v2026.11.13 resolves to `79f7186ddbc74d2209630f540317d534d8e0cbb8`. The tested release resolves to `383f858914918dc951bb052734f8f0b995756388` and uses the MIT license. [Release](https://github.com/jdx/mise/releases/tag/v2026.11.14) · [Maintainer change and discussion](https://github.com/jdx/mise/pull/16043) · [Pinned license](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/LICENSE).

The executor finishes the task key before it tries to restore outputs. The Linux mode adds a separate sandbox marker to the key. During execution, the derived policy permits declared sources and configuration, outputs of cached dependencies, and specific system paths. Writes go to separate output directories and a task temporary directory. The documentation also describes explicit allowances and ambient inputs such as the clock. A tool can still produce different results from identical declared files. [Executor](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_executor.rs) · [Policy and key](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_cache_sandbox.rs) · [Pinned cache guide](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/docs/tasks/caching.md).

## Release trial

The fixture builds one text file from `src/app.txt` and `build-mode.txt`. Each case first writes `debug` to the mode file, then switches it to `release`, repeats the same inputs, and finally edits the declared source. The fixture removes the output before each invocation to exercise restoration. Each case uses fresh cache and configuration directories. The trial ran the official checksummed Linux ARM64 musl binary on a disposable Alpine 3.23.4 guest with Linux 6.18.22, and the official ARM64 binary on macOS 27.2. [Fixture](cache_inputs_trial.py) · [Linux results](alpine-2026-11-24.json) · [macOS results](macos-2026-11-24.json).

| Task configuration | Linux after the mode file changed | macOS after the mode file changed |
| --- | --- | --- |
| Cache enabled, mode file outside `sources` | Restored the old `debug` output | Restored the old `debug` output |
| Sandbox requested, mode file outside `sources` | Exit 1 with `Permission denied`. Output absent on all four runs | Restored the old `debug` output. The fresh executions warned that enforcement is Linux-only |
| Sandbox requested, mode file included in `sources` | Cache miss produced `release`. Repeating the inputs restored it | Cache miss produced `release`. Repeating the inputs restored it |

Editing the declared primary source forced a new result in every case that could read the inputs. A team can use Linux to catch a missing declaration early and include real build inputs in `sources` on both platforms. This trial exercised one ordinary file dependency. It leaves the behavior of a team's full build and other ambient inputs open.
