# OSS Radar #18 research

Research began November 24, 2026. The preparation target is Monday, November 30 at 08:00 Pacific. The reviewed candidate includes the two-release restic comparison and the mise read-allowance control.

## Sources and selection

The November 24 scan checked the official GitHub latest-release endpoint for 21 public repositories. The pool combined developer tools that manage repeat runs, data tools with local artifacts, and possible return visits from [issue #1](../../../posts/002-oss-radar-01-vercel-winter-2026-cohort.md). This sample favors shipped changes whose contracts can be tested with synthetic files. Some monorepos return a component package release. A 404 describes the endpoint result for that project. [Discovery workflow](../../../../../docs/worklist/oss-radar-weekly/sources.md).

| Source group | Candidates and observed release labels | Disposition |
| --- | --- | --- |
| Task and build tools | mise v2026.11.14, Dagger v0.21.12, uv 0.13.9, Vite v8.3.8, act v0.2.98, Buildkite Agent v4.12.0, Deno v2.9.8 | Working selection begins with mise and Dagger. Their releases change the file inputs that matter to task and Dockerfile reuse. uv's preview environment redirect concerns where tools find an environment. [mise release](https://github.com/jdx/mise/releases/tag/v2026.11.14) · [Dagger release](https://github.com/dagger/dagger/releases/tag/v0.21.12) · [uv release](https://github.com/astral-sh/uv/releases/tag/0.13.9) |
| Data and versioned artifacts | restic v0.20.0, DuckDB v2.0.1, marimo 0.25.2, PGlite `@electric-sql/pglite-plpgsql-check@0.1.0`, Jujutsu v0.47.1, Datasette and Litestream with latest-release endpoint 404s | restic joins for the decision to reuse bytes on a populated restore target. DuckDB's release repairs Parquet statistics and append behavior, a different reader problem. [restic release](https://github.com/restic/restic/releases/tag/v0.20.0) · [DuckDB release](https://github.com/duckdb/duckdb/releases/tag/v2.0.1) |
| Earlier Radar projects | InsForge v2.3.5, Answer Overflow v1.5, APIs.guru with latest-release endpoint 404, PixiJS v8.23.0, Cossistant `@cossistant/protocol@0.3.0`, browser-ai `@browser-ai/core@3.0.4`, OutRay v0.1.17 | The released changes in the working set provide a more direct test of file reuse. Earlier Radar entries retain their original provenance. |

The working set asks which input or existing bytes a tool uses when it skips work. mise can refuse a read before it saves reusable output. Dagger can identify a copy by its source files and the destination's parent. restic can replace an existing file when links change the meaning of reusing its byte ranges. The test for each is to change one concrete input, then inspect what was restored or rebuilt. [mise fieldwork](mise/README.md) · [Dagger source trace](dagger/README.md) · [restic fieldwork](restic/README.md).

The Dagger engine comparison put a separate check before the copy. Both releases used earlier bytes when an edit preserved a file's length and modification time. The 0.21.12 checksum had a smaller scope once an ordinary edit reached the engine. This gives the issue a concrete distinction between choosing which bytes to check and finding those bytes in the first place. [Engine trial and source](dagger/README.md).

On November 25, mise's artifact cache and restic's default backup both picked up a same-size edit with a preserved modification time. The file's status-change time advanced. The ordinary mise task skipped the edit until we forced it or enabled content freshness. This gives the comparison a control within one project as well as across projects. The fixture used fresh local repositories and task caches on Alpine and macOS ARM64. The content-freshness case ran in a fresh directory after the first two mise cases and the backup trial. [Fixture](mtime_inputs_trial.py) · [Linux evidence](mtime-alpine-2026-11-25.json) · [macOS evidence](mtime-macos-2026-11-25.json).

## First draft and preview

The [draft](article.md) follows the decisions in order. mise starts with which files belong in a task's key. Dagger shows that the host directory can retain earlier bytes before the copy checksum runs. restic checks metadata to choose a prior blob list, then has a separate decision about whether restore can keep bytes already at the destination.

The isolated preview used a clean install with lifecycle scripts, then compiled the workspace dependencies before validating the draft. Typecheck and validation of 40 Markdown articles passed. The 51-post build generated the November 30 page, one matching heading, archive, RSS, catalog, sitemap, Markdown, citations, and 1200 × 600 social card. The receipt pins the exact draft and site base. [Preview receipt](draft-preview-2026-11-25.json).

## November 25 claim review

- mise can accept an existing output based on ordinary freshness and the saved artifact's key and checksum. An in-place edit of the working output survived that check on Alpine and macOS. Comparing working output content made the artifact cache restore the expected bytes and made the ordinary task rebuild them. [Executor and controls](mise/README.md#existing-output-control).
- Dagger's two engine traces show the copy checksum narrowing from `/` to `/selected.txt` for the unfiltered copy. Both engines retained old bytes at the host snapshot step after the time-preserving edit. The trial measured checksum request paths and file contents. The build slowdown belongs to the upstream CI report. [Paired engine runs](dagger/README.md).
- restic's default backup caught the edit when `ctime` advanced. Its `if-changed` restore retained matching-size, matching-time target bytes and verified zero files. `always` restored the saved bytes and verified one. Both runs preserved the bytes of the earlier hard-linked copy. These controls used disposable local repositories and files on Alpine and macOS ARM64. [Restore cases and verification code](restic/README.md#existing-restore-target-control).

The release recheck on November 25 still found mise v2026.11.14, Dagger v0.21.12, and restic v0.20.0. The revised draft passed a second isolated preview. [Revised draft receipt](draft-preview-after-review-2026-11-25.json).

## November 26 fieldwork and candidate review

- The released restic comparison reproduced the reported hard-link restore failure on v0.19.1. On Alpine its output matched snapshot size and time, so retrying with `if-changed --verify` accepted the damaged bytes and verified zero files. On macOS the first result was short and the retry recovered it. Fresh v0.20.0 restores matched the snapshot on both. The ordinary copied targets matched on both releases. [Version comparison](restic/README.md#november-26-released-version-comparison).
- The mise build passed on Linux after adding a read allowance. The cache kept returning `debug` after changing the allowed file until a declared input made the task run again. The candidate puts the distinction between read permission and input content next to the sandbox example. [Read-allowance control](mise/README.md#november-26-read-allowance-control).
- The new Dagger discussion concerns an open proposal for narrowed Git and directory API operations on the beta line. The stable Dockerfile copy remains the selected subject. [Upstream check](dagger/README.md#november-26-upstream-check).

The selection, project entries, synthesis, and distillation were reviewed against the linked receipts and pinned code. GitHub still listed the three tested stable releases on November 26. mise's v2026.11.15 release PR was open. [mise release tracking](https://github.com/jdx/mise/pull/16102) · [Exact candidate preview](candidate-preview-2026-11-26.json).

## Next bounded action

Before the November 30 target, check for releases or discussion that changes the advice and compare the recorded manuscript hash with the release candidate. The hosted publisher is paused and the manifest is empty.
