# What does lower RAM actually buy?

Started October 31 local time / November 1 UTC. Owner asked for about another hour of useful experiments and a reusable way for readers to extract value from the article. The previous application trials and publication remain complete. This is a new experiment, not a rerun of their acceptance.

## Questions fixed before measurement

1. Can additional native-AOT processes use the app memory saved by one process to serve more requests? Measure actual pools of 1, 2 and 4 API processes under JIT, bytecode and native AOT. Keep total client connections at 32, share the same PostgreSQL cluster/data, and retain CPU and per-process memory alongside requests. This is a fixed-host scaling observation, not a hard memory-cap experiment or a cloud-cost claim. Extra processes also open extra driver pools and can use more CPU.
2. Can a reader compare their own executable without adopting this whole research tree? Build a small dependency-light comparison tool, with output checks before and during load, repeated balanced runs, startup, file bytes, RAM/CPU and useful failure reports. Exercise it on real fixtures and deliberately wrong output. State supported platforms/protocols rather than promising arbitrary-app compatibility.

Use the previously pinned October 29 canary, binaries and upstream API revision from [the accepted application trials](../validation-2026-10-31/README.md). Before running, verify hashes and current processes. Restart only this study's isolated PostgreSQL cluster; do not use another session's database. No Bun, C or site builds or other load tests overlap the pool experiment. Ordinary editing can continue while it runs.

## Pool protocol

- Three build modes × 1/2/4 processes × four blocks with equal cell counts. Rotate/reverse a fixed deterministic mode/process-count order and retain every trial.
- Test validated echo and JWT-plus-one-cached-user read. Three seconds of warmup, ten measured seconds per route, 32 total persistent connections split evenly among worker ports. Compare expected status and response bytes, not successful connections alone.
- Reuse the checked C HTTP client, one client process per worker. Save individual client elapsed time and counts; aggregate requests over the outer simultaneous interval, record start skew, and reject failures or histogram/count disagreement.
- Sample all worker RSS/physical footprint and aggregate app CPU; record PostgreSQL memory/CPU separately, host/process conditions and pool size. Sum of process footprints is an accounting measure, not proof of uniquely occupied OS RAM. Do not silently exclude a slow trial.
- Actual pool scaling can answer whether a single-process speed loss persists when extra CPU is available. It cannot prove packing density inside an enforced RAM limit, multi-tenant fairness, a remote load generator, long-term reliability or cost savings.

## Acceptance

- [x] Save the informal voice rule and remove conflicting active guidance; check links and the instruction diff.
- [x] Verify reused inputs and finish all 36 pool observations / 72 timed route windows, preserving failures and raw results.
- [x] Audit counts, responses, spread, memory and CPU; distinguish measured pool results from any capacity arithmetic.
- [x] Build and exercise the reader comparison tool, including meaningful failure cases and a real application.
- [x] Publish the useful artifact, distilled supported findings and reproduction evidence; check the article and actual delivery if changed.

Raw commands, mail readbacks, process lists and binaries stay under `/tmp/bun-aot-practical-20261031`. Public evidence contains methods, selected conditions, numeric results and source hashes. No new outreach is authorized by the experiment skill; any follow-up stays within the user's existing scoped conversations and invitation requirement. No generic follow-up is needed merely because more tests finished.


## Setup acceptance — November 1 UTC

The informal voice rule and callers are pushed as `7052d08`; links and instruction changes were reviewed. The original guidance preserves uncertainty, exact quotations, protected essays and the GitHub invitation requirement. Informal copy no longer inherits a formal article voice or an automatic reply question.

The first pool preflight failed before any timed route window: PostgreSQL was restarted without its earlier explicit port option and listened on its default loopback port. Only this owned cluster was stopped and restarted explicitly on `127.0.0.1:55439`. A fresh query confirmed 50,000 users. The failed pilot is retained outside Git and is a setup failure, not a compiler result. The corrected pilot completed all nine mode/count cells with both route bodies checked. Its one-second measurements are excluded from the main batch.

The reader tool's included TypeScript server passes output checks and builds/runs under JIT, bytecode, native and native plus trim. These smoke-run numbers are not application evidence. A stricter JSON comparison avoids Python's `True == 1` equivalence; a dedicated negative check will exercise that boundary.

## Additional mechanism control, declared before running it

The pool design deliberately exposes a second changed resource: every process owns a pool of up to ten database connections. Add a fixed-total-connection control after the main batch, so extra connections cannot silently explain a claimed CPU/process benefit. A separately built overlay changes only the driver's pool limit from literal ten to `Number(process.env.DB_POOL_MAX ?? 10)`; record its exact patch and new build hashes. Compare JIT/native at 1/2/4 processes with a total configured database-pool limit of twelve (12/6/3 per process), four rotated/reversed blocks, three seconds of warmup and eight measured seconds on JWT + read. Keep 32 total HTTP connections. This control is separate from the original unchanged binaries and does not replace their results. No Bun/C/site build overlaps the current main batch.

The short pool windows do not establish that a memory-based packing argument survives longer allocation/GC activity. After the fixed-total control, repeat its one-JIT/two-native cells for **five measured minutes each, two blocks in JIT/native/native/JIT order**, five seconds of warmup and one-second process sampling, still twelve configured DB connections and 32 HTTP connections. Retain all four windows separately; no production-soak or permanent-memory claim follows. This extends the acceptance to 64 pool observations and 100 timed route windows across the main, fixed-total and sustained batches. While the main runs, work is limited to editing, lightweight Python syntax/source checks and bounded condition/continuity reads; no Bun, C or site build and no additional load test overlaps it.


### Sustained-window detail, fixed before execution

Request rates and foreign-process CPU vary across the shared-host main pass. Preserve all results and inspect within-block comparisons; do not call an unmeasured cause “thermal throttling.” The bounded public Reddit check had no new reply and its temporary tab was closed at about 00:29 UTC; that UI activity is a host-condition limit, not a reason to discard cells. No new message was sent.

For the five-minute check, retain **five successive 60-second client windows on each unchanged app pool**, instead of one opaque 300-second client total. Warm once for five seconds. App processes and database pools remain alive; clients reconnect in short gaps between minutes. This exposes per-minute memory/CPU/request trends and is not an uninterrupted-connection soak. Two blocks still give JIT/native/native/JIT order. Acceptance becomes **64 pools / 116 timed route windows** (72 main, 24 fixed-total, 20 minute windows), kept as three separate batches.

## Execution checkpoint — November 1, about 00:37 UTC

- The main terminal session `14343` exited successfully. All **36 pools / 72 timed route windows / 89,366,815 checked responses** are saved in `/tmp/bun-aot-practical-20261031/main/observations.json`. The runner's saved hash matches `pool-study.py`. Do not restart this batch.
- The separate pool-limit builder restored the original `src/db.ts` after writing its two new executables/hashes. The fixed-total short control is live in terminal session `95415`, with `/tmp/bun-aot-practical-20261031/fixed.log` and incremental observations. Revalidate that handle before treating it as running; do not compile or start another performance test while it is live.
- `pool-fixed-connections.py` is the exact currently executed short-control source. The separate `pool-sustained.py` adds per-minute progress capture for the long check without changing that running source. Its fresh output should be `/tmp/bun-aot-practical-20261031/sustained`.
- The tool has passed an earlier four-mode smoke run, but subsequent report/strict-type/occupied-port additions still need the final integration run. Run `selftest.py`, the new four-mode example and the real API comparison sequentially after the short control exits, before starting the long check. Use fresh output paths; do not treat the earlier smoke as proof of the final tool bytes.
- Then run the four five-minute pools (five 60-second segments each, fixed total DB limit), accept all three data batches with `summarize-pools.py`, and publish the useful findings plus the versioned source ZIP. Source code, article checks, deployment and actual served assets remain separate gates. No new message or adoption result is established.


### Load-generator control, declared before execution

The multi-copy design also changes the number of local client processes, although it keeps 32 total connections. Add a direct check of that alternative explanation: hold **one API process and twelve configured DB connections** fixed, run one/two/four C client processes against that same port (32 connections total), JIT/native, four rotated/reversed blocks, two seconds warmup and five measured seconds. This reuses existing binaries/client, and runs after the sustained check, with no overlap. Keep its 24 observations / 24 windows separate. It can show whether merely splitting the client reproduces a comparable gain; it does not establish unlimited independent load-generator capacity. Total acceptance is now 64 pool trials plus 24 client controls, 140 timed windows, excluding tool correctness/smoke runs.

## Final tool acceptance and sustained run — about 00:51 UTC

The current tool source passed the real API comparison: 18 measured fresh processes, 36 timed route windows, full valid/invalid response checks and per-build hashes. Its four-mode TypeScript example passed twelve measured processes. The latest integration suite passed six gates: successful compile/run, strict Boolean/number expectations, wrong bodies that begin only during load, startup crash, occupied-port preservation and compiler failure. Earlier method pilots remain private and are excluded from the accepted release evidence.

A first-observed-launch effect changed the tool protocol before release: the initial tiny-server exploration measured about 793 ms on the first JIT file launch and about 10 ms on subsequent fresh processes of the same file. The final source explicitly records one checked launch separately, then repeated fresh-process starts. Its new example reproduced the distinction. The cause was not isolated; this is not proof of a specific filesystem/code-signing mechanism or a universal startup ratio. Prebuilt files may already have run. Full accepted observations and reports are saved under `results/tool-api/` and `results/tool-example/`.

The four sustained pools now run in terminal session `63941`; its first command completed the six integration gates, then launched `pool-sustained.py`. Check `/tmp/bun-aot-practical-20261031/sustained.log` and the same handle for liveness. Each completed minute is retained in `progress.json`; final observations are written per completed pool. Do not start another load test or Bun/C/site build until it exits. The final client-process control follows it sequentially.

Fresh official-source checks: latest stable tag remains `bun-v1.4.4` (October 22), PR 45631 merged October 27, and issue 47044 remains open. The pinned compiler documentation confirms native output targets the build host and AOT type-checking can reject source that runtime execution accepts. The tool's guide now names the tested revision, official preview route, host-platform constraint and exact build-log location. The versioned source ZIP must be regenerated after these final README changes and verified against its source entries before publishing.


### Final apparatus control: fixed request-sending processes

Before executing the proposed one-app client diagnostic, replace it with a stronger directly matched comparison: **four client processes in every cell**, eight connections each, mapped evenly onto 1/2/4 API copies. Keep twelve total configured DB connections, JIT/native, four rotated/reversed blocks, two seconds warmup and five measured seconds. Only the engine and app-copy count vary; the sender process count stays four. This retains the same 24-trial / 24-window budget and directly tests the copy-count result with both external budgets held steady. `matched-client-pools.py` is the executable protocol; the unrun earlier proposal is preserved privately and was never measured. All acceptance totals remain 88 pools / 140 windows across four distinct batches. Report the matched comparison as the primary short-window copy-count evidence, and the longer runs as separate memory/time evidence.

## Measurement acceptance — November 1 UTC

All performance sessions exited successfully. The final four-client control supersedes the unrun one-app diagnostic above. Four separate accepted batches contain 88 pools, 140 timed route windows and 172,505,295 checked responses, with no response failures. The matched comparison holds both twelve DB connections and four sender processes fixed: two native copies served 52% more requests than one JIT copy, with 11% less end app memory, 90% more app CPU and about three times the PostgreSQL CPU. [Full findings and limits](README.md).

The final tool suite (`tool-selftest-v5`) passed seven gates. The four-mode example (`tool-four-v3`) passed twelve repeated processes; the real API (`tool-api-v3`) passed eighteen repeated processes and 36 timed route windows. A prior suite attempt (`v4`) imposed a one-second startup deadline and failed on a valid first JIT launch. Its private record is preserved; the suite uses the tool's ten-second default now. No primary performance trial was rerun or excluded for that tool-test failure.

Public numeric captures are losslessly compressed. The offline verifier accepted all expected counts, zero response failures, connection budgets, source hashes and the eight-file source ZIP. Download SHA-256: `92fffd5f9021fca27cd84b5359ae18fb3801814c8d1669156da851f08132b61d` (17,085 bytes). Site checks, code delivery, deployment activation and actual served bytes still need separate acceptance below.

## Publication checks — before code delivery

The isolated checkout was refreshed from `d791b14` (including the concurrent fetcher-article work), then received only this article and source ZIP. Workspace type checking and all 28 Markdown frontmatter checks passed. The standard build initially lacked permission for tsx's local IPC socket; the approved isolated build then passed and generated 39 posts. The first refresh attempt ran from the wrong temporary directory; it did not update the candidate. The checkout was refreshed correctly before the accepted checks.

Rendered candidate: one H1, correct canonical URL, 957 article words, preserved opening executable sizes and frozen research-footprint values, working versioned download link. Desktop and 390-pixel iframe screenshots were inspected; the evidence table wraps within the narrow page. Python source parsing, new-guide links/fences, instruction frontmatter/links/diff, whitespace checks, offline evidence verification and all eight ZIP entry bytes passed. No prompt file or new dependency was added. Only the study-owned PostgreSQL cluster was stopped after the final tool acceptance.

The owner's new participant question is answered by the [three checked prospective contacts](../../../social/oss-radar-08-bun-aot/adoption-next.md#next-participants--checked-october-31-local--november-1-utc). Those offers are prepared, not sent. ICE, Mert and Davron already received the preceding application results; no additional message or independent adoption outcome is claimed.

## Delivered and accepted — November 1, 01:21 UTC

Code commit [`ec66924`](https://github.com/gkoreli/blog/commit/ec669242379e18f8e37d0a2efa39f7472c399372) is pushed directly to main. Its Workers build completed successfully and a 100% deployment activated at 01:20:49 UTC. Fresh controlled GETs returned 200 for [the article](https://gkoreli.com/oss-radar-08-bun-aot), its Markdown representation and [the source ZIP](https://gkoreli.com/downloads/bun-aot-check-0.1.0.zip). The served Markdown matches the isolated build; the served ZIP matches all eight source files and the recorded SHA-256. The actual live browser displays the 52% result, its CPU cost and the download link. [Selected delivery receipt](delivery-receipt.json).

The informal voice rule, caller cleanup, four measured batches, reader tool, failure checks, article update and delivery are complete. Original measurements/accounting and concurrent work are preserved. The first public preflight occurred while the build was running and saw the previous article and no ZIP; the later accepted checks supersede it. These controlled checks are not adoption traffic. Linux portability, an independent operator run and participant acceptance are unmeasured; none is represented as complete.

Next bounded action is optional outreach using the prepared Keryx/Next.js offers after Goga authorizes sending and current thread eligibility is checked. No new message, public post, subscription or monitoring automation was created in this batch.
