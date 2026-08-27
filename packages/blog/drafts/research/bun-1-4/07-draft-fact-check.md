# Bun 1.4 draft fact-check and red-team

Research artifact for `TASK-0095` / `FLDR-0006`. This reviews the complete TypeScript draft and rendered preamble. It does not edit the article.

## Audit record

- **Article:** `packages/blog/posts/021-oss-radar-05-bun-1-4.ts`
- **Preamble implementation:** `packages/blog/src/components/bun-fusion-hero/bun-fusion-hero.ts`
- **Governing form:** OSS Radar single-project deep dive
- **Checked:** `2026-08-27T00:34:22Z` (`2026-08-26T17:34:22-07:00`)
- **Bun release:** `bun-v1.4.0`, published `2026-08-20T14:07:21Z`
- **Pinned Bun baseline:** [`34cbb9a40b4bd1bd767d134a7065e66c2432a676`](https://github.com/oven-sh/bun/commit/34cbb9a40b4bd1bd767d134a7065e66c2432a676)
- **Official macOS arm64 artifact digest:** `sha256:c669e97f6164e1c96e0701748db98dfa77492908cbd8394c7557134a735de381`
- **Article links checked:** all twelve external targets returned HTTP `200`
- **Verification:** `pnpm -C packages/blog typecheck`, `pnpm -C packages/blog build`, and `git diff --check` passed
- **Local release-binary repro:** rerun during this pass; the PTY marker arrived, exit code was `0`, the raw Markdown `onerror` attribute survived, and `Bun.revision` returned the full pinned SHA

Evidence states in this review:

- **Code-inspected:** implementation, types, docs, or tests read at the pinned SHA.
- **Reproduced:** behavior rerun against the checksum-matched official `1.4.0` binary.
- **Reported:** a maintainer, operator, or issue reporter states the result; it was not rerun here.
- **Proposed:** an open pull request describes code that is not in the pinned release.
- **Inference:** the article's conclusion from the evidence, not a project claim.

## Publication decision

**Hold for factual and provenance corrections.** The central thesis survives review: Bun's built-ins move selected package jobs and their maintenance boundary into Bun, and the Rust cutover is the real `1.4.0` tag-level change. The measured-migration verdict also survives.

The draft is not releasable as written because it contains one unsupported quotation, one incorrect ownership claim in the Terminal trace, several uncited adoption warnings, and no measured public research footprint. The source drawer also needs two primary-source additions and one pinned-doc replacement.

## Required corrections

### 1. Remove the unsupported “biggest release yet” quotation

Article lines 71–72 say:

> Bun's release page calls 1.4 “the biggest release yet”

The [official release page](https://bun.com/blog/bun-v1.4) does not contain that phrase. It says the release made Bun's “biggest jump in Node.js compatibility since Bun 1.0,” which is a different claim. Direct inspection of the live HTML and primary page search found no “biggest release” or “biggest release yet” string.

**Required treatment:** delete the quotation. The chronology point stands without it: the page says it covers everything shipped since `1.3.0`, while version chips distinguish when feature work first appeared.

### 2. Correct the Terminal ownership direction

Article lines 112–114 and source-card lines 326–329 say the `Bun.Terminal` native object stores or owns a child-process/process reference. It does not.

At the pinned tag, [`Terminal`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/api/bun/Terminal.rs#L111-L174) stores the master/read/write/slave descriptors, Windows `HPCON`, dimensions, event-loop handle, global reference, reader, writer, JS reference, and state. In the other direction, [`Subprocess`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/src/runtime/api/bun/subprocess.rs#L121-L139) stores `terminal: Cell<Option<NonNull<Terminal>>>`. The subprocess calls back into the attached terminal on process exit.

**Required treatment:** say the runtime coordinates both objects and the subprocess retains the terminal pointer. Do not say the Terminal object stores a child-process reference. Update the source-card claim and cite both pinned files if the ownership relation remains material.

### 3. Source or cut the adoption warnings introduced only in the verdict

The “wait or dual-run” panel at lines 288–290 names HTTP/2, Windows file workflows, large parallel test suites, and direct native addons. The first three come from live first-hand issue reports that never appear in the article body or `Sources`; the native-addon warning needs Bun's Node-ABI upgrade note plus Node's ABI contract. As written, the decision imports conclusions from private working notes without publishing their evidence state.

If kept, publish them as bounded, time-stamped evidence:

- [`oven-sh/bun#39787`](https://github.com/oven-sh/bun/issues/39787) is **open** and reports the Windows rejected-`Bun.file()` completion problem; repair [`#39793`](https://github.com/oven-sh/bun/pull/39793) is **open, mergeable, blocked, not merged**. This is **Reported** plus **Proposed**, not reproduced.
- [`oven-sh/bun#39796`](https://github.com/oven-sh/bun/issues/39796) is **open** and reports an HTTP/2/gRPC stall under `bun test`; repair [`#39873`](https://github.com/oven-sh/bun/pull/39873) is **open, mergeable, blocked, not merged**. This is **Reported** plus **Proposed**.
- [`oven-sh/bun#39987`](https://github.com/oven-sh/bun/issues/39987) is **open** and reports a persistent large-suite `bun test --parallel` deadlock. It is **Reported**, lacks a minimal reproduction, and is not evidence that `1.4.0` introduced the problem.
- Bun `1.4.0` pins Node `26.3.0` / ABI `147` in [`nodejs-headers.ts`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/scripts/build/deps/nodejs-headers.ts#L12-L23). [Node's Node-API documentation](https://nodejs.org/api/n-api.html#implications-of-abi-stability) makes the relevant boundary explicit: Node-API is ABI-stable; direct V8, libuv, and Node C++ bindings do not inherit that guarantee.

**Required treatment:** either add a short reported-state paragraph plus sources, or narrow the verdict to the WebSocket, WebView, host-observability, and workload-shadow boundaries already proved in reader copy.

### 4. Freeze and publish the measured research footprint

The user explicitly required clock time and token usage. The article `meta` has no `researchFootprint`, and the research directory has no frozen `research-footprint.json`. `00-worklist-index.md` records only the planning envelope—90–120 minutes and 250,000–400,000 tokens—which must not be published as measured usage.

The public provenance set is also incomplete at this cutoff:

- the index promises `04-preamble-animation-design.md`, but that file is absent;
- `TASK-0094` and `TASK-0096` still show `open`, although the component and `08-visual-verification.md` exist;
- the directory currently contains seven Markdown artifacts (`00`, `01`, `02`, `03`, `05`, `06`, `08`) before this review, and none exists in `HEAD` yet;
- `05-local-reproduction.md` records the command and results but not the 956-byte reproduction script, which still exists only under `/tmp` at this cutoff.

Under the repository's footprint rule, Markdown-present and `HEAD` counts must match before totals enter frontmatter. Freeze usage only after the corrections, missing artifact, final visual pass, and committed artifact set are complete. For this OSS Radar issue, keep `promptCount: 0` and point `provenanceUrl` at the committed public research directory.

## Source corrections

### Marked claim is true but unsourced

Article line 233 says Marked also does not sanitize output. This is correct: Marked's primary README carries an explicit warning. The draft has no Marked source card, however. Add a pinned primary link, for example [`markedjs/marked@53cb13f…`](https://github.com/markedjs/marked/blob/53cb13f13fc13d433269248c5caa255ffa1361ee/README.md), or cut the comparison and keep the locally reproduced Bun boundary.

### Pin the WebView documentation to the Bun baseline

The WebView claim is correct and current: the API is experimental, macOS uses system `WKWebView`, and Linux/Windows use an installed Chrome-family browser. The source card points to mutable live docs. Replace it with the [pinned `webview.mdx`](https://github.com/oven-sh/bun/blob/34cbb9a40b4bd1bd767d134a7065e66c2432a676/docs/runtime/webview.mdx) or pinned public types so the statement remains tied to `1.4.0`.

If the draft keeps “profile isolation” in line 241, the pinned docs expose a decision-relevant detail worth stating precisely: the Chrome backend checks `DevToolsActivePort` by default and can attach to an existing remotely debuggable browser; `backend: { type: "chrome", url: false }` forces a fresh spawned process. Do not imply that every Chrome configuration starts isolated.

### Link the WebSocket repair directly

The issue source proves the report and resulting timeout. The claim that the repair merged after the tag should also link [`PR #39642`](https://github.com/oven-sh/bun/pull/39642), which merged at `2026-08-22T07:21:19Z` as `64092d4c607b622b227fff1be40437d570b75527`. Its merge occurred after the `1.4.0` tag and is not in the pinned binary.

### Do not call the buyer's announcement independent corroboration

The last source rationale says Anthropic's announcement “independently corroborates” the acquisition. Anthropic is the acquiring party and current owner, so this is second first-party/counterparty confirmation, not independent evidence. The article body correctly treats Claude Code evidence as correlated; the rationale should use the same epistemic standard.

### Link the local reproduction record

The binary identity and rerun are sound, but the article's source drawer links only the GitHub release. Once the research directory is committed, link `05-local-reproduction.md` beside the first-person PTY/Markdown claim. Preserve the exact script in that artifact or as a separate committed file so another reader can rerun the stated input instead of trusting an ephemeral `/tmp` path.

## Claim-by-claim audit

| Draft claim | Result | Evidence state and boundary |
|---|---|---|
| `1.4.0` shipped August 20 at `34cbb9a40…` | **Pass** | GitHub release API reports `published_at=2026-08-20T14:07:21Z` and the full target SHA. |
| `1.4.0` is the first stable Rust release; `1.3.14` was the last Zig release | **Pass** | Maintainer-stated and code-inspected at the tag. |
| The release presents fifteen package jobs as built-ins | **Pass, with stated-product boundary** | The official page lists all fifteen mappings. It does not prove package API parity. The preamble reproduces the mappings correctly. |
| The release page calls it “the biggest release yet” | **Fail** | No such phrase appears on the page. |
| The page is a roundup since `1.3.0` | **Pass** | The page says this directly. |
| Every section carries its original version | **Narrow** | Feature headings use version chips, often more than one. Say the post labels feature work by version; do not make a universal section claim. |
| `Bun.Image` first shipped in `1.3.14` | **Pass** | Release section is labeled `v1.3.14`; local comparison also found the sampled path in `1.3.14`. |
| `Bun.Terminal` dates to `1.3.5` and has `1.4.0` work | **Pass** | Release section has both chips. |
| `Bun.WebView` spans `1.3.12` and `1.4.0` | **Pass** | Release section has both chips. |
| `+1,517` Node test-suite cases were “added since 1.3” | **Narrow** | The release calls these tests added from Node's suite to run on each commit and the chart calls them newly passing. “+1,517 newly passing vendored Node tests, Bun 1.3 → 1.4” is the least ambiguous label. |
| The five package-job boundary rows | **Pass** | Pinned code/docs and release notes support the remaining codecs, browsers, sanitization, PTY/ConPTY, and scheduler boundaries. |
| Terminal stores PTY I/O/event-loop state and Windows `HPCON` | **Pass** | Code-inspected. |
| Terminal stores a child-process reference | **Fail** | Ownership points the other way: `Subprocess` stores the terminal pointer. |
| The macOS-arm64 PTY and Markdown checks passed on official `1.4.0` | **Pass** | Reproduced again during this audit with full SHA, marker, exit `0`, and preserved handler attribute. This proves only those inputs on one platform. |
| Bun still embeds JavaScriptCore, uSockets/uWebSockets, BoringSSL, SQLite, codecs, browsers, and OS services | **Pass** | Maintainer-stated plus code-inspected; “one binary” is not “one implementation.” |
| Bun's scope drove recurring cleanup/lifetime failures | **Pass as attributed maintainer theory** | The Rust post names use-after-free, double-free, and forgotten-cleanup failures and connects them to scope/stability. |
| The team mechanically ported `535,496` Zig lines with Claude Code | **Pass as reported** | The number excludes comments; it measures the old Zig source, not independently audited semantic parity. |
| Roughly four percent of Rust was `unsafe` | **Pass as time-bound maintainer report** | The post says ~27,000 of ~780,000 Rust lines at its cutoff. It is not a current live measurement. |
| Six platform lanes and the full suite were green before merge | **Pass as maintainer-reported** | The post identifies six lanes and says 100% passed before merge. The article correctly does not call this independent compatibility proof. |
| Bun/Claude Code CPU and memory results | **Pass as reported** | Maintainer-run workloads only; the table preserves that boundary. |
| Prisma Compute's S3-memory and post-resume SQL-pool tests improved on the Rust canary | **Pass as independent first-hand report** | Prisma gives versions, conditions, outcomes, and an explicit non-generalization. |
| `1,517` more Node tests and selected modules at `>=97%` | **Pass as reported** | Selected module rates only; the article does not convert them into an overall compatibility percentage. |
| Delayed-auth `ws.handleUpgrade()` could time out in `1.4.0`; repair merged after the tag | **Pass** | Reported issue plus merged-after-tag repair. The article correctly says the repair is absent from `1.4.0`. |
| `Bun.markdown.html()` preserved a raw `onerror` attribute | **Pass** | Reproduced against the official binary; release docs warn that handler attributes pass through. |
| Marked also does not sanitize | **Pass, source missing** | Correct at the pinned Marked README; add it or cut the comparison. |
| WebView uses system WebKit or an installed Chrome-family browser and is experimental | **Pass** | Release and pinned docs agree. Current source target is mutable and should be pinned. |
| Anthropic acquired Bun in December 2025 | **Pass** | Bun announced December 2; Anthropic announced December 3. Month-level prose is exact. |
| Claude Code ships as a Bun executable and used the Rust port for months before stable | **Pass as owner-reported** | The first statement is in the acquisition post; the “months” statement is in the `1.4` release post. This is correlated owner workload, not independent adoption. |
| Vercel Bun Functions remains public beta with Node-relative operational gaps | **Pass at cutoff** | Current first-party Vercel docs still say Beta and list source-map, bytecode-cache, and `node:http`/`node:https` request-metric gaps. |
| Monthly downloads do not reveal runtime/production adoption | **Pass as an evidence limit** | Bun reports CLI downloads without unique-user, retained-use, or runtime-use breakdown. The draft wisely omits a numeric market-share claim. |
| Try pinned canaries; do not perform a blind Node replacement | **Pass** | This is the bounded inference the evidence supports. The seven-day/predeclared-volume gate makes the workload decision falsifiable. |

## Live issue and pull-request state at cutoff

| Item | Live state | Relation to `1.4.0` | Draft use |
|---|---|---|---|
| [`bun#39766`](https://github.com/oven-sh/bun/issues/39766) | **Closed, completed** `2026-08-22T07:21:20Z` | Reported against stable `1.4.0` | Published WebSocket counterexample |
| [`bun#39642`](https://github.com/oven-sh/bun/pull/39642) | **Merged** `2026-08-22T07:21:19Z` | Merge commit after the tag; not in `1.4.0` | Published repair state |
| [`bun#39787`](https://github.com/oven-sh/bun/issues/39787) | **Open** | Reported against `1.4.0` on Windows x64 | Verdict-only warning, currently uncited |
| [`bun#39793`](https://github.com/oven-sh/bun/pull/39793) | **Open**, mergeable, blocked, not draft | Proposed after the tag | Proposed repair for `#39787` |
| [`bun#39796`](https://github.com/oven-sh/bun/issues/39796) | **Open** | Reported against `1.4.0` and canary | Verdict-only warning, currently uncited |
| [`bun#39873`](https://github.com/oven-sh/bun/pull/39873) | **Open**, mergeable, blocked, not draft | Proposed after the tag | Proposed repair for `#39796` |
| [`bun#39987`](https://github.com/oven-sh/bun/issues/39987) | **Open** | Persistent on stable `1.4.0`; not reported as introduced there | Verdict-only warning, currently uncited |
| [`bun#34215`](https://github.com/oven-sh/bun/issues/34215) | **Open** | Old-Darwin/pre-AVX report | Correctly omitted from the nine-minute reader copy |
| [`oven-sh/WebKit#292`](https://github.com/oven-sh/WebKit/pull/292) | **Open**, mergeable, clean, not merged | Not in Bun's pinned WebKit | Correctly omitted from reader copy |
| [`bun#28792`](https://github.com/oven-sh/bun/issues/28792) | **Closed, completed** `2026-08-20T15:13:15Z` | Shipped breaking-change ledger | Correctly kept in working notes |

## Thesis and adoption verdict

The article's living center is intact: removing a package entry transfers responsibility rather than deleting it. The Terminal trace, Markdown reproduction, WebView platform dependency, Rust mechanism, Prisma report, and post-tag WebSocket repair all test the same claim. The piece stays a single-project deep dive and does not turn into a generic AI-rewrite argument.

The strongest falsifiable reader decision is also intact:

> Bun `1.4.0` is credible enough for a pinned, measured migration trial, but its release evidence is not a workload-level Node compatibility guarantee.

The migration gate at lines 222–224 can disprove that decision for a specific service: one Bun-only correctness failure, hang, diagnostic gap, or absent predeclared resource gain fails the trial. What the release still does **not** prove:

- package-interface parity for the fifteen mappings;
- overall “97% Node compatibility”;
- memory safety across `unsafe`, FFI, C/C++, engines, and protocols;
- lower longitudinal regression rates across future stable lines;
- independent multi-API production adoption at scale; or
- host parity with Node.

The final try/wait split is therefore sound after its evidence links are repaired. “Try now” stays bounded to pinning, rollback, OS testing, and measurable workloads. “Wait or dual-run” stays bounded to behavior and operations an adopter cannot independently verify.

## Discovery, source-rationale, and prose audit

- **Doorway:** the 45-character `seoTitle`, 146-character description, concrete H1, and standfirst describe the same review. No search-intent promise outruns the body.
- **First 100 words:** release, date, job, thesis, present limit, and decision all appear.
- **Internal link:** `/oss-radar-02-the-toolchain-is-the-moat` exists and is a meaningful boundary-companion link.
- **Read time:** the rendered title/body through the final decision is about 1,625–1,661 whitespace-delimited words depending on component-label counting; nine minutes at 200 words/minute is correct.
- **Source targets:** every current URL resolves, both Bun code links use the correct SHA, and every source item has a concrete `why` sentence.
- **Source mismatch:** the `Bun.Image` source card includes work-pool/SIMD detail that the reader copy barely uses. Either make the table carry that exact boundary or remove the unused detail from the source claim.
- **Heading precision:** “Security work moved too” is looser than the section's result. The section shows that the **security boundary** or **security obligation** moves; Bun does not absorb Markdown sanitization.
- **Reversal cadence:** the prose uses the “not X / it is Y” construction far more than the house limit. It appears in the introduction, dependency section, Terminal section, compatibility section, Anthropic section, and conclusion. Keep the one or two load-bearing reversals and recast the rest during the final polish pass.
- **Metaphor load:** “engineering bill,” “engine room,” and “building above it” add a second metaphor system beside the dependency-transfer thesis. The final engine-room sentence is the easiest cut because the next sentence already gives the bounded decision in literal terms.

## Verified preamble claims

The preamble's fifteen mappings match the release animation exactly. Its accessible label correctly separates two planes: package-job mappings converge into the Bun binary, while the internal source changes from Zig to Rust. The line “more lifetime checks at compile time” is defensible and does not claim whole-runtime memory safety.

One label should be narrowed: `fifteen named job mappings · one runtime-owned surface` can sound as if Bun exposes one API surface, when the visual lists many Bun APIs. `one runtime-owned boundary` or `one runtime release boundary` would preserve the thesis without collapsing the interfaces.

## Release checklist

- [ ] Delete the nonexistent “biggest release yet” quotation.
- [ ] Correct Terminal/Subprocess reference ownership in prose and Sources.
- [ ] Source or remove the verdict-only HTTP/2, Windows, parallel-test, and native-addon warnings.
- [ ] Add the direct WebSocket repair PR.
- [ ] Add a pinned Marked source or remove the Marked comparison.
- [ ] Replace mutable WebView docs with the pinned release-baseline doc/types.
- [ ] Change Anthropic's source rationale from “independently corroborates” to counterparty/owner confirmation.
- [ ] Preserve the exact local reproduction script in the public artifact set.
- [ ] Add the missing preamble-design artifact and reconcile open worklist task states.
- [ ] Freeze the recursive research footprint after all artifacts exist in `HEAD`, then copy measured totals into article metadata.
- [ ] Re-run typecheck, build, link check, rendered word count, visual/Markdown inspection, and `git diff --check` after corrections.

No article, component, or other research file was modified during this review.
