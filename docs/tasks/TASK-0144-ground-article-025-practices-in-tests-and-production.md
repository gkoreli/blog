---
id: TASK-0144
title: Ground article 025 practices in tests and production evidence
status: done
parent_id: FLDR-0008
evidence:
  - >-
    Published practices and evidence revision in b4e14b5. Cloudflare build
    eb957206-a149-40d8-92b7-726c33b9c034 succeeded at 2026-09-09T02:39:36Z;
    served article, Markdown and prompts matched the checked build at 02:41:14Z.
  - >-
    Article now connects pinned Matomo/Plausible implementations, 1,000-name
    rotation, 9,409 evaluator fixtures, integrity checks, preserved useful
    referrals and scoped live reconciliation to reusable practices. Historical
    tests, fixed-window production checks and later activation remain distinct.
  - >-
    Two bounded source/editorial reviews, isolated production build and seven
    generated checks passed. Four live checks recorded in
    packages/blog/drafts/research/referrer-spam/17-practices-live.json. All 23
    prompts preserved; frozen footprint unchanged; no repeated production SQL.
created_at: '2026-09-09T02:25:51.753Z'
updated_at: '2026-09-09T02:42:07.564Z'
type: task
---
The owner finds that the referrer-spam article does not carry enough of the practical knowledge earned through research, authoritative sources, open-source inspection, local experiments, and live blog evidence. Preserve the public-abuse focus and calibrated value of referrers. Reconstruct a compact claim/evidence map from the saved policy verification, adversarial tests, activation captures, ADRs, and pinned Matomo/Plausible implementations. Revise the article to teach the best-supported reusable practices through actual results and decisions, with inline references. Separate deployed/measured behavior from code-inspected prior art and proposed future controls. Keep D1 brief and the frozen footprint unchanged; preserve exact shaping prompts. Build, verify, commit/push, and record live acceptance without repeating production SQL or broad research.

Decision and acceptance: [Practices backed by experiments and live reports](../../packages/blog/drafts/research/referrer-spam/07-reader-feedback-and-article-focus.md#practices-backed-by-experiments-and-live-reports). The [claim map](../../packages/blog/drafts/research/referrer-spam/01-evidence-ledger.md#practices-added-from-existing-evidence) preserves each result's conditions and source.
