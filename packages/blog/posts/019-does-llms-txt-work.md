---
title: "Does llms.txt Work? What a Live Implementation Revealed"
seoTitle: "llms.txt and GEO: Live Evidence and What to Test"
alternativeHeadline: "A live audit of llms.txt, page Markdown, agent tools, crawler measurement, and GEO evidence"
date: "2026-08-25"
description: "Does llms.txt improve AI search? This live audit examines edge data, agent tools, Markdown, and GEO evidence—then shows what to build and measure."
section: engineering
tags: [llms-txt, geo, ai-agents, analytics, agentic-engineering]
researchFootprint:
  sessions: 7
  artifacts: 29
  totalTokens: 97181096
  inputTokens: 96724520
  cachedInputTokens: 93062912
  outputTokens: 456576
  reasoningOutputTokens: 131106
  wallClockMinutes: 135
  startedAt: "2026-08-25T06:19:05.424Z"
  measuredAt: "2026-08-25T08:34:03.427Z"
  provenanceUrl: "https://github.com/gkoreli/blog/tree/main/packages/blog/drafts/research/llms-txt-geo"
---

# Does llms.txt Work? What a Live Implementation Revealed

<p class="post-orient">A practical guide to <code>llms.txt</code>, page-level Markdown, AI crawler measurement, and the GEO evidence—built from a live implementation whose analytics could not observe the event it claimed to count.</p>

`llms.txt` does not have a demonstrated ranking or citation benefit for open-web AI search. [Google Search explicitly ignores it](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), and none of the other search providers reviewed for this article tells publishers that the file improves visibility.

It does have a smaller, implemented use after a client already knows the site. Maintained coding-agent instructions and tools use compact indexes, targeted Markdown pages, and—in narrower jobs—full-text dumps. If those files can be generated from content you already maintain, they are cheap options. They are not an audience-acquisition strategy.

Provider guidance and client examples in this article were checked on August 25, 2026.

## Should you add llms.txt?

| Situation | Build now | Do not infer |
|---|---|---|
| Personal blog | Keep semantic HTML. Add a generated map and page Markdown only if maintenance is negligible. | New readers, rankings, or citations. |
| Developer documentation | Use a compact map plus targeted Markdown. Tell a known skill or client where to start, then test the task. | Automatic adoption by every coding agent. |
| Large or versioned docs corpus | Prefer index → page retrieval. Test a full dump separately for bounded migration or synthesis work. | One representation winning every task. |
| Google AI visibility | Prioritize crawlable, indexable HTML, internal links, original evidence, and Search Console. | Any visibility benefit from `llms.txt`. |

## What llms.txt is—and what it is not

[`llms.txt` is an open proposal](https://llmstxt.org/), not a web standard or crawler directive. It describes a Markdown file at the root of a site: `/llms.txt`. The file gives an agent a compact, contextual map to useful resources.

It does not replace the existing web:

- `robots.txt` expresses crawler access preferences. It is not a content map.
- `sitemap.xml` enumerates canonical URLs for search crawling. It is not a curated context document.
- `llms.txt` points a willing client toward selected resources after the client knows to ask for it.
- Page-level Markdown is a cleaner representation of one selected page. It can exist at an explicit `.md` URL or behind HTTP content negotiation.
- `llms-full.txt` concatenates a corpus for one-request or local-search workflows. It is a separate product choice, not a required default.

The proposal's current format requires only an H1. A useful file normally adds a short description and grouped links. This is the shape generated from the same metadata that builds gkoreli.com:

```markdown
# gkoreli.com

> A personal publication by Goga Koreli — essays,
> engineering notes, and OSS Radar.

## Engineering

- [The Agentic Product Engineer](https://gkoreli.com/the-agentic-product-engineer.md):
  How software work changes when agents become part of the loop.

## Site indexes

- [Post Index](https://gkoreli.com/posts.json): Post metadata as JSON.
```

The exact live file is at [`gkoreli.com/llms.txt`](https://gkoreli.com/llms.txt). It is longer because the blog currently generates one entry for every post.

Generate the map and alternate representations from the same canonical source. Do not create a second body of machine-only prose that can drift away from what people read. Validate every advertised URL during the build.

The August 2026 proposal also recommends advertising page Markdown and the covering index from HTML:

```html
<link rel="alternate" type="text/markdown" href="/article.md">
<link rel="describedby" href="/llms.txt">
```

The same relations can be sent in an HTTP `Link` header. The client audit for this article did not find a mainstream client in the inspected set that follows these relations for `llms.txt`. Treat them as cheap, reversible proposal metadata—not as a ranking signal or proven interoperability layer.

Check delivery with:

```bash
curl -sS -D - https://example.com/llms.txt -o /dev/null
curl -sS -D - https://example.com/article.md -o /dev/null
curl -sS -D - -H 'Accept: text/markdown' https://example.com/article -o /dev/null
```

Check the status, redirects, content type, and content parity. If one canonical URL serves both HTML and Markdown, it also needs correct cache variation such as `Vary: Accept`. A successful response proves delivery by the server. It does not prove that the body entered a model context or changed an answer.

## I built llms.txt for a blog nobody read

In March 2026, gkoreli.com had one article, 11 views, four visitors, and no referrers. The architecture decision record reduced the problem to one sentence: “The blog is invisible.”

The model I wrote down joined three stages into a loop:

1. sitemaps and structured data would help discovery;
2. `llms.txt` and Markdown would help agents consume the work;
3. AI-agent tracking would show which agents read which pages.

Then I built the whole layer:

- `/llms.txt`, a generated site map;
- `/llms-full.txt`, every article concatenated into one file;
- one `.md` endpoint per article;
- `/posts.json`, a structured catalog;
- static HTML, canonical URLs, sitemaps, and `BlogPosting` metadata;
- an “AI Reads” number on the public analytics dashboard.

By late August, the public API showed 97 `ai_fetches` as of August 24. The blog still did not have the recurring audience I wanted, but the number appeared to establish that machines were reading it.

Then the collaborative audit reached the code that produced the number.

It was measuring another event.

## “AI Reads” could not see direct resource requests

My application analytics does not record the original `GET` for an article, `llms.txt`, or a Markdown endpoint. An HTML page loads, runs an analytics script, and sends a later browser beacon. Abridged, the path looks like this:

```javascript
fetch('/api/event', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({
    path: location.pathname,
    referrer: document.referrer || undefined,
  }),
  keepalive: true,
})
```

The analytics Worker classifies the user agent on that `POST`, writes a page-view row to D1, and counts rows marked `AI` under the API field `ai_fetches`.

That path can observe a browser or render-capable client that executes JavaScript. It cannot observe a normal direct request for `/llms.txt`, `/llms-full.txt`, a page's `.md` representation, or HTML fetched without running the beacon.

Those resources are static assets. Only `/api/*` runs Worker-first in the deployed configuration, so the requests I wanted to study bypass both the application Worker and the browser script.

> "The system was asking a browser page-view service to answer a server retrieval question."

The classifier had a second problem. Its categories were `Human`, `Bot`, and `AI`. But providers document different purposes: search crawling, potential training collection, and user-directed fetching. In the current code, `OAI-SearchBot` and `Claude-SearchBot` fall into the generic bot bucket, while `Claude-User` and `Perplexity-User` can fall into the human bucket. `GPTBot` and `ChatGPT-User` both become AI even though they perform different jobs.

The honest description of the existing metric is: browser analytics events whose beacon user agent matched the current AI regex. It is not a count of AI crawlers reading the site's files. The official crawler roles for [OpenAI](https://developers.openai.com/api/docs/bots), [Anthropic](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), and [Perplexity](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) also change over time, so the classifier needs a dated purpose model—not a longer permanent regex.

## The first edge snapshot mostly found the investigation

The static requests were not invisible to Cloudflare. They were invisible to my D1 page-view model.

The audit queried Cloudflare's edge request aggregates in one-day slices and reconstructed roughly seven days before the live endpoint checks. Every nonempty group reported `sampleInterval: 1`; the data was still grouped evidence, not raw request records.

The historical window contained:

- three requests for `/llms.txt`, likely two Chrome request sequences because one sequence returned `301` and then `200`;
- three requests for article Markdown presenting `curl/8.7.1`;
- zero requests for `/llms-full.txt`;
- zero user agents naming a known AI provider.

The CLI requests might have come from me, another person, or an agent using a shell. The aggregate cannot attribute them. When the research process later fetched the live files with `curl`, the next snapshot was consistent with—and dominated by—those checks, but had no request IDs that could prove each row's origin.

The path worked, but at this traffic level the investigation mostly measured its own requests.

The best cross-domain evidence points in the same sparse direction. [Ahrefs studied 137,210 domains](https://ahrefs.com/blog/llmstxt-study/) in its Web Analytics customer base for May 2026. About 38,000 served a valid `llms.txt`; 97% of those files received no requests. The customer base is technically and SEO skewed, the study measured the root index rather than page Markdown, and a request still did not prove model use. It does establish that automatic requests were rare in that sample.

## “Does llms.txt work?” hides eight different questions

Arguments about the file drift because “works” can refer to different systems.

| Stage | Actual question | Evidence that fits |
|---|---|---|
| Search activation and discovery | Does the system search, and how does it learn that this site or file exists? | product traces, links, sitemaps, explicit instructions |
| Crawling and index eligibility | May a provider crawl and index this page? | status, crawler controls, `noindex`, canonicals, provider tools |
| Retrieval and selection | Why is this source chosen for this query? | query fit, index state, search/citation telemetry |
| Navigation and representation | Once inside the site, which page and format does the client request? | index-following traces, `.md` requests, content negotiation |
| Context and citation | Which candidates receive attention, and which are named or linked? | controlled candidate tests, provider citation telemetry |
| Absorption and fidelity | Which facts or reasoning enter the answer, and are they supported? | claim-to-source comparison, human-audited attribution |
| Referral | Did a person click through? | sanitized referrer and campaign attribution |
| Outcome | Did the visit create a useful read, return, signup, or other declared result? | first-party audience or product telemetry |

A request is an attempt. A successful response shows server delivery. Neither proves that the content entered a model context. A citation does not prove a person visited. Clean Markdown can improve consumption without changing source selection.

I had assigned `llms.txt` an early discovery job. The proposal is better understood as navigation and consumption after a client has a reason to enter.

## Google Search ignores it. A Google agent uses it.

Google's two positions make sense once the stages are separated.

[Google Search says](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) `llms.txt` neither helps nor harms visibility or rankings in Search and its AI features. The documented path remains ordinary Search eligibility: crawlable and indexable pages, useful original material, internal links, and Search Console.

A maintained [Gemini API development skill](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-live-api-dev/SKILL.md#L289-L323) uses a different path. When its preferred documentation MCP is unavailable, it tells the coding agent to fetch Google's documentation index, find the relevant page, and fetch that page's Markdown.

Other maintained workflows give the artifacts similarly narrow roles:

- [Prismatic's documentation skill](https://github.com/prismatic-io/prismatic-skills/blob/b28d1699882c5a457a12a904b63c162c881192a8/plugin/skills/prismatic-docs/SKILL.md) instructs index → targeted `.md` retrieval and defines eval assertions for the behavior. No published passing run was found in this audit.
- [tldraw's migration skill](https://github.com/tldraw/tldraw/blob/2db958ff2e5cf3ab5221ba3a613ff1d69e382e0c/skills/tldraw-migrate/SKILL.md#L18-L30) downloads a bounded full dump, caches it for 30 days, and greps it when a migration needs a specific pattern.
- [Streamlit's current vendored skill](https://github.com/streamlit/streamlit/blob/cd03ef10c348299c73117b6ecea61c93d327ae74/lib/streamlit/.agents/meta-skill/developing-with-streamlit/scripts/discover.py#L262-L305) prefers version-matched package-local skills and keeps the hosted full dump as a fallback.

These are maintained instructions and design choices, not comparative task results. They suggest the boundary: a large documentation tree can favor a small map followed by one page, while a bounded migration corpus can justify a cached dump searched locally.

## An MCP adapter could retrieve this blog

The most direct reproduction used LangChain's [`mcpdoc`](https://github.com/langchain-ai/mcpdoc/tree/8d01c08598e3f19fd6318bded3ffdcda85db03a4), an MCP documentation server that exposes configured sources as tools.

On August 25, the reproduction instantiated `mcpdoc==0.0.10` with `https://gkoreli.com/llms.txt`, called the tools directly, fetched the live index, fetched `/the-agentic-product-engineer.md`, and refused an off-origin URL. The server checks an allowed origin; it does not prove that every accepted same-origin URL appeared in the index.

This established a working retrieval path through an agent-facing adapter. It did not run a model through an MCP host, prove that an agent would choose the tools correctly, or improve a scored task.

This is the same distinction I ran into with the ghx sidecar: [capability proof is not product adoption](/my-evals-say-it-works-i-dont-use-it). Publishing the files does not cause anyone to configure the adapter. But the transport path is no longer hypothetical.

## Page Markdown may matter more than the famous filename

The conversation centers the root file because it has a name. The destination may be more valuable than the map.

Some coding-agent fetchers already ask ordinary URLs for Markdown through the HTTP `Accept` header. In a [February 2026 protocol snapshot](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/), the tested versions of Claude Code, Cursor, and OpenCode preferred Markdown; Codex, Gemini CLI, GitHub Copilot, and Windsurf did not.

The delivery mechanisms differ. [Cloudflare's managed Markdown-for-Agents conversion](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) is opt-in on Pro, Business, and Enterprise plans and relies on correct content negotiation. [Vercel documents an application/docs pattern](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation) for returning Markdown from a canonical URL. This blog instead emits explicit static `.md` files at build time, a simpler choice for its Free-plan static architecture.

The audit compared one post, `/the-agentic-product-engineer`, in both forms on August 25 using `cl100k_base`:

| Representation | Bytes | Tokens |
|---|---:|---:|
| HTML response | 27,554 | 7,683 |
| Markdown response | 10,756 | 2,476 |

The Markdown representation used 67.8% fewer tokens.

That is a representation result, not a task result. A client may make more requests, omit useful content, retry, or verify against HTML. `cl100k_base` is not every current model's tokenizer. The smaller response is enough to justify a test, not a universal performance claim.

The design resembles [map-first progressive disclosure](/you-dont-need-codemap): use the map to decide what deserves a full read. A giant dump reverses that economy unless the task genuinely spans the corpus.

## How to test llms.txt by stage

The measurement must match the job.

1. **Delivery test:** fetch the index and targets. Check status, content type, redirects, parity, and broken links. This tests serving.
2. **Request test:** inspect origin or edge evidence for the index and follow-on page requests. Keep your own checks separate. This tests traffic presented by a client, not use.
3. **Task test:** give fresh agent sessions the same exact question under HTML navigation, index + targeted Markdown, and a full dump. Freeze the site snapshot, model/client, tool budget, and scoring. This tests usefulness after the entry point is supplied.
4. **Citation test:** use provider telemetry or a controlled answer/source comparison. This tests source selection or use, depending on the setup.
5. **Referral test:** count human visits from AI products separately. This tests audience movement.

The benchmark protocol in the research folder is drafted but not frozen or run. Its current proposed quality boundary allows the alternate representation to trail HTML by no more than one scoring point across the full question set. It calls a condition more efficient only if median fetched bytes or input tokens fall by at least 20% without increasing unsupported claims. Disagreement between agent implementations must remain visible rather than being averaged into one universal verdict.

The request baseline has a separate proposed gate. Collect daily edge snapshots across a clean month before routing sparse traffic through a Worker and D1. Exact request logging becomes worth the operational and privacy cost only if unexplained target traffic averages at least one request per day, the same material client appears at least three times, or a declared intervention needs request-level traces.

Those thresholds are editorial choices, not field standards. The protocol remains a draft until they are reviewed and frozen.

For live search evidence, the providers expose different surfaces:

| Evidence surface | What it can establish | What it cannot establish |
|---|---|---|
| Google's limited-rollout generative-AI report | a site link impression in supported Google features | grounding query, answer influence, click, conversion |
| [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) | a covered Bing AI Performance surface displayed a page as a citation; sampled grounding phrases | placement, authority, role in an individual answer, reader action |
| Repeated prompt panel | presence, citation, stance, and accuracy in the declared sample | audience size, stable universal rank, causal lift |
| Edge or origin evidence | a client attempted a request and bytes may have been delivered | model-context use, citation, referral |
| UTM or referrer analytics | an attributable visit reached the site | unclicked exposure, native-app visits without a referrer, causality |

Those are not five versions of one “AI visibility” score. Each is a different event.

## What GEO covers beyond llms.txt

`llms.txt` is one possible navigation input. Generative engine optimization is the wider problem of whether and how a source enters, appears in, and influences a generated answer.

There is no common web protocol called GEO or AEO. The terms overlap:

- **SEO** covers established search eligibility, relevance, ranking, result presentation, and traffic.
- **AEO** is often used for visibility in direct-answer surfaces.
- **GEO** is often used for selection, citation, prominence, or influence inside generated answers.

Those labels are less useful than the eight events named earlier in this article. A July 2026 [critical survey of 45 GEO studies](https://arxiv.org/abs/2607.14035) reaches a similar pipeline model. It is a preprint synthesis, not a new causal experiment. Its useful addition is **answer absorption**: a system can retrieve and cite a page while using little of what made the page valuable.

### What production systems actually expose

As of August 25, 2026, three production paths are concrete.

First, automatic search-index-backed inclusion generally begins with that provider's crawl and index rules. User-directed fetch is a separate path. Google explicitly requires an indexed, snippet-eligible page for AI Overviews and AI Mode; no special AI file or schema is required. Its limited rollout also gives some verified properties a [site-level generative-AI include/exclude control](https://support.google.com/webmasters/answer/16908024?hl=en), separate from ordinary Search and `Google-Extended`.

Second, one question can become several searches. Google documents [query fan-out](https://developers.google.com/search/docs/appearance/ai-features), [ChatGPT documents targeted query rewrites](https://help.openai.com/en/articles/9237897-chatgpt-search), and [Claude documents progressive searches](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool). That is not permission to publish a page for every imagined query. Google warns that mass-producing guessed variants can become scaled-content abuse. Peer-reviewed RAG studies show the reason for restraint: [adaptive decomposition](https://aclanthology.org/2026.eacl-long.322/) can improve diverse coverage under a retrieval budget, while [over-searching](https://aclanthology.org/2026.eacl-long.361/) can add noise and harm abstention. Those are controlled RAG results, not observations of a provider's hidden queries.

Third, the source of truth may not be an article. Merchant Center, Business Profiles, Bing Places, and IndexNow carry supported product, local, and freshness data. One emerging production example is Pinterest's [2026 first-party preprint](https://arxiv.org/abs/2602.02961): it reports a 20% production traffic lift from a bundle of query modeling, visual representations, indexable collections, and internal-link graphs. That is product and search architecture at Pinterest scale, not a portable paragraph recipe.

The newest traffic evidence is less comfortable. A [February Wikipedia natural experiment](https://arxiv.org/abs/2602.18455) and an [August preregistered browser field experiment](https://arxiv.org/abs/2608.18352) both suggest that some generative answer surfaces substitute for outbound publisher clicks. Their estimates depend on different designs and assumptions. Neither isolates the effect of one publisher being cited, changes a publisher page, or tests a GEO remedy.

### What controlled GEO research can—and cannot—show

The [KDD 2024 GEO paper](https://doi.org/10.1145/3637528.3671900) found that citations, relevant quotations, statistics, and clearer writing could change measured visibility inside generated answers. Its main benchmark began with Google's top five results already supplied to GPT-3.5 Turbo. Its Perplexity arm uploaded source files and required answers from them. It tested influence after selection, not organic entry.

The 2026 peer-reviewed frontier keeps that boundary:

- [FeatGEO, ACL 2026](https://aclanthology.org/2026.acl-long.929/) optimizes document-level features across a supplied candidate set and outperforms token-level rewrites. It does not test organic entry into that set.
- [MAGEO, ACL Findings 2026](https://aclanthology.org/2026.findings-acl.2149/) freezes retrieval and learns engine-specific strategies. Its engine specificity argues against one cross-platform checklist.
- [Mind Reader, ACL 2026](https://aclanthology.org/2026.acl-long.1894/) tests generated query variants and reasoning coverage on controlled GEO-Bench and PC-GEO benchmarks, not live provider fan-out.
- [Competitive GEO, SIGIR 2026](https://doi.org/10.1145/3805712.3808445) ran 252,000 paired supplied-candidate trials and found topical relevance and list position stronger than formatting-only changes.
- [AutoGEO, ICLR 2026](https://proceedings.iclr.cc/paper_files/paper/2026/hash/dd5dfba659a7ec010414de1c1debdeb4-Abstract-Conference.html) found that learned document-level rules transferred across several constructed fixed-candidate engines. When every candidate adopted the rules, the target's relative advantage fell near baseline while overall answer utility generally improved. A copied tactic can become hygiene rather than an edge.

The gap between source evidence and answered material is also peer-reviewed. A [NAACL 2025 study](https://aclanthology.org/2025.naacl-long.301/) found that source sets exposed by commercial answer systems contained knowledge for roughly 63–67% of core subquestions, while final answers covered only 42–54%. An [April 2026 absorption preprint](https://arxiv.org/abs/2604.25707) gives that wider distinction a useful measurement frame, but its page-feature associations are observational rather than editing rules.

Measurement also needs repetition. A peer-reviewed [live audit of 4,706 queries](https://aclanthology.org/2026.findings-acl.526/) found only 18% overlap in Google AI Overview source URLs after roughly two months, compared with 45% for organic results. Even at temperature zero where the system exposed that control, 9–27% of ternary answer decisions flipped within five minutes. One screenshot is not a rank.

### The distilled August 2026 position

**Established enough to act on:** satisfy the documented eligibility rules for the surface you want; keep canonical pages connected; separate request, citation, absorption, referral, and outcome; and repeat live measurements. In controlled post-retrieval experiments, topical relevance outweighs formatting-only tricks. Original evidence is still the most defensible reader-first investment, but these experiments do not establish its organic selection effect.

**Emerging:** provider-specific controls and reports, query-family tests, absorption and fidelity audits, explicit user preference through [Google Preferred Sources](https://developers.google.com/search/docs/appearance/preferred-sources), and corpus-specific feeds or product architecture. These are different directions, not one GEO standard.

**Still unproven:** that GEO replaces SEO; that one file, schema, heading pattern, quotation tactic, or manufactured mention causes organic selection; that one prompt screenshot measures a rank; that a controlled gain transfers across engines, competitors, time, and the open web; or that generative visibility reliably creates publisher traffic.

### What I will do for this blog

The workflow is smaller than a GEO program:

1. Start with a real reader question and publish something the existing result set cannot supply: code, data, a reproduction, a correction, or a primary-source synthesis.
2. Keep the canonical page eligible and internally connected. Use a supported feed or profile only when the facts are actually product, local, image, or video data.
3. Put claims beside their evidence and limitations. Use headings, tables, definitions, and procedures when they help the reader—not as a citation spell.
4. For a declared test, freeze the prompt set and execution conditions. Record provider, interface, locale, account state, date, and whether search was observed. Repeat runs and preserve raw answers, sources, nulls, and disagreements.
5. Read each provider report by its own definition, then connect attributable referrals to a human outcome without claiming causality from one update.

I am not building or buying an ongoing GEO visibility dashboard for this blog now. I will use provider-native reports when they have enough data, preserve attributable referrals, and run a small frozen prompt panel only when its result can change a decision. More instrumentation earns its cost when repeated signal or reader contact makes manual evidence the bottleneck. Until then, `llms.txt` can support navigation after entry; it cannot substitute for the reason the source enters the system.

## The smaller job each artifact earned

The audit's current recommendation for this blog is deliberately bounded:

| Artifact | Decision now | Evidence that changes it |
|---|---|---|
| Semantic HTML | Keep as the canonical human/search document and agent fallback. | None of the agent-specific null results removes this job. |
| Small generated `llms.txt` | Keep while it stays synchronized and costs almost nothing. | Repeated client use or measured navigation benefit earns more investment; drift or complexity removes it. |
| Page-level Markdown | Keep as the strongest candidate for durable agent utility. | Quality-preserving task efficiency across more than one agent/client strengthens the case. |
| `llms-full.txt` | Leave on probation; it was 375,443 bytes for 18 posts in the August snapshot. | Keep it only if cross-post synthesis or repeated local search offsets the payload. |
| Public `ai_fetches` label | Rename or explain before treating it as evidence. | It can never become crawler evidence without observing the original resource request. |
| Exact D1 request ledger | Do not build for sparse observed traffic yet. | Build only when exactness changes a declared decision. |

Preserve the automatic options. Test the task claims. Add instrumentation when its answer changes a decision.

## Practical llms.txt answers

### Does llms.txt improve Google rankings or AI Overviews?

No. Google says the file is not used by Search and neither helps nor harms visibility or rankings. Ordinary Search eligibility, helpful original content, internal links, and supported Search Console evidence still apply.

### Do ChatGPT, Claude, Perplexity, or coding agents read it?

There is no provider-wide answer. No reviewed search provider promises organic visibility from the file, while explicitly configured agent skills and tools implement the pattern in bounded documentation workflows. Provider search crawlers, training crawlers, user-directed fetchers, and coding-agent skills are different clients with different jobs.

### Does it replace robots.txt or a sitemap?

No. `robots.txt` expresses crawler access preferences. A sitemap enumerates canonical crawl targets. `llms.txt` is a proposed contextual map for a client that chooses to read it. Keep the established mechanisms.

### Does every site need llms-full.txt?

No. A full dump is useful when a repeated, cross-document task benefits from one corpus or lazy local search. It is wasteful when the client needs one page. Give the dump its own benchmark and size ceiling.

### Should I publish .md versions of every page?

Only when they stay synchronized with canonical content and serve a named client or test. Explicit `.md` URLs are simple for static builds. Content negotiation keeps one canonical URL but requires correct conversion and caching. Semantic HTML remains the baseline web representation.

### How do I know whether an AI system used the file?

You usually cannot prove the whole chain from one metric. Edge or origin evidence can show a request and response. A controlled task can show whether supplied content affected an answer. Provider telemetry can show citations or visibility. Referrer data can show a human visit. Keep those outcomes separate.

## I still want readers

Pretending not to care about traffic would be as false as pretending `llms.txt` creates it.

The file can give an agent a smaller door after something else creates the reason to enter. For developer documentation, maintained skills and explicitly configured tools already implement that path. For this personal blog, the generated map and Markdown remain cheap options; the full dump and custom telemetry have to earn their cost.

If you maintain a client that discovers or follows these files, the useful response is a trace: client and version, initial URL, requested paths, and task result. A zero-request observation window is useful too. If a provider changes its policy, first-party documentation matters more than a screenshot.

That evidence can give the file a larger job. Until then, the smaller one is enough.

---

## Evidence ledger

**Evidence checked:** August 25, 2026. Provider behavior, proposal text, and client code are volatile; the stage model and measurement boundaries are the stable part of this article.

| Term / claim | Source | Evidence date |
|---|---|---|
| Original discovery → consumption → measurement model and March baseline | [gkoreli.com ADR-0006 at the audited implementation baseline](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/docs/adr/0006-ai-readable-blog.md) | Mar 2026 |
| Current browser beacon, classifier, D1 metric, and Worker-first routing | [Browser beacon](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/blog/src/templates/page.ts#L157), [event write](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/analytics/src/index.ts#L43-L90), [classifier](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/analytics/src/classify.ts#L1-L25), [`ai_fetches` query](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/packages/analytics/src/stats.ts#L72-L91), and [Worker-first routing](https://github.com/gkoreli/blog/blob/464c89d75bbf1d684c3f705a3df84c0c141665f1/wrangler.jsonc#L21-L28) | Aug 2026 audit |
| First-party edge snapshot method and grouped result | [Companion research artifact](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/llms-txt-geo/06-edge-baseline-2026-08-24.md) | Aug 2026 |
| `llms.txt` v2 proposal, format, and link relations | [Live proposal](https://llmstxt.org/) and [audited repository baseline](https://github.com/AnswerDotAI/llms-txt/tree/a7cd84fd366b52a29aeb54a8d5fb74aa5d3f6cc2) | Aug 10, 2026 |
| Google Search ignores `llms.txt`; ordinary Search eligibility still applies | [Google Search Central, AI features and your website](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | Updated Jul 10, 2026; accessed Aug 25 |
| Google AI Overviews/AI Mode eligibility and query fan-out | [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features) | Accessed Aug 25, 2026 |
| Google's limited-rollout site-level generative-AI inclusion control | [Search generative AI control](https://support.google.com/webmasters/answer/16908024?hl=en) | Accessed Aug 25, 2026 |
| User-selected Preferred Sources in Google generative features | [Preferred Sources](https://developers.google.com/search/docs/appearance/preferred-sources) | Updated Aug 20, 2026; accessed Aug 25 |
| Maintained Google coding-agent skill uses index → page Markdown | [Pinned Gemini Live API skill](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-live-api-dev/SKILL.md#L289-L323) | Accessed Aug 25, 2026 |
| MCP documentation adapter and direct tool reproduction | [LangChain `mcpdoc` at `8d01c08`](https://github.com/langchain-ai/mcpdoc/tree/8d01c08598e3f19fd6318bded3ffdcda85db03a4) and [reproduction artifact](https://github.com/gkoreli/blog/blob/main/packages/blog/drafts/research/llms-txt-geo/08a-green-team-client-evidence.md) | Aug 25, 2026 |
| Index → targeted Markdown instructions with eval assertions | [Pinned Prismatic skill](https://github.com/prismatic-io/prismatic-skills/blob/b28d1699882c5a457a12a904b63c162c881192a8/plugin/skills/prismatic-docs/SKILL.md) | Accessed Aug 25, 2026 |
| Cached full-dump migration workflow | [Pinned tldraw migration skill](https://github.com/tldraw/tldraw/blob/2db958ff2e5cf3ab5221ba3a613ff1d69e382e0c/skills/tldraw-migrate/SKILL.md#L18-L30) | Accessed Aug 25, 2026 |
| Current Streamlit full-dump fallback | [Pinned Streamlit vendored skill](https://github.com/streamlit/streamlit/blob/cd03ef10c348299c73117b6ecea61c93d327ae74/lib/streamlit/.agents/meta-skill/developing-with-streamlit/scripts/discover.py#L262-L305) | Accessed Aug 25, 2026 |
| Coding-agent Markdown negotiation snapshot | [Checkly protocol test](https://www.checklyhq.com/blog/state-of-ai-agent-content-negotation/) | Feb 2026 |
| Managed negotiated Markdown | [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) | Updated Jul 13, 2026; accessed Aug 25 |
| Application/docs content-negotiation pattern | [Vercel, Making agent-friendly pages with content negotiation](https://vercel.com/blog/making-agent-friendly-pages-with-content-negotiation) | Feb 3, 2026 |
| Cross-domain root-index request study | [Ahrefs study of 137,210 domains](https://ahrefs.com/blog/llmstxt-study/) | May 2026 data |
| OpenAI search, training, and user-directed crawler roles | [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) | Accessed Aug 25, 2026 |
| ChatGPT search eligibility and referral guidance | [OpenAI publisher FAQ](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq) | Updated Aug 2026; accessed Aug 25 |
| ChatGPT targeted query rewrites and citations | [ChatGPT search guidance](https://help.openai.com/en/articles/9237897-chatgpt-search) | Updated Aug 2026; accessed Aug 25 |
| Anthropic search, training, and user-directed crawler roles | [Anthropic crawler guidance](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | Apr 7, 2026; accessed Aug 25 |
| Claude progressive searches and source-bearing citations | [Anthropic web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) | Accessed Aug 25, 2026 |
| Perplexity search and user-directed crawler roles | [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | Accessed Aug 25, 2026 |
| Bing citations, cited pages, and grounding-query telemetry | [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) | Feb 2026 |
| Google Generative AI page/impression reporting | [Search Console report announcement](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) | Jun 2026 |
| Production-scale multimodal collection-page and linking intervention | [Pinterest GEO production preprint](https://arxiv.org/abs/2602.02961) | Feb 2026 preprint |
| Early field evidence on generative answers and publisher referrals | [Wikipedia natural experiment](https://arxiv.org/abs/2602.18455) and [preregistered browser field experiment](https://arxiv.org/abs/2608.18352) | Feb and Aug 2026 preprints |
| Original GEO benchmark | [GEO, KDD 2024](https://doi.org/10.1145/3637528.3671900) | KDD 2024, peer-reviewed |
| Fixed-candidate cross-engine citation optimization | [FeatGEO, ACL 2026](https://aclanthology.org/2026.acl-long.929/) | Jul 2026, peer-reviewed |
| Frozen-retrieval document optimization | [MAGEO, ACL Findings 2026](https://aclanthology.org/2026.findings-acl.2149/) | Jul 2026, peer-reviewed |
| Latent-demand and reasoning-coverage optimization | [Mind Reader, ACL 2026](https://aclanthology.org/2026.acl-long.1894/) | Jul 2026, peer-reviewed |
| Relevance and position versus formatting-only changes | [Competitive GEO, SIGIR 2026](https://doi.org/10.1145/3805712.3808445) | SIGIR 2026, peer-reviewed |
| Competitive saturation of learned document rules | [AutoGEO, ICLR 2026](https://proceedings.iclr.cc/paper_files/paper/2026/hash/dd5dfba659a7ec010414de1c1debdeb4-Abstract-Conference.html) | ICLR 2026, peer-reviewed |
| Retrieved core questions versus answered core questions | [Sub-question coverage, NAACL 2025](https://aclanthology.org/2025.naacl-long.301/) | NAACL 2025, peer-reviewed |
| Query decomposition under a retrieval budget | [Adaptive query decomposition, EACL 2026](https://aclanthology.org/2026.eacl-long.322/) | EACL 2026, peer-reviewed |
| Noise and abstention costs from unnecessary retrieval | [Over-searching, EACL 2026](https://aclanthology.org/2026.eacl-long.361/) | EACL 2026, peer-reviewed |
| Live cross-engine and repeated-run source volatility | [Characterizing Web Search, ACL Findings 2026](https://aclanthology.org/2026.findings-acl.526/) | Jul 2026, peer-reviewed |
| Citation selection versus answer absorption | [Cross-platform measurement preprint](https://arxiv.org/abs/2604.25707) | Apr 2026 preprint |
| Forty-five-study GEO evidence synthesis | [Critical survey of GEO, 2023–2026](https://arxiv.org/abs/2607.14035) | Jul 2026 preprint |
