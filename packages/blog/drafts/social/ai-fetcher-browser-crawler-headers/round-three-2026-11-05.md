# November 5 response check and third discussion batch

Five additional X destinations, five Reddit comments/follow-ups and one native Reddit article were published at the owner’s explicit request. Two additional X clarification replies retain precise operation and regression-corpus denominators. All thirteen canonical signed-in owner views were verified. Independent public visibility remains unverified.

[Traffic and response measurement](measurement-2026-11-05.md) · [Structured publication receipt](round-three-publication-2026-11-05.json)

## Published links

| Platform | Parent / purpose | Published contribution |
| --- | --- | --- |
| x | [New technical contribution](https://x.com/benny617/status/2118559408741609667) | [Permalink](https://x.com/GogaKoreli/status/2118580889466863776) |
| x | [New technical contribution](https://x.com/a_jfedor/status/2118475848374514050) | [Permalink](https://x.com/GogaKoreli/status/2118581079796006933) |
| x | [New technical contribution](https://x.com/rpvibs10/status/2118514159336006036) | [Permalink](https://x.com/GogaKoreli/status/2118581510991421562) |
| x | [Scope clarification, not an additional outreach destination](https://x.com/GogaKoreli/status/2118581510991421562) | [Permalink](https://x.com/GogaKoreli/status/2118581881809854954) |
| x | [New technical contribution](https://x.com/POTATOCHEAPGAM1/status/2118574567253999735) | [Permalink](https://x.com/GogaKoreli/status/2118582179643215879) |
| x | [New technical contribution](https://x.com/adm_lawson/status/2118480570867187950) | [Permalink](https://x.com/GogaKoreli/status/2118582484745290065) |
| x | [Corpus denominator clarification, not an additional outreach destination](https://x.com/GogaKoreli/status/2118582179643215879) | [Permalink](https://x.com/GogaKoreli/status/2118584004790354427) |
| reddit | [Technical comment / follow-up](https://www.reddit.com/r/CloudFlare/comments/1xnu88t/anyone_else_seeing_aggressive_crawling_from/) | [Permalink](https://www.reddit.com/r/CloudFlare/comments/1xnu88t/comment/19s7op3eo2602/) |
| reddit | [Technical comment / follow-up](https://www.reddit.com/r/GEO_optimization/comments/1wss6rn/we_process_400_million_crawler_requests_per_month/) | [Permalink](https://www.reddit.com/r/GEO_optimization/comments/1wss6rn/comment/19s7ou02qsk4l/) |
| reddit | [Technical comment / follow-up](https://www.reddit.com/r/SearchAPIs/comments/1xne0se/multiagent_research_assistant_with_tavily_search/) | [Permalink](https://www.reddit.com/r/SearchAPIs/comments/1xne0se/comment/19s7p08dg25eq/) |
| reddit | [Technical comment / follow-up](https://www.reddit.com/r/SearchAPIs/comments/1xonwy9/parallel_mcp_20_one_server_for_web_search_page/) | [Permalink](https://www.reddit.com/r/SearchAPIs/comments/1xonwy9/comment/19s7p1joqb729/) |
| reddit | [Technical comment / follow-up](https://www.reddit.com/r/Superframeworks/comments/1xnmzo8/comment/19s78gp47t136/) | [Permalink](https://www.reddit.com/r/Superframeworks/comments/1xnmzo8/comment/19s7p2e8wuapt/) |

Standalone Reddit article: [i tested AI fetchers against my own logs. a bot name wasn't enough to explain who read the page](https://www.reddit.com/r/LLMTraffic/comments/1xp569x/i_tested_ai_fetchers_against_my_own_logs_a_bot/).

## Exact submitted copy

### 1. x

[Published](https://x.com/GogaKoreli/status/2118580889466863776) · canonical owner view verified · 236/280 weighted characters

```text
check the covered fields too. dot's browser + curl verified as chatgpt on my site, but path/query/UA were unsigned. changing those still passed my local replay; hostname/method changes failed.

my coverage tests: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

### 2. x

[Published](https://x.com/GogaKoreli/status/2118581079796006933) · canonical owner view verified · 233/280 weighted characters

```text
that grep misses unsigned agent browsers. grok made 11 chrome/safari-style requests in my controlled run, all stored Browser. i'd keep the UA matches, but label them as a lower bound.

my headers + log checks: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

### 3. x

[Published](https://x.com/GogaKoreli/status/2118581510991421562) · canonical owner view verified · 247/280 weighted characters

```text
worth testing the real tools alongside the UA probes. my Context API/CLI/MCP trials made 11 unsigned page requests with no vendor declaration: 10 Browser + 1 Cloud Browser in my collector.

my operation-by-operation checks: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

### 4. x

[Published](https://x.com/GogaKoreli/status/2118581881809854954) · canonical owner view verified · 205/280 weighted characters

```text
small precision on that count: the 11 labelled page requests came from the authenticated UI/REST/MCP retrieval trials. CLI Search was a separate result check; i didn't attribute a fresh page request to it.
```

### 5. x

[Published](https://x.com/GogaKoreli/status/2118582179643215879) · canonical owner view verified · 244/280 weighted characters

```text
save the directory-derived publisher profile with each receipt too. mine used today's catalog to display old signatures; a catalog update changed historical labels. freezing that profile fixed 46 saved receipts.

my fix: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

### 6. x

[Published](https://x.com/GogaKoreli/status/2118582484745290065) · canonical owner view verified · 246/280 weighted characters

```text
i'd split named crawlers from user-directed browsers too. dot used both chrome and curl on my site, verified as one chatgpt publisher. a browser UA alone still wouldn't establish JS execution.

my fetch/browser comparison: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

### 7. x

[Published](https://x.com/GogaKoreli/status/2118584004790354427) · canonical owner view verified · 163/280 weighted characters

```text
46 is the size of the saved-receipt regression corpus, not a count of changed labels. the fix made those historical projections stable against later catalog edits.
```

### 8. reddit

[Published](https://www.reddit.com/r/CloudFlare/comments/1xnu88t/comment/19s7op3eo2602/) · canonical owner view verified

```text
requesting JS/CSS doesn't tell you whether the crawler executed JS. i'd keep the page requests, asset requests and expensive dynamic endpoints separate when comparing the burst with origin CPU.

i hit a similar attribution gap while testing my own site: grok used chrome/safari-style headers for 11 requests, all unsigned. those headers alone didn't prove browser execution or operator identity. my controlled requests + Cloudflare log checks: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

### 9. reddit

[Published](https://www.reddit.com/r/GEO_optimization/comments/1wss6rn/comment/19s7ou02qsk4l/) · canonical owner view verified

```text
i'd keep 'outside the published IP feed' separate from 'fake'. my controlled Claude-User fetch reached a uniquely labelled URL from an address outside Anthropic's current feed. the test tied it to that operation; the feed miss alone couldn't establish impersonation.

my headers and stored-row checks: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

### 10. reddit

[Published](https://www.reddit.com/r/SearchAPIs/comments/1xne0se/comment/19s7p08dg25eq/) · canonical owner view verified

```text
one regression case i'd add for claim validation: successful extraction, wrong final answer. tavily extract returned my page text, but mini research missed the requested heading/sentence, misstated the signature coverage and returned no sources in that run.

i'd check the retrieved source, exact requested field and supported claim separately. this was one page, not a ranking or a test of your assistant. my inputs + results: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

### 11. reddit

[Published](https://www.reddit.com/r/SearchAPIs/comments/1xonwy9/comment/19s7p1joqb729/) · canonical owner view verified

```text
for the freshness controls, i'd test the input URL and canonical fallback separately. perplexity failed on my query-bearing URL, then answered from canonical/# inputs. # never reaches the server, so that success couldn't label a fresh origin request.

does web_fetch expose cache versus fresh-origin retrieval in its result? i haven't tested Parallel yet; my URL controls + logs are here: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

### 12. reddit

[Published](https://www.reddit.com/r/Superframeworks/comments/1xnmzo8/comment/19s7p2e8wuapt/) · canonical owner view verified

```text
one task can produce a bunch of pulls, that's why i'm keeping requests separate from agent tasks. grok made 11 GETs from one prompt in my test.

do you publish how those 14M were identified, named user-agent, network match or verified signature? would be useful to compare methods.
```

## Standalone Reddit article

i tested AI fetchers against my own logs. a bot name wasn't enough to explain who read the page

```text
grok read my page and every one of its 11 requests ended up in my Browser bucket. chrome/safari user-agents, no grok token, no signature. that was one signed-in Fast run on nov 5, not a claim about every grok request.

i tested search, fetch and browser tools against my own Cloudflare Worker, with Codex helping run the trials and write up the results. the useful bit was separating three checks that are easy to collapse into one:

1. did a request reach the site? i assigned a test URL, watched the Worker logs, then matched the insert acknowledgement to the exact D1 row. a 200 response alone doesn't prove your analytics stored it.

2. what identity did the request actually prove? chatgpt's browser and curl used different user-agents but verified as the same publisher. their signatures covered hostname and method, while path, query and user-agent were unsigned. i checked that by mutating captured requests locally. a verified publisher isn't proof that every field was signed, or that a human clicked.

3. did the answer use the page correctly? the Context provider cited the right article but returned the wrong requested maintenance sentence. tavily extract returned the page text, while its mini research missed the requested heading/sentence and supplied no sources in that run. those are different failures from never fetching the page. one page isn't a provider ranking.

for an AI visibility report, i'd keep fetch observations, verified identity, citations and answer accuracy as separate columns. matching a known crawler user-agent is useful evidence, but it misses things like that grok run. a citation also doesn't establish a fresh origin request.

one testing gotcha: perplexity failed with a query-bearing URL, then answered from canonical/# inputs. the fragment never reaches the server, so it can't label an origin log row.

my full headers, exact prompts, settings and fixes: https://gkoreli.com/ai-fetcher-browser-crawler-headers
```

## Destination checks and corrections

r/LLMTraffic explicitly permits repurposed native self-posts with one link to the original blog. The article supplies the methods and findings on Reddit and discloses Codex’s role. r/CloudFlare’s wiki and current thread context were reviewed; its new comment distinguishes asset requests from demonstrated JavaScript execution. r/GEO_optimization’s expanded rules prohibit spam and direct sales promotion; its new comment supplies a bounded counterexample to a binary IP-feed verdict. r/SearchAPIs allows meaningful technical discussion and requires comparison methodology; the two comments offer an evaluation fixture and a freshness question, without claiming Parallel was tested. Superframeworks uses the moderator’s project-sharing invitation; the fifth comment follows an actual reply and asks for its counting method. The source link already exists in the ancestor contribution and is not repeated in that follow-up.

Skipped candidates included r/Agentic_SEO (No Blogs), r/AISEOTricks and r/EcommerceWebsite (own-link promotion restrictions), and r/AI_Agents / r/selfhosted (promotion-ratio guidance not established for this campaign). No content was disguised to bypass those rules.

The Context reply initially grouped the eleven requests with API/CLI/MCP trials. A public clarification specifies authenticated UI/REST/MCP retrievals; CLI Search was a separate result check. The historical-profile reply’s “fixed 46 saved receipts” wording is clarified publicly: 46 is the regression-corpus size, not the number of changed labels. Exact original copy and both clarifications remain recorded above.

## Verification and continuity

Own author, submitted text and source link/card were checked at each canonical URL; the two clarifications and nested genuine follow-up intentionally do not repeat the source link. Private screenshots and account/log captures remain in ignored worklog storage. Independent fetches of the new Reddit article and original X post returned cache misses; those do not establish anonymous visibility or removal. No manual votes, DMs, moderation changes, deletion/reposting, new provider trials or monitoring were performed.

Campaign delivery now totals one original X post, seventeen outreach replies plus two clarification replies on X, seventeen Reddit comments/follow-ups and this one new standalone Reddit article. The older November 1 CloudFlare post is separate. Distribution work remains outside the frozen article research footprint.

Validation: all 31 post validations pass; thirteen distinct publication URLs and saved owner-view text checks pass; the seven X contributions are within 280 weighted characters; 56 local document links resolve; the reviewed JSON projections contain no raw request headers, client keys or credentials. No application code changed, so no production build or new runtime acceptance was required.
