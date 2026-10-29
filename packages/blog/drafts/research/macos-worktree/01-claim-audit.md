# Claims, reader questions and source rationale

Checked October 28–29, 2026. Current disposition: [cross-repository methods and hardened controls](04-cross-repository-and-hardened-mitigations.md), [90-trial and validation ledger](repro/cross-repo-results.json), and the current table at the end of this file. The earlier 30-trial T3 block is retained separately; its compiler-path workaround is superseded by tested dependency metadata. Historical tables below preserve how the evidence changed.

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

## Competing explanations from the previous pass (historical)

The shared-store rejection in this table was the correct boundary before diagnosis; the current disposition below records the tested repair.

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

<a id="deeper-pass-claim-disposition"></a>

## Deeper-pass claim disposition (historical)

This table records the previous iteration. Its cleaned-directory timings and undiagnosed compatibility failure are superseded for the revised article by the current validation below.

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

## Current failure-diagnosis and validation disposition

Historical previous iteration; the cross-repository disposition below is current. The heading is retained so historical receipts keep working links.

| Claim / alternative | Stage and evidence | Counterevidence or boundary | Disposition |
| --- | --- | --- | --- |
| The shared-store typecheck failure is specific to macOS | Reproduced: unchanged shared layouts produce the same 64 errors on macOS and Linux | Installation itself succeeds; this failure is in declaration lookup | Reject OS-specific framing |
| Shared dependencies lose React's declaration lookup | Reproduced: traces follow importing libraries into the external store and resolve React to JavaScript; valid reduced case fails under both native and official JS compilers | React and its declarations are installed, both version 19.3.0 | Supported for the inspected library imports and tested web project |
| The repair merely suppresses errors | Reproduced: separate React declaration mapping clears all 64 errors on both OSes; invalid numeric className is still rejected by both compilers | Fourteen reduced cases do not establish universal workspace compatibility | Reject suppression explanation; preserve strictness and base config |
| Calling the compiler directly caused the failure | Reproduced: pnpm-aware launcher with shared mode explicitly enabled still gives 64 errors | Runtime loader hooks do not guarantee every compiler's declaration lookup | Reject for this control |
| preserveSymlinks or typeRoots fixes it | Reproduced: full-project results are 2,863 and 64 errors respectively; typeRoots also fails both reduced compiler cases | Compiler options have broader effects than the missing React lookup | Reject these remedies for the tested toolchain |
| Shared dependencies can work in this T3 web project | Reproduced: all ten new shared trials pass native checks and the repaired web typecheck; unit suites pass 4,302 tests on both OSes; web builds pass; exact copyable compiler-only recipe passes with unchanged base config | Full Mac browser suites each pass 471/472 tests and fail the same scrolling assertion; same failure repeats in isolation. Mobile/desktop acceptance not tested. Shared writes can affect other checkouts | Tested web workaround with stated limits, not general production acceptance |
| macOS is about four times slower in the stronger trial | Reproduced: five fresh worktrees per variant/OS, 30 trials; default medians 8.120 / 2.098 s, ratio 3.87 | One M5 host; Linux is a 4-vCPU/4-GiB VM. Other host services not isolated. Earlier cleaned-directory series differs | Supported within the current method; retain all samples and ranges |
| Default thread policy explains the whole gap | Code-inspected: pinned pnpm global pool expects 16 Mac / 8 Linux workers. Reproduced: explicit four-worker medians 6.548 / 2.019 s | Mac median improves about 19%, but ratio remains 3.24. This control does not equalize all CPU/RAM resources | Partial contribution; reject complete explanation |
| Current Mac pnpm lacks directory cloning | Observed diagnostic: 1,621 successful distinct directory clones; native process sample contains clonefileat worker stacks | Counts span threads, not calls or wall-time shares. Diagnostic timings excluded | Reject absence claim; current optimization is active |
| Repeated package-tree creation contributes to Mac cost | Source-inspected import strategy plus clone trace, sampled stacks, content/inode probe and 0.943-second shared median | Sharing changes multiple layout operations; no pure APFS-versus-kernel decomposition. Linux hardlinks and Mac clones differ in write semantics | Supported bounded mechanism; do not assign the entire gap to APFS |
| Linux guarantees fast installation regardless of cache location | Separate earlier XFS control: 7.613 s with ext4 cache, 1.380 s after byte-identical cache moved to XFS | Three cleaned-directory trials; nested filesystem; not part of the new 30-run series | Retain as separate placement lesson |
| Install speed predicts complete agent-task speed | Only installer wall time is measured; typechecks and other validation are outside the timer | Model calls, checkout, app execution and end-to-end task durations unmeasured | Reject extrapolation |

The source and requested dependency inventory match in all 30 new trials. The revised article uses those fresh-path medians, preserves the known browser failure, and links the separate typecheck-only recipe. No material conclusion relies on research compute volume.


## Current cross-repository disposition

| Claim / alternative | Evidence | Limit / counterevidence | Disposition |
| --- | --- | --- | --- |
| The install gap extends beyond T3 | Ninety added fresh-worktree installs, five per project/configuration/platform: Next 4.557/1.559 s, Vite 1.818/0.477 s, SvelteKit 0.589/0.135 s default Mac/Linux medians | Single M5 host, resource-limited guest, different pinned pnpm versions across projects; no original-chart raw data | Supported inside each tested project; no universal OS ratio |
| A large ratio always means a large practical wait | SvelteKit ratio exceeds four but absolute median difference is 0.455 s | Installed package/workspace size and script work vary | Publish absolute times, not only ratios |
| Worker count explains the whole gap | Four workers reduce all four Mac medians across the separate test blocks | Linux SvelteKit is slower with four; substantial Mac gap remains | Supported bounded setting to measure; not a universal prescription |
| Default import strategies do the same work | Source and inode checks: ordinary Linux packages begin with hardlinks; Mac with independent clones | Known lifecycle-build/patch packages already get private imports | Reject equivalence; preserve write semantics in comparison |
| Runtime tool writes cannot affect the package cache | ncc source and exact tarball audit; Linux build changes four cache files sharing CAS inodes; reduced compilation changes three and breaks the next offline install | Mac installed files change while original CAS bytes remain intact; not evidence about every package or attacker model | Reproduced specific cache mutation mechanism |
| Disabling integrity verification is a performance fix | Restore exact ncc package and same failed checkout completes offline | Disabling validation would hide changed package bytes | Reject; keep integrity checks |
| Independent file imports prevent the reproduced failure | Exact ncc compilation with clone-or-copy keeps CAS unchanged and next offline install passes | ext4 copies bytes; cloning availability/performance varies by filesystem | Supported correctness option; no invented full-repository speed median |
| Shared packages are a universal drop-in | Fast installs in all three new repositories | Vite and Next typechecks fail; T3 previously failed; SvelteKit core checks pass unchanged | Reject universal compatibility |
| Compiler aliases are required for T3 | Four optional React-type peers clear all 64 errors with original compiler settings; two React version controls preserve invalid-prop rejection | Specific tested web graph; metadata is version-scoped and frozen | Prefer dependency metadata over compiler-path workaround |
| Metadata fixes merely upgrade packages until they work | All package keys and resolution entries unchanged: T3 2,069; Vite 1,345; Next 3,685 | Peer identities, declared dependency edges and locks intentionally change | Reject upgrade/suppression explanation |
| Full checks pass everywhere after repair | T3 types/4,302 unit/build pass both OSes; Vite full types/build/1,089 unit pass both; Kit core types/1,116 unit pass unchanged; Next Mac build/root types/10 selected tests pass | Next complete Linux build remains unaccepted; known earlier T3 browser 471/472 in both layouts | Keep per-project gates and exclusions explicit |
| Passing shared tests accidentally use the warmed source | Workspace resolution audits in current fresh checkouts pass for all three repositories on both OSes | Does not certify every possible dynamic import or edited branch | Reject this explanation for the inspected workspace paths |
| A read-only store alone handles every new T3 worktree | Reduced ncc compile/second install passes against actual read-only snapshot | Full T3 install refuses a new path-derived mobile local-package slot | Reject drop-in recommendation; do not filter out a workspace to obtain green |
| Private copy-on-write views can preserve function and isolation | Two concurrent views per OS; full T3 installs, normal types, unit/build pass; A's package write leaves B unchanged; Mac base-image hash unchanged; manifest/lock mismatch rejected; ncc controls pass | Prototype setup/mount costs, diagnostic timings, backing-source trust, no general Mac speed win | Functional bounded prototype, not turnkey production cache manager |
| Installation improvement proves whole-agent acceleration | Only installer wall time measured; checks separate | No complete model/task benchmark | Reject extrapolation |

The final article may publish these findings now with the negative results intact. Current production publication must still be measured after deployment; research completion does not prove a live route.
