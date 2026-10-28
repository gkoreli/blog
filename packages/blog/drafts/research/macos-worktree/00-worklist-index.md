# macOS worktree setup investigation

Check date: 2026-10-28. Root thread: `01a1836a-c6ca-7b12-9d7a-a9d3c9513051`.

## Requested result

A new, plain-language article, four to five minutes to read, investigating Theo's Mac/Linux chart with the same care as the Bun AOT article. Prepare an unpublished draft. Do not infer authorization for social posts from the earlier article's fulfilled sharing request.

Governing form: engineering argument. This tests a performance claim and a practical response, rather than reconstructing one OSS project's market thesis. Use the OSS research discipline without assigning a new Radar issue number. Target 800–950 words including the compact source glossary; explain unfamiliar terms when first used.

Reader promise: understand what the 8× claim measures, which explanations the evidence supports, and what to measure before changing machines. Author contribution: inspect the source method and test dependency reuse on the available Mac. Do not claim an independent Linux comparison.

## Source baselines

| Repository | Ref | Baseline | Use |
| --- | --- | --- | --- |
| NullVoxPopuli/disk-perf-git-and-pnpm | main | `535aef76843fe52d6336604111708d884110a0e5` | Historical stress-test method, configuration and contributor results |
| pingdotgg/t3code | main | `125b61954dbba5822a8108c8ca47a4846b4b4328` | Current setup call and install configuration, not proof of Theo's measured revision |
| pnpm/pnpm | v12.14.0 | `fe4a0c232384289de82be3d502896ca7e070050c` | Tested release, shared-store implementation and limitations |

Exploration initially inspected pnpm main `4a263ca48fea43e15f313b6357cbb224c8bf4ed6`, then selected the tested release above for published implementation links. Current online documentation can differ from that release; use the tested `enableGlobalVirtualStore: true` spelling. No issue or PR state is used to establish the article's verdict.

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

## Limits and next action

The chart's raw per-run data, full machine specifications, measured source revision, all optimization commands and meaning of the Linux fix remain unavailable in the inspected material. Those gaps prevent independently reproducing its 8× ratio or assigning it wholly to APFS. A local Linux runtime was unavailable (`podman machine list` was empty); no VM, cloud machine or hardware was provisioned.

Raw browser observations, screenshots, the full methodology image, auto-caption transcript and command output remain outside Git, in `/tmp/macos-worktree-research` or the browser transcript export. Commit only selected attributed facts, test sources, lockfile and derived results. Do not publish private session logs or the earlier article's frozen footprint as this article's research cost.

Next bounded action after draft review: obtain the exact chart harness, optimization/fix details and machine-level samples before presenting a causal Mac/Linux reproduction. The present article can explain the disclosed comparison and its practical limits without claiming that reproduction.

## Draft acceptance, October 28

Draft: [Why Setting Up a Worktree Can Be Slow on a Mac](../../why-worktree-setup-is-slow-on-macos.md). 813 rendered words, about 4.1 minutes at 200 words per minute, including the source glossary. The opening states the reported gap and five-machine aggregation. The measured local contribution is 122 ms versus 66 ms on a small fixture, explicitly not a Linux comparison or T3 reproduction. No live site article or social share was created.

Checks passed: all twelve accepted installs, CommonJS and ESM library checks, unchanged complete lockfile bytes, independent median/file-count calculations, Python syntax, local research links, fenced code blocks, one rendered H1, existing published-post validation (21 Markdown posts). The draft directory is outside site discovery; a production build and deployment probe would not validate this unpublished draft and were not run. Before publishing it as engineering prose, preserve its shaping prompts under the engineering article contract and assign a truthful publication date.

Delivery: commit `643f637` pushed directly to `main` after rebasing on concurrent commit `913b496`; only the nine draft/research files were added. The following receipt-only update closes this worklist. Remaining evidence gaps above are limits on a future causal reproduction, not a claim that this draft measured the original chart.
