# Bun 1.4.0 adversarial adoption review

## Audit record

- **Task:** `TASK-0092`
- **Mode:** single-project deep dive, adversarial adoption pass
- **Checked:** 2026-08-26 (America/Los_Angeles)
- **Release:** Bun 1.4.0, published 2026-08-20
- **Bun baseline:** [`34cbb9a40b4bd1bd767d134a7065e66c2432a676`](https://github.com/oven-sh/bun/tree/34cbb9a40b4bd1bd767d134a7065e66c2432a676), the `bun-v1.4.0` tag
- **Pinned WebKit baseline:** [`0f966e81b78c84bb23213e391bc679c4ef83e56b`](https://github.com/oven-sh/WebKit/commit/0f966e81b78c84bb23213e391bc679c4ef83e56b), from Bun's [`WEBKIT_VERSION`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/deps/webkit.ts#L1-L7)
- **Local reproduction:** none. Code claims were inspected in a shallow checkout at the tag. Runtime failures below remain attributed first-hand reports or repair-PR evidence.
- **Repository shape at the tag:** 1,523 tracked `.rs` files and no tracked `.zig` files. This confirms the source-language cutover, not behavioral parity.

## Outcome

The release supports one strong, falsifiable thesis:

> **Bun 1.4 makes Bun credible enough to test as a production migration target because it couples a complete Rust source cutover with much broader Node test coverage, better observability, and measured resource gains. It does not make Bun a runtime that a team should swap in without a workload and platform migration gate.**

This is stronger than “Bun was rewritten in Rust,” because users adopt behavior, not source language. It is narrower than Bun's stated “drop-in replacement” goal, because Bun's own release notes say compatibility is incomplete and stable-1.4 reports expose gaps in ordinary async I/O, `ws`, HTTP/2, and large parallel test suites.

The thesis survives the attack only in this bounded form. The release justifies a trial. It does not justify blind replacement.

## Competing theories

| Theory | Evidence for | Evidence against | Direction state | What would disprove it |
|---|---|---|---|---|
| **Maintainer theory:** Rust's ownership model plus Bun's language-independent test suite lets the team remove recurring lifetime bugs without freezing product work. | The rewrite post documents 100% of Bun's existing suite passing on six build lanes before merge, 24/7 fuzzing, security reviews, and 128 bugs fixed from 1.3.14. The 1.4 tag contains Rust rather than Zig. | The same post says about 4% of Rust code was in `unsafe`, Bun still embeds C/C++ libraries, and a mechanical port created known semantic regressions. Stable 1.4 reports found more regressions after release. | **Shipped** source cutover; the long-term stability result is **not yet established**. | A sustained 1.4.x/1.5 field record with no reduction in crash, leak, or regression rates versus 1.3 would refute the claimed stability payoff. |
| **Rival theory:** the rewrite moved memory-risk detection earlier but traded a known implementation for a vast, AI-authored semantic regression surface; the first release is a new baseline, not proof of maturity. | Four first-hand stable-1.4 reports below cover different subsystems and platforms. Repair PRs identify Rust-port or new-engine mechanics in three cases. | Bun ran a large suite on all release platforms, shipped months of Claude Code use before 1.4, and many reported failures already have targeted tests and repairs. | **Inference**, supported by reported failures and proposed/merged repairs. | A cross-platform soak of real migration workloads with no 1.3-to-1.4 behavioral regressions would weaken this reading. |

Do not make “AI rewrites work” the thesis. One extraordinary project, one maintainer-led harness, one test corpus, and one release cannot establish that general claim.

## Claim audit

| Claim | Product says | Code, test, or report | Evidence state | Inference | Article treatment |
|---|---|---|---|---|---|
| Bun 1.4 is the first Rust release. | The release and rewrite posts say Bun is now written in Rust. | The pinned tree has 1,523 tracked `.rs` files and no tracked `.zig` files. | **Code-inspected / shipped** | None. | Safe. Say “source cutover,” not “memory-safe runtime.” |
| The rewrite preserves Bun's behavior. | The rewrite used the same language-independent suite; all six platform lanes went green before merge. | Stable reports show a Windows rejected-read continuation can be skipped, an async `ws` upgrade can fail, HTTP/2 can stall under `bun test`, and parallel test workers can deadlock. | **Reported**; three repairs are **proposed or merged after the tag**. | A green project suite did not cover every event-loop interleaving or downstream workload. | Qualify hard. The suite made the rewrite releasable; it did not prove equivalence. |
| Bun is a drop-in Node replacement. | The release calls this the design goal and says selected core modules pass 97–100% of Node's tests. | The same table shows `worker` 116/157, `module` 68/93, `diagnostics_channel` 36/69, `test_runner` 28/81, and `inspector` 22/110. It explicitly says Bun is not 100% compatible. Stable reports hit documented `ws` and HTTP/2 workflows. | **Shipped metrics + reported limits** | Aggregate/newly-passing test counts are a migration signal, not an ecosystem compatibility percentage. | Replace “drop-in” with “workload-scoped migration candidate.” |
| Node 26 compatibility makes native addons current. | Bun reports Node 26.3.0 and `NODE_MODULE_VERSION` 147. | The tag pins [`NODEJS_VERSION = "26.3.0"` and ABI `147`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/deps/nodejs-headers.ts#L12-L23). Bun warns that older prebuilds need rebuilding. Node documents that only Node-API is ABI-stable across major versions; V8/libuv/Node C++ APIs are not. | **Code-inspected / standard** | “Node-compatible” does not mean every Node native binary loads unchanged. | Tell teams to inventory native addons and distinguish Node-API from V8/NAN/direct addons. |
| Rust makes Bun safe. | The stated goal is to turn use-after-free, double-free, and missed cleanup into compiler errors. | Bun's rewrite post reports about 4% of Rust code inside `unsafe` and continued C/C++ dependencies including JavaScriptCore, uWebSockets, BoringSSL, and SQLite. | **Maintainer-stated** | Rust removes classes of bugs in safe code; it cannot erase FFI, engine, protocol, or logic risk. | Cut “memory-safe.” Say “moves more lifetime checks to compile time.” |
| The built-ins remove dependencies. | The release presents 15 packages replaced by built-ins. | `Bun.Image` supports HEIC/AVIF/TIFF only on macOS and Windows. `Bun.WebView` uses system WebKit on macOS or an installed Chrome-family browser; the tagged type definitions say Chrome is still an outside dependency. | **Code-inspected / shipped** | A lockfile entry can disappear while browser, codec, operating-system, and Bun-version dependencies remain. Bun-only APIs also reduce runtime portability. | Say “collapses selected dependency paths into Bun,” not “zero dependencies” or “replaces the packages.” |
| `Bun.WebView` is browser automation without Puppeteer or Playwright. | The release shows five calls and says no npm automation package is needed. | The Chrome backend is CDP over an installed browser. With the object form and no `url`/`path`, it can auto-detect `DevToolsActivePort` and connect to an existing browser; `url: false` forces a fresh spawned browser. The spawn path creates a `0700` temp profile. | **Code-inspected / shipped** | “No Puppeteer” is accurate for the shown path. “No browser dependency,” “isolated by default in every configuration,” or “feature-equivalent” is not. | Mention the browser dependency. For unattended or sensitive automation, force spawn with `backend: { type: "chrome", url: false }` and choose storage explicitly. |
| `bun audit fix` improves supply-chain operations. | It upgrades vulnerable packages to safe versions, supports dry-run, and reports major-version blockers. | The code builds a JSON map of package names to installed versions, gzips it, and POSTs it with configured registry auth to `/-/npm/v1/security/advisories/bulk`. | **Code-inspected / shipped** | This is expected audit behavior, but it discloses dependency inventory to each configured registry when invoked. | Keep the feature; add a privacy note for private names, custom registries, and air-gapped environments. |
| Bun 1.4 contains many security fixes. | The release recommends upgrading and says advisories will be published after an upgrade window. | The release documents tighter TLS defaults, request-before-pin prevention, and tar path hardening. The GitHub security-advisory API returned no published repository advisories on 2026-08-26. | **Shipped hardening + maintainer-stated undisclosed fixes** | The visible code supports specific hardening claims, but the severity and full scope of undisclosed fixes cannot yet be audited publicly. | Report the concrete hardening. Do not claim a vulnerability count or severity until advisories publish. |
| Bun 1.4 broadens platform support. | Official FreeBSD, Windows ARM64, older glibc/kernel support, experimental Android, and baseline-only x64 builds are listed. | The release marks Android experimental. Open issue #34215 reports the Darwin x64 baseline can still JIT AVX on pre-AVX hosts; the proposed WebKit repair remains open and is not in Bun's pinned WebKit baseline. | **Shipped platform matrix + reported/proposed boundary** | “Baseline-only” does not by itself prove every baseline CPU executes every JIT tier. | Keep exact OS/arch floors; never compress them into “runs everywhere.” |

## The strongest break attempts

### 1. Node compatibility fails at event-loop seams, not only missing APIs

The release's per-module test gains are real. They also miss the class of failure that makes a runtime migration costly: an API exists and passes many tests, but an async interleaving differs.

- [`#39787`](https://github.com/oven-sh/bun/issues/39787) reports that on Windows x64, a rejected `Bun.file(...).text()` can let the process exit `0` before its promise continuation runs. The reporter tested all four `BunFile` read methods, compiled binaries, 20/20 repetitions, Bun 1.3.14, Bun 1.4.0, and Linux. `node:fs/promises` is unaffected. The repair [`#39793`](https://github.com/oven-sh/bun/pull/39793) says the Rust read path lost the event-loop enter/exit bracket used by other Windows libuv completions. As of the cutoff, both issue and PR are open. This is **reported** behavior with a **proposed** fix, not reproduced here.
- [`#39766`](https://github.com/oven-sh/bun/issues/39766) reports that the built-in `ws` shim fails when `handleUpgrade()` runs after a macrotask, which is the documented external-authentication pattern. The report compares Node 24, Bun 1.3.14, Bun 1.4.0, the npm `ws` package, the Bun shim, microtask and macrotask variants, and says it broke a production chat path. Repair [`#39642`](https://github.com/oven-sh/bun/pull/39642) merged on 2026-08-22, two days after the 1.4.0 tag, and adds ten regression tests. The issue is closed, but the repair is **not shipped in 1.4.0**.
- [`#39796`](https://github.com/oven-sh/bun/issues/39796) reports a roughly 28-second inbound HTTP/2 stall under `bun test` against a Rust `tonic` gRPC server. Bun 1.3.14 and Node 22.22.2 pass; 1.4.0 and a canary fail. The report captures PING frames through a proxy but still needs the reporter's client stack. Repair [`#39873`](https://github.com/oven-sh/bun/pull/39873) supplies a smaller test and attributes the stall to JS callbacks running while the new HTTP/2 engine holds a borrow. The PR also names one coalesced-frame nested-loop case it deliberately leaves unresolved because 1.3.14 shares it. Issue and PR remain open. Treat the original as **reported**, the root-cause analysis and fix as **proposed**, and the remaining case as an explicit boundary.

These do not prove Bun's runtime is broadly unreliable. They disprove the stronger claim that passing more Node tests removes the need for application-level shadowing.

### 2. The new parallel test runner needs a watchdog at large-suite scale

[`#39987`](https://github.com/oven-sh/bun/issues/39987) reports that a roughly 1,100-file suite still deadlocks under `bun test --parallel` on stable 1.4.0: 2 stalls in a 30-run randomized soak on macOS arm64 plus one GitHub Actions Ubuntu occurrence. The reporter says the rate fell from roughly 10% on 1.3.14 to 7% on 1.4.0, so this is not a claim that 1.4 introduced the deadlock. It is evidence that “fixed on the 1.4 line” did not mean “eliminated in stable.” The issue is open and has no minimal reproducer.

Use `--parallel` behind a no-output watchdog and retry policy until the team's own suite proves it clean. Do not turn one report's approximate rate into a general Bun failure rate.

### 3. “Built in” changes where trust and portability sit

Moving image codecs, Markdown, archive extraction, browser control, PTY, cron, and audit repair into one binary can remove native build steps and dependency graph churn. It also means:

- fixes arrive on Bun's release cadence rather than each package's cadence;
- a Bun-only API couples source to Bun unless an adapter remains;
- the binary and its linked C/C++ libraries become a larger trusted computing base;
- platform codecs and browsers still determine behavior; and
- a single upgrade changes runtime, package manager, test runner, bundler, and built-ins together.

That is a product strategy, not a free supply-chain win. The article should show one or two concrete built-ins and their remaining outside layer instead of repeating the “15 dependencies to zero” animation as a literal architecture claim.

## Security and privacy boundaries

### What shipped

The release documents specific security improvements that deserve credit:

- `fetch()` calls `checkServerIdentity` before it sends request bytes and on redirects;
- `tls.connect()` now uses `host` as the default certificate `servername`;
- `Bun.connect`, `Bun.listen`, and TLS upgrades enforce `rejectUnauthorized` by default;
- URL/GitHub tar extraction blocks entries that escape the package directory;
- lockfile v2 requires integrity for off-registry npm tarballs and rejects traversal-like Git dependency entries; and
- compiled executables no longer auto-load arbitrary `tsconfig.json` or `package.json` from their runtime working directory, though `.env` and `bunfig.toml` still auto-load unless disabled.

Those are shipped behaviors. The broader security-fix set remains partly undisclosed at the cutoff. Say that plainly.

### `bun audit` network disclosure

At the pinned tag, [`build_body()`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/cli/audit_command.rs#L550-L582) serializes installed package names and versions. [`send_audit_request()`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/cli/audit_command.rs#L691-L758) gzips that inventory and sends it to each configured registry's npm bulk-advisory endpoint, including the relevant registry authorization header. This happens when the user invokes audit; it is not background telemetry.

The article can call `bun audit fix --dry-run` useful. It should not imply an entirely local scan. Teams whose package names reveal private products should verify which registries receive each scope.

### WebView profile isolation

The Chrome backend can be either cleanly spawned or attached to an existing remotely debuggable browser. The tagged definitions document that an omitted `url` in the object-form backend searches `DevToolsActivePort` and auto-connects; `url: false`, `path`, or `argv` forces spawn. The implementation searches default Chrome, Chromium, Brave, and Edge profile locations on macOS, Linux, and Windows. A spawned browser gets a new mode-`0700` temp profile.

The privacy-sensitive rule is simple: unattended automation should force spawn mode rather than rely on discovery. Connecting to an existing browser is an explicit capability with a different cookie, storage, extension, and account boundary. The code even notes that enterprise-mandated extensions may survive `--disable-extensions`.

Pinned evidence:

- [`Backend` contract and auto-connect default](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/packages/bun-types/bun.d.ts#L8888-L8958)
- [`DevToolsActivePort` profile discovery](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/webview/ChromeProcess.rs#L1037-L1090)
- [fresh temp profile and browser flags](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/webview/ChromeProcess.rs#L481-L543)

## Platform and operational boundaries

- **Native addons:** Bun's Node 26.3/ABI 147 target requires new prebuilds for addons bound to the Node/V8 ABI. Node-API-only addons have the relevant ABI guarantee; direct V8, libuv, and Node C++ APIs do not. See [Node's Node-API stability contract](https://nodejs.org/api/n-api.html#implications-of-abi-stability).
- **Windows:** the new ARM64 binary and faster timers are real, but #39787 shows why Windows needs its own migration lane. Linux success does not cover libuv completion behavior on Windows.
- **HTTP/2/gRPC:** do not promote a service that relies on long-lived HTTP/2 channels from a unit-test green light alone. Run protocol soak tests under the exact `bun run` or `bun test` mode used in production/CI.
- **WebSockets:** delayed auth before `handleUpgrade()` needs the post-tag repair or an explicit repro gate.
- **Large test suites:** wrap `bun test --parallel` in a watchdog until the suite survives repeated randomized runs.
- **Old x64 macOS / Rosetta:** open issue [`#34215`](https://github.com/oven-sh/bun/issues/34215) reports AVX instructions emitted by the Darwin JIT on CPUs that lack AVX. Proposed WebKit repair [`oven-sh/WebKit#292`](https://github.com/oven-sh/WebKit/pull/292) remains open and is not in Bun's pinned WebKit revision. This is **reported on canary** and inferred to affect the shared WebKit baseline; it was not reproduced against the final tag here.
- **Android:** the release itself calls the builds experimental.
- **Embedded Bun binaries:** `bun upgrade` updates the standalone runtime, not a Bun runtime embedded in a compiled downstream executable. The downstream tool must rebuild to pick up runtime fixes.

## Claims to cut or narrow

| Hype-shaped claim | Why it fails | Defensible replacement |
|---|---|---|
| “One million AI-written lines, zero regressions.” | Bun says the port introduced 19 known regressions before release; stable reports found more. | “A million-line port reached release through a language-independent suite, adversarial review, and months of field use.” |
| “Rust made Bun memory-safe.” | `unsafe`, FFI, JavaScriptCore, C/C++ libraries, protocols, and logic remain. | “Rust moves more lifetime and cleanup mistakes into compiler feedback.” |
| “Bun is now 97% Node-compatible.” | The 97% figure applies to selected modules; other important modules have much lower counts. | “Bun added 1,517 upstream Node tests, with selected core modules at 97–100%.” |
| “Bun 1.4 is a drop-in Node replacement.” | Native ABI changes, incomplete modules, and stable async/protocol regressions require workload testing. | “Bun 1.4 is a credible migration candidate for workloads that pass a cross-platform shadow gate.” |
| “Fifteen dependencies became zero.” | Browser, OS scheduler, codecs, linked native libraries, runtime version, and Bun-only APIs remain. | “Fifteen common dependency paths now have built-in Bun alternatives.” |
| “`Bun.WebView` has no browser dependency.” | macOS uses system WebKit; other paths need an installed Chrome-family browser. | “`Bun.WebView` removes the npm automation package for its supported path.” |
| “Security is solved by fewer npm packages.” | Risk moves into a larger binary and its release process. Audit also sends dependency inventory to registries when invoked. | “Bun reduces some package-install and native-build surface while taking more responsibility into the runtime.” |
| “All port regressions were fixed.” | This was accurate only for the known list at the rewrite post's cutoff. | “Bun fixed the 19 port regressions known before that post; release-day reports found additional cases.” |

## Live issue and pull-request state at cutoff

| Item | State on 2026-08-26 | Release relation | Evidence use |
|---|---|---|---|
| [`oven-sh/bun#39787`](https://github.com/oven-sh/bun/issues/39787) | **Open** | Reported against `1.4.0+34cbb9a40` on Windows x64 | Reported deterministic rejected-read/event-loop regression |
| [`oven-sh/bun#39793`](https://github.com/oven-sh/bun/pull/39793) | **Open**, mergeable, not draft, not merged | Repair branch based after the tag | Proposed cause, fix, and regression test for #39787 |
| [`oven-sh/bun#39766`](https://github.com/oven-sh/bun/issues/39766) | **Closed completed** 2026-08-22 | Reported against stable 1.4.0 | First-hand production `ws` regression |
| [`oven-sh/bun#39642`](https://github.com/oven-sh/bun/pull/39642) | **Merged** 2026-08-22 | Merge commit `64092d4c607b622b227fff1be40437d570b75527`, after `bun-v1.4.0` | Merged repair, not shipped in 1.4.0 |
| [`oven-sh/bun#39796`](https://github.com/oven-sh/bun/issues/39796) | **Open** | Reported against stable 1.4.0 and canary | Reported HTTP/2/gRPC stall under `bun test` |
| [`oven-sh/bun#39873`](https://github.com/oven-sh/bun/pull/39873) | **Open**, mergeable, not draft, not merged | Repair branch after the tag | Proposed root cause, fix, smaller test, and named residual limit |
| [`oven-sh/bun#39987`](https://github.com/oven-sh/bun/issues/39987) | **Open** | Stable 1.4.0; follow-up to an older issue | Reported large-suite parallel-worker deadlock; not a new 1.4 regression |
| [`oven-sh/bun#34215`](https://github.com/oven-sh/bun/issues/34215) | **Open** | Canary/pre-release Darwin x64 baseline report | Reported pre-AVX JIT crash boundary |
| [`oven-sh/WebKit#292`](https://github.com/oven-sh/WebKit/pull/292) | **Open**, not merged | Not in Bun's pinned WebKit `0f966e81...` | Proposed AVX runtime-detection fix |
| [`oven-sh/bun#28792`](https://github.com/oven-sh/bun/issues/28792) | **Closed completed** 2026-08-20 | Maintainer breaking-change ledger for 1.4 | Shipped migration boundaries; use the release upgrade guide in reader copy |

## Adoption verdict

**Try now:** use 1.4 in greenfield Bun-native projects, local tooling, package-manager/lockfile evaluation, `bun audit fix --dry-run`, profiling, and a shadow or canary runtime lane. Teams with ordinary HTTP services can proceed when their application, dependency, native-addon, observability, and platform matrices pass. Pin the exact Bun version in CI and deployments.

**Wait or gate tightly:** do not make an untested in-place runtime cutover for services built around long-lived HTTP/2/gRPC, delayed WebSocket authentication, Windows CLIs that rely on rejected `Bun.file` reads, large `bun test --parallel` suites without a watchdog, V8/NAN/direct native addons without Bun/ABI-147 prebuilds, or pre-AVX Darwin x64 hosts. Sensitive browser automation should force a fresh Chrome process/profile.

This is a **try-now as a measured migration, wait on blind replacement** verdict. The release is unusually strong evidence that Bun can execute a huge internal change without abandoning product work. It is not yet longitudinal evidence that the change reduced production regressions.

## Two results that would change the verdict

1. **A patched cross-platform regression gate passes.** On a tagged 1.4.x build containing the #39787 and #39873 repairs plus the merged #39642 repair, run the public repros on Windows x64, Linux x64, and macOS arm64. Pass mark: 100/100 completions for the deterministic `Bun.file`, delayed-`ws`, and HTTP/2 cases; then 100 randomized runs of a large `bun test --parallel` suite with no no-output watchdog trigger. Passing moves affected teams from “wait” to “canary.” Any silent exit, protocol stall, or worker hang keeps the bound.
2. **The target service wins its own shadow test.** Run the same commit, lockfile, traffic corpus, native addons, environment, and acceptance checks under current Node and pinned Bun for seven days or an agreed request volume. Pass mark: zero Bun-only correctness failures or hangs; full traces/profiles available; and a predeclared CPU/RSS/startup improvement large enough to pay for the migration. Passing supports runtime adoption for that service only. It does not generalize to every Node workload.

## Source ledger and why each source matters

- [Bun 1.4 release notes](https://bun.com/blog/bun-v1.4) — proves what maintainers shipped, the exact compatibility counts, benchmarks, security changes, platform claims, built-ins, and upgrade boundaries. It does not prove downstream compatibility by itself.
- [Rewriting Bun in Rust](https://bun.com/blog/bun-in-rust) — states the rewrite's stability theory, process, scale, test gates, known regressions, `unsafe` share, and claimed results. It is maintainer evidence, not an independent field study.
- [Bun 1.4.0 tag](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.0) and [baseline tree](https://github.com/oven-sh/bun/tree/34cbb9a40b4bd1bd767d134a7065e66c2432a676) — fix the shipped cutoff so later repairs are not laundered into 1.4.0.
- [Node-API documentation](https://nodejs.org/api/n-api.html#implications-of-abi-stability) — defines which native-addon interfaces carry ABI stability across Node versions and which do not.
- [Bun's published security-advisory page](https://github.com/oven-sh/bun/security/advisories) — checked for public advisories on 2026-08-26; the API returned an empty list, which bounds what can be said about undisclosed security fixes.
- The live issues and PRs in the state ledger — first-hand reports and repair evidence. Each is attributed. None is presented as independently reproduced in this pass.

## Hand-off to article synthesis

Lead with the migration-checkpoint thesis, not the spectacle of the rewrite. The rewrite is the mechanism and the proof burden. Use one compatibility counterexample and one privacy/operational boundary in reader copy; keep the rest in the source drawer. The most honest close is the bounded adoption verdict above.
