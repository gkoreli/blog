# AI fetcher and crawler documentation — vendor evidence table

Research date: 2026-09-02. All entries built from vendor-owned documentation pages fetched or search-indexed on this date, unless marked UNVERIFIED. WebFetch could not render two vendor pages directly (OpenAI's ChatGPT-agent help article, Bing's webmaster help page — both are JS-driven); for those, evidence comes from search-engine snippets of the same vendor URL, quoted verbatim where possible, and is flagged below.

## Summary table

| Agent | Vendor | Purpose (vendor's words) | UA string | IP list | Signs w/ Web Bot Auth | Source URL | Fetched |
|---|---|---|---|---|---|---|---|
| GPTBot | OpenAI | Training data crawl | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot` | Yes — openai.com/gptbot.json | No (undocumented) | developers.openai.com/api/docs/bots | 2026-09-02 |
| OAI-SearchBot | OpenAI | Search index for ChatGPT search | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/searchbot` | Yes — openai.com/searchbot.json | No (undocumented) | developers.openai.com/api/docs/bots | 2026-09-02 |
| ChatGPT-User | OpenAI | On-demand fetch for a user question in ChatGPT/Custom GPTs | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot` | Yes — openai.com/chatgpt-user.json | No (undocumented for this token) | developers.openai.com/api/docs/bots | 2026-09-02 |
| ChatGPT agent / Cloud browser fetcher | OpenAI | On-demand agentic browsing triggered by a user | UNVERIFIED — no separate UA string found; identity carried by the `Signature-Agent` header instead | UNVERIFIED — no IP-range JSON found for this fetcher | **Yes** — RFC 9421 HTTP Message Signatures, `Signature-Agent: "https://chatgpt.com"`, public keys at chatgpt.com/.well-known/http-message-signatures-directory | help.openai.com/en/articles/11845367 (fetched via search snippet only — direct WebFetch returned 403) | 2026-09-02 |
| Claude-User | Anthropic | On-demand fetch when a person asks Claude a question | UNVERIFIED — vendor page names the token (`Claude-User`) but the full UA string (Mozilla prefix etc.) was not shown in the fetched excerpt | Yes — claude.com/crawling/bots.json (shared list for all three Claude bots) | UNVERIFIED (not mentioned) | support.claude.com/en/articles/8896518 | 2026-09-02 |
| Claude-SearchBot | Anthropic | Web navigation to improve Claude's search-style answers | UNVERIFIED — token only (`Claude-SearchBot`) | Yes — claude.com/crawling/bots.json | UNVERIFIED (not mentioned) | support.claude.com/en/articles/8896518 | 2026-09-02 |
| ClaudeBot | Anthropic | Training-data collection | UNVERIFIED — token only (`ClaudeBot`) | Yes — claude.com/crawling/bots.json | UNVERIFIED (not mentioned) | support.claude.com/en/articles/8896518 | 2026-09-02 |
| Perplexity-User | Perplexity | On-demand fetch for a user's question | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)` | Yes — perplexity.com/perplexity-user.json | UNVERIFIED (not mentioned in vendor docs) | docs.perplexity.ai/guides/bots | 2026-09-02 |
| PerplexityBot | Perplexity | Search indexing (explicitly not for model training) | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)` | Yes — perplexity.com/perplexitybot.json | UNVERIFIED | docs.perplexity.ai/guides/bots | 2026-09-02 |
| Google-Extended | Google | Opt-out token for Gemini/Vertex training + grounding (not a fetcher itself) | None — "doesn't have a separate HTTP request user agent string"; rides on Googlebot UA | N/A (piggybacks on Googlebot ranges) | UNVERIFIED | developers.google.com/search/docs/crawling-indexing/google-common-crawlers | 2026-09-02 |
| Google-Agent | Google | On-demand fetch by Google-hosted agents acting on a user request | `...Chrome/W.X.Y.Z ... (compatible; Google-Agent;...)` (desktop and mobile variants; no version-pinned example given) | Yes — user-triggered-agents.json | UNVERIFIED — third-party claims Google-Agent signs, not vendor-confirmed | developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers | 2026-09-02 |
| Google-GeminiNotebook | Google | Fetches URLs a Gemini/NotebookLM user supplied as a source | `...Chrome/138.0.0.0 ... (compatible; Google-GeminiNotebook;...)` | Yes — user-triggered-fetchers*.json family | UNVERIFIED | developers.google.com/search/docs/crawling-indexing/google-user-triggered-fetchers | 2026-09-02 |
| Googlebot (incl. AI Overviews/AI Mode) | Google | Search crawl; vendor states AI Overviews/AI Mode use the same index/crawl, no separate token | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36` (+ mobile variant) | Yes — common-crawlers.json | UNVERIFIED | developers.google.com/search/docs/appearance/ai-features; .../google-common-crawlers | 2026-09-02 |
| bingbot | Microsoft | Crawl feeding Bing Search, Yahoo, DuckDuckGo, **and Copilot** | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/W.X.Y.Z Safari/537.36` (+ mobile) | Yes — bing.com/bingbot.json; verify tool at bing.com/toolbox/verify-bingbot | UNVERIFIED | blogs.bing.com/webmaster/april-2022 (bing.com webmaster help page itself is JS-rendered and returned no body to WebFetch) | 2026-09-02 |
| MicrosoftPreview | Microsoft | Link-preview/snapshot fetcher for Teams, Outlook, SharePoint, Copilot | UNVERIFIED — exact string not confirmed on a fetchable vendor page | UNVERIFIED | UNVERIFIED | No vendor page rendered for WebFetch; only third-party summaries found | 2026-09-02 |
| Copilot-specific on-demand fetcher | Microsoft | On-demand fetch for a Copilot chat question | UNVERIFIED — no separate vendor-documented UA token found distinct from bingbot/MicrosoftPreview | UNVERIFIED | UNVERIFIED | No official Microsoft page found naming a distinct Copilot fetcher token | 2026-09-02 |
| Grok crawler family (GrokBot/xAI-Grok/Grok-DeepSearch) | xAI | UNVERIFIED | UNVERIFIED — strings only exist in third-party lists, not on any x.ai/xai docs page found | UNVERIFIED | UNVERIFIED | **No official xAI documentation page found.** x.ai/robots.txt, grok.com/robots.txt, grokipedia.com/robots.txt reportedly contain no xAI/Grok token at all (third-party finding, not vendor-confirmed) | 2026-09-02 |
| Meta-ExternalAgent | Meta | Training-data crawl / product indexing | `meta-externalagent/1.1 (+/documentation/sharing/webmasters/web-crawlers)` — literal relative-path fragment as published (see note) | UNVERIFIED (no IP JSON found) | UNVERIFIED | developers.facebook.com/docs/sharing/webmasters/crawler | 2026-09-02 |
| Meta-ExternalFetcher | Meta | On-demand fetch of a single link at a user's request, incl. agentic navigation | `meta-externalfetcher/1.1 (+/documentation/sharing/webmasters/web-crawlers)` (same relative-path anomaly) | UNVERIFIED | UNVERIFIED | developers.facebook.com/docs/sharing/webmasters/crawler | 2026-09-02 |
| Amazonbot | Amazon | Product/service improvement, "may be used to train Amazon AI models" | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Amazonbot/0.1) Chrome/W.X.Y.Z Safari/537.36` | Yes — developer.amazon.com/amazonbot/ip-addresses/ | UNVERIFIED | developer.amazon.com/amazonbot | 2026-09-02 |
| Bytespider | ByteDance | UNVERIFIED (reported: indexing/recommendation/LLM training) | UNVERIFIED — no vendor page found; commonly reported as `Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)` but this is a third-party report, not confirmed against a live ByteDance doc | UNVERIFIED — no list found | UNVERIFIED | **No reachable official documentation.** The UA's own referenced link (zhanzhang.toutiao.com) is reported inaccessible outside China | 2026-09-02 |
| MistralAI-User | Mistral | On-demand fetch when a user asks Mistral's assistant ("Vibe") a question | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-User/1.0; +https://docs.mistral.ai/robots)` | Yes — mistral.ai/mistralai-user-ips.json | UNVERIFIED | docs.mistral.ai/robots | 2026-09-02 |
| MistralAI-Index | Mistral | Search indexing for Mistral search (feeds "Vibe" answers); explicitly not for training | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MistralAI-Index/1.0; +https://docs.mistral.ai/robots)` | Yes — mistral.ai/mistralai-index-ips.json | UNVERIFIED | docs.mistral.ai/robots | 2026-09-02 |
| DuckAssistBot | DuckDuckGo | Real-time page fetch for AI-assisted answers; explicitly not used for AI training | `DuckAssistBot/1.2; (+http://duckduckgo.com/duckassistbot.html)` | Yes — duckduckgo.com/duckassistbot.json | UNVERIFIED | duckduckgo.com/duckduckgo-help-pages/results/duckassistbot | 2026-09-02 |
| Applebot | Apple | Powers Spotlight/Siri/Safari search features; also feeds Apple foundation-model training | `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)` (+ mobile) | Yes — search.developer.apple.com/applebot.json | UNVERIFIED | support.apple.com/en-us/119829 | 2026-09-02 |
| Applebot-Extended | Apple | Opt-out-only token for AI/model-training use of already-crawled content | Same UA as Applebot; controlled purely via robots.txt token — "does not crawl webpages" itself | Shares Applebot's IP list | UNVERIFIED | support.apple.com/en-us/119829 | 2026-09-02 |
| CCBot | Common Crawl | Open web-crawl dataset for research | `CCBot/2.0 (https://commoncrawl.org/faq/)` | Yes — index.commoncrawl.org/ccbot.json | UNVERIFIED | commoncrawl.org/ccbot | 2026-09-02 |
| Cohere (any crawler) | Cohere | N/A — Cohere states it does not currently operate a training crawler | N/A — vendor's own bot registry table lists "N/A" for all entries | No | No | docs.cohere.com/docs/cohere-web-crawlers | 2026-09-02 |

Agents documented with at least a vendor-confirmed UA string and purpose: **19**. Agents/fields marked UNVERIFIED against a vendor source (no reachable/confirmed vendor doc, or doc silent on the field): **11** rows carry a UNVERIFIED UA string or purpose (ChatGPT agent fetcher, all three Claude bots' exact UA string, Google-Agent/GeminiNotebook exact strings partially, MicrosoftPreview, Copilot-specific fetcher, Grok family, Meta-ExternalAgent/Fetcher IP lists, Bytespider entirely, Applebot-Extended crawl behavior nuance) — see per-vendor notes for exactly which field is unverified in each case. Web Bot Auth signing is confirmed by vendor documentation for **only one** agent (OpenAI's ChatGPT agent/Cloud browser fetcher); every other "signs" cell is UNVERIFIED because no vendor doc found states it.

---

## Per-vendor notes

### OpenAI

Source: https://developers.openai.com/api/docs/bots (redirected from platform.openai.com/docs/bots), fetched 2026-09-02.

- GPTBot: "used to make our generative AI foundation models more useful and safe. It is used to crawl content that may be used in training our generative AI foundation models." Honors robots.txt; a `robots.txt` marker is appended to the UA string specifically when fetching robots.txt files (an implementation detail worth flagging — the crawl UA and the robots.txt-fetch UA are not byte-identical).
- OAI-SearchBot: purely for ChatGPT search surfacing. Documents a refetch/propagation delay: **"can take ~24 hours from a site's robots.txt update for our systems to adjust."**
- ChatGPT-User: explicit statement that robots.txt may not bind it — **"Because these actions are initiated by a user, robots.txt rules may not apply."** This is the "on-demand fetcher doesn't have to honor robots.txt" pattern the task asked about, stated in OpenAI's own words.
- None of GPTBot/OAI-SearchBot/ChatGPT-User's docs mention Web Bot Auth, Signature-Agent, or any header beyond User-Agent.

Separately, the **ChatGPT agent** (formerly Operator, folded into ChatGPT agent per Wikipedia and OpenAI's own deprecation notice — Operator "shut down on August 31, 2025") uses a *different* identification mechanism entirely: no fixed UA string, but RFC 9421 HTTP Message Signatures with a `Signature-Agent` header set to the literal string `"https://chatgpt.com"` (quotes included, per the vendor's own verification instructions), verifiable against public keys published at `https://chatgpt.com/.well-known/http-message-signatures-directory`. This is the clearest, most concrete Web Bot Auth deployment found across every vendor in this survey.

Caveat: I could not get WebFetch to load `help.openai.com/en/articles/11845367-chatgpt-agent-allowlisting` directly (403 Forbidden on three attempts, including via a Bing/Google-cache workaround, which also failed). The quotes above about Signature-Agent come from WebSearch snippets that appear to be extracted directly from that same help-center URL (title, structure, and exact-quote phrasing match a vendor doc, not a summarizer's paraphrase) — but this is a step short of a clean WebFetch of the primary source, so treat the exact wording as high-confidence-but-not-independently-rendered.

### Anthropic

Source: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler, fetched 2026-09-02.

- All three bots — ClaudeBot, Claude-User, Claude-SearchBot — are documented as respecting robots.txt: **"respect 'do not crawl' signals by honoring industry standard directives in robots.txt."** Anthropic draws no exception for Claude-User the way OpenAI, Perplexity, Google, and Meta do for their on-demand fetchers — Anthropic's own doc treats the user-triggered fetcher the same as the training/search crawlers for robots.txt purposes. This is the single most surprising finding in this survey (see below).
- ClaudeBot's purpose: "helps enhance the utility and safety of our generative AI models by collecting web content" (training).
- Claude-User: "supports Claude AI users. When individuals ask questions to Claude, it may access websites." Blocking it "prevents our system from retrieving your content in response to a user query."
- Claude-SearchBot: "navigates the web to improve search result quality for users."
- Anthropic documents support for the **non-standard `Crawl-delay` extension** in robots.txt — none of the other vendors surveyed mention honoring Crawl-delay.
- Shared IP list for all three bots at `https://claude.com/crawling/bots.json` — one JSON file covers the training crawler, the search bot, and the on-demand fetcher together (contrast with OpenAI/Perplexity/Mistral, which publish a separate JSON per bot).
- No mention of Web Bot Auth, Signature-Agent, or any header beyond User-Agent. No mention of caching/refetch cadence.
- I could not confirm the literal full UA strings (i.e., whether there's a `Mozilla/5.0 ...` prefix analogous to OpenAI's bots) from the fetched excerpt — the page names the tokens (`ClaudeBot`, `Claude-User`, `Claude-SearchBot`) but the rendered summary did not include a complete UA string. Mark as UNVERIFIED pending a direct re-check of the page for the full string.

### Perplexity

Source: https://docs.perplexity.ai/guides/bots, fetched 2026-09-02 (cross-checked against docs.perplexity.ai/docs/resources/perplexity-crawlers via search).

- PerplexityBot: "surface and link websites in search results on Perplexity" — explicitly **not** used for training. Up to 24 hours for robots.txt changes to propagate.
- Perplexity-User: on-demand, user-triggered. Vendor doc states plainly — **"this fetcher generally ignores robots.txt rules"** — the most direct "robots.txt does not apply" statement of any vendor surveyed (more unqualified than OpenAI's "may not apply").
- Both bots have per-bot IP JSON files (perplexitybot.json, perplexity-user.json).
- No mention of Web Bot Auth/Signature-Agent in vendor docs, despite third-party press coverage of Perplexity's Comet browser and agentic fetches — I found no vendor page confirming Comet/Perplexity-User signs requests. Mark UNVERIFIED, not "no."

### Google

Sources: developers.google.com/search/docs/crawling-indexing/google-common-crawlers, .../google-user-triggered-fetchers, .../overview-google-crawlers, .../verifying-googlebot, and search/docs/appearance/ai-features. Fetched 2026-09-02.

- Google-Extended is *not* a fetcher — it is a robots.txt-only opt-out token. Vendor doc is explicit: **"Google-Extended doesn't have a separate HTTP request user agent string. Crawling is done with existing Google user agent strings."** It governs training/grounding for Gemini Apps and Vertex AI, and the doc states it **does not affect Search ranking or inclusion.**
- Google-Agent is Google's documented "user-triggered fetcher" analog to ChatGPT-User/Perplexity-User: **"Used by agents hosted on Google infrastructure to navigate the web and perform actions upon user request."** Vendor doc states generally for this fetcher category: **"Because the fetch was requested by a user, these fetchers generally ignore robots.txt rules."**
- Google-GeminiNotebook is a distinct, separately-named user-triggered fetcher specifically for NotebookLM/Gemini Notebook source URLs — worth noting because it means Google ships at least two separately-branded on-demand fetchers, not one.
- AI Overviews / AI Mode: vendor's own AI-features doc states there is no separate crawler — **"AI is built into Search and integral to how Search functions, which is why robots.txt directives for Googlebot is the control for site owners to manage access to how their sites are crawled for Search."** and **"There are no additional requirements to appear in AI Overviews or AI Mode."** So AI Overviews rides entirely on ordinary Googlebot, unlike every other vendor's dedicated "on-demand" token.
- IP ranges are split across a family of JSON files at `developers.google.com/static/crawling/ipranges/`: `common-crawlers.json` (Googlebot etc.), `special-crawlers.json` (AdsBot etc.), `user-triggered-fetchers.json`, `user-triggered-fetchers-google.json`, and `user-triggered-agents.json` (Google-Agent). Per third-party reporting cross-checked against the vendor doc structure, fetchers whose IPs resolve to a `google.com` hostname live in the `-google` file, others resolve to `gae.googleusercontent.com`. Google renamed the old flat `googlebot.json` to this file family; the legacy URL now 200s with a "moved" payload rather than 404ing, which is a footgun for anyone still pointing a WAF at the old path.
- No vendor-confirmed mention of Web Bot Auth or a Signature-Agent header for any Google fetcher — third-party sources speculate Google-Agent signs requests, but I found no primary Google documentation saying so. Mark UNVERIFIED.

### Microsoft (Bing / Copilot)

- `bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0` is a JavaScript-rendered page; WebFetch returned only the page title with no body content on two attempts. Treat as **unreachable for direct verification**.
- Fell back to Microsoft's own blog post, which *did* render: https://blogs.bing.com/webmaster/april-2022/Announcing-user-agent-change-for-Bing-crawler-bingbot — confirms the current bingbot UA strings (desktop and mobile) shown in the table above.
- IP verification: `bing.com/bingbot.json` and a dedicated verification tool at `bing.com/toolbox/verify-bingbot` are referenced consistently across search results tied back to Microsoft's own domain, but I did not get a clean WebFetch render of the page listing them — treat the exact JSON URL as reported-but-not-independently-rendered.
- I could not find any Microsoft-owned documentation page (Bing webmaster docs or Microsoft Learn) that names a **distinct Copilot on-demand fetcher token** separate from bingbot/MicrosoftPreview. Every description of "Copilot's crawler" in available sources describes it as riding on bingbot infrastructure plus a separate `MicrosoftPreview` link-preview fetcher used across Teams/Outlook/SharePoint/Copilot. This is UNVERIFIED as a distinct entity — it may simply not exist as a separately-branded token, or Microsoft may document it somewhere not indexed/reachable in this session.
- No robots.txt-does-not-apply statement, no Web Bot Auth mention, found for any Microsoft bot in this session.

### xAI (Grok)

**No official xAI documentation page was found at all** — not at docs.x.ai, x.ai, or grok.com. This is the one vendor in the list for which I could not locate a single vendor-authored page describing crawler behavior, purpose, robots.txt stance, or UA strings. UA strings like `GrokBot/1.0`, `xAI-Grok/1.0`, `Grok-DeepSearch/1.0` appear only in third-party crawler-directory sites, and multiple independent sources report that in practice Grok's fetcher sends spoofed Chrome/Safari/`Go-http-client` strings rather than any self-identifying token, and that none of `x.ai/robots.txt`, `grok.com/robots.txt`, or `grokipedia.com/robots.txt` contain an xAI-specific user-agent line. All of this is third-party reporting, not vendor-confirmed — I flag the entire xAI row as UNVERIFIED at the vendor-documentation level, which is itself the finding.

### Meta

Source: https://developers.facebook.com/docs/sharing/webmasters/crawler, fetched 2026-09-02.

- Meta-ExternalAgent: "crawls the web for use cases such as training foundation AI models or improving products by indexing content directly." Standard robots.txt compliance.
- Meta-ExternalFetcher: "fetches individual links at a user's request and supports product functions such as evaluating and improving agentic AI capabilities—including helping AI navigate websites to complete tasks for users." Vendor doc states: **"this crawler may bypass robots.txt rules"** — another explicit on-demand-ignores-robots.txt statement.
- Oddity worth flagging: the UA string as rendered from the vendor page reads `meta-externalagent/1.1 (+/documentation/sharing/webmasters/web-crawlers)` — i.e., the parenthetical URL fragment is a **relative path with no scheme or host**, not a full URL like every other vendor's UA comment field. This came back identically on a second, differently-worded fetch, so it is very likely how the page's markup actually renders (possibly a documentation bug on Meta's side, or an artifact of how the fetcher strips the base domain when rendering to markdown). Third-party crawler databases show a fuller-looking string, `Mozilla/5.0 (compatible; Meta-ExternalAgent/1.0; +https://developers.facebook.com/docs/sharing/bot/)`, and version `1.0` rather than `1.1`, and a different path (`/docs/sharing/bot/` vs `/docs/sharing/webmasters/crawler`). Given the discrepancy between what two different fetches of the same vendor page returned and what third parties report, **mark the exact current Meta-ExternalAgent/Meta-ExternalFetcher UA string as UNVERIFIED** despite having vendor-page content in hand — the source itself is inconsistent enough across renders/reports that I don't want to assert one exact string as ground truth.
- No IP range list, no Web Bot Auth mention, no caching statement found.

### Amazon

Source: https://developer.amazon.com/amazonbot, fetched 2026-09-02.

- Purpose: "used to improve our products and services... may be used to train Amazon AI models."
- Notably specific robots.txt caching behavior, more detailed than any other vendor's doc: **"They will fetch host-level robots.txt files or use a cached copy from the last 30 days."** Also respects `rel=nofollow` and page-level `noarchive`/`noindex`/`none` robots meta tags — a level of meta-tag detail no other vendor doc in this survey mentions.
- Explicitly does **not** support `Crawl-delay` (contrast with Anthropic, which does).
- Robots.txt updates take "~24 hours" to propagate — same figure OpenAI and Perplexity use.
- IP ranges at `developer.amazon.com/amazonbot/ip-addresses/`.
- No separate on-demand "Amazon-User" style fetcher was found documented — Amazonbot appears to be Amazon's only publicly documented bot token, covering both crawling and (per the vendor's own wording) potential training use, without the on-demand-fetcher/crawler split every other major vendor makes. Worth flagging: Amazon's Alexa+/Rufus assistants presumably do fetch pages on user request, but no distinct UA token for that was found in vendor docs — UNVERIFIED/not found.

### ByteDance (Bytespider)

**No reachable official ByteDance documentation was found.** The UA string's own referenced link points to `zhanzhang.toutiao.com`, ByteDance's Chinese-language webmaster portal, which is reported by third parties as inaccessible from outside China — I did not attempt to fetch it given the reported geo-block, so I cannot confirm even that. Every fact commonly repeated about Bytespider (purpose, UA string, robots.txt behavior) traces back to third-party access-log analysis, not a vendor statement. Multiple independent researchers report Bytespider fetching URLs disallowed in robots.txt after having fetched the robots.txt file itself — i.e., third-party evidence of non-compliance — but this is explicitly not a vendor admission. Mark the entire Bytespider row UNVERIFIED at the vendor-documentation level.

### Mistral

Source: https://docs.mistral.ai/robots, fetched 2026-09-02.

- MistralAI-User: on-demand, described almost identically to OpenAI's ChatGPT-User pattern — "When users ask [the assistant] a question, it may visit a web page to help answer and include a link to the source." Vendor doc frames it as "not used for crawling the web in any automatic fashion, nor to crawl content for generative AI training," but I did not find an explicit "robots.txt does not apply" sentence for MistralAI-User the way OpenAI/Perplexity/Meta/Google state it — mark that specific claim UNVERIFIED even though the bot is clearly on-demand by design.
- MistralAI-Index: automated search-indexing crawler, explicitly "not used for generative AI training of any kind."
- Genuinely surprising find: as of this fetch, Mistral's own robots documentation names its consumer assistant product **"Vibe,"** not "Le Chat" — I re-fetched and asked for a verbatim quote to rule out a summarizer error, and got the same wording twice: **"When users ask Vibe a question, it may visit a web page..."** This suggests Mistral rebranded (or is mid-rebranding) its chat product between whatever training data underlies general knowledge of "Le Chat" and September 2026 — flagging this since it's easy to dismiss as an LLM hallucination rather than a documented vendor fact.
- Separate per-bot IP JSON files: `mistral.ai/mistralai-user-ips.json` and `mistral.ai/mistralai-index-ips.json`.
- No Web Bot Auth, no caching/refetch cadence documented.

### DuckDuckGo

Source: https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot/, fetched 2026-09-02.

- DuckAssistBot: "crawls pages in real-time for our AI-assisted answers, which prominently cite their sources. This data is not used in any way to train AI models."
- Notably slow, explicit propagation delay for opt-out: **"the change will take effect after 72 hours"** — three times longer than the ~24 hours OpenAI/Perplexity/Amazon document, worth flagging as the outlier.
- IP list (300+ addresses, Azure-hosted ranges) at `duckduckgo.com/duckassistbot.json`; dedicated abuse/opt-out contact `crawling@duckduckgo.com` is unusual — no other vendor doc in this survey publishes a direct contact email for crawler issues.
- No Web Bot Auth or extra-header documentation found.

### Apple

Source: https://support.apple.com/en-us/119829, fetched 2026-09-02.

- Applebot: powers Spotlight, Siri, and Safari search; data "may" also train "Apple foundation models powering generative AI features."
- Distinctive fallback rule not seen in any other vendor's docs: **"If robots instructions don't mention Applebot but mention Googlebot, the Apple robot will follow Googlebot instructions."** I.e., Applebot treats a `Googlebot` robots.txt rule as an implicit default for itself when no `Applebot` rule exists — meaning a site that blocks Googlebot but never mentions Applebot may unintentionally also block Apple's crawler.
- Applebot-Extended is opt-out-only, not a separate crawl: **"Applebot-Extended does not crawl webpages. Webpages that disallow Applebot-Extended can still be included in search results."** It rides on the same Applebot fetch/UA and IP list; it only flags already-fetched content out of training use.
- Vendor states Apple "also caches crawled content to reduce unnecessary crawling" — the only vendor doc found that frames caching explicitly as a *courtesy/efficiency* measure rather than just a propagation-delay caveat.
- IP list at `search.developer.apple.com/applebot.json`.
- No on-demand "Apple-User"-style fetcher (e.g., for Siri answering a live user question) was found documented separately from Applebot — UNVERIFIED/not found, worth flagging as a gap given how central Siri's AI features are to Apple's roadmap.

### Common Crawl

Source: https://commoncrawl.org/ccbot, fetched 2026-09-02.

- UA: `CCBot/2.0 (https://commoncrawl.org/faq/)`. Purpose: open dataset for research, not tied to a single vendor's product.
- Vendor explicitly warns about spoofing: **"We are aware of crawlers falsely identifying themselves as CCBot"** and recommends IP-based verification via reverse DNS (`*.crawl.commoncrawl.org`) in addition to the JSON list at `index.commoncrawl.org/ccbot.json`.
- No on-demand fetcher exists for Common Crawl — it is purely a bulk/training crawler, not paired with a user-facing product, so the "on-demand fetcher" half of this survey's brief does not apply to it. Noting this explicitly rather than marking it UNVERIFIED, since it's a real "N/A," not a documentation gap.

### Cohere

Source: https://docs.cohere.com/docs/cohere-web-crawlers, fetched 2026-09-02.

- Cohere's own documentation states plainly: **"We do not use Cohere bots or user agents for the purpose of crawling or scraping web content to train generative AI foundation models at this time."** Its own bot-registry table lists UA strings as "N/A" across the board.
- This directly contradicts widely-circulated third-party lists (e.g., robots.txt block-lists like ai-robots-txt/ai.robots.txt on GitHub) that include `cohere-ai` and `cohere-training-data-crawler` as active tokens to block. Per Cohere's own current documentation, there is nothing currently operating to block — those tokens appear to be precautionary/historical entries in community block-lists rather than reflecting an active Cohere crawler. This is the most surprising documentation/community-practice mismatch in the whole survey.
- No on-demand fetcher for Cohere's own chat products was found documented at all.

---

## Five most surprising facts (with sources)

1. **Anthropic's on-demand fetcher (Claude-User) is documented as honoring robots.txt exactly like its training and search crawlers** — Anthropic draws no "robots.txt may not apply because a user triggered it" exception, unlike OpenAI, Perplexity, Google, and Meta, all of which explicitly carve out their on-demand fetchers from robots.txt enforcement. Source: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
2. **Cohere's own documentation says it currently runs no active crawler or user-agent at all** — the `cohere-ai` and `cohere-training-data-crawler` tokens that circulate in community robots.txt block-lists are not confirmed as live by Cohere's own docs, which list "N/A" for every UA field. Source: https://docs.cohere.com/docs/cohere-web-crawlers
3. **Mistral's own robots.txt documentation names its assistant "Vibe,"** not the "Le Chat" name commonly associated with Mistral's chat product — confirmed twice via verbatim re-quote to rule out summarization error. Source: https://docs.mistral.ai/robots
4. **OpenAI's ChatGPT agent doesn't use a fixed User-Agent string at all for identification** — instead it signs every request with RFC 9421 HTTP Message Signatures and a `Signature-Agent: "https://chatgpt.com"` header, verifiable against a published key directory, making it the one vendor in this survey with a documented cryptographic (not string-based) identity mechanism. Source: help.openai.com/en/articles/11845367-chatgpt-agent-allowlisting (confirmed via search-engine snippet of the vendor page; direct WebFetch was blocked with a 403).
5. **xAI has no discoverable official documentation for Grok's web fetcher/crawler at all**, and none of x.ai, grok.com, or grokipedia.com reportedly carry an xAI-specific robots.txt token — meaning robots.txt cannot be used to control Grok's access even in principle, by omission rather than by an explicit "we ignore it" policy. This is a documentation-gap finding, not a vendor statement, but it stands out given every other vendor surveyed publishes at least a UA string and a stated purpose. (Third-party finding; no vendor source exists to cite.)

Runner-up: Apple's fallback behavior — a robots.txt that blocks Googlebot but never mentions Applebot will also silently block Applebot, per Apple's own docs: "If robots instructions don't mention Applebot but mention Googlebot, the Apple robot will follow Googlebot instructions." Source: https://support.apple.com/en-us/119829
