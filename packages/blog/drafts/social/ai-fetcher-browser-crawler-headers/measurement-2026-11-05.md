# November 5 launch response and traffic check

There is a small social-referral signal: **three article requests with `t.co` referrers and two with Reddit referrers**. These are stored request observations, not five demonstrated readers. One Reddit-referring observation is classified as GPTBot. The original X post separately reports **13 impressions and zero link clicks**. The evidence does not attribute the five site requests to individual posts or establish causal uplift.

[Reviewed aggregate projection and query meters](measurement-2026-11-05.json) · [New publications and exact copy](round-three-2026-11-05.md).

## Window and historical observations

The frozen interval is **November 5, 16:45:18 UTC inclusive to November 6, 05:41:30 UTC exclusive**: approximately the first thirteen hours after the X launch, ending before this round’s social submissions and current verification activity. The client date is November 5 in America/Los_Angeles. All selected observations have `is_owner=0`; that flag does not establish that owner, agent or concurrent-session activity is absent.

Wrangler 4.71.0 read the authenticated Cloudflare D1 database through the official SELECT command path. A path-and-time-indexed aggregate selected the two article paths. A second time-indexed query inspected X/Reddit referrer hosts across all stored site paths in the same window. Every returned social-referral group belongs to the new article.

| Stored article path | Request observations |
| --- | ---: |
| `/ai-fetcher-browser-crawler-headers` | 72 |
| `/which-ai-fetchers-send-which-headers` | 12 |

The new article’s recorded reader kinds are 26 Cloud Browser, 15 Other Bot, 13 AI Search, seven Unresolved, six Browser, two AI Crawler, two Search Crawler and one HTTP Client. These are classifier results, not independent identities or people. Named observations include six stored verified ExaSearchBot requests; other recorded agent names include Applebot, PerplexityBot, ClaudeBot, Googlebot and GPTBot. The campaign did not run new provider trials, and these requests cannot all be assigned to the campaign.

| Referrer host | Recorded kind | Stored article requests |
| --- | --- | ---: |
| `t.co` | Browser | 3 |
| `www.reddit.com` | Browser | 1 |
| `old.reddit.com` | AI Crawler / GPTBot | 1 |

All posts used the same untagged canonical article link. The stored referrer host supplies no post-level join. Absent referrers, internal navigation and other search/crawler observations remain unattributed. Daily client keys were not published or summed into a people count. Browser classification does not prove a human; the GPTBot label does not independently authenticate that operator.

## Retained Cloudflare logs and live capture

The signed-in Cloudflare dashboard exposed retained Worker events. Its historical filter covered November 5, 16:45 to November 6, 05:41 UTC, with an article-text search. That text search can include associated asset events, so its event total is not an article page-request census. A separate 22:28–22:30 UTC filter isolated the Reddit example.

Two retained page GETs returned HTTP 200: one with a `t.co` referrer and Twitter-for-iPhone user-agent, and one with a `www.reddit.com` referrer and Chrome-style user-agent. Their storage acknowledgements exposed exact observation IDs. A native-tested primary-key SELECT found both exact D1 rows, with the expected article path, referrer host, owner flag and Browser classification. Raw headers, IDs, account UI and operational captures stay private. These two samples corroborate persistence and request headers; they are not an exhaustive retained-log audit or a person-level attribution proof.

The separately authorized bounded Wrangler tail ran **05:45:28–05:49:29 UTC on November 6**, stopping at its four-minute bound. It captured 352,155 bytes, 56 complete JSON objects, 56 `ok` outcomes and 17 `analytics.observation_stored` acknowledgements; 13 invocations target the new article. This live interval is outside the frozen campaign window and may contain current owner/concurrent/session activity. It is not added to the 72-request total or presented as new organic traffic. This measurement generated no synthetic probes.

All three diagnostic SELECTs passed native workerd/D1 fixture and query-plan checks before production execution. Metered work was **207 + 401 + 6 = 614 rows read**, three one-attempt statements, **zero rows written** and no database changes. Metadata inspection and dashboard log queries are distinct operations; rolling database counters are not this task’s metered cost or a count of readers.

## Replies and platform engagement

The current X notification feed shows no campaign response, and the original X status reports zero replies. Native Post Analytics, captured at 05:57 UTC, reports 13 impressions, three engagements, three detail expands, zero profile visits, zero link clicks, zero likes and zero reposts. Owner/repeated views may count, and the data cutoff is not exposed. The preceding loaded status view showed 12 views; these are separate dated observations, not a performance baseline.

Reddit has [one new response beneath the Superframeworks contribution](https://www.reddit.com/r/Superframeworks/comments/1xnmzo8/comment/19s78gp47t136/). It mainly promotes PeerPush and reports 14M AI pulls. That is an unverified service claim, not evidence that the commenter read the article or used its findings. A [genuine follow-up](https://www.reddit.com/r/Superframeworks/comments/1xnmzo8/comment/19s7p2e8wuapt/) asks how those pulls were identified and distinguishes tasks from requests. Older Bun/ChatGPTCoding responses and the two-day-old 2,062-view CloudFlare notification are outside this campaign measurement.

Coverage is bounded to both notification feeds, the original X status/analytics, the observed Reddit child thread and saved campaign context. It is not an exhaustive inspection of every child reply. Independent web fetches of the original X post and the new Reddit article returned cache misses; anonymous visibility and moderation placement remain unverified. A cache miss does not establish removal or suppression.

## Next bounded action

The requested response/traffic check and new distribution are complete. A proposed next check is roughly 24 hours after the X launch: repeat the same cumulative window/referrer method, inspect replies and native link-click counters, then decide whether any substantive reader evidence needs an answer. No monitoring or automation was scheduled. More link drops are not evidence of a successful distribution strategy.
