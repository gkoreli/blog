# Destination rules and public visibility

User authorization establishes the requested scope. Before carrying this X workflow to another platform, read that destination's current submission rules. Do not assume that signed-in access or a successful form submission makes the same automation workflow suitable everywhere.

A signed-out submission page may omit later requirements. When account access is available, inspect the signed-in path before calling a submission ready. Record account creation, required newsletter subscriptions, editorial receipt and actual selection separately; never silently turn an approved newsletter-off choice on to pass a gate. The [Changelog execution receipt](../../../../packages/blog/drafts/social/oss-radar-08-bun-aot/execution-2026-10-28.md) records one such discovery and the owner's explicit changed preference.

## Reddit pacing and account restrictions

Reddit documents [limits on posting and commenting](https://support.reddithelp.com/hc/en-us/articles/204579879-Why-am-I-being-told-You-re-doing-that-too-much) that can depend on account/community standing. That guidance supplies no universal safe posting interval. The [Data API request budget](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki) is a separate limit, not a browser posting allowance.

Apply these local operating rules to authorized Reddit outreach:

- Coordinate recent account activity across sessions and tools. Use one posting session at a time; do not run parallel batches in different communities.
- Leave **at least ten minutes between outreach writes** (posts, comments, replies and follow-up edits) across the account. This is our conservative default, not a Reddit-published threshold or guarantee. Research and prepare the next relevant contribution between writes rather than sending a requested batch in a burst.
- On a rate-limit message or HTTP 429, stop that account’s request activity for the full displayed cooldown. Preserve the pending draft/destination and record the exact message, remaining seconds and observation time privately. Honor a longer platform wait; do not reuse a historical countdown as a permanent quota or start time.
- After both the platform wait and local pacing requirement are satisfied, make at most one deliberate retry within existing authorization. First resolve any uncertain submission with one focused history/permalink check so a retry cannot duplicate an accepted post. If still restricted, stop the batch and report the remaining work rather than repeatedly probing it.
- On an account/security lock, stop account actions and let the owner complete recovery. Once recovery is reported, verify access before resuming already-authorized work. Do not reset the owner’s password or treat the reset as a rate-limit workaround. Reddit’s [security-lock guidance](https://support.reddithelp.com/hc/en-us/articles/360045735031-My-account-has-been-locked-as-a-security-precaution) describes technical irregularities and password-reset recovery; a lock does not identify its cause.
- Do not switch accounts, browser/API interfaces, credentials or networks to evade a restriction. Do not hammer reload, resubmit or authentication controls during a cooldown.
- Pacing does not make spam acceptable. Reddit’s [spam policy](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam) covers repetitive mass engagement, including tool-assisted promotion. Check each community’s rules, contribute distinct relevant help, and do not manufacture engagement or superficial variants of the same link promotion to meet a count.

The [November 6 source review](../../../../packages/blog/drafts/social/ai-fetcher-browser-crawler-headers/reddit-rate-limit-2026-11-06.md) separates the owner-reported 224-second warning and recovered lock from documented facts and unresolved causes. Keep recovery notices, credentials and raw account captures outside Git. A new rate limit or lock is a new observation; the historical report does not establish current account status.

## Human-operated destinations

[Hacker News's submission guidelines](https://news.ycombinator.com/newsguidelines.html) call for human-written submission text and prohibit automated posting. For HN, use an owner-operated submission path consistent with those rules rather than extending this skill's automated X publication route. Do not create accounts, delete/repost, solicit votes or contact moderators as an unrequested workaround. Keep proposed actions separate from authorized ones.

## Verify the claimed audience

A signed-in owner page proves owner access. Where a platform has an anonymous public page or official public API, check that independently before claiming ordinary public availability. Record killed, deleted, restricted or hidden states explicitly; preserve the earlier owner-view receipt as history rather than silently replacing it.

HN's [official API](https://github.com/HackerNews/API) exposes `dead` and `deleted`. Its [FAQ](https://news.ycombinator.com/newsfaq.html) says dead posts are hidden by default and may be killed by software, flags or moderators. A dead status does not disclose the exact cause, an account ban or a kill timestamp. If optional submission text is missing, inspect any child-item state before saying the platform simply ignored it. Do not infer who deleted an item without evidence.

For X, keep post impressions, reactions, tracked clicks, site request observations and confirmed reader contact distinct. [Author views and some repeated views count](https://help.x.com/en/using-x/view-counts). A request claiming an X referrer is not a person-level join to a particular tracked click.

Save exact URLs, measurement time, method, result and limits. Keep raw exports and operational captures outside Git. Report a visibility failure instead of treating it as a weak-content experiment.

The [Bun AOT launch investigation](../../../../packages/blog/drafts/social/oss-radar-08-bun-aot/traction-2026-10-27.md) records the owner/public mismatch and the baseline-classification counterexample that motivated these checks. Its dated findings are evidence, not permanent account-status assertions.
