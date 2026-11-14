# Destination rules and public visibility

User authorization establishes the requested scope. Before carrying this X workflow to another platform, read that destination's current submission rules. Do not assume that signed-in access or a successful form submission makes the same automation workflow suitable everywhere.

A signed-out submission page may omit later requirements. When account access is available, inspect the signed-in path before calling a submission ready. Record account creation, required newsletter subscriptions, editorial receipt and actual selection separately; never silently turn an approved newsletter-off choice on to pass a gate. The [Changelog execution receipt](../../../../packages/blog/drafts/social/oss-radar-08-bun-aot/execution-2026-10-28.md) records one such discovery and the owner's explicit changed preference.

## X account operation

The [skill's account boundary](../SKILL.md#x-account-boundary) limits X work to preparation and supplied evidence. The author handles posting and account operation. [X's automation rules](https://help.x.com/en/rules-and-policies/x-automation) explicitly prohibit website scripting; posting cadence or ordinary content does not remove that rule. Do not resume verification or switch interfaces after a restriction.

## X conversations and useful outreach

When preparing contributions for the author to send manually, make the relationship and the useful finding the point. Use supplied thread context without operating the X account:

- Read substantive incoming replies before finding more destinations. Answer the question or build on the observation; prepare acknowledgments when useful. Do not perform likes or other account actions. Do not turn reactions into bulk liking, reciprocal follow requests or unrequested DMs.
- Read the actual thread and relevant product/method before offering advice. Check earlier campaign receipts so another reply does not repeat the same pitch to the same person. Distinguish new-thread outreach from genuine conversation follow-ups in the delivery count.
- For new relationship-building outreach, follow Goga's preference to avoid bot-like accounts: inspect authored posts, substantive conversation history and evidence of ownership of the linked project, release or implementation. Skip declared bots/agents, repetitive paraphrase replies, generic AI-summary feeds and mass promotion; a bio, badge or follower count alone is insufficient. If the evidence is weak, choose another person instead of filling the count. This is a selection judgment, not proof of human identity or grounds for publicly accusing an excluded account; it does not change how agent reach is counted in analytics.
- Think about the thread as a code review: understand the problem, constraints and mechanism, then find the missing connection or useful next step. Draw on Goga’s open-source implementations as well as articles; use the [public project index](../../../../docs/reference/owned-open-source-projects.md) to find a relevant solution and recheck its current source. An implementation idea, recommendation, example or question can be the contribution. A thread need not contain an error, and a tool recommendation should fit the actual need.
- Bring one relevant result, implementation, counterexample, fixture or decision from the actual work. Keep its conditions intact. Do not invent insider knowledge, secrets, certainty, recipient-product bugs or completed improvements to make the reply sound more valuable. Describe supported capabilities and tradeoffs; comparative performance or “best” claims need their specific evidence.
- Write to the specific point in the conversation. Do not force every response into the same question/correction/counterexample template, add empty praise, or fill a requested count with loosely related promotion.
- Give enough practical detail to help before the click. Choose the link that lets the recipient act or inspect the claim: repository, package docs, working example or matching canonical article. Do not route every conversation through an article or force a project mention. In a genuine follow-up, a relevant source link already in the ancestor can remain there; another pitch is unnecessary unless the new reference helps.
- Work through curated conversations one at a time and honor actual restriction notices. The Reddit-specific pacing rule below is not a documented X quota. Do not infer that a particular cadence or wording guarantees protection from spam classification.
- Recognize supported replies, likes, follows, citations and reports of use as positive signals at their observed stage. Keep owner-reported growth separate from a measured baseline, and reported application separate from an inspected implementation. Do not turn those signals into an unmeasured traffic or causal-uplift claim.

The [November 6 conversation receipt](../../../../packages/blog/drafts/social/ai-fetcher-browser-crawler-headers/round-seven-conversations-2026-11-06.md) records the relationship direction; the [Nisli reply and project-index receipt](../../../../packages/blog/drafts/social/ai-fetcher-browser-crawler-headers/nisli-solution-2026-11-06.md) records its expansion beyond articles. The code-review analogy does not expand GitHub outreach: preserve the [invitation requirement](../../writing/references/publication-and-learning.md#owner-direction-github-outreach-needs-an-invitation). This does not schedule monitoring, expand authorization beyond the requested work, or override a destination’s rules.

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

[Hacker News's submission guidelines](https://news.ycombinator.com/newsguidelines.html) call for human-written submission text and prohibit automated posting. For HN, use an owner-operated submission path consistent with those rules without automating the destination. Do not create accounts, delete/repost, solicit votes or contact moderators as an unrequested workaround. Keep proposed actions separate from authorized ones.

## Verify the claimed audience

A signed-in owner page proves owner access. Where a platform has an anonymous public page or official public API, check that independently before claiming ordinary public availability. Record killed, deleted, restricted or hidden states explicitly; preserve the earlier owner-view receipt as history rather than silently replacing it.

HN's [official API](https://github.com/HackerNews/API) exposes `dead` and `deleted`. Its [FAQ](https://news.ycombinator.com/newsfaq.html) says dead posts are hidden by default and may be killed by software, flags or moderators. A dead status does not disclose the exact cause, an account ban or a kill timestamp. If optional submission text is missing, inspect any child-item state before saying the platform simply ignored it. Do not infer who deleted an item without evidence.

For X, keep post impressions, reactions, tracked clicks, site request observations and confirmed reader contact distinct. [Author views and some repeated views count](https://help.x.com/en/using-x/view-counts). A request claiming an X referrer is not a person-level join to a particular tracked click.

Save exact URLs, measurement time, method, result and limits. Keep raw exports and operational captures outside Git. Report a visibility failure instead of treating it as a weak-content experiment.

The [Bun AOT launch investigation](../../../../packages/blog/drafts/social/oss-radar-08-bun-aot/traction-2026-10-27.md) records the owner/public mismatch and the baseline-classification counterexample that motivated these checks. Its dated findings are evidence, not permanent account-status assertions.
