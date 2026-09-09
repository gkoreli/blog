# Article 025 research footprint: scope and accounting

**Frozen scope, current publication.** The released measurement remains **71,572,616 tokens, four sessions, six Markdown artifacts, and 18 measured prompts**. The current article has **23 shaping prompts** after later owner-directed revisions. Those five additional messages and subsequent work fall outside the selected log boundaries; this difference is expected. The [latest article acceptance](07-reader-feedback-and-article-focus.md#current-release-and-break-checkpoint) does not replace or extend this freeze. Bookkeeping must not change the manifest, its overlap record, or published totals.

Opened September 8, 2026 PDT / September 9 UTC for [TASK-0138](../../../../../docs/tasks/TASK-0138-measure-and-publish-article-025-research-footprint.md). The owner requested a measured `researchFootprint` after the article's editorial revision. The [frozen manifest](research-footprint.json) supplies the exact total, session boundaries, and log-prefix commitments. The [transparency page](https://gkoreli.com/filter-referrer-spam-without-deleting-analytics-history/prompts#research-footprint) presents it beside the complete shaping prompts.

This measures the contributing sessions through their recorded usage boundaries. They include the initial analytics investigation, referral-policy design and implementation, article writing and publication, the D1 incident and repair, editorial feedback, shared instructions, bookkeeping, and this accounting work. Input includes repeated context and cached reads. There is no defensible allocation of individual tokens between these activities, so this is a broad session footprint. It does not measure the article's exclusive writing cost or establish its quality.

## Included source and ownership evidence

The root is `01a0744b-0295-76b0-8660-ed4695a74dc1`, confirmed by the active thread identifier and the private session's metadata. Its opening request matches the first complete prompt in the article's public prompt record. Actual tool calls in that session create the article passport at line 1535 and article 025 at line 1540, update the article for the D1 repair at line 2710, and apply the later editorial revision at lines 3135 and 3204. These task and artifact records establish ownership independently of the common working directory or date.

The existing extractor discovers the recursive descendant closure from `source.subagent.thread_spawn.parent_thread_id` and counts every included session once. The resulting sessions serve these roles:

| Session | Recorded agent path | Contribution |
|---|---|---|
| `01a0744b-0295-76b0-8660-ed4695a74dc1` | `/root` | Investigation, implementation, measurements, article, releases, editorial revision, and accounting |
| `01a07922-4c3d-7020-974f-22e1d2eaaeaa` | `/root/matomo_sources` | Matomo source and matching-semantics review |
| `01a07922-7c2a-7c80-bdad-dbc09e79865d` | `/root/referral_design` | Referral domain design, article claim review, and D1 report-consolidation implementation and review |
| `01a0839b-2d66-76f2-8632-9a88d01c38a4` | `/root/editorial_feedback_review` | Article focus, reader-feedback, shared-instruction review, and footprint validation |

The manifest, rather than this descriptive table, determines the session count. No independent root, Claude transcript, or OMP transcript was attributed to this article's work. Article 024's other roots produced its earlier research and shared infrastructure; citing that work does not import those entire sessions into this measurement. The separate root `01a0743e-3475-70d2-a6a4-58772d6c746a` also records publication handoffs and a later HN/referrer investigation. Those activities are outside this selected session tree and its token total.

The earlier [article 024 accounting note](../readers-vs-bots/19-research-footprint.md) records two attempted detached referral reviewers, `upstream` and `domain`, with empty runner logs and no attributable reports or sessions located from their exact task text. They remain excluded and unmeasured, rather than assumed to have used zero tokens. Unknown, deleted, remote, or unlinked work cannot be inferred into the total. The private X conversation remains outside Git; its archive and use are documented in [the editorial worklist](07-reader-feedback-and-article-focus.md).

## Overlap with article 024

Article 024 already includes earlier prefixes of three sessions in this tree. Its [frozen manifest](../readers-vs-bots/research-footprint.json) stays unchanged. The [overlap record](research-footprint-overlap.json) matches session IDs, verifies the earlier selected usage records and private-prefix hashes, and confirms that those boundaries are contained in this later measurement.

| Shared session | Article 024 selected line | Article 024 tokens already reported |
|---|---:|---:|
| Main investigation | 1368 | 19,757,963 |
| Matomo-source review | 70 | 405,205 |
| Referral-design review | 272 | 2,535,725 |
| **Shared measured usage** | | **22,698,893** |

These numbers are derived from article 024's manifest, not estimates from elapsed time. Adding the two article totals would count this usage twice. A difference between the snapshots also contains shared work and cannot establish an exclusive cost for article 025. Referenced engineering artifacts remain in the [readers-versus-bots](../readers-vs-bots/) and [D1 read-budget](../d1-read-budget/) directories; they are linked rather than copied into this article's artifact count.

## Accounting method and release boundary

[`research-footprint.ts`](../../../scripts/research-footprint.ts) and its [shared models](../../../scripts/research-footprint.models.ts) perform the measurement under rules version 4. No new log parser or manual session total was introduced. The existing regression fixture passes for recursive descendants, an independent root, a cumulative-counter reset, duplicate Claude message usage, unrelated-session exclusion, artifact counts, and the usage/freeze timestamp distinction.

For each included Codex session, the script reads cumulative `info.total_token_usage` records. A decrease in `total_tokens` starts a new monotonic epoch. It selects the last cumulative object in each epoch, verifies `total = input + output`, `cached input <= input`, and `reasoning <= output`, then sums epoch ends within each session and each session once. Cached input is already part of input; reasoning is already part of output. Neither is added again. The manifest retains all selected lines, timestamps, values, reset boundaries, and SHA-256 commitments to the corresponding private-log prefixes.

`startedAt` comes from the root metadata. `measuredAt` is the latest selected usage timestamp; `frozenAt` separately records manifest generation. Wall-clock minutes are the ceiling of that interval, including idle gaps, and do not measure human hands-on time. Work after the selected usage records, including the subsequent build, deployment checks, and release receipt, is outside this freeze.

The prompt count uses the same `---` delimiter as the site's parser. The owner's complete footprint request is appended because it changes the published provenance. The artifact count covers Markdown files in this research directory, including this note. It excludes JSON receipts, code, SQL, ADRs, and other research directories. Methodology and prompts are committed before the final freeze; the extractor must report matching working-tree and `HEAD` Markdown counts before their value enters frontmatter. The release commit contains the exact manifest and matching frontmatter.

## Reproduction and trust boundary

From the repository root, using the author's private session logs:

```bash
pnpm -C packages/blog exec tsx scripts/research-footprint.ts \
  --root-thread 01a0744b-0295-76b0-8660-ed4695a74dc1 \
  --research-dir drafts/research/referrer-spam \
  --prompts-file prompts/filter-referrer-spam-without-deleting-analytics-history.prompts.md
```

Running this later against growing logs measures a later boundary. To reproduce the frozen tokens, copy only the included private logs, truncate each copy after its manifest-selected line, verify the SHA-256 prefix commitments, and pass that directory through `--sessions-root`. Use the artifact and prompt set from release `43fcd25`, rather than the subsequently revised files on `main`. Preserve session metadata and parent relationships; omit descendants created after the freeze. A later `frozenAt` timestamp will differ, while the recorded usage totals and boundaries should match.

Private logs contain conversation and system context and are not published. The manifest is **auditable by the author with integrity commitments**; readers cannot independently reconstruct the total without those logs. Public evidence, source choices, and limitations remain inspectable. The token total is not a cost, energy, environmental-impact, or quality estimate.

## Acceptance record

Before the final freeze, the existing mixed-session accounting regression passed. An independent read-only agent audit confirmed source ownership, the recursive four-session closure, preliminary cumulative values and arithmetic, selected private-prefix hashes, and the 22,698,893-token overlap. It corrected the contribution table to include the referral-design agent's D1 implementation. This was agent verification, separate from human reader feedback.

The original release checklist required verification of final private prefixes and recorded usage values, arithmetic, overlap, identical local and `HEAD` Markdown path sets, committed methodology and prompt bytes, exact frontmatter and rendered values, complete prompts, and the live transparency page. The completed results follow; this is no longer a pending release gate.

**Released and verified:** commit [`43fcd25`](https://github.com/gkoreli/blog/commit/43fcd258fe17aa798cf274a46cf1c2cb9a1bc060) publishes **71,572,616 total tokens**, **4 sessions**, **18 human prompts**, and **6 committed Markdown artifacts**. The total contains 71,151,738 input tokens, of which 68,468,352 were cached, and 420,878 output tokens, including 153,251 reasoning tokens. Non-cached input is 2,683,386. All four included sessions have one cumulative epoch; no counter reset was observed through their selected boundaries.

The measurement spans `2026-09-06T01:17:48.075Z` through `2026-09-09T01:35:07.268Z`: **4,338 elapsed minutes**, or 72 hours and 18 minutes. The manifest was frozen at `2026-09-09T01:35:10.525Z`, after the contributing review ended. The methodology, contribution corrections, and prompt set were committed in `eeda7b5` and `955dad3` before that freeze.

The 25-post production build and referral-policy integrity check passed. [Twelve final local checks](11-footprint-release-checks.json) verified the frozen records and private-prefix hashes, arithmetic, time boundaries, overlap, identical Markdown path sets, committed methodology and prompts, exact frontmatter, rendered values, all complete prompts, and unchanged article body and other metadata. Article 024's manifest retains SHA-256 `262ff8f7bb8648abfcd20430d7431ed1ba1d0a19abbf3fd3723dc5ae6591f908`.

Cloudflare build `b94881c2-1ad2-4805-ac53-80cc1c93ab13` completed successfully at **September 9, 01:37:38 UTC**. [Live acceptance](12-footprint-live-checks.json) at **01:38:41 UTC** verified the article header, the exact rendered footprint section, all 18 prompts, and the public manifest and methodology bytes at the release commit. All four requested endpoints returned HTTP 200. Verification used HTTP and generated HTML; no interactive browser check or production SQL was performed.

This receipt and the subsequent skill-coverage discussion are after the frozen boundary. They do not change the published measurement or add another shaping prompt.
