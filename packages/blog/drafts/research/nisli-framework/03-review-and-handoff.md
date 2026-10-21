# Draft review and handoff

October 20, 2026 Pacific; verification continued October 21 UTC. The requested engineering draft and bounded browser investigation are complete. This directory is unpublished research and draft material, outside the site's post discovery.

## Editorial position

Selected title: **OpenClaw Chose Solid. Here’s Why I’d Choose Nisli.**

This is a bridge article for engineers assessing persistent interactive applications. OpenClaw supplies a recognizable coordination problem; Nisli supplies Goga's independently developed response. The reader learns how update boundaries, async consistency, cancellation, component lifetime, and runtime binding discovery affect a framework choice.

The title promises a reasoned preference. “OpenClaw should have chosen Nisli” and “Nisli beats Solid and Lit for ultrafast apps” would promise a comparative application result that this investigation did not establish. No traffic or title-performance effect was measured.

Possible publication description, if publication is later requested: “Nisli, Lit, and Solid 2 compared through OpenClaw’s migration, framework source, and browser tests of update scope, async consistency, and component lifetime.” No publication metadata or date has been activated.

Goga's supplied framework history is protected: years across Angular, React, Vue, Svelte, Web Components, and other systems, combining preferred semantics and ergonomics. The OpenClaw story is an opening case, not Nisli's origin. The earlier query-cache retention point was not elevated into a defining architectural weakness; it is a bounded, straightforward policy gap, outside the local-resource comparison tested here. No cache repair is claimed.

## Adversarial review and disposition

| Risk | Disposition |
|---|---|
| Treat a migration narrative as a renderer benchmark | Separate Peter's report, the AI-authored timeline, the issue's rationale, and individual PR measurements. No OpenClaw performance result is reproduced. |
| Make ordinary Lit look like subtree replacement | Explain template reevaluation versus DOM mutation. Include narrow component and pinpoint-signal variants. Preserve narrow Lit's win. |
| Compare an uncompiled Solid program or mismatched prereleases | Use the actual Solid Vite/JSX compiler and the complete 2.0.0-rc.14 runtime/compiler family with overrides and lockfile. |
| Present microtask throughput as responsiveness | Name the 10,000-update loop, six shared microtask turns, per-write verification, and absence of paint/input measurement. Report individual samples and medians. |
| Attribute the agent's operation of tests to personal author experience | Explicitly disclose Codex's source inspection, fixture construction, and browser operation. Keep first-person design judgment separate from test narration. |
| Equate resource supersession with graph-wide consistency | Test stale A after B separately from the two-panel intermediate view. Explain Solid's held settled view and Nisli's independent publication. |
| Claim native moves preserve every browser state everywhere | Check setup identity, input identity, focus, and positive-control disposal separately. Limit results to Chrome; forced fallback is not Safari coverage. |
| Present proposed ADR optimizations as current code | Use pinned source and separate historical/proposed positional templates from the measured runtime parse/clone/walk path. |
| Hide Nisli's costs to support the headline | Retain its slower mount, the smaller ordinary Lit counter, the faster narrow Lit update loop, and explicit presentation-policy work. |

## Validation

- All five production variants completed the instrumented and timed workload in the actual browser. Seven measured rounds followed one warmup per variant; results are saved without discarding the losing cases.
- Async supersession, pending-request teardown, mixed versus held async views, native/fallback moves, hidden retention, and true disposal were exercised. Positive controls establish that cleanup counters can fire.
- All four independently built counter bundles were opened and clicked, each changing `Count: 0` to `Count: 1`.
- The saved fixture sources match the temporary sources checked with TypeScript. Strict checking passed with ES2024, ESNext.Disposable, DOM, DOM.Iterable, noUncheckedIndexedAccess, and Solid's real JSX types. Local command: `mise exec node@24.14.1 -- node packages/blog/node_modules/typescript/bin/tsc -p /private/tmp/nisli-article-bench-20261020/app/tsconfig.json`.
- `node --check` passed for both reproduction scripts.
- `pnpm -C packages/blog validate` passed for all 18 Markdown posts. This verifies existing publication metadata; the unpublished draft is separately rendered and audited.
- The existing Markdown table tests passed (2/2). The draft was rendered through the blog's actual Markdown/Shiki renderer: four tables and three code blocks. A standalone temporary preview was inspected in the browser; the site's active `dist/` was not touched.
- Local evidence links, pinned Nisli paths and line bounds, reported medians, bundle byte counts, code fences, and complete shaping prompts were audited. External claims were checked through the source ledger's public pages and repository API.

## Delivery boundary and next action

Only this research directory belongs to this task. Concurrent site, SSG, design, guidance, and content changes in the shared checkout belong to another session and must remain untouched by staging or integration.

The delivery is an unpublished draft with inspectable source and measured evidence. No route, RSS entry, publication date, site activation, or distribution post is part of this work. The next bounded action is Goga's editorial review. A real OpenClaw transcript-pane port, other browser engines, long-session memory tests, or production adoption would be separate experiments with their own workload and acceptance criteria.

## October 20 release-review continuation

The initial draft and prototype records above remain historical. Goga then
requested landing/releasing the optimization and updating the story, with a
pre-landing understanding condition. The [0.56.1 review](release/README.md)
supersedes the prototype for release assessment: its actual regressions were
repaired, the hardened source was remeasured, and its package contract audited.

Final local core/workspace acceptance is recorded there; the original baseline
results remain intact. The article adds the mechanisms, losses and tradeoffs,
repaired regressions, a seven-case before/after table, remaining narrow-Lit win,
and the additional 455 gzip bytes. Release preparation is isolated on
`codex/core-rendering-performance`; main/npm have not changed. The complete
shaping record now contains twelve messages.

Next bounded action: Goga reviews the concrete candidate and exceptional timing,
cache/size, and fallback implications before landing. Once confirmed, integrate
against current main, watch main CI and auto-tag/npm, verify the public package,
and update the article's candidate/release status. Publishing the article is
still outside the request. Temporary benchmark servers/tabs are stopped;
the isolated core worktree remains available for review.

The hardened candidate is saved in local Nisli commit `f40a217` after the
prototype commit, with a clean isolated worktree. Blog validation passes for
all 18 published Markdown posts; the actual Markdown/Shiki render separately
passes for the unpublished article (five tables, three code blocks) and release
review (two tables). Both existing table tests pass. The release fixture passes
strict TypeScript checking and script syntax checks; local links, twelve full
prompt messages, reported medians, source/harness fingerprints, exact patch
reconstruction, and package metadata were checked. No production build was
run into the blog's active output.
