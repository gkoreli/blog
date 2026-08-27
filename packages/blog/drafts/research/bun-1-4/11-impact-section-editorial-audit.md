# Bun 1.4 near-ending impact section editorial audit

Editorial/research-only follow-up for the Bun 1.4 OSS Radar draft. The article was not edited.

## Audit record

- **Draft:** `packages/blog/posts/021-oss-radar-05-bun-1-4.ts`
- **Release baseline:** [`bun-v1.4.0` / `34cbb9a40b4bd1bd767d134a7065e66c2432a676`](https://github.com/oven-sh/bun/commit/34cbb9a40b4bd1bd767d134a7065e66c2432a676)
- **Existing evidence read:** research artifacts `00` through `08` and the frozen footprint manifest
- **Live release list checked:** `2026-08-27T03:54Z`
- **Governing form:** OSS Radar single-project deep dive
- **Protected ending:** the final adoption section must still make one bounded decision and stop

## Editorial recommendation

Add one section immediately after the Anthropic evidence paragraph that ends with “production servers” (current
lines 302–307) and before the final adoption section. Insert the new heading before the existing paragraph that
begins “Bun's original moat was the integrated JavaScript toolchain” (current line 309), so that paragraph becomes
the new section's opening synthesis.

The exact sequence should be:

1. `<h2>Why 1.4 changes the migration decision</h2>`
2. The existing “Bun's original moat...” paragraph.
3. One native unordered list with six engineer-facing impact items.
4. One short cadence paragraph that separates faster feedback from faster published releases.
5. The existing `<h2>Adopt by canary, not by ambient upgrade</h2>` and its verdict, unchanged in function.

Do **not** put the impact section after the try/wait cards or after the final line. That would turn the decision into a
penultimate conclusion and make the article end twice. Do not add another pull quote, `Prognosis`, or `CompareTable`.
The draft already has enough visual machinery; a semantic `<ul>` with a bold lead in each item will scan cleanly and
will not pretend the impacts form a ranking.

Budget about 260–320 new words. The current rendered body is 1,661 words, so this addition will probably move the
article from nine to ten minutes at 200 words per minute. Recalculate `readTime` from the final render; more than 339
new counted words would cross the eleven-minute threshold.

## The six items worth publishing

The section should translate shipped work into a changed engineering decision. Each item needs one consequence and
one boundary. It should not enumerate every API or repeat the article's proofs.

### 1. Production resource use became a migration reason

**Keep.** Bun's own 1.3-to-1.4 measurements report lower HTTP-server memory, roughly halved Linux “hello” startup,
and lower Claude Code CPU. The present draft refers to those measurements without showing what an engineer gains.
Use at most two representative numbers and label them as Bun/owner-reported, not independent benchmarks. The payoff
is a reason to shadow a long-running service or CLI; it is not a universal speed claim.

Suggested lead: **“A Bun trial can now target an operating cost, not just a faster benchmark.”**

### 2. Existing test and observability stacks cross more of the boundary

**Keep; this is the strongest fresh practical item.** The release labels Playwright, Vitest, OpenTelemetry HTTP/fs
instrumentation, and `dd-trace`/`@datadog/pprof` support as `1.4.0`. These tools often decide whether an existing Node
service can enter a migration trial at all. Name the four together once. Say Bun reports that these paths now work;
the article did not reproduce full tool or plugin parity.

Suggested lead: **“The migration no longer has to stop at the test runner or tracer.”**

### 3. Node compatibility now has a larger continuous contract

**Keep.** The useful impact of the `+1,517` figure is that the added Node tests run on every Bun commit, not that one
aggregate percentage declares Bun compatible. This is the best evidence-backed reason to expect faster detection of
known Node-semantic drift. Pair it with the already-published WebSocket counterexample: downstream async states can
still escape the corpus.

Suggested lead: **“More Node behavior now fails closer to the commit that changed it.”**

### 4. Parallel scripts and tests become a first-party workflow

**Keep with a visible limit.** `bun run --parallel` can absorb work often delegated to `concurrently` or
`npm-run-all`, and the release makes parallel test execution a first-party lane. That is practical for monorepos and
CI. Do not call large-suite parallel testing solved: live issue
[`#39987`](https://github.com/oven-sh/bun/issues/39987) reports a persistent deadlock in a roughly 1,100-file suite
and remains open in the research cutoff. Recommend a no-output watchdog until the target suite passes repeated runs.

Suggested lead: **“Monorepo orchestration can move into the same executable.”**

### 5. Package management now includes repair and cleanup

**Keep, but merge the commands into one item.** `bun audit fix`, `bun dedupe`, and `bun prune` matter because Bun can
now mutate vulnerable versions, normalize duplicate package choices, and remove unused lockfile entries instead of
only installing them. Preserve the operational boundary: run audit repair in a reviewable branch and start with
`--dry-run`; the audit request sends installed package names and versions to configured registries, and open issue
[`#39309`](https://github.com/oven-sh/bun/issues/39309) reports an unsafe `--latest` downgrade.

Suggested lead: **“The package manager can maintain a dependency graph, not merely materialize it.”**

### 6. Application APIs make runtime choice an architecture choice

**Keep, compressed to one synthesis item.** `Bun.Image`, `Bun.Terminal`, `Bun.WebView`, Markdown, and cron are already
proved in the body. Do not explain them again. State the consequence: teams can remove adapters and some native
package build work, while accepting Bun-specific source, host/browser/security obligations, and one runtime release
boundary. This is the biggest impact and should be the final list item because it hands the reader back to the
article's thesis.

Suggested lead: **“Choosing Bun now selects more application architecture than choosing a JavaScript engine.”**

## Cadence paragraph: preserve the excitement without converting it into a fact

The author's excitement is earned as a reaction, but the proposed causal story is not yet established.

The primary release list shows a 99-day gap between `1.3.14` on May 13 and `1.4.0` on August 20. It also shows that
many capabilities were already released incrementally as `1.3.5`, `1.3.8`, `1.3.11`, `1.3.12`, and `1.3.14`; the
1.4 post explicitly says it is a roundup of everything shipped since `1.3.0`. The delayed-authentication WebSocket
repair merged two days after the 1.4.0 tag, but at this cutoff GitHub lists no `1.4.x` stable release after `1.4.0`.
That proves fast repair **merge** activity in one case, not faster patch **delivery**.

A safe near-final paragraph is:

> The reason for optimism is not the size of the changelog. The Rust cutover is now behind a stable tag, 1,517 more
> Node tests run on every commit, and one bounded WebSocket repair merged two days after release. Those are better
> inputs to a fast repair loop. Whether they produce faster 1.4.x releases is the next result to measure.

This preserves the user's excitement as a forward-looking inference and gives it a falsifier. If a `1.4.x` release
ships before publication, update the cutoff and say exactly which repair landed in which tag; do not use the mere
existence of a patch release as a general cadence trend.

## Candidate-lane triage

| Lane | Treatment | Why |
|---|---|---|
| Memory, CPU, startup | **Keep as one item** | Direct production/CLI consequence; numbers are maintainer- and owner-reported. |
| Playwright, Vitest, OpenTelemetry, `dd-trace` | **Keep as one item** | Fresh migration unblocker; avoids four release-note subitems. |
| Continuous Node tests | **Keep as one item** | Explains the mechanism behind compatibility progress and supports bounded cadence optimism. |
| `bun run --parallel` / `bun test --parallel` | **Keep with watchdog limit** | Useful daily workflow; the open large-suite report prevents a victory claim. |
| `Bun.Image` / Terminal / WebView / Markdown / cron | **Merge into one impact item** | Already covered in depth; repetition would become recap. |
| `audit fix` / `dedupe` / `prune` | **Keep as one item** | Practical maintenance unlock; privacy and open-downgrade boundaries make it decision-relevant. |
| Rust rewrite scale, agent count, token count | **Do not repeat** | Already explained and easy to turn into AI-rewrite spectacle rather than user impact. |
| Individual benchmark tables | **Do not add** | They would enlarge the release-note inventory without changing the canary decision. |
| HTTP/3, platform matrix, every build feature | **Leave in research/sources** | Useful release facts, but outside the dependency-transfer thesis and the requested impact budget. |
| Post-tag cadence | **Use only as the bounded coda** | One merged repair and no published patch cannot establish a trend. |

## Unsafe versions of the user's framing

| Tempting claim | Why unsafe | Safe boundary |
|---|---|---|
| “Bun crammed all these fixes and features into 1.4.” | The post covers the whole `1.3.0`→`1.4.0` train, and many headline APIs shipped in `1.3.x`. | “The 1.4 post consolidates the product direction; the Rust cutover and specifically tagged items define the `1.4.0` boundary.” |
| “We had to wait for 1.4 for all of this.” | True only for work tagged `1.4.0` and fixes absent from `1.3.14`; false for Image, parts of Terminal/WebView, and other `1.3.x` work. | Name exact `1.4.0` unlocks such as the Rust runtime and the four tool-compatibility paths. |
| “Fixes will ship much faster now.” | No post-1.4.0 stable patch exists at the cutoff, and no source in the research set promises a faster release SLA. | “The rewrite is behind the stable tag and more tests run on every commit; faster patch delivery remains a testable expectation.” |
| “The WebSocket fix shipped two days later.” | The repair **merged** two days later and is not in `1.4.0`. | “The repair merged two days after the tag; users need a later tagged release containing it.” |
| “Bun fixed more than 2,900 1.4 bugs.” | The maintainer count is “issues fixed since 1.3,” while the Rust post separately reports 128 bugs reproducible in `1.3.14` fixed by `1.4.0`. | Keep the counts separate, attributed, and scoped. |
| “The Rust rewrite made Bun stable or memory-safe.” | `unsafe`, FFI, C/C++, protocols, and post-release regressions remain. | “Rust moves more Bun-owned lifetime checks to compile time; production stability needs longitudinal evidence.” |
| “Playwright/Vitest/OTel/dd-trace are fully compatible now.” | The release proves maintainer-tested paths, not every plugin, option, transport, or long-running state. | “Bun reports the named paths now work in 1.4.0; verify the target suite and telemetry pipeline.” |
| “Parallel testing is fixed.” | The large-suite deadlock report remains open and was observed on 1.3.14 and 1.4.0. | “Parallel execution is first-party and useful; large suites still need a watchdog.” |
| “Fifteen dependencies are gone.” | These are package-job mappings, not API parity; native libraries, browsers, codecs, OS services, and application security work remain. | “Selected package jobs can move behind Bun's runtime boundary.” |
| “Anthropic guarantees faster fixes.” | Ownership supplies money and an owner workload; it does not prove roadmap neutrality, public patch latency, or independent adoption. | “Anthropic gives Bun a direct production feedback loop; future tagged releases will show how that affects delivery.” |
| “Bun is now the best/fastest-moving JavaScript runtime.” | The research contains no defined, cross-runtime cadence or quality comparison. | Keep the claim about Bun's observed release train and this workload-specific adoption decision. |

## Final structural guardrail

The new section should make the reader care **before** the decision, not replace the decision. Its last sentence should
hand off to the existing canary verdict. The article must still end with who should try, who should wait, and why the
runtime boundary deserves measurement rather than faith.

No article, component, task record, or other research artifact was modified during this audit.

## Post-draft audit of the implemented impact section

Checked `2026-08-27T04:09:51Z` against the official Bun 1.4 Markdown release post, the pinned `1.4.0` source and
CLI, artifacts `01`–`10`, and live GitHub state. Issues `#39987` and `#39309` were still open; `1.4.0` was still the
newest stable release.

### Decision: hold for four corrections, then pass

1. **Narrow the native-addon sentence.** “Rebuild native addons for the new Node 26.3.0 ABI” is too broad. Bun
   targets module ABI `147`, so direct Node/V8/libuv/C++-ABI addons may need matching prebuilds or rebuilds. Node-API
   addons retain Node's cross-major ABI guarantee.
2. **Make package maintenance exact and disclose the network boundary.** `bun dedupe --check` detects dedupe work and
   fails CI; `bun dedupe` performs the lockfile change. Also say that the audit command sends installed package names
   and versions to configured registries. The current `--latest` issue caveat is correct and still live.
3. **Reduce or relabel the small-fixes callout.** All four underlying claims match the official changelog, but the cron
   local-time behavior is a default plus a new `{ tz }` option, not a fix. Four examples also exceed the OSS Radar
   two-example rule and make this part read like release notes. Keep the hot-reload and network-filesystem fixes, or
   relabel the box and cut it to two.
4. **Re-freeze provenance after the text is final and committed.** The article and manifest still publish the old
   `47 min / 9 artifacts / 58.6M tokens` freeze, while artifacts `09`, `10`, and `11` plus later session usage now
   belong to the article. Do not ship the stale totals.

Two precision fixes are strongly advised: scope the `Response.clone()` number to a 100-deep chain of a **10 MB
streaming body**, and write `--timings=<path>` plus `--update-timings` instead of “the new `--timings` file.”

### What passed

- The eight main items match the release's chronology: the copy distinguishes `1.4.0` work from the broader
  `1.3`→`1.4` release train where that distinction matters.
- The performance numbers, Playwright/Vitest/OpenTelemetry/Datadog paths, profiler Markdown, React Compiler
  comparison, package commands, script fan-out, and four small-fix facts all match the primary release post and stay
  attributed or bounded.
- The parallel-test warning is proportionate: it labels `#39987` as an open report and keeps a watchdog plus serial
  fallback. The audit downgrade warning likewise stays an open reported state rather than a reproduced fact.
- The cadence coda is sound. The official `1.4.1` canary proves post-tag main-to-canary delivery, while the prose
  explicitly refuses to infer faster stable releases. “The next fixes no longer have to share a release milestone
  with the mechanical port” is a bounded inference from the completed cutover.
- The added body links for `#39987` and `#39309` have matching Source entries. The Bun release post and the local
  canary artifact support the remaining added claims; their source rationales state why they matter.
- Placement passes. The impact section sits after the product/ownership theory and before “Adopt by canary.” Its
  cadence paragraph hands off to the existing try/wait decision. The article still has one decision ending and stops
  after it.
- The updated twelve-minute label matches the recorded 2,294-word rendered body at 200 words per minute.

The `Steps` presentation is acceptable only if the numbers are intended as an editorial priority order. The eight
items are consequences, not a procedure; an unordered semantic list would be cleaner, while the current component
renders numbered `div` elements rather than an HTML list. This is an editorial/accessibility improvement, not a
factual blocker.

No article or component was edited during this post-draft audit.

### Final disposition after corrections: PASS

Rechecked the implemented section after the four blockers and two precision nits were corrected. The native-addon
advice now distinguishes direct ABI dependencies from Node-API; the package-maintenance item uses `bun dedupe`,
discloses the audit registry request, and links the pinned implementation; the callout contains only two true fixes;
and the memory and timing claims carry their exact scopes. The added Node-API and audit SourceCards close the source
gaps.

The section now passes factual, chronological, source, caveat, and editorial review. It remains before the sole
adoption verdict and does not create a second conclusion. The numbered `Steps` semantics remain a nonblocking
presentation note.

Final verification passed on the corrected tree: `pnpm -C packages/blog typecheck`, the production build (21 posts),
and `git diff --check`. The article's research-footprint values still need the already-planned final re-freeze after
the complete artifact set is committed; that is a publication-provenance gate, not a blocker in this impact section.
