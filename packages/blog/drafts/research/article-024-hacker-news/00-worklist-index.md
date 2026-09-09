# What article 024's Hacker News launch teaches us

Started September 9 UTC / September 8 PDT, 2026. [FLDR-0012](../../../../../docs/folders/FLDR-0012-article-024-hacker-news-follow-up.md) / [TASK-0135](../../../../../docs/tasks/TASK-0135-measure-article-024-hacker-news-launch-and-choose-the-follow.md).

**Break checkpoint:** launch capture, referrer analysis, and the referrer implementation/acceptance are complete. The [September 9 handoff](../../../../../docs/handoffs/2026-09-09-analytics-and-agent-research-checkpoint.md) separates these results from open observation, browser calibration, and proposed agent-subscription experiments.

Article 024 brought substantially more recorded traffic to this page after its Hacker News submission. The first saved report contains **1,616 page observations in Browsers**, including **753 reporting Hacker News as their source**. It records 1,534 on September 7. One visible reader comment asks whether the rules also misclassify real readers. These give us a measured launch result and a concrete question to test.

- [Initial evidence](01-initial-evidence.md): submission, public report, reader response, access limits, and claim decisions.
- [Experiments and article direction](02-experiments-and-article-direction.md): what to measure next and what this instance can teach our writing process.
- [Reply draft](03-hacker-news-reply.md): plain-language answer requested by Goga; not posted by this session.
- [Measurements](measurements.json): reviewed public aggregates and their source/time boundaries.
- [Capture commitments](capture-manifest.json): hashes of the private originals; credentials and raw operational records stay outside Git.
- [Exact shaping prompts](source.prompts.md): this new investigation's human direction, separate from article 024's frozen prompts and footprint.
- [Publication learning](04-publication-learning.md): what the launch supports, the owner-reported signup repair, zero new confirmed subscribers, and the next steps toward regular readership.
- [Follow-up measurements](publication-followup-measurements.json): successful Cloudflare access, the one-row subscriber check, and the browser-script capture for September 7–8.
- [Referrer analysis](05-referrer-analysis.md): the 652 no-referrer observations, exact reconciliation, private evidence boundary, and committed analysis method.
- [Transitions and funnels](06-transitions-and-funnels.md): authoritative prior art and the accepted internal-navigation implementation.
- [Transition release acceptance](07-transition-release-acceptance.md): deployed code, controlled capture, report cost, cache reuse, and [sanitized results](transition-acceptance.json).
- [Completed Matomo and agent-subscription research](../agent-readership/00-worklist-index.md): TASK-0141's comparison, delegated protocol reviews, exact prompts, measured checks, and proposed extensions; pushed in `c42ab3a`.

## What is complete and what remains open

| Work | Current state | Next action |
|---|---|---|
| Preserve HN submission and feedback | Done: official story and three child records captured; one visible comment, two dead records | Recheck at the seven-day review; do not infer historical rank from today's list |
| Capture article traffic | Done: public article report plus the September 7–8 browser-script capture | Reconcile collection rules before comparing the counters; preserve their separate filters and sampling |
| Compare earlier submissions | Done: current scores for four URL-matched submissions | Treat as context, since age, subject, timing, and distribution differ |
| Answer the reader | Facts recorded; earlier assistant draft retained as history | Goga writes the reply himself under HN's current comment rules; no reply was sent here |
| Test real browser visits | Open in [TASK-0120](../../../../../docs/tasks/TASK-0120.md) | Verify test exclusion, label who operated each client, and run the bounded cases |
| Preserve referrer context and show page transitions | Deployed and accepted in `c338059`; scripted cases and cache reuse verified | Let organic observations accumulate; do not infer discarded historical paths or complete journeys |
| Compare Matomo and research authorized agent subscriptions | Done in TASK-0141 and `c42ab3a` | Read the saved reports; integration and matched-system experiments remain proposals |
| Learn from article choices | Initial hypotheses recorded | Separate what a reader explicitly says from our guesses about the title, evidence, and structure |
| Select and publish the next article | Scope proposed; unpublished | Choose a field note or the existing measurement investigation from the evidence actually available |

## Observation window

HN submission: **September 7 at 05:13:22 UTC**. Seven-day review anchor: **September 14 at 05:13:22 UTC**. This was selected after the first launch response was visible; it is not a preregistered success test or a scheduled job. The initial capture is about 43 hours after submission. Its public report spans September 3–9 UTC and includes the partial current day; it is not an exact seven-day post-submission report.

Keep article 024's current title and URL under the [existing observation decision](../readers-vs-bots/20-discovery-positioning.md). Its 74.5% figure describes a historical rule effect. A new traffic increase does not establish a false-positive rate or explain the earlier 95-versus-14 discrepancy. The original article can remain complete while these questions develop.

## Where this work belongs

The most useful engineering continuation is still the [edge-versus-RUM investigation](../edge-vs-rum/00-worklist-index.md), now with a reader asking for real-browser validation. This worklist adds the launch and editorial learning record; it does not duplicate the controlled-client implementation task or commit another slot in the ten-article plan. A shorter field note about the launch can stand on the measured current state if that is the article Goga wants to write.

The Promptfoo and Trellner worklists remain separate. The [D1 recovery receipt](../d1-read-budget/02-recovery.md) remains completed. Authenticated REST access succeeded again at 00:52 UTC, superseding this session's earlier access failure. At its capture time, the separate follow-up found no new retained signups or confirmations since the HN submission; Goga reported the signup repair was probably live before the traffic spike. Read that capture's timing and retention limits before interpreting the counts. The [newsletter handoff](../newsletter-reliability/14-handoff.md) owns later parallel acceptance and current availability; do not treat the earlier zero as a current subscriber total.
