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

## Delivery and continuation

The reusable skill and structured article foundation are complete, with an inspectable first batch and preserved failures. Skill validation passes in a temporary PyYAML environment; final link/structure, source and scoped delivery checks are recorded with the evidence. The article stays unpublished; no original post, runtime rule, protection or logging setting changes. Source delivery does not publish the draft or establish a new production deployment.

An optional question for an existing Firecrawl credential file is pending. If supplied, the next bounded action is one authenticated search/scrape/map/crawl comparison and an agent task with an explicit credit cap, captured in a separate stream and appended as a new batch. Otherwise the starting assignment is delivered with that gap explicit. Fresh-body fixtures, HTML/Markdown, deliberate errors/redirects, robots behavior, independent proof replay, on-demand Bingbot and broader repeats remain proposed work. No monitor or outreach is scheduled.
