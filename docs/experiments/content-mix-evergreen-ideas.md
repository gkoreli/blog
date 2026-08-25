# Content Mix — 5 Evergreen "How-To" Ideas for gkoreli.com

**Purpose:** Balance the barbell. Your 18 published posts are all *spike* content — essays, build-in-public narratives, OSS Radar. Great for HN/X bursts, poor for compounding search traffic. This doc proposes 5 *evergreen* how-to posts: search-intent titles, low-decay topics, each writable **only** by you because you have the receipts.

**The barbell:**
- **Spikes (have):** essays + OSS Radar → attention bursts, personality, subscribers.
- **Evergreen (missing):** durable inquiry/reference work → a chance to compound through search, links, and reuse once the domain ages. None of those outcomes is automatic.
- **Rule:** don't stop the essays. Add ~1 evergreen per 3–4 posts. Evergreen ≠ boring — write them in your voice, just answer a query.

Each idea below contrasts with the *narrative* post you already have on the theme, so these complement rather than duplicate.

---

## 1. How to Reduce AI Coding Hallucinations — A Context-Engineering Workflow

- **Search intent (high volume, rising):** "why does AI write wrong code," "reduce LLM hallucination coding," "context engineering for coding agents," "how to prompt Claude/Codex for code."
- **Candidate title/slug:** `how-to-reduce-ai-coding-hallucinations` · title "How to Reduce AI Coding Hallucinations (a Repeatable Workflow)"
- **Contrast with existing:** `001-the-agentic-product-engineer` is the *manifesto* ("there are ways to cut hallucination by orders of magnitude"). This post is the *method* — the actual steps.
- **Your unfair proof (E-E-A-T):** ghx = 23 agent sessions / 2,500+ turns / 3 rewrites; `018-my-evals-say-it-works-i-dont-use-it`; 10y + AWS Model Customization.
- **Outline:** (1) why context, not model, is the bottleneck → (2) the 5 context inputs that matter → (3) the tight-loop workflow (scope → recon → constrain → verify) → (4) 3 anti-patterns with real failure examples → (5) a copy-paste checklist.
- **Internal links:** → agentic-product-engineer, how-ghx-was-born, you-dont-need-codemap.
- **Section/tags:** `engineering` · `[agentic-engineering, context-engineering, ai-agents]`
- **Why it ranks/lasts:** evergreen skill, enormous query base; the checklist is a link magnet.

---

## 2. How to Build Cookieless, Privacy-First Analytics on Cloudflare Workers + D1

- **Search intent (high buyer-intent; category crowded, the *Workers+D1* build niche is thin — see Part II):** "cloudflare workers analytics," "build own analytics d1," "self-hosted cookieless analytics," "plausible/GA alternative DIY," "web analytics without cookies."
- **Candidate title/slug:** `cookieless-analytics-cloudflare-workers` · "Build Your Own Cookieless Analytics on Cloudflare Workers"
- **Contrast with existing:** you have ADRs (0004/0005) and a *live* `/stats`, but no public tutorial. This converts internal design into a step-by-step guide.
- **Your unfair proof:** the entire `packages/analytics` package (visitor classification, D1 schema, hashing, stats API) + a public dashboard you actually run.
- **Outline:** (1) why cookieless + the GDPR angle → (2) the Worker event endpoint → (3) D1 schema + the visitor-hash trick (no cookies) → (4) bot/AI/human classification → (5) the `/stats` query layer → (6) cost (spoiler: ~$0). Ship a minimal repo/gist.
- **Internal links:** → stats page, the GEO post (idea #3), privacy page.
- **Section/tags:** `engineering` · `[cloudflare-workers, d1, analytics, privacy, build-in-public]`
- **Why it ranks/lasts:** "how to build X on Cloudflare Workers" is a durable long-tail cluster; people arrive ready to copy code. Excellent GitHub/HN crossover.
- **⚠ Reality check (see Part II):** you are **not first** — Counterscale (~2.1k★, Workers + Analytics Engine + R2) and several 2025–26 blog tutorials ship a near-identical cookieless-on-Workers stack. Win on the angles they skip: **why D1 over Analytics Engine**, your **AI/human/bot classification** (which CF's own RUM structurally can't do), and the **D1 no-billing-cap write gotcha**.

---

## 3. The Honest Guide to llms.txt & GEO (What Actually Works)

- **Reframed three times after research.** My earlier "add llms.txt → get cited by ChatGPT/Perplexity" pitch was too rosy. The first full draft then swung too far inward: it was a strong field note but a weak search doorway. The second version answered the `llms.txt` question but treated GEO mostly as a study boundary. The current form is an engineering decision guide backed by a first-person investigation, plus an evidence-tiered August 2026 map of the wider GEO pipeline.
- **Search intent:** "how to add llms.txt," "does llms.txt work," "llms.txt example," "generative engine optimization guide," "track AI crawlers," "get cited by ChatGPT."
- **Selected doorway:** H1: “Does llms.txt Work? What a Live Implementation Revealed.” SEO title: “llms.txt and GEO: Live Evidence and What to Test.” Slug: `does-llms-txt-work`. `llms.txt` remains the concrete investigation; GEO is the complementary operating model around eligibility, retrieval, citation, answer absorption, referral, and outcome—not a promise of a complete marketing playbook.
- **Contrast with existing:** turns ADR-0006 into a public reassessment of a system and causal model I actually built.
- **Your unfair proof:** you shipped the index, full dump, page Markdown, metadata, and analytics. The audit adds sparse first-party edge aggregates, a reproduced `mcpdoc` retrieval path, pinned maintained client workflows, and a 67.8% one-page representation-token difference. None of those proves organic AI-search lift; together they make the practical guide unusually inspectable.
- **Current thesis after red-team:** `llms.txt` is an optional, low-cost navigation convention with a concrete developer-doc use case, but no demonstrated organic AI-search ranking or citation lift. It can help an agent that already has a reason to enter a site; it has not been shown to create that reason. GEO can change what happens after retrieval, but the effects are conditional and engine-specific. Unique, relevant, well-supported work remains more durable than a machine-facing ritual.
- **Current outline:** (1) answer whether it works and who should build it → (2) define the map, page Markdown, full dump, `robots.txt`, and sitemap → (3) show a minimal implementation and delivery checks → (4) reveal the “AI Reads” measurement gap → (5) separate search activation, eligibility, retrieval, navigation, citation, absorption, referral, and outcome → (6) inspect provider and maintained-client evidence → (7) reproduce the MCP adapter and Markdown representation result → (8) show a task/request/citation measurement ladder → (9) explain the wider GEO production pipeline, controlled research, live-system instability, provider telemetry, and 2026 field frontier → (10) distinguish established patterns, emerging directions, and unproven rules → (11) give each artifact a decision and falsifier → (12) answer recurring reader questions in a dated reference tail.
- **Internal links:** → `/my-evals-say-it-works-i-dont-use-it` for capability versus adoption; → `/you-dont-need-codemap` for map-first progressive disclosure; → `/stats` after the public metric label is corrected or explained.
- **Section/tags:** `engineering` · `[geo, llms-txt, ai-agents, seo, cloudflare-workers]`
- **Why write it first:** highest learning fit and a durable, recurring technical question. Its acquisition asset is the original audit—not the file itself. Traffic is an explicit goal, but a promise only query data can validate after publication.

---

## 4. How to Build an MCP Server — A Practical Walkthrough (Lessons from backlog-mcp)

- **Search intent (surging):** "how to build MCP server," "model context protocol tutorial," "MCP server TypeScript example," "MCP tools vs resources."
- **Candidate title/slug:** `how-to-build-an-mcp-server` · "How to Build an MCP Server (Practical Walkthrough)"
- **Contrast with existing:** backlog-mcp appears only as a tag/tool mention. This is the standalone reference tutorial.
- **Your unfair proof:** you shipped `backlog-mcp` — real design decisions (tool surface, state, agent ergonomics) beat the toy examples that dominate current results.
- **Outline:** (1) what MCP actually is (and isn't) → (2) tools vs resources vs prompts, when to use each → (3) build a minimal server → (4) designing a tool surface an agent won't misuse → (5) testing/wiring into Claude/Codex → (6) 3 mistakes from backlog-mcp.
- **Internal links:** → agentic-product-engineer, bring-your-own-ai-agent, code-context post (#5).
- **Section/tags:** `engineering` · `[mcp, ai-agents, backlog-mcp, open-source]`
- **Why it ranks/lasts:** MCP demand is climbing fast and quality tutorials are scarce; a battle-tested walkthrough ages well and earns backlinks from other MCP builders.

---

## 5. How to Give a Coding Agent the Right Code Context (Code Reconnaissance)

- **Search intent (evergreen agentic-dev skill):** "how to give AI agent codebase context," "feed repo to LLM," "code context for coding agents," "repomix/repo-to-text alternative," "how much code to paste into Claude."
- **Candidate title/slug:** `code-context-for-coding-agents` · "Code Reconnaissance: Feeding a Coding Agent the *Right* Context"
- **Contrast with existing:** `007-you-dont-need-codemap` and `003-how-ghx-was-born` are opinion/story. This is the *how* — a portable technique, tool-agnostic.
- **Your unfair proof:** ghx exists precisely to solve this; you have strong, contrarian, tested opinions ("you don't need codemap").
- **Outline:** (1) the failure mode: dump-everything vs starve-the-agent → (2) recon before generation → (3) selecting the minimal high-signal set → (4) tools (ghx and alternatives, honest comparison) → (5) a repeatable recon checklist per task.
- **Internal links:** → how-ghx-was-born, you-dont-need-codemap, hallucinations post (#1).
- **Section/tags:** `engineering` · `[ghx, context-engineering, agentic-engineering, open-source]`
- **Why it ranks/lasts:** every developer using coding agents hits this; a named technique + checklist is exactly what LLMs love to cite.

---

## Prioritization

Ranked by (search demand × ease-to-write-now × strategic fit). Ease is high when the material already exists in your repo/ADRs.

| Rank | Idea | Demand | Ease (material exists?) | Strategic fit | Start? |
|------|------|--------|-------------------------|---------------|--------|
| 1 | #3 llms.txt / GEO | Unmeasured in this research | **High** — shipped system + ADR | First-party reassessment + new experiment | **First** |
| 2 | #2 CF Workers analytics | High, buyer-intent | **High** — package shipped | HN/GitHub crossover | **Second** |
| 3 | #4 Build an MCP server | Surging | Medium — backlog-mcp shipped | Rides MCP wave | Third |
| 4 | #5 Code context / recon | Steady, broad | Medium — ghx shipped | Reinforces ghx | Fourth |
| 5 | #1 Reduce hallucinations | **Highest** | Medium — needs synthesis | Anchors your core theme | Fifth (most competitive) |

## Execution notes
- **Cadence:** 1 evergreen per 3–4 essays keeps voice intact while compounding SEO.
- **Structure for readers and source use, not a GEO recipe:** make the question and evidence legible; use exact numbers, primary sources, concrete sections, and code only where they help. Do not add a TL;DR, FAQ block, question-shaped heading, or schema type merely because someone sells it as GEO.
- **Cross-link aggressively** — these five interlink into a coherent "agentic engineering" cluster, which builds topical authority faster than isolated posts.
- **Measure per-post** in `/stats`: watch which ones accrue search + AI-referral traffic over 60–90 days, then double down on that lane.

_Draft ideas — not committed posts. Pair with your `packages/blog/drafts/` workflow when you pick one up._

---
---

# Part II — Grounded Understanding (web + GitHub research)

_Method: six parallel research agents swept the web + GitHub — your own footprint and the five topic ecosystems. Every claim below carries a source in the appendix. Where sources disagree or I couldn't reach a primary, it's marked **[estimate]** or **[contested]**. Distilled, not exhaustive._

## What the research changed (honest corrections)

- **llms.txt ≠ organic citation lift.** I earlier implied shipping the file earns ChatGPT/Perplexity citations. Google Search explicitly says it ignores the file. Other reviewed search-provider guidance does not promise lift. But the positive case is real in a narrower layer: a maintained Google Gemini skill directly uses an `llms.txt` index and page Markdown to navigate known developer docs. **Why it matters:** the article must preserve both facts instead of choosing hype or dismissal.
- **You're not first on Workers analytics.** Counterscale (~2.1k★) and several 2025–26 tutorials already ship the cookieless-on-Workers pattern. Idea #2 now competes on depth (D1-vs-Analytics-Engine, classification, billing gotchas), not novelty. **Why it matters:** "I built the first" is falsifiable in one Google search; "here's the decision nobody else explains" is not.
- **Your "unfair proof" is doc depth, not audience.** ghx has 666 commits + 26 ADRs + pre-registered evals but **0 stars**; the blog has **effectively zero external backlinks / no HN·Reddit·Lobsters footprint**; `@nisli/core` ~192 downloads/mo. backlog-mcp (5★, Glama "Quality A") is your only externally-validated repo. **Why it matters:** authority in these posts must come from *showing the receipts* (ADRs, eval numbers, real fetch logs), because social proof isn't there yet — and distribution will be manual for now.

## Your real assets & constraints (footprint, distilled)

- **Repos:** `ghx` (Go, agent-first code recon, ~92% token-reduction claim — *self-reported*), `backlog-mcp` (TS, agent-memory MCP, 30+ tools, ~920 commits, 5★/2 forks, Glama A), `nisli`/`@nisli/core` (TS reactive web components, powers the blog), `agentport` ("bring your own agent to any site"), `blog`. All pushed within days — **high current velocity, small audience.**
- **Person:** SWE at AWS (SageMaker serverless model customization), Seattle, decade+; LinkedIn ~343 followers; X `@GogaKoreli` (metrics not retrievable **[gap]**).
- **Strategic implication:** you have *more than enough* substance per topic; the missing ingredient is reach. Evergreen how-tos are the right bet precisely because they don't depend on an existing audience — they compound via search + get referenced over 6–18mo. Until then, each post still needs a manual distribution push (HN/Reddit/X/newsletter).

## Per-idea grounding (distilled)

- **#1 Hallucinations / context engineering.** "Context engineering" was *popularized* mid-2025 by Tobi Lütke + Karpathy + Simon Willison (no single coiner — don't claim one **[contested]**). Anthropic's doctrine — "the smallest set of high-signal tokens that maximize the outcome" — is quotable backing for a lean-context thesis. Durable audience; frame as method, cite Anthropic.
- **#2 Workers analytics.** Differentiators that survive scrutiny: **D1 vs Analytics Engine** (AE = unlimited cardinality but 90-day retention + no joins; D1 = SQL/joins/unbounded but you own aggregation + write budget), **AI/human/bot classification** (CF RUM is stateless — can't do it), and the **D1 no-billing-cap footgun** (a documented ~$4,868 runaway). Address write-cost or an expert reader dismisses the post.
- **#3 llms.txt / GEO.** See the dedicated scratchpad. Key facts: the current v2 proposal is an optional navigation convention; Google Search says it ignores the file; one official Google Gemini skill consumes it for developer-doc navigation; Ahrefs observed that 97% of about 38,000 valid index files in its May 2026 sample got no requests; the KDD 2024 and newer ACL/SIGIR 2026 GEO studies mostly hold retrieval/candidates fixed. The safe conclusion is conditional post-retrieval influence, not a universal quote/statistics/formatting recipe.
- **#4 MCP server.** Fast-moving: current spec **2026-07-28** (big shift to a *stateless* request/response core); primitives = **tools** (model-controlled) / **resources** (host-controlled) / **prompts** (user-controlled); transports = stdio (local) + Streamable HTTP (remote), **SSE deprecated**; official **registry.modelcontextprotocol.io** (preview). Tutorials are *crowded but shallow* — own tool-surface design, the two-path error model, and **security** (command-injection CVEs are the real-world failure). Pin SDK versions at publish time **[fast-moving]**.
- **#5 Code reconnaissance.** Your "you don't need codemap" stance has heavyweight backing: **Boris Cherny (Claude Code)** says agentic search beat their RAG index (simpler, no staleness/privacy issues); **Cursor** bets the other way (Merkle-tree embeddings). Position ghx honestly against **repomix (~28k★)**, **gitingest (~14k★)**, and **aider's PageRank repo-map** — it's a live, well-populated debate, ideal for a strong-opinion how-to.

## Cross-cutting themes (distilled)

- **Spikes buy links, not traffic.** A front-page HN hit ≈ ~15k uniques in a day that decays in ~72h — the lasting residue is the **~150+ backlinks**. So treat essays as *link-acquisition*, evergreen as *traffic-compounding*. **Why:** it reframes your OSS Radar/essays as the engine that feeds the how-tos' SEO.
- **Evergreen compounds; new domains are slow.** ~10% of posts can drive ~38% of traffic over time (HubSpot, **[directional]**); but only ~5.7% of pages rank top-10 within a year and top pages average 2–3+ yrs old (Ahrefs). **Why:** set expectations — this is a 6–18mo bet, run in parallel with spikes, not instead.
- **Owned > rented.** Organic social reach fell ~16%→~1% over a decade; >30% dependence on any one platform is fragility. **Why:** every how-to should convert to a "Dispatch" subscriber — the compounding asset you fully control.
- **The MCP + context-engineering moment is now.** Both are rising and under-served by *quality* content. **Why:** #4 and #1/#5 have the best demand-vs-supply ratio today; consider front-loading them alongside #3.

## Cross-references (with rationale)

**Your footprint (proof to cite / assets to repurpose)**
- [github.com/gkoreli/backlog-mcp](https://github.com/gkoreli/backlog-mcp) — your best-validated repo (Glama "Quality A"); the shipped proof behind idea #4.
- [glama.ai/mcp/servers/@gkoreli/backlog-mcp](https://glama.ai/mcp/servers/@gkoreli/backlog-mcp) — your one real third-party citation; a backlink + credibility anchor for the MCP post.
- [github.com/gkoreli/ghx](https://github.com/gkoreli/ghx) — 26 ADRs + eval methodology = the substance for ideas #1 and #5 (cite the eval numbers, not the star count).
- [registry.npmjs.org/@nisli/core](https://registry.npmjs.org/@nisli%2Fcore) — the generator behind the blog; context for any "built my own stack" post.

**llms.txt / GEO (idea #3)**
- [llmstxt.org](https://llmstxt.org/) — the primary spec; establishes "proposal, not standard" and the format.
- [Google's AI-search guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) — explicit first-party statement that Google Search ignores `llms.txt` and relies on ordinary Search eligibility/ranking systems.
- [Pinned Google Gemini skill](https://github.com/google-gemini/gemini-skills/blob/b40dd8d9c771ba6e84c0ff6502875e3f42b4ec14/skills/gemini-live-api-dev/SKILL.md#L448-L474) — concrete, bounded consumption by a maintained coding-agent workflow.
- [Ahrefs 137K-domain study](https://ahrefs.com/blog/llmstxt-study/) — strongest observed index-request evidence, with its technical-customer sample and fetch≠use limits.
- [arxiv.org/abs/2311.09735](https://arxiv.org/abs/2311.09735) — KDD 2024 GEO paper; inspect the supplied-source and Perplexity-upload boundaries before using the headline result.
- [FeatGEO, ACL 2026](https://aclanthology.org/2026.acl-long.929/), [MAGEO, ACL Findings 2026](https://aclanthology.org/2026.findings-acl.2149/), and [Competitive GEO, SIGIR 2026](https://arxiv.org/abs/2605.25517) — newer controlled evidence: content effects are real after candidate selection, generic formatting heuristics are unstable, and relevance/position are stronger.

**Cloudflare Workers analytics (idea #2)**
- [github.com/benvinegar/counterscale](https://github.com/benvinegar/counterscale) — the competitor to differentiate against; note it uses Analytics Engine, not D1.
- [developers.cloudflare.com/d1/platform/pricing](https://developers.cloudflare.com/d1/platform/pricing/) — the primary source for D1 write limits your post must address.
- [littlebearapps.com/blog/d1-billing-disaster…](https://littlebearapps.com/blog/d1-billing-disaster-circuit-breakers/) — the no-billing-cap horror story that makes the post genuinely useful (not just another clone).
- [developers.cloudflare.com/analytics/analytics-engine](https://developers.cloudflare.com/analytics/analytics-engine/) — the AE capabilities you weigh D1 against; grounds the decision section.

**MCP (idea #4)**
- [blog.modelcontextprotocol.io/posts/2026-07-28](https://blog.modelcontextprotocol.io/posts/2026-07-28/) — authoritative current-spec changelog (stateless core, deprecations); the freshness anchor.
- [modelcontextprotocol.io/specification/2025-03-26/basic/transports](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports) — canonical transport reference (stdio vs Streamable HTTP; SSE deprecated).
- [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io) — official registry (preview); where a published server gets discovered.

**Context engineering / code recon (ideas #1, #5)**
- [anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — the quotable "smallest high-signal token set" doctrine for idea #1.
- [simonwillison.net/2025/jun/27/context-engineering](https://simonwillison.net/2025/jun/27/context-engineering/) — clean attribution of the term's popularizers; use it, don't over-claim a coiner.
- [x.com/bcherny/status/2017824286489383315](https://x.com/bcherny/status/2017824286489383315) — Claude Code's "agentic search beat RAG" — the heavyweight backing for "you don't need codemap."
- [github.com/yamadashy/repomix](https://github.com/yamadashy/repomix) — the ~28k★ incumbent to position ghx against honestly.

**Blog growth thesis (point #6 itself)**
- [harrisonbroadbent.com/blog/hacker-news-traffic-spike-anatomy](https://harrisonbroadbent.com/blog/hacker-news-traffic-spike-anatomy/) — first-party proof that spikes decay fast but leave backlinks.
- [ahrefs.com/blog/how-long-does-it-take-to-rank-in-google…](https://ahrefs.com/blog/how-long-does-it-take-to-rank-in-google-and-how-old-are-top-ranking-pages/) — large-scale data setting realistic 6–18mo expectations.
- [blog.hubspot.com/marketing/hubspot-blog-compounding-posts](https://blog.hubspot.com/marketing/hubspot-blog-compounding-posts) — origin of the compounding-post thesis **[directional; marketing-blog data]**.

## Confidence ledger
- **Verified (primary):** llms.txt v2 proposal; Google's Search verdict; pinned Gemini skill behavior; 2024–2026 GEO study designs; provider crawler purposes; MCP spec dates/primitives/transports; D1 pricing + AE retention; Counterscale's stack; repo star/fork/commit counts via GitHub API; context-engineering attributions.
- **Estimate / directional:** all SEO-competition and search-volume judgments (no keyword tool was run); HubSpot compounding stats; "rising demand" for MCP (from download/star growth, not Trends).
- **Contested — do not hardcode:** GEO per-method percentages; who "coined" context engineering; exact MCP SDK semver (pull live at publish).
- **Gaps:** X/Twitter follower count; independent verification of ghx's 92% token-reduction claim; precise backlink count (absence of HN/Reddit hits is suggestive, not proof of zero).

---

# Part III — Selected Experiment: llms.txt and GEO

**Selected:** 2026-08-24

Idea #3 is the first evergreen experiment. The reason changed during editorial review. We are not choosing it because the original ranking called it the best GEO flywheel. We are choosing it because the blog already shipped the full stack and the investigation can change what we believe.

The working article began as a research synthesis with a first-person field investigation. After the first full-draft reviews and the explicit acquisition requirement, it became an engineering decision guide backed by that investigation:

> Goga built a complete AI-readable layer for a blog that still has almost no recurring audience. He now has to find out whether he built an access path for real agents, a speculative search ritual, or both — and whether his own analytics can even tell the difference.

The full, dated working artifact lives in [`packages/blog/drafts/research/llms-txt-geo/00-research-scratchpad.md`](../../packages/blog/drafts/research/llms-txt-geo/00-research-scratchpad.md). It contains:

- Goga's golden data and protected tensions;
- the shipped-system and live-endpoint audit;
- the discovery → retrieval → consumption distinction;
- a claim table with evidence states;
- competing theories and falsifiers;
- a close read of the GEO paper's actual experiment;
- provider guidance from Google, OpenAI, Anthropic, and Perplexity;
- distilled insights and claims to avoid;
- candidate article sections;
- cross-references with a rationale for every source;
- open experiments and next research actions.

The current article draft is [`packages/blog/drafts/019-does-llms-txt-work.md`](../../packages/blog/drafts/019-does-llms-txt-work.md). The independent fact, editorial, technical-reader, and search-landscape reviews are preserved in the research folder rather than collapsed into the draft.

## Findings that already changed the article

1. **The public `ai_fetches` count does not measure normal crawler requests.** The blog records a D1 row only after an HTML page runs a client-side script and posts to `/api/event`. Direct requests for `llms.txt`, `llms-full.txt`, or `.md` endpoints are invisible to it.
2. **The article must separate discovery, retrieval, and use after retrieval.** The `llms.txt` proposal mainly helps an agent navigate a known site. GEO research tests how supplied sources influence an answer. AI-search inclusion begins earlier.
3. **The GEO paper does not prove a live-web citation-rate lift.** Its main benchmark starts with Google's top five results. Its Perplexity test uploads source files and forces answers from them.
4. **The current blog follows the older proposal.** llms.txt v2 now recommends `alternate` and `describedby` link relations; the site exposes neither.
5. **The likely verdict is bounded, not dismissive.** An official Google Gemini skill demonstrates the developer-doc navigation use case. Current evidence still does not support treating publication of the file as an organic AI-search ranking or citation lever.
6. **The first draft did not satisfy the evergreen doorway.** It delayed the direct answer and omitted the file example, implementation path, delivery checks, site-type decision, and recurring reader questions. The second draft exposed those; the third adds the missing GEO complement without turning the article into a generic marketing encyclopedia.
7. **The benchmark is drafted, not registered.** Its questions, final conditions, thresholds, site snapshot, and author review still need to be frozen before any run. The article must preserve that incompleteness.

This section is a pointer and decision log. Continue research in the scratchpad so this broader content-mix document does not become the article's raw source ledger.
