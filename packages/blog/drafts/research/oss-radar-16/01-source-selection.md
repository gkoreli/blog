# Source selection — November 16

## Population and method

The pool was fixed as eight named public repositories before qualification: Hermes Agent, NemoClaw, Plannotator, Bright Lines, CodeRelay, browser-ai, InsForge and GoDoxy. The [normalized inventory](inventory-2026-11-16.json) is the complete population for this selection. Repository metadata, release objects, selected commits, root files and actual license text were checked for all eight on November 16. No popularity threshold or score ordering was used.

| Public origin | Candidates | Why these leads entered the pool |
| --- | --- | --- |
| Existing [source portfolio](../../../../../docs/worklist/oss-radar-weekly/sources.md) | Hermes Agent, NemoClaw, Plannotator | Independently verified public projects with distinct agent-engineering jobs; none had earned a featured entry yet |
| [November 14 Show HN scout](../../../../../docs/worklist/oss-radar-weekly/scouting/2026-11-14.md) | Bright Lines, CodeRelay | Existing bounded guard research and an untested contract-handoff question. [CodeRelay's launch](https://news.ycombinator.com/item?id=50498524) and [Bright Lines' launch](https://news.ycombinator.com/item?id=50496350) are discovery links; the historical no-comment observation is not fresh testimony |
| [Radar #1](../../../posts/002-oss-radar-01-vercel-winter-2026-cohort.md) | browser-ai, InsForge, GoDoxy | Possible returns where current source can challenge the original account. An earlier article is not a historical code baseline |

The three GitHub leads are public identities checked independently of the personal feed. No recommendation relationships, feed page capture or private repository information enters this record. The pool favors projects already encountered, English-language source/discussions, current public development and trials feasible on an owned workstation. It cannot establish broader ecosystem prevalence. These are meaningful selection biases, not representative sampling.

## Version and license decisions

Use released source for Hermes **v0.23.2**, Plannotator **v0.28.66**, browser-ai **@browser-ai/core@3.0.4**, InsForge **v2.3.5** and GoDoxy **v0.34.0**. All resolve to exact commits in the inventory. Current default branches may be ahead; later activity does not silently become part of a released-source trial.

NemoClaw and CodeRelay are pinned default-branch snapshots. The returned NemoClaw release collection contains a CI prerelease, not an ordinary stable release. CodeRelay's returned `main-latest` prerelease is dated November 1, while the selected source is November 13. Neither snapshot is represented here as a tested installer or packaged release. Artifact/source mapping remains required before installation advice.

Actual licenses were read rather than inferred solely from GitHub's classification. Plannotator offers MIT **or** Apache-2.0, following its [February relicense](https://github.com/backnotprop/plannotator/pull/144). Browser-ai's `LICENSE` contains an Apache-2.0 notice; GoDoxy's contains MIT terms and notices for Go-derived files, despite GitHub returning `NOASSERTION` for each. CodeRelay retains MIT/T3 provenance. This checks project source licensing; model weights, providers and deployment services still need review when a trial uses them.

## Selected research set

**Hermes Agent, NemoClaw, Plannotator, CodeRelay and GoDoxy** now receive the week's sustained participant work. This is a bounded research set, not an accepted article roster.

- Hermes exposes an inspectable distinction between curated prompt memory, skill files and optional external memory services. Its central claim is consequential enough to test beyond a chat demonstration.
- NemoClaw makes OpenShell an explicit dependency and policy authority. It is worth investigating which operating responsibilities the integration actually takes over, rather than crediting the wrapper with the entire sandbox boundary.
- Plannotator's present Inbox and session routing make delivery ownership as consequential as annotation. The reply-routing report provides a concrete useful/failure comparison.
- CodeRelay's contract handoff is already concrete enough for a provider-free real HTTP/store trial. Its version-sensitive acceptance path supplies a precise next experiment.
- GoDoxy earns the return slot because the November 16 release and current reports concern everyday operation: scheduled downtime, startup and certificate configuration. The historical checkpoint already contains Proxmox and idle sleep; those are not new discoveries or evidence of a pivot.

**Bright Lines remains a comparator.** Its revision is unchanged from the accepted scout. The passed upstream suite and six direct-process controls should be reused, with their host-level limits. Repeating them would not resolve the missing actual-host behavior or workflow cost. Do not turn its guard explanation into a one-project Radar.

**Browser-ai and InsForge remain reserves.** Both have public current source and recovered possible historical checkpoints, but no present called-path/history comparison or meaningful experiment in this session. GoDoxy has the more immediate operational question for the return slot. This is an allocation decision, not a negative assessment of either reserve.

## Return-visit baseline

For each possible return, queried the default branch's newest commit before **2026-03-20T00:00:00Z**, after #1's March 19 date. This reconstructs a day-end checkpoint; the exact code used for the original article was not recorded and is unknown.

| Candidate | Reconstructed checkpoint | Work reached |
| --- | --- | --- |
| browser-ai | [`8b9108c4d5456e472b6067d86915c37fb39b3f1c`](https://github.com/jakobhoeg/browser-ai/commit/8b9108c4d5456e472b6067d86915c37fb39b3f1c), March 18, 16:11:38 UTC | Commit recovered; historical source comparison unperformed |
| InsForge | [`928929d03bc67752509705a8d7788139657dd632`](https://github.com/InsForge/insforge/commit/928929d03bc67752509705a8d7788139657dd632), March 19, 23:51:15 UTC | Commit recovered; historical source comparison unperformed |
| GoDoxy | [`213e4a5cdb635bf1f5f5985fd04515ad592497d5`](https://github.com/yusing/godoxy/commit/213e4a5cdb635bf1f5f5985fd04515ad592497d5), March 19, 06:55:47 UTC | Historical/current READMEs compared; current changed paths inspected. A full historical implementation comparison remains unfinished |

The GoDoxy comparison challenges novelty claims: route discovery, Proxmox integration, lifecycle control and idle sleep were already documented at the reconstructed checkpoint. No operating-cost savings, performance superiority or exclusive market position were measured. The new entry must earn a present judgment through current behavior.

## Acceptance boundary

Monday's source-selection milestone is complete. Five participants are selected for diligence, three have explicit other dispositions, source/release ambiguity is recorded and one actual project path has been exercised. The [dossiers](02-participant-dossiers.md) deliberately leave consequential work open. There is no manuscript or publication readiness claim.
