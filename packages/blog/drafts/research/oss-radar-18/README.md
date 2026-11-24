# OSS Radar #18 research

Research began November 24, 2026. The preparation target is Monday, November 30 at 08:00 Pacific. This issue is at the project-selection and fieldwork stage.

## Sources and selection

The November 24 scan checked the official GitHub latest-release endpoint for 21 public repositories. The pool combined developer tools that manage repeat runs, data tools with local artifacts, and possible return visits from [issue #1](../../../posts/002-oss-radar-01-vercel-winter-2026-cohort.md). This sample favors shipped changes whose contracts can be tested with synthetic files. Some monorepos return a component package release. A 404 describes the endpoint result for that project. [Discovery workflow](../../../../../docs/worklist/oss-radar-weekly/sources.md).

| Source group | Candidates and observed release labels | Disposition |
| --- | --- | --- |
| Task and build tools | mise v2026.11.14, Dagger v0.21.12, uv 0.13.9, Vite v8.3.8, act v0.2.98, Buildkite Agent v4.12.0, Deno v2.9.8 | Working selection begins with mise and Dagger. Their releases change the file inputs that matter to task and Dockerfile reuse. uv's preview environment redirect concerns where tools find an environment. [mise release](https://github.com/jdx/mise/releases/tag/v2026.11.14) · [Dagger release](https://github.com/dagger/dagger/releases/tag/v0.21.12) · [uv release](https://github.com/astral-sh/uv/releases/tag/0.13.9) |
| Data and versioned artifacts | restic v0.20.0, DuckDB v2.0.1, marimo 0.25.2, PGlite `@electric-sql/pglite-plpgsql-check@0.1.0`, Jujutsu v0.47.1, Datasette and Litestream with latest-release endpoint 404s | restic joins for the decision to reuse bytes on a populated restore target. DuckDB's release repairs Parquet statistics and append behavior, a different reader problem. [restic release](https://github.com/restic/restic/releases/tag/v0.20.0) · [DuckDB release](https://github.com/duckdb/duckdb/releases/tag/v2.0.1) |
| Earlier Radar projects | InsForge v2.3.5, Answer Overflow v1.5, APIs.guru with latest-release endpoint 404, PixiJS v8.23.0, Cossistant `@cossistant/protocol@0.3.0`, browser-ai `@browser-ai/core@3.0.4`, OutRay v0.1.17 | The released changes in the working set provide a more direct test of file reuse. Earlier Radar entries retain their original provenance. |

The working set asks which input or existing bytes a tool uses when it skips work. mise can refuse a read before it saves reusable output. Dagger can identify a copy by its source files and the destination's parent. restic can replace an existing file when links change the meaning of reusing its byte ranges. The test for each is to change one concrete input, then inspect what was restored or rebuilt. [mise fieldwork](mise/README.md) · [Dagger source trace](dagger/README.md) · [restic fieldwork](restic/README.md).

The Dagger engine comparison put a separate check before the copy. Both releases used earlier bytes when an edit preserved a file's length and modification time. The 0.21.12 checksum had a smaller scope once an ordinary edit reached the engine. This gives the issue a concrete distinction between choosing which bytes to check and finding those bytes in the first place. [Engine trial and source](dagger/README.md).

## Next bounded action

Check whether same-size edits with preserved modification times reach mise's declared-input key and restic's next local backup. The new controls should identify which measurements can support a shared lesson and where the tools make different choices. Keep the existing ordinary trials as their baselines, then review the selection and article outline.
