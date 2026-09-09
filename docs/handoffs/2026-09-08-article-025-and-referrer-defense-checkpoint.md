# Article 025 and referrer defense: break checkpoint

September 8, 2026 PDT / September 9 UTC. [TASK-0146](../tasks/TASK-0146-preserve-september-8-analytics-and-article-break-handoff.md). Article 025's requested revisions are complete, published, and verified. The remaining analytics questions have their own tasks; they are not unfinished article acceptance. This checkpoint preserves the evidence and working copies for the owner's break.

## Published work and acceptance

[How I Defend My Analytics Against Referrer Spam](https://gkoreli.com/filter-referrer-spam-without-deleting-analytics-history) keeps its original URL and publication date. The article now explains the public exposure and credibility problem, referrers' useful attribution role, the tested defenses, and the limits of the result. Historical retention and D1 cost support that explanation; neither governs its title or main argument.

| Completed work | Commit and evidence |
|---|---|
| Public-transparency risk and reduced D1 scope | `e0e1fa2`; [editorial record](../../packages/blog/drafts/research/referrer-spam/07-reader-feedback-and-article-focus.md#public-transparency-and-d1-scope-correction) |
| Deterministic guarantees and prior art | `39df6c4`; [separate study](../../packages/blog/drafts/research/referral-defense-guarantees/00-evidence-and-options.md), TASK-0140 complete |
| Referrers explained as useful evidence with limits | `bc5bf19`; TASK-0143 complete |
| Practices taught through tests and production results | `b4e14b5`; TASK-0144 complete |
| Combined article acceptance | `672ac1a`; [generated checks](../../packages/blog/drafts/research/referrer-spam/16-practices-checks.json) and [live receipt](../../packages/blog/drafts/research/referrer-spam/17-practices-live.json) |

The last live check completed at **2026-09-09T02:41:14.803Z**, after Cloudflare build `eb957206-a149-40d8-92b7-726c33b9c034` succeeded at 02:39:36 UTC. The served article body, Markdown, metadata, five tables, and 23 exact prompts matched the isolated build. This is saved acceptance, not a fresh availability check during this handoff.

The article's [passport](../../packages/blog/drafts/research/referrer-spam/00-article-passport.md), [evidence ledger](../../packages/blog/drafts/research/referrer-spam/01-evidence-ledger.md), and [editorial worklist](../../packages/blog/drafts/research/referrer-spam/07-reader-feedback-and-article-focus.md#current-release-and-break-checkpoint) are the entry points. The original September 7 release audit and earlier D1-heavy title/metadata decisions are historical, with supersession notes. Do not resume from their original word or prompt counts.

## Insights to preserve

- **Useful evidence needs calibrated language.** Referrers help explain traffic sources. Forgery and omission limit what they establish; those limits do not make every referrer meaningless. Suspicion of this cluster comes from its observed pattern and local review. The owner's assessment of the destination is distinct from an independent security diagnosis or proof that no real click ever occurred.
- **Public transparency needs a publication policy.** Arbitrary hostnames should not gain public exposure simply by arriving in a request. Reviewed name visibility and consistent exclusions are separate controls. A name approved for display does not authenticate requests that claim it.
- **Teach the result beside the practice.** The article now connects rotating-name fixtures, complete-list evaluator checks, the all-excluded state, tamper rejection, and scoped live reconciliation to the choices they support. Linked artifacts retain the full method. Synthetic behavior, a fixed production comparison, and later live activation remain separate evidence.
- **Measurements keep their units and windows.** The original 35-view ranking, the 972 = 937 + 35 fixed comparison, and later live populations are different captures. The old report's 182,388 D1 `rows_read` was query work across nine statements, not a database row count. The dated recovery capture found 7,010 stored observations and 33,259 reads for the identical report; neither figure is a permanent live count.

These corrections are recorded in the article and governing instructions. They do not establish a measured human-detection accuracy rate or complete eradication of referrer spam.

## Frozen research and private feedback

Article 025's [accounting note](../../packages/blog/drafts/research/referrer-spam/10-research-footprint.md) and [manifest](../../packages/blog/drafts/research/referrer-spam/research-footprint.json) remain frozen at **71,572,616 tokens, four sessions, six Markdown artifacts, and the first 18 prompts**. The selected usage ends at **2026-09-09T01:35:07.268Z**. The current prompt page has 23 messages; later revisions, acceptance, and this handoff fall outside that measurement. Do not rerun the extractor to force those counts to agree.

Article 024 already includes **22,698,893** tokens from earlier prefixes of three included sessions. The [overlap record](../../packages/blog/drafts/research/referrer-spam/research-footprint-overlap.json) documents this; the article totals cannot be added. Both frozen manifests and the overlap record are unchanged. Their private session logs remain outside Git. Public commitments make the accounting auditable by the author; readers cannot reconstruct it without those logs.

The X feedback is preserved privately at `/Users/goga/.local/share/gkoreli/editorial-feedback/2026-09-08-andrew-healey-x-blog-editorial-advice.md`: 3,271 bytes, SHA-256 `fcfd38b0f3e20f470ca2fda69ce04873a9a25614a59ed109be4772ad1552b0b4`. The [feedback archive record](../../packages/blog/drafts/research/referrer-spam/07-reader-feedback-and-article-focus.md#original-feedback-archive) preserves its receipt date, use, and privacy boundary. The original root `x-message.md` was moved; do not recreate or publish it. This bookkeeping request does not add a shaping prompt.

## Engineering state and what remains

The versioned Matomo/local reporting policy, reviewed public names, historical exclusions, and D1 shared assessment/cache are deployed. [FLDR-0009](../folders/FLDR-0009.md) links the decisions and activation evidence. The guarantees study distinguishes those completed controls from proposed attestation or admission experiments. Approved-name impersonation, missing headers, and automation that passes filters remain possible.

The separate **referrer-context implementation is also accepted**, not pending deployment: code `c338059`, migration 0009, report version `2026-09-09.1`, and [release receipt](../../packages/blog/drafts/research/article-024-hacker-news/07-transition-release-acceptance.md). New observations distinguish internal, external, absent, and unusable context; historical nulls stay unknown. Nine deliberately excluded scripted requests verified collection and path minimization. The local desktop UI check and those scripted headers do not establish real-browser navigation behavior, organic readership, or complete funnels. Reuse the receipt instead of repeating the migration or probes.

| Open or proposed work | Resume boundary |
|---|---|
| [TASK-0120](../tasks/TASK-0120.md): browser/edge/RUM calibration | Inspect retained trace evidence and execute controlled browser cases with owner/test exclusion. Start locally. The 95-versus-14 historical discrepancy remains a measurement question, not a requirement to make counters converge. |
| [TASK-0135](../tasks/TASK-0135-measure-article-024-hacker-news-launch-and-choose-the-follow.md): HN follow-up | Referrer capture is accepted; organic observations and the declared launch-window review remain. The review target is **September 14, 05:13:22 UTC**. No automatic capture or review job is implied. |
| [TASK-0119](../tasks/TASK-0119.md): agent identity/purpose | Preserve the narrow signer/role implementation question. A valid signature does not establish that a human initiated a request. |
| [TASK-0141](../tasks/TASK-0141-compare-blog-analytics-with-matomo-and-research-agent.md): Matomo and agent-subscription research | The requested research is **done**. Its [proposed experiments](../../packages/blog/drafts/research/agent-readership/04-experiments-and-decision.md) have not run; they do not reopen completed research or authorize an enrollment. |
| [TASK-0132](../tasks/TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md): next publication-lane research | The owner's high-priority exploration remains. Start with the [existing Trellner audit](../../packages/blog/drafts/research/agent-native-lane/02-trellner-manufactured-sources.md), available methods/data, and a bounded experiment with an access/cost estimate. |
| Article 025 feedback and discovery | Review on **September 28**, or sooner for a concrete factual correction. Human draft feedback remains an opportunity, not a release gate. No social message is scheduled or authorized by this checkpoint. |

On return, choose the lane deliberately: TASK-0120 is the next bounded analytics calibration; TASK-0132 retains the owner's next-research priority. Article 024 and article 025 need no further expansion merely to absorb unfinished studies. The [analytics and agent-research checkpoint](2026-09-09-analytics-and-agent-research-checkpoint.md) owns the broader HN/Matomo thread.

Newsletter work has a separate [current handoff](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md). Its session recorded a completed ordinary signup/confirmation flow in `f6185f5`; Gmail Spam placement, provider webhook setup, diagnostic infrastructure, and historical recovery remain separately tracked. Reuse that session's acceptance instead of treating older invalid-secret or acceptance-pending captures as current. This handoff performed no signup test or provider change.

## Working-copy preservation and recovery

At **2026-09-09T02:53:08.159992+00:00**, all eight linked worktrees were inventoried. **58 source/evidence files** from five dirty worktrees were copied to private durable storage with per-file hashes, each checkout's base commit, binary tracked diff, and original Git status. Three worktrees were clean. Dependency links and one private runtime configuration file were excluded. No credentials were copied into the archive or committed.

Archive: `/Users/goga/.local/share/gkoreli/workspace-checkpoints/analytics-break-20260909T025308Z`. Its private `manifest.json` has SHA-256 `7760923c0447df79cd85e90d5c22cece56a1d8d03254823203648e6c135739b3`. The [public inventory receipt](2026-09-08-analytics-workspace.json) contains paths, bases, counts, exclusions, and the commitment. Status remained stable during each capture; this was not an atomic snapshot of all concurrent sessions.

| Checkout | Recovery meaning |
|---|---|
| Main blog checkout | Base `f6185f5`; the one copied file was the newly created TASK-0146. Subsequent documentation work is preserved by commits. Concurrent sessions own their changes. |
| `/private/tmp/blog-024-release` | 24 older source/evidence files at base `1737fa9`; compare with current `main` before reuse. The earlier September 7 archive remains valid. |
| `/private/tmp/blog-radar07-preview` | Nine source files at base `5fc2dc5`; preserved preview work. Six dependency links were excluded. |
| `article-025-practices-20260909` | Six build copies at base `c42ab3a`. The authoritative revision is already published in `b4e14b5`; older copied notes lack its final receipt. |
| `referrer-context-20260909` | Eighteen implementation/test copies at base `c235029`. The implementation is already committed in `c338059` and accepted. Its private `.dev.vars` was excluded. |
| `blog-pr`, `subscription-bombing-20260909`, `blog-analytics-calibration` | Clean at capture; exact paths and bases are in the inventory receipt. |

To recover, verify the private manifest and selected file hashes, then create a fresh checkout at that worktree's recorded base. Each archive entry contains `files/` with repository-relative paths, `tracked.patch`, and `status.bin`. Copy the saved files into the fresh checkout and inspect recorded deletions; use the patch as an alternative for tracked changes, not an additional application over those full file copies. Compare the result with current `main` before selecting anything to merge. Excluded runtime configuration remains in its original private location. No worktree was reset or deleted and no shared server was stopped.

## Documentation verification

This pass corrects current-status routing, labels superseded article decisions, records the already accepted referrer-context release, and clarifies evidence and shared-build instructions. The independent read-only review found no material status or evidence-scope issue.

Local validation passed for **11 Markdown documents, 145 local links, and 11 heading fragments**. The private archive's manifest, all **58 copied files**, and eight tracked patches match their recorded hashes. The private X message also matches its preserved bytes and hash. Article 025 and its 23 prompts match release `b4e14b5`; both frozen article manifests and the overlap record are unchanged, and the research directory still has the same six committed Markdown paths. Diff whitespace checks passed. No runtime build, production SQL, new traffic experiment, footprint remeasurement, or external message was performed for this documentation-only checkpoint. Task completion records the commit.
