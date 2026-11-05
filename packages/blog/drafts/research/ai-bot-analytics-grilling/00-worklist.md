# AI bot analytics grilling

Started November 4, 2026 America/Los_Angeles; execution crosses November 5 UTC. Owner requests a dedicated skill, a new article with provider sections/subsections, and real API/MCP/CLI/browser trials of search, fetch, crawl and agent products, including Exa, DuckDuckGo, Bing, Firecrawl and Tavily. The owner explicitly authorizes relevant Cloudflare logs/Wrangler and supplies Tavily credentials privately.

## Question and form

When an agent searches, retrieves a page, crawls links or writes an answer, what can the publisher observe and what can analytics truthfully attribute? Start a provider field guide with dated controlled experiments. Teach a repeatable comparison while showing the author's own publication and classifier under test.

Reader payoff: choose a trigger, distinguish returned content from a live fetch, inspect identity evidence, and audit what a cited answer actually says. Author contribution: actual provider trials against gkoreli.com and exact production storage evidence. Search-language hypotheses include “Exa search vs fetch”, “AI crawler User-Agent”, “Tavily vs Firecrawl crawl”, and “DuckAssistBot vs DuckDuckBot”; these are positioning hypotheses, not measured demand.

## Continuity

- [Dedicated skill](../../../../../.agents/skills/ai-bot-analytics-grilling/SKILL.md) owns reusable procedure and dimensions.
- [September reference](../../../posts/023-which-ai-fetchers-send-which-headers.md) and [completed follow-up worklist](../fetcher-study-v2/00-worklist.md), especially [the latest next-validation note](../fetcher-study-v2/24-reddit-sharing-and-next-validation.md), remain dated and accepted.
- [ADR-0016.19](../../../../../docs/adr/0016.19-agent-mediated-audience-growth.md) recognizes agent-mediated discovery/use. These deliberately elicited trials are excluded from organic growth interpretations.
- Draft: [Testing AI Search, Fetch, and Crawl Against My Analytics](../../testing-ai-search-fetch-and-crawl-against-my-analytics.md).
- [First-batch results and claim audit](01-first-batch.md), [exact reviewed inputs](trial-inputs.json), [provider results](provider-results.json), [origin/storage evidence](first-batch-evidence.json), and [complete shaping prompts](../../prompts/testing-ai-search-fetch-and-crawl-against-my-analytics.prompts.md).
- [Validation receipt](checks.json) and [private archive commitment](private-archive.json) record checks and preservation without publishing raw operations.
- [ChatGPT/Brave extension](02-chatgpt-and-brave.md), [inputs](chatgpt-brave-inputs.json), [results](chatgpt-brave-results.json), [origin/storage evidence](chatgpt-brave-evidence.json), [checks](chatgpt-brave-checks.json) and [archive commitment](chatgpt-brave-archive.json) continue the first batch without replacing it.
- [Context.dev/Perplexity extension](03-context-and-perplexity.md), [inputs](context-perplexity-inputs.json), [results](context-perplexity-results.json), [origin/storage evidence](context-perplexity-evidence.json), [checks](context-perplexity-checks.json) and [archive commitment](context-perplexity-archive.json) add public conversion, an MCP authentication gate and a declined Search retrieval.
- Private evidence: ignored `packages/blog/worklog/ai-bot-analytics-grilling-20261104/`; raw account UI, requests, exact references and SQL do not enter Git.

## Accepted starting scope

Create the skill and article foundation; execute a first bounded set of real operations; report every consequential result, failure and limitation. The wider repeat survey is an explicit continuation, not a claim that every possible provider/setting has been tested. Keep the new article unpublished in `drafts/`.

## Completed first batch

- Exa public MCP tools/list, search and fetch completed. Live tools require search `objective` and expose fetch `urls`/`maxCharacters`.
- DuckDuckGo and Bing browser searches returned the existing article; Bing AI Mode produced a cited answer with qualifications lost. Duck.ai completed two exact-URL questions; the second ran under the approved tail.
- Signed-in Exa Contents with `maxAgeHours: 0` completed. A separate `subpages: 1`, `subpageTarget: ["prompts"]` call returned `CRAWL_TIMEOUT`/504 and reported zero cost. No retry is substituted for that result.
- Both approved bounded tails are stopped. They contain 86 complete objects; thirteen exact assigned-label requests and one nonexact side request are separated from unrelated private traffic. No parse fragments remain; capture completeness is not inferred.
- Tavily API Search/Extract/Map/Crawl and mini Research completed using the supplied key without exposing it. Direct extraction succeeds; Research completes with no sources and an inaccurate answer. Eight labelled requests are stored as six Browser/two Unresolved, with no signature or named vendor declaration. Per-call reported usage and unavailable research cost stay separate.
- Firecrawl keyless MCP Search/Scrape return tool access errors. Its public browser Search/Map/Crawl return results; fresh Scrape reaches the origin but the result UI crashes, while later run history says Success. JSON/full-link access is account-gated. Authenticated API/MCP and Agent remain untested.
- Native workerd/D1 preflight passes for the exact indexed thirteen-row selection. Wrangler metadata/constant access checks and one exact production SELECT succeed; thirteen full projected receipts equal their acknowledgements. Data query: 26 reads/zero writes/one attempt; constant query: zero reads/zero writes/one attempt. No second production read was needed for the enriched header projection or negative controls.
- Two Exa/one Duck request are stored AI Assistant; eight requests Browser/two Unresolved. All are deliberately elicited, owner-exclusion false, with native booleans unavailable and no vendor-network checks. A signature outcome is not an IP-list assessment or authenticated human trigger.
- Missing-row and changed-receipt controls reject. Nonexact-label parser rejection, sandbox loopback denial, failed screenshot framing and unavailable keyless calls remain in private evidence alongside the accepted runs. The exact current ExaUser signer origin is absent from the approved display catalogue, explaining `Other` without failed verification.

## Completed ChatGPT / Brave extension

November 4 local / November 5 UTC. The owner confirms the existing signed-in ChatGPT tab and requests Brave's website/API. One ChatGPT Chat/Medium question returns the correct H1, maintenance sentence and signature coverage. An unsigned ChatGPT-User request receives 200, is stored AI Assistant and has a positive configured network assessment. A later Chrome-claiming Browser request follows the output URL after the answer snapshot, with its added tracking parameter; its operator/path stays unresolved and is not counted as another demonstrated ChatGPT backend fetch.

Brave's site-scoped page supplies twelve main-result URLs, an AI summary naming the original study, companion-page citations and a secondary Vuink reference. Ask declines the exact H1/sentence task while qualifying its coverage answer from other sources; no exact assigned-label GET appears in the bounded stream. The shared-demo LLM Context and Web Search API playgrounds both return displayed HTTP 200, ten context sources and three requested web results. No personal key or subscription is needed for the observed demo path. Collapsed Data trees and a failed clipboard export remain UI captures, not raw JSON responses or billing evidence.

The eight-minute tail stops with 36 complete objects and two exact labelled observations. Native preflight and a single exact D1 read accept both full receipts for four reads/zero writes/one attempt; the constant access check reports zero reads/writes. First-batch default-mode replay preserves all thirteen projections and its exact SQL hash without another old-cohort production query. The checker gains a validated optional batch config, and the skill adds Brave/ChatGPT entry points plus answer-versus-source-inspection phase guidance. A browser inspection timeout is retained; neither question was resubmitted. All owned capture processes have stopped.

## Completed Context.dev / Perplexity extension

November 4 local trials / November 5 UTC; export and review completed November 5 local. Context.dev was limited to public access by the owner. Its anonymous Markdown converter returned the original article: 54,069 characters, 329 lines, correct body H1, maintenance sentence and signature example, with navigation/footer retained. Three exact HTTP 200 requests arrived: two Chrome claims stored Browser and one Slackbot-LinkExpanding claim stored Preview or Feed. That declaration does not authenticate Slack or expose Context.dev's internal delegation. A credential-free MCP initialization returned HTTP 401; authenticated Search/Scrape/Map/Crawl/Answers remain untested.

Perplexity's existing signed-in Free-plan Search session completed one question with a displayed three-second fetch failure and declined the three requested details and citation. No exact assigned-label GET appears in the bounded stream. Retained edge-security evidence is unavailable; no edge-block diagnosis follows.

The eight-minute tail stopped independently with eleven complete objects and three exact matches. Native three-ID D1 preflight passed. Initial Wrangler metadata failed authentication; a constant query, metadata recheck and one exact data query succeeded. All three full receipts agree, at six data reads and zero writes. The owner later reported CLI reauthentication and reaffirmed CLI authorization; the earlier error's cause remains unknown. A manual OAuth-based security query was rejected by automatic approval review before execution, and that distinct direct-credential route was not approved. No workaround was attempted. A browser export call remained pending for nearly eight hours after saving the result; this is not provider latency. No trial was resubmitted.

## Delivery and continuation

The reusable skill, structured article foundation and requested provider extensions are complete, with inspectable results and preserved failures. Per-batch validation receipts preserve their dates; first-batch evidence stays frozen at source `1e0b3d9` and the later helper's compatibility is independently checked. The article stays unpublished; no original post, runtime rule, protection or logging setting changes. Source delivery does not publish the draft or establish a new production deployment.

An optional question for an existing Firecrawl credential file is pending. If supplied, the next bounded action is one authenticated search/scrape/map/crawl comparison and an agent task with an explicit credit cap, captured in a separate stream and appended as a new batch. Otherwise the starting assignment is delivered with that gap explicit. Fresh-body fixtures, HTML/Markdown, deliberate errors/redirects, robots behavior, independent proof replay, on-demand Bingbot and broader repeats remain proposed work. No monitor or outreach is scheduled.
