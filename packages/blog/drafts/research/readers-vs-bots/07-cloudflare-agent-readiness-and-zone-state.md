# Cloudflare zone state and the Agent Readiness scan

Read from the Cloudflare dashboard by Fable, 2026-09-03 ~03:20 UTC, zone gkoreli.com, Free plan. Screenshots taken; text copied from the pages.

## robots.txt (live)
```
User-agent: *
Allow: /

Sitemap: https://gkoreli.com/sitemap.xml
```
No Content-Signal line. Nothing disallowed.

## AI Crawl Control → Security (last 24 hours)
Every listed crawler is allowed; no block toggles on. Cloudflare's own categories for the crawlers that hit the site in the last 24 hours:

| Crawler | Operator | Cloudflare category | Requests |
|---|---|---|---:|
| ClaudeBot | Anthropic | AI Crawler | 17 |
| Googlebot | Google | Search Engine Crawler | 13 |
| PerplexityBot | Perplexity | AI Search | 8 |
| Bytespider | ByteDance | AI Crawler | 7 |
| Applebot | Apple | AI Search | 6 (+1 unsuccessful) |
| Amazonbot | Amazon | AI Crawler | 4 |
| Meta-ExternalAgent | Meta | AI Crawler | 4 |
| ChatGPT-User | OpenAI | AI Assistant | 3 |
| OAI-SearchBot | OpenAI | AI Search | 2 |
| BingBot | Microsoft | Search Engine Crawler | 1 |
| GPTBot | OpenAI | AI Crawler | 1 |

Inactive but recognized (0 requests): Anchor Browser (AI Crawler), archive.org_bot (Archiver), CCBot, Claude-SearchBot (AI Search), Claude-User (listed as AI Crawler by Cloudflare, which disagrees with Anthropic's own "supports Claude AI users" description), DuckAssistBot (AI Assistant), Manus Bot (AI Assistant), Meta-ExternalFetcher (AI Assistant), MistralAI-User (AI Assistant), Perplexity-User (AI Assistant), PetalBot, ProRataInc, Novellum, Timpibot, TikTok Spider, Terracotta Bot, Cloudflare Crawler, Google-CloudVertexBot, FacebookBot, Baidu, Arquivo.

Note: Cloudflare counted 17 ClaudeBot requests in 24 hours; our D1 recorded ClaudeBot on only one day in 30 with 10 views. Either most ClaudeBot fetches are non-HTML (feeds, sitemap, .md endpoints, robots.txt) which we do not count by design, or the classifier misses some. Worth a cross-check in TASK-0105.

## AI Crawl Control → Signals
Managed robots.txt: off. Content Signals: "Not set". robots.txt fetched 17 times in 24 hours, all 200. No robots.txt violations.

## Agent Readiness (new dashboard section, Beta)
Overview verdict: "Almost ready. Your site is online, but AI tools may have trouble finding and understanding your content." Sidebar has Overview, Diagnostics (Beta), AI Playground (Beta), WebMCP (Beta). An "AEO" panel (coming soon) promises "Mention rate", "Citation rate", "Prominence": "See how often AI assistants cite your site, how prominently it features, and what to improve across OpenAI, Anthropic, and more." Register-interest only. This is the closest thing to a "Cited by" for the agent era and it is Cloudflare's own roadmap item.

### Diagnostics, Level 1 "Quick Wins", 3 of 5
- ✗ Content Signals: "No Content Signals found in robots.txt". Fix offered: managed robots.txt (adds ai-train, search, ai-input signals).
- ✗ Markdown Negotiation: "Site does not support Markdown for Agents". Fix offered: Cloudflare's "Markdown for Agents" toggle, "Requires Pro or higher". The check is content negotiation, serving Markdown to agents that ask for it. Our Worker can do this itself on the free plan: we already build per-post Markdown endpoints, and OpenClaw's fetch tool sends `Accept: text/markdown, text/html;q=0.9` (artifact 06).
- ✓ robots.txt (high impact)
- ✓ Sitemap (high impact)
- ✓ AI Crawler Rules

### Level 2 "Technical Groundwork", 0 of 3
API Catalog ("Expose a directory of your web services"), Link Headers ("Guide AI bots to site data"), Auth.md ("Share login instructions for AI bots").

### Level 3 "Advanced Integration", 0 of 8
OAuth Discovery, OAuth Protected Resource, A2A Agent Card ("Introduce your site's AI to other agents"), Skills Index ("List what your AI agent can do"), MCP Server Card ("Share your AI tool context engine"), Web Bot Auth ("Verify your site's outbound bots"), WebMCP ("Let AI agents run in-browser tools"), DNS-AID ("Publish your AI bots").

### Commerce, optional, 0 of 5. Not relevant.

### WebMCP tab
"WebMCP bridge is off." Enable injects "a lightweight WebMCP bridge into your site's HTML so browser-based AI agents can read and interact with your pages." Tool packs: Content Credentials (C2PA) for image provenance; Site MCP server proxying.

Disclaimer on the page: "These are AI-generated recommendations. AI can make mistakes."

## What this settles for the blog
1. Nothing blocks agents today. The 2026-09-15 default change targets ad-displaying pages on new domains; this zone shows no ads and is not new, but re-check the Security tab after that date.
2. Cloudflare's own live checklist for September 2026 agent-readiness is the authoritative modern list: Content Signals, Markdown negotiation, robots.txt, sitemap, Link headers, API catalog, auth.md, OAuth discovery, A2A agent card, skills index, MCP server card, Web Bot Auth, WebMCP, DNS-AID. Two of the five Level 1 items are open, and both are implementable in our Worker for free.
3. Citation visibility in the agent era is on Cloudflare's roadmap as "AEO: mention rate, citation rate, prominence", not shipped. Nothing we build should pretend to have it.
