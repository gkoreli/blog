# macOS worktree setup investigation

Check date: 2026-10-28. Root thread: `01a1836a-c6ca-7b12-9d7a-a9d3c9513051`.

## Requested result

A new, plain-language article, four to five minutes to read, investigating Theo's Mac/Linux chart with the same care as the Bun AOT article. Prepare an unpublished draft. Do not infer authorization for social posts from the earlier article's fulfilled sharing request.

Governing form: engineering argument. This tests a performance claim and a practical response, rather than reconstructing one OSS project's market thesis. Use the OSS research discipline without assigning a new Radar issue number. Target 800–950 words including the compact source glossary; explain unfamiliar terms when first used.

Reader promise: understand what the 8× claim measures, which explanations the evidence supports, and what to measure before changing machines. The deeper iteration adds full-workload tests on the available Mac and a Linux guest on that Mac. Distinguish those experiments from a reproduction of Theo's raw chart.

## Source baselines

| Repository | Ref | Baseline | Use |
| --- | --- | --- | --- |
| NullVoxPopuli/disk-perf-git-and-pnpm | main | `535aef76843fe52d6336604111708d884110a0e5` | Historical stress-test method, configuration and contributor results |
| pingdotgg/t3code | main | `125b61954dbba5822a8108c8ca47a4846b4b4328` | Current setup call and install configuration, not proof of Theo's measured revision |
| pnpm/pnpm | v12.14.0 | `fe4a0c232384289de82be3d502896ca7e070050c` | Tested release, shared-store implementation and limitations |

Exploration initially inspected pnpm main `4a263ca48fea43e15f313b6357cbb224c8bf4ed6`, then selected the tested release above for published implementation links. Current online documentation can differ from that release; use the tested `enableGlobalVirtualStore: true` spelling. Issue and PR history establish reported project changes; their state alone does not establish the measured results.

## Work and state

- [x] Read the supplied screenshot and locate its original post.
- [x] Inspect Theo's follow-up image at full resolution; recover the aggregation and omitted Linux after-fix condition.
- [x] Read a bounded Relevant-order reply sample and Theo's filesystem reply; preserve the limits.
- [x] Retrieve the original YouTube video's auto-generated transcript; use it to locate the older benchmark, without treating transcript claims as independent evidence.
- [x] Inspect the older benchmark's README, package version, `.npmrc` and setup scripts.
- [x] Trace current T3 setup and pnpm's shared-store path.
- [x] Run a separate, small, offline install comparison on the available Mac, with functional checks and frozen lockfile.
- [x] Finish draft, claim check and scoped documentation checks.
- [x] Commit and push the unpublished research and draft.

## First-pass limits and next action (historical)

The chart's raw per-run data, full machine specifications, measured source revision, all optimization commands and meaning of the Linux fix remain unavailable in the inspected material. Those gaps prevent independently reproducing its 8× ratio or assigning it wholly to APFS. A local Linux runtime was unavailable (`podman machine list` was empty); no VM, cloud machine or hardware was provisioned.

Raw browser observations, screenshots, the full methodology image, auto-caption transcript and command output remain outside Git, in `/tmp/macos-worktree-research` or the browser transcript export. Commit only selected attributed facts, test sources, lockfile and derived results. Do not publish private session logs or the earlier article's frozen footprint as this article's research cost.

Next bounded action after draft review: obtain the exact chart harness, optimization/fix details and machine-level samples before presenting a causal Mac/Linux reproduction. The present article can explain the disclosed comparison and its practical limits without claiming that reproduction.

## Draft acceptance, October 28

Draft: [Why Setting Up a Worktree Can Be Slow on a Mac](../../why-worktree-setup-is-slow-on-macos.md). 813 rendered words, about 4.1 minutes at 200 words per minute, including the source glossary. The opening states the reported gap and five-machine aggregation. The measured local contribution is 122 ms versus 66 ms on a small fixture, explicitly not a Linux comparison or T3 reproduction. No live site article or social share was created.

Checks passed: all twelve accepted installs, CommonJS and ESM library checks, unchanged complete lockfile bytes, independent median/file-count calculations, Python syntax, local research links, fenced code blocks, one rendered H1, existing published-post validation (21 Markdown posts). The draft directory is outside site discovery; a production build and deployment probe would not validate this unpublished draft and were not run. Before publishing it as engineering prose, preserve its shaping prompts under the engineering article contract and assign a truthful publication date.

Delivery: commit `643f637` pushed directly to `main` after rebasing on concurrent commit `913b496`; only the nine draft/research files were added. The following receipt-only update closes this worklist. Remaining evidence gaps above are limits on a future causal reproduction, not a claim that this draft measured the original chart.

## Deeper investigation requested, October 28

Goga requested substantially deeper research, manual investigation and evidence-based exploration after reading the first draft. The earlier draft acceptance is historical, not completion of this expanded work. Keep the four-to-five-minute article limit; put detailed methods in research artifacts.

Acceptance for this iteration:

- [x] Inspect more of the original discussion, maintainer evidence and source history for the unspecified Linux fix and Mac optimization list; record bounded coverage and any unavailable evidence.
- [x] Run the entire pinned public multi-framework workload, recording exact commands, inputs, successes and failures. Preserve the distinction from the newer five-machine chart.
- [x] Compare the same full workload and pinned tools on macOS and guest-native Linux storage on the same Mac when a local VM can be provisioned without disturbing existing work. Record CPU/memory and virtualization differences; do not claim this isolates APFS alone.
- [x] Test plausible mechanisms with matched controls: installer version, local package creation versus shared reuse, filesystem/store placement, and scripts/network work where relevant. Select further tests from the first results rather than running an indiscriminate matrix.
- [x] Inspect the relevant source path and profile or count real work where supported; do not infer mechanism from elapsed time alone.
- [x] Revise or remove the tiny-fixture-centered argument according to the stronger evidence, retain counterexamples, and keep the readable draft within five minutes.
- [x] Independently check derived values, claims, evidence links and reproduction instructions; commit/push scoped work and leave a dated handoff with concrete remaining limits.

Previous goal turn classification: progress. It produced the initial draft and a small controlled install test, but did not establish the full workload result. Current next actions: materialize the pinned full benchmark, prewarm the exact pnpm 10.2.1 toolchain, prepare a temporary Linux VM with only the research folder shared, and inspect the original thread beyond the earlier small reply sample. No outreach is authorized or needed for those actions.

Runtime correction found during the deeper pass: resolving the `node` mise shim inside the temporary benchmark selects global Node 20.20.2, not the blog checkout's Node 24.14.1. The original tiny-fixture manifest recorded the parent/repository runtime without proving the install subprocess runtime; treat its runtime attribution and timing comparison as superseded pending an explicit-binary rerun. The first full profiled run also used Node 20.20.2 and is diagnostic only. All accepted cross-platform work must use an absolute Node binary and prepend its directory to child `PATH`, then verify the runtime inside the benchmark directory. The draft remains unpublished while this is corrected.

## Deeper acceptance and handoff, October 28 local / October 29 UTC

Active evidence: [frozen artifact receipt](evidence-manifest-v2.json), [deeper source/method notes](02-deeper-investigation.md), [claim disposition](01-claim-audit.md#deeper-pass-claim-disposition), [21-install ledger](repro/full-results.json), [driver and reproduction notes](repro/README.md). The first-pass limits and tiny-fixture acceptance above are historical and superseded for the revised article.

The revised [draft](../../why-worktree-setup-is-slow-on-macos.md) is **864 rendered words**, about **4.32 minutes** at 200 words/minute. It leads with actual T3 on the same physical Mac: 7.753 s macOS / 1.286 s native-storage Linux guest. The same XFS checkout changes from 7.613 s to 1.380 s when its byte-identical cache moves onto XFS. The 0.710 s shared-store install is explicitly rejected as a ready-to-use T3 recommendation because the web typecheck fails with 64 errors; the default layout passes, including fresh-path direct-compiler controls.

The full older workload was also run, but it is supporting research rather than the article's main evidence. The pnpm 12 comparison on its unmodified locks failed validation, so no version-only speedup is claimed. The exact original chart's samples/optimization commands, pure APFS causality, ZFS/WSL and whole-agent timing remain explicitly deferred. These bounded unknowns do not reopen the completed install experiments. No outreach was authorized or sent.

Checks: all 21 accepted installs complete with matching expected inventories and unchanged source/lock inputs; two native-dependency checks for each T3 install; real web typechecks in both successful Linux layouts and default Mac; shared-mode failure repeated at a fresh path with the compiler directly. A separate JavaScript pass recalculated every median, three-run count, ratio and article rounding independently of the Python collection step. Markdown rendering confirms one H1 and the reading length; local links and code fences pass; Python syntax passes; published-post validation passes all 21 existing posts. The draft remains outside site discovery; no production build or deployment acceptance was claimed.

Resources: the research Lima VM was stopped cleanly, private guest evidence archived outside Git, and only the newly created failed Podman guest removed. Lima remains installed; temporary images and caches are retained for review. The known material shaping messages are preserved verbatim in the [draft prompt record](../../prompts/why-worktree-setup-is-slow-on-macos.prompts.md): the two applicable voice instructions, the new-topic request with its attachment reference, and the explicit deeper-research goal objective. The new-topic/voice messages were checked against the thread; the last item uses the exact stored user goal text. Before engineering-post publication, move that record into the normal prompts directory and set a truthful publication date. This task delivers an unpublished draft.

Delivery: scoped commit `81186d65ed82f52037186ac3d0ea4e4e3a8bb746` was rebased over concurrent main changes and pushed directly to `main`. The remote GitHub file at that exact revision was read back successfully and contains all seven series / 21 accepted installs. Frozen artifact hashes survived rebase unchanged; the checkout was clean after the source push. This receipt update records that verified delivery.

This deeper research iteration is complete. No site article or social share was published. The next authoring step, if requested, is review or publication of the saved draft; further source research is needed only if its claims or tested versions change.

## Failure diagnosis and additional validation requested

New user goal: “Why did macOS fail? Also we need more validations”. The preceding goal turn was progress: it delivered 21 measured installs and exposed a reproducible compatibility failure. Its acceptance above is historical for this expanded request, which now requires explaining that failure rather than only reporting it.

Acceptance:

- [x] Trace the 64 shared-store type errors to concrete module/type resolution behavior; reduce the cause and test a repair or a precise limiting condition.
- [x] Test the same shared-store configuration on Linux to distinguish an OS-specific failure from a dependency-layout failure.
- [x] Validate the surviving configurations with actual project checks beyond two native-module loads, comparing any failures with the unchanged default layout.
- [x] Strengthen the timing evidence with additional ordered/alternating fresh-worktree trials, source-verified concurrency controls where applicable, and a current-version profile. Keep diagnostics and warmups outside accepted timings.
- [x] Explain the remaining Mac install cost to the degree supported by measured operations and controls, rather than attributing the whole difference to APFS from elapsed time alone.
- [x] Revise the four-to-five-minute draft and claim ledger, freeze a new evidence receipt, check the scope and calculations, and deliver scoped changes to main without publishing the article.

The research, article checks and repository delivery are complete. No outreach or social publishing was authorized or performed.

## Failure-diagnosis acceptance and handoff, October 28 local / October 29 UTC

Current evidence: [diagnosis and validation methods](03-failure-diagnosis-and-validation.md), [current claim disposition](01-claim-audit.md#current-failure-diagnosis-and-validation-disposition), [30-trial/project-check ledger](repro/validation-results.json), [reproduction notes](repro/README.md), and [v3 frozen artifact receipt](evidence-manifest-v3.json). This iteration supersedes the previous undiagnosed rejection and cleaned-directory article headline; earlier records remain separate historical observations.

The typecheck failure is a shared-layout React declaration lookup failure, reproduced with 64 errors on both systems. Traces, a reduced example, two compilers, fourteen positive/negative/control cases, pnpm-aware launcher control and a targeted typecheck-only repair support that diagnosis. The exact copyable recipe clears the web errors without changing base configuration, source, dependencies or strictness. A production web build also passes with the separate recipe file present. Neither preserveSymlinks nor explicit typeRoots repairs this tested project.

Thirty fresh Git worktrees completed sequentially, five per configuration/OS. Default medians: 8.120 s macOS / 2.098 s Linux guest (3.87×). Four-worker medians: 6.548 / 2.019 s (3.24×). Shared-package medians: 0.943 / 0.962 s. Every trial passes native checks and the real web typecheck (with the targeted mapping in shared mode); source and all 599 requested dependency entries match. Current pnpm source, 1,621 successful Mac directory-clone events, a sampled native process and a content/inode check support the repeated-tree-creation explanation without claiming pure APFS causality. Profiling and broader validation did not overlap timed trials.

Broader acceptance is explicitly bounded: default Mac and shared Mac/Linux web unit suites each pass 4,302 tests; web production builds pass in those layouts. The complete Mac browser comparison passes 471/472 tests in both layouts, with the same GuestPage scrolling failure and the same failure in targeted repeats. This is a baseline limit, not full application acceptance. No unrelated scrolling repair, mobile/desktop certification, OS-kernel causal decomposition or whole-agent speedup is claimed.

The revised draft renders to **911 words / 4.56 minutes** at 200 words per minute, including its source glossary. A separate JavaScript audit recalculates six five-sample medians/ranges, all three ratios, worker reduction, schedule/order, unique fresh paths and all per-trial gate/input/inventory records against private controller output. Raw-log checks independently confirm unit counts, browser failures/repeats, compiler controls and build success. Local links/fences, JSON/Python syntax, one rendered H1, metadata, executed driver bytes and all 21 published-post validations pass. No production site build is needed for this unpublished draft.

Private guest evidence was archived outside Git (107 selected logs/records); the research VM was stopped cleanly after validation. Owned temporary worktrees, caches and images are retained for inspection. The new goal text is preserved verbatim in the draft prompt record. The article remains unpublished, with no date or live route, and no social post was created.

Delivery: scoped source commit `6b0bad149fbdbbcf22925c8a7eff996ed05dd879` was rebased over concurrent main changes and pushed directly to `main`. All fourteen frozen artifact hashes survived rebase unchanged. The remote GitHub ledger at that exact revision was read back and verified: six series / thirty fresh trials, the 64-error launcher control, zero-error recipe, and both known browser failures. This receipt-only update closes the final acceptance item. The v2 receipt describes bytes at source commit `81186d65ed82f52037186ac3d0ea4e4e3a8bb746`; it is preserved, not silently rewritten to match this revision.

This expanded goal is complete: the reported failure is explained and a bounded repair is tested; additional install, compiler, unit, build, browser and mechanism validations are saved. No publication or production acceptance is claimed. The next authoring step is review of the saved 911-word draft; rerun research only if the tested source, tools or claims change.


## Cross-repository research and publication requested, October 28–29

New goal: “Can we try other notorious repos too in the benchmark, and then continue with evidence based exploration and experimentation to figure iut the why is this all happening and potentiall try out different things if it all can be mitigated in hardened ways without bandaids. This would all go really well into the article. And publish the article”. Previous goal turn: progress; it diagnosed the shared-store React failure and delivered 30 fresh-path trials. That acceptance is historical for this expanded objective.

Acceptance:

- [x] Pin and inspect additional well-known repositories, retaining their own package-manager versions and frozen source/lock inputs; benchmark more than one additional real repository on macOS and guest-native Linux with repeated ordered trials. Record attempted failures as well as accepted runs.
- [x] Follow the evidence into mechanisms and supported mitigations. Test safer reuse or configuration approaches against real project checks, type resolution, file mutation isolation and cache invalidation where applicable. Do not relabel a declaration-path workaround as a general fix.
- [x] Retain comparative controls and counterexamples; distinguish installer speed from complete app/agent performance and document remaining limits.
- [x] Rewrite the article around the strongest supported findings, keeping a four-to-five-minute reading length and preserving exact shaping prompts.
- [x] Validate the rendered article, metadata, sources, evidence and representations; commit/push scoped changes, publish through the repository deployment flow, and verify the actual live article and prompt page.

Initial plan: inspect Vite, SvelteKit and Next.js as independent large workspaces with native pnpm 12 pins; select checks from their source. Restore the existing research VM and measure only after cache/tool preparation. Investigate supported fixes before recommending experimental shared storage. Publication is authorized; social posting and maintainer outreach are not part of this goal.


Research checkpoint: all 90 added install trials are complete, plus a retained failed Next offline trial. The [new methods](04-cross-repository-and-hardened-mitigations.md) record the cache mutation, reduced clone/copy/read-only controls, two isolated writable cache views on each platform, and the current validation limits. T3's four optional React-type peers pass normal types/unit/build checks on both systems; both COW views also pass types and preserve cross-view package writes, with 4,302 unit tests and web builds accepted per platform. Shared SvelteKit core checks pass unchanged. Vite and Next type metadata repairs preserve every package version; Vite's final full typecheck, build and 1,089 unit tests pass on both systems. Next's complete Linux build remains unaccepted and must stay qualified. The article is now [post 032](../../../posts/032-why-worktree-setup-is-slow-on-macos.md), 927 rendered words / about 4.64 minutes, with six exact shaping messages in its [official prompt record](../../../prompts/why-worktree-setup-is-slow-on-macos.prompts.md). Publication checks and live acceptance remain pending.

Pre-publication acceptance: the isolated Node 24.14.1 / pnpm 9.15.4 build generated 33 posts, including this one. All 22 Markdown posts validate. Rendered article, six-message prompt page, Markdown twin, post index, sitemap and feed pass local checks; browser review confirms one title and October 28, 2026. The isolated build used `TZ=UTC`, matching the publication calendar date. The [v4 manifest](evidence-manifest-v4.json) freezes the checked source and evidence; deployment/live acceptance is still pending.

Publication accepted: source commit `3101211ff4cc90a1d89793ef46e98dcd74d15a37` is on `main`, its Cloudflare build passed, and the actual article plus six-prompt page and discovery/Markdown representations passed HTTP and browser checks. See the [publication and acceptance receipt](05-publication-and-acceptance.md) for deployment, served-content evidence, research limits and resource cleanup. This expanded goal is complete.

## Title and opening correction requested, October 29

Goga's feedback: the original title and first section buried the same-Mac Linux VM result and failed to explain why to read the article. The [editorial correction](06-title-and-opening.md) leads with that measured result, resource allocation and practical findings. Local rendered/metadata checks pass. Source `b8888fd` was pushed; the absent automatic build was handled with a direct exact-source deployment using existing configuration. The live title, opening, seven prompts and generated representations pass. Markdown equals the release build; article/prompt HTML matches after removing the injected Cloudflare Insights script. The correction is complete. Prior completion records and frozen manifests remain historical for their source revisions.

## Distribution and reader questions, October 30

Goga requested an X post, reply to Theo and useful distribution/answers around actual questions. The [campaign receipt](../../social/why-worktree-setup-is-slow-on-macos/metrics.md) records four published X statuses and public-text verification. The live article already separates checkout creation from install timing; the accepted ext4 condition is now made explicit to answer the ZFS question without claiming a pure APFS experiment. Existing frozen manifests and publication receipts retain their original source revisions. The clarification's deployment and Changelog-specific approval remain pending. This is a bounded distribution follow-up, not reopened benchmark research.
