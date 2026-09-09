# Article 024: the first Hacker News follow-up capture

Captured September 9 UTC / September 8 PDT, 2026, from repository revision `c4c924fa9005a1e30e99862ab5e871d8fa6b257c`. The article's public counter shows a substantial increase around its HN submission. This is a distribution observation; it does not establish how many people read the whole article or why they clicked.

The [later follow-up](04-publication-learning.md) records restored authenticated access, the browser-script comparison source, the owner-reported signup repair, and the subscriber-count check. The access failures and unqueried sources below describe this initial capture.

## Public Hacker News evidence

The [submission](https://news.ycombinator.com/item?id=49594130) uses the article's exact title, **Bot Detection Without JavaScript: What My Blog Measured**, and canonical URL. Its official API record identifies `gogakoreli` as submitter and September 7, 2026 at 05:13:22 UTC as creation time.

| Submission | Current score | Reported comments | Submitted UTC |
|---|---:|---:|---|
| [Article 024](https://news.ycombinator.com/item?id=49594130) | 13 | 1 | September 7, 05:13:22 |
| [Article 023: fetcher headers](https://news.ycombinator.com/item?id=49546499) | 1 | 1 | September 3, 06:15:14 |
| [Linux signal conflict](https://news.ycombinator.com/item?id=48229058) | 3 | 0 | May 21, 21:25:47 |
| [First-party analytics](https://news.ycombinator.com/item?id=49618029) | 1 | 0 | September 8, 22:25:07 |

Algolia URL/domain search found these four stories; the values above were then captured from the official HN API. This is not proof of an exhaustive submission history. These scores have different observation ages and subjects. They support an account-relative improvement in the inspected set, not a controlled comparison of title effectiveness.

The current top-story list contains 500 IDs and does not contain article 024. That says nothing conclusive about its earlier peak rank or time on the front page. The official item has three child IDs: one visible comment and two marked dead. We traversed all three and found no further children; three child records must not become three visible reader responses. HN documents these distinct fields in its [official API reference](https://github.com/HackerNews/API), checked September 9 UTC.

## What the reader actually asks

[quietraster's comment](https://news.ycombinator.com/item?id=49600953) treats the 74.5% as a bot share and asks whether the rules produced false positives on real readers. This is an observed interpretation by one commenter. It does not establish what the rest of the audience understood or which article wording caused the interpretation.

The published article already says the reduction is a rule effect, not measured detection accuracy. Our reply should answer the question plainly: we have not measured a false-positive rate; a real browser can fall into another group; classification does not block access. The [draft](03-hacker-news-reply.md) makes that distinction without technical vocabulary. Goga's request to simplify it is preserved in the prompts. No HN reply was posted by this session.

## What the article counter recorded

One request to the public stats endpoint succeeded at **September 9, 00:33:35 UTC**. The response was calculated at **00:33:34.890 UTC** and reported `X-Stats-Cache: MISS`.

Exact filters: `traffic=browser`, `range=7d`, `path=/how-i-separate-readers-from-bots-without-javascript`; no agent or kind filter. Returned dates: September 3 through September 9 UTC, with September 9 incomplete. This is the existing public report contract, including its owner and referral-policy exclusions. It is not the original unfiltered research extractor.

| Measure | Recorded value | Meaning |
|---|---:|---|
| Browser page observations | 1,616 | Requests included in this article's Browsers report |
| Daily client identifiers | 1,497 | The report's site/day identifiers; not distinct people over the period |
| Reported HN referrer | 753 | Requests carrying `news.ycombinator.com` as referrer; the header is not authenticated |
| No referrer | 652 | Unattributed observations; do not assign these to HN |
| Other, undisplayed referrers | 182 | Names suppressed by the public display policy; not necessarily abuse |
| Referral-policy exclusions | 1 | Excluded before public totals, under policy `2026-09-06.2` |

The remaining named referrers account for 29 views: Google 22, DuckDuckGo 3, X's `t.co` 2, GitHub 1, and Reddit 1. Named referrers 782 + undisplayed referrers 182 + unattributed 652 = 1,616. All included rows have the stored reason `navigation-shaped`. That reason is not a human label.

| UTC date | Article Browser observations |
|---|---:|
| September 3 | 0 |
| September 4 | 1 |
| September 5 | 0 |
| September 6 | 3 |
| September 7 | 1,534 |
| September 8 | 76 |
| September 9, partial | 2 |
| Total | 1,616 |

This is a clear change in the recorded page traffic. September 7 includes hours before the 05:13 submission, and the referrer table covers the whole report rather than that day alone. Do not describe all 1,534 observations as authenticated HN arrivals. The small preceding counts, method changes, and the [September 7 D1 incident](../d1-read-budget/00-incident.md) also prevent a clean causal lift calculation. That incident overlapped the launch date; its unrecorded traffic remains unknown.

## Capture limits and production cost

The authenticated D1 metadata REST request returned HTTP 401 / authentication error 10000. Wrangler's metadata command also failed with code 10000. We did not establish the cause of the credential failure. The computer tool reported that no browser was available. These checks do not indicate a new quota outage or zero traffic.

No direct SQL, full historical extractor, RUM query, subscriber query, or deployment ran. The single successful public report request was a cache miss and may consume database reads; the public response does not expose that cost. Do not report this grounding pass as zero-read merely because no SQL was submitted directly. Restore authorized access and inspect current metadata before further production extraction, following the [D1 budget handoff](../d1-read-budget/03-handoff.md).

Cloudflare's [Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/), checked September 9 UTC, documents collection loss and retention/sampling boundaries. A later RUM comparison must retain its actual filters, sample intervals, and eligible paths. Time-sensitive records should be preserved promptly when access returns. The public page report alone does not explain beacon delivery or readership.

## Claim decisions

| Claim | Evidence | Decision |
|---|---|---|
| This launch brought more recorded attention to article 024 | Public submission, 753 reported HN referrers, day totals | Supported within the counter's stated limits |
| The title or first-person wording caused the result | One uncontrolled launch | Hypothesis only; preserve the actual title package and test reader understanding separately |
| Readers valued the evidence and footprint | No comment explicitly establishes this | Unknown; do not use votes as an explanation |
| All of the 74.5% were bots | No independently labelled cohort | Unsupported; retain the correction |
| The rules have no false positives | No representative human-labelled sample | Unsupported; run known-client tests |
| The launch validates the audience counter | The same heuristic counter reports the increase | Unsupported; the reader's question strengthens the case for testing it |
| The reader question supplies useful direction | One visible comment asks about false positives | Supported; extend TASK-0120 rather than invent a new identity system |

Public aggregates and exact capture times are in [measurements.json](measurements.json). Private originals remain under `/Users/goga/.local/share/gkoreli/analytics-evidence/2026-09-09-article-024-hn/`, with owner-only permissions. [The manifest](capture-manifest.json) commits to their bytes; it does not independently authenticate the services.
