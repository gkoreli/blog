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

## Extending the catalogue

Potential additions include Jina Reader, Brave Search, ChatGPT/OpenAI search and fetchers, Claude tools, Perplexity, Google/Gemini, Mistral and Grok. Add a current primary source and a runnable entry point before calling an adapter usable. Consult the local openai-docs skill for OpenAI-specific behavior. Keep existing historical trials linked and dated; queue fresh repeats only when they change the comparison.
