# Article 024, analytics research, and workspace recovery

September 7 UTC / September 6 PDT, 2026. This checkpoint preserves the publication decisions and unfinished studies before the author's break. Read it with the linked task receipts; dated captures are not live service-health checks. No background experiment, scheduled capture, or social publication was started by this bookkeeping.

## Article 024 is finished for this revision

**Bot Detection Without JavaScript: What My Blog Measured** is published at its retained canonical URL: [gkoreli.com/how-i-separate-readers-from-bots-without-javascript](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript). Keep the URL. The title identifies the subject and the firsthand measurement boundary; there is no measured pronoun, ranking, or citation advantage. Keep the title stable through September 28 unless a factual correction or repeated misleading reader expectations justify a change. [Title decision](../../packages/blog/drafts/research/readers-vs-bots/20-discovery-positioning.md).

| Completed work | Receipt and boundary |
|---|---|
| Article and README claim corrections | `eebe342`, live-verified September 6. [Revision audit](../../packages/blog/drafts/research/readers-vs-bots/17-article-revision-2026-09-06.md). TASK-0103 is done; the full analytics study does not gate this article |
| Executed local parser/provenance experiment | Twelve selected requests: incorrect Accept results 7 → 0; missing provenance 12 → 0. Five requests leave Browsers and two enter. [Experiment](../../packages/blog/drafts/research/edge-vs-rum/03-local-experiment.md). These are regression cases, not a production error-rate estimate |
| Parser/provenance deployment | `43dd6b5`, Worker activation September 6 at 23:49:02 UTC; seven subsequent observations carried `asn_source=request`, with no missing ASNs. [Release receipt](../../packages/blog/drafts/research/edge-vs-rum/04-release-verification.md). Controlled owner exclusion remains a separate check |
| Reconciled research footprint | `789de70`, live receipt `5722b4c`: 192,964,421 tokens, 27 sessions, 41 prompts, 21 Markdown artifacts at the freeze. [Accounting scope and manifest](../../packages/blog/drafts/research/readers-vs-bots/19-research-footprint.md) |
| Firsthand evidence and credibility research | `3d92b10`, TASK-0122 done for literature/instruction review. [Research brief](../../packages/blog/drafts/research/engineering-credibility/00-research-brief.md). Our human/model experiments are designed but unrun |
| X thread and launch document | `3579a18`; [launch brief](../../packages/blog/drafts/social/how-i-separate-readers-from-bots-without-javascript/launch-brief.md), [five-post copy](../../packages/blog/drafts/social/how-i-separate-readers-from-bots-without-javascript/copy.md), and [measurement record](../../packages/blog/drafts/social/how-i-separate-readers-from-bots-without-javascript/metrics.md). Text is complete; no X publication, account baseline, composer inspection, or media render is recorded for this launch |
| Referrer-spam case study | Article 025, released in `f0cb224` and live-verified in `f4344f4`. [Article record](../../packages/blog/drafts/research/referrer-spam/00-article-passport.md). It is a separate bounded result; it does not complete the counter-calibration study |

The September 4–5 cohort remains **372 browser-UA requests → 95 Browser HTML observations**, compared with **14 eligible RUM page loads**. The 74.5% reduction measures rule impact; the 6.79× disagreement is unexplained. Signatures support identity evidence under the verifier's checks, not a human trigger. Browsers is not a defensible upper or lower bound on people. Preserve these limits in future summaries and social copy.

The footprint ends at `2026-09-07T00:35:59.352Z`, with the manifest frozen at `00:36:19.071Z`. It includes shared contributing sessions and is auditable by the author with private-log integrity commitments. Do not recompute it merely because those sessions continue. Later social copy, skill maintenance, and this handoff are outside the freeze and do not belong in article 024's prompt record. The release commit remains the source for the artifact versions measured then.

## Work to resume

The owner promoted **[Trellner Research, TASK-0132](../tasks/TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md)** to the next research exploration. Start with the existing audit, inspect related methods and datasets, compare available site observations within their coverage and query budget, and specify a small reproducible citation study. Promotion does not mean that study ran or that another article is promised. The [ten-article worklist](../folders/FLDR-0008.md) has two initial slots published, eight remaining, and separate optional candidates; article 025 does not consume another initial slot.

| Open work | Next evidence needed |
|---|---|
| [TASK-0119: identity and purpose](../tasks/TASK-0119.md) | Correct grouping and wording while preserving signatures and declared identities. Keep signer, documented role, and known/unknown trigger separate. The missing provenance INSERT is already fixed |
| [TASK-0120: collection discrepancy](../tasks/TASK-0120.md) | Inspect available individual traces, then run paired real-browser tests with beacon allowed/blocked, JS disabled, and cache/lifecycle variations. Verify owner/test exclusions first and record each collection stage. [Protocol and draft](../../packages/blog/drafts/research/edge-vs-rum/00-worklist-index.md) |
| [TASK-0104: longer calibration](../tasks/TASK-0104.md) | Establish which complete days were actually captured and what sampling remains available. September 17 is a planned review, not a scheduled job or proof that fourteen measured days exist |
| Post 023 maintenance, TASK-0107 | Correct remaining request/person and lower-bound interpretations from the dated claims ledger; do not turn the old manual estimate of 21 plausible requests into 21 verified readers |
| Credibility experiments | Run a bounded pilot from the [experiment designs](../../packages/blog/drafts/research/engineering-credibility/02-experiments.md) before claiming ownership wording improves trust, accuracy, or citations |
| Distribution | The text-only X launch is ready for the author's next publication instruction. Media is optional. No HN or X submission was performed by the article 024 sharing audit or copy work |

User-Agent, city-level metadata, and TLS detail are not categorically excluded from this research. Choose additional fields by the question they resolve, inspect what Cloudflare already retains, and record retention and access limits. The more immediate gaps concern classification reasons/versions, owner/test exclusion, exact joining evidence, and collection outcomes. A deterministic rule can explain a classification without determining who consumed the writing or why a request was sent.

The separate **[D1 repair task](../tasks/TASK-0131-d1-analytics-read-budget.md)** now records completed production acceptance: 182,388 → 33,259 reads for the retained fixed-window report, unchanged output, and two equivalent live cache hits after the owner-reported plan upgrade. Reuse those receipts rather than repeating the benchmark. A later operating-window observation remains separate; budget all production SQL. Newsletter diagnosis, recovery limits, and unfinished repair checks remain in the [reliability worklist](../folders/FLDR-0010-newsletter-reliability-and-bot-protection-worklist.md). This publication checkpoint made no service, billing, or subscriber changes.

## Recovering the saved workspace

The dirty detached worktree at `/private/tmp/blog-024-release` is intact. Its **24 uncommitted files—8 tracked modifications and 16 untracked files—were archived at 2026-09-07 06:25:02 UTC**, outside temporary storage:

`/Users/goga/.local/share/gkoreli/workspace-checkpoints/2026-09-07-blog-024-release/`

The private archive contains full file contents in `worktree-files.tar.gz`, a binary-capable `tracked.patch`, `status.txt`, and a manifest recording the base commit, file sizes, and SHA-256 values. Every archived file was reopened and matched to the source bytes. The directory is owner-only (0700), and its files are 0600. Neither archive bytes nor private conversation logs are committed.

| Recovery item | Value |
|---|---|
| Base commit | `1737fa9a8056d6390465ccfc6951ca8c3e3007c4` |
| Archive SHA-256 | `7ef08c8f814c735e31cc7b1272a7ab637fe0797dc3ef957b2d81470d64a53933` |
| Manifest SHA-256 | `09c3e7b4a2afcb5a459cbd7d1ee3a32d5a5a0460e67b08672e15ef76431bd786` |

To inspect a recovery, first verify those hashes and the per-file manifest, then choose a fresh checkout path. For example, if the destination does not already exist:

```bash
git worktree add --detach /Users/goga/Documents/goga/blog-024-recovery 1737fa9a8056d6390465ccfc6951ca8c3e3007c4
tar -xzf /Users/goga/.local/share/gkoreli/workspace-checkpoints/2026-09-07-blog-024-release/worktree-files.tar.gz -C /Users/goga/Documents/goga/blog-024-recovery
```

The full-file archive restores both tracked and untracked contents; applying `tracked.patch` as well is unnecessary. Compare the recovered version with current `main` before integrating anything: this is older research and implementation work, and restoring it directly over today's checkout could reintroduce retired article claims. No worktree was deleted, cleaned, reset, or merged as part of preservation.

Other retained worktrees were clean at the inventory. `blog-analytics-calibration` was at `789de70`, already an ancestor of `origin/main`, despite being ahead of its old branch remote. The `publish/bring-your-own-agent` checkout was at `835817b`, matching its remote branch. Older publishing branches remain available; their existence is not a new instruction to merge them.

Engineering work and missing subscriber data have different recovery boundaries. This archive makes the article work recoverable. The newsletter investigation found no signup addresses in the inspected pending rows or retained client-error fields; inaccessible provider history remains an unresolved source. A request rejected before it was saved cannot be recreated from a nonexistent row. Do not generalize that limit into a claim that all past addresses or the engineering work are unrecoverable.

## Bookkeeping changes in this checkpoint

The worklists and task records now distinguish the closed article and released defects from open experiments. ADR-0016.4 no longer treats 21 plausible requests as verified people or predicts a validated lower bound. The publishing lane no longer requires every form to become a reference page, assumes all needed telemetry already exists, promises citation gains, or authorizes automatic external outreach. The X skill now allows a copy-only task to finish and treats thread/card presentation as something to inspect.

Concurrent newsletter, D1, and AGENTS.md work was preserved and committed separately in `c2c58e5`, `53f7944`, and `5ee642f`. The [reliability checkpoint](2026-09-07-reliability-checkpoint.md) and [analytics handoff](../../packages/blog/drafts/research/d1-read-budget/03-handoff.md) retain those results. This publication checkpoint adds its own scoped documentation changes and recovery guidance. Continue the owner's direct commit-and-push workflow after relevant checks; no PR is needed. Resume from the receipts above rather than from stale task headings or a new full production extraction.

Validation covered 14 changed documents, 110 relative links and fragments, seven YAML frontmatters, the X skill validator, and whitespace checks. All 24 archived files and the archive commitments matched their recorded hashes. Article 024's body, prompts, and footprint manifest are unchanged, and its research directory still contains the 21 Markdown files counted at release. Application tests were not repeated for this documentation-only change.
