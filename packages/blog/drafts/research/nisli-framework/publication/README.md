# Publication comparison: Nisli 0.57.0, Lit, and Solid 2

Checked October 20, 2026 Pacific; captures are October 21 UTC. This refresh
preserves the [original 0.56.0 comparison](../repro/README.md) and the separate
[historical optimization branch](../release/README.md). The three result sets
are not pooled. No OpenClaw surface was ported.

## Package and fixture identity

Nisli 0.57.0 was verified as the public npm version and downloaded as an npm
tarball. The [package audit](package-audit.json) records its SHA-256, bundler
entry, and release commit `1d055cabdffbea8ff8d82cbfd88a6081882ca8b2`.
This compares the actual published `dist/bundler/index.js`, with standard
production configuration. The 0.57.0 release removes optional development
diagnostic work and payload; it does not contain the experimental binding cache
or Promise scheduler. Source inspection confirms the released scheduler still
uses queueMicrotask and templates retain recursive binding discovery.

The [adapter](common.mjs) copies the original fixture sources unchanged except
for metadata in its runner: Nisli version/commit and package-identity fields.
It checks the expected original metadata before adapting it. The original
harness SHA-256 is included in each result. The actual Lit and Solid adapters,
workload, seven rounds, one warmup, rotating order, six microtask turns per
write, correctness checks, and behavior probes are unchanged.

Dependencies and their lock are those of the [original reproduction](../repro/README.md):
Lit 3.3.3, signals 0.3.0, Task 1.0.3, coherent Solid 2.0.0-rc.14 family,
Vite 8.3.2, Solid Vite plugin 3.0.0-next.49. Solid's RC is the migration-plan
version, not a claim about the latest prerelease. Node 24.14.1 builds the fixture
and performs gzip compression. Research dependencies stay outside the blog graph.

## Reproduce

Set up an isolated dependency runtime using `../repro/package.json` and its lock,
as documented there. Download and safely extract `@nisli/core@0.57.0` into a
separate directory. `NISLI_ARTIFACT_ROOT` identifies its extracted `package/`
directory containing `package.json` and `dist/`.

```sh
export NISLI_BENCH_RUNTIME=/absolute/path/to/temporary/dependency-runtime
export NISLI_ARTIFACT_ROOT=/absolute/path/to/extracted/package
node size.mjs
node run.mjs
```

Open local port 48177 and press **Run comparison**. The server saves
`publication-browser-results.json` in the dependency runtime. `--build-only`
builds without starting a server; `NISLI_BENCH_PORT` selects another port.
It also serves the built counters at `/counter/{lit,lit-signals,solid,nisli}/`.

## Measurements and behavior

One Chrome 155 page load on the same macOS 27.0.1 arm64 host, reported hardware
concurrency 10, viewport 1280 × 720 at DPR 2; document visible. No throttling,
forced GC, input, layout, or paint measurement. One warmup and seven measured
samples per variant, rotating order. Every one of the 10,000 writes changes the
first cell, receives six shared microtask turns, and verifies its DOM text and
output-host identity. The fixed panel has 1,000 rows. These are warm mounts and
synthetic DOM throughput, not cold startup, FPS, or a whole-application result.

All samples, including outliers, remain in [browser-results.json](browser-results.json).

| Variant | Median mount ms | Median 10,000-write loop ms |
|---|---:|---:|
| Lit, one component | 3.8 | 355.6 |
| Lit, pinpoint signals | 4.8 | 29.3 |
| Lit, component per row | 6.4 | 3.9 |
| Solid 2, compiled | 3.6 | 6.0 |
| Nisli 0.57.0 | 8.6 | 6.2 |

The instrumented pass again observes 10,000 row evaluations for broad Lit versus
ten for narrow Lit, Solid, and Nisli. Lit watch reads are uninstrumented. All
variants produce ten mutation records. Broad reevaluation is not broad DOM
replacement. Wrappers and ownership structures intentionally differ.

All saved behavior probes pass: obsolete results are suppressed, Nisli/Task
abort superseded requests, Nisli aborts on owning-component removal, native and
forced-fallback moves preserve scope but differ on focus, hidden panes keep
working, real removal disposes, and independent Nisli resources versus Solid's
held settled view reproduce their distinct intermediate states. These are the
defaults selected by this fixture, not unavailable capabilities in alternatives.

The interaction click initially outlasted the browser tool's command timeout
because the original microtask workload does not yield between timed cases.
The next state read showed completion and the server had saved the full result.
No retry or duplicate benchmark was run, and no samples were discarded.

## Bundle size

[Size results](size-results.json) use four independent builds of the same small
counter application, one framework per build. Sum emitted JS bytes and gzip
each emitted JS file with Node defaults. Excludes HTML, tooling, maps, transfer
headers, and server compression variation. This is an application artifact,
not an npm tarball or invariant framework size.

| Program | Minified JS bytes | Gzip bytes |
|---|---:|---:|
| Lit | 15,505 | 5,939 |
| Lit signals | 27,899 | 9,693 |
| Solid 2 | 29,248 | 11,516 |
| Nisli 0.57.0 | 18,890 | 6,295 |

The Nisli button was clicked in the actual browser: Count: 0 → Count: 1.
All three other emitted counter bundles were compared byte for byte with the
previously clicked builds and match exactly. The counter lives only in the
fixture entry; it is not injected into Nisli's published runtime.

The earlier 0.56.0 counter measured 8,237 gzip bytes. Its reduction to 6,295
belongs to the separate released production-artifact work. The experimental
branch's +455-byte result belongs to its 0.56.0 baseline; it cannot be added
to the 0.57.0 result as a prediction for a combined build.

## Publication status

Publication was authorized October 21, 2026. The authoritative article is now
[in posts/](../../../../posts/029-openclaw-chose-solid-why-id-choose-nisli.md).
The [release handoff](../03-review-and-handoff.md) records Git delivery, deployment,
and current public acceptance separately. No prompt file or prompt route is
included, following Goga's explicit direction.
A short AI-assistance disclosure and inspectable methods remain in the article.
No research-token footprint is published.

The later queue-only main integration is recorded in the
[core delivery receipt](../03-review-and-handoff.md#core-optimization-preservation-and-integration).
It is Unreleased and is not part of the npm 0.57.0 artifact measured here.
The binding-cache/Promise experiment remains separate.
