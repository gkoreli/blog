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

## October 20 publication-preparation handoff

Goga requested article iteration and publication preparation, explicitly omitting
his prompts. The article now has publication metadata and a body H1 matching its
title. The existing prompt capture is removed from the current tree; no prompt
file, generated route, header link, teaser, or research-token footprint is
prepared. Earlier committed prompt content remains in Git history; no rewrite
was requested. A short AI-assistance disclosure remains. This scoped owner
direction overrides the normal prompt-provenance workflow for this article.

The main comparison now uses the actual published 0.57.0 npm artifact. Its
35 measured trials, package hashes, exact adapter, byte counts, and method are
recorded in [publication/](publication/README.md). The original 0.56.0 results
and unmerged optimization experiment stay separate. The article explains that
parsing was already cached, target locations are implemented in the branch,
and complete binding instructions are only a further proposal. Both scheduling
transports use browser microtasks; the error adapter remains under review.
No experimental core change was merged or released by this preparation pass.

Editorial pass: retain the OpenClaw opening and Goga's broader framework origin;
preserve narrow Lit's win, Nisli's slower mounts, Solid's coordinated async
advantage, callback-ordering concerns, added bytes, and unprofiled heap. Tighten
the separation between stale-result suppression and retained old data. Put
package-release checks in the research record. Keep the title as an attributed
architectural preference rather than a whole-OpenClaw speed claim.

Acceptance: the final site build passes against blog main `29ad92f`, which
includes the separate 0.57.0 integration. The isolated build contains 30 posts;
all 19 Markdown posts validate and both existing table tests pass. The actual
HTML has one H1, five tables, three highlighted code blocks, matching SEO/OG
metadata, canonical URL, JSON-LD, publication date, RSS/sitemap/index entry, and
Markdown/CSL/BibTeX representations. Automated checks confirm no prompt output,
exact source/preview agreement, local evidence links, pinned source files/line
bounds, and all reported medians. The new fixture passes strict TypeScript
against the published declarations and its three scripts pass syntax checking.

Visual review checked the opening at desktop width, the comparison table at
571px (page width equals viewport), and a real 390px iframe viewport containing
the opening, code block, and table. The generated social card is legible without
clipping. The temporary iframe wrapper is local-only. A stale claim in the two
writing references said the shell supplied H1; the failed HTML check and actual
renderer established that the Markdown body must supply it. Both references
and their examples were corrected, preserving the other instructions.

The canonical draft is [article.md](article.md). The preview copy is
`029-openclaw-chose-solid-why-id-choose-nisli.md` in the managed
`nisli-article-preview` worktree, served locally on port 48178. Primary `posts/`
remains unchanged, so this is not production activation. The expected public
article URL is absent until promotion. Source links to new evidence become
available with the scoped repository push.

Next bounded action: Goga reviews and edits the rendered candidate. On an actual
publication request, use the truthful client-local publication date, promote the
canonical file into primary `posts/`, build/check the resulting representations,
then distinguish Git delivery, deployment activation, and measured acceptance.
No social distribution or messaging has been requested.

## October 21 authorized publication

Goga requested release and committing all active changes. The primary checkout
was clean at `25b3832` before promotion. The article is promoted to
[its authoritative post source](../../../posts/029-openclaw-chose-solid-why-id-choose-nisli.md),
with an October 21 client-local date after the client date rolled over. The former draft is a short supersession
pointer; the original drafts and observations remain in Git history. No prompt
file or prompt route is included. No core optimization is landed by this release.

Local release acceptance passed with Node 24.14.1 and pnpm 9.15.4: the isolated
production build contains 30 posts, all 19 Markdown posts validate, and both
Markdown table tests pass. The promoted source exactly matches the checked
preview source. Audits verify one H1, five tables, three code blocks, October 21
metadata, canonical/JSON-LD, feed/sitemap/index discovery, Markdown/CSL/BibTeX,
local evidence links, pinned source lines, all 35 timing trials, and no prompt
output. Git whitespace checks pass. The first local build attempt hit the
sandbox’s tsx IPC restriction; the approved isolated build passed. The table
test command was corrected to run from its owning package so tsx resolves.

Git delivery, deployment activation, and current public acceptance remain to be
recorded below. Goga subsequently requested preserving and further validating
the core optimization; that work is separate from this article release.

### Article delivery and public acceptance

Article commit [`29a76af`](https://github.com/gkoreli/blog/commit/29a76af)
was pushed to main. Cloudflare’s Workers Builds check succeeded at
2026-10-21 07:02:01 UTC: build `6ed6b065-d41d-4397-b000-7ca74d5b42e0`,
Worker version `8530df4b-88a7-4d24-aae0-f7d0112b5c09`.

Current HTTP acceptance at 07:02:29 UTC (October 21 Pacific): the
[article](https://gkoreli.com/openclaw-chose-solid-why-id-choose-nisli),
Markdown, CSL, BibTeX, social card, homepage, post index, RSS, sitemap, and
llms.txt all return 200. HTML contains the expected title, one H1, five tables,
three code blocks, October 21 publication date, canonical URL, and AI credit.
All discovery surfaces include the slug. Markdown, CSL, BibTeX, and the social
card match the validated isolated build byte-for-byte. The prompts route returns
404 and no prompts link or discovery entry exists. Raw HTTP captures and the
verification receipt stay outside Git.

Article publication is complete. No social distribution, OpenClaw adoption, or
experimental core release is implied by this acceptance. The follow-up core
request is being cross-validated in its own Nisli worktree; the historical
optimization remains saved at local commit `f40a217`.

## Core optimization preservation and integration

Goga requested keeping the three optimizations in a local backlog, further
cross-validation, and main integration only where correctness is established.
The full current-main port is preserved at local Nisli commit `f671dcd`; the
original hardened candidate remains at `f40a217`. The
[Nisli worklist](https://github.com/gkoreli/nisli/blob/main/docs/worklists/core-rendering-performance/README.md)
now owns the backlog, a complete runtime/test recovery patch, reproducible
cross-check, and distinct full-candidate/queue-only results. The recovery patch
was applied to its pinned baseline and reconstructed all four saved runtime/test
files byte-for-byte. The obsolete 0.56.1 bump and conflicting historical ADR
number were not integrated into current main.

The full port passed local typecheck, 2,349 tests, build, and the three-engine move
proof. A new production-mode differential fixture compared baseline and candidate
in Chromium 149, Firefox 151, and WebKit 26.5: 100 deterministic seeds × 50 writes
per engine, twelve repeated mounts × ten updates, conditional dependencies,
cleanup, disposal, cascades, mixed attributes, events, and microtask ordering.
Normal traces match. A deliberately throwing diagnostic transport reproduces
the exceptional timing difference in all three engines: the full candidate
reports after callbacks that run after the baseline error report. Passing the
ordinary suite therefore does not establish full behavioral equivalence.

Only the zero/one-effect queue fast path was isolated and integrated. An empty
set has no effects; sorting one member cannot change its order; clearing it
before runEffect preserves next-pass scheduling, and runEffect retains its
disposed guard. Multi-effect sorting and queueMicrotask/error transport remain
unchanged. The binding cache and Promise scheduler remain backlog candidates.

After rebasing over concurrent Nisli main `5728ee4`, pinned Node 22.23.2, pnpm
10.17.1, and Bun 1.4.0 pass the toolchain guard, frozen install, typecheck,
all 2,342 workspace tests (469 core), build, the three-engine differential
fixture including exceptional order, and the compound lifecycle proof. The
queue-only source fingerprint matches the checked final code.

Nisli implementation commit `b858949` and final evidence commit
[`9e9d546`](https://github.com/gkoreli/nisli/commit/9e9d546) were fast-forwarded
and pushed to main. The package version remains 0.57.0, and the changelog labels
this subset Unreleased; no new npm package was published. No new speed or size
result is attributed to this subset or pooled into the historical article data.

That integration's [main CI](https://github.com/gkoreli/nisli/actions/runs/39560368884)
was subsequently superseded by the runtime rollback below; it is not final
acceptance for the current source.

### Throughput result and correction

The fresh [queue-only throughput check](integration/README.md) retains all 84
measured samples across three browser engines and two queue sizes. Firefox's
single-effect median increased from 86 to 108 ms, with non-overlapping sample
ranges in this run. Other cases show no convincing overall win; Firefox's
eight-effect samples are highly variable. The method, exact source, raw results,
and limits are saved separately from the article's measurements.

Integrating before this fresh performance check was premature. The runtime fast
path and its Unreleased changelog entry were reverted before any npm release.
The four scheduling regressions remain as tests. Main retains its original
copy/sort/queueMicrotask implementation. Both the full candidate and queue-only
source remain recoverable, with explicit backlog actions and counterevidence;
behavioral equivalence alone did not establish an optimization.

The correction is pushed as Nisli commit
[`45e009e`](https://github.com/gkoreli/nisli/commit/45e009e). The article adds the
negative result, the temporary integration and rollback, and a methods link,
without altering or pooling its historical before/after table. Main-CI acceptance
is recorded after verification.

The follow-up article passes a fresh isolated production build (30 posts) and
the representation/metadata/source/benchmark-link audit, including absent prompt
output. One initial build command accidentally ran from the primary checkout
and was interrupted after clearing output. The existing development server was
kept running; touching the owned article source triggered its normal watcher,
which restored the homepage, article, and their CSS/JS assets. Those routes and
assets returned 200 afterward. The accepted production build ran from the
isolated follow-up checkout. No live production change was caused by that local
build error.

### Follow-up article activation

Blog commit [`367e330`](https://github.com/gkoreli/blog/commit/367e330) publishes
the negative-result paragraph and complete follow-up evidence. Cloudflare build
`0f31b93a-6d23-4ded-a3ee-933e744e7e0d` succeeded at 07:21:36 UTC October 21,
activating Worker version `4b8bea5f-8487-4e64-abf5-3f0efe2bfd4a`.

Current HTTP acceptance at 07:22:19 UTC passed for eleven endpoints: article,
Markdown, CSL, BibTeX, social card, homepage, posts index, RSS, sitemap, llms.txt,
and the deliberately absent prompts route (404). The article contains the
follow-up and expected metadata/structure. Markdown, CSL, BibTeX, and social-card
bytes match the isolated build. No prompts link or discovery entry exists.
Raw HTTP captures and operational logs remain outside Git.

The corrected [Nisli main CI](https://github.com/gkoreli/nisli/actions/runs/39560950654)
is still in progress at this checkpoint. Build, typecheck, packed-core contract,
three-browser compound lifecycle, and the published UI consumer job have passed;
the full UI preview sweep and remaining workspace checks are pending. Its final
outcome will supersede this checkpoint below. The rejected queue-only branch is
retained locally as `codex/core-rendering-queue-only-rejected` at `9e9d546`;
the full current-main candidate remains at `f671dcd`. The temporary article build
checkout was removed after its source matched the committed article and live
acceptance passed. The original managed preview is archived and recoverable.

### Final core acceptance

The corrected [main CI run](https://github.com/gkoreli/nisli/actions/runs/39560950654)
completed successfully at 07:31:57 UTC October 21 for exact Nisli commit
`45e009ed6c813e8d3c75c221e92304e9c57a0adc`. Both jobs passed, including build,
typecheck, packed-core contract, compound lifecycle in three browsers, the full
UI preview sweep, UI package-shape e2e, workspace tests, and the published UI
consumer e2e. This supersedes the pending checkpoint above. The earlier
queue-integration run was canceled by the superseding rollback, not accepted
as final source evidence.

Main's signal runtime and core changelog are byte-identical to `5728ee4`; only
the four new scheduling regression tests and durable recovery/research records
remain from this integration. The optimization implementations are preserved
and explicitly held, with their exact commits, patches, conditions, counterevidence,
and next experiments. No new npm release shipped an optimization.

The requested article publication, source preservation, additional validation,
and conditional merge assessment are complete. Future allocation/JIT/heap
profiles, new queue implementations, or separate binding-cache landing are
backlog proposals, not unfinished acceptance checks for this request.

## October 21 practical rewrite — local acceptance

The revised article is 2,388 whitespace-delimited words, down from 4,120 (42%
shorter by the same count). Actual OpenClaw source now anchors the argument:
original Lit chat page, intermediate Solid bridge, component-owned state, and
abbreviated before/after configuration-subscription code. The source ledger
pins those changes and the newly merged rc.16 upgrade. Existing rc.14 results
remain historical and explicitly versioned.

Two complete public-API examples show streaming text alongside an untouched
draft and a cancellable session preview. The harness extracts those exact
snippets from the article, strictly typechecks them against public 0.57.0, and
checks their behavior in Chromium, Firefox, and WebKit. All pass;
[method, limitations, and hashes](examples/README.md) accompany the results.
The initial microtask-only harness omitted the browser task turn needed by
Response.text(); that test-harness failure was corrected before acceptance.

The prose retains Goga's frontend experience and backlog-mcp origin. It gives
practical comparisons without claiming a real OpenClaw port, and keeps narrow
Lit's win, Nisli's mount cost, Solid's coordinated async advantage, and the
rejected optimization history. The article now has three tables, four code
blocks, and parallel/ordered lists. No prompt material is captured. Title,
URL, publication date, and bounded architectural preference remain stable;
description and alternative headline describe the practical examples.

Local checks: frontmatter validation, workspace typecheck, isolated production
build (30 posts), generated metadata/representations, research links and pinned
source paths, historical medians, and absent prompt output all pass. Desktop
1280×900 and mobile 390×844 Chromium views were inspected with JavaScript
disabled. Neither had page-width overflow; code blocks scroll independently.
A long component declaration was then wrapped; the exact-snippet checks passed
again and the final article was rebuilt in isolation.

The restored managed preview checkout owns the build output. The primary dev
server and dist were untouched. The temporary preview server was stopped before
the final source sync/build. Commit, deployment activation, and current HTTP
acceptance are recorded separately after delivery.

### Practical rewrite activation

Source commit [`ebb2534`](https://github.com/gkoreli/blog/commit/ebb2534) was
pushed to main. GitHub's connector and CLI returned no check runs for that
commit during delivery, and live HTTP initially still served the old article.
Cloudflare deployment history also showed no new activation. The cause of the
missing automatic trigger was not diagnosed; no integration settings changed.

The validated isolated build was deployed directly through the repository's
pinned Wrangler 4.71.0, with `--keep-vars`, using the unchanged Worker source
and configuration from main. Its deployment message identifies `ebb2534`.
Activated Worker version: `e5fde991-5a0e-4887-af57-ba913fb87911`.

Live HTTP acceptance passed at 15:45:59 UTC October 21: revised article,
Markdown, CSL, BibTeX, posts.json, RSS, sitemap, and llms.txt returned 200;
the excluded prompts route returned 404. The article contained both examples,
the actual-migration section, one H1 and three tables, with no prompt teaser,
header link, or typed prompt link. Markdown/CSL/BibTeX bytes matched the accepted
isolated build. Discovery outputs contained the article without a prompts entry.
Private logs and screenshots remain outside Git. The temporary preview server
is stopped; its managed checkout can be archived after this receipt is saved.

The practical rewrite and publication are complete. This receipt does not claim
that the automatic deployment integration has recovered, that rc.16 was
benchmarked, or that an OpenClaw surface was ported.
