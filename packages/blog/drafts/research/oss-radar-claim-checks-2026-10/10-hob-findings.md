# Hob: actual offline tasks completed, with a long wait for visible answers

October 30, 2026 Pacific. Baseline `FrigadeHQ/hob@74a09d6a69b87eb3297e19107c6410998c53ee79`, app0.2.6; still main at01:36:23UTC October31. [Protocol](06-hob-protocol.md) and [intake](00-worklist-index.md) fix question/audience before testing. Mac: AppleM5,24GiB unified memory, macOS27.0.1. No M1 inference tested.

## Claim table before prose

| Claim | Product says | Code / test | State | Inference | Reader consequence |
| --- | --- | --- | --- | --- | --- |
| Useful document tasks can run offline | Local coworker alternative | Actual engine worker, runTurn, Store and file tools complete two fixture tasks under process-only deny-network-outbound; direct TCP negative control EPERM | Reproduced source path | Can do these two file jobs without cloud execution after setup | Narrow useful yes, no whole-app privacy/usability certification |
| Correct facts, not just a plausible answer | File work | brief.txt includes current values and explicit obsolete distractors; exact JSON has only ownerNika/deadline2026-11-18/budget_usd7300 | Reproduced | Tool really writes accepted artifact | Check actual file, not model claims |
| CSV task calculates and selects | File work | Four rows total5000; report lists exactly Atlas1290/Cedar2435, excludes Birch/Delta; independent exact output re-read passes | Reproduced | Small numerical task succeeded without Python tool | Not large-table or spreadsheet competence proof |
| Best fitting model auto-selected | README/picker | Actual pinned rules choose Gemma4 26B Q4_0 for25.8GB decimal total RAM; native Metal probe passes; chosen immutable weight file hash matches | Reproduced picker and chosen-model tasks | Selection is catalog score plus memory/bandwidth heuristic | Not a benchmark of every available model |
| Ordinary M1 hardware has a clear recommendation | Reader question | Hypothetical picker inputs:8GiB M1 compactE4B/8k;16GiB M1 E4B/16k | Reproduced rules, not M1 runtime | Users can see expected software choice | No speed or task-success prediction on M1 |
| It responds promptly | No universal latency claim | Actual tasks47.51s/45.34s; first visible text46.57s/43.54s; engine logs spend much of time thinking | Reproduced one attempt each | Privacy did not imply instant visible response in this trial | Give setup and waiting cost beside success |
| Offline means no downloads | Not the project's qualified claim | Dependencies/model downloaded first; immutable model14.439GB,383.65s including download/write/hash; load15.44s | Reproduced setup | Cold setup and subsequent isolated run differ | Prepare before disconnecting |

## Competing explanations / product map

| Theory | View | Evidence for | Against / limit | Direction | Disproof |
| --- | --- | --- | --- | --- | --- |
| Local model plus file tools can own simple private document work | Maintainer thesis | Real source engine/agent/file artifacts, network denied | Manual fixture approval; desktop not tested; two short jobs | Shipped source path | Incorrect artifacts or dependence on network after setup |
| Offline result is just canned chat or an undeclared cloud answer | Skeptical user | Many demos show only prose; model initially downloaded online | Actual parser-checked output files, real model hash and Metal backend, OS-level outbound denial with EPERM control | Rejected for these tasks | Fabricated engine/tool handler or successful external request during task |
| Selecting a model is the same as proving it best on hardware | Broad reading | App ranks catalog and estimates throughput | Scores static; bandwidth table and fixed reserves; no on-device quality benchmark in picker | Unsupported | Controlled candidate comparisons on target hardware |

Replaces: selected hosted-chat/file workflows for simple local tasks. Wraps: node-llama-cpp3.22.1, open model weights, SQLite/file tools. Extends: ordinary desktop with file/agent actions. Relies on: initial network downloads, local hardware/storage, model/tool quality and user approval policy. Research didn't exercise desktop release, calendar, PDFs, plugins, updater or web tools. Do not infer a whole-app packet audit from source engine isolation. No future roadmap or general hosted-model parity claimed.

## Setup and execution

Source extracted outside Git. Pinned pnpm install passes24.5s; build scripts allowed by upstream for electron/esbuild/node-llama-cpp; three unrelated package scripts were skipped by pnpm's own policy. Initial tsx eval probe failed because CJS cannot import top-level-await ESM; actual .mjs native probe then passes Metal/AppleM5. Initial headless bundle failed on Vite import.meta.glob before tasks; adapter expanded every pinned locale JSON (same eager-glob semantics) then actual engine and runTurn executed. No upstream behavior/source changed. Child-process IPC envelope replaces Electron utilityProcess transport; UI and release packaging remain untested.

Model catalog selects Gemma4 26B A4B Q4_0 at16,384 context floor, estimated51.7tok/s. Worker permits expanding context up to32k as in product; actual allocation was not separately instrumented. Catalog size14.44GB; immutable download14439363584bytes/hash3eca...a51d matches. Download+write+hash383.6466s; model load15.444s. These are not measured end-to-end desktop setup times. `freeDiskGB:100` is a controlled picker input, not a measured disk-free claim; selected model does not change from that when adequate disk exists.

OS sandbox-exec profile `(version 1)(allow default)(deny network-outbound)` applies only to test/child. Direct TCP1.1.1.1:443 returns EPERM before inference. Whole-user network unchanged. No secrets/private docs. Actual prompts and fixtures in [runner](repro/hob/README.md), [results](results/hob-tasks.json); original source hashes in [record](results/hob-source-hashes.json). Tested default Normal effort; no synthetic prompt answer or fake tool response. Fixture approvals permit only supplied non-access modifications, decline access requests; tools offered only read/write/list; no Python/web.

Both tasks ran once after model load. First parses three current facts despite obsolete distractors; second creates correct total and exact two selected rows. Initial CSV runner predicate was coarse; final acceptance independently reads the real saved file and parses total and complete customer/value map. Both pass exact expected values. Original output hashes retained. First visible text times exclude thought chunks; timer starts at runTurn, not model download. No peak memory or broad model speed claim. `unload` completes and child exits; process inventory finds no remaining owned worker.

Publication decision: useful positive offline result with setup and latency tradeoffs prominent. Explain hypothetical M1 selection as rules only; source-engine test doesn't establish easy desktop install. [Manuscript](../../../posts/037-oss-radar-13-hob-offline-file-tasks.md):797 rendered words, about4minutes. Markdown validation passes27 posts; isolated build passes38. Canonical, H1/social metadata and hashes pass [local publication checks](results/hob-publication-checks.json). Source push and served acceptance pending.
