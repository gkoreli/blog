# Destination rules and public visibility

User authorization establishes the requested scope. Before carrying this X workflow to another platform, read that destination's current submission rules. Do not assume that signed-in access or a successful form submission makes the same automation workflow suitable everywhere.

A signed-out submission page may omit later requirements. When account access is available, inspect the signed-in path before calling a submission ready. Record account creation, required newsletter subscriptions, editorial receipt and actual selection separately; never silently turn an approved newsletter-off choice on to pass a gate. The [Changelog execution receipt](../../../../packages/blog/drafts/social/oss-radar-08-bun-aot/execution-2026-10-28.md) records one such discovery and the owner's explicit changed preference.

## Human-operated destinations

[Hacker News's submission guidelines](https://news.ycombinator.com/newsguidelines.html) call for human-written submission text and prohibit automated posting. For HN, use an owner-operated submission path consistent with those rules rather than extending this skill's automated X publication route. Do not create accounts, delete/repost, solicit votes or contact moderators as an unrequested workaround. Keep proposed actions separate from authorized ones.

## Verify the claimed audience

A signed-in owner page proves owner access. Where a platform has an anonymous public page or official public API, check that independently before claiming ordinary public availability. Record killed, deleted, restricted or hidden states explicitly; preserve the earlier owner-view receipt as history rather than silently replacing it.

HN's [official API](https://github.com/HackerNews/API) exposes `dead` and `deleted`. Its [FAQ](https://news.ycombinator.com/newsfaq.html) says dead posts are hidden by default and may be killed by software, flags or moderators. A dead status does not disclose the exact cause, an account ban or a kill timestamp. If optional submission text is missing, inspect any child-item state before saying the platform simply ignored it. Do not infer who deleted an item without evidence.

For X, keep post impressions, reactions, tracked clicks, site request observations and confirmed reader contact distinct. [Author views and some repeated views count](https://help.x.com/en/using-x/view-counts). A request claiming an X referrer is not a person-level join to a particular tracked click.

Save exact URLs, measurement time, method, result and limits. Keep raw exports and operational captures outside Git. Report a visibility failure instead of treating it as a weak-content experiment.

The [Bun AOT launch investigation](../../../../packages/blog/drafts/social/oss-radar-08-bun-aot/traction-2026-10-27.md) records the owner/public mismatch and the baseline-classification counterexample that motivated these checks. Its dated findings are evidence, not permanent account-status assertions.
