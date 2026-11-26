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

### November 26 read-allowance control

We ran the same fixture on Alpine 3.23.4 ARM64 with `--allow-read=build-mode.txt` and only `src/app.txt` in `sources`. The first run read `debug` and stored the output. Changing only the mode to `release` restored `debug` twice from the same key. Changing the declared app source then missed the cache and produced `application-v2` and `release`. The allowed path participates in the key. Its contents participate when declared in `sources`. This matters when a developer makes a sandboxed task pass by permitting a read. [Released cache rules](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/docs/tasks/caching.md#cache-sandbox) · [Fixture with `--read-allowance-only`](cache_inputs_trial.py) · [Alpine receipt](allowance-alpine-2026-11-26.json).

## November 25 edit with a preserved timestamp

We changed a declared source from `edition-A` to `edition-B` in place. The size, modification time, and inode stayed fixed. The status-change time, `ctime`, advanced. The output existed when the edited task ran. Every completed case agreed on the observed behavior across Alpine ARM64 and macOS ARM64. [Fixture](../mtime_inputs_trial.py) · [Linux evidence](../mtime-alpine-2026-11-25.json) · [macOS evidence](../mtime-macos-2026-11-25.json).

| Task configuration | After the edit | Control |
| --- | --- | --- |
| Default freshness with `sources` and `outputs` | Skipped and kept `edition-A` | `--force` rebuilt `edition-B` |
| Artifact cache enabled, sandbox requested | Cache miss and `edition-B` | Deleting the output restored `edition-B` under a different key from the initial restore |
| Artifact cache absent, `settings.task.source_freshness_hash_contents = true` | Rebuilt `edition-B` | The unchanged repeat skipped in both environments |

The default freshness path records source path, size, and modification time and compares source and output modification times. The artifact cache computes a content key. It can reuse a per-file digest only when the recorded metadata matches, including `ctime` on the tested systems. With content freshness enabled, the ordinary task also checks file contents. The preceding source tag already has that option and the `ctime` check. The November 24 feature adds the derived Linux sandbox. [Pinned freshness](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_source_checker.rs#L1332-L1463) · [Pinned artifact inputs](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_source_checker.rs#L1265-L1310) · [Per-file digest reuse](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_source_checker.rs#L1910-L1923) · [Preceding source](https://github.com/jdx/mise/blob/79f7186ddbc74d2209630f540317d534d8e0cbb8/src/task/task_source_checker.rs).

### Existing output control

The source stayed at `edition-A`. We changed the generated output to `edition-B`, keeping its size, modification time, and inode. With the default freshness setting, the artifact cache reported the sources up to date and left the edited file. Removing it restored `edition-A` from the saved artifact. With content freshness enabled, the artifact cache restored `edition-A` immediately. The ordinary task with content freshness reran and produced the same bytes. The observed branches and output agreed on Alpine and macOS ARM64. [Fixture](../destination_reuse_trial.py) · [Linux receipt](../destination-alpine-2026-11-25.json) · [macOS receipt](../destination-macos-2026-11-25.json).

The executor runs the freshness check before `current_output()`. The latter checks the saved key and archive checksum. The content-freshness path also checks the working output hash, which redirects the edited-output case into the restore or execution path. [Current output and saved artifact check](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_cache.rs#L602-L623) · [Executor](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_executor.rs#L979-L1005) · [Working output hash](https://github.com/jdx/mise/blob/383f858914918dc951bb052734f8f0b995756388/src/task/task_source_checker.rs#L1411-L1438).
