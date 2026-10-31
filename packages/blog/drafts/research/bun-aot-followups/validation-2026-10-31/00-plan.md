# Bun AOT application trials — October 31, 2026

Owner request: run thorough experiments from several angles, distill useful findings into the existing article and publish. These are independent tests of public projects; no maintainer has accepted a collaboration or reviewed a result.

## Questions and acceptance, fixed before measurement

1. **Validation:** Does generating the validator at build time avoid the cost of runtime-generated code under native Bun AOT? Test ata-validator's runtime and standalone paths under the same Bun JIT/AOT revision. Check valid and invalid inputs, nesting, defaults and error details separately. Time startup/first validation and warmed valid/mixed traffic; record failures, executable bytes and peak memory. Do not call different validation behavior equivalent.
2. **Framework:** Does native AOT help after a real HTTP framework warms up? Extend the public Bun-framework fixtures with JIT/native AOT and Elysia's own build plugin as separate factors. Check statuses, bodies, headers, invalid input and file delivery before load. Measure repeated, interleaved startup, warmed throughput, latency and memory. Preserve compiler or compatibility failures.
3. **Database:** Does the result survive a database-backed API? Extend Davron's public Elysia application with the same driver, schema, fixed data and requests in each mode. Include a non-database route, a read route, validation and authentication. A PostgreSQL result requires a real isolated PostgreSQL server; a stub is not acceptance. Separate warm throughput from startup, memory and disk size.

Use the official October 29 macOS arm64 canary, whose ZIP SHA-256 is `67ede5394a7da4a8b1a1eb0788b72325f480bc956cb1155b6be962919c9aa581` and binary revision is `1.4.4-canary.1+da867c60b`. The original article's October 27 measurements remain historical and unchanged. Bun PR 45631 is now merged; publication must update availability wording with a dated source.

## Pinned public inputs

| Input | Commit | Role |
| --- | --- | --- |
| [ata-validator](https://github.com/ata-core/ata-validator/tree/8cfedd9e33af092eba91cc615fb7ca98ddc99cb0) | `8cfedd9e33af092eba91cc615fb7ca98ddc99cb0` | Runtime validator, standalone generator and source schemas |
| [Bun framework benchmark](https://github.com/saltyaom/bun-http-framework-benchmark/tree/f654bcd175165bce2e3c83b65eaecd8e34294ffd) | `f654bcd175165bce2e3c83b65eaecd8e34294ffd` | Framework route fixtures; ICE's earlier study motivates thermal/order controls |
| [Elysia/Nest comparison](https://github.com/Dave93/elysia-vs-nest/tree/d58f3d10daa53f8e6c7b085fc3b2b2d9c38b8056) | `d58f3d10daa53f8e6c7b085fc3b2b2d9c38b8056` | Elysia app, database schema/data, auth and route parity contract |

Hardware: Apple M5, 10 CPUs, 24 GiB, macOS arm64. Shared laptop; filesystem caches are warm. Randomized/balanced order and a same-mode spread control precede claims about small differences. No compiler/build work runs concurrently with measured trials. Raw logs and downloaded projects remain outside Git under `/tmp/bun-aot-validation-20261031`.

## Delivery gate

- [x] Inspect actual dependency behavior and pin installed versions/lockfiles.
- [x] Implement reproducible fixtures/runners and verify expected outputs before timing.
- [x] Complete validator, framework and database trials, including failures and useful mechanism controls.
- [x] Audit summaries against every retained observation; preserve pilot/changed-method batches separately.
- [x] Distill only supported decisions into the article, link full methods/results and retain the opening's executable-size result.
- [x] Validate content, types, isolated build and rendered desktop/mobile article.
- [ ] Commit/push scoped work to main; verify deployment and the served article/Markdown separately.

Two individual offers were sent to the authors through their intentionally public email routes at **20:18:50 and 20:18:55 UTC**, within Goga's go-ahead to approach the shortlisted people. Native Gmail readback verified the account, recipients, exact copy and SENT state. One offers to test a relevant ata schema and includes the measured validator result; the other offers a server case beyond the current public fixtures. No request to promote the article was made. Raw mail receipts stay outside Git. No acceptance, reply, maintainer review or partnership is established. Davron's previously invited Reddit comparison remains uncontacted. GitHub issue recruitment still requires an explicit invitation under Goga's standing direction.

## Measured work and next bounded actions

Validator acceptance: 360 measured processes and 60 warmup processes; 40 selected cases for each of three schemas in eight configurations. Simple/nested outputs agree; standalone defaults mutation differs and is excluded from timing. [Current methods and findings](README.md), [numeric validator results](results/validator/summary.json).

Server acceptance so far: six framework executables and API source execution plus four packaged modes pass the selected parity cases. The original API packaging failure affects both JIT and native executables; an explicit dependency-registration wrapper fixes it. Framework Range expectations were corrected to reflect each original fixture, without changing the fixture. These setup attempts are retained outside Git and must not be described as AOT-only failures.

Startup: 24 measured fresh processes per server mode (144 framework and 96 API processes). Noise controls: five framework dynamic-route trials, and five API trials each on validated echo and database read. The framework spread was 3.18%; API spreads and the main pass's variation must be reviewed before interpreting small throughput deltas. The old API noise field for foreign CPU included PostgreSQL and is invalid for that metric; the final load runner excludes the PostgreSQL process tree.

Main load design: six framework blocks, six variants, dynamic and JSON routes; eight API blocks, four variants, health/validated echo/database-read/JWT-plus-read routes. Each route gets two seconds of warmup followed by eight seconds measured, at eight persistent connections. Mode position and route order rotate; every body is checked. This measures warmed local behavior, not maximum remote-server capacity.

After the main pass, complete these controls before drafting the article:

1. Repeat framework JSON and API JWT-plus-read for 60 seconds after five seconds of warmup, two fresh processes per JIT/native mode with reversed order. Inspect memory over the interval; a minute does not prove permanent savings.
2. Repeat selected nontrivial routes at one and 32 concurrent connections (main pass: eight), with four blocks per JIT/native pair and five seconds measured per route. This tests whether conclusions depend on the same-host client or pool saturation. Preserve every result and label the shorter control.
3. Check measured server CPU, background persistent-process CPU, raw spread and balanced run positions. Any necessary rerun is a separately retained batch with a reason, not replacement of an inconvenient observation.
4. Run `summarize.py` only when all main batches are complete; it asserts expected counts. Then publish compact decisions, rather than every table, in the existing article.

Additional falsification controls prepared during the live main run (no concurrent compile or performance run):

- A separate, hand-labeled validator corpus checks every constraint used by the timed simple/nested schemas, Unicode, missing fields, nested collections, multiple errors and explicit defaults. It uses new verification-only binaries; the measured workload and its source remain unchanged. Compare verdicts, mutated inputs and full serialized errors separately.
- Build the same API with JIT plus `--bytecode`, which was an unsuccessful packaging control in the earlier unrelated WASM CLI trial. Check actual API parity first. If it works here, compare JIT/bytecode/native startup (24 processes each) and validated echo/auth-plus-database traffic (six balanced blocks, five seconds measured per route, eight connections). This tests an alternative to accepting AOT's warmed-performance tradeoff. Keep this shorter batch separate from the main eight-second pass.
- The first complete API block suggests route prebuilding helps validated echo while database reads still lose throughput under native AOT. This is provisional, not a new accepted claim. Add a four-cell engine/driver control using the existing `DB_DRIVER` option, identical executables, schema and data: JIT/native × Bun SQL/postgres.js, user/JWT-plus-read routes, four balanced blocks and five seconds measured per route. Run selected parity cases under both drivers first. This tests whether the observed slowdown is specific to Bun SQL; it cannot by itself attribute a shared slowdown to Drizzle.

### Execution checkpoint — October 31

The main framework/API load sequence was launched through terminal session **33191**, with logs `/tmp/bun-aot-validation-20261031/framework-load.log` and `api-load.log` and incrementally written numeric files. Framework results are arriving; API follows sequentially after framework completion. Revalidate the handle/process before treating this as running. Do not start concurrent performance work. The temporary PostgreSQL cluster's actual process is identified in `/tmp/bun-aot-validation-20261031/pgdata/postmaster.pid`; its launcher session has already ended normally.

Clock audit: the early rusage fields named `user_ns/system_ns` actually contain Mach ticks on this host. `inputs.json` records the measured 125/3 ns-per-tick conversion and a passive comparison against `ps` (12,212,139 ticks → 0.509 CPU seconds, versus a 0.51-second `ps` increment). The new runner labels those fields `user_ticks/system_ticks`; the framework process already in flight retains the earlier labels, while the queued API process will load the corrected labels. `summarize.py` handles both explicitly. No throughput, memory or response check changed. The prior runner bytes remain in scratch as `server-study-before-clock-label-fix.py` and match the framework run's saved runner hash.

Committed-source preparation remains pending: validator observations/parity/summary and dependency locks have been copied into this research directory, but nothing has been committed or pushed. Full inputs, server observations, reproduction setup, controls and final delivery must still be accepted. Do not mistake the provisional README for completed article evidence.

Continuation checkpoint: the previous goal turn made concrete progress (validator/startup measurements and a live main sequence). This turn completed the 36-trial framework load pass, retained its numeric evidence and byte-identical runner, and sent/read back the two offers. The API main pass is confirmed live through session **33191**, with 16 of 32 observations saved at the checkpoint; do not restart it. Its original runner bytes are also retained and hash-match its metadata. Current `server-study.py` adds optional controls without changing the already loaded API process.

That main session finished successfully with all 32 API observations. The following checkpoint supersedes its running status; do not restart completed main batches.

### Final-control checkpoint

- All main load/startup data are complete. The original CommonJS fixture now builds/runs correctly on both engines; update the article's old warning without declaring the wider issue fixed.
- `--bytecode` alone initially selected CommonJS and failed on this API's top-level `await`. The documented `--bytecode --format=esm` built the same entry successfully, without application edits. Both attempts are retained in separate reports; the default-format failure is not an AOT regression.
- Expanded checks found the raw ata module omits successful `data` and changes error metadata, in addition to defaults. The original 360-process batch remains a different-API comparison. Do not publish its 270→36 ms result as equal full runtime work.
- A new schema-specific adapter restores data/error fields and top-level defaults. All 103 hand-labeled cases of the two timed schemas match full results, input mutation and data identity across four modes. The 30 untimed defaults cases retain one recorded multiple-error order difference. A first stricter preflight stopped before timing on that untimed difference; it is preserved. Defaults remain excluded from timing under the original plan.
- The matching-output batch completed **192 measured processes** and **32 warmup processes**, consuming returned IDs and error paths with an independent checksum oracle. Valid nested medians: runtime JIT 34.0 ms, runtime native 263.5 ms, adapted prebuilt JIT 33.2 ms, adapted prebuilt native 49.5 ms. Mixed-input values are in the linked results. [Accepted scope and data](README.md#validator).
- `capture-inputs.py` independently calibrated the raw CPU counters against BSD process CPU time: the 125/3 ns-per-tick conversion agrees with the passive check. Compiler bytes are unchanged. The captured input manifest records source hashes and host conditions without private process/mail captures.
- The final sequential control script is live in terminal session **61868**, logging to `/tmp/bun-aot-validation-20261031/controls.log`. Revalidate this handle before treating it as running. Bytecode startup/load and the driver matrix precede the minute-long and concurrency controls. Do not start concurrent builds/performance runs.
- An unpublished article candidate exists only at `/tmp/bun-aot-validation-20261031/article-candidate.md`, about 983 words before the stricter-validator/API/bytecode revisions. It preserves the requested executable-size opening. It is not applied or accepted and still contains pending-result wording that must be removed before publication.

Next: finish that same control handle, summarize every declared batch with `summarize.py`, audit/copy the remaining numeric evidence, finish the guide/claim table, then apply the corrected compact article update. Run type/content/isolated-build/render checks, commit/push directly to main, verify deployment and the served HTML/Markdown, and deliver the results to the relevant invited conversation. A follow-up to Mert should clarify the raw versus matching-output measurements once the code/results are publicly available. No further benchmark dimensions are needed unless a recorded failure requires investigation.

No article change, commit, push or new publication has occurred in this new batch. The goal remains active through the controls, evidence audit and verified article publication.


### Audited completion checkpoint — October 31, 21:21 UTC

This supersedes the running/pending experiment statements above. All performance sessions exited successfully. No benchmark rerun is needed. The isolated PostgreSQL cluster was stopped after the relocated-packaging checks; sources were restored first.

- The final summarizer accepted **13 server batches, 312 startup observations, 340 timed route windows and 360,095,582 checked timed responses**, with zero response failures. Counts, histogram totals, memory consistency and balanced run positions passed. Both validator batches remain separate: 360 raw-module and 192 matching-output measured processes.
- [Final methods, findings and control interpretation](README.md), [numeric summary](results/summary.json), [hashed evidence manifest](results/evidence-manifest.json), [claim audit](01-claim-audit.md) and [reproduction guide](reproduce.md) are prepared. Input/build/setup records, pinned dependency locks and the byte-identical original server runners are retained. The CPU calibration was independently checked against BSD process CPU time, not only `ps`.
- Seven relocated API packaging configurations passed with source and build dependencies hidden. Current CommonJS behavior is a passing minimal case, not closure of the wider report. Bytecode's initial default-format failure and successful ESM configuration are both recorded.
- The article source now contains the compact four-row application table, the bytecode alternative and updated availability/CommonJS wording. It preserves the title, executable-size opening and frozen October 27 accounting. The new trials sit outside that accounting cutoff.
- Content validation and fixture Python/TypeScript checks passed. The current worktree's full typecheck found an absent, already-declared `ipaddr.js` dependency in its old installation. A fresh isolated checkout uses the committed lockfile to validate and build without changing analytics source or another session's output.

Remaining: finish the isolated type/build/render checks, publish directly to main, verify commit-specific deployment and live HTML/Markdown, then deliver the corrected validator and server results to the already contacted authors and Davron's explicitly invited comparison. Publication and outreach acceptance must be recorded separately. No independent replication, maintainer endorsement or measured adoption is established.

### Local publication acceptance — 2026-10-31T21:22:50+00:00

Full workspace typecheck, content validation and the isolated production build passed using Node 24.14.1 and pnpm 9.15.4 with the committed lockfile. No analytics source change was needed. Fixture Python compilation and the TypeBox wrapper TypeScript check passed. All 37 evidence-manifest hashes and local research links passed; the scoped diff has no whitespace errors. No private mail/process logs, credentials, downloaded dependencies or executables are included.

A browser rendered the exact built article at desktop width 1280 and in a 390-pixel iframe for the mobile CSS layout. The opening and new evidence table were visually checked at both widths. Desktop DOM inspection found one H1, a matching canonical URL, no horizontal document overflow and **978 article words**, below five minutes at 200 words/minute. The generated source contains the modified date, all opening sizes, corrected validator comparison, database tradeoff and bytecode result. No prompt link or prompt page exists. The phone-width check is a layout test, not a separate mobile-device/browser test.

The isolated build has no copied private environment values; production configuration is checked through actual delivery separately. Publication and outreach remain the next bounded actions.
