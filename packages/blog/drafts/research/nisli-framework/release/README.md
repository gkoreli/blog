# Core 0.56.1 — pre-landing review

**Historical snapshot, superseded for release planning.** Core 0.57.0 has since
been published with separate production-diagnostic/artifact changes. The branch
below remains unmerged on its 0.56.0 base; 0.56.1 is its old preparation label,
not the next release proposal. The owner is still reviewing the Promise error
adapter and possible better designs. Local gates do not settle that decision.
Any future integration needs a current base, a fresh version decision, and new
measurements. The [publication comparison](../publication/README.md) measures
the actual 0.57.0 package without these experimental changes. Further design
review also noted that the template patch changes traversal and caching
together: a TreeWalker-only ablation has not run, so the separate contribution
of cached metadata is not quantified. That is a proposed experiment, not
accepted runtime work.

October 20, 2026 Pacific; captures continue October 21 UTC. **Prepared candidate;
not merged or published.** Goga asked to understand the changes and implications
before landing. This record supports that review; it does not claim a release,
deployment, or application performance result.

## What changes

1. **Remember binding locations.** Core 0.56.0 caches the browser-parsed template,
   then recursively rediscovers markers and scans every element's attributes on
   each clone. The candidate records element/comment indices on first parse.
   A native TreeWalker resolves the clone's targets before bindings can expand
   siblings. Existing binders still process the attributes on target elements;
   parsing, cloning, boundary comments, effects, and disposal remain runtime work.
2. **Use a reused settled Promise for scheduled flushes.** Both transports enqueue
   microtasks in the tested hosts. This changes the enqueue mechanism, not the
   intended batching boundary. Signal reads stay synchronous; `flush()` still
   drains synchronously. The ablations separate the transport from queue handling.
3. **Skip pointless queue allocation/sorting.** An empty queue returns; one
   pending effect is already ordered. Remove it before running it, so effects
   it schedules belong to a later pass. Two or more effects retain the copied,
   creation-ordered batch.

The reactive dependency graph, equality rules, resource/query policies, keyed
diffing, and component ownership are unchanged.

## Regressions found and repaired

The first optimization commit, `b463683357c07be6948b0ac5586377ec9fecad68`,
was **not safe to release**. New tests demonstrated failures; the same four
compatibility tests passed against the unmodified 0.56.0 production source.

| Reproducer | Prototype failure | Repair |
|---|---|---|
| Minimal DOM shim without global `Element`/`Comment` | `instanceof` throws | Node-type guards; no new constructor globals |
| Synchronous custom-element `_setProp` replaces descendants | Bindings target discarded nodes | Live discovery for literal custom elements and customized built-ins |
| Ref accessor replaces descendants when `.current` is assigned | Bindings target discarded nodes | Live discovery for dynamic-ref templates |
| No `document.createTreeWalker`, including an already-cached callsite | Method call throws | Live discovery when TreeWalker is absent |

The original prototype's root suite also caught a `NodeFilter` global assumption
in SSG. The numeric element/comment mask removed it. Templates with `html:inner`
already retained live discovery because that sink replaces descendants.

These are conservative whole-template fallbacks. Literal custom elements, `is`,
dynamic refs, and `html:inner` do not gain cached-location mounting. Typed factory
composition can still cache an eligible native parent shell; a child's own
template is assessed separately. The scheduling changes apply to both paths.

## Observable implications

- **No intended public API break.** The built candidate tarball has the same
  22 declaration files byte for byte as npm 0.56.0, identical exports and runtime
  dependencies, and all published targets present under `dist/`. This checks the
  package contract, not all possible application behavior. [Package audit](package-audit.json).
- **Exceptional failure timing changes.** Ordinary effect errors retain their
  existing containment. If an unexpected error escapes the scheduler, the
  Promise callback catches it and rethrows in `queueMicrotask`. This preserves
  uncaught-exception reporting instead of producing an unhandled rejection, but
  the report arrives one additional microtask later. Promise jobs may also look
  different to tracing or patched scheduling integrations; those integrations
  were not exhaustively tested.
- **More code and metadata.** The standalone counter grows from 8,237 to 8,692
  gzip bytes: **+455 bytes (+5.5%)**. That is this application's emitted JS,
  not a universal package size. The cache adds numeric location records per
  callsite, not values, signals, or per-mount nodes. Retained heap was not profiled.
- **First-use work remains.** Location discovery happens on the first parse.
  Fresh-callsite batches test this cost separately from warm repeated mounts;
  they are not a cold navigation or complete application startup measurement.
- **Behavioral confidence has bounds.** Ordering, cascades, disposal, rendering,
  SSG, and browser lifecycle checks support compatibility. They cannot prove
  every application or DOM shim is unaffected. No performance claim follows
  for a different browser engine or an OpenClaw application port.
- **An existing production-gate defect remains separate.** Another lane's
  [published-package reproduction](../../../../../../docs/worklist/blog-design-and-nisli-ssg/nisli-production-diagnostics-repro/README.md)
  documents ordinary esbuild builds retaining development diagnostics unless
  the gate is configured explicitly, plus retained audit payload even when
  silenced. This patch does not change that gate. These Vite builds supply
  `import.meta.env` production flags, visible in the emitted bundles, so that
  esbuild-specific gating failure is not the mode measured here. The counter
  size still includes retained diagnostic/audit code in both versions.

## Performance method

The [release harness](benchmark/run.mjs) preserves the original
[prototype harness](../optimization/run.mjs) unchanged. Baseline production
source is `4afde49c728a330e10ce887a38b8013d63b58498`, byte-identical under
`packages/core/src` to `core-v0.56.0`. Candidate source is fingerprinted in each
result. The scheduler-only, bare-Promise, and path-cache variants use the exact
historical [patches](../optimization/README.md).

Use the dependency runtime and lockfile from the [original reproduction](../repro/README.md).
Set `NISLI_BENCH_RUNTIME` and all five source roots named by `benchmark/run.mjs`.
Run it with Node 24.14.1, open its local port 48176, and click **Run paired comparison**.
The server saves raw JSON outside the repository. `--build-only` rebuilds without
starting another server. No dependency is added to the blog or core package graph.

Two fresh Chrome 155 page loads on the same macOS 27.0.1 arm64 host, 10 reported
logical CPUs; three warmups and fifteen measured rounds per load. Mount/update
cases rotate order. Warm mounts have 1,000 rows. Each of 10,000 async writes waits
the same six microtask turns and verifies the DOM. A framework-free control
measures that shared allowance. No layout, paint, input responsiveness, heap,
or OpenClaw workload is measured. Fresh-callsite batches create 300 distinct
frozen template identities per sample; template-result creation is outside
their timer, while parsing, mounting, and the common drain are inside it.

The grouped 100,000-write synchronous probes include enqueueing callbacks that
drain outside their timer; they are diagnostics, not isolated graph benchmarks.
Scheduler-only and bare-Promise ablations are experimental isolates, not release
alternatives with the candidate's complete compatibility hardening.

## Hardened-candidate results

All thirty samples per case are pooled; none are dropped. The original
five-framework benchmark and the first prototype's results remain separate.
[Run 1](results-run-1.json), [run 2](results-run-2.json),
[pooled summary](summary.json), [pooling script](benchmark/summarize.py).

| Case | Core 0.56.0 | Candidate 0.56.1 | Interpretation |
|---|---:|---:|---|
| Ordinary warm mount, 1,000 rows | 8.90 ms | 7.20 ms | 19% less elapsed time |
| Static-heavy warm mount | 39.10 ms | 30.30 ms | 23% less elapsed time |
| Binding-heavy warm mount | 16.40 ms | 14.20 ms | 13% less elapsed time |
| 10,000 verified async writes | 6.10 ms | 3.50 ms | 43% less elapsed time |
| Ref-containing warm mount | 8.60 ms | 8.65 ms | No material gain observed |
| Literal-custom-element warm mount | 10.90 ms | 10.70 ms | No consistent gain across the two runs |
| 300 fresh template identities | 2.80 ms | 2.60 ms | No first-use penalty observed in this shape |

The mount-shape table uses its dedicated phase probe. The separately timed
update fixture's mount medians are 9.20 → 7.30 ms; those are not substituted
into the mount-shape table. Narrow Lit in that paired fixture mounts at 6.45 ms
and updates at **2.70 ms**, still ahead of the candidate. The shared DOM/drain
control is 2.45 ms; subtracting it would not produce a reliable isolated
framework cost.

Queue-only updates measure 5.90 ms and bare-Promise updates 3.70 ms, versus
baseline 6.10 and hardened candidate 3.50. Pure scheduling controls measure
5.30 ms for queueMicrotask and 2.55 for a settled Promise. These ablations
support a transport cost in this engine, not a universal ordering or speed claim.
Ref/custom-element samples move in opposite directions between runs and should
not be sold as optimized. Fresh identities exercise cache misses on one small
shape after module initialization; they do not establish cold startup speed.

Both runs pass the saved behavior checks: stale-result suppression, abort on
supersession/removal, independent async publication, native/fallback moves,
hidden work versus true removal, table/SVG bindings, sibling expansion, mixed
attributes, classes, refs, event modifiers, disposal, and repeated mounts.
The updated counter result is saved [separately](size-results.json).

## Compatibility validation

- Final root `pnpm typecheck`, `pnpm test`, and `pnpm build` passed in the isolated
  candidate worktree: **2,349 workspace tests, including 476 core tests**. The
  baseline core suite had 465 tests; eleven regressions were added across both
  candidate commits. Existing SSG, UI, router, engine, ledger, and site tests passed.
- Four new compatibility cases passed against 0.56.0 production source. Three
  failed on the initial candidate before the first hardening repair; the missing
  TreeWalker case separately failed before its feature guard. All pass now.
- `pnpm --filter @nisli/www proof:movebefore` passed in Chromium, Firefox, and
  WebKit against final core source. Chromium/Firefox exercised native moves;
  WebKit exercised the existing fallback. Setup identity survived in all three.
  WebKit's fallback still loses focus, iframe continuity, animation, and popover
  state; this is not a claim of equal native platform capability.
- `pnpm --filter @nisli/www test:previews` passed **168/168** desktop/touch,
  hydration, responsive-fit, and route checks across the 76 UI previews and
  additional routes. Its production build contains the ref/custom-element and
  constructor repairs. It precedes the final missing-TreeWalker feature guard;
  that guard is covered by the final root suite/build and final-source move proof.
- The exact [candidate patch](candidate.patch) reconstructs all six source,
  test, manifest, and changelog files from the pinned baseline. The package
  audit checks the actual locally packed built artifact; no npm publish occurred.
- The release benchmark passes strict TypeScript checking. The article uses the
  blog's Markdown/Shiki renderer and stays outside publication discovery.

## Delivery boundary

The candidate includes a 0.56.1 version bump, unreleased changelog, regression
tests, and proposed ADR 0048 on `codex/core-rendering-performance`. It stays
isolated until Goga's pre-landing review. A subsequent authorized merge must
recheck the current main/version state, pass main CI, observe the auto-tag/npm
workflow, and verify the public package. Local gates and a packed tarball do
not establish any of those outcomes. The article remains an unpublished draft.

Prepared local commit: `f40a217c905caee243fb44e4e19a1f2627b93a60`, following
prototype `b463683357c07be6948b0ac5586377ec9fecad68`; worktree
`/private/tmp/nisli-core-rendering-performance`. The branch is clean and has not
been pushed. The exact core production fingerprint in both runs is
`66e0d9d68e42303ccf670d56b6193e169452544443dad63068b05f6db4eb2f66`.
