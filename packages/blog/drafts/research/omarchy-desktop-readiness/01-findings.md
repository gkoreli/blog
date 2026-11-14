# What Omarchy changes, and what desktop readiness still requires

Evidence reviewed November 14, 2026, America/Los_Angeles. This is a research synthesis and a proposed article direction, not a hands-on Omarchy review or a recommendation to replace a particular computer.

Omarchy has a credible case as a developer workstation for people who like its defaults and accept responsibility for recovery. The evidence reviewed here does not establish that it is a dependable replacement for every Mac workflow. Its distinctive contribution is the coordinated experience around Linux: setup, desktop conventions, maintenance, agent integration, hardware work and a recognizable community. Linux execution benefits and whole-laptop readiness require different evidence.

## The existing benchmark supplies a useful starting point

The [published dependency-install investigation](../../../posts/032-why-worktree-setup-is-slow-on-macos.md) measured T3 Code installs at 8.12 seconds on macOS and 2.10 seconds inside a Linux VM on the same M5 Mac. Each median used five runs, with populated caches, pinned runtimes and offline installs. The checkout and package cache lived on the guest's own ext4 filesystem. Different CPU and memory allocations remained part of the comparison.

That result supplies a reason to run this workload on Linux. It does not measure Omarchy, a Dell XPS, battery life, uninterrupted work or developer productivity. It also already demonstrates a route to the measured benefit while retaining macOS as the host. Four installer workers reduced the native Mac median to 6.55 seconds. A separate Linux test exposed dependency writes propagating into a hardlinked package cache; private copies prevented that failure. Faster setup and correct isolation must be assessed together.

The useful next question is how much the desktop changes the entire working day. Repeated install savings, setup effort, maintenance time, recovery, meetings, peripherals and unavailable application features all contribute. A performance result cannot settle that decision by itself.

## Why the product makes sense

**It removes a large set of assembly decisions.** The [manual](https://omarchy.org/manual/) describes an integrated Arch Linux, Hyprland and Quickshell system with a deliberately selected application set. A user who likes that selection gets a common vocabulary and a usable starting point. Recreating the pieces independently is possible, but the assembly and ongoing integration are work. For someone whose priorities differ sharply, the same choices can become constraints.

**The maintenance path belongs to the product.** The [update manual](https://omarchy.org/manual/updates/) documents package updates, configuration migrations and snapshots as one operation. Stable uses an Arch mirror about a month behind current Arch; more adventurous channels accept newer packages. Direct pacman/yay system upgrades are guarded because they omit the integrated workflow. This reduces some integration risk while making Omarchy's maintenance policy a dependency of the experience.

**Agents can work against an inspectable, shared surface.** In the [v4.5.0 source](https://github.com/omacom/omarchy/tree/ac2690cd7be4f47e4a255f5e2e78d904d436b068), Omarchy supplies both an [agent launcher](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/bin/omarchy-agent) and an [end-user customization skill](https://github.com/omacom/omarchy/blob/ac2690cd7be4f47e4a255f5e2e78d904d436b068/default/agents/skills/omarchy/SKILL.md). The latter distinguishes packaged files from user configuration and points to commands, hooks, themes and plugins. These files were inspected as evidence, not adopted as instructions for this research.

The inference is that shared conventions make assistance and customization easier to repeat. The inspected files do not establish a comparative repair-success rate or an intrinsically more capable model. Agents also work on other operating systems. Omarchy makes them prominent in the workflow and exposes much of its own interface to modification.

**Hardware integration has identifiable owners.** Dell's [April 30 account](https://www.dell.com/en-us/blog/year-of-the-linux-laptop-omarchy-on-xps/) describes collaboration with Intel and Omarchy on Panther Lake XPS hardware. Dell reports roughly twenty kernel backports, camera integration and power-management work, with fixes intended for upstream. This is a concrete vendor account of engineering work. It is not an independent reliability trial or sales study. The same article describes 37signals' technical team as moving to Omarchy and XPS equipment; that wording does not establish a completed, measured fleet migration.

The [foundation staff page](https://omarchy.org/staff/) lists four full-time roles covering kernel, shell, infrastructure, and design/community. Its [foundation overview](https://omarchy.org/foundation/) identifies funding for Omarchy and underlying projects. Those are useful continuity signals, with no guarantee about long-term outcomes.

**The experience is easy to demonstrate and share.** Coordinated appearance, keyboard workflows, plugins and visible agent-made changes give supporters concrete things to show. The [doctrine](https://omarchy.org/doctrine/) explicitly combines aesthetics, ownership, agent participation and centralized direction. Interpreting this as a source of enthusiasm is reasonable; this research did not measure the causal effect of branding, individual influencers or recommendation algorithms.

## What the current momentum establishes

The latest stable GitHub release retrieved was [v4.5.0](https://github.com/omacom/omarchy/releases/tag/v4.5.0), published November 5 at 05:36:53 UTC, or November 4 in Pacific time. The [announcement](https://omarchy.org/news/2026/11/omarchy-4-5/) is dated November 4. Its practical changes include floating workspaces with a dock, a native installer for selected Apple Silicon Macs, additional language/input support and captive-portal handling. It also integrates more agent-account and usage controls. These are documented shipped features, not features independently exercised in this research.

The maintainers report more than 740 merged pull requests and more than 180 contributors for the release. Those counts indicate development activity within the stated window; they do not measure quality or adoption.

On August 28 the project [reported 100,000 ISO downloads in a week](https://omarchy.org/news/2026/08/100000-downloads-in-a-week/). That is a maintainer-reported distribution metric. It cannot be converted into unique people, completed installations, daily use or retention.

The [foundation announcement](https://omarchy.org/news/2026/08/omacom-foundation-launches-with-8-million/) now displays approximately $23.7 million in cumulative pledges and donations. Its August 21 publication date predates multiple listed updates. The current total includes multiyear commitments and in-kind tokens/compute; it must not be described as the original launch amount or an audited cash balance. It names **Michael Dell among individual Founding Patrons contributing $1 million**. That is a more precise attribution than calling the pledge a Dell corporate donation.

No incremental XPS sales, purchaser-attribution study, contribution margin or donation-payback calculation was recovered in this bounded review. A switch announcement can show interest or stated intent. Establishing commercial payback would require incremental purchases and their economic contribution, with an appropriate counterfactual. Dell's integration account also predates the foundation announcement, so the pledge should not be presented as the event that initiated that engineering work.

## Readiness depends on the actual migration

| Decision | Supported assessment | What remains to establish |
| --- | --- | --- |
| Use Linux for repeated dependency installs | The existing M5/VM investigation supplies measured evidence for four repositories under its conditions. | Current project, cache layout, correctness and total workflow cost. |
| Use Omarchy daily on compatible PC hardware | There are concrete firsthand success reports and vendor integration work. | Exact model, dock, displays, conferencing, sleep, updates and recovery under the intended workload. |
| Install natively on an M1/M2 Mac | The installer admits many models; firsthand users report daily use. | A model-specific feature check and independent acceptance. Admission is not exhaustive hardware qualification. |
| Treat advertised M3/Neo support as fully qualified | The inspected installer source marks these boards untested. | Physical qualification and the signed catalog/image offered at install time. |
| Install natively on an M5 Mac | The inspected public installer excludes M4 and later. | A future supported release and physical qualification. A VM is a separate route. |
| Standardize a company or specialist workflow | This review supplies no fleet acceptance result. | Required applications/features, management, policy, support ownership and recovery evidence. |

The Apple installer evidence is unusually useful. At [commit c07e54c](https://github.com/omacom/omarchy-mac-installer/blob/c07e54c2134a8ec1415e7e2b917589ae1d3d7dc9/scripts/supported-models.json), the admitted-board list includes M3 and Neo boards, but a separate `untested` map marks them as unqualified. The [installer README](https://github.com/omacom/omarchy-mac-installer/blob/c07e54c2134a8ec1415e7e2b917589ae1d3d7dc9/README.md#supported-macs) explains this distinction, blocks M4 and later public installs and says every published installer release is a GitHub prerelease. A stable OS channel and a prerelease installer can coexist.

Documentation also disagrees across surfaces. The general [Mac-support chapter](https://omarchy.org/manual/mac-support/) still says M-series installs are unsupported, contrary to the current release and installer. Parts of the separate [Mac hardware manual](https://github.com/omacom/omarchy-mac-pkgs/blob/main/mac-manual/content/12-hardware.md) and [status page](https://github.com/omacom/omarchy-mac-pkgs/blob/main/mac-manual/content/14-status.md) retain first-release language. The dossier does not use those older categorical exclusions to override the newer installer evidence. Nor does it assume the source matrix proves what every currently served signed catalog enables.

## The remaining costs are concrete

**Recovery covers less than the whole machine.** The [snapshot manual](https://omarchy.org/manual/system-snapshots/) says restoration reverts the root filesystem, while `/home`, user configuration and migration bookkeeping survive. It also describes the resulting configuration and migration edge cases. This is useful recovery infrastructure with an explicit boundary, rather than complete personal-data backup or guaranteed return to a prior total state.

**Current reports still involve ordinary laptop essentials.** On November 14, [issue #18920](https://github.com/omacom/omarchy/issues/18920) was open with an Acer firmware/boot-entry failure after an update; the reporter could not determine whether the update removed the entry or exposed an earlier fragile setup. [Issue #18896](https://github.com/omacom/omarchy/issues/18896), also open, reported a Quickshell restart loop during multi-monitor display blanking on 4.5.0-3. These are reported failure modes, not independently reproduced causes or population failure rates. Neither is evidence against the Dell XPS specifically.

A [November 13 boot-delay report](https://www.reddit.com/r/omarchy/comments/1xvha8e/omarchy_45_bar_and_wallpaper_take_25s_to_appear/) links a startup delay to the interaction of a locally added LTE service and the desktop's power-profile startup. The author revised the diagnosis after additional observations. It is a useful example of repair and integration cost, with limited trial counts and custom configuration; it is not a clean default-install benchmark.

**Repair authority deserves an explicit choice.** The pinned launcher selects automatic or permissive modes for several agents. The [security manual](https://omarchy.org/manual/security/) separately documents optional timed or permanent passwordless sudo. An agent's approval mode and root authorization are different controls. Omarchy does not thereby run every agent as root, and passwordless sudo must not be described as an unavoidable default. Granting more authority can make repair easier while increasing the consequences of mistakes.

**Stable packaging and security freshness need a reconciled policy.** The update manual describes an approximately one-month Arch delay; the security chapter promises rapidly available current fixes. Those statements need more precise reconciliation before making a broad security-service claim. A sampled [kernel security report](https://github.com/omacom/omarchy-pkgs/issues/1780) was closed and its reporter [confirmed the fix after updating](https://github.com/omacom/omarchy-pkgs/issues/1780#issuecomment-6617864052). It would be wrong to repeat that historical report as a current unpatched vulnerability. This review did not audit package-wide patch latency.

**Upstream work remains essential.** Asahi's [November 7 progress report](https://asahilinux.org/2026/11/progress-report-7-3/) describes continuing Apple-platform driver work and specific upstream limitations. Downstream Aurora work and Omarchy packaging need their own evidence; Asahi's matrix alone does not prove the state of a different downstream kernel. The same report expresses concern about unattributed reuse and announces a copyleft transition without naming the accused projects. This establishes an upstream concern and a licensing decision, not an adjudicated finding against Omarchy.

## What the public sentiment actually says

The [discussion-source review](02-public-sentiment.md) supports several recurring positions: relief at avoiding desktop assembly, affection for the integrated experience, appreciation paired with maintenance costs, dissatisfaction when deep customization fights the defaults, and objections involving leadership, governance or upstream relationships. Some firsthand positive reports explicitly disagree with the founder. Some negative remarks describe no hands-on use. Technical experience and willingness to associate with the project must be read separately.

This was a purposive English-language review, not a survey. It does not support a positive/negative percentage or an inference that all Linux users, developers or Mac owners share a view. Search rankings, community selection, visible-comment ranking and incomplete replies all affect what was available.

## A defensible article direction

Working title: **Linux Won My Benchmark. Would Omarchy Win My Workday?**

The existing measurement gives the article an owned starting point. The new contribution would be the cost of adopting a complete working environment: what Omarchy makes easier, what still needs manual judgment, and whether agents reduce repair time enough to change the decision. A researched explanation is supportable now. A personal migration verdict requires actual use.

A bounded follow-up, proposed rather than scheduled:

1. Preserve the benchmark's conditions and compare the tuned native Mac path with Linux on the VM's own filesystem. Measure installation and the checks that protect correctness.
2. Use a supported physical machine for the desktop trial; record its exact hardware, OS/package versions and update channel. A VM can test the interface but cannot qualify the laptop's physical sleep, camera or docks.
3. Exercise real work: repository setup, builds, concurrent agents, calls and screen sharing, document editing, external displays, suspend/resume and an update/recovery cycle.
4. Log interventions, unavailable features and recovery time alongside time saved. Keep agent-assisted fixes separate from faults avoided. Do not induce failures that risk personal data.
5. Report the outcome for that workflow and machine. Keep enjoyment, autonomy, measured performance and reliability as distinct reasons to choose it.

The next bounded editorial action is to choose between a sourced explanatory article and a hands-on comparison. No article, hardware purchase, repartitioning or migration was executed by this research.
