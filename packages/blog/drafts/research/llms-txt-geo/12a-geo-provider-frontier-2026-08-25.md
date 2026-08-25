# GEO/AEO Provider Frontier — First-Party Evidence Matrix

**Cutoff:** 2026-08-25  
**Accessed:** 2026-08-25  
**Scope:** Google Search, Microsoft Bing/Copilot, ChatGPT search, Claude web search, and Perplexity. This report is deliberately about production discovery, control, citation, data channels, and measurement beyond `llms.txt`.  
**Source rule:** first-party provider documentation, help centers, product blogs, and developer references only. No third-party traffic estimates or optimization studies are used.  
**Versioning note:** these are live documentation pages rather than pinned repositories. Where a page exposes a publication or update date, it is recorded below; otherwise the access date is the baseline.

## Executive verdict

As of the cutoff, there is no shared GEO/AEO protocol and no provider-supported universal content recipe.

The strongest common production path is still:

1. make the canonical page crawlable and indexable for the relevant search crawler;
2. publish original, specific, internally connected material that answers a real information need;
3. keep authoritative facts current in the provider-supported data surface when one exists;
4. distinguish automatic search indexing from model training and user-directed retrieval;
5. measure each observable stage separately: crawl, impression/citation, referral, and downstream reader outcome.

The frontier is moving in two concrete directions:

- **provider-specific publisher controls and reports**, especially Google's generative-AI inclusion control and impression report and Bing's citation/grounding-query report; and
- **source-bearing retrieval interfaces**, including explicit citations, source payloads, domain controls, and product feeds.

That is a real change, but not proof that headings, FAQs, schema, or any other edit independently causes selection. The providers expose different stages and do not yet offer a common measurement contract.

## Evidence-state vocabulary

| State | Meaning in this report |
|---|---|
| **Explicit support** | The provider documents a shipped eligibility rule, control, report, data input, crawler, or output field. |
| **Documented guidance** | The provider recommends a practice, but does not publish a controlled causal test showing that the practice raises organic selection or citations. |
| **Documented silence** | The reviewed first-party publisher/search documentation does not specify the claimed feature or metric. This is bounded to the reviewed pages, not proof that no private, partner, regional, or future feature exists. |
| **Inference** | A practical conclusion drawn across explicit provider behavior. It is labeled and must remain falsifiable. |

## At-a-glance provider matrix

| Provider / surface | Eligibility and discovery | Query expansion | Citations / links | Publisher control | Structured data / feeds | Publisher measurement | Evidence state |
|---|---|---|---|---|---|---|---|
| **Google AI Overviews and AI Mode** | Page must be indexed, snippet-eligible, and included in Search generative AI. Core Search ranking and quality systems retrieve from the Search index. | Google explicitly defines model-generated concurrent related queries as **query fan-out**. | Prominent clickable supporting links are part of the documented grounding path. | Googlebot/preview controls; a new Search Console site-level generative-AI include/exclude control; Google-Extended is separate and does not affect Search. | No special AI schema or file. Ordinary structured data remains for rich results. Merchant Center feeds and Business Profiles are supported for product/local facts. | Dedicated generative-AI report: impressions, pages, countries, devices, dates. AI traffic is also blended into the ordinary Web performance report. No query or citation-count dimension is documented in the dedicated report. | **Explicit support** for the pipeline, control, report, and feeds; **guidance** for content practice. |
| **Bing / Microsoft Copilot and AI summaries** | Bing frames crawlability, indexing, metadata, internal links, freshness, and IndexNow as the base. | AI Performance exposes sampled **grounding query** phrases, but the public report does not specify the entire query-generation pipeline. | AI Performance counts citations across Copilot, Bing AI summaries, and selected partners. | Robots.txt and other supported controls; IndexNow notifies supported engines of additions, updates, and deletions. | Bing's official guidance recommends applicable schema; Bing Places is the authoritative local-business channel. | Total citations, average cited pages/day, URL-level citation counts, sampled grounding queries, and trends. It expressly omits answer placement, ranking, authority, and a page's role in an individual answer. | **Explicit support** for telemetry; **guidance** for recommended edits. |
| **ChatGPT search** | Public sites can appear. OAI-SearchBot access plus published IP allowance makes a site eligible; placement is not guaranteed. | ChatGPT may rewrite a question into one or more targeted partner queries, then issue more specific queries after inspecting results. | Search responses may show inline citations and a Sources panel. | OAI-SearchBot governs automatic search inclusion; GPTBot governs potential foundation-model training; ChatGPT-User is user-directed and robots rules may not apply. `noindex` can prevent a disallowed URL from appearing as title/link, if the crawler can read it. | No special editorial schema is documented. A separate, supported commerce feed schema can make products eligible for ChatGPT search/checkout. | ChatGPT automatically appends `utm_source=chatgpt.com` to referral URLs. No publisher query/citation/impression console is documented in the reviewed official pages. | **Explicit support** for eligibility, crawler separation, citations, UTM referral, and commerce feeds; **documented silence** on a general publisher visibility dashboard. |
| **Claude web search** | Claude-SearchBot indexes for search; Claude-User retrieves at a user's direction; ClaudeBot is for potential model-training data. | Anthropic says web search can conduct multiple progressive searches and refine targeted queries. Current API docs say the search process may repeat during one request. | Claude's web-search API always enables citations; the consumer product describes grounded web answers. | All three Anthropic bots honor robots.txt according to the crawler page. `noindex` tells Anthropic's search partners not to send the content for Claude web-search outputs. | No publisher-specific schema, feed, or search submission channel is documented in the reviewed first-party pages. | No first-party publisher referral parameter or webmaster-style query/citation dashboard is documented in the reviewed pages. Server logs can observe bot requests but are not a citation metric. | **Explicit support** for three-bot separation and cited search; **documented silence** on general publisher telemetry and data feeds. |
| **Perplexity** | PerplexityBot automatically indexes to surface and link sites; Perplexity-User performs user-directed retrieval. Perplexity says PerplexityBot is not used for foundation-model training. | Product help says Research performs many searches; the Search API accepts developer-supplied multi-query requests. Neither source exposes a publisher-facing organic query-fan-out report. | Perplexity says every answer includes source citations. Search/Sonar APIs return structured URLs and result metadata. | PerplexityBot respects robots.txt. Current crawler docs say Perplexity-User generally ignores it because the fetch is user-requested; a separate July help article says the earlier blocked-URL summarization behavior was disabled, leaving the exact boundary insufficiently specified. | No general publisher schema/feed submission path is documented in the reviewed official pages. | No open webmaster-style citation/query/referral console is documented. The 2024 Publisher Program promised partner-only citation insights through ScalePost; that is not a public measurement surface. | **Explicit support** for crawlers, citations, API source payloads, and source labels; **documented silence** on open publisher telemetry; **unresolved documentation boundary** for user-directed robots behavior. |

## 1. Google Search: the most complete publisher control plane

### What is explicitly supported

Google's [generative-AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), last updated **2026-07-10**, states that AI Overviews and AI Mode are rooted in core Search ranking and quality systems. It documents two relevant mechanisms:

- retrieval-augmented generation retrieves current pages from Google's Search index and presents prominent supporting links; and
- query fan-out generates a set of concurrent related queries to obtain more information and additional results.

Eligibility has two independent requirements:

- the page must be indexed and eligible to appear with a Search snippet; and
- the site must be included in Search generative-AI features through Search Console.

The second requirement is new. Google's [Search generative AI control](https://support.google.com/webmasters/answer/16908024?hl=en), rolling out to a subset of site owners as of the cutoff, defaults to inclusion. A verified owner can exclude a property from links, grounding, impressions, and traffic in AI Overviews, AI Mode, and generative AI in Discover without excluding it from the rest of Search. The setting can inherit through parent/child Search Console properties. Google says changes normally propagate within days.

This is not the same control as `Google-Extended`. Google's [crawler reference](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) says Google-Extended governs training future Gemini models and grounding in Gemini Apps and Grounding with Google Search on Vertex AI. It has no effect on Google Search and is not a Search ranking signal.

For page-level presentation, the older [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) guide documents Googlebot plus `nosnippet`, `data-nosnippet`, `max-snippet`, and `noindex`. The new property-level generative-AI control is more targeted than blocking Search entirely.

### What Google recommends—and what it rejects

Google recommends:

- original, first-hand, non-commodity content with a distinct point of view;
- a readable organization with paragraphs, sections, and useful headings;
- crawlable important text, internal links, a good page experience, and relevant images/video;
- current Merchant Center feeds and Business Profiles where product or local facts are involved; and
- existing structured data only when it matches the visible page and serves an ordinary supported Search feature.

Google explicitly rejects several supposed GEO requirements:

- no special schema.org vocabulary is needed for generative Search;
- no new AI file, machine-only markup, Markdown representation, or `llms.txt` is needed;
- `llms.txt` neither helps nor harms Google Search visibility because Search ignores it;
- there is no required content chunk size or ideal page length; and
- creating many pages around guessed fan-out variants to manipulate results can violate the scaled-content-abuse policy.

This is provider guidance, not a decomposition of the causal effect of every recommendation. The strongest honest use is to establish the production eligibility layer and to reject unsupported special-file/schema claims.

### Measurement

Google announced [dedicated Search Generative AI performance reports](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) on **2026-06-03**, initially for a subset of sites. The [Search report help page](https://support.google.com/webmasters/answer/16984139?hl=en) documents:

- impressions for links shown in AI Overviews and AI Mode;
- page, country, date, and device dimensions;
- canonical-URL assignment for page data;
- export support; and
- the ordinary 1,000-row/general Search performance limits.

The dedicated report is impression-only in the current documentation. It does not document search queries, citation counts, citation placement, answer text, or conversion. AI-feature traffic also remains included in the ordinary Web Search performance report, which means aggregate clicks can be measured there, but not cleanly attributed through the dedicated generative report.

Current caveat: Google's [Search Console anomaly log](https://support.google.com/webmasters/answer/6211453?hl=en) says a logging error underreported generative-AI Search impressions for **2026-08-13 through 2026-08-17**. It affected logging only. Any August baseline must annotate those dates.

### Preferred Sources: audience loyalty becomes a machine-visible choice

Google's [Preferred Sources guide](https://developers.google.com/search/docs/appearance/preferred-sources), last updated **2026-08-20**, says a user-selected domain or subdomain can be more likely to appear in Top Stories and can receive a preferred badge in AI Mode and AI Overviews. Publishers can expose Google's official button or a deeplink to help existing readers make that selection.

Boundary:

- this is a user preference for a domain/subdomain, not a general ranking hack;
- subdirectories are not eligible units; and
- the button is not required for eligibility.

**Implication:** building a real returning audience can now affect a documented AI-search presentation path. That strengthens the case for recognizable, trustworthy work; it does not justify manufacturing preference clicks.

## 2. Bing: the clearest citation telemetry, with explicit limits

### What is explicitly supported

Microsoft launched [AI Performance in Bing Webmaster Tools](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) as a public preview on **2026-02-10**. It covers Microsoft Copilot, AI-generated summaries in Bing, and selected partner integrations.

The dashboard documents:

- **total citations** displayed as sources;
- **average cited pages**, the average unique pages from a site shown per day;
- **grounding queries**, sampled key phrases used when retrieving content that was cited;
- **page-level citation activity**; and
- citation trends over time.

Microsoft carefully limits those metrics. They do not reveal a source's placement or presentation in an answer, page authority, ranking, importance, or role in an individual answer. Grounding queries are a sample, not a complete prompt or retrieval log.

This is the strongest open first-party publisher telemetry in the reviewed set for citation selection. It still cannot tell whether a source materially changed the answer, sent a reader, or caused a conversion.

### Discovery and data freshness

The launch post says Bing respects robots.txt and other supported owner controls. It recommends [IndexNow](https://www.indexnow.org/) to notify participating engines when URLs are added, updated, or removed, and Bing Places for current local-business facts.

These mechanisms have narrow jobs:

- IndexNow accelerates change discovery; it is not a ranking or citation guarantee.
- Bing Places supplies authoritative local facts; it is not a general editorial feed.

### Content guidance

The February 2026 telemetry launch recommends depth and expertise, clear headings/tables/FAQ sections, examples and sourced evidence, freshness, and consistent entity representation across text, images, and video. Microsoft's [2025-10-08 inclusion guide](https://about.ads.microsoft.com/en/blog/post/october-2025/optimizing-your-content-for-inclusion-in-ai-search-answers) additionally recommends metadata, internal linking, applicable schema, descriptive headings, concise answers, lists, tables, and HTML for critical information.

Evidence boundary:

- these are first-party operating recommendations;
- neither page publishes a controlled counterfactual showing the independent lift from an FAQ, table, schema block, or specific sentence form; and
- “FAQ section” should not be inflated into “FAQ schema is a GEO ranking factor.”

## 3. OpenAI / ChatGPT search: explicit eligibility and referrals, thin publisher visibility

### Three access paths, three different choices

OpenAI's current [crawler reference](https://developers.openai.com/api/docs/bots), accessed **2026-08-25**, distinguishes:

| User agent | Documented purpose | Robots/control consequence |
|---|---|---|
| `OAI-SearchBot` | Automatic crawling for websites surfaced in ChatGPT search | Allow it and OpenAI's published IP ranges for search eligibility. An opt-out removes the site from answer inclusion, although navigational links can still appear. OpenAI says robots changes may take about 24 hours to apply. |
| `GPTBot` | Crawl content that may be used to train generative foundation models | May be blocked independently of search. Allowing SearchBot does not require allowing GPTBot. |
| `ChatGPT-User` | Fetch a page for a user action in ChatGPT or a Custom GPT | Not used for automatic crawling or Search inclusion. Because the action is user-initiated, robots.txt rules may not apply. |

This separation is a durable engineering pattern: “AI crawler traffic” is not one category. Training, automatic search indexing, and a user's explicit fetch have different purposes and controls.

### Eligibility, query expansion, and citations

OpenAI's [ChatGPT search help page](https://help.openai.com/en/articles/9237897-chatgpt-search), shown as updated **3 days before the cutoff**, says:

- ChatGPT can search automatically when current information would help;
- search results may have inline citations and a Sources panel;
- results are ranked using multiple relevance/reliability factors and placement is not guaranteed;
- eligibility requires allowing OAI-SearchBot and published IP traffic; and
- ChatGPT may rewrite the user's question into one or more targeted partner queries, then issue additional, more specific queries after reviewing results.

OpenAI therefore documents a fan-out-like process, although it does not label it “GEO” or expose the generated queries to publishers.

### Referral measurement

OpenAI's [Publishers and Developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq), shown as updated **26 days before the cutoff**, says ChatGPT automatically appends:

```text
utm_source=chatgpt.com
```

to referral URLs. This enables first-party analytics to measure visits arriving through those links.

The same FAQ explains an important blocking edge case: when OpenAI learns a disallowed URL elsewhere, it may show only the link and title in Atlas. A `noindex` tag can prevent that, but the crawler must be able to retrieve the page to read the tag.

No publisher-facing ChatGPT console for impressions, prompts/rewrites, citation counts, cited pages, answer placement, or answer absorption is documented in the reviewed search, crawler, and publisher pages. The defensible measurement set is therefore:

- server logs for OpenAI crawler/fetch attempts;
- `utm_source=chatgpt.com` referrals in site analytics; and
- downstream engagement/conversion after arrival.

Those are different observations. A crawler request is not a citation, and a citation without a referral is not a reader.

### Structured data and feeds

No special editorial schema or machine-readable file is documented for ChatGPT organic search inclusion.

Commerce is a separate supported path. OpenAI's current [product-feed API](https://developers.openai.com/commerce/specs/api/feeds) and [stable product file schema](https://developers.openai.com/commerce/specs/file-upload/products) define feeds that OpenAI ingests and indexes. The stable schema includes an `is_eligible_search` flag and required product identifiers, descriptions, URLs, prices, availability, seller information, and images; it also supports a bounded Google-compatible feed mapping.

Boundary: this is explicit product-search/commerce infrastructure, not evidence that a product feed helps an engineering article or that a generic feed improves editorial citations.

## 4. Anthropic / Claude: crawler choice and cited retrieval, no publisher console

### Three bots and robots behavior

Anthropic's [crawler guidance](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), dated **2026-04-07**, documents:

| Bot | Purpose | Effect of blocking |
|---|---|---|
| `ClaudeBot` | Collect public web content that could contribute to future model training | Signals that future site material should be excluded from training datasets. |
| `Claude-SearchBot` | Navigate and index the web to improve search-result relevance and accuracy | May reduce the site's visibility and accuracy in Claude user search results. |
| `Claude-User` | Retrieve a page in response to an individual's request | Prevents that user-directed retrieval and may reduce visibility for user-directed web search. |

Anthropic states that all three bots honor standard robots.txt directives and that it also supports the non-standard `Crawl-delay` directive where appropriate. The page links to a current Anthropic IP list for verification.

Anthropic's [content removal guidance](https://support.claude.com/en/articles/10684638-report-block-and-remove-content-from-claude), current at the cutoff, adds another layer: `noindex` tells Anthropic's search partners not to index content and therefore not to send it to Claude for web-search outputs. The wording matters because Claude search can depend on partner indexes as well as Anthropic's named bots.

### Query progression and citations

Anthropic's original [web-search API announcement](https://www.anthropic.com/news/web-search-api), dated **2025-05-07**, says Claude can generate a targeted query, perform multiple progressive searches, use earlier results to inform later queries, and refine queries. The current [web search tool reference](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool), accessed **2026-08-25**, says search may repeat several times within one request.

For API developers, citations are always enabled for web search. Each citation carries a URL, title, encrypted index, and up to 150 characters of cited text. When an API output is displayed directly, the documentation requires citations to the original source.

This proves that Claude's supported search tool consumes and returns attributable web sources. It does not expose which queries or citations appeared in the Claude consumer product for a publisher's domain.

### Publisher measurement and data inputs

The reviewed official crawler, web-search, and removal pages do not document:

- a Claude webmaster dashboard;
- publisher impression, query, citation, placement, or referral reporting;
- a stable Claude-specific referral parameter; or
- a publisher schema/feed submission path for organic web search.

Crawler logs can establish requests by a declared Anthropic agent. They cannot establish that a result was cited, absorbed into an answer, or shown to a user.

## 5. Perplexity: explicit source UX, an unresolved user-fetch boundary, and no open publisher console

### Automatic indexing versus user-directed retrieval

Perplexity's current [crawler reference](https://docs.perplexity.ai/docs/resources/perplexity-crawlers), accessed **2026-08-25**, distinguishes:

| User agent | Purpose | Documented robots behavior |
|---|---|---|
| `PerplexityBot` | Automatically index and surface/link websites in Perplexity search | Allow in robots.txt and allow published IPs for eligibility. Perplexity says it is not used to train foundation models. |
| `Perplexity-User` | Fetch a page when a user asks Perplexity a question | Not an automatic crawler or training collector. The crawler page says this fetcher **generally ignores robots.txt** because the user requested it. |

Perplexity publishes JSON IP ranges for both agents and recommends verifying both the user-agent and source IP when configuring a WAF.

There is a documentation boundary that should not be flattened. Perplexity's [robots help article](https://www.perplexity.ai/help-center/en/articles/10354969-how-does-perplexity-follow-robots-txt), last updated **2026-07-16**, says the earlier ability for users to summarize a specific robots-blocked URL was disabled. It also says PerplexityBot and third-party partners used to build the index now respect robots.txt, while blocked pages may still leave the domain, headline, and a short factual summary indexed.

The crawler reference still says Perplexity-User generally ignores robots.txt. The safest reading is:

- the direct blocked-URL summarization behavior described in the help article was disabled;
- some user-requested fetches may still sit outside automatic-crawler robots semantics; and
- the exact remaining scope is not fully explained by the two current pages.

Do not claim either “Perplexity always ignores robots.txt” or “every Perplexity user fetch now obeys it.”

### Citations, source payloads, and source labels

Perplexity's [How does Perplexity work?](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work) page says every answer includes citations to original sources. Its [Search API](https://docs.perplexity.ai/docs/search/quickstart) returns ranked results containing titles, URLs, snippets, publication dates, and last-updated dates. Current Sonar guidance says sources are returned in top-level citation/search-result fields.

These API payloads establish a source-bearing developer interface. They are not a webmaster report for the consumer product.

A newer source UX appeared in Perplexity's [source-label guidance](https://www.perplexity.ai/help-center/en/articles/20260806-understanding-source-labels), last updated **2026-08-07**. Some citations can receive domain-level Government, Academic, or Trusted labels. Perplexity says the review asks questions such as whether the site:

- publishes corrections;
- identifies authors; and
- separates news from advertising and opinion.

Perplexity expressly says a label is domain-level, not an endorsement or a claim that every page is accurate; most domains remain unlabeled; and partnerships/payment do not affect the label.

Boundary: this is evidence of a visible source-review system and its stated criteria. The page does not say that adding a corrections page or byline causes higher ranking or more citations.

### Publisher program and measurement

Perplexity's [Publisher Program announcement](https://www.perplexity.ai/hub/blog/introducing-the-perplexity-publishers-program), dated **2024-07-30**, promised selected partners revenue sharing and deeper citation insights through ScalePost. That is historical, partner-specific evidence—not an open publisher console, not a current general eligibility requirement, and not proof of citation lift.

The reviewed current crawler, help, and API pages do not document a public webmaster dashboard for a site's prompts, citation counts, cited pages, placement, referrals, or conversions. They also do not document a stable publisher referral parameter equivalent to OpenAI's `utm_source=chatgpt.com`.

Publishers can still observe:

- verified bot/fetch requests at the server/WAF layer;
- ordinary inbound referrers/UTMs when present; and
- downstream reader behavior.

The absence of a documented stable attribution parameter means analytics implementations must not assume every Perplexity referral is labeled uniformly.

### Structured data and feeds

The reviewed official Perplexity crawler, consumer-search, and developer-search documentation does not publish a general schema.org requirement or publisher feed submission channel for organic web discovery. Perplexity's API supports developer-side domain, language, date, region, and multi-query controls; those are controls for an API caller, not markup a publisher adds to a page.

## Cross-provider controls: do not collapse these rows

| Provider | Automatic search/index crawler | Training control | User-directed fetch | Page/site presentation control |
|---|---|---|---|---|
| Google Search | Googlebot | Google-Extended for specified non-Search Gemini/Vertex uses; no Search impact | Browser/agent behavior varies by product and is separate from Searchbot semantics | Search Console generative-AI include/exclude; `noindex`, `nosnippet`, `data-nosnippet`, `max-snippet` |
| Bing | Bing index/crawling with robots and supported controls | Not specified in the reviewed Bing AI Performance publisher page | Not specified in the reviewed publisher page | Robots and supported controls; IndexNow for change notification |
| OpenAI | OAI-SearchBot | GPTBot | ChatGPT-User; robots may not apply | `noindex` for link/title suppression where crawlable; SearchBot allow/disallow for answer inclusion |
| Anthropic | Claude-SearchBot | ClaudeBot | Claude-User; Anthropic says its bots honor robots | Robots per bot; partner-facing `noindex` removal path |
| Perplexity | PerplexityBot | Perplexity says the bot is not used for foundation-model training | Perplexity-User; current docs contain the bounded inconsistency described above | Robots for PerplexityBot; blocked pages may retain domain/headline/brief summary |

**Inference:** a single `User-agent: *` policy can be operationally simple, but it erases meaningful choices. A publisher who wants search discovery without model-training use or who treats user-directed fetches differently needs explicit per-provider policy and verified logs.

## Measurement matrix: what each observable actually proves

| Observation | Google | Bing | ChatGPT | Claude | Perplexity | What it proves |
|---|---|---|---|---|---|---|
| Named crawler request | Server logs | Server logs | Server logs | Server logs | Server/WAF logs | A declared agent attempted a request. Not an impression or citation. |
| Successful response | Server/edge logs | Server/edge logs | Server/edge logs | Server/edge logs | Server/edge logs | The server delivered bytes. Not model-context use. |
| Generative impression | Dedicated report, subset rollout | Citation report is not the same metric | Not documented | Not documented | Not documented | On Google, a site link was shown in a supported generative feature. |
| Citation count | Not documented in dedicated report | Total and page-level counts | Not documented to publishers | Not documented to publishers | Not documented in an open publisher console | On Bing, the URL appeared as a source; not its answer role. |
| Retrieval/grounding phrase | Not documented in dedicated report | Sampled grounding queries | Search query rewrites documented to users, not surfaced per publisher | Progressive queries documented, not surfaced per publisher | API queries/results visible to the API caller, not publisher-wide | The retrieval system searched a phrase when explicitly exposed; not the original user prompt. |
| Referral | Aggregate Search clicks/analytics | Ordinary site analytics | Stable `utm_source=chatgpt.com` | No stable official parameter documented | No stable official parameter documented | A user followed a link to the site. |
| Reader outcome | Site analytics | Site analytics | Site analytics | Site analytics | Site analytics | Engagement or conversion after arrival; still requires a chosen outcome definition. |

## Established patterns as of 2026-08-25

1. **Ordinary search infrastructure remains the base.** Google says its generative Search uses the Search index; Bing anchors AI visibility in crawlability/indexing and exposes Webmaster Tools; OpenAI, Anthropic, and Perplexity all name search-specific crawlers.

2. **Training, automatic indexing, and user-directed retrieval are separate access purposes.** OpenAI, Anthropic, and Perplexity publish distinct agents for at least two of these jobs. Policies and telemetry should preserve that distinction.

3. **One question can trigger multiple searches.** Google documents query fan-out; OpenAI documents one-or-more targeted partner queries and later refinements; Anthropic documents progressive/repeated searches. Exact keyword matching is therefore an incomplete model.

4. **Citations are built into the products, but citation is not readership.** Google, ChatGPT, Claude, and Perplexity expose source links/citations to users; Bing exposes site-level citation counts. Only a referral and subsequent site event establish that a reader arrived and did something.

5. **No provider documents a universal AI schema or editorial feed.** Google explicitly rejects special generative schema/files. Bing recommends applicable ordinary schema without proving lift. OpenAI has a product-specific commerce feed. Anthropic and Perplexity do not document general publisher feeds in the reviewed pages.

6. **Authoritative data channels matter where facts are transactional or local.** Google Merchant Center/Business Profiles, Bing Places, IndexNow, and OpenAI product feeds solve freshness/entity problems that prose alone cannot reliably solve.

7. **Provider metrics are not interchangeable.** Google's dedicated metric is a link impression. Bing's is a citation. ChatGPT's public publisher signal is a referral UTM. Treating all three as “AI visibility” hides the stage that was actually observed.

8. **First-hand, accountable publishing remains the least provider-specific content strategy.** Google's current guide favors original experience and non-commodity material. Bing recommends evidence and clarity. Perplexity's source-label process looks for authorship, corrections, and editorial separation. None of these pages proves a fixed citation lift, but together they support the human practice of publishing work that can be checked.

## New trends worth watching

- **Generative inclusion is becoming an explicit site-owner choice.** Google's property-level switch is more granular than opting out of all Search.
- **Generative visibility is moving into first-party webmaster tools.** Google reports impressions; Bing reports citations and sampled grounding phrases. Their different metrics expose the need for a stage model.
- **User source preference is entering AI surfaces.** Google's Preferred Sources connects a genuine returning audience to AI Overview/AI Mode presentation.
- **Query fan-out is now a documented production mechanism, not just a research abstraction.** The correct editorial response is broader, coherent coverage of the real problem—not one page per guessed hidden query.
- **Source identity is becoming visible product metadata.** Perplexity's domain labels and publisher feedback path make authorship, corrections, and editorial separation observable to readers, while carefully stopping short of a ranking guarantee.
- **Search APIs increasingly return source-bearing structured payloads.** Anthropic citations and Perplexity result objects make attribution enforceable for API builders even while organic publishers lack equivalent dashboards.
- **Freshness paths are increasingly vertical-specific.** Product feeds, business profiles, Places, and IndexNow are concrete inputs; generic editorial “GEO feeds” remain unsupported.
- **WAF configuration is part of eligibility.** OpenAI and Perplexity both publish IP ranges and warn that a permitted user-agent can still be blocked at the network layer.
- **Documentation conflicts are themselves an audit signal.** Perplexity's user-fetch/robots wording should be tested and time-stamped instead of rounded into a universal claim.

## Article-ready distilled bullets

- GEO is not a replacement for SEO in Google Search. Google says AI Overviews and AI Mode retrieve from the ordinary Search index, and it explicitly ignores `llms.txt` for ranking and visibility.
- The new thing is not a magic file. It is a fragmented control and measurement layer: Google exposes generative impressions and an inclusion switch; Bing exposes citations and sampled grounding queries; ChatGPT exposes a referral UTM; Claude and Perplexity still expose no general publisher console in their reviewed guidance.
- A user question is no longer one search query. Google, OpenAI, and Anthropic all document multi-query or progressive-search behavior. That rewards coherent subject coverage, not pages mass-produced for guessed variants.
- “The AI bot visited” is not “the article was cited.” A request proves an attempt; a successful response proves delivery; a provider report can prove an impression or citation; a UTM/referrer proves a visit; site analytics prove what happened after arrival.
- SearchBot, training bot, and user fetcher are different products. OpenAI, Anthropic, and Perplexity make that distinction explicit enough that a single “AI traffic” bucket loses useful evidence.
- Structured data is not a generic GEO lever. Use it for the ordinary rich-result/entity job the provider documents. Use feeds or profiles when the fact is a product, price, inventory item, or local business detail.
- Google's Preferred Sources is the most interesting anti-farming signal: a real reader can choose a publication, and that choice can be highlighted in AI Mode and AI Overviews. The honest strategy is to become worth choosing.
- Bing's citation dashboard is useful precisely because Microsoft states what it cannot tell you: citation count is not placement, authority, ranking, or answer influence.
- Perplexity's new source labels look at the domain's authorship, correction, and editorial-separation practices. That supports visible accountability, not a recipe for gaming citations.
- The practical 2026 GEO workflow is boring in the best way: publish something only you could have learned, make the canonical page easy to retrieve, keep machine-readable facts accurate where a supported channel exists, cite your evidence, and instrument the stages you can actually observe.

## Falsifiers and update triggers

Revisit this report if any of the following becomes first-party documented:

- Google or another major provider introduces a special editorial schema/file as an organic generative-search eligibility or ranking input.
- OpenAI, Anthropic, or Perplexity launches an open publisher dashboard with domain-level impressions, prompts/queries, cited pages, placement, or answer-use metrics.
- A provider publishes a controlled production experiment isolating a content-format edit and showing durable organic selection plus downstream reader outcomes.
- Bing adds answer-level placement/role or referral metrics to AI Performance.
- Google adds query, citation, click, or answer-use dimensions to the dedicated Generative AI performance report.
- Anthropic or Perplexity documents a stable publisher referral parameter.
- Perplexity reconciles the current `Perplexity-User` robots wording with its July 2026 blocked-URL help article.
- A cross-provider standard for search inclusion, source attribution, or publisher telemetry receives explicit support from multiple named production providers.

## First-party source ledger

| Provider | Source | Date baseline | Why it is in the evidence set |
|---|---|---|---|
| Google | [Optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | Updated 2026-07-10 | Current official eligibility, query fan-out, content/data guidance, and mythbusting. |
| Google | [Search Generative AI performance reports announcement](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) | Published 2026-06-03 | Launch scope and report dimensions. |
| Google | [Generative AI performance report (Search)](https://support.google.com/webmasters/answer/16984139?hl=en) | Accessed 2026-08-25; subset rollout | Exact supported surfaces, metric definition, dimensions, and limitations. |
| Google | [Search generative AI control](https://support.google.com/webmasters/answer/16908024?hl=en) | Accessed 2026-08-25; subset rollout | Site-level include/exclude semantics and inheritance. |
| Google | [Preferred Sources](https://developers.google.com/search/docs/appearance/preferred-sources) | Updated 2026-08-20 | User-selected source behavior in Top Stories and generative surfaces. |
| Google | [Common crawlers: Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) | Accessed 2026-08-25 | Separates Search inclusion from Gemini training/grounding controls. |
| Google | [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) | Updated 2025-12-10 | Googlebot, snippet controls, ordinary Search reporting baseline. |
| Google | [Search Console data anomalies](https://support.google.com/webmasters/answer/6211453?hl=en) | Accessed 2026-08-25 | August 13–17, 2026 generative-impression logging caveat. |
| Bing | [AI Performance public preview](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) | Published 2026-02-10 | Exact citation/grounding-query metrics, limits, IndexNow/Bing Places guidance. |
| Microsoft | [Optimizing content for inclusion in AI Search answers](https://about.ads.microsoft.com/en/blog/post/october-2025/optimizing-your-content-for-inclusion-in-ai-search-answers) | Published 2025-10-08 | First-party content/structure/schema guidance, treated as advice rather than causal evidence. |
| OpenAI | [Overview of OpenAI Crawlers](https://developers.openai.com/api/docs/bots) | Accessed 2026-08-25 | Search, training, and user-directed agent separation; IP/robots behavior. |
| OpenAI | [Searching the web with ChatGPT](https://help.openai.com/en/articles/9237897-chatgpt-search) | Relative update shown as 3 days before cutoff | Search activation, targeted query rewrites, citations, eligibility, no placement guarantee. |
| OpenAI | [Publishers and Developers FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) | Relative update shown as 26 days before cutoff | `utm_source=chatgpt.com`, `noindex`, Atlas, and OAI-SearchBot guidance. |
| OpenAI | [Commerce product-feed API](https://developers.openai.com/commerce/specs/api/feeds) | Accessed 2026-08-25 | Supported product feed creation/retrieval. |
| OpenAI | [Stable product file schema](https://developers.openai.com/commerce/specs/file-upload/products) | Accessed 2026-08-25 | Search eligibility flag and indexed product fields; bounded commerce path. |
| Anthropic | [Anthropic crawler controls](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | Dated 2026-04-07 | ClaudeBot, Claude-SearchBot, Claude-User purposes and robots behavior. |
| Anthropic | [Block/remove content from Claude](https://support.claude.com/en/articles/10684638-report-block-and-remove-content-from-claude) | Current page; accessed 2026-08-25 | Search-partner `noindex` and removal paths. |
| Anthropic | [Web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) | Accessed 2026-08-25 | Repeated search flow, required source citations, and citation fields. |
| Anthropic | [Introducing web search on the API](https://www.anthropic.com/news/web-search-api) | Published 2025-05-07 | Progressive searches, query refinement, and attributed-source product intent. |
| Perplexity | [Perplexity Crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | Accessed 2026-08-25 | PerplexityBot/Perplexity-User separation, IP ranges, WAF and robots behavior. |
| Perplexity | [How Perplexity follows robots.txt](https://www.perplexity.ai/help-center/en/articles/10354969-how-does-perplexity-follow-robots-txt) | Updated 2026-07-16 | Automatic crawl policy, retained metadata boundary, third-party crawler statement. |
| Perplexity | [How Perplexity works](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work) | Current page; accessed 2026-08-25 | Consumer-facing citation and multi-search descriptions. |
| Perplexity | [Search API](https://docs.perplexity.ai/docs/search/quickstart) | Accessed 2026-08-25 | Structured ranked result payloads and caller-controlled multi-query/domain/date inputs. |
| Perplexity | [Understanding source labels](https://www.perplexity.ai/help-center/en/articles/20260806-understanding-source-labels) | Updated 2026-08-07 | Domain-level source-review labels, criteria, and express limitations. |
| Perplexity | [Publisher Program announcement](https://www.perplexity.ai/hub/blog/introducing-the-perplexity-publishers-program) | Published 2024-07-30 | Historical partner-only revenue/citation-insight program; not treated as a public dashboard. |

## Bottom line for this article

The credible positive case for GEO/AEO is not “write like a machine.” It is that search-backed answer systems now expose concrete, provider-specific interfaces around eligibility, source selection, citations, authoritative data, and measurement.

The credible boundary is equally important: none of the reviewed providers documents a universal editorial markup, a portable formatting formula, or an open end-to-end metric from crawl through answer influence to loyal readership.

For a personal engineering blog, the genuine move is to create the evidence that the providers say they want but cannot manufacture: direct experience, named decisions, reproducible artifacts, dated corrections, clear authorship, and a page a human would still value if every AI surface disappeared tomorrow.
