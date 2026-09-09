---
id: TASK-0135
title: Measure article 024 Hacker News launch and choose the follow-up
status: in_progress
parent_id: FLDR-0012
references:
  - url: 'https://news.ycombinator.com/item?id=49594130'
    title: Article 024 Hacker News submission
  - url: 'https://news.ycombinator.com/item?id=49600953'
    title: Reader question about false positives
created_at: '2026-09-09T00:34:56.926Z'
updated_at: '2026-09-09T02:50:00.000Z'
type: task
---
**At the break:** launch capture, referrer analysis, and the referrer implementation/acceptance are complete. This task stays open for observation and the choice of a launch follow-up article; real-browser calibration is owned by TASK-0120. The separate Matomo/protocol research in TASK-0141 is done. Read the [current checkpoint](../handoffs/2026-09-09-analytics-and-agent-research-checkpoint.md) before resuming.

Initial grounding completed September 9 UTC / September 8 PDT. The HN story, comment tree, comparison submissions, and one article-filtered public stats response are captured. The working record is `packages/blog/drafts/research/article-024-hacker-news/00-worklist-index.md`; public measurements, queries, limits, and private capture commitments are stored beside it.

Keep this task open for the remaining measurement and editorial decisions. At the initial capture, Cloudflare REST and Wrangler metadata checks failed with authentication error 10000, and no browser was available. One public stats request succeeded with X-Stats-Cache: MISS; its database-read cost is not exposed. Authenticated REST access subsequently succeeded at 00:52 UTC. The follow-up used one aggregate subscriber SELECT (one row read, zero writes) and one RUM query; see `publication-followup-measurements.json` and `04-publication-learning.md` in the research directory. Do not treat the earlier authentication failure as a current blocker.

Next actions:

- Reuse the successful metadata, subscriber-count, and RUM captures before further queries. Prepare only the additional bounded checks needed to answer an open question and record all metered D1 reads. The initial RUM capture for September 7–8 is preserved, with sampling disclosed.
- Separate the exact HN submission window from UTC-day public reports. Record current results as a partial launch observation, not a completed seven-day result. Compare page counts under explicit filters and versions.
- Route the reader's false-positive question into TASK-0120: owner/test exclusion, known human browser visits, classification outcome, and beacon delivery. Hosting-network/VPN cases test a plausible failure; they are not confirmed historical false positives.
- Record reader reactions without treating one reply as representative or votes as a causal explanation. Preserve unknown peak rank, HN click-through rate, distinct readership, and historical signup attempts as unknown; retained subscriber counts are now captured separately.
- Decide between a dated field note on the launch and the planned edge-versus-RUM investigation after reviewing the available result. Publish no broad success formula from one launch.

Acceptance: dated measurements with windows, units, method and access limits; preserved shaping prompts and captures; a short claim/decision ledger; controlled results or an explicit current evidence boundary; a chosen article scope with its own reader question. A positive experiment or completed seven-day window is not mandatory for a truthful field note.

Next seven-day review anchor: September 14, 2026 at 05:13:22 UTC, seven days after submission. This is a review target, not a scheduled job. Keep article 024's original body and frozen footprint unchanged unless a specific factual correction is earned.

## Publication learning and successful follow-up — September 9 UTC

The owner expanded the question from launch performance to a publication people trust and follow. `04-publication-learning.md` separates observed reach, a reader question, the unmeasured causes of the response, and proposed improvements to the existing subscription invitation and article continuity. The follow-up captured 553 Cloudflare browser-script page loads for September 7–8 (sampling disclosed) and zero new retained subscriber creations/confirmations since HN submission. The owner reports signup was repaired and believes this preceded the spike; its exact timing remains unverified here.

Use the next three engineering releases to record reach, confirmed subscriptions where attributable, substantive replies, corrections, links, and reports of use. The UI/copy trial and future releases are proposed work, not changes made by this task. Preserve existing RSS and series navigation. HN's current guidelines require the author to compose his comments; the earlier generated draft remains a historical artifact.

## Referrer investigation and approved page-transition work — September 9 UTC

The fixed article query at 01:16:37 UTC reconciles all 1,616 Browser observations and the original referral categories. The 652 null-referrer rows report Fetch Metadata values of none (444), cross-site (170), and same-origin (38). The parser at that capture merged absent, unusable, and internal referrals; the subsequent release distinguishes new observations. The query used 44,831 reads and zero writes; its local D1 fixture passed first. See `05-referrer-analysis.md`, the committed SQL and offline analyzer, and the sanitized `referrer-measurements.json`.

Goga approved preserving referral categories and recognized public internal paths, and requested authoritative prior art for funnel analysis. `06-transitions-and-funnels.md` records the sources, scope, and completed acceptance plan. The release below implements reported page transitions; complete multi-step/person-level funnels remain separate. Do not infer old internal paths or repeat production extraction of this preserved cohort.

## Referrer release accepted — September 9 UTC

Runtime commit `c338059` is pushed, migration 0009 applied, and production capture and cache behavior verified. `07-transition-release-acceptance.md` and `transition-acceptance.json` record 53 analytics/36 blog tests, local D1 and browser checks, eight scripted referrer cases plus an excluded bootstrap (all nine excluded from public metrics), a 58,204-read report, and a byte-identical MISS → HIT. The implementation is complete; organic transition measurement, real-browser calibration, and the seven-day launch review remain open.

The owner's Matomo comparison and delegated-agent subscription research is complete in [TASK-0141's artifacts](../../packages/blog/drafts/research/agent-readership/00-worklist-index.md), pushed as `c42ab3a`. Its proposed experiments have not run. This thread's research and referrer implementation did not reopen the original article or its frozen footprint.
