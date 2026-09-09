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
updated_at: '2026-09-09T00:40:20.620Z'
type: task
---
Initial grounding completed September 9 UTC / September 8 PDT. The HN story, comment tree, comparison submissions, and one article-filtered public stats response are captured. The working record is `packages/blog/drafts/research/article-024-hacker-news/00-worklist-index.md`; public measurements, queries, limits, and private capture commitments are stored beside it.

Keep this task open for the remaining measurement and editorial decisions. Current Cloudflare authenticated REST and Wrangler metadata checks fail with authentication error 10000; the available computer surface reports no browser. One public stats request succeeded with X-Stats-Cache: MISS. Its database-read cost is not exposed. No direct SQL extraction or RUM query ran.

Next actions:

- Recover authorized metadata/RUM access, inspect saved evidence first, then prepare a bounded query scope and record all metered reads. Preserve launch-window data before retention reduces it.
- Separate the exact HN submission window from UTC-day public reports. Record current results as a partial launch observation, not a completed seven-day result. Compare page counts under explicit filters and versions.
- Route the reader's false-positive question into TASK-0120: owner/test exclusion, known human browser visits, classification outcome, and beacon delivery. Hosting-network/VPN cases test a plausible failure; they are not confirmed historical false positives.
- Record reader reactions without treating one reply as representative or votes as a causal explanation. Preserve unknown peak rank, HN click-through rate, distinct readership, and subscription outcomes as unknown.
- Decide between a dated field note on the launch and the planned edge-versus-RUM investigation after reviewing the available result. Publish no broad success formula from one launch.

Acceptance: dated measurements with windows, units, method and access limits; preserved shaping prompts and captures; a short claim/decision ledger; controlled results or an explicit current evidence boundary; a chosen article scope with its own reader question. A positive experiment or completed seven-day window is not mandatory for a truthful field note.

Next seven-day review anchor: September 14, 2026 at 05:13:22 UTC, seven days after submission. This is a review target, not a scheduled job. Keep article 024's original body and frozen footprint unchanged unless a specific factual correction is earned.
