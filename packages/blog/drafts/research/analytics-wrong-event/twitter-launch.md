# Twitter / X launch copy

Article: https://gkoreli.com/first-party-analytics-for-a-personal-blog

Transparency: https://gkoreli.com/first-party-analytics-for-a-personal-blog/prompts

## Recommended main post

```text
I built first-party analytics for my blog on Cloudflare Workers + D1.

The SQL was correct. The event was wrong: my “AI Reads” counter measured a later JavaScript beacon, not the page request.

I rebuilt it at the edge and preserved 2,564 legacy rows.

https://gkoreli.com/first-party-analytics-for-a-personal-blog
```

Post the replies below immediately so the thread is complete.

## Reply 1 — architectural blast radius

```text
The surprising part: fixing one noun changed the whole system:

• Worker routing
• event eligibility
• identity + privacy
• UTC aggregation
• API + dashboard
• migration + historical provenance

The public label was the top of a data contract.
```

## Reply 2 — legacy-data decision

```text
I initially wanted a clean reset.

Then I inspected production: 2,564 old rows with useful page, referrer, country, device, and daily-client history.

I kept the source archive and marked both collection eras instead of pretending they were identical—or deleting the history.
```

## Reply 3 — transferable decision rule

```text
The decision rule I’m carrying forward:

Define the row before naming the metric.

Actor → action → eligibility → observation → persistence → strongest honest public claim.

If the instrument cannot observe the event, better SQL and better copy cannot repair it.
```

## Reply 4 — research provenance

```text
I wrote this one fully in public:

• 19 raw human prompts
• 27 agent sessions
• 37 committed artifacts
• 301.3M measured tokens, 295.1M cached
• 14h 27m wall-clock collaboration

Full provenance:
https://gkoreli.com/first-party-analytics-for-a-personal-blog/prompts

#BuildInPublic
```

## Reply to the original llms.txt article announcement

Use this beneath the tweet that announced `Does llms.txt Work?`:

```text
I rebuilt the analytics system that failed this audit.

The SQL had been correct. The recorded event—and therefore the public claim—was wrong.

The repair became its own article:
https://gkoreli.com/first-party-analytics-for-a-personal-blog
```

## Short standalone alternative

Use this instead of the thread when you want a shorter launch:

```text
A correct counter can still support the wrong claim.

My blog’s “AI Reads” metric counted a JavaScript beacon—not the page request.

I rebuilt the analytics with Cloudflare Workers + D1, moved observation to the edge, and preserved 2,564 legacy rows.

https://gkoreli.com/first-party-analytics-for-a-personal-blog
```

## Technical alternative

Use this for a Cloudflare, observability, or server-side analytics audience:

```text
I rebuilt my blog analytics after discovering that the query was correct—but the event was wrong.

JavaScript beacon → edge observation
Public-date hash → HMAC
Local time → UTC
Clean reset → 2,564 source-marked legacy rows

https://gkoreli.com/first-party-analytics-for-a-personal-blog
```

## Posting checklist

1. Use the recommended main post unless the audience is specifically technical.
2. Let the article URL generate its OG card; do not attach an unrelated image.
3. Add all four replies immediately.
4. Pin the main post for at least one week.
5. Stay available for the first hour and answer technical disagreement directly.
6. Reply to the original `llms.txt` announcement with the continuation copy.
7. Do not lead with the 301.3M-token footprint. Keep it in Reply 4 as provenance, not proof of quality.
8. Do not post several competing hooks on launch day. Keep one title and claim stable for the seven-day launch window.
9. After seven days, record X referrals, replies, corrections, voluntary links, and subscriptions separately from raw pageviews.
