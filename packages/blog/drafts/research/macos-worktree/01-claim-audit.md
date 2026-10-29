# Claims, reader questions and source rationale

Checked October 28–29, 2026. Repository baselines are in the [worklist](00-worklist-index.md). The [deeper investigation](02-deeper-investigation.md) and [21-install ledger](repro/full-results.json) supersede the first pass's small-fixture argument.

## The chart and its missing context

[Original post](https://x.com/theo/status/2115338547620401326), dated October 28: Theo describes a $12,000 Mac and $700 PC. The uploaded chart reports 38.6 seconds before Mac optimization, 29.7 seconds after, and 3.8 seconds on Linux. These prices are his account, not verified receipts or complete machine specifications.

[His follow-up screenshot](https://x.com/theo/status/2115338762830184877/photo/1) discloses:

- The task is dependency installation in new worktrees. Each bar averages the machines' individual medians.
- macOS includes Mainbook, LeftBook and ProMini; Linux includes BB-1 and BeeBox.
- Linux uses after-fix samples only; the chart omits that qualification.
- Pooling all samples instead gives 41.4, 29.2 and 4.6 seconds, reported as 6.4×. BeeBox has 233 samples; ProMini has five after-fix samples.

The displayed rounded values give `29.7 / 3.8 = 7.8158…` and `29.2 / 4.6 = 6.3478…`. The screenshot says the first ratio is 7.9 and the pooled ratio 6.4. Underlying unrounded values are unavailable. Write “roughly 8×” rather than claim the displayed arithmetic yields exactly 7.9. Equal-machine weighting is a defensible estimand, not evidence of deception. It answers a different question from weighting every run equally.

The screenshot is an assistant's explanation posted by Theo, not the original measurement log. Treat all chart numbers and method details as reported. It establishes what he disclosed, not correctness of every timing.

## Claim table

| Claim | Source says | Code or test | Evidence state | Inference | Reader consequence |
| --- | --- | --- | --- | --- | --- |
| Linux was roughly 8× faster | Chart and method above | No original harness or raw runs | Reported | Supports a workflow lead, not an OS-wide multiplier | Measure the relevant task |
| Price caption describes a two-machine timing | Caption emphasizes two prices | Follow-up names five machines and mean of medians | Reported | The simplified reading loses material context | Put aggregation in the opening |
| All of the gap is APFS | Older benchmark states that thesis | Different machines, tool versions, caches and security software; Linux fix unspecified | Reported | Causal attribution remains unresolved | Avoid prescribing hardware from this result |
| Git worktree creation is what took 29.7 seconds | Chart title suggests full setup | Footnote and follow-up say dependency install | Reported | Must time Git and installation separately | Do not conflate checkout with installation |
| Current T3 runs setup on worktree creation | `t3.json` | Calls `scripts/setup-worktree.ts`, which launches frozen `vp i` | Code-inspected | A reader-visible new thread can include more than Git | Explain the two steps |
| Store placement matters | Current T3 setup warns about a different filesystem | Compares store and node_modules device IDs after install | Code-inspected | This is a real implementation concern, not proof of Theo's fix | Check placement before assuming chip limits |
| The older test removes network downloads as intended | README prewarms dependencies | pnpm 10.2.1; separate workspace lockfiles; clean then install | Code-inspected / Reported | Cache intent does not prove zero network for every contributor | Do not call every historical row controlled |
| Spotlight explains the whole gap | Some replies suggest excluding the project | Older M5 Pro and M4 Air before/after rows show little install change | Reported | No universal Spotlight cure | Present as a hypothesis to measure |
| Linux VM can help without a different CPU/SSD | Contributor results | M5 Pro 34.9s macOS vs 14.6s OrbStack Linux, guest-native storage | Reported | Software/storage paths matter; not APFS-only isolation | Guest-native storage is a distinct experiment |
| Reusing an installed dependency tree avoids much local file work | pnpm shared-store documentation | Release path creates graph-addressed shared slots and can skip completed immutable slots | Code-inspected | Relevant alternative to changing OS | Keep experimental compatibility limits |
| The original tiny fixture proves the practical response | Historical local comparison | Child-runtime attribution was not verified; superseded during deeper investigation | Superseded | Revised article removes these timings | Use full T3 experiments and compatibility checks instead |

## Competing explanations

| Explanation | Support | Counterevidence or missing test | Verdict |
| --- | --- | --- | --- |
| macOS storage and file monitoring are costly for this workflow | Broad contributor pattern, same-hardware VM reports, Theo's account | Not isolated from installer strategy, versions and guest configuration | Worth measuring; APFS-only causality unproven |
| Shared dependencies make the Mac wait unnecessary | Actual T3 install drops to 0.710 s; local regular files fall from 179,943 to 266 | Web typecheck fails with 64 errors in shared mode, passes in default mode, including a fresh-path direct-compiler control | Reject the setting as a ready-to-use T3 recommendation |
| The price or CPU explains the chart | Caption | Five-machine aggregate and guest results on Apple hardware | Not established |

## Reader questions recovered

Observed the first loaded Relevant-order reply groups plus two PageDown advances, and the filesystem reply's own small thread. This is a selected, platform-ranked sample, not all 140+ replies or a measure of audience prevalence.

| Question | Example source | Article response |
| --- | --- | --- |
| Is this the filesystem or the chip? | [Sam Hulick](https://x.com/SamHulick/status/2115348794325749966) | Both the operation and the installed software path matter; no causal split is available |
| Would Spotlight exclusion fix it? | [Gjin](https://x.com/unwindstack/status/2115413567226982696) | Historical near-null counterexamples; test rather than promise |
| Can copy-on-write worktree tools help? | [Dom](https://x.com/netpro2k/status/2115340209713709161) | Distinguish source checkout from dependency installation; no git-cow reproduction in this draft |
| What about Windows and WSL? | [Modified Bessel Function](https://x.com/theio666/status/2115351005017886896) | Excluded to keep four-to-five-minute scope; no Windows recommendation from this audit |
| Is Theo using ZFS? | [Theo's reply](https://x.com/theo/status/2115349652195389659) | He reports ZFS compression; exact configuration and contribution unmeasured |

## Source rationale

- Theo's original post identifies the claim and prices; his follow-up supplies the aggregation omitted by the headline.
- Theo's filesystem reply establishes his stated ZFS use, not the effect size of compression.
- [Original video](https://www.youtube.com/watch?v=9tGrhrVKCrE), especially 13:46–16:41, connects his explanation to the older public test. Auto-caption numbers and sweeping statements are not adopted as verified measurements.
- The [pinned older README](https://github.com/NullVoxPopuli/disk-perf-git-and-pnpm/blob/535aef76843fe52d6336604111708d884110a0e5/README.md) supplies contributor reports and material counterexamples; its configuration shows that it is a multi-project stress test, not the new chart's disclosed harness.
- [T3 setup](https://github.com/pingdotgg/t3code/blob/125b61954dbba5822a8108c8ca47a4846b4b4328/scripts/setup-worktree.ts) supplies an actual install call and cross-filesystem warning; do not identify it as the measured version.
- [pnpm shared-store guide](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/docs/global-virtual-store.md) describes the proposed response and experimental limits.
- [pnpm slot import](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/create_virtual_dir_by_snapshot.rs#L399) and [layout](https://github.com/pnpm/pnpm/blob/fe4a0c232384289de82be3d502896ca7e070050c/pnpm/crates/deps-restorer/src/virtual_store_layout.rs#L3) establish the implemented distinction between a local tree and shared completed package slots.
- [Git worktree manual](https://git-scm.com/docs/git-worktree) establishes separate checkouts sharing repository objects; it makes no pnpm-install speed promise.

## Positioning

Reader language: “worktree setup slow on Mac,” “pnpm install slow macOS,” “Linux versus Mac for coding agents.” These are query hypotheses, not measured demand. The title should name worktree setup on a Mac; the payoff is a testable response to a specific delay. Do not advertise an independently reproduced 8× comparison or an OS migration verdict.

## Deeper-pass claim disposition

| Claim / alternative | Stage and evidence | Counterevidence or boundary | Disposition |
| --- | --- | --- | --- |
| A large install gap can occur on the same physical Mac | Reproduced: current pinned T3, three cached installs per OS, medians 7.753 s macOS / 1.286 s Linux guest; same 599 requested direct dependencies | CPU allocation, RAM, kernel, filesystem and virtualization differ; no original-chart raw data | Supported within this setup; report about 6×, not the original chart's exact multiplier |
| Linux itself guarantees fast setup | Reproduced: same XFS checkout takes 7.613 s with ext4 cache / 1.380 s with byte-identical XFS cache | Nested XFS is not bare metal; small samples; store placement and file reuse are the tested intervention | Reject unconditional OS claim; show concrete configuration consequence |
| Fast shared-store installation means the application works | Reproduced: 0.710 s Mac installs and two native modules pass, but web typecheck has 64 errors; default passes | Failure persists at a new worktree path with direct compiler; exact resolution defect undiagnosed | Reject for this T3/toolchain combination; keep time and compatibility separate |
| Old pnpm benchmark predicts current T3 | Full 35-project workload reproduced at 44.208 / 7.904 s on Mac/Linux, using Node 24.14.1 and pnpm 10.2.1 | Different dependencies and tools. Genuine pnpm 12 attempt fails frozen configuration validation on mixed peer settings | Keep old result in research; article leads with actual current T3 |
| The historical Linux fix is completely unknown | PR 22718 reports cross-filesystem copies on BB-1 and adds warning; source inspected | Does not prove that every chart's after-fix sample refers to this PR | Narrow the earlier unknown: one concrete project fix identified, chart linkage deferred |
| Upgrading pnpm is the entire remedy | PR 22738 reports about fourfold improvement and current code contains Mac directory-clone optimization | Upgrade predates chart; current T3 still shows an install gap; no version-only controlled measurement succeeded | Explain version relevance without promising a universal upgrade result |
| The VM result requires a new PC | Reproduced on same M5 physical host with guest-native files | Host-mounted folders, remote machines, Windows and bare-metal Apple Linux not tested | A VM is an evidence-backed option to evaluate; no hardware purchase recommendation |
| This makes an agent finish work six or eight times faster | Installation boundary measured; checkout/cleanup/VM startup excluded | No model, whole application build, full suite or entire agent-task timing | Rejected extrapolation |

No material conclusion relies on how much research compute was spent. The useful evidence is the inspected source, controlled interventions, saved samples and failed compatibility check.
