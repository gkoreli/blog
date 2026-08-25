# llms.txt and GEO — Green-Team Synthesis

**Status:** Working constructive synthesis; client-evidence fan-out pending  
**Started:** 2026-08-25  
**Companion:** [`04-thesis-red-team.md`](./04-thesis-red-team.md)

## Why green-team this

The red-team asks which claims fail. The green-team asks what could work, what the shipped system already enables, and how we would recognize an opportunity early without returning to hype.

The goal is not a balanced article where every criticism receives a polite upside. It is an adaptive decision: keep cheap useful options, invest when a client or task supplies evidence, and change the verdict when the world changes.

The product green-team supplies the clearest category: the shipped stack is an **agent-access adapter and experiment surface**, not an audience-acquisition system.

## Constructive working position

> `llms.txt` does not need to create search rankings to earn a bounded place in the stack. A generated index and canonical page Markdown already form a low-cost agent-navigation surface used by several maintained skills and tools. The opportunity is to measure which part helps, make it discoverable to willing clients, and publish the evidence instead of selling the possibility as traffic.

This position is stronger than “keep it because it is free.” It assigns a real job: **known-site navigation and selective consumption by agents**. It also refuses to borrow an unproven job: organic source selection by AI search.

## The opportunity may arrive from a different direction

The original ADR imagined search-like AI agents discovering the root file, consuming posts, and appearing in the analytics dashboard. Current evidence weakens that loop.

A more plausible path is bottom-up:

1. documentation providers publish stable Markdown alternatives;
2. coding-agent skills and clients learn to follow an advertised index;
3. page-level link relations remove the need to guess filenames;
4. task traces show lower navigation or extraction cost;
5. broader clients adopt the convention if that benefit repeats.

In this theory, `llms.txt` does not become a ranking signal. It becomes one small interoperability affordance in agent-facing site UX. Search-provider adoption would be a separate future.

The strongest near-term beachhead may not be this personal blog. It may be developer documentation for `@nisli/core`, ghx, backlog-mcp, or AgentPort, where a coding agent starts with a known domain and a concrete technical task. The blog still gives us the mixed-format corpus and observability needed to test the interface before recommending it elsewhere.

## Green assets already shipped

| Shipped part or signal | Constructive value already available | Current missing link |
|---|---|---|
| Auto-generated `/llms.txt` | Cheap curated map that stays synchronized with posts | Few clients are known to discover it automatically |
| Per-page `.md` endpoints | Clean canonical content for an agent that receives or discovers the URL | Pages do not advertise the alternative through v2 `rel="alternate"` |
| `/llms-full.txt` | One-request cross-post context for large-context or offline tasks | It is 375 KB, no controlled task shows that it beats targeted retrieval, and v2 no longer centers the dump |
| `/posts.json` | Stable structured catalog that could support tools beyond LLM prompting | No current client contract or advertised relation points to it |
| Static semantic HTML | Strong universal fallback for humans, search, and agents | Agent extraction cost versus Markdown has not been measured here |
| Cloudflare edge aggregates | Immediate visibility into static requests with no deploy | Identity is claimed by user agent; grouping does not prove use or follow-on behavior |
| Build-time generation | Almost no marginal publishing cost and low staleness risk | Review/security rules for instruction-shaped guidance remain implicit |
| Maintained client workflows | Google and Prismatic use index → targeted Markdown; LangChain `mcpdoc` turns configured indexes into tools; tldraw and Streamlit give full dumps narrow fallback jobs | Use remains explicitly configured; prevalence and cross-client task benefit remain unknown |
| Markdown content negotiation | Three tested coding-agent fetchers asked for Markdown; Cloudflare and Vercel can serve it from the canonical URL | Current-version coverage and end-to-end task benefit need retesting |

## Adaptive investment ladder

### Level 0 — Preserve the option

Keep generating the concise index and page Markdown from the same source content. Version-control both. Treat the file as public, untrusted site content. Spend no recurring editorial time chasing keyword-like GEO tactics.

**Why now:** marginal generation cost is near zero and one concrete client pattern exists.

**Exit condition:** generation becomes stale, misleading, insecure, or materially complicates publishing.

### Level 1 — Finish the current convention

After the untouched request baseline, add v2 page relations:

- `rel="alternate" type="text/markdown"` for the page's Markdown form;
- `rel="describedby"` for the applicable index;
- equivalent `Link` headers only if the static deployment can add them without disproportionate routing work.

This does not assume visibility lift. It makes the existing artifacts discoverable to clients that implement the proposal instead of requiring filename guesses.

**Positive evidence:** a controlled client follows the relation correctly or edge data shows new relation-driven navigation.

**Stop condition:** header support requires routing every page or weakens the simple static architecture. HTML link elements may be enough for the experiment.

### Level 2 — Observe the right event

Complete a frozen 30-day edge observation window. Keep search crawlers, training crawlers, user-directed fetchers, ordinary browsers, and generic command-line clients separate.

Use selective Worker-first routing plus a separate D1 resource-request table only if aggregate evidence becomes worth resolving—for example:

- unexplained target traffic averages at least one request per day across the clean month;
- the same material client appears at least three times and exact path/status evidence would change a decision;
- a pre-registered intervention explicitly requires request-level evidence.

These are research thresholds, not industry standards. Record them before observing the window.

### Level 3 — Prove task value

Run the pre-registered HTML versus index+Markdown versus full-dump benchmark.

Increase investment when index+Markdown:

- preserves factual and qualification accuracy;
- does not increase unsupported claims;
- reduces median fetched bytes or input tokens by at least 20%;
- repeats across at least two model or agent implementations.

Treat the full dump as a separate product. Retain or promote it only if it materially improves cross-post synthesis or avoids enough navigation to justify its payload.

### Level 4 — Build for demonstrated clients

If Levels 1–3 show real use, contribute where interoperability is missing:

- a tiny reference client or agent skill that honors `describedby` and `alternate`;
- an open benchmark fixture for known-site navigation;
- a purpose-aware, privacy-preserving request classifier;
- an issue or proposal backed by task traces rather than adoption counts.

Do not build a new standard, registry, crawler directory, or analytics product before a repeated client task demands it.

## What the client green-team established

### The live blog is consumable through an existing generic client

LangChain's `mcpdoc` exposes configured `llms.txt` sources through `list_doc_sources` and `fetch_docs`. The green-team instantiated version `0.0.10` with gkoreli.com's index, fetched the live index and a linked post Markdown file, and confirmed that an off-origin request was refused.

That is stronger than “the file could be useful.” A reader can configure an existing cross-host client to use the blog today. It is still user- or project-directed adoption, not publisher-created demand. The reproduction also found a maintenance defect: the current package needs `mcp<2` because its declared range admits an incompatible MCP 2.x release.

### Different corpus shapes justify different artifacts

- Google's Gemini and Prismatic skills use a small index followed by one targeted page.
- tldraw's migration skill downloads a bounded full dump, caches it for 30 days, and greps it lazily.
- Streamlit keeps its hosted dump as a fallback beneath preferred package-local skills.
- Prismatic rejects its own oversized full dump and tests index → `.md` behavior instead.

The green conclusion is not that one format won. Each artifact needs a client and corpus-shaped job.

### Page Markdown has the broadest positive evidence

A February 2026 first-hand protocol test found Claude Code, Cursor, and OpenCode preferring Markdown through the HTTP `Accept` header; Codex, Gemini CLI, GitHub Copilot, and Windsurf did not in that frozen snapshot. Cloudflare and Vercel now provide first-party serving mechanisms for negotiated Markdown.

The green-team reproduced a representation-size difference on this blog:

| Representation | `cl100k_base` tokens | Difference |
|---|---:|---:|
| HTML article response | 7,683 | baseline |
| Per-page Markdown | 2,476 | 67.8% fewer |

This measures the fetched representation, not total agent cost or answer quality. Navigation, retries, missing content, and final verification may erase part of the saving. The task benchmark remains necessary.

### V2 link relations still have no consuming client

The client audit found no mainstream implementation that follows `rel="alternate" type="text/markdown"` or `rel="describedby"` for this convention. They remain a coherent proposed bridge, not an observed interoperability path.

That narrows Level 1: add the relations only as cheap, validated, reversible metadata after baseline; test a resolver-disabled versus resolver-enabled client before calling them useful infrastructure.

## Current decision by artifact

| Artifact | Green-team decision now | Evidence gate for a larger job |
|---|---|---|
| Semantic HTML | Keep as canonical source and benchmark control | None; this survives every agent-specific null result |
| Small `llms.txt` index | Keep while automatic, synchronized, validated, and descriptive | Repeated client use or benchmark navigation benefit |
| Page-level Markdown | Strongest candidate for durable agent utility; add discoverability metadata after baseline and test it | Quality-preserving task efficiency across more than one agent/client |
| `llms-full.txt` | Keep only through the benchmark; place on probation | Cross-post synthesis gain that offsets its 375 KB payload, or an observed real consumer |
| `posts.json` | Preserve cheap option; make no public compatibility promise | One actual integration requests a stable contract |
| Public `ai_fetches` | Rename or explain; it is a browser-beacon event count | Never promote it to crawler evidence without original-request observation |
| Edge aggregates | Default observation surface while traffic is sparse | Move to exact D1 only when exactness changes a declared decision |

The same logic applies outside this blog: developer documentation can justify more investment than a personal essay site because the known-domain task and client are clearer.

## What should raise confidence

| New evidence | Update |
|---|---|
| Another maintained official client consumes the index or v2 relations | Raise confidence in cross-client navigation; inspect whether implementations agree |
| The benchmark shows quality-preserving efficiency across two clients | Promote page Markdown/index as tested agent UX for known-site tasks |
| Edge traces show a named client fetching the index and following page Markdown | Upgrade “published option” to observed production workflow; still do not infer citation |
| A search provider documents organic use of the convention | Reopen the retrieval/selection verdict for that provider only |
| A controlled live-web study isolates publication of the file and finds retrieval lift | Reassess the organic visibility thesis and reproduce if feasible |
| Bing or another provider exposes citations to this blog | Compare citation telemetry with edge fetches and query intent; do not collapse them |

The first row is now partly satisfied for configured index consumption: multiple maintained skills and `mcpdoc` use the pattern. It remains unsatisfied for v2 link-relation discovery.

## What should lower confidence or investment

| Result | Update |
|---|---|
| Thirty clean days show no meaningful target requests | Keep generated artifacts, stop instrumentation work, recheck quarterly |
| HTML matches or beats Markdown on controlled tasks | Keep HTML as the primary agent surface; retain Markdown only if portability still justifies its near-zero cost |
| The full dump adds cost without synthesis gains | Stop advertising it and consider removing it from the public contract |
| Clients interpret guidance as privileged instructions | Reduce the file to descriptive navigation and strengthen trust handling |
| V2 relations require runtime complexity disproportionate to use | Keep the root index and predictable `.md` URLs; do not contort the static site |

## Unique knowledge this blog can create

The wider debate mostly measures publication counts, request counts, or citation outputs. This blog can connect layers without pretending they are one metric:

1. edge request evidence for the index and page Markdown;
2. exact client-purpose classification;
3. controlled task outcomes across HTML, targeted Markdown, and a full dump;
4. provider citation telemetry where available;
5. human referral and readership as a separate outcome.

Even a null result would be useful because the experiment begins from a deployed system, declares its thresholds, and publishes what each metric cannot prove.

Additional first-party work worth preserving:

- a map-to-page navigation trace that shows which sections and summaries agents follow or miss;
- a full-dump growth curve that records when one-shot context stops paying for itself;
- a parity audit across HTML, source Markdown, converted TypeScript posts, series trails, code blocks, and prompt links;
- a v2 relation observation with a frozen before/after window and no search-lift claim;
- a purpose-aware measurement field note other publishers can use to audit their “AI traffic” dashboards.

## Constructive article movement

The article should not move from hope to debunking. It should move from a broad causal model to a smaller working system:

1. I wanted agents to discover a blog nobody read.
2. I built several different artifacts and called the loop complete.
3. The metric could not observe the relevant requests.
4. The external evidence split organic search from known-site agent use.
5. A real client proved the smaller use case exists.
6. The green-team converted that smaller case into a testable investment ladder.
7. The ending remains open: the convention stays, the claims shrink, and the evidence can make them grow again.

That movement stays genuine because adaptation is the result. The author neither performs cynicism nor returns to optimism.

### Governing question

> If `llms.txt` cannot create the reason an agent enters my site, what useful job can I give it today—and what evidence would earn it a larger job tomorrow?

### Leading title architecture

- **H1:** `I Gave llms.txt a Smaller Job`
- **seoTitle:** `llms.txt and GEO: What Works and How to Test It`
- **Description:** `I audited my blog's llms.txt, Markdown endpoints, AI crawler analytics, and GEO evidence—then gave each part a smaller, testable job.`

The title expresses adaptation without turning skepticism into the author's brand. A stronger-confession alternative is `I Built llms.txt for the Wrong Job`, but it risks making the original implementation sound foolish instead of reasonable under uncertainty.

## Collaboration without engagement farming

Ask for evidence that can modify a named artifact:

- client/version, initial entry point, requested paths, task, and trace from a maintained agent;
- anonymized request/follow-on counts over a declared window from documentation publishers;
- a retrieval-inclusive study or an isolated test of index versus page Markdown;
- raw results from the frozen benchmark protocol, including null results;
- first-party provider documentation when behavior changes.

Do not ask readers to vote on whether GEO is real, submit one-off screenshots, or “join the conversation.” The success signal is one contribution that changes the client map, decision table, benchmark result, or provider matrix.

## Stable reasoning and volatile evidence

Keep the stage distinctions, metric boundaries, client/task dependence, and cost-ceiling rule stable in the article body.

Keep provider identifiers, proposal version, named clients, file sizes, request observations, and benchmark results in dated tables or glossary entries. A provider or client change can then update the evidence without rewriting the whole personal argument.

## Pending fan-out merge

- [x] Merge concrete client/adoption evidence from `08a`.
- [x] Merge local product-opportunity map and thresholds from `08b`.
- [x] Merge editorial opportunity and update triggers from `08c`.
- [x] Reconcile contradictions with the red-team rather than averaging them.
- [ ] Update the main scratchpad's thesis and article shape.
- [ ] Decide whether the stale `shareable-engineering` guidance should be corrected from this evidence.
