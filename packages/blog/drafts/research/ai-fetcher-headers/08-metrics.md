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

So 4.8% of the requests for this article are in the Browsers class as the page counted it, and about 2.4% are plausible readers once the author and the infrastructure are removed (see the row-level read below). The largest single group is `legacy-browser` (207 views, a UA claiming an engine older than the Fetch Metadata versions), then `other-bot` (136), `http-client` (147 across two reasons) and `cloud-browser` (285 across fifteen hosting networks, led by Amazon, DigitalOcean and AWS ranges).

Named agents and crawlers on the article in the same window: FacebookBot 21, YandexBot 10, HeadlessChrome 7, Bytespider 4, ChatGPT-User 4, Googlebot 3, Applebot 2, and one each of Bingbot, Claude-User, ClaudeBot, DuckAssistBot (the signed one), GPTBot, LinkedInBot, Meta-ExternalAgent, OAI-SearchBot, PerplexityBot, Slackbot. A second `signed-agent` row appeared that was not part of the study: `https://crawler.exa.ai`, verified by the Worker.

## Are the 42 people? Read row by row, about half

The public number was 42 in the Browsers class. Reading all 42 rows in D1 against RIPEstat registry holders, on 2026-09-03 at 17:00 UTC:

| Group | Rows | Detail |
|---|---:|---|
| The author | 7 | AS62887 WhiteSky, a single daily client id, 05:06 to 06:37 UTC, including the click on his own X link at 06:00:27. Owner exclusion is an exact match against a static IP list and his address is dynamic, so his own reading was published as audience |
| Infrastructure, not readers | 14 | Internet Archive (AS7941) ×2 at 06:16:01 and 06:16:04, right after the Hacker News submission, and confirmed as the Wayback Machine by the snapshot `web.archive.org/web/20260903061604/` whose timestamp matches the second row exactly; Hivelocity (AS29802) ×4, two pairs at exactly 06:20:00 and exactly 07:25:00 from one client id with referrer `hnagg.com`; Sprious/Rayobyte (AS64267) ×1 with referrer `hacker-news.firebaseio.com`, a JSON API host no browser sends as a referer; Byteplus (AS150436) ×2 in the same second from two client ids; HZ Hosting (AS59711) ×1; IT7 Networks (AS25820) ×1; Black Mesa (AS46997) ×1; Hurricane Electric (AS6939) ×2 |
| Plausible readers | 21 | Consumer, mobile and university networks: Charter, Comcast ×2, Cox, Windstream, TELUS, Vodafone Germany, Vodafone UK, Free SAS, Virgin Media, RWTH Aachen (mobile), Atria Convergence, China Mobile, China Telecom Tianjin ×2 (mobile), SK Broadband, HGC, NETV, Hulum Almustakbal, Akamai (mobile), and two small ASNs in Japan and France |

Eleven of the twenty-one plausible readers carry a `news.ycombinator.com` referrer, two came from Google, and two from `hnagg.com`. The rest arrived with no referrer.

**The honest number for this article's first ten hours is about 21 people, not 42.** Neither number is verified: the twenty-one are inferred from consumer networks, browser-shaped requests and plausible referrers, which is the ceiling of what request evidence can establish. This article's own finding applies here too, since an anonymous Grok fetch or any proxied browser-shaped client on a consumer network would sit in exactly this group.

Two names in the rows are wrong in a way worth recording: Cloudflare's `as_org` printed `Chiron Software LLC` where the registry says Cox Communications, and `AviationAI` where the registry says Comcast. That is the same block-organisation mismatch the article documents for nine of sixteen Grok exits, appearing now in the site's own stats page.

The three defects behind the over-count are recorded in `docs/adr/0016.4-owner-exclusion-and-network-evidence.md` and implemented under TASK-0117: owner marking that does not depend on an address, five hosting networks added, and archivers named as archivers.

## Distribution results so far

| Channel | Status | Result at +10h |
|---|---|---|
| X | posted 2026-09-03 06:00 UTC by Goga | 8 views on the post as of ~06:10; 1 referral to the article; two replies, both generic and likely generated |
| Hacker News | submitted 06:15:14 UTC by `gogakoreli`, item 49546499 | 1 point, 1 comment (Goga's own author note), never on the front page; 8 direct referrals plus 5 via HN mirrors and the HN API |
| Lobsters, Cloudflare community, subreddit | not submitted | TASK-0115 |
| Upstream project contributions | not filed | TASK-0112 |
| Vendor confirmation asks | not sent | TASK-0111 |

## Read against the lane's premise

The lane bets that reference pages earn links. At +10h this page has one self-submitted HN entry with one point and no external comments, and about twenty-one plausible readers against 872 requests. That is a small sample and a single day; the +24h and +7d snapshots go below. It is also the first data point that the article's own thesis applies to the article: most of what requested this page was not a person, and the honest number is a lower bound.

| Snapshot | Date | Browsers | Agents | Crawlers | Automation | All |
|---|---|---:|---:|---:|---:|---:|
| +10h as the stats page showed it | 2026-09-03 16:30 UTC | 42 | 7 | 48 | 782 | 879 |
| +10h as the rows support | 2026-09-03 17:00 UTC | ~21 | 7 | 50 | 794 | 872 |
| +36h as the stats page showed it | 2026-09-04 18:00 UTC | 52 | 8 | 52 | 888 | 1000 |
| +36h as the rows support | 2026-09-04 18:00 UTC | ~21 | 8 | 52 | 898 | 979 |
| +36h after migration 0008 | 2026-09-04 18:32 UTC | 37 | 8 | 54 | 902 | 1001 |
| +7d | owed 2026-09-10 | | | | | |

## +36h read, 2026-09-04 18:00 UTC

The Browsers class grew from 42 to 52. All ten new rows are automation, so the reader count did not move.

| Rows | Network | What they are |
|---|---:|---|
| 6 | AS17638 China Telecom Tianjin, referrer `uniuit.com` | five of the six share one daily client id and arrive at 02:43, 06:48, 10:09, 13:25 and 17:53 UTC, roughly every three and a half hours. That is a monitor polling the page, not a person rereading it. The network is a genuine consumer ISP, so no network rule catches it and no per-request rule can: the signal is the interval, which only exists across requests |
| 2 | AS139341 Aceville Pte Ltd | both at exactly 22:58:39, from two client ids geolocated Thailand and Mexico. A proxy pool |
| 1 | AS213230 Hetzner Cloud | a second Hetzner ASN that the hosting list was missing while AS24940 was present |
| 1 | AS62610 Zenlayer | edge-cloud provider |

So the honest reader count for this article stands at about 21, all from the first day and mostly from Hacker News. Nothing arrived in the following 24 hours that looks like a person.

Three of these networks were added to the hosting list on 2026-09-04 (ADR-0016.4 section B). The polling client is left as it is and recorded here as the limit: request evidence cannot see a pattern that only exists across requests, and this site does not profile clients over time.

## Migration 0008 applied, 2026-09-04 18:30 UTC

The reclassification is live in D1. It rewrote 38 rows across the whole site, not just this article: 19 Internet Archive rows from `browser` to `preview-or-feed`, and 19 hosting rows from `browser` or `legacy-browser` to `cloud-browser` on the eight added ASNs. The public Browsers count for this page fell from 52 to 37, and the remaining gap to the roughly 21 the rows support is the author's own seven views, which need the owner endpoint and therefore the deploy.

Nothing was lost. The 38 affected rows were exported out of band before the migration ran, and the migration records every rewrite in `reader_kind_revisions` with the value it replaced. Cross-checking the two afterwards: 38 rows each, identical observation ids, and zero rows whose recorded prior value differs from the export. Total observations are unchanged and the migration contains no `DELETE`.

That table is new and matters beyond this change: migrations 0006 and 0007 rewrote classifications in place, so their prior verdicts are recoverable only by reading their SQL. From 0008 onward each rewrite is auditable per observation.
