# Reliability checkpoint for the next session

Historical checkpoint. For current newsletter state, start at [the September 9 handoff](../../packages/blog/drafts/research/newsletter-reliability/14-handoff.md): migration, shared admission and the authorized live flow are complete; Gmail Spam placement, webhooks and broader logging/recovery work remain open. The repair-unverified and implementation-next steps below describe September 7 and must not be replayed as current instructions.

September 7 UTC / September 6 PDT, 2026. Goga requested a break after preserving meaningful work and correcting misleading documentation. This handoff is based on repository state `8b31b32` plus the documentation checkpoint that adds this file. It records work to resume; no background execution is implied by a task's `in_progress` status.

## Newsletter: diagnosed, repair unverified

The inspected production rejection at 04:59:36 UTC returned Turnstile `invalid-input-secret` before saving a pending address or scheduling confirmation mail. Five client reports survive, all with the same generic verification message and iPhone Safari details. They do not establish five different people. Six older animation errors and two stats-page errors account for the other retained client reports. The April 11 incident is a repository account with no retained raw logs in this capture; neither identical root cause nor a different affected person is established.

- Current subscriber snapshot: one active address from April 8 and no pending/inactive rows. Cleanup prevents an all-time signup count.
- The 06:11 UTC recheck read all columns of all thirteen retained client-error rows: no address-like text, no request-body column, thirteen reads, zero writes. [Sanitized evidence](../../packages/blog/drafts/research/newsletter-reliability/recovery-log-recheck.json).
- Resend's available key can send but cannot read email/log history (401). Older attempts that reached sending may still be identifiable through authorized provider history. Full Worker telemetry API access returned 403. Native dashboard access failed. These are incomplete checks, not proof that all historical addresses are unrecoverable.
- An existing local Turnstile secret returned `invalid-input-response` for a synthetic token. This suggests a recognized secret but does not prove a match to the live widget. The widget configuration read returned 403. No production secret was changed, no recovery mail was sent, and no address was activated.
- D1 Time Travel bookmark lookup succeeded; no historical rows were inspected or database restored. A restore cannot reconstruct a request never saved.

The local audit reproduced unreported widget errors, transport/persistence acknowledgement gaps, incomplete ingestion limits/redaction, inactive-address uniqueness errors, and an unknown confirmation token falsely claiming an active subscription. These are application-module/SQLite reproductions, not additional observed production victims. The unpublished [article draft](../../packages/blog/drafts/research/newsletter-reliability/article.md), exact shaping prompts, results, and evidence ledger are preserved in [the research index](../../packages/blog/drafts/research/newsletter-reliability/00-investigation.md).

## Analytics: correction deployed and production acceptance complete

Committed records show the shared report assessment and cache released in `316eb00` and activated at 05:49:21 UTC. The implementation session recorded 79 tests, 148 local D1 parity cases, workspace typechecks, a build, and served-artifact checks. This bookkeeping session did not repeat those code checks. [Deployment and acceptance record](../../packages/blog/drafts/research/d1-read-budget/01-verification.md).

The old report's **182,388 reads** is summed query work across **nine statements for one report**. Re-reading the same data can count again; this is not 182,388 stored observations or people. The old sample consumed 3.65% of the captured five-million-read daily allowance. Query profiles identify costly statement shapes, not who called them. The exact contribution of owners, agents, and external traffic remains unknown.

The revised production benchmark was initially rejected for quota exhaustion at 05:41 UTC. The later 06:11 small client-error query alone did not establish full recovery. The owner subsequently reported completing a Workers Paid upgrade, and the analytics session recorded successful production acceptance at 06:18–06:21 UTC: the identical historical response used **33,259 reads instead of 182,388 (81.7647% fewer)**; two live equivalent requests returned identical HTTP 200 cache hits. A separate count found **7,010 page observations** and about **3.1 MB** of total database storage. The agent did not change billing, and approval for that completed owner action is no longer pending. [Recovery evidence](../../packages/blog/drafts/research/d1-read-budget/02-recovery.md), [detailed analytics handoff](../../packages/blog/drafts/research/d1-read-budget/03-handoff.md).

## Resume order and acceptance

| Work | Preserved progress | Next bounded action / completion evidence |
|---|---|---|
| TASK-0124: subscription repair | Invalid-secret diagnosis; local credential probe | Confirm the existing secret matches the live widget through authorized account access, repair the binding, and validate signup plus confirmation with a designated recipient. A deployment alone is insufficient |
| TASK-0131: analytics operating budget | Complete: shared query and cache activated; local and production acceptance passed | Reuse saved measurements. The separate next observation window is September 8–9 UTC, through account metadata after it ends; do not repeat completed benchmarks |
| TASK-0123 and TASK-0130: history/recovery | D1 capture and all-column follow-up saved | Resume authorized Worker and Resend history reads if access returns. Keep any recovered address private and preserve its confirmation/suppression state |
| TASK-0125 and TASK-0126: observability | Failure probes and ADR corrections complete | Implement bounded widget recovery/reporting, durable server outcomes, correlation, and ingestion safeguards; exercise the failures |
| TASK-0129: subscription state | SQLite reproductions saved | Fix inactive-address transitions and unknown-token messaging, preserving suppression and confirmation requirements |
| TASK-0127 and TASK-0128: protection decision/article | Threat model, three candidates, field-note draft | Decide protection from abuse/completion evidence; revise the draft with actual repair results. Turnstile removal and article publication are not already approved outcomes |

Tasks remain unfinished where their acceptance evidence is missing. The [newsletter worklist](../folders/FLDR-0010-newsletter-reliability-and-bot-protection-worklist.md) contains TASK-0123–0130; [TASK-0131](../tasks/TASK-0131-d1-analytics-read-budget.md) records completed analytics acceptance. The separately prioritized [Trellner follow-up](../tasks/TASK-0132-explore-trellner-research-further-ai-citation-sources-and-a.md) remains open in its research lane; promotion is not a completed study.

## Evidence storage and working constraints

Newsletter operational captures are archived outside Git under `../private-evidence/newsletter-reliability/2026-09-07/` relative to this repository root, with owner-only permissions. The public summary commits to twelve capture files, including the latest full-column recheck. Analytics' separate private archive and manifest are described in its verification record. Private logs, emails, credentials, and tokens are not release artifacts.

A private backup of the concurrent working-tree patch and non-ignored untracked files is under `../private-evidence/bookkeeping/2026-09-07/`. Its manifest records the base revision and file hashes. This preserves work that was still being edited during the checkpoint without committing another session's unfinished changes. Files may advance after that capture; compare the backup with current Git history before using it.

Reuse these captures before spending another production read. Check service metadata after a quota error; neither authentication failures nor a small successful query establish the cause of a quota transition. Do not restore the shared database, activate unconfirmed addresses, send recovery mail, change billing, or remove protection as an implicit consequence of this checkpoint. User authorization already supplied for an action still applies; an unanswered request supplies none.

Documentation corrections cover read units, shared-D1 scope, actual build paths, newsletter implementation status, 3-per-minute limits, CORS versus request rejection, confirmation hashing versus raw unsubscribe tokens, false confirmation success, and client-logging gaps. Operational repairs remain tracked separately from those corrected descriptions.
