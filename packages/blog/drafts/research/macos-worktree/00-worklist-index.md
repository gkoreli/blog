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
- [ ] Independently check derived values, claims, evidence links and reproduction instructions; commit/push scoped work and leave a dated handoff with concrete remaining limits.

Previous goal turn classification: progress. It produced the initial draft and a small controlled install test, but did not establish the full workload result. Current next actions: materialize the pinned full benchmark, prewarm the exact pnpm 10.2.1 toolchain, prepare a temporary Linux VM with only the research folder shared, and inspect the original thread beyond the earlier small reply sample. No outreach is authorized or needed for those actions.

Runtime correction found during the deeper pass: resolving the `node` mise shim inside the temporary benchmark selects global Node 20.20.2, not the blog checkout's Node 24.14.1. The original tiny-fixture manifest recorded the parent/repository runtime without proving the install subprocess runtime; treat its runtime attribution and timing comparison as superseded pending an explicit-binary rerun. The first full profiled run also used Node 20.20.2 and is diagnostic only. All accepted cross-platform work must use an absolute Node binary and prepend its directory to child `PATH`, then verify the runtime inside the benchmark directory. The draft remains unpublished while this is corrected.

## Deeper acceptance and handoff, October 28 local / October 29 UTC

Active evidence: [frozen artifact receipt](evidence-manifest-v2.json), [deeper source/method notes](02-deeper-investigation.md), [claim disposition](01-claim-audit.md#deeper-pass-claim-disposition), [21-install ledger](repro/full-results.json), [driver and reproduction notes](repro/README.md). The first-pass limits and tiny-fixture acceptance above are historical and superseded for the revised article.

The revised [draft](../../why-worktree-setup-is-slow-on-macos.md) is **864 rendered words**, about **4.32 minutes** at 200 words/minute. It leads with actual T3 on the same physical Mac: 7.753 s macOS / 1.286 s native-storage Linux guest. The same XFS checkout changes from 7.613 s to 1.380 s when its byte-identical cache moves onto XFS. The 0.710 s shared-store install is explicitly rejected as a ready-to-use T3 recommendation because the web typecheck fails with 64 errors; the default layout passes, including fresh-path direct-compiler controls.

The full older workload was also run, but it is supporting research rather than the article's main evidence. The pnpm 12 comparison on its unmodified locks failed validation, so no version-only speedup is claimed. The exact original chart's samples/optimization commands, pure APFS causality, ZFS/WSL and whole-agent timing remain explicitly deferred. These bounded unknowns do not reopen the completed install experiments. No outreach was authorized or sent.

Checks: all 21 accepted installs complete with matching expected inventories and unchanged source/lock inputs; two native-dependency checks for each T3 install; real web typechecks in both successful Linux layouts and default Mac; shared-mode failure repeated at a fresh path with the compiler directly. A separate JavaScript pass recalculated every median, three-run count, ratio and article rounding independently of the Python collection step. Markdown rendering confirms one H1 and the reading length; local links and code fences pass; Python syntax passes; published-post validation passes all 21 existing posts. The draft remains outside site discovery; no production build or deployment acceptance was claimed.

Resources: the research Lima VM was stopped cleanly, private guest evidence archived outside Git, and only the newly created failed Podman guest removed. Lima remains installed; temporary images and caches are retained for review. The known material shaping messages are preserved verbatim in the [draft prompt record](../../prompts/why-worktree-setup-is-slow-on-macos.prompts.md): the two applicable voice instructions, the new-topic request with its attachment reference, and the explicit deeper-research goal objective. The new-topic/voice messages were checked against the thread; the last item uses the exact stored user goal text. Before engineering-post publication, move that record into the normal prompts directory and set a truthful publication date. This task delivers an unpublished draft.

Next bounded action: finish scoped Git delivery, then record its verified receipt below. Further source research is only needed if the article's claims or tested versions change.
