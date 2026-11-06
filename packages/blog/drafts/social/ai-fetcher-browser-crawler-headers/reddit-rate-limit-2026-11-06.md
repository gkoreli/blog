# Reddit pacing: November 6 evidence and operating rule

The owner reports a Reddit rate-limit message with a 224-second wait, plus a temporary account lock recovered through a password reset. This record preserves the general lesson without publishing account-security notices or credentials. The exact restriction time, response headers, lock notice and triggering action were not supplied or independently inspected. The lock’s cause is unresolved.

The supplied message is:

> Your request has been rate limited, please take a break for 224 seconds and try again.

That is 3 minutes 44 seconds for this warning, not a permanent quota or evidence that ten-minute spacing is universally safe. The report time is not the original countdown’s start time.

## What Reddit documents

Sources checked November 6, 2026, using official Reddit Help pages:

| Source | Supported conclusion | Limit |
| --- | --- | --- |
| [Posting/commenting frequency](https://support.reddithelp.com/hc/en-us/articles/204579879-Why-am-I-being-told-You-re-doing-that-too-much) | Communities impose posting/commenting limits; account/community standing can affect the spam filter. | No universal posts-per-hour allowance or fixed safe interval is supplied. This page discusses a differently worded warning; it does not diagnose the exact layer behind the owner’s message. |
| [Spam policy](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam) | Repetitive mass engagement can violate policy whether performed manually or with tools. Frequent links benefiting the poster require particular care and community rules still apply. | Waiting between posts does not make unwanted or repetitive promotion acceptable. |
| [Security locks](https://support.reddithelp.com/hc/en-us/articles/360045735031-My-account-has-been-locked-as-a-security-precaution) | Reddit may lock an account after technical irregularities; password-reset recovery is documented. | Does not establish that a rate limit or this campaign caused the reported lock. |
| [Data API limits](https://support.reddithelp.com/hc/en-us/articles/16160319875092-Reddit-Data-API-Wiki) | Eligible OAuth clients have an API request budget and rate-limit response headers. | API query capacity is not a safe browser posting/commenting allowance. |

## Change to our practice

The [fifth batch’s receipts](round-five-publication-2026-11-05.json) show five Reddit contributions verified within approximately seven minutes. Those are local owner-view receipt times, not exact server publication timestamps or proof of a Reddit threshold. Our earlier workflow allowed short bursts and lacked an explicit account-wide pacing rule. That is the process gap being corrected; no causal finding about Reddit’s enforcement follows.

The [maintained operating rule](../../../../../.agents/skills/launch-article-on-x/references/publication-verification.md#reddit-pacing-and-account-restrictions) now uses a minimum ten-minute gap between outreach writes, across communities and sessions. This is a conservative local default chosen after the owner’s report, not a Reddit-published number or a guarantee. A longer platform cooldown takes precedence. Do not run parallel Reddit posting batches, retry during a countdown, or switch accounts/interfaces/networks to evade a restriction. Keep contributions relevant and distinct; spacing does not cure spam.

A rate-limit warning stops account activity through the full reported wait. Preserve the draft and pending destination, then make at most one deliberate retry after the wait and local pacing requirement are both satisfied, within existing authorization. If a restriction remains, stop the batch and report what is pending. A security lock requires owner-operated recovery; the password reset is not an agent workaround. Before retrying an uncertain submission, check whether it already appeared to avoid a duplicate.

The [AGENTS.md entry](../../../../../AGENTS.md#publication-integrity) points to this focused procedure. The existing launch skill already requires this reference before adapting its workflow to another destination. Historical publication receipts and the article’s research footprint are unchanged. No authenticated Reddit browsing, posts, retries, recovery action or automated monitor was performed for this check. Verification and rule storage complete this request; no further posting is scheduled.

Documentation checks pass: 75 local links/anchors resolve, code fences are balanced, AGENTS.md remains 55 lines, and all previous root/destination instructions are preserved. The reviewed diff covers pacing, cooldowns, cross-session coordination, bounded retries, owner recovery, spam and API-budget distinctions. No application code or article changed; a production build is unnecessary.
