# AGENTS.md — Blog Project Context

## Vision

A personal engineering blog at `gkoreli.com` by Goga Koreli. Built with `@nisli/core` (my own zero-dependency reactive web component framework), deployed to Cloudflare Workers with static assets.

The blog fills a gap: there's plenty of AI hype content but very little from engineers who actually build with agents daily — the real decisions, failures, trade-offs, and workflows. This is a builder's journal, not a tutorial site.

## Why We Write

Writing is part of the work, not a report produced after the work. The publication exists to:

- help Goga grow by forcing experience, judgment, ambition, and uncertainty into language;
- help readers grow alongside him by sharing lessons, failures, methods, decisions, and live questions;
- build in public by inviting a third-person eye into both the projects and the person building them;
- make projects, architecture, methods, tenets, bets, plans, vision, and attempts to change the world visible—not only pain and ambiguity.

Time is editorial material, not a style rule:

- **Past:** reflect, analyze, learn, name growth, and share earned lessons.
- **Present:** expose what is unresolved—conditioning, ambiguity, calculated guesses, judgment calls, bets, tension, and pain.
- **Future:** declare intention, possibility, vision, and what the work is trying to change.

An article may live in one time layer or braid all three. Choose by context. Open-wound writing is permission to publish before hindsight closes the experience, not a vulnerability quota. Retrospectives, guides, decision records, build journals, investigations, project visions, and exposed essays are all valid when their form tells the truth about why the piece exists now.

## Problem Space

Agentic engineering is the most interesting frontier in software right now, but the content landscape is noisy in the wrong ways:

- **Hype camp**: "AI will replace all developers", "I built a SaaS in 10 minutes" — no mention of the 10 hours debugging after
- **Skeptic camp**: "AI code is garbage, real engineers write their own" — dismissing the shift entirely
- **Vibe coding camp**: ship fast, quality optional, dopamine-driven — graveyard of average products

What's actually missing: honest, grounded writing about what it means to build with agents daily. The real principles — context engineering, steering agents through hard problems, knowing when to stop the agent from pivoting to easy solutions. The depth problem: agents default to naive/average solutions, and someone without engineering depth will pivot with them.

This blog exists in that gap. Builder's journal, not a tutorial site. AI-assisted collaborative posts include the raw prompts that generated them — full transparency that this is AI-assisted writing with human substance. Exposed essays and OSS Radar issues are explicit exceptions for different reasons: the former are written entirely by the author's hands; the latter are research-driven analysis.

## Writing Process

Blog posts are AI-assisted with human substance. The workflow:

1. **Author provides golden data** — raw prompts with perspective, experience, specific problems, lessons learned
2. **Agent identifies the living center and form** — applies `shape-article` before structure or polish. For exposed essays, the agent is editor and gatekeeper and never drafts the prose. For other forms, it distills and structures with the governing skill.
3. **Iterative refinement** — author reviews, pushes back on prose, requests structural changes
4. **Fact-check pass** — verify every date, attribution, quote, external link, GitHub repo, and technical claim. Web search each source. Post 004 caught 7 errors in one pass: wrong dates, misattributed quotes, unverifiable projects, a flawed technical premise. This step is mandatory, not optional.
5. **AI-assisted collaborative posts ship with raw prompts** — readers can see the human thinking behind the AI output. **Exceptions:** exposed essays have no prompts because the author writes every word; OSS Radar issues have no prompts because they are research-driven analysis.

Prompt files preserve exact human prompts in chronological order when they materially shape the article, research scope, claim handling, metadata, provenance, or publication decision. Do not include later repository or skill-maintenance discussion that changes none of the published artifacts. This boundary keeps the prompt page a provenance record for the post instead of an unbounded project transcript.

### Opening and Section Discipline (owner tenet, 2026-09-01)

Every article opens with why it matters, then breaks that down, and only then explains the background. Chronology is a mold, not a rule. The first and last paragraph of every section must carry the section's point on their own, so a reader who reads only those still leaves with the whole argument, if not the depth.

Concretely:

1. **First paragraph: the significance.** What was achieved or released, why it matters, why the reader is here, what they will learn. Catchy is allowed; every catchy statement in it must be explained later in the body.
2. **Then bullets** that break the significance down into the article's main findings or claims, each one a promise the body keeps.
3. **Then background**, mechanism, and history, each leading back to and paying off the first paragraph. Twist the order of facts to keep the reader; never twist the facts.
4. **Every section:** first paragraph states the point in plain language; last paragraph states the takeaway. Deep technical material lives between them. Jargon goes where it matters most, not in the opening.
5. **Two registers per article.** Some sections are for every reader; some are for the person who will run the thing. Say which is which in one sentence when the register changes.

The owner's words, recorded verbatim on 2026-09-01 while reviewing OSS Radar #06:

> You should start with the significant achievements, reasons, why this article or the release matters at all, why am I reading this article, what am I going to learn? Then some bullet points to further break it down, and only then in a next section or paragraph you can start explaining the background and all of that need to lead to and connect to the first paragraph, all the main reasons and catchy statements need to get explained afterall. Imagine like a Christopher Nolan movie or martin scorsese movie, do you think they just start the movie with how it all started and just follow the chronological order, because they have to? No, they start with something very interesting and they use chronology and facts as like a flexible mold, they can twist them as they need, because its all about catching and keeping the reader and viewer, then explaining facts, like even if you only read first and last paragraphs of each section, that should give you the full understanding of the article without the deep technological understanding, morale or rationale, which is still good enough of a takeaway. Think from this perspective when writing articles.

Earlier the same day: "the initial section needs to be catchy, why is this a big deal, in human understandable ways, don't use lots of jargon right away, you can use jargon wherever it matters the most but there are sections that needs to be human friendly, easy to follow and comprehend, and there can be sections that are highly technical." And: "the first paragraph is the highest value section/space, the real estate value is the highest at the beginning."

This tenet governs all forms. `shape-article` still chooses the living center and the ending; `personal-essays` still wins on voice for exposed essays, where the opening may be a scene or a wound rather than a summary, but even there the first paragraph must be the reason to keep reading. See also `NORTH_STAR.md` "What Guides Readership".

### No Mannered Prose (owner rule, 2026-09-02)

Recorded verbatim; it binds every article and every skill that touches prose (`polish-prose` carries the working form):

> Mannered prose substitutes metaphor and flourish for direct statement. Instead of "a parameter worth varying," the mannered writer produces "a dial worth turning." Instead of "this point still matters," they write "this point earns its keep." The phrases exist to display the writer, not to convey the idea, and readers can tell. That is why mannered prose irritates: it makes the reader work harder so the writer can perform. It is also imprecise. Metaphors drag in connotations the writer did not choose and cannot control. The fix is to say what you mean. When a literal phrase is available, use it.

### Research Footprint Accounting

Research-heavy collaborative posts may publish a `researchFootprint` beside their raw prompts. This is provenance, not a quality badge. The compact article header may show the measured token total; the transparency page must show human prompts, sessions, committed artifacts, wall-clock window, token breakdown, methodology, limitations, and the public research directory.

Use `packages/blog/scripts/research-footprint.ts` for Codex cumulative logs and `packages/blog/scripts/omp-research-footprint.ts` for OMP per-response logs. Never hand-count sessions or mix cumulative and per-response usage models.

Deterministic rule:

1. Identify the root Codex thread ID for the article session.
2. Scan the configured Codex session-log root and parse every `session_meta` record.
3. Starting with the root thread, compute the **recursive descendant closure** through `source.subagent.thread_spawn.parent_thread_id`. Include children, grandchildren, and deeper descendants. Do not stop at direct fan-out.
4. For each included session, read every valid `event_msg` whose payload type is `token_count` and use only cumulative `info.total_token_usage` objects. Partition the records into monotonic epochs whenever `total_tokens` decreases, which can happen after compaction or a counter reset. Select the final cumulative object from each epoch. Never sum `last_token_usage` records or every cumulative record.
5. Verify every selected epoch: `total_tokens = input_tokens + output_tokens`; `cached_input_tokens <= input_tokens`; `reasoning_output_tokens <= output_tokens`. Record each reset and epoch boundary; a no-reset session has one epoch and remains equivalent to selecting its final cumulative record.
6. Sum the selected epoch-end cumulative fields within each session, then sum each session once across the included tree. Cached input is a subset of input, and reasoning output is a subset of output; neither is added again to total. Derive non-cached input as `input - cached input`.
7. Count prompts with the same `---` delimiter rule as `parsePrompts()`. Report both Markdown files present in the declared research directory and files present in `HEAD`. Copy the committed count into public frontmatter only when both counts match; otherwise the provenance set is not yet releasable.
8. Define `startedAt` from the root session metadata, `measuredAt` as the latest selected epoch-end event, and wall-clock minutes as the ceiling of that interval. Wall-clock time is not human hands-on time.
9. Freeze immediately before the release commit. The script emits every included session ID, parent ID, agent path, selected epoch-end lines and values, reset count, and SHA-256 commitments to the log prefixes through those records. Save that manifest in the research artifact before copying totals into frontmatter.
10. If any work ran outside the root thread tree—for example an independent `codex exec` process or an automatic guardian session whose metadata has no parent-thread link—it is excluded unless its session ID is explicitly added to a future manifest mechanism. Disclose every such inclusion or known exclusion. Never silently guess ownership by timestamp or working directory.

OMP session rule:

1. Pass the exact root `.jsonl` log. Include that root plus every child `.jsonl` in its same-named agent directory; do not infer siblings from timestamp or working directory. A separate root session is excluded.
2. Parse each assistant message with an OMP `usage` object exactly once. OMP input excludes cached/cache-write tokens, so normalize public input as `input + cacheRead + cacheWrite`; cached input remains a subset of public input.
3. Verify each response: `totalTokens = input + cacheRead + cacheWrite + output`; `reasoningTokens <= output`. Sum response usage within each session, then sum each included session once.
4. Read `startedAt`, session ID, and cwd from the first `session` record. Use the latest included assistant usage timestamp as `measuredAt`.
5. Count prompts with the normal `---` delimiter. Count artifacts from an explicit manifest of repository-relative paths, and require every listed path to exist in `HEAD` before copying the count to frontmatter.
6. Freeze immediately before the release commit. Record each root/child session ID, parent ID, agent name, response count, last usage line/time, normalized totals, and SHA-256 commitment to the private log prefix.

Example:

```bash
pnpm -C packages/blog exec tsx scripts/research-footprint.ts \
  --root-thread <root-thread-id> \
  --research-dir drafts/research/<article> \
  --prompts-file prompts/<slug>.prompts.md
```

```bash
pnpm -C packages/blog exec tsx scripts/omp-research-footprint.ts \
  --root-log <root-session.jsonl> \
  --research-dir drafts/research/<article> \
  --prompts-file prompts/<slug>.prompts.md \
  --artifacts-file drafts/research/<article>/artifacts.txt \
  --output drafts/research/<article>/research-footprint.json
```

Trust boundary: session logs contain private conversation and system context and are not committed. The public manifest and prefix hashes make the accounting reproducible by the author and commit to the exact private log prefixes used, but readers cannot independently reconstruct the token totals without those logs. Say this plainly; “auditable by the author with integrity commitments” is accurate, while “publicly verifiable” is not.

### Writing Skill (`.agents/skills/blog-writing/SKILL.md`)

Covers voice, structure, formatting balance, sourcing rules, glossary format, and quality checklist. Key principles:

- **Formatting balance** — prose for narrative/arguments, bullets for enumerable points, blockquotes (with literal `"` quotes) for strong opinion statements. Anti-pattern: walls of prose when bullets would be clearer. Anti-pattern: everything as bullets losing narrative voice.
- **Sourcing rules** — original author first (not Wikipedia or aggregators), no paywalled sources, authoritative builder blogs and company engineering blogs preferred. Glossary uses table format with dates on every source.
- **What makes a great article** — states a problem clearly, introduces novel ideas, debunks myths, showcases best practices AND anti-patterns, highlights gotchas, shares personal growth, is transparent.
- **Engineering lesson completeness** — a failure is not yet a lesson. Show what existed before, what broke, how the current implementation works, why that repair won, which tradeoff remains, the bounded tenet, and the future vision. Present tense includes today's architecture and rationale, not only today's pain. The sequence need not become rigid headings.

For an **evidence-led engineering investigation**, read `.agents/skills/blog-writing/references/evidence-led-engineering-investigations.md`. Use this form when the article begins with a system the author built or used, then tests a disputed claim through code inspection, reproduction, first-party observation, primary documentation, and outside research. It is not the OSS Radar form: the article's center is the author's system, failure, or decision rather than an open-source product verdict.

### Shape Article Skill (`.agents/skills/shape-article/SKILL.md`)

The editorial router for every article. It identifies the living center and governing form before any structural rule runs: exposed essay, inquiry, field note, engineering argument, evidence-led engineering investigation, or OSS Radar research synthesis. It protects unresolved experience, contradictions, status-risking passages, self-interruptions, and meaningful repetition. It requires movement without demanding resolution and adds context for humans and agents without flattening the article into a summary.

Run skills in this order:

1. `shape-article` — choose the form and protect what is alive
2. The governing form skill — `personal-essays`, `blog-writing`, or `oss-radar`
3. `article-discovery-positioning` — after shaping, reverse-engineer honest reader/search doorways, metadata, headings, links, and distribution where applicable
4. `shareable-engineering` — engineering trust and evidence-based share mechanics where applicable
5. `polish-prose` — sentence-level pass last

### Personal Essays Skill (`.agents/skills/personal-essays/SKILL.md`)

The full creative-writing canon for growth in public. Open-wound writing protects live truth from retrospective laundering, but it is permission rather than a quota. Past lessons, present tension, and future intent may coexist; retrospectives, guides, project visions, decision records, and exposed essays are all valid when context earns them. In the exposed register the agent is editor and gatekeeper, **never ghostwriter**: no drafted prose and no prompt file. Where it conflicts with another skill on voice or aliveness, `personal-essays` wins.

### Article Discovery Positioning Skill (`.agents/skills/article-discovery-positioning/SKILL.md`)

Runs only after the living center and governing form are fixed. Classifies the article as reader-growth, signature, or bridge without quotas; inventories the content; maps honest reader/search jobs; produces coherent H1/seoTitle/description/standfirst/heading/keyword/link packages; separates doorway optimization from distribution, link earning, and reader contact; and may return a narrow or no-op recommendation. It never rewrites the body around a keyword or overrides voice.

### Shareable Engineering Skill (`.agents/skills/shareable-engineering/SKILL.md`)

Evidence-based share/trust/discovery mechanics for engineering posts: seoTitle tuning (40–60 chars, handles first, declarative — Backlinko n=4M), agentic-search reality (the honesty mechanics ARE the AEO strategy per the GEO paper; llms.txt has ~zero real-world crawler adoption per Ahrefs 2026-05 — keep ours but never invest in it), and share triggers (armed/vindicated/seen). Argument and decision pieces need a falsifiable position; inquiry and field notes keep the live question. The skill also defines the hedging rule ("hedge the epistemics, never the position") and the 12-point pre-publish checklist. Every rule cites a verified source; audit date in its frontmatter. Runs at pre-publish; `personal-essays` wins all voice conflicts.

### Polish Prose Skill (`.agents/skills/polish-prose/SKILL.md`)

The final sentence-level pass for concise, direct, natural prose. It protects code, technical language, authorial voice, deliberate roughness, meaningful repetition, and unresolved thought. It never governs an article's structure or ending. In an exposed essay, it flags problems for the author instead of rewriting the prose.

### Editorial Learning Loop

After publishing a material engineering article:

1. Define a measurement window before reacting; do not churn the article from day-to-day noise.
2. Capture page-filtered search queries, reader replies, corrections, attributable referrals, source changes, and relevant implementer evidence in the article's research directory.
3. Decide explicitly between a content correction, discoverability change, distribution change, new experiment, or no action.
4. Update `lastModified` only when the served page changes materially under the metadata rules below.
5. Keep one-off lessons in the article artifact. Update a shared reference or skill when a failure recurs across articles or when one missing rule caused a costly, preventable error.
6. Prefer a focused reference inside the governing skill first. Create a standalone skill only after the workflow has repeated use and needs distinct automatic routing.

This loop improves the publication from reader and evidence contact, not from token volume or pageviews alone.

## Content Strategy

Build-in-public approach — document the journey with specifics over polish.

### Publication Roles: Reach and Identity

The publication needs useful external entry points and a recognizable mind behind them. Three article roles are first-class:

- **Reader-growth:** a cold reader can recognize a problem, mechanism, decision, or artifact that matters beyond the existing audience. Broad means a wider honest fit set, not generic subject matter.
- **Signature:** makes Goga's voice, thinking, identity, projects, bets, or vision legible. Its value is depth, recognition, and contact even when search fit is narrow.
- **Bridge:** a concrete problem carries the reader into Goga's judgment or vision, or a personal stake reveals a transferable engineering problem.

Roles are not quotas, quality rankings, or fixed forms. Shape the article first, then design the doorway. Reader-growth articles can use externally legible H1s; signature pieces may preserve literary titles and orient through description; bridge pieces may split a voice-bearing H1 from a concrete `seoTitle`. Internal links and series trails let reach and identity strengthen each other without asking every article to do both jobs. Since 2026-09-01 every H1 must name its subject in plain words first ("Titles Name the Subject"); voice lives in the second half of a title and in the body.

**Core topics:**
- `@nisli/core` — zero-dependency reactive web component framework
- `backlog-mcp` — MCP server for AI agent task management
- Agentic engineering — delegation, context engineering, design-first workflows
- Monorepo architecture, TypeScript tooling, open source maintenance

**Distribution:**
- Publish on `gkoreli.com` first (source of truth, canonical URL)
- Cross-post to dev.to
- Share on X with `#BuildInPublic`
- LinkedIn for milestone posts

## Content Format: Markdown + YAML Frontmatter + Web Components

Posts are `.md` files with YAML frontmatter. Interactive elements use native web components directly in markdown — no MDX.

For immersive/rich posts that need custom layout control, posts can also be `.ts` files in `posts/` that export `meta: PostMeta`, `article(): TemplateResult`, and optionally `preamble(): TemplateResult`. The build pipeline auto-discovers both formats. Use `.md` for standard prose posts, `.ts` when the post needs programmatic layout (custom components, topology diagrams, scroll-reveal sections). The `.ts` format uses `nisli-static` tagged template literals — same component model, just with full TypeScript control over structure.

**Post format (markdown — default):**
```markdown
---
title: "Why I built @nisli/core"
date: 2026-03-05
description: "A zero-dependency reactive web framework in 660 lines"
tags: [nisli, web-components, framework]
---

# Why I built @nisli/core

Regular markdown prose, code blocks, images, links...

And when you need interactivity, drop in a web component:

<nisli-counter initial="0"></nisli-counter>
```

### Why not MDX?

MDX compiles markdown into JSX — it fundamentally assumes a React/Preact runtime. `@nisli/core` is a vanilla web components framework using tagged template literals, not JSX. Using MDX here would require one of:

1. Writing a custom MDX compiler that outputs web component calls instead of JSX — significant effort for no gain
2. Adding React as a dependency just for MDX processing — defeats the zero-dep philosophy
3. Using MDX at build time and stripping the React runtime — fragile and complex

None of these make sense. The blog exists to prove `@nisli/core` works standalone.

### Why markdown + web components is better for us

- **No framework mismatch** — markdown parser passes through HTML tags, browser upgrades them into live web components via `customElements.define()`. This is the native web platform way.
- **Zero extra dependencies** — no MDX compiler, no JSX transform, no React runtime
- **Same interactive power** — any `@nisli/core` component can be embedded directly in markdown as a custom element
- **Portable content** — posts are valid markdown that renders anywhere (GitHub, dev.to, any markdown viewer). MDX only renders in MDX-aware toolchains.
- **Simpler build pipeline** — parse frontmatter, convert markdown to HTML, wrap in nisli/core shell. Done.

MDX solves a React-ecosystem problem. We're in the web components ecosystem. Different world, different tools.

## Best Practices (for agents working on this project)

### How SSG Works

```
posts/001-hello-world.md          ← you write markdown
        ↓
src/build.js (Node, build-time)   ← parses frontmatter, converts md → HTML (marked),
                                     highlights code (shiki), wraps in page shell
        ↓
dist/hello-world/index.html       ← complete HTML with all content baked in
        ↓
Cloudflare Workers serves static files  ← browser gets pre-built HTML instantly
        ↓
@nisli/core JS loads              ← upgrades any <nisli-*> tags into interactive components
```

The markdown never reaches the browser. Content is readable without JS (SEO, crawlers, AI agents). Nisli/core adds interactivity as progressive enhancement.

### Rules

- **No type assertions** — `as string`, `as any`, `as unknown` are banned. If types don't flow naturally, fix the source (add a Zod schema, narrow with type guards, or fix the upstream type). The only exception is `as const`.
- **Markdown-first** — posts live in `posts/` as `.md` files with YAML frontmatter
- **Build script** — `src/build.js` converts markdown to HTML using `@nisli/core` components
- **Keep it simple** — no CMS, no complex build chains. D1 is the only database (analytics). Markdown → HTML → deploy.
- **Dogfooding** — the blog itself proves `@nisli/core` works as a standalone npm dependency
- **Web components in posts** — for interactive elements, use `<nisli-*>` custom elements directly in markdown. No JSX, no MDX.
- **Git config** — this repo uses local git config (personal email, not the global Amazon config)
- **Auth** — pushes authenticate as `gkoreli` via PAT stored in macOS Keychain

## Anti-Patterns

- Don't over-engineer the blog infrastructure — the posts are the product, not the build system
- Don't add dependencies unless absolutely necessary — the framework is zero-dep, the blog should be minimal-dep
- Don't write generic tutorials — write from direct experience building real tools
- Don't polish endlessly before publishing — ship ugly, iterate
- Don't cross-post without canonical URLs pointing back to `gkoreli.com`

## Discoverability Without SEO Sludge

The world wide web problem: an article can be gold and completely invisible. Position 5.9 with 865 impressions and 0 clicks is not a content failure — it is a doorway failure. The essay voice stays intact; the signals that face cold searchers need to be honest and concrete.

### The Core Principle

> Keep the essay. Make the doorway less cryptic.

The fix is never "write for Google." It is: make the same article legible to someone who found it by accident. One grounding sentence, a title that carries search handles, a description that leads with names — not with the thesis.

### The Metadata Split

Different surfaces serve different audiences. Don't corrupt one to fix the other.

| Field | Audience | Rule |
|---|---|---|
| `<title>` (HTML) | Cold searcher in SERP | Carry concrete handles: tools, topic, context. Can differ from H1. |
| H1 / `og:title` | Reader who clicked, and the cold reader who sees it shared | Names the subject in plain words first (the tool, project, problem, or result); a voice-bearing phrase may follow, never replace it. See "Titles Name the Subject" below. |
| `meta description` | Cold searcher scanning results | Lead with tool names and concrete promise. Not the thesis. |
| JSON-LD `headline` | Google's structured data parser | Same as H1 — the real title. |
| JSON-LD `alternativeHeadline` | Semantic labeling | Explicit field on PostMeta. Set it directly; never derive by parsing `seoTitle`. |
| JSON-LD `keywords` | Semantic labeling | From `meta.tags`. Not SEO magic — just honest labeling. |
| Sitemap `<lastmod>` | Googlebot | `lastModified ?? date`. Update when the served page meaningfully changes: main content, title/description, structured data, canonical/internal links, or substantial corrections. Do not bump for pure styling/refactors. |
| JSON-LD `dateModified` | Structured data parsers | Same as `lastModified ?? date`. |
| RSS `<pubDate>` | Feed readers / subscribers | Publish date only. Never `lastModified`. Don't surface metadata edits as new posts. |
| Visible article date | Readers | Publish date only. Show updated date only for material changes (new section, corrected argument, major rewrite). Not for metadata/orientation fixes. |
| Orientation sentence | Reader who landed from a bad-fit query | One concrete sentence before the essay voice. Not SEO bait — reader grounding. |

### Titles Name the Subject (owner tenet, 2026-09-01)

Every title, in every section, names its subject in plain words a stranger could search for: the tool, project, person, problem, or result. `How I Built First-Party Analytics for a Personal Blog` is the model. `Same Hook Name, Different Tensor` is the failure: it names nothing a reader could look for, and it was chosen under the older "literary H1, concrete seoTitle" reading of the split above. That reading is retired. The split still exists for search snippets, but the H1 carries the handle first; a literary phrase may follow it, as the accent half of the title, never instead of it. The slug and the description name the subject too.

Why: this is not an established publication. Nobody arrives knowing the house style, and most readers meet a title on X, in a search result, or in a feed with no context. A title that needs the article to explain it costs the reader the article.

The owner's words, recorded verbatim on 2026-09-01:

> also look at the title of the /Users/goga/Documents/goga/blog/packages/blog/posts/020-first-party-analytics-for-a-personal-blog.md it is much more searchable and catchy and come-acrossable, than Same Hook Name, Different Tensor. What does this title even mean? It is very criptic, for what reason? Nobody will find this article, it doesn't even mention the interp-engine or anything like that, how will someone ever find this article at all? we are not an established publishing yet, hope you understand. Capture this as a rule somewhere, I feel like we have some kinda misleading rules or what? Why are we making this kinda mistakes over and over? We need to improve eitehr the skills, rules or tenets or something.

Checklist for any title: (1) a stranger can tell what it is about; (2) it contains the searchable name of the thing; (3) it would still make sense as a bare link on X; (4) first person is welcome when the author did the work ("How I…", "I tested…"). Exposed essays keep their voice, and their titles still pass (1) and (3).

### How to Apply `seoTitle`

Add it to `PostMeta` when the literary title does not carry enough search handles:

```ts
title: "You Don't Always Need Codemap",          // H1, og:title — voice intact
seoTitle: "You Don't Always Need Codemap — ghx, Repo Maps, and Code Search",  // <title> only
alternativeHeadline: "ghx, repo maps, repo packing, and agent code search",   // JSON-LD only
```

`seoTitle` replaces `— Goga Koreli` in `<title>` but never touches H1 or og:title. It is a supplement for search snippets, not a licence for a cryptic H1: the H1 itself must already name the subject (see "Titles Name the Subject").

### The Orientation Sentence

Before the essay voice, one concrete sentence that orients the reader who landed unexpectedly. It should describe:
- what the article covers (concrete tools/topics, not thesis)
- the framing (the moment/workflow/decision being analyzed)

Style: muted, left-border accent, `color: var(--color-text-muted)`. Reads as a field-note abstract, not a callout or disclaimer. Class: `.post-orient`.

**Good:** describes the moment and the cast of tools  
**Bad:** restates the thesis as a sentence ("Code context tools are not interchangeable.")

### Diagnosing CTR Problems

High impressions + position 5–8 + near-zero clicks = **SERP mismatch**, not automatically bad content. The mismatch may be query intent, title/snippet packaging, or the type of result searchers expect.

Diagnosis sequence:
1. Export page-filtered queries from Search Console for the specific page
2. Bucket queries by intent: docs/reference intent vs essay/opinion intent
3. If docs-intent queries dominate impressions, the article is ranking for the wrong audience
4. If good-fit queries have 0 clicks at position 3–8, the title/description is failing them

**Do not touch content** until you know which bucket dominates. Churning metadata without query data is guesswork.

### The Measurement Window

After making discoverability changes:
1. Request indexing in Search Console (URL Inspection → Test Live URL → Request Indexing)
2. Wait for recrawl — do not keep editing
3. Export page-filtered queries after fresh data arrives
4. Only act on the next round if the query data gives you a reason

The signal: if Google is ranking you at position ~6, it already finds topical relevance. The problem is almost never "write more content." It is almost always "make the doorway match the content."

### Anti-Patterns

- **Don't make the `<title>` a comparison slug** — `Codemap vs ghx vs Aider vs Repomix vs Gitingest` is SEO-hostage phrasing. It sounds desperate and attracts the wrong intent.
- **Don't derive `alternativeHeadline` by parsing `seoTitle`** — explicit field, set it directly.
- **Don't show updated dates for metadata-only edits** — readers don't care; it makes the publication feel changelog-ish.
- **Don't create SEO companion pages without query data** — a generic comparison page might attract more bad-fit intent, not less.
- **Don't use `opacity` for `.post-orient` color** — use `color: var(--color-text-muted)` directly; opacity affects all descendants including future links.

## Series Trails and Editorial Cross-References

Some posts are not standalone artifacts — they are part of a thread of thinking. When a post extends, revisits, or bounds an earlier post, connect them explicitly. Cross-references preserve the publication's memory: readers follow the evolution of an idea, agents understand which posts belong together, future posts become part of a visible body of work instead of isolated pages.

The goal is continuity, not "related posts" spam.

### Mechanisms

| Mechanism | Use when | Output |
|---|---|---|
| `series` metadata | Posts form a deliberate reading sequence | Auto-renders trail in HTML article + `.md` endpoint |
| Hard prose link | One post directly continues, corrects, or bounds another | One sentence in the body where it naturally belongs |

These are complementary, not alternatives. A series trail at the bottom + one contextual link in the prose is the full pattern.

### `series` metadata

```ts
series: {
  id: "ghx-field-notes",   // stable grouping key — never changes
  title: "ghx field notes", // display label — what readers see
  order: 2                  // reading order within the series
}
```

Rules:
- `id` is the grouping key. `title` is the display label. They are independent fields — do not derive one from the other.
- Use the real post `title` in the trail. Do not invent a separate `seriesTitle` unless the system explicitly supports it.
- The series trail renders on both the HTML article and the `.md` agent-readable endpoint.
- Build validates: duplicate `series.order` within the same `id` throws before any HTML is written.

### Hard prose links

```md
For the origin story behind ghx — from GitHub HTML dumps to `ghx read --map` — read [Build the GitHub Exploration Tool, No Mistakes](/how-ghx-was-born).
```

Rules:
- Use root-relative links (`/how-ghx-was-born`), not absolute URLs.
- Put the link where it helps the reader — not as a forced footer block.
- One contextual link per relationship. Do not repeat it.
- Add a link when one post is a predecessor, sequel, correction, deeper dive, or product-boundary companion. Do not add links because two posts share tags.

### Checklist before publishing a new post

1. Does this post continue an existing thread? Add it to the series with `order: N + 1`.
2. Does an older post need a forward link to this one? Add one prose sentence to that post.
3. Does this post need a backward link to an earlier piece? Add one prose sentence in the body.

## Decisions Log

Decisions made before building. Reference these — don't re-decide.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package manager | **pnpm** | Faster, strict deps, disk-efficient. `packageManager` field in package.json enforces it. |
| Content format | **Markdown + YAML frontmatter** | Web components ecosystem, not React. MDX requires JSX runtime — incompatible with nisli/core. See "Content Format" section. |
| Interactive elements | **Native web components in markdown** | `<nisli-*>` custom elements inline. Browser upgrades them. No build step needed for interactivity. |
| Hosting | **Cloudflare Workers (static assets)** | Migrated from GitHub Pages (Mar 2026). GitHub Pages has zero website analytics and no server-side capabilities. Cloudflare Workers gives us: same free static hosting, built-in Web Analytics, Pages Functions for future API endpoints (e.g. custom analytics), D1 database binding, and the domain was already on Cloudflare. Git integration auto-deploys on push to `main`. Config: `wrangler.jsonc` with `not_found_handling: "404-page"` and `html_handling: "auto-trailing-slash"`. |
| Domain | **gkoreli.com** | Matches GitHub/npm identity. `gogakoreli.com` reserved for separate project. |
| Registrar | **Cloudflare** | Wholesale pricing, free WHOIS privacy, integrated DNS. |
| License | **MIT** | Matches backlog-mcp. Blog source is public. |
| Branch | **main** | Not `mainline` (Amazon default). Set via local git config. |
| Git identity | **Goga Koreli (personal email)** | Set via local git config for this repo. |
| GitHub account | **gkoreli** | Primary dev identity across GitHub and npm. |
| Rendering | **SSG (static site generation)** | Build script pre-renders markdown → complete HTML at build time. No server needed. Crawlers and AI agents get full HTML. Nisli/core hydrates interactive components client-side. See "How SSG Works" below. |
| Markdown parser | **marked** | Already used in backlog-mcp viewer. Fast, minimal, passes through raw HTML (web components survive parsing). |
| Syntax highlighting | **shiki** (build-time) | Uses TextMate grammars (same as VS Code) — pixel-perfect accuracy on edge cases (nested templates, JSX in TS). Outputs pre-highlighted HTML with inline styles — zero client-side JS shipped. highlight.js runs client-side and has coarser grammars. For a static blog, build-time highlighting is strictly better. Integrates via `marked-shiki`. Dual themes (`github-light` + `github-dark`) rendered in a single pass using CSS variables — code blocks switch with the page theme via `[data-theme]` selector, zero JS. |
| CSS approach | **Vanilla CSS** | Blog CSS is ~200 lines: typography, layout, code blocks, nav/footer. Tailwind would add a build step (PostCSS), config file, and 3MB dependency for no gain. Utility classes in tagged template literals are noisy. Nisli/core is zero-dep — the blog should match that philosophy. |
| Frontmatter validation | **Zod** | `gray-matter` parses YAML frontmatter but returns `{ [key: string]: any }`. Zod schema validates at build time — missing `title`, `date`, or `description` fails the build with a clear error instead of silently producing broken HTML. Zero `as string` / `as any` casts in the codebase. |
| Body font | **Lora** (Google Fonts) | Literary serif designed for screens. Creates warmth and essay-like feel for long-form technical writing. Falls back to Georgia. Inspired by overreacted.io's serif approach but more contemporary than Georgia/Times. Not a newspaper font — designed for digital reading. |
| Node version | **22.x** | Current LTS. Pinned in `package.json` engines. |
| Language | **TypeScript (strict)** | Latest ECMAScript standards, strict type checking, no `any`. Build script and all tooling are `.ts` files run via `tsx`. ESNext target — always tracks latest standard, no manual bumping. |
| Project structure | **pnpm monorepo** | `packages/blog` is the site. Extensible for future packages (e.g. `packages/ui` for a blog-specific component library). Same pattern as backlog-mcp. Trivial to set up now, painful to restructure later. |
| Icons | **Cohesive SVG icon set** | Custom gradient line-art SVGs in `public/icons/`. Inspired by backlog-mcp's futuristic style — same geometric line-art approach but using the blog's green gradient (`#1a6b4e` → `#6ec9a8`). Never use emoji — always use SVG icons from the icon set. Icons: logo, sun, moon, github, npm, posts, sparkle, pen, linkedin, transparency (fingerprint). |
| Accent colors | **Green primary + sky blue secondary** | Primary: `#1a6b4e` / `#6ec9a8`. Secondary: `#93c5fd` (soft sky blue). Green dominates all gradients (60%+), blue is only the trailing hint. Three-stop pattern: dark green → mint → sky blue. Rationale: grass-and-clear-sky — natural, no muddy midpoints. Purple was too dominant, gold looked like spoilage, cyan was indistinguishable from green. |
| Logo | **Georgian გკ negative space** | Georgian Mkhedruli letters გ (g) and კ (k) — "Goga Koreli". Font-extracted SVG paths (Noto Sans Georgian Bold via opentype.js) masked out of a gradient rounded square. Letters sit at the bottom like TypeScript's logo. Same file serves as sidebar logo and SVG favicon. Georgian script is distinctive in tech — nobody else uses it. |
| CI/CD | **Cloudflare Workers Git integration** | Cloudflare watches the GitHub repo, auto-builds and deploys on push to `main`. Replaced GitHub Actions → GitHub Pages workflow. Build command: `pnpm install && pnpm -C packages/blog build`. No versioning (not a library). No preview deploys (single author, use `pnpm dev` locally). |
| OG images | **satori + @resvg/resvg-js (build-time)** | Per-post 1200×630 PNG. Dark gradient background, centered layout with logo, sparkle separator, post title, tagline. Lora Bold font loaded from `public/fonts/`. Both are devDependencies (build-time only). |
| 404 handling | **`public/404.html` + Cloudflare `not_found_handling: "404-page"`** | Cloudflare Workers serves the nearest `404.html` with a 404 status for unknown routes. The file contains a meta refresh redirect to `/`. |
| Prompt transparency | **Separate prompts page + article teaser** (ADR-0003) | Each post can have a companion `prompts/{slug}.prompts.md` file — raw `---`-delimited prompts. Build pipeline generates `/{slug}/prompts` page and injects a teaser card at the bottom of the article + inline link in the post header next to the date. Prompts are a first-class route, not a widget. Slogan: "Prompted by human, generated by AI." Icon: fingerprint (Tabler, MIT) with blog gradient. See `docs/adr/0003-prompt-transparency.md`. |
| Custom domain | **gkoreli.com via Cloudflare** | Custom domain on Cloudflare Workers. DNS managed in Cloudflare dashboard. SSL handled automatically. No `CNAME` file needed (that was GitHub Pages-specific). |
| Analytics | **Edge-observed, cookieless on D1** | Zero-dependency `@gkoreli/analytics` package. The Worker records successful non-prefetch HTML responses in `page_observations`; the browser beacon and `/api/event` are removed. The original `page_views` table remains intact, and a minimized copy of all 2,564 legacy rows is included in the public read model with `observation_source = 'beacon'`; new rows use `edge`. Traffic classes are heuristic `browser`/`bot`/`ai` User-Agent matches with optional rule names. Daily clients use a site/day-scoped 128-bit HMAC from transient IP + User-Agent and a required secret; raw IP/User-Agent are not stored for edge observations. Public reporting uses reproducible UTC windows and hourly 7d/daily longer buckets. Cloudflare Web Analytics is separate and disclosed. Since ADR-0016.2 every edge row also stores request evidence (`asn`, `as_org`, the four `Sec-Fetch-*` values, `accepts_html`, `has_accept_language`); the public Browsers class is derived at query time in `packages/analytics/src/partition.ts` as browser UA + navigation-shaped request + not on the hosting-ASN list in `networks.ts`, edge rows from before 2026-09-03 01:35 UTC carry no evidence and stay in Browsers (continuity, disclosed), and checked-and-failed rows are Browser-like. Never add AS13335, AS36183, AS20940, AS54113, or AS15169 to the hosting list. See ADR-0016 and ADR-0016.2; ADR-0004 semantics are superseded. Direction under ADR-0016.3 (proposed): audience composition, not exclusion; class labels are request facts, never confidence words; agent readers are audience; articles become citable with persistent identifiers; references count only when verified. Since ADR-0016.3 each row also stores the served `representation` (html/markdown), Web Bot Auth `signature_agent`/`signature_status` (Ed25519 verification against the signer's `/.well-known/http-message-signatures-directory`, `packages/analytics/src/webbotauth.ts`), and one `reader_kind` + `reader_reason` from the closed set in `packages/analytics/src/readerkind.ts` (migrations 0004–0006; 0006 backfills history with the same SQL mapping). The public stats API still partitions on `traffic_class` until the reader-kind labels are settled (TASK-0102/0105). |
| Stats dashboard | **Reader-first public `/stats` page with uPlot** | Shows Page views and Daily clients with exact 7d/30d/90d/All UTC periods, zero-filled time series, Browsers-only device mix, accessible chart tables, coherent loading/empty/error states, and inline methodology. Since ADR-0016.3 (2026-09-03) the traffic pills are **Browsers / AI agents / Crawlers / Automation / All**, four disjoint groups of the closed reader-kind set that add up to All (`READER_GROUPS` in `packages/analytics/src/contracts.ts`). A "Who fetched these pages" composition table lists every reader kind with its reasons (public names in `KIND_LABELS` and `REASON_LABELS`, `packages/blog/src/client/stats.ts`); kind rows link to `?kind=`, named-agent reasons to `?agent=`, Top pages rows to `?path=`. Labels are facts about the request, never confidence adjectives, and Browsers is a counting noun, never "humans". The methodology names the three Browsers evidence levels (navigation-shaped, user-agent-only, beacon-script-ran) and the two method changes (2026-08-26 edge cutover, 2026-09-03 evidence). |
| Analytics purpose | **Publishing decision loop, not an analytics product** | Use analytics only to choose a content correction, discoverability change, distribution change, bounded experiment, or no action. Reader contact, corrections, subscriptions, citations, and attributable links outrank page totals. If a metric cannot change a decision, do not add it. See ADR-0016.1. |
| SEO/Discoverability | **Build-time auto-generation** | All SEO files (sitemap, llms.txt, JSON-LD, canonical URLs, .md endpoints, posts.json, CSL-JSON and BibTeX citations, robots.txt, license page) auto-generated from `PostMeta[]` and the content license constant at build time. Zero manual maintenance for content changes. See ADR-0006. |

## Design Philosophy

Researched and decided 2026-03-05. Reference these — don't re-decide.

**Inspiration sources:** shiki.style (sidebar nav, code-first), antfu.me (restraint, whitespace), overreacted.io (literary serif warmth), knifecoat.com (sidebar, code prominence, terminal aesthetic), joshwcomeau.com (code blocks as primary content).

### Layout
- **Sidebar navigation stays** — meaningful for a technical blog with structured content. Inspired by shiki.style and knifecoat.com. Not every blog needs to be single-column.
- **3-column CSS grid** — `1fr minmax(0, var(--content-max)) 1fr`. Content always centered, sidebar right-aligned within its column. Gutter mirrors sidebar for symmetric centering. `minmax` lets content shrink on narrow viewports — no horizontal scroll.
- **Sidebar sizes to content** — no fixed width. Sits inside `.sidebar-wrapper` with `justify-content: flex-end`. Spacing via single `gap: 1rem` on parent flex container.
- **Sidebar HTML zones** — `sidebar-bar` (logo + burger), `sidebar-social` (icon buttons), `sidebar-nav` (sections + separator). Clean separation for responsive behavior.
- **One media query (768px)** — the only structural change. Grid goes single-column, sidebar becomes horizontal header bar with burger menu. Everything else is intrinsic: `auto-fit` grids, `flex-wrap`, `minmax`.
- **`<nisli-burger-menu>` web component** — toggles full-screen overlay on mobile. Same `@nisli/core` pattern as theme toggle. Escape to close, body scroll locked, `aria-expanded`.
- **Code blocks get visual priority** — they're the primary content. Generous padding, full-width within the content column, prominent but not overwhelming.
- **Tagline** — "Where excitement ends, depth begins." in the sidebar. Captures the philosophy: the real work starts after the dopamine of new ideas fades.
- **Pages** — `/about` page with full bio, projects, and connect links. Home page has hero (name, projects grid, brief about) + post list separated by sparkle.

### Typography
- **Lora serif for body** — loaded from Google Fonts, falls back to Georgia. Designed for screens, not print — warmer and more contemporary than Georgia (which looks like a newspaper). Inspired by overreacted.io's literary feel.
- **Monospace for code only** — SF Mono / Fira Code. Code should feel distinct from prose.
- **Generous line-height** (1.7+) for body text, tighter for headings.

### Color
- **Light theme default** — warm cream tones (`#faf8f5` bg), not pure white. Easier on eyes for long reading sessions. Inspired by joshwcomeau.com's warm palette.
- **Dark theme** — warm dark gray (`#1a1a1a`), not blue-black. Muted text, green accent. Designed separately, not just inverted.
- **Primary accent** — muted green (`#1a6b4e` dark / `#6ec9a8` light). Earthy, calm, distinct from the typical blue link. Used for links, icon strokes, and as the dominant gradient color.
- **Secondary accent** — soft sky blue (`#93c5fd`). Grass-and-clear-sky pairing with green. Only appears as the trailing end of gradients — green always dominates (60%+ of gradient). Never used standalone; exists to give gradients a visible color shift without competing with green. Three-stop gradient pattern: `#1a6b4e` → `#6ec9a8` (60%) → `#93c5fd` (100%).
- **Low contrast intentionally** — text is dark but not black (`#2d2a24`), muted text is warm (`#7a7568`). Comfortable for extended reading.

### Code Blocks (Shiki)
- **Dual themes in one render** — shiki outputs both `github-light` and `github-dark` token colors as CSS variables in a single HTML pass. `defaultColor: false` means no inline colors — everything controlled via `[data-theme]` CSS selectors.
- **Zero JS for code theme switching** — the theme toggle sets `data-theme` on `<html>`, CSS selectors activate the right shiki variables. No re-rendering, no client-side highlighting.
- **Why this matters** — code blocks are the most visually complex element on the page. Getting them right in both themes with zero runtime cost is a significant UX win.

### Interactive Components
- **Islands architecture** — SSG renders the full page shell and content at build time. `@nisli/core` web components handle interactive islands (theme toggle, future interactive demos).
- **Progressive enhancement** — page is fully readable without JS. Components upgrade when JS loads.
- **`<nisli-*>` components in markdown** — drop custom elements directly into posts for interactive demos. Browser upgrades them natively.

### Sidebar UI
- **Icon buttons** — individual bordered 32×32px buttons with SVG icons. Same visual treatment as theme toggle.
- **Two-button theme toggle** — sun and moon side by side in a joined pill. Active button gets `background: var(--color-surface)` + full opacity. Inactive is dimmed. Immediately obvious which mode is active.
- **Sparkle separator** — gradient line with sparkle SVG icon in center (inspired by backlog-mcp's epic-separator). Separates icon buttons from post navigation. Uses the three-stop gradient.
- **Tags as `#hashtags`** — no pills or badges. Tags render as `#tag-name` with the `#` using gradient text (`background-clip: text`). Muted, developer-native, doesn't compete with content. Inspired by antfu.me and overreacted.io treating metadata minimally.

### Build Pipeline
- **Four-step build** — `cleanDist()` → `copyStaticAssets()` → `buildHTML()` → `bundleClient()`. Each step is independent with clear ordering. Prod uses all four, dev uses steps 2+3 only.
- **Frontmatter validation** — `validatePosts()` runs at the start of every build. Posts with invalid/missing frontmatter are skipped with a clear warning (not a crash). Standalone `pnpm validate` script for CI. Uses `safeParse()` + custom `FrontmatterError` class.
- **Prompts pipeline** — `parsePrompts(slug)` checks `prompts/` for a matching `.prompts.md` file, splits on `---`, returns `{ count, prompts[], preview }` or `null`. Build loop generates `/{slug}/prompts` page when prompts exist, passes data to post template for header link + teaser card.
- **esbuild handles all assets** — JS and CSS are esbuild entry points with `entryNames: '[name]'` to flatten output. HTML references `/main.js` and `/main.css`.
- **RSS feed** — generated at build time from post metadata. Zero dependencies — hand-rolled XML template. Autodiscovery `<link>` in `<head>` so readers and agents find it automatically.
- **Semantic HTML** — `<article>`, `<time>`, `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`. Agents can identify main content vs navigation without heuristics. Note: prompts teaser uses `<section>` (directly related to article), not `<aside>` (tangential content).
- **AI agent access** — pre-rendered HTML (full content without JS), RSS feed (`/feed.xml`), `llms.txt` (developer-tool directory; inert for AI search, see ADR-0016.3), and `robots.txt` (allow all, `Content-Signal: search=yes, ai-input=yes`, content-license comment). The Worker negotiates representations on post and page paths: `Accept: text/markdown` returns the Markdown twin with `Content-Location`, `Accept: application/vnd.citationstyles.csl+json` or `application/x-bibtex` returns the citation files, and every HTML/Markdown response carries typed `Link` headers (`alternate` markdown, `describedby` posts.json, `author`, `license`, `alternate` CSL-JSON). Pure negotiation logic lives in `packages/blog/src/worker/negotiate.ts`; link building in `packages/blog/src/lib/typed-links.ts`; the content license constant in `packages/blog/src/lib/license.ts`.
- **`_headers` file** — `packages/blog/public/_headers` sets `Content-Type: text/plain; charset=utf-8` for `.txt` and `text/markdown; charset=utf-8` for `.md`. Cloudflare parses this at the edge. Without it, browsers default to Latin-1 for `text/plain`, mangling UTF-8 multi-byte characters (em dashes → mojibake).

### SEO & Discoverability (ADR-0006)

All SEO files are auto-generated at build time from `PostMeta[]`. Adding a new post or prompts file automatically updates everything. No manual maintenance for content changes.

**Auto-generated (zero maintenance):**
- `sitemap.xml` — all pages including `/{slug}/prompts/` when prompts exist
- `llms.txt` — AI agent index with post links + prompts links
- `llms-full.txt` — full content for RAG/large-context models
- `posts.json` — structured post index with prompts URLs
- `/{slug}.md` — clean markdown per post (frontmatter stripped) with a trailing `## Cite this` block
- `/{slug}.csl.json` and `/{slug}.bib` — per-post citation representations (`templates/citation.ts`), license name from the content license constant
- `/license` — the content section of the repository `LICENSE`, rendered as a page
- `robots.txt` — access, `Content-Signal`, license comment, sitemap (`templates/robots.ts`)
- JSON-LD `BlogPosting` — in `<head>` of blog posts only
- `rel="canonical"` + `og:url` — self-referencing on every page
- `feed.xml` — RSS items

**Requires periodic manual update:**
- `llms.txt` intro/API/Source sections — only if site mission, API endpoints, or repo URL change (~never)
- `jsonld.ts` author info — hardcoded single author (~never)
- AI crawler regex in `packages/analytics/src/classify.ts` — sync from `ai-robots-txt/ai.robots.txt` (~quarterly)

**Key invariant:** `buildHTML()` in `build.ts` is the single source of truth. All SEO files flow from `PostMeta[]` + raw markdown. See `docs/adr/0006-ai-readable-blog.md` Resilience Matrix for the full mapping.
- **External links** — all external links open in new tabs (`target="_blank" rel="noopener"`). Markdown renderer auto-detects external vs internal links. Internal links (`/about`, `/hello-world`) stay in same tab.
- **Dev server** — browser-sync serves `dist/` with WebSocket-based live reload. `bs.watch()` (chokidar) watches `src/` and `posts/` for changes. HTML rebuilt via subprocess (`tsx build-html.ts`) to avoid Node module cache. esbuild context handles JS/CSS bundling.
- **Never run `pnpm build` while `pnpm dev` is running** — esbuild's context holds the dist directory. Production build would nuke it.

### Anti-Patterns (Design)
- Don't use pure white (`#ffffff`) or pure black (`#000000`) — always warm/muted
- Don't use sans-serif for body text — the literary serif is a deliberate identity choice
- Don't remove the sidebar to "simplify" — it's a navigation pattern that scales with content
- Don't add animations or transitions unless they serve comprehension (not decoration)
- Don't use different fonts for light vs dark — same typography, different palette
- Don't use emoji for UI elements — always use SVG icons from `public/icons/`. Emoji render inconsistently across platforms and break the cohesive visual identity. The icon set uses gradient line-art matching the blog's color palette.

## Current State

- **Repo**: https://github.com/gkoreli/blog
- **Structure**: pnpm monorepo — `packages/blog` is the site
- **Domain**: `gkoreli.com` (bought on Cloudflare)
- **Domain (reserved)**: `gogakoreli.com` (separate project later)
- **License**: MIT
- **Branch**: `main`
- **Status**: Live at gkoreli.com — design system complete, first post published, CI/CD active
- **Done**: SSG pipeline, shiki dual themes, theme toggle, sidebar nav, SVG icon set, Georgian გკ logo/favicon, Zod frontmatter validation, warm cream/dark palette, Lora serif typography, Cloudflare Workers deploy, Cloudflare DNS, RSS feed, llms.txt, OG image generation (satori + resvg), about page, 404 redirect, blog-writing agent skill, prompt transparency feature, deployed edge-observed cookieless analytics with source-marked legacy continuity and reader-first `/stats` (ADR-0016), SEO discoverability layer (ADR-0006 Phase 1: sitemap.xml, llms.txt, llms-full.txt, posts.json, .md endpoints, JSON-LD, canonical URLs, og:url), `_headers` UTF-8 charset fix for .txt/.md files, responsive layout with burger menu (ADR-0007: intrinsic grid, one media query, `<nisli-burger-menu>` web component)
- **Next**: Write more content; @nisli/core SSR (TASK-0477)

## Tech Stack

- **Framework**: `@nisli/core` (npm dependency)
- **Package manager**: pnpm (enforced via `packageManager` field)
- **Content**: Markdown + YAML frontmatter in `posts/`
- **Hosting**: Cloudflare Workers (static assets)
- **DNS/CDN/SSL**: Cloudflare
- **CI/CD**: Cloudflare Git integration (auto-deploy on push)
- **Analytics**: Edge-observed cookieless analytics — `@gkoreli/analytics` on Cloudflare Workers + D1, with source-marked legacy browser-beacon continuity, a public uPlot `/stats` dashboard, and a UTC reporting contract (ADR-0016). Date/window utilities: `packages/analytics/src/dates.ts`. Cloudflare Web Analytics remains a separate disclosed performance feed. Observability logs enabled in `wrangler.jsonc`.

## Future Vision

- Email newsletter (Buttondown or Resend)
- Series/tags for organizing content by topic
- The blog becomes the public face of the `gkoreli` builder identity — connecting GitHub, npm, and writing into one coherent presence
