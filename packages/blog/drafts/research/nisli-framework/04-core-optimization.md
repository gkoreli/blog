# Why the mount and update results differed

Follow-up requested October 20, 2026 Pacific; browser captures are October 21 UTC. The article draft and its original release-0.56.0 measurements remain intact. This investigation tests a separate, unreleased core candidate.

## Mounting: repeated discovery was avoidable

The pinned implementation caches a parsed HTMLTemplateElement, then repeats `processNode()` for every clone. That walk copies each node's children, scans element attributes, recognizes markers, and creates bindings. A row's static nodes still participate in discovery even though their structure is identical to the previous row's.

Allocating 1,000 signals was near the timer's 0.0–0.1 ms granularity in the phase probe, compared with roughly 9 ms total mount time. That does not measure every allocation or prove that signals are free; it makes the up-front signal constructors an implausible explanation for most of this fixture's mount gap.

The candidate caches binding target indices from the browser-parsed template. A native TreeWalker locates those elements/comments in the clone, collecting every target before any binding changes the DOM. Existing binders, signal effects, and runtime boundaries remain. Templates using `html:inner` keep the old walker because the sink replaces the descendants that the old algorithm then visits.

A child-index-path prototype also improved mounts. TreeWalker was comparable across the tested shapes, used flat target metadata, and avoided path arrays. The result supports caching discovery; it does not establish that TreeWalker is always faster than paths.

The remaining mount cost still includes DOM cloning/insertion, binding and effect creation, ownership registration, and the shared scheduling allowance. This was an ablation and phase-timing investigation, not an allocation/heap or CPU-stack profile assigning every remaining millisecond to a function. It does not justify a compiler rewrite yet.

## Updates: scheduling was a larger cost than sorting

Narrow Lit changes a reactive property on one row. Its installed ReactiveElement implementation's `__enqueueUpdate()` awaits its previous update Promise before scheduling the render. Nisli's pinned `scheduleFlush()` uses `queueMicrotask(flushPendingEffects)`, then copies/sorts the pending set and executes the binding effect. Both ultimately write one text node; that does not make their scheduling paths identical.

Skipping copy/sort for a single effect is safe because one element is already ordered. The candidate clears the set before running it, preserving later-pass work and the existing sorted order when multiple effects are pending. This alone was a small improvement in the paired async workload: 6.15 to 5.90 ms.

Changing the scheduling primitive made the larger difference. A reused resolved Promise plus that fast path reached 3.50 ms, while the final candidate retained the same 3.50 ms pooled median after adding an exception-channel guard. A framework-free control scheduled the same callback through each primitive: 5.15 ms for `queueMicrotask` and 2.60 for the Promise. The result identifies a substantial enqueue/dispatch cost in this Chrome fixture; no engine-internal explanation or universal Promise advantage was established.

Microtask scheduling and error transport are distinct concerns. The [HTML queueMicrotask algorithm](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#microtask-queuing) reports callback exceptions. [ECMAScript Promise reaction jobs](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-newpromisereactionjob) reject the derived Promise when a handler throws. The candidate keeps ordinary effect containment, and catches an unexpected scheduler failure to report it through a queued throw. A regression test checks that channel; the reporting task is one microtask later than the original failing callback.

## Measured candidate

Thirty samples per case, across two fresh page loads; each load has three warmups and fifteen measured rounds. All comparisons are paired within one production page. Chrome 155, arm64 macOS 27.0.1; no paint, input-latency, GC, retained-heap, other-engine, or OpenClaw measurement. The [full method](optimization/README.md) explains the phase adapter and separate diagnostic probes.

| Operation | Baseline, ms | Candidate, ms | Lower elapsed time |
|---|---:|---:|---:|
| Mount original-shaped 1,000 rows | 9.00 | 7.25 | 19% |
| Mount static-heavy 1,000 rows | 40.25 | 30.05 | 25% |
| Mount binding-heavy 1,000 rows | 16.70 | 14.25 | 15% |
| 10,000 verified text updates | 6.15 | 3.50 | 43% |

Narrow Lit still measured 2.80 ms for updates in this paired experiment. The remaining 0.70 ms across 10,000 updates is not enough evidence to blame dependency-set churn, justify reusable graph edges, or promise a perceptible difference. Inspecting a representative application and profiling its hot paths is the next useful performance experiment.

The counter bundle grows by 393 gzip bytes, from 8,237 to 8,630 (+4.8%). The cache is an intentional speed/size tradeoff. The source/target cache's retained-heap behavior was not profiled.

## Correctness, status, and next action

- Baseline: 465 core tests passed. Candidate: 470 passed, including five added regressions.
- Root typecheck, all 2,343 workspace tests, and the isolated root production build passed. Builds ran only in the new worktree.
- The initial TreeWalker prototype failed SSG because `NodeFilter` was not installed globally. The repair uses the standard element/comment mask in core; SSG's existing 57 tests then passed. Tests were not weakened.
- Both final browser runs passed stale-request, cancellation, retained/disposed lifetime, move/focus, async-view, implied-tbody/SVG, ref/class/mixed-attribute, event/modifier, repeated-mount, and disposal checks.
- Final source and harness hashes match between [run 1](optimization/results-run-1.json) and [run 2](optimization/results-run-2.json). [Summary](optimization/summary.json), [variant patches](optimization/README.md#variants), and exploratory counterevidence are saved.
- Nisli changes are saved in local commit `b463683` on the isolated branch `codex/core-rendering-performance`, with no package-version bump, main merge, main-CI claim, or release. The exact candidate including its regression tests is preserved in [candidate.patch](optimization/variants/candidate.patch).

The requested investigation and measured prototype are complete. The next bounded action is reviewing that candidate for landing. A real application CPU/heap and interaction profile is a separate experiment; these synthetic results do not reopen the article's completed OpenClaw research or establish a whole-workspace win.
