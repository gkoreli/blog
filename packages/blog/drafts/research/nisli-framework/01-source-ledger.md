# Source ledger

Checked October 20, 2026 Pacific / October 21 UTC. Public sources are linked; private tool/session captures are not committed.

| Source | Use | Boundary |
|---|---|---|
| [Peter Steinberger’s post](https://x.com/steipete/status/2112597162924351909) | Firsthand report: Lit-to-Solid 2 migration, approximate elapsed time/PR count, smaller assets and perceived responsiveness | An author report; no controlled latency comparison supplied in the post |
| [OpenClaw public timeline](https://team.openclaw.ai/chat/roboclaw/timeline-of-solid-js-to-lit-pr-refactors-5ba10f632c29434c9f79a92c3c16a7a3) | Reconstruction of migration and subsequent idiomatic Solid refactors; distinguishes 255 named migration PRs from 352 later UI refactors | AI-authored conversation; tools/results and embedded interactive content omitted from public view. Treat reported source counts as scoped textual scans, not calls or runtime work |
| [Migration issue #168114](https://github.com/openclaw/openclaw/issues/168114) | Explicit motivation: deleting hand-built reactivity; plain-TypeScript domain owners; retained/presented/retiring/disposed lifetimes; Solid package pins | Working plan with historical inventories and proposed phases, not proof each item shipped as written |
| [Web Awesome removal #173590](https://github.com/openclaw/openclaw/pull/173590) | Paired production-build startup CSS 45,321 → 38,844 gzip bytes; JS 348,013 → 348,031 bytes; removal of vendor CSS/patch/support | A narrow PR-reported measurement, not the full migration’s asset delta or renderer speedup |
| [Lit rendering](https://lit.dev/docs/components/rendering/) | Component render/template evaluation versus targeted DOM writes; batching | Do not describe Lit as rebuilding the DOM on each render |
| [Lit signals](https://lit.dev/docs/data/signals/) | SignalWatcher, watch(), pinpoint updates | Experimental Lit Labs integration; it is an available counterexample to a blanket claim that Lit cannot update bindings individually |
| [Lit Task](https://lit.dev/docs/data/task/) | Task arguments, latest-invocation race protection, AbortSignal, host lifecycle integration | Promise/request-response abstraction, not an arbitrary streaming protocol |
| [Lit controllers](https://lit.dev/docs/composition/controllers/) | hostConnected/hostDisconnected and lifecycle ownership | Controller API exists; count of controllers in one application is not inherently a defect |
| [Solid 2 async reactivity](https://v2.solidjs.com/concepts/async-reactivity) | Async memos, settled-view holding, Loading/isPending/latest, consistency and slow-dependent-operation tradeoffs | Public v2 documentation; runtime fixtures must use and identify the exact RC tested |
| [Nisli pinned source](https://github.com/gkoreli/nisli/tree/4afde49c728a330e10ce887a38b8013d63b58498/packages/core/src) | Actual signal scheduler, template bindings, component scopes, resource/query implementation | Code inspection; planned ADR behavior must be checked against it |
| [Nisli ADR 0001](https://github.com/gkoreli/nisli/blob/4afde49c728a330e10ce887a38b8013d63b58498/docs/adr/0001-web-component-framework.md) | Backlog-viewer failures and initial design principles | Historical proposal, including constraints that evolved; do not copy old size claims or “no runtime scheduler” into a description of current core |
| [ADR 0015](https://github.com/gkoreli/nisli/blob/4afde49c728a330e10ce887a38b8013d63b58498/docs/adr/0015-eliminate-batch-automatic-coalescing.md) | Removal of explicit batch() in favor of automatic microtask coalescing and flush() | Accepted rationale; inventory prose has inconsistent call-site denominators, so explain the decision without repeating its counts |
| [ADR 0023](https://github.com/gkoreli/nisli/blob/4afde49c728a330e10ce887a38b8013d63b58498/docs/adr/0023-move-resilient-component-lifecycle.md) | Actual framework failure on DOM moves and deferred disconnect repair | True removals still dispose after a microtask; component-state preservation is distinct from browser-owned focus/iframe state |
| [ADR 0028](https://github.com/gkoreli/nisli/blob/4afde49c728a330e10ce887a38b8013d63b58498/docs/adr/0028-local-async-resource.md) | Markdown consumer motivated resource(); explicit source tracking, cancellation and generation guards | Local derivation, deliberately distinct from cached queries and graph-wide suspense/consistency |
| [ADR 0030.2](https://github.com/gkoreli/nisli/blob/4afde49c728a330e10ce887a38b8013d63b58498/docs/adr/0030.2-agent-native-core-ergonomics.md) | Scheduler, query ownership, diagnostics and template safety decisions | Some parts are proposed or were amended; inspect source and landing records before asserting implementation |
| [ADR 0031](https://github.com/gkoreli/nisli/blob/4afde49c728a330e10ce887a38b8013d63b58498/docs/adr/0031-atomic-dom-moves.md) | Native atomic moves, fallback tradeoffs and historical measurement corrections | Browser support is time-sensitive; rerun current capability/lifecycle fixtures rather than treating August evidence as current |

## Acquired package metadata

Public npm registry read through `npm view`: Lit 3.3.3; `@lit-labs/signals` 0.3.0; `@lit/task` 1.0.3. `solid-js` latest 1.9.17, next 2.0.0-rc.16. The temporary installation pinned the coherent rc.14 family identified in OpenClaw's plan. Explicit overrides prevented prerelease ranges from upgrading it; the saved dependency lock records the resolved graph.

## Author material

Goga explicitly supplied the framework’s origin in this conversation: long experience across Angular, React, Svelte, Web Components, Vue and others; combining the semantics and ergonomics he preferred; native web capabilities and fast targeted rendering. Earlier preserved prompts for the [backlog-mcp article](../../../prompts/one-hundred-pull-requests.prompts.md) supply the concrete lost-state problem and Angular/React background. Paraphrase these accounts; do not invent quotations, regret, production incidents, or comparative results.

## Verification additions

- GitHub's connected repository API returned commit `4afde49c728a330e10ce887a38b8013d63b58498` from the public Nisli repository. Pinned links are not inferred from a local-only commit.
- PR #174213 independently records direct Control UI retirement and the Canvas transitive-Lit exception. Its reported startup-JS delta is narrow and is not used as a migration-wide performance result.
- The current HTML standard's preserving-custom-element-state-when-moved section was read. The DOM specification URL timed out in the web fetcher; the article cites the successfully read HTML section and its actual Chrome fixture, not a newly verified DOM-algorithm claim.
- The source implementation of Lit Task 1.0.3 was inspected along with its public documentation. Its no-abort-on-disconnect observation is limited to the bare Task in the fixture; applications may implement disconnect cleanup.
- Reproduced results are in [browser-results.json](repro/browser-results.json) and [size-results.json](repro/size-results.json). Their method is [documented separately](repro/README.md).
