# Bun 1.4: ten practical “why do I care?” candidates

Research-only follow-up for the article's near-ending section. Do not treat this as article prose.

## Freeze point and chronology rule

- **Release baseline:** [`bun-v1.4.0` at `34cbb9a40b4bd1bd767d134a7065e66c2432a676`](https://github.com/oven-sh/bun/tree/34cbb9a40b4bd1bd767d134a7065e66c2432a676)
- **Public release:** August 20, 2026; GitHub `published_at` `2026-08-20T14:07:21Z` ([release](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0), [API record](https://api.github.com/repos/oven-sh/bun/releases/tags/bun-v1.4.0))
- **Release/issue/PR state checked:** `2026-08-27T03:51:26Z`
- **Latest stable at cutoff:** `1.4.0`; no later stable `1.4.x` release was published ([Bun homepage](https://bun.com/), [GitHub releases](https://github.com/oven-sh/bun/releases)).

The official [Bun 1.4 post](https://bun.com/blog/bun-v1.4) explicitly covers everything shipped since Bun 1.3.0, with per-section version tags. Therefore:

- **A — tag-new:** first present in the stable `bun-v1.4.0` release.
- **B — release-train:** first shipped in a 1.3.x release, then folded into the 1.4 story; a section carrying both an earlier tag and `v1.4.0` mixes earlier availability with tag-time additions/fixes.
- **C — rewrite-unlocked:** future or continuing work made easier by the Rust substrate. It is not automatically a 1.4.0 user feature.

## Candidate ranking: before → now → caveat

The editorial ranking below prioritizes broad engineer impact and a concrete removed annoyance. **Use the strongest eight (1–8) if space allows; use 1–6 for a tighter ending.** Candidates 9–10 are worthwhile but narrower.

| Rank | Candidate | Before | Now | Caveat / chronology | Pick? |
|---:|---|---|---|---|---|
| 1 | Lower operational cost and fewer native lifetime failures | Long-running builds and servers exposed allocator fragmentation and leaks; Bun's published repeated `Bun.build()` case grew to 6,745 MB after 2,000 builds on 1.3.14 | Bun reports the same case leveling at 609 MB, 5× lower idle CPU, 13–48% lower HTTP peak memory, and faster startup; Rust `Drop`, allocator changes, and sanitizer wiring make cleanup enforceable | **A shipped:** first Rust stable plus concrete fixes. **C unlocked:** later idiomatic refactors and broader Miri/borrow-checker coverage. Numbers are maintainer results | **Strongest** |
| 2 | Real Node tools work instead of failing at the compatibility edge | Playwright/Vitest/telemetry stacks and many packages hit missing or subtly incompatible Node APIs | Playwright, Vitest, OpenTelemetry, `dd-trace`, more `http`/`fs`/`cluster`/stream APIs, and Node 26.3.0 targeting cross the line | **A examples:** named tool support and target bump. **B:** +1,517 passing tests is a 1.3 → 1.4 total. ABI 147 requires native-addon rebuilds; HTTP/2 report #39796 remains open | **Strongest** |
| 3 | Image and browser automation can leave `node_modules` | Image work often meant Sharp plus native-addon packaging; browser automation meant Puppeteer/Playwright and browser setup | `Bun.Image` provides decode/resize/encode in the binary; `Bun.WebView` drives system WebKit or installed Chromium-family browsers | **B:** Image first shipped 1.3.14; WebView spans 1.3.12 and 1.4.0. Sharp-shaped is not full Sharp parity; codecs/browser backends remain platform-dependent | **Strongest** |
| 4 | Large test suites get scheduling, not just a faster loop | One process or file-count-only shards leave cores/runners idle behind long-tail tests | `--parallel`, `--shard`, `--changed`, isolation, and new `--timings`/`--update-timings` compose into worker- and CI-level scheduling | **A:** timings. **B:** parallel/shard/changed/isolate began in 1.3.13. The 3.9× visual is illustrative; stable deadlock report #39987 remains open | **Strongest** |
| 5 | Package release hygiene becomes one workflow | Package diffs, advisory repair, dedupe checks, production pruning, and license inventory required separate commands or scripts | `bun pm diff`, `bun audit fix`, `bun dedupe --check`, `bun prune --production`, and `bun pm licenses --prod --json` share Bun's lock/install model | **A:** all five are tagged 1.4.0. `audit fix --latest` report #39309 remains open; use dry-run and review diffs | **Strongest** |
| 6 | Profiling output becomes terminal- and agent-readable | CPU/heap analysis usually required opening Chrome/VS Code; bundle graphs required JSON tooling or a visual analyzer | `--cpu-prof-md`, `--heap-prof-md`, and `--metafile-md` emit grep-friendly call trees, retainers, and dependency chains that fit SSH, bug reports, and LLM context | **B:** CPU profiler/Markdown dates to 1.3.2, heap profiler to 1.3.7, metafile Markdown to 1.3.8; the 1.4 post gathers and improves the workflow. Profiles still need human interpretation | **Strongest** |
| 7 | React Compiler stops being a separate Babel/SWC pass | Enabling auto-memoization meant a separate compiler parse/print path and seconds of build overhead on large projects | `bun build --react-compiler` / `reactCompiler: true` runs inside Bun's parser; Bun reports +71 ms on ~860 components versus 9.15 s for Babel, and 3.62 s versus 13.04 s for a full compiled build | **A:** tagged v1.4.0. Maintainer benchmark on one codebase; semantic compatibility still needs project tests | **Strongest** |
| 8 | Monorepo and agent task orchestration loses two helper dependencies | Concurrent scripts needed `concurrently`/`npm-run-all`; interactive subprocesses needed `node-pty` | `bun run --parallel --filter` prefixes output and preserves pre/post hooks; `Bun.spawn({ terminal })` exposes cross-platform PTYs for shells, TUIs, and coding-agent sessions | **B:** run parallel first 1.3.9; Terminal first 1.3.5; both carry 1.4.0 work. PTY semantics and process cleanup still need integration tests | **Strongest** |
| 9 | A process can react to OS memory pressure instead of guessing | Services poll memory, use static thresholds, or discover pressure when the OOM killer acts | `process.on("memoryPressure")` delivers OS low-memory signals on macOS, Linux, and Windows without keeping the event loop alive | **A:** tagged v1.4.0. Linux depends on PSI/cgroup pressure interfaces; signal levels differ by platform | Narrow but useful |
| 10 | Native FFI calls stop paying TinyCC bridge overhead | `bun:ffi` used TinyCC and paid more per-call/`CString` overhead | FFI moves into JavaScriptCore; Bun reports no-op calls 2.13 → 0.70 ns (3×) and `new CString(ptr)` 92.5 → 24.1 ns (3.8×) | **A:** tagged v1.4.0. Microbenchmarks are maintainer-run; unsafe native ABI work remains unsafe | Narrow specialist |

If the article needs only five, use **1, 2, 3, 4, and 6**. Add **5** when package management is part of the article's product thesis; add **7 and 8** for a practical engineering/agent-workflow ending. Do not lead with the million-line rewrite process; lead with the removed cost or failure mode.

## 1. The same Bun, with a materially different operational profile

### Reader value

The biggest impact is not “Bun is written in Rust.” It is that a Bun upgrade can change the cost and failure profile of every Bun process without asking the application to change. Bun reports:

- idle `Bun.serve()` CPU down 5×;
- HTTP-server peak memory down 13–48% in its published workloads;
- startup 2× faster on Linux and 2.5× on Windows;
- 128 bugs reproducible on 1.3.14 fixed in 1.4.0;
- a repeated in-process `Bun.build()` workload leveling at 609 MB after 2,000 builds on 1.4.0 versus 6,745 MB on 1.3.14.

These are maintainer measurements, not independently reproduced results. Sources: [Bun 1.4 production section](https://bun.com/blog/bun-v1.4), [Rust rewrite memory and benchmark section](https://bun.com/blog/bun-in-rust).

### What is actually shipped versus merely unlocked

- **A, shipped:** 1.3.14 is the last Zig release and 1.4.0 the first Rust release. The pinned binary chooses Bun's mimalloc wrapper as the ordinary global allocator and the system allocator under ASAN: [`src/bun_bin/lib.rs#L48-L56`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/bun_bin/lib.rs#L48-L56). The build enables `-Zsanitizer=address` under `bun_asan`: [`scripts/build/rust.ts#L494-L510`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/rust.ts#L494-L510). [PR #30875](https://github.com/oven-sh/bun/pull/30875) records the LeakSanitizer work merged before the tag.
- **A, shipped but not Rust-only:** the release's size and memory results combine the rewrite with allocator work, ICU changes, link-time optimization, identical code folding, GC scheduling, and other changes. The official posts say so.
- **C, unlocked:** Bun deliberately shipped a mechanical port. The project says reducing `unsafe` usage and making the code idiomatic Rust happens after 1.4; Miri coverage is growing, and fuzzing/borrow-checker/LSan work is a continuing stability program. Those are future compounding advantages, not proof that all native memory bugs vanished in 1.4.0: [Rust rewrite “what's next”](https://bun.com/blog/bun-in-rust).

### Recommended bounded wording

> Bun 1.4's Rust rewrite matters because it changes the runtime's operational profile: Bun reports lower CPU and memory, the new code makes deterministic cleanup and native leak detection easier, and 1.4.0 fixes 128 bugs reproducible in 1.3.14. The deeper Rust payoff—less `unsafe`, more Miri coverage, more systematic hardening—is work this release enables, not work it finishes.

### Wording to avoid

- “Rust made Bun memory-safe.” Bun still embeds JavaScriptCore and other C/C++ libraries and uses `unsafe` at FFI boundaries.
- “The rewrite alone made Bun 48% leaner.” The published maximum is workload-specific and the release attributes improvements to multiple changes.
- “Every memory leak is fixed.” Bun's bounded claim is every **instrumentable** leak found through its sanitizer setup; [PR #30875](https://github.com/oven-sh/bun/pull/30875) includes process-lifetime suppressions.
- “The rewrite is now idiomatic Rust.” Bun says the 1.4 port is intentionally mechanical.

## 2. More real Node workloads cross the “it just runs” line

### Reader value

Compatibility is the difference between Bun as a benchmark curiosity and Bun as a runtime a team can actually adopt. The release identifies tag-new support for Playwright, Vitest, OpenTelemetry instrumentation, and `dd-trace`, while adding or repairing APIs used by Nuxt, testcontainers/dockerode, proxy agents, gRPC, RabbitMQ, AWS SDK streaming, TypeORM, Nock, Fastify injection, Happy DOM, and Piscina. It also moves the reported Node target to 26.3.0.

Primary source: [official compatibility section](https://bun.com/blog/bun-v1.4). The baseline exposes the reported Node version and module ABI through `process.versions` and `process.config`: [`src/jsc/bindings/BunProcess.cpp#L220-L291`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/jsc/bindings/BunProcess.cpp#L220-L291), [`#L2750-L2764`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/jsc/bindings/BunProcess.cpp#L2750-L2764).

### Claim boundary

- **A, tag-new examples:** the release labels Playwright, Vitest, OpenTelemetry, and `dd-trace` as v1.4.0. The [breaking-change tracker](https://github.com/oven-sh/bun/issues/28792) records Node 26.3.0 and `NODE_MODULE_VERSION` 147.
- **B, release-train total:** “+1,517 newly passing Node tests” is a Bun 1.3 → 1.4 delta, not 1,517 tests added by the final tag commit. The release page says its chart uses the 1.3 baseline.
- Passing percentages are per Bun's vendored Node suite and do not imply complete application compatibility. The release itself says Bun is not yet 100% Node-compatible.
- The ABI bump means native addons built for Node 24 need rebuilding; compatibility gains and migration cost coexist.
- At `2026-08-27T03:51:26Z`, [HTTP/2 issue #39796](https://github.com/oven-sh/bun/issues/39796) and proposed [PR #39873](https://github.com/oven-sh/bun/pull/39873) were **Open**. The reporter sees a roughly 28-second inbound-frame stall under `bun test`; it is not a generic proof that Bun's gRPC support is broken, because a reduced plain `@grpc/grpc-js` case did not reproduce.

### Recommended bounded wording

> The compatibility story is more consequential than the API count: Bun 1.4 removes concrete blockers for Playwright, Vitest, OpenTelemetry, Datadog, and a long list of Node packages, while targeting Node 26.3.0. That expands the set of projects worth canarying; it does not turn the test-suite percentages into a universal drop-in guarantee.

### Wording to avoid

- “Bun now passes 97% of Node.” The 97% figures are per listed modules, not one global compatibility score.
- “1.4.0 added 1,517 tests.” Say the 1.3 → 1.4 release train added them.
- “All Node packages now work.” The official page explicitly rejects 100% compatibility.
- “Node 26 compatibility is free.” Native addon ABI 147 can require rebuilds.

## 3. Bun is becoming the deployment unit, not only the runtime

### Reader value

`Bun.Image` and `Bun.WebView` make the release's product direction legible: commonly deployed native work moves inside the one Bun binary. That can remove an addon build, package install, browser wrapper, lockfile entry, and some platform setup. It matters most in small services, asset pipelines, automation, agents, and single-binary deployments.

The image path is not marketing-only. The pinned source registers `Bun.Image` lazily ([`BunObject.rs#L325-L333`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/api/BunObject.rs#L325-L333)), bridges `Bun.file()`/Blob input ([`Blob.rs#L686-L692`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/webcore/Blob.rs#L686-L692)), snapshots the transform pipeline and dispatches a worker job ([`Image.rs#L1112-L1158`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/Image.rs#L1112-L1158)), and routes native/OS codecs ([`codecs.rs#L22-L83`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/image/codecs.rs#L22-L83)). The separate audit reproduced 224 focused image tests with zero failures on the official 1.4.0 macOS arm64 binary.

### Claim boundary

- **B:** the official page labels `Bun.Image` v1.3.14. A local sample produced byte-identical output on 1.3.14 and 1.4.0. It is not tag-new.
- **B/A hybrid:** `Bun.WebView` carries both v1.3.12 and v1.4.0 labels. Say it developed across the release train unless naming one tag-specific delta.
- `Bun.Image` has a Sharp-shaped API, not proven drop-in equivalence for every Sharp pipeline. HEIC/AVIF/TIFF availability is platform-dependent, and awaited terminals are off-thread while direct `new Response(image)` encoding is synchronous: [pinned image docs](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/runtime/image.mdx).
- `Bun.WebView` uses system WebKit on macOS or an installed Chromium-family browser; “built-in” does not mean Bun embeds every browser engine on every OS: [official WebView section](https://bun.com/blog/bun-v1.4), [pinned docs](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/runtime/webview.mdx).

### Recommended bounded wording

> The release train's most important product bet is that Bun's binary should do more of the work applications currently install packages and native addons to do. `Bun.Image` and `Bun.WebView` make that concrete—but Image first shipped in 1.3.14, and both APIs still depend on platform-specific backends.

### Wording to avoid

- “Bun 1.4.0 introduced `Bun.Image`.” It first shipped in 1.3.14.
- “Bun.Image is Sharp, but faster.” The API is Sharp-shaped; benchmark wins are workload-specific, and the feature PR includes a case where Bun is slightly slower.
- “WebView needs no browser.” macOS can use system WebKit; other paths can depend on installed Chrome, Chromium, or Edge.
- “Fifteen dependencies are obsolete.” Built-in coverage is not proof of full behavioral equivalence.

## 4. Large test suites gain an actual scheduling system

### Reader value

The useful unit is the system, not one flag: worker processes consume files, deterministic shards split CI machines, changed-test selection follows the import graph, and recorded durations let both workers and shards schedule slow files first. This attacks the long tail that keeps CI idle after most tests finish.

Primary sources: [official `bun test` section](https://bun.com/blog/bun-v1.4), implementation PRs [#29354](https://github.com/oven-sh/bun/pull/29354) and [#36814](https://github.com/oven-sh/bun/pull/36814).

### Claim boundary

- **A:** `bun test --timings` and `--update-timings` are labeled v1.4.0.
- **B:** `--parallel`, `--shard`, `--changed`, and `--isolate` carry both v1.3.13 and v1.4.0 labels. The scheduler story matured in 1.4; it did not begin at the 1.4.0 tag.
- The official 9.4s → 2.4s / 3.9× animation uses illustrative durations. Do not present it as a universal benchmark.
- At `2026-08-27T03:51:26Z`, [issue #39987](https://github.com/oven-sh/bun/issues/39987) was **Open**. A reporter's roughly 1,100-file suite stalled in 2 of 30 `--parallel=4 --randomize` soak runs, a reported improvement from roughly 10% on 1.3.14 but not elimination.

### Recommended bounded wording

> Bun's test runner now has the pieces large suites need—workers, isolation, sharding, changed-test selection, and duration-aware scheduling. `--timings` is truly new in 1.4.0; the other pieces arrived in 1.3.13 and were hardened for 1.4. Keep an outer CI watchdog while the stable parallel-runner deadlock report remains open.

### Wording to avoid

- “Parallel tests are new in 1.4.0.” They first shipped in 1.3.13.
- “Parallel is 3.9× faster.” The official release labels those particular durations illustrative.
- “The parallel deadlock is fixed.” The reporter says the rate fell, but #39987 remained open at the cutoff.

## 5. Package hygiene moves into the package manager

### Reader value

For teams already using `bun install`, these commands collapse several release and container steps into the same tool and lockfile model:

- `bun pm diff` surfaces file changes, install scripts, and sensitive new imports before upgrading;
- `bun audit fix` resolves and installs non-vulnerable versions, with dry-run support;
- `bun dedupe --check` can enforce duplicate-free lockfiles in CI;
- `bun prune --production` removes dev dependencies after a build;
- `bun pm licenses --prod --json` creates a machine-readable production license inventory.

All five are labeled **A, v1.4.0** in the [official package-manager section](https://bun.com/blog/bun-v1.4). The shared global virtual store is different: it carries v1.3.14 and v1.4.0 labels and is opt-in for existing projects through the isolated linker.

### Claim boundary and live risk

At `2026-08-27T03:51:26Z`, [`bun audit fix --latest` issue #39309](https://github.com/oven-sh/bun/issues/39309) was **Open**. Its reporter shows a minimal case downgrading `aws-sdk` from 2.1693.0 to 1.18.0, crossing a major boundary and leaving a high plus moderate advisory where the input had a low plus moderate advisory. This audit did not reproduce that report, but it is high-consequence and directly touches a new command.

### Recommended bounded wording

> Bun 1.4.0 turns the package manager into a release-hygiene tool: inspect package diffs, repair advisories, dedupe the lockfile, prune production installs, and inventory licenses without stitching together separate CLIs. Use `audit fix --dry-run`, review the manifest and lock diff, and avoid unattended `--latest` until the open downgrade report is resolved.

### Wording to avoid

- “`bun audit fix --latest` safely upgrades vulnerable dependencies.” An open report shows it can choose an older, more vulnerable major.
- “The global store is new in 1.4.0.” It first appears under 1.3.14 and is opt-in for existing projects.
- “`bun prune` makes a container minimal.” It removes packages outside the lockfile and, with `--production`, dev dependencies; it does not optimize every other layer.

## 6. Profiling output becomes terminal- and agent-readable

### Reader value

This is one of the release train's most practical agentic-engineering improvements. The output is no longer trapped behind a GUI or a huge JSON file:

- `bun --cpu-prof-md ./app.ts` emits top functions, self/total time, and a call tree;
- `bun --heap-prof-md ./app.ts` emits total heap, types by retained size, largest objects, and retaining chains;
- `bun build entry.ts --metafile-md=analysis.md --outdir=dist` emits entry-point composition, largest inputs, dependency chains, and a raw grep-friendly graph;
- `BUN_CPU_PROFILE=1` enables profiling for framework/worker processes where command-line flags are awkward;
- async errors from `fs.promises`, `fetch`, S3, DNS, and crypto now point back to the originating `await` instead of surfacing empty native stacks.

Primary sources: [official observability section](https://bun.com/blog/bun-v1.4), [CPU profiler PR #24112](https://github.com/oven-sh/bun/pull/24112), [CPU Markdown PR #26327](https://github.com/oven-sh/bun/pull/26327), [heap Markdown PR #26326](https://github.com/oven-sh/bun/pull/26326), [metafile Markdown PR #26441](https://github.com/oven-sh/bun/pull/26441), and [async-stack PR #28652](https://github.com/oven-sh/bun/pull/28652).

### Claim boundary

- **B:** the release page dates the CPU profiler family to v1.3.2, heap profiler family to v1.3.7, and `--metafile-md` to v1.3.8 plus v1.4.0. These are 1.4 release-train benefits, not all tag-new.
- Markdown makes evidence portable and agent-readable; it does not make an LLM's diagnosis correct. The profiler remains sampled data, heap retention still needs domain knowledge, and bundle size does not itself prove a dependency is removable.

### Recommended bounded wording

> Bun's profiling output now fits the way engineers and coding agents actually debug: CPU call trees, heap retainers, and bundle dependency chains can be read over SSH, grepped, attached to an issue, or handed to an agent as plain Markdown. Most of this arrived during 1.3.x and is gathered into the 1.4 workflow rather than originating at the final tag.

### Wording to avoid

- “Bun 1.4.0 introduced Markdown profiling.” Preserve the 1.3.2/1.3.7/1.3.8 chronology.
- “An agent can now automatically fix performance bugs.” The commands expose evidence; they do not validate a diagnosis or repair.
- “V8-compatible means identical to Node's profiler.” It means the artifact format opens in compatible tools.

## 7. React Compiler stops being a separate Babel/SWC pass

### Reader value

For React teams, the annoyance removed is an extra compiler pipeline. `bun build --react-compiler`, or `reactCompiler: true` in `Bun.build()`, performs React's auto-memoization transform inside Bun's parser without a separate Babel/SWC parse-and-print round trip.

Bun's published benchmark on a codebase of roughly 860 components reports:

- ordinary Bun build: 394 ms;
- Bun build with React Compiler: 465 ms, an added 71 ms;
- Babel plugin compilation on the same input: 9.15 s, described as about 20× slower than Bun's added compiler work;
- full `--compile` build: 3.62 s with Bun's integration versus 13.04 s with the comparison path, 3.6×.

**A, tag-new:** the official page labels this v1.4.0. Primary sources: [official React Compiler section](https://bun.com/blog/bun-v1.4), [implementation PR #32504](https://github.com/oven-sh/bun/pull/32504).

### Claim boundary

These are maintainer measurements on one large React codebase, not a universal multiplier. The valuable claim is architectural—one parser/compiler pipeline—plus a measured example. Projects still need their own semantic and build-output tests before removing an existing compiler path.

### Recommended bounded wording

> React Compiler becomes a Bun build option instead of another compiler in the chain. Bun reports only 71 ms of added work across roughly 860 components, versus 9.15 seconds for the Babel plugin on the same input; treat that as a measured example, then validate your own plugins and output.

### Wording to avoid

- “React builds are 20× faster in Bun 1.4.” The roughly 20× comparison is the compiler step on Bun's chosen input, not every end-to-end React build.
- “No Babel or SWC is needed for every React project.” Other transforms/plugins may still require them.
- “The React Compiler makes an app 20× faster.” This is build-time overhead, not runtime application performance.

## 8. Monorepo and agent task orchestration loses two helper dependencies

### Reader value

Two ordinary infrastructure annoyances move into Bun:

1. `bun run --parallel build test`, `bun run --parallel "build:*"`, and `bun run --parallel --filter '*' build` replace common `concurrently`/`npm-run-all` jobs. Output is prefixed by script or `package:script`, pre/post hooks remain grouped, and `--no-exit-on-error` supports fan-out collection.
2. `Bun.spawn(["bash"], { terminal: { cols, rows, data } })` exposes a cross-platform pseudo-terminal with write and resize support. That is useful for remote shells, TUI tests, terminal multiplexers, and coding-agent processes that require a real PTY rather than pipes.

Primary sources: [official `bun run --parallel` section](https://bun.com/blog/bun-v1.4), [PR #26551](https://github.com/oven-sh/bun/pull/26551), [official `Bun.Terminal` section](https://bun.com/blog/bun-v1.4), [PTY PR #25415](https://github.com/oven-sh/bun/pull/25415), and [Windows PTY PR #29522](https://github.com/oven-sh/bun/pull/29522).

### Claim boundary

- **B:** `bun run --parallel` first shipped in v1.3.9 and `Bun.Terminal` in v1.3.5; both headings also carry v1.4.0, reflecting release-train hardening.
- The 1.4 changelog includes a meaningful Terminal correctness fix: `Bun.Terminal#write()` now returns the full buffered input length instead of only synchronously flushed bytes, avoiding caller retries that duplicated input. That fix is a better “small annoyance removed” example than claiming the whole PTY API is tag-new.
- A built-in PTY removes `node-pty` from some deployments, not the need to test signals, process trees, cleanup, shell availability, encoding, and Windows behavior.

### Recommended bounded wording

> Bun's release train removes two bits of workflow glue: script fan-out no longer needs `concurrently`, and interactive subprocesses no longer need `node-pty`. The APIs began in 1.3.x; 1.4's value is the more complete cross-platform workflow and fixes such as Terminal writes reporting the full buffered length.

### Wording to avoid

- “`bun run --parallel` and `Bun.Terminal` are new in 1.4.0.” They began in 1.3.9 and 1.3.5.
- “Bun.Terminal makes agent subprocesses reliable.” It supplies the PTY primitive; lifecycle policy and testing remain the application's job.
- “It replaces every task runner.” It covers script fan-out/filtering, not arbitrary dependency graphs, caching, or distributed execution.

## 9. A process can react to OS memory pressure instead of guessing

### Reader value

`process.on("memoryPressure", handler)` lets a long-running service clear caches, close idle connections, or reap idle workers when the operating system reports low memory. Before this, an application generally polled process/OS metrics, guessed at static thresholds, or learned about pressure when allocation failed or the process was killed.

The implementation contract published for the release is platform-specific:

- macOS uses `kqueue` with `EVFILT_MEMORYSTATUS` and reports `"warning"` or `"critical"`;
- Linux watches PSI or the cgroup `memory.pressure` interface with `epoll` and reports `"critical"`;
- Windows waits on `CreateMemoryResourceNotification` and reports `"critical"`;
- registering the listener does not itself keep the event loop alive.

**A, tag-new:** the changelog labels the event v1.4.0. Primary sources: [official memory-pressure section](https://bun.com/blog/bun-v1.4), [implementation PR #32594](https://github.com/oven-sh/bun/pull/32594).

### Claim boundary and wording to avoid

Recommended: “Bun 1.4.0 gives services an OS-backed chance to shed optional memory before the situation becomes fatal.”

Avoid “Bun prevents OOMs.” A notification can arrive late, handlers can retain memory or allocate more, platform thresholds differ, and not every allocation failure is preceded by a useful signal.

## 10. Native FFI stops paying TinyCC bridge overhead

### Reader value

For native bindings and terminal/UI libraries, per-call overhead compounds quickly. Bun 1.4 moves `bun:ffi` onto FFI support built into JavaScriptCore instead of TinyCC. Bun's release benchmark reports:

- no-op call: 2.13 ns in Bun 1.3 → 0.70 ns in Bun 1.4, 3.0×;
- `new CString(ptr)`: 92.5 ns → 24.1 ns, 3.8×;
- 1,000 OpenTUI layout reads: 2.08× improvement.

**A, tag-new:** the heading is labeled v1.4.0. Primary sources: [official FFI section](https://bun.com/blog/bun-v1.4) and the baseline release tree [`src/runtime/ffi`](https://github.com/oven-sh/bun/tree/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/ffi).

### Claim boundary and wording to avoid

Recommended: “The FFI bridge is materially cheaper in Bun's microbenchmarks, which can matter for chatty native APIs.”

Avoid “all native extensions are 3× faster.” The result is call-shape-specific, and FFI remains an unsafe ABI boundary where type/layout mistakes can crash or corrupt the process.

## After-tag state: do not silently promote proposals into the release

No follow-up stable `1.4.x` existed at the cutoff. The following work is **after the 1.4.0 tag but not shipped in a stable release**:

- Windows rejected `Bun.file()` read regression: [issue #39787](https://github.com/oven-sh/bun/issues/39787) **Open**, [proposed PR #39793](https://github.com/oven-sh/bun/pull/39793) **Open**.
- HTTP/2 inbound-frame stall under `bun test`: [issue #39796](https://github.com/oven-sh/bun/issues/39796) **Open**, [proposed PR #39873](https://github.com/oven-sh/bun/pull/39873) **Open**.
- Stable `bun test --parallel` deadlock follow-up: [issue #39987](https://github.com/oven-sh/bun/issues/39987) **Open**.
- `bun audit fix --latest` unsafe downgrade report: [issue #39309](https://github.com/oven-sh/bun/issues/39309) **Open**.

Safe phrasing: “A fix is proposed in an open PR.” Avoid “Bun fixed this after release” until a fix is merged **and** appears in a named stable release.

## Compact near-ending shape

The section can be six to eight short numbered paragraphs under a blunt heading such as **“So what changes for you?”** Each paragraph should begin with the job, not the feature name. The first six form the compact version; add seven and eight when the ending can carry more practical detail:

1. **Long-running Bun processes should cost less to keep alive.** Then give the Rust/allocator/leak boundary.
2. **More existing Node projects are plausible Bun candidates.** Then name real package blockers and ABI cost.
3. **Some native dependencies can disappear from the deploy.** Then use Image/WebView with the release-train caveat.
4. **Large CI suites have better scheduling primitives.** Then distinguish `--timings` from earlier parallel/shard work and keep the watchdog caveat.
5. **Performance evidence can move through a terminal, issue, and agent without conversion.** Then name the Markdown CPU/heap/bundle reports and their 1.3.x chronology.
6. **Package cleanup now fits into one reviewable workflow.** Then make `--dry-run` and the open audit issue part of the value, not a footnote.
7. **React Compiler can be one build flag instead of another compiler pipeline.** Keep the 71 ms versus 9.15 s example bounded to Bun's input.
8. **Monorepo fan-out and interactive agent subprocesses lose helper dependencies.** Then pair `bun run --parallel --filter` with `Bun.Terminal`, explicitly dating both to 1.3.x.

The connective verdict is: **Bun 1.4 matters less as a pile of new APIs than as a shift in which operational and build responsibilities the Bun binary is willing to own.** That is an inference from the shipped work, not a Bun quote.

## Author-density follow-up: why small runtime costs matter now

The author supplied a first-hand workstation constraint after reviewing the first practical-impact draft:

- M5 MacBook Pro with 24 GB RAM;
- Chrome, VS Code, ChatGPT Desktop or Claude Cowork active beside local work;
- multiple CLIs and MCP servers;
- many Claude Code and Codex sessions running in parallel;
- a stated goal of making 10–15 concurrent sessions ordinary and 50–100 terminal panes plausible.

This is personal observation and product ambition, not a benchmark. The safe bridge to the release evidence is:

`lower steady-state cost per Bun process → more workstation headroom under parallel agent work → workload-specific concurrency still needs measurement`

Do not multiply one Claude Code CPU percentile by an agent count or claim the benchmark proves a 50-agent laptop.
CPU, memory, model clients, browsers, editors, MCP servers, network work, and the agents' own tasks do not compose
linearly. The release figures show runtime headroom, not total system capacity.

### Official resource matrix carried into the article

All figures below come from the [official Bun 1.4 release post](https://bun.com/blog/bun-v1.4) and remain maintainer
or owner measurements:

- Claude Code production CPU: p99 24% → 10%; p50 5.8% → 2.5%.
- Small hello-world idle CPU: 5× lower.
- HTTP-server peak memory under the stated request load: Fastify 233 → 120 MB; Express 169 → 92 MB;
  `node:http` 135 → 81 MB; Elysia 91 → 55 MB; Next.js 397 → 285 MB; `Bun.serve` 45 → 36 MB;
  Vite dev server 268 → 233 MB.
- Dynamic Next.js App Router SSR over 4,000 pages: Bun 1.4 settles at 238 MB, Node.js 26 at 410 MB, and Bun 1.3
  grows without bound in the published run.
- Windows hello-world: 39.0 → 15.5 ms startup and 46.5 → 16.8 MB peak memory.
- Linux hello-world: 10.9 → 5.1 ms startup and 33.0 → 14.6 MB peak memory.
- Runtime binaries shrink on Linux and Windows, with the largest shown drop on Windows arm64 (90.2 → 75.1 MB);
  macOS binaries grow by 1.0 MB on arm64 and 0.6 MB on x64.

The release attributes CPU improvements to garbage-collector timer behavior, a segmented-array layout for visiting
JavaScriptCore `Strong` roots, fewer futex calls, and allocator work. The article can name these mechanisms because
they explain why the numbers changed; it must not turn them into an independent causal reproduction.

### Standalone-executable boundary

Pinned [standalone executable documentation](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/bundler/executables.mdx)
states that `bun build --compile` bundles JavaScript or TypeScript, imported files and packages, and a copy of the Bun
runtime. It supports a defined cross-compilation matrix. Safe wording is “one deployable file for a supported target.”
Avoid “native on any hardware,” “no runtime,” or “tiny native binary”: the executable embeds Bun, target support is
finite, and compiled applications must be rebuilt to pick up runtime fixes.
