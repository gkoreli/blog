# Post 023 metrics: what the first ten hours actually were

Published 2026-09-03 ~06:00 UTC. Snapshot taken 16:30 UTC (about +10h) from the site's own public stats API, `/api/stats?path=/which-ai-fetchers-send-which-headers&range=7d`. Every number below is the site's own edge counter; the Cloudflare Web Analytics calibration owed in TASK-0104 has not run yet.

## Composition

| Public filter | Reader kinds it contains | Views | Daily clients |
|---|---|---:|---:|
| Browsers | `browser` (browser UA, navigation-shaped Fetch Metadata, network not on the hosting list) | 42 | 32 |
| Agents | `signed-agent`, `ai-assistant` | 7 | 7 |
| Crawlers | `search-crawler`, `ai-search`, `ai-crawler`, `preview-or-feed` | 48 | 41 |
| Automation | `cloud-browser`, `headless-browser`, `http-client`, `other-bot`, `legacy-browser` | 782 | 475 |
| **All** | | **879** | **555** |

So 4.8% of the requests for this article are in the Browsers class. The largest single group is `legacy-browser` (207 views, a UA claiming an engine older than the Fetch Metadata versions), then `other-bot` (136), `http-client` (147 across two reasons) and `cloud-browser` (285 across fifteen hosting networks, led by Amazon, DigitalOcean and AWS ranges).

Named agents and crawlers on the article in the same window: FacebookBot 21, YandexBot 10, HeadlessChrome 7, Bytespider 4, ChatGPT-User 4, Googlebot 3, Applebot 2, and one each of Bingbot, Claude-User, ClaudeBot, DuckAssistBot (the signed one), GPTBot, LinkedInBot, Meta-ExternalAgent, OAI-SearchBot, PerplexityBot, Slackbot. A second `signed-agent` row appeared that was not part of the study: `https://crawler.exa.ai`, verified by the Worker.

## Are the 42 people?

Evidence that most are:

- **18 of the 42 carry a referrer**, and every referrer is consistent with a person following a link: `news.ycombinator.com` 8, `hnagg.com` 4 (an HN mirror, "HNAgg — Top Hacker News Stories"), `google.com` 2, `uniuit.com` 2, `hacker-news.firebaseio.com` 1, `t.co` 1.
- **The hourly shape matches the two submissions.** Goga posted to X at 2026-09-03 06:00 UTC and submitted to Hacker News at 06:15:14 UTC (item 49546499). Views by hour: 05:00 → 3, 06:00 → 24 (20 distinct clients), 07:00 → 9, 08:00 → 2, then 1–2 per hour into the afternoon. Automated traffic in the same window carries no referrer and no such decay.
- **32 distinct daily clients for 42 views**, about 1.3 requests each, which is what one-visit reading looks like.
- Countries: US 23, then China 3, Germany 2, France 2, UK 2, Singapore 2, and single views from Canada, Chile, Denmark, Hong Kong, India, Iraq, Japan, South Korea.

What cannot be claimed:

- **24 of the 42 have no referrer at all.** That is the uncertain part, and it is exactly where this article's own finding lands: an anonymous Grok fetch, or any proxied client with full browser headers on a consumer network, is stored in the `browser` class and is indistinguishable from a person at the request level. None of the study's own probe traffic hit this path, but the class cannot exclude that traffic in general.
- `uniuit.com` is the corporate site of a Chinese company and is not an obvious link source; two views referred from it are unexplained.
- The Browsers class is not "verified human" and the stats page does not call it that.

## Distribution results so far

| Channel | Status | Result at +10h |
|---|---|---|
| X | posted 2026-09-03 06:00 UTC by Goga | 8 views on the post as of ~06:10; 1 referral to the article; two replies, both generic and likely generated |
| Hacker News | submitted 06:15:14 UTC by `gogakoreli`, item 49546499 | 1 point, 1 comment (Goga's own author note), never on the front page; 8 direct referrals plus 5 via HN mirrors and the HN API |
| Lobsters, Cloudflare community, subreddit | not submitted | TASK-0115 |
| Upstream project contributions | not filed | TASK-0112 |
| Vendor confirmation asks | not sent | TASK-0111 |

## Read against the lane's premise

The lane bets that reference pages earn links. At +10h this page has one self-submitted HN entry with one point and no external comments, and its first-day audience is 4.8% browser-class requests against 89% automation-class. That is a small sample and a single day; the +24h and +7d snapshots go below. It is also the first data point that the article's own thesis applies to the article: most of what requested this page was not a person, and the honest number is a lower bound.

| Snapshot | Date | Browsers | Agents | Crawlers | Automation | All |
|---|---|---:|---:|---:|---:|---:|
| +10h | 2026-09-03 16:30 UTC | 42 | 7 | 48 | 782 | 879 |
| +24h | owed 2026-09-04 | | | | | |
| +7d | owed 2026-09-10 | | | | | |
