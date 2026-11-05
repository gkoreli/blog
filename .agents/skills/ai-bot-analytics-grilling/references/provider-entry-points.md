# Provider entry points

This is routing guidance, not a frozen endpoint catalogue. Discover installed tools first, check official docs and live schemas, then record the names and options actually used in the dated research. A hosted MCP, browser playground and raw API may expose different controls.

## Exa

Start with the [official MCP implementation](https://github.com/exa-labs/exa-mcp-server), [Search API](https://exa.ai/docs/reference/search), [Contents API](https://exa.ai/docs/reference/get-contents), [crawler information](https://crawler.exa.ai/) and the signed-in dashboard. Discover tools from `https://mcp.exa.ai/mcp` before constructing arguments.

Keep search results/highlights, known-URL content retrieval, live refresh, subpage crawling and agent research separate. Check which freshness and subpage options the chosen interface actually exposes. Compare the observed request declaration with ExaSearchBot and ExaUser documentation; a crawl option's name does not dictate its origin User-Agent.

## DuckDuckGo

Compare normal search, Search Assist and Duck.ai as distinct products. Start with [DuckDuckBot](https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot), [DuckAssistBot](https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot), [Search Assist](https://duckduckgo.com/duckduckgo-help-pages/results/ai-assisted-answers) and [result sources](https://duckduckgo.com/duckduckgo-help-pages/results/sources). A Duck.ai question is a practical route for a prompted retrieval trial; only the actual request establishes which client arrived.

## Bing / Microsoft

Separate a Bing result page, Bing AI Mode, Copilot chat and Webmaster diagnostics. Use [Bing's crawler documentation](https://www.bing.com/webmasters/help/which-crawlers-does-bing-use-8c184ec0) and [URL Inspection](https://www.bing.com/webmasters/help/url-inspection-55a30305) when those are relevant. Index submission requests scheduling; it does not prove an immediate Bingbot fetch. A browser search or Microsoft-branded answer is not itself a Bingbot observation. Preserve the site's actual current controls rather than copying a historical “Fetch as Bingbot” tutorial.

## Tavily

Use the [official documentation index](https://docs.tavily.com/llms.txt) and signed-in playground to discover current Search, Extract, Crawl, Map and Research capabilities. Read a supplied environment file directly inside the request process; never `cat` or print it. Keep key material out of saved payloads and exceptions. Freeze crawl depth/page caps and research scope before creating a job; a job ID is not completion.

## Firecrawl

Use the [official documentation index](https://docs.firecrawl.dev/llms.txt), available connected tools, or signed-in playground. Compare Search, Scrape, Map, Crawl and agent operations separately. Keep automatic retries, cache settings, rendering, discovered links and extracted content visible. Cap crawl pages/agent credits and follow asynchronous jobs through their actual terminal status or record the bounded unresolved result. Use an available plugin when sufficient; a plugin installation is a separate access change.

## Brave

Separate the search website, Ask, Web Search API, LLM Context API and Answers API. Start with the [official quickstart](https://api-dashboard.search.brave.com/documentation/quickstart), [LLM Context](https://api-dashboard.search.brave.com/documentation/services/llm-context), [Web Search](https://api-dashboard.search.brave.com/api-reference/web/search/get), and the [public playground](https://api-dashboard.search.brave.com/app/playground). API credentials use `X-Subscription-Token`; the playground may offer a shared demo with its own availability conditions. Record actual access without creating a new subscription or collecting a key unnecessarily.

Switching playground endpoints can reset query parameters. Recheck the displayed request before sending. The Data view can contain collapsed placeholders; preserve it as a UI view unless an actual response export succeeds. Never call a partially displayed JSON tree a complete raw response.

Brave's [crawler documentation](https://safe.search.brave.com/help/brave-search-crawler) says it does not advertise a differentiated User-Agent. Do not invent a Bravebot signature or interpret the absence of that name as absence of Brave traffic. Keep crawler documentation separate from the actual request, search result or Ask response observed.

## ChatGPT / OpenAI

Use the existing signed-in ChatGPT tab for a fresh public-page question. Record the visible Chat/Work mode and model label without guessing a hidden model ID. Consult the local openai-docs skill and [official crawler documentation](https://developers.openai.com/api/docs/bots) when comparing ChatGPT-User, OAI-SearchBot and GPTBot roles. A documented possible fetch path is not a promise that each answer uses it.

Keep source cards and output-link tracking parameters separate from the original requested URL. Save the answer before inspecting citations, and distinguish any later browser-shaped hit from an identified answer-time fetch. Avoid publishing unrelated home suggestions, private chat history or account UI.

## Context.dev

Start with the [Scrape reference](https://docs.context.dev/api-reference/web-scraping/scrape), [MCP instructions](https://docs.context.dev/install-mcp), existing account and [public tools](https://www.context.dev/free-tools). The [URL to Markdown converter](https://www.context.dev/free-tools/url-to-markdown) can offer an anonymous retrieval path even when the dashboard and hosted MCP require authentication. Record its actual availability, output, cache controls and usage visibility separately from an authenticated API trial.

The service MCP is `https://mcp.context.dev/mcp`; the docs-search MCP is a different server. An unauthenticated initialization challenge is an access result, not tools/list or a failed scrape. Do not follow onboarding documentation into account creation, persistent key creation or wider OAuth scopes without the appropriate authorization. For API responses, inspect each requested output's success and reported usage. Do not assume a public converter exposes `maxAgeMs` or the API's other options.

Keep all clients reaching an assigned label, including browser claims and unexpected third-party bot declarations. The workflow assignment does not authenticate each declared operator or expose the provider's internal delegation.

## Perplexity

Use an existing signed-in browser session for a fresh exact-URL question. Record plan, Search versus Computer, and the actual visible model label; do not infer a model from upgrade choices. Preserve completed refusals and expanded tool activity without treating an activity label as a successful fetch.

The [crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) separates PerplexityBot and Perplexity-User and their address lists. Compare the actual request rather than assuming the user-fetcher must appear. No exact Worker match remains bounded to the stopped capture; inspect relevant retained security evidence before diagnosing edge blocking. API, MCP, CLI and Computer are separate interfaces, not interchangeable evidence for the website's Search answer.

## Extending the catalogue

Potential additions include Jina Reader, Claude tools, Google/Gemini, Mistral and Grok. Add a current primary source and a runnable entry point before calling an adapter usable. Keep existing historical trials linked and dated; queue fresh repeats only when they change the comparison.
