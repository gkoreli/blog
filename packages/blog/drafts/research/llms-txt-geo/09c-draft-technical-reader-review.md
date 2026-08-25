# Draft Review — Technical Reader and Evergreen Acquisition Asset

**Reviewed:** 2026-08-25  
**Draft:** first iteration of [`019-does-llms-txt-work.md`](../../019-does-llms-txt-work.md), renamed after review  
**Review lens:** technical usefulness, durable query satisfaction, evidence integrity, and distribution to relevant engineering readers  
**Governing form:** research synthesis with a first-person engineering field investigation  
**Production edits:** none

## Verdict

The draft has the material that generic `llms.txt` and GEO guides cannot reproduce: a shipped system, a mislabeled metric found by reading its code, Cloudflare edge evidence contaminated by the investigation itself, a working `mcpdoc` reproduction, exact HTML/Markdown token counts, and a decision that changed under pressure.

That makes it **worthy of becoming the durable reference article**.

It is not there yet as an acquisition asset. The current draft is excellent at answering “what did Goga learn?” but only partially answers the cold reader's practical questions:

- What exactly is `llms.txt`?
- Is it a standard, a directive, or a proposal?
- Does Google or ChatGPT use it?
- How is it different from `robots.txt` and `sitemap.xml`?
- What should a minimal file contain?
- Should I publish `llms-full.txt`?
- Should I use `.md` URLs or `Accept: text/markdown`?
- How do I test the endpoint and measure crawler requests without confusing a fetch with a citation?
- Which sites should invest, and where should they stop?

The draft owns the evidence needed to answer these questions honestly, but leaves too much of the implementation in the research folder. A searcher who lands on the current article gets the argument and the verdict, then still needs a second page for the copyable implementation and measurement procedure.

The recommended move is **not** to turn the article into a generic “complete guide.” Add roughly 900–1,300 words of compact reference material around the existing narrative:

1. one plain-language short answer;
2. one `llms.txt` / `robots.txt` / sitemap comparison;
3. one minimal implementation with actual markup and `curl` checks;
4. one site-type decision table;
5. one measurement ladder;
6. a concise questions section written in Goga's voice, with no FAQ schema.

That would make the page both a builder's field investigation and the page a technical reader can bookmark when deciding whether to implement the convention.

No article can guarantee “substantial” traffic. Domain authority, links, timing, and distribution still matter. This draft can, however, become substantially more *capable* of earning relevant traffic because it supplies original evidence and can satisfy recurring technical intent better than the generic comparison pages currently filling the result landscape. Google explicitly recommends unique, non-commodity, expert-led material for Search and its generative features, and says `llms.txt` itself creates no visibility benefit. The draft's first-party audit is therefore the acquisition asset; the file is not. [Google's current AI-search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

## Living center and protected material

The article's living center is not “`llms.txt` is overrated.” It is:

> I wanted readers, built an agent-readable layer, believed a public number meant machines had arrived, and found that my own system could not observe the event its label claimed to count. Research did not make the build worthless; it forced every artifact to earn a smaller job.

Protect these passages and movements:

- **“I built `llms.txt` for a blog nobody read.”** (`:15`) It is an unusually strong opening because it names both artifact and want.
- **“Then I read the code that produced the number. It was measuring another event.”** (`:32-34`) This is the status-costing turn.
- **“I was asking a browser page-view system to answer a server retrieval question.”** (`:61`) This is the reusable engineering insight.
- **“The first thing it measured was my attempt to measure it.”** (`:96`) This keeps the low-volume evidence honest and memorable.
- **“Google Search ignores it. A Google agent uses it.”** (`:119-142`) This is the article's strongest concise contradiction and its best external-share handle.
- **The `mcpdoc` reproduction** (`:144-156`). It turns a hypothetical use into a demonstrated one.
- **“The destination may be more valuable than the map.”** (`:158-179`) This is the most novel technical reframing.
- **The artifact/job/decision table** (`:181-195`). This is the core practical model.
- **The flexible rule** (`:247-249`) and **“I am keeping it.”** (`:287`). They prevent the investigation from ending as a debunk.
- **The evidence-specific invitation** (`:289-291`). It asks for traces rather than applause.

Do not move the implementation checklist ahead of the opening and measurement failure. The first-person audit is the reason the practical advice is trustworthy. Add the reference layer after the six-stage model or use a compact “short answer” there, then continue the narrative.

## Search-language audit: method and limits

This review used a qualitative current-result audit on 2026-08-25, not a keyword-volume tool. It searched combinations around:

- `llms.txt does it work implementation example validate llms-full.txt`;
- `llms.txt vs robots.txt sitemap markdown endpoints`;
- `generative engine optimization GEO how to get cited AI search`;
- `track AI crawlers OpenAI Anthropic Perplexity Cloudflare logs`;
- public discussions asking whether the file “actually does something,” how it differs from existing web files, and whether anyone has tested the small index against the full dump.

The clusters below are therefore **intent and vocabulary findings, not traffic forecasts**. Search volume and current gkoreli.com impressions must later be validated with page-filtered Search Console data.

The public question language is remarkably consistent:

- “Does `llms.txt` actually do something?” [Representative r/SEO thread](https://www.reddit.com/r/SEO/comments/1mibb1m/does_llmstxt_actually_do_something/)
- “Has anyone tested `llms.txt` vs `llms-full.txt` with actual AI traffic?” [Representative testing thread](https://www.reddit.com/r/AISEOforBeginners/comments/1ux42nn/has_anyone_tested_llmstxt_vs_llmsfulltxt_with/)
- “Is hiding an `llms.txt` link in HTML the recommended way to make it discoverable?” [Representative implementation question](https://www.reddit.com/r/LLMDevs/comments/1trsl7r/is_hiding_an_llmstxt_link_in_html_the_recommended/)
- “How do I reference it from `robots.txt`?” [Representative standards-confusion question](https://www.reddit.com/r/seogrowth/comments/1kz4byg)

These discussions are evidence of reader questions, not evidence that any technical answer inside them is correct. The article should answer them from the proposal, provider documentation, code, and logs.

## Query-intent clusters the article can honestly satisfy

### Cluster P0-A — Does `llms.txt` work?

**Likely language**

- `does llms.txt work`
- `is llms.txt worth it`
- `llms.txt SEO benefit`
- `does Google use llms.txt`
- `llms.txt ChatGPT citations`
- `llms.txt GEO`

**Reader intent:** reach a decision without wading through advocacy or dismissal.

**Current fit:** strong evidence, weak early answer. The six-stage table explains why “work” is ambiguous, and the Google/Search-versus-agent contradiction is excellent. But the answer is distributed across several sections, and the largest cross-domain request study appears only in the glossary.

**Exact addition:** immediately after `“Does llms.txt work?” hides six different questions`, add a compact four-row verdict:

| Job | Current answer |
|---|---|
| Improve Google Search or Google AI visibility | No; Google says it ignores the file |
| Cause AI search systems to discover or cite a site | No demonstrated lift found |
| Help a configured agent navigate known documentation | Yes, in bounded maintained workflows |
| Reduce representation cost after a page is selected | Often in bytes/tokens; task benefit still needs testing |

Then add the Ahrefs base rate with its limits: among 137,210 Ahrefs Web Analytics domains receiving traffic in May 2026, about 38,000 served a valid file and 97% of those files received no requests. The customer base is technically/SEO skewed, the study measured the index file rather than page Markdown, and a request still did not prove use. [Ahrefs methodology and results](https://ahrefs.com/blog/llmstxt-study/)

**Why P0:** this is the draft's natural head query and its strongest honest promise.

### Cluster P0-B — What is `llms.txt`, and how do I implement it?

**Likely language**

- `what is llms.txt`
- `llms.txt example`
- `llms.txt format`
- `how to create llms.txt`
- `llms.txt implementation`
- `llms.txt v2`

**Reader intent:** understand the object and leave with a valid minimal implementation.

**Current fit:** insufficient. The draft calls the file “a generated map,” but never shows one. A reader can finish the whole article without seeing the proposal's required H1 or recommended link-list shape.

**Exact addition:** add a “minimal implementation” section after the artifact/job table. It should contain:

1. the proposal status: it is an open proposal, not a web standard or crawler directive;
2. a 10–15 line `llms.txt` example generated from the actual blog;
3. the current v2 page relations;
4. two or three validation commands;
5. one rule: generate from canonical content rather than hand-maintaining machine-only prose.

The current proposal requires only an H1; it then defines an optional blockquote, descriptive material, and H2-delimited link lists. V2 expects agents to search the small map and follow targeted links, and recommends standard `alternate` and `describedby` relations. [The `/llms.txt` v2 proposal](https://llmstxt.org/), [v2 changes](https://llmstxt.org/changes.html)

**Why P0:** the current `seoTitle` promises “How to Test It,” and implementation intent is the most obvious adjacent durable use.

### Cluster P0-C — `llms.txt` vs `robots.txt` vs `sitemap.xml`

**Likely language**

- `llms.txt vs robots.txt`
- `llms.txt vs sitemap.xml`
- `difference between llms.txt and robots.txt`
- `should llms.txt be in robots.txt`
- `does llms.txt replace sitemap`

**Reader intent:** determine whether the new file controls access, duplicates a sitemap, or belongs in another file.

**Current fit:** partial. The stage model references `robots.txt` and sitemaps, but no direct comparison answers the confusion.

**Exact addition:** add one compact table near the short answer:

| Artifact | Job | Normative force | Typical consumer | Should it be replaced? |
|---|---|---|---|---|
| `robots.txt` | crawler access preferences | established protocol | web crawlers | no |
| `sitemap.xml` | enumerate canonical indexable URLs | established search convention | search engines | no |
| `llms.txt` | curated known-site map to useful resources | proposal/convention | configured agents and tools | it complements; it does not replace either |

The proposal itself says the files coexist and assigns `robots.txt` access-control and `llms.txt` on-demand context/navigation jobs. [Proposal comparison](https://llmstxt.org/#existing-standards)

**Why P0:** current results are crowded with shallow comparison pages. A code-backed table can satisfy the intent with more credibility and less prose.

### Cluster P0-D — `llms.txt` vs `llms-full.txt`

**Likely language**

- `llms.txt vs llms-full.txt`
- `should I create llms-full.txt`
- `llms-full.txt size`
- `llms-full.txt use case`

**Reader intent:** choose between a small map and a complete corpus.

**Current fit:** strong distinction, incomplete generic decision. The 375 KB full dump is on probation, and the tldraw/Streamlit/Prismatic examples show different strategies, but the decision remains implicit.

**Exact addition:** extend the artifact table with “best fit,” “failure mode,” and “evidence to retain it,” or add a four-row site/task matrix:

- small personal site: small generated map; full dump only for a demonstrated cross-post task;
- large docs: sectioned map plus targeted pages; avoid an eager monolith;
- bounded SDK migration: cached full dump can work when a skill greps lazily;
- private RAG: evaluate inside that retrieval system; open-web results do not transfer.

Also state that v2 no longer centers the old context-expansion tooling; `llms-full.txt` is a separate ecosystem convention/implementation choice, not a required core of the current proposal. [v2 consumption change](https://llmstxt.org/changes.html)

**Why P0:** this is where the draft has unusually good positive and negative evidence.

### Cluster P1-A — How do I test or validate `llms.txt`?

**Likely language**

- `test llms.txt`
- `validate llms.txt`
- `check llms.txt`
- `how to know if llms.txt is used`
- `llms.txt server logs`

**Reader intent:** distinguish a valid file, a fetched file, and a useful file.

**Current fit:** conceptually strong, operationally thin. The experiment section lists conditions and measures but gives no first test a reader can run today.

**Exact addition:** convert the experiment section into a staged ladder:

1. **Delivery:** `curl -sS -D - https://example.com/llms.txt -o /dev/null`; require `200`, correct content type, and stable URL.
2. **Links:** extract/fetch every listed URL; ensure same-source generation and no broken or redirected primary links.
3. **Representation:** compare HTML and Markdown bytes/tokens, but label this a transport result.
4. **Task:** freeze questions, source snapshot, client/model, tool budget, and scoring; compare HTML, map+page Markdown, and full dump.
5. **Requests:** inspect edge/server requests by path, status, and presented user agent; separate research traffic.
6. **Citation and referral:** use provider telemetry and human referrers as separate outcomes.

Include the pre-registered numbers already present in the research but missing from the article: the alternate condition counts as more efficient only with at least 20% lower median fetched bytes or input tokens, no increase in unsupported claims, preserved quality, and repetition across more than one agent/client.

**Why P1:** “How to test it” is in the current SEO title; the body must pay off that promise exactly.

### Cluster P1-B — AI crawler analytics and user agents

**Likely language**

- `track AI crawlers`
- `AI crawler analytics`
- `OpenAI crawler user agent`
- `OAI-SearchBot vs GPTBot vs ChatGPT-User`
- `ClaudeBot vs Claude-SearchBot vs Claude-User`
- `PerplexityBot vs Perplexity-User`
- `Cloudflare AI crawler logs`

**Reader intent:** identify which client requested what and understand its stated job.

**Current fit:** strong diagnosis, missing reusable operating instructions. The classifier table is excellent, but it is framed only as the blog's bug.

**Exact addition:** add a measurement matrix or a short boxed rule:

| Event | Best evidence | What it cannot prove |
|---|---|---|
| resource request | origin/edge path + status + presented UA | identity, model use, citation |
| provider search eligibility | current provider bot/robots documentation | selection for a query |
| citation | Search Console/Bing citation telemetry where available | a human visit |
| referral | sanitized referrer/campaign data | which source text influenced the answer |

Keep the existing provider table dated. OpenAI explicitly separates search (`OAI-SearchBot`), potential training (`GPTBot`), and user-triggered actions (`ChatGPT-User`); Anthropic and Perplexity make analogous distinctions. [OpenAI crawler roles](https://developers.openai.com/api/docs/bots), [Anthropic crawler roles](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler), [Perplexity crawler roles](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)

For Cloudflare users, the reusable path is AI Crawl Control or GraphQL filtered by path, status, and user agent. Free-plan identity is UA-based and can be spoofed. [Cloudflare traffic analysis](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/), [GraphQL filters](https://developers.cloudflare.com/ai-crawl-control/reference/graphql-api/)

**Why P1:** this is the article's second strongest unique contribution and can attract engineers who do not care about the filename itself.

### Cluster P1-C — Markdown for agents and content negotiation

**Likely language**

- `serve Markdown to AI agents`
- `Accept text/markdown AI agent`
- `Markdown content negotiation`
- `rel alternate text/markdown`
- `.md endpoints for LLMs`
- `Cloudflare Markdown for Agents`

**Reader intent:** choose a delivery mechanism and implement it correctly.

**Current fit:** strong evidence, no copyable protocol example.

**Exact addition:** show both patterns and name the trade-off:

- **Explicit `.md` URL:** easiest for a static pipeline, visible and cacheable, but creates a second URL whose parity and indexability must be governed.
- **Canonical URL plus `Accept: text/markdown`:** cleaner URL contract and standard negotiation, but needs correct `Vary: Accept`, conversion quality, CDN/origin support, and current client adoption.

Add the v2 header example:

```http
Link: </article.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"
```

Add the smallest client check:

```bash
curl -sS -H 'Accept: text/markdown' https://example.com/article
```

Cloudflare documents the required `Accept` header, `Content-Type: text/markdown`, `Vary: Accept`, and token-count response headers for its paid-plan conversion feature. [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)

**Why P1:** this is an emerging technical topic with less content-farm competition and a direct bridge to the blog's static-site expertise.

### Cluster P2 — GEO / generative engine optimization

**Likely language**

- `does GEO work`
- `generative engine optimization vs SEO`
- `how to get cited in AI search`
- `measure AI citations`
- `GEO evidence`

**Reader intent:** understand whether content changes affect selection/citation and what to measure.

**Current fit:** defensible but intentionally narrow. The draft's GEO section correctly confines most evidence to fixed or supplied candidate sets and rejects a universal formatting recipe.

**Recommendation:** target the **evidence and measurement** subcluster, not the broad “complete GEO guide” cluster. This article does not—and should not—cover brand/entity strategy, third-party mentions, ecommerce, local search, or every answer engine. Trying to satisfy those searches would dilute the living center and attract readers looking for a marketing playbook.

Add one sentence defining GEO and one table tying it to the six stages. Keep the durable action: publish unique evidence, answer a defined question, preserve qualifications, and maintain ordinary search eligibility. Google says its generative features still rely on core Search eligibility/ranking and specifically tells publishers to ignore `llms.txt` and other machine-file “hacks.” [Google guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

For measurement, note that Bing now exposes total citations, cited pages, and sampled grounding-query phrases, while warning that these do not establish placement, authority, or the page's role in an individual answer. [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)

**Why P2:** GEO expands reach but is a poorer primary doorway than `llms.txt` because the article owns only one bounded section of that topic.

## Prioritized draft changes

### P0.1 — Add the missing cross-domain evidence to the body

**Current location:** glossary only at `:308`.  
**Place:** after the blog's seven-day edge result and before the six-stage model.  
**Change:** summarize the Ahrefs base rate and its sampling boundary in 100–140 words.

Why: the article currently moves from one tiny blog's logs to provider guidance without the best available population-scale request evidence. A technical reader will reasonably ask whether the small result is merely a small-site artifact. Ahrefs answers a different but relevant question and makes the later positive coding-agent evidence more surprising. [Study](https://ahrefs.com/blog/llmstxt-study/)

### P0.2 — Give the cold reader a short, stage-specific answer

**Current location:** after `:100-117`.  
**Place:** directly below the six-stage table.  
**Change:** add the four-job verdict table from Cluster P0-A.

Why: the article should not hide its answer to preserve narrative suspense. The first-person story already earned attention; the table lets a searcher verify fit and continue for the evidence.

### P0.3 — Add a minimal, reproducible implementation

**Current gap:** no public-file example or link/header code.  
**Place:** after `The index, the page, and the dump are different products` (`:181-195`).  
**Change:** show a small generated `llms.txt`, the v2 HTML or HTTP link relations, MIME/noindex/parity rules, and `curl` validation.

Required points:

- call it a proposal/convention, not a standard;
- generate the map and page alternatives from the same source;
- keep the map small and descriptive;
- link to targeted content;
- return an accurate content type;
- prevent alternate representations from competing as search pages where appropriate;
- validate every advertised target;
- version-control publisher guidance and treat it as untrusted input on the client side.

The last point matters because instruction-shaped third-party web content is not a privileged channel merely because it is named `llms.txt`.

### P0.4 — Make the `mcpdoc` and token results reproducible

**Current location:** `:144-175`.  
**Change:** add a compact reproduction disclosure, not the whole research script:

- `mcpdoc==0.0.10` and `mcp<2`;
- pinned repository commit;
- configured source URL;
- fetched index, fetched same-origin child, rejected off-origin child;
- exact article path used for token comparison (`/the-agentic-product-engineer`);
- tokenizer name/version or command;
- date/commit of the responses.

Why: these are the article's most original technical results. Without enough method to repeat them, they read like another anecdote.

### P0.5 — Replace “materially” with the pre-registered thresholds

**Current location:** `:273-277`.  
**Change:** state at least the 20% median byte/token reduction, no additional unsupported claims, preserved quality boundary, and repetition across two clients/models. State the edge threshold if it remains part of the decision: roughly one unexplained request per day over the clean month, a material client recurring at least three times, or an experiment that requires request-level traces.

Why: the draft repeatedly argues that each job needs a measurement, then hides its own decision numbers behind “materially” and “regular.” Exact thresholds make the position falsifiable.

### P0.6 — Add a reader decision table

**Place:** inside `The stack I would build now`, before the Keep/Test/Probation lists.  
**Rows:** personal blog; developer documentation; product with a maintained agent skill/MCP integration; large docs corpus; private RAG; publisher seeking Google AI visibility.  
**Columns:** useful job; minimum action; evidence to collect; investment ceiling.

Why: this converts a personal decision into a reusable one without universalizing the verdict.

### P1.1 — Add direct comparison with `robots.txt` and sitemap

Use the compact table from Cluster P0-C. Do not create separate 500-word background sections. The query needs a crisp distinction, not a history lesson.

### P1.2 — Put primary links beside load-bearing claims

The glossary is a useful dated appendix, but readers should not have to scroll to the end to verify:

- Google Search's explicit verdict (`:121`);
- the Gemini skill workflow (`:125-132`);
- Prismatic, tldraw, and Streamlit client behavior (`:134-140`);
- content-negotiation client snapshot and Cloudflare/Vercel behavior (`:162`);
- v2 relations (`:177`);
- the GEO study designs and 252,000-trial result (`:199-203`).

Keep the glossary for auditability; add inline contextual links for reading flow. Google also recommends descriptive, contextual anchor text rather than keyword-stuffed or context-free links. [Google link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

### P1.3 — Add concise answers, but no FAQ schema

Use a human heading such as `## The answers I wish I had in March`, not `Ultimate llms.txt FAQ`.

Answer six questions in 40–80 words each:

1. Does Google Search use `llms.txt`?
2. Does it replace `robots.txt` or a sitemap?
3. Should every site publish it?
4. When is `llms-full.txt` worth keeping?
5. Should I use `.md` URLs or `Accept: text/markdown`?
6. How do I know whether an AI system used the file?

This is reader service, not a schema play. Do not add FAQ structured data; Google deprecated the FAQ rich-result feature in May 2026, and the blog's normal `BlogPosting` markup is enough. [Google Search documentation updates](https://developers.google.com/search/updates)

### P1.4 — Tighten two technical phrasings

- At `:83`, replace “the nonempty groups were unsampled” with the exact observation: every nonempty group reported `sampleInterval: 1`. This avoids implying access to raw request records.
- At `:179`, “they are cheap, validated, and reversible” sounds as if the v2 relations are already validated on this deployment. Use “cheap to generate, straightforward to validate, and reversible” unless the production validator has shipped.

### P1.5 — State Cloudflare feature boundaries

At `:162`, the sentence about Cloudflare serving negotiated Markdown should say that Cloudflare's managed Markdown-for-Agents conversion is currently a Pro/Business/Enterprise feature, and that correct negotiation requires `Vary: Accept`. The blog's explicit static `.md` endpoints are therefore not merely an obsolete workaround; they are the simpler Free-plan/static-build choice. [Cloudflare feature and availability](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)

### P2 — Keep the article focused

Do not add:

- framework-by-framework implementation recipes for WordPress, Next.js, Astro, VitePress, and Docusaurus;
- a giant crawler-UA regex readers will copy after it becomes stale;
- speculative rankings of GEO tools;
- FAQ schema;
- a directory of sites that publish the file;
- a generic history of SEO/AEO/GEO;
- a promise that semantic structure or Markdown raises citations;
- “best llms.txt generator” affiliate-style intent.

Those additions might expand keyword coverage but would make the article less trustworthy and harder to maintain. Link to the proposal's integrations list for platform-specific generators instead. [Proposal integrations](https://llmstxt.org/#integrations)

## Metadata and doorway recommendation

### H1

Keep:

`I Gave llms.txt a Smaller Job`

It is specific, first-person, and aligned with the movement. It contains the primary handle without impersonating a guide.

### SEO title

Recommended:

`llms.txt: What Works, What Doesn't, and How to Test It`

Why:

- front-loads the strongest query/entity;
- precisely matches the article's bounded verdict;
- avoids attracting broad “complete GEO strategy” intent that one section cannot satisfy;
- stays semantically aligned with the H1;
- remains concise without keyword stuffing.

The current title—`llms.txt and GEO: What Works and How to Test It`—is defensible only if the article adds an equally practical GEO measurement section. Otherwise, it promises two full guides while delivering one field investigation plus one bounded research interpretation.

Google recommends descriptive, concise titles, warns against keyword stuffing, and may draw title links from the H1 and other prominent text. [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link)

### Description

Recommended:

`Does llms.txt work? I audited a live implementation, AI crawler logs, Markdown endpoints, and GEO research, then defined what to keep and test.`

This is 143 characters, names the high-intent question, and immediately differentiates the page through first-party evidence.

The current description is already good. Change it only if the practical implementation/testing sections ship; otherwise “testable job” remains the more accurate promise.

### Orientation sentence

The existing orientation is accurate but generic. After adding the practical sections, make it carry the reusable result without giving away a fake universal answer. Its job is to tell a cold reader that this is a live implementation, request-log audit, client reproduction, and bounded testing guide.

### URL and update policy

- Keep the durable literary slug generated from the draft filename; do not create a comparison-stuffed URL.
- Put a visible evidence-audit date near the glossary.
- Add `lastModified` only when the benchmark, provider policy, client evidence, implementation, or article verdict materially changes.
- Maintain an update note for major evidence changes so the page can age rather than be replaced by annual “2027 guide” clones.

## Practical section specification

The following content can be added without flattening the narrative.

### A minimal map

Use the blog itself:

```markdown
# gkoreli.com

> Engineering field notes by Goga Koreli.

## Engineering

- [The Agentic Product Engineer](https://gkoreli.com/the-agentic-product-engineer.md): How software work changes when agents become part of the loop.

## Site indexes

- [Post catalog](https://gkoreli.com/posts.json): Structured post metadata.
```

Keep it intentionally small. Explain that the proposal's only required element is the H1; usefulness comes from accurate summaries and links, not keyword density. [Format](https://llmstxt.org/#format)

### Page-advertised alternatives

```html
<link rel="alternate" type="text/markdown" href="/article.md">
<link rel="describedby" href="/llms.txt">
```

Or:

```http
Link: </article.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"
```

State that these relations are proposed client affordances, not search-ranking signals, and that the client audit found no mainstream relation consumer yet.

### Delivery checks

```bash
curl -sS -D - https://example.com/llms.txt -o /dev/null
curl -sS -D - https://example.com/article.md -o /dev/null
curl -sS -H 'Accept: text/markdown' https://example.com/article
```

The reader should check status, content type, redirects, content parity, and whether the negotiated response varies on `Accept`.

### The decision table

Prefer a small table over another prose section:

| Situation | Build now | Do not infer |
|---|---|---|
| Personal blog | semantic HTML; auto-generated map and `.md` only if near-zero maintenance | audience or citation growth |
| Developer docs | compact map, targeted Markdown, explicit client/skill instruction, task benchmark | universal client adoption |
| Bounded SDK migration | consider a versioned cached dump with lazy local search | that a giant dump fits every docs corpus |
| Google AI visibility | ordinary indexable HTML, internal links, unique evidence, Search Console | any benefit from `llms.txt` |

## Technical-reader audit of the current draft

### What already works exceptionally well

- **Architecture is concrete.** The beacon/Worker/static-asset split gives the article an inspectable failure, not a vague analytics complaint.
- **The epistemic stages are reusable.** Discovery, eligibility, selection, representation, citation, and referral stop claims from traveling between systems.
- **The positive case is real and bounded.** The Google skill, official product skills, and `mcpdoc` reproduction prevent a lazy “nobody uses it” verdict.
- **The article praises the narrower tool.** It says what the file is good at rather than building a straw man.
- **The page Markdown section is novel.** Most current discourse fixates on the root filename; this article identifies the destination representation as the probable durable value.
- **The experiment has falsifiers.** The interface gets a larger job only if task evidence earns it.
- **The ending requests useful evidence.** This is contact, not engagement farming.

### What currently causes cold-reader friction

- The object is never shown.
- The short answer arrives only after synthesis.
- The most important population-scale evidence is absent from the body.
- The current title promises testing, but the body gives a protocol outline rather than runnable first checks.
- Exact thresholds are hidden.
- The provider/crawler table could be mistaken for a stable allowlist rather than a dated classification example.
- The glossary has the proof, but load-bearing claims often lack nearby links.
- The article does not answer the ubiquitous robots/sitemap confusion.
- The `mcpdoc` reproduction and token result cannot be repeated from the article alone.
- The Cloudflare content-negotiation mention lacks plan and cache-variation constraints.

## Internal-link plan

Use hard prose relationships, not a generic related-post block. This article does not need a new series.

### Links from the new article

1. **To `/my-evals-say-it-works-i-dont-use-it`** in the `mcpdoc` or artifact-job section. Rationale: that field note separates capability proof from adoption; this article makes the same distinction for a machine-readable interface. Suggested contextual idea: an interface can work in an eval without becoming a habit or creating demand.
2. **To `/you-dont-need-codemap`** in the page-Markdown or full-dump section. Rationale: both articles argue for progressive disclosure—map first, full content only when the task earns it.
3. Optionally **to `/how-ghx-was-born`** only if the article explicitly connects the original GitHub HTML/context failure to the current HTML-versus-Markdown measurement. Otherwise skip it.

Two natural internal links are enough. Google recommends descriptive anchors with useful surrounding context; do not repeat “llms.txt” in every anchor. [Google link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

### Forward links from existing pages

1. **From `/my-evals-say-it-works-i-dont-use-it`:** add one sentence where capability and adoption separate, pointing to the new article as the same failure mode in publishing infrastructure.
2. **From `/you-dont-need-codemap`:** add one sentence near the map-versus-full-read decision, pointing to the representation benchmark and full-dump probation.
3. **From `/stats`:** once the public `AI Reads` label is corrected or explicitly explained, link the explanation to this audit. Do not use the article as a substitute for fixing a misleading label.
4. **From the public ADR/source link surface:** keep the pinned ADR link inside this article. The old model is provenance, not an SEO landing page.

Do not add links from unrelated posts merely because they share `agentic-engineering` tags.

## Distribution plan grounded in the article's evidence

### Before publication

1. Add the practical P0 sections and inline primary links.
2. Publish the `mcpdoc` reproduction command, frozen commit, and enough raw output in a repository artifact the article can link to.
3. Preserve the edge snapshot and benchmark protocol at durable public URLs or pinned repository commits.
4. Add the two natural forward internal links.
5. Verify the generated HTML, Markdown endpoint, canonical URL, social metadata, and source appendix.

### Canonical launch

- Publish on gkoreli.com first.
- Submit/request recrawl in Google Search Console and Bing Webmaster Tools.
- Confirm the sitemap and canonical URL resolve as expected.
- Do not alter the title repeatedly during the initial recrawl/measurement window.

Google's title guidance favors descriptive, concise text and may rewrite inconsistent titles; its AI-search guidance says standard eligibility and unique content remain foundational. [Title guidance](https://developers.google.com/search/docs/appearance/title-link), [AI-search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

### High-fit engineering distribution

**Hacker News / Lobsters**

- Use the actual H1: `I Gave llms.txt a Smaller Job`.
- The submission text, if a comment is appropriate, should disclose the first-party hook: the “AI Reads” metric measured the wrong boundary, a generic MCP client successfully consumed the files, and the benchmark remains pre-registered rather than complete.
- Submit only once the reproduction and practical section are public. The audience will test them.

**dev.to cross-post**

- Cross-post after the canonical page is live, with `canonical_url` pointing to gkoreli.com.
- Preserve the measurement code, tables, and evidence links. Do not turn it into a shortened generic tutorial that outranks or disappoints relative to the source.

**X and LinkedIn**

Use one concrete finding per post:

- “My dashboard said 97 AI fetches. The architecture could not observe direct fetches of the files.”
- “Google Search ignores `llms.txt`; a maintained Google coding-agent skill uses it. Those are different jobs.”
- “The same article was 7,683 tokens as HTML and 2,476 as Markdown. That is a transport result, not yet a task result.”

Each is precise enough to be challenged. Avoid “the definitive guide to GEO.”

### Upstream/community contribution, not link dropping

- File or contribute to the `mcpdoc` MCP 2 dependency issue with the minimal reproduction if it is not already reported. Link the article only if it adds needed context; the issue is not a distribution channel.
- Share the client trace or benchmark fixture in the `llms.txt` proposal community only when it contributes new interoperability evidence.
- If a Cloudflare community thread asks how to observe static asset requests, share the measurement boundary and GraphQL method, not a promotional summary.
- Return to the article with `lastModified` when upstream behavior changes materially.

### Update-driven redistribution

The strongest second distribution event should be the benchmark result, not a reminder that the post exists.

Update the same URL with:

- frozen site commit;
- client/model versions;
- raw traces;
- score vector;
- token/byte results;
- nulls and disagreements;
- whether the small map, page Markdown, and full dump kept or lost their jobs.

Then share the changed result with the communities that discussed the protocol. This gives readers a reason to return and keeps one durable page accruing links and history.

## Measurement plan for acquisition and relevance

The article argues that metrics must match jobs. Apply that to its own distribution.

### Search fit

After fresh indexing data arrives, export page-filtered queries and bucket them into:

1. `does it work / worth it`;
2. implementation/example;
3. robots/sitemap comparison;
4. full dump;
5. crawler analytics;
6. Markdown/content negotiation;
7. GEO evidence/measurement;
8. wrong-fit marketing/tool intent.

Measure impressions, position, and clicks separately per bucket. A good average position with zero clicks may be a doorway problem; high impressions from “best GEO software” would be an intent mismatch, not proof the article needs tool recommendations.

### AI-search visibility

- Use Google's Generative AI performance report in Search Console if the site has access; Google says rollout began with a subset of sites. [Search Console report announcement](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports)
- Use Bing AI Performance for citations, cited pages, and sampled grounding queries, preserving Bing's warning that counts do not show ranking, authority, placement, or role in an answer. [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)
- Keep human referrals from ChatGPT/Perplexity/Claude separate from crawler requests and citations.

### Relevant-reader contact

Track the outcomes the article explicitly asks for:

- a reproducible client trace;
- an anonymized zero/nonzero request window;
- a benchmark fork or raw run;
- a provider documentation correction;
- an upstream issue or patch;
- a reader who used the decision table to avoid or right-size an implementation.

These are more meaningful than raw pageviews, but pageviews and subscribers still matter because the author honestly wants an audience. Report both without pretending they answer the same question.

### Review windows

- **First 28 days:** verify indexing, query buckets, referrals, and obvious technical errors. Avoid metadata churn.
- **Eight to twelve weeks:** decide whether the title/description match good-fit queries and whether internal distribution produced relevant readers.
- **After benchmark publication:** compare new query/referral/contact patterns, but do not attribute every change to the content update.
- **Quarterly evidence audit:** check provider bot docs, proposal changes, maintained client behavior, and broken links. Update only for material changes.

## Acceptance checklist before this is the durable version

- [ ] The body says that `llms.txt` is a proposal/convention, not an access-control standard.
- [ ] The article gives a short stage-specific answer to “does it work?”
- [ ] The Ahrefs cross-domain result appears in the body with sample and inference limits.
- [ ] A reader sees an actual minimal `llms.txt` file.
- [ ] `robots.txt`, sitemap, `llms.txt`, page Markdown, and full dump have distinct jobs.
- [ ] V2 `alternate` and `describedby` markup is shown and labeled proposed/untested in mainstream clients.
- [ ] `.md` URLs and content negotiation have a practical trade-off table or paragraph.
- [ ] Delivery, request, task, citation, and referral tests are separate.
- [ ] Exact benchmark and request-observation thresholds replace “materially” and “regular.”
- [ ] The `mcpdoc` and token tests can be reproduced from public artifacts.
- [ ] Load-bearing claims have inline primary links as well as glossary rows.
- [ ] Provider UA examples are dated and not presented as a permanent copy-paste allowlist.
- [ ] The reader decision table covers blogs, docs, client-integrated products, full dumps, and Google visibility.
- [ ] A concise questions section answers recurring confusion without FAQ schema.
- [ ] Two contextual internal links connect this article to capability-versus-adoption and progressive-disclosure posts.
- [ ] The SEO title targets `llms.txt` first and does not overpromise a complete GEO playbook.
- [ ] The evidence audit date and future update conditions are visible.
- [ ] The conclusion and evidence-specific invitation remain intact.

## Final recommendation

Do not replace the article's personality with a tutorial. Turn the field investigation into the reference page by making its evidence operational.

The durable positioning is:

> The code-backed answer to whether `llms.txt` works: which jobs it does not perform, where maintained agents use it today, how page Markdown changes representation cost, how to implement the smallest useful version, and how to test requests, tasks, citations, and referrals without confusing them.

That is broad enough to acquire readers across `llms.txt`, crawler analytics, Markdown-for-agents, and bounded GEO measurement. It remains narrow enough to stay true.

## Primary sources and source rationale

| Source | Why it supports this review |
|---|---|
| [The `/llms.txt` v2 proposal](https://llmstxt.org/) and [changes](https://llmstxt.org/changes.html) | Current proposal status, format, page Markdown, link relations, consumption model, and v1/v2 boundary |
| [Google generative AI Search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) | Explicit `llms.txt` non-use in Google Search, ordinary eligibility, unique content, and Search Console measurement |
| [Google title-link guidance](https://developers.google.com/search/docs/appearance/title-link) | Descriptive/concrete title and anti-keyword-stuffing recommendations |
| [Google link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) | Contextual internal-link and anchor-text rationale |
| [Google Generative AI performance report](https://developers.google.com/search/blog/2026/06/gen-ai-performance-reports) | Current Search Console measurement surface and limited rollout |
| [Ahrefs 137,210-domain log study](https://ahrefs.com/blog/llmstxt-study/) | Best available cross-domain observation of index-file requests, requester categories, and limits |
| [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots) | Search, training, and user-directed client roles |
| [Anthropic crawler guidance](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | Search, training, and user-directed client roles |
| [Perplexity crawler documentation](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) | Search and user-directed client roles plus identity-verification guidance |
| [Cloudflare AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/) and [GraphQL reference](https://developers.cloudflare.com/ai-crawl-control/reference/graphql-api/) | Practical request/path/status/UA observation and evidence limits |
| [Cloudflare Markdown for Agents](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/) | Negotiation request/response contract, token headers, `Vary`, plan availability, and limits |
| [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview) | Citation, cited-page, and grounding-query measurement plus inference boundaries |
| [GEO, KDD 2024](https://arxiv.org/abs/2311.09735) | Original GEO intervention claims and supplied/fetched-source experiment design |
| [Competitive GEO, SIGIR 2026](https://arxiv.org/abs/2605.25517) | Current controlled evidence that relevance and position outweigh formatting-only changes |

Public discussions are linked only as evidence of recurring reader language. They are not used as technical authorities.
