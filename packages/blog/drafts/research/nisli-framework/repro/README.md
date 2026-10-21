# Nisli / Lit / Solid article reproduction

Captured October 20, 2026 Pacific / October 21 UTC. The sources here are a research fixture outside the site's production pipeline. They deliberately include Solid TSX to test its real compiler; they do not introduce JSX or another runtime into the publication.

## What ran

- Nisli core 0.56.0, source at public commit `4afde49c728a330e10ce887a38b8013d63b58498`.
- Lit 3.3.3; `@lit-labs/signals` 0.3.0; `@lit/task` 1.0.3.
- `solid-js`, `@solidjs/web`, `@solidjs/signals`, compiler and Babel plugin 2.0.0-rc.14, the family identified in OpenClaw's plan. Vite plugin 3.0.0-next.49. Explicit overrides prevent prerelease ranges resolving rc.16.
- Vite 8.3.2 production builds, target `es2024`, minification enabled, development checks disabled through the normal production environment.
- Node 24.14.1 for builds and gzip. Strict TypeScript check included ES2024, DOM, DOM.Iterable, and ESNext.Disposable; no type assertions beyond `as const` were introduced in the fixture.
- Actual browser: Chrome 155.0.0.0, visible document in Codex's in-app browser, viewport 1280 × 720, device pixel ratio 2, reported hardware concurrency 10. Host: arm64, macOS 27.0.1. The browser user-agent's Intel/10_15_7 tokens are compatibility tokens, not the measured host architecture/OS.

No CPU throttling or garbage-collection control was applied. This is one local machine/browser/session. No other browser engine was tested. Browser interactions used the supported in-app browser tools; the page's own fixture code executed the workloads and POSTed synthetic results to its localhost server.

## Reproduce

Use a separate Nisli checkout at the pinned commit, and an unused temporary directory. Do not build into either application's development `dist/`.

```sh
export NISLI_SOURCE_ROOT=/absolute/path/to/pinned/nisli
export NISLI_BENCH_RUNTIME=/absolute/path/to/new/temporary/runtime
mkdir -p "$NISLI_BENCH_RUNTIME"
cp package.json package-lock.json "$NISLI_BENCH_RUNTIME/"
npm ci --prefix "$NISLI_BENCH_RUNTIME" --ignore-scripts --no-audit --no-fund
node run.mjs
```

Open `http://127.0.0.1:48173` in a real browser and press **Run comparison**. The server writes `browser-results.json` in the temporary runtime directory. `NISLI_BENCH_PORT` selects a different unused port. Stop only the server started for this fixture when done.

`node run.mjs --build-only` rebuilds the temporary output without starting a second server. Runtime dependencies stay in the temporary directory, not this repository's package graph.

## Timing method

Five implementations mount a fixed 1,000-row panel. Each row contains a static label and a numeric output. One value changes 10,000 times, with six identical microtask turns and a DOM-text correctness check after **every** write. The same output element must survive. No forced `flush()` API is used to advantage one framework.

Comparators:

1. A single Lit component explicitly requests an update after an external mutable array cell changes. Its render maps the row templates again.
2. A single Lit component binds individual TC39-polyfill signals through `watch()`.
3. One Lit component per row receives a reactive property write directly. It adds 1,000 custom-element boundaries and avoids broad render work.
4. Solid creates one signal per row; its actual JSX compiler generates bindings.
5. Nisli creates one signal per row and binds it in a single component's tagged template.

These are intentional architecture choices, not equivalent internal representations. They have equivalent visible fixed-panel content, but different DOM wrappers and ownership/binding machinery. No membership changes or list reconciliation are timed. The Lit-wide case is a broad boundary, not a claim about optimally structured Lit applications.

Each variant has one unreported warmup before seven measured samples. Trial order rotates. Parsed template caches and module initialization are warm; mounting is not a cold-page-load test. Read counters are disabled during timing. No timer baseline was subtracted. Timings include framework work, shared await/check overhead, and any garbage collection. They exclude network/module loading, paint, forced layout, human input latency, Markdown parsing, and application services.

The 10,000 updates run within microtasks without waiting for rendering frames. These are **DOM-update throughput** measurements, not FPS or user-visible latency. The first exploratory run used 1,000 updates and exposed sub-millisecond totals; the reported run increased to 10,000 and added a check after every update. The exploratory output stayed temporary and is not mixed into reported samples.

Raw reported samples: [browser-results.json](browser-results.json). Medians rounded to 0.1 ms in the article:

| Variant | Mount ms | Update-loop ms |
|---|---:|---:|
| Lit, one component | 3.8 | 350.8 |
| Lit, pinpoint signals | 4.8 | 28.1 |
| Lit, component per row | 7.0 | 3.2 |
| Solid 2 | 3.9 | 6.2 |
| Nisli | 9.1 | 5.6 |

Small differences near the shared harness floor do not establish application-level rankings. Nisli's slower mount and narrowly scoped Lit's faster update loop are retained counterevidence.

## Separate instrumentation and behavior checks

- Ten changes to one cell in 1,000 rows produced 10,000 instrumented row-value evaluations in Lit-wide; narrow Lit, Solid, and Nisli each produced ten. Reads inside `watch()` were not instrumented. The `expressionReads` field is null there; its internal dummy write counter is not reported as reads. All variants produced ten MutationObserver records. A setupCount of zero in Lit-wide means that counter was not instrumented, not that no component was constructed.
- Deferred request A was superseded by B. B resolved first; A ignored cancellation and resolved afterward. Lit Task, Nisli resource, and Solid async memo all preserved B.
- Lit Task and Nisli resource supplied an aborted signal for A. On removing a component with C still pending, Nisli aborted C. The bare Lit Task did not. Solid async memo's tested callback does not receive an AbortSignal; custom cancellation adapters remain possible.
- The Solid root disposer ran its cleanup once. This does not claim that removing arbitrary Solid-owned DOM automatically disposes the render root.
- A Nisli component moved with ordinary insertBefore retained its original setup scope and input node; focus was lost. Chrome's native moveBefore retained the scope, node, and focus. A forced fallback in Chrome is **not** evidence of Safari behavior. No undo, iframe, popover, or document Selection guarantee is tested.
- A hidden-but-mounted Nisli component continued to update. True removal ran one cleanup; subsequent signal writes did not run its effect. Cleanup counts are positive controls: a never-firing counter would fail the removal check.
- After an initial settled A view, two related B requests were started. With only fast B resolved, Nisli showed selection B / fast B / slow A. Solid 2 showed A / fast A / slow A, then switched after slow B resolved. The source selects default semantics rather than configuring each framework to imitate the other. This is a behavioral comparison, not a timing race.

Sources: [common checks](src/shared.ts), [Lit variants](src/lit.ts), [Nisli](src/nisli.ts), [Solid TSX](src/solid.tsx), [runner](src/app.ts).

## Counter bundle measurement

```sh
node size.mjs
```

This builds four independent production counter applications and sums the emitted JavaScript files. Gzip uses Node `gzipSync()` defaults per file. Excludes HTML, source maps, HTTP headers, server compression differences, tooling dependencies, and CSS. It measures these programs and import graphs, not an invariant full-framework size.

| Program | Minified JS bytes | Gzip bytes |
|---|---:|---:|
| Lit counter | 15,505 | 5,939 |
| Lit signals counter | 27,899 | 9,693 |
| Solid 2 counter | 29,248 | 11,516 |
| Nisli counter | 23,737 | 8,237 |

Results: [size-results.json](size-results.json). Exact sources: [Lit](src/size-lit.ts), [Lit signals](src/size-lit-signals.ts), [Solid](src/size-solid.tsx), [Nisli](src/size-nisli.ts).

The local server exposes the built counters under `/counter/lit/`, `/counter/lit-signals/`, `/counter/solid/`, and `/counter/nisli/`. After running `size.mjs`, all four were opened in the browser and their native button was clicked: the accessible button label changed from `Count: 0` to `Count: 1` in each production bundle. Module loading and actual event wiring were thus checked, not assumed from a successful build.

## What this cannot establish

No OpenClaw code was ported. The fixture does not establish migration effort, whole-workspace performance, comparative reliability, accessibility of the broader component libraries, async network cancellation by a server, memory retention over a long session, or which framework a different team should choose. The article's framework preference is a design judgment with these boundaries.
