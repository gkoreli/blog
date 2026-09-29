# Publication Purpose and Editorial Direction

Read when choosing publication purpose, article role, or scope. Owner directions retain their original dates; the September 19 earned-trust direction clarifies the earlier opposition to generic tutorials. [NORTH_STAR.md](../../../../NORTH_STAR.md) holds the publication direction.

## Earned-Trust Writing (owner direction, 2026-09-19)

**Teach something useful. Show the basis for the advice. Let the reader get to know the person doing the work.** This is the preferred model for substantive gkoreli.com articles, including engineering and practical personal inquiry. Read [.agents/skills/earned-trust-writing/SKILL.md](../../earned-trust-writing/SKILL.md) after `shape-article` when applying it. The [complete founding prompt](../../../../docs/editorial/2026-09-19-earned-trust-writing.prompt.md) is preserved verbatim for historical reasons; do not silently edit it.

Aim for roughly equal substantive weight: **50% transferable reader value and 50% Goga's actual work, experience, opinions, mistakes, and unresolved questions.** Weave these perspectives together rather than requiring a tutorial followed by an unrelated personal half. A stranger should be able to learn and inspect the reasons for a claim without knowing or trusting the author beforehand. Through that same explanation, the reader should discover what Goga builds, how he thinks, what he has learned, and what he still needs to understand.

The owner's reference is [Bot Detection Without JavaScript: What My Blog Measured](https://gkoreli.com/how-i-separate-readers-from-bots-without-javascript): a recognizable reader problem paired with an implementation, measurements, corrections, and explicit limits. Copy that relationship between teaching and evidence, not its exact structure or the word “measured” when nothing was measured.

Keep external findings, firsthand observations, interpretations/opinions, and proposed experiments distinct. Put useful evidence beside the advice it supports. An anecdote is not universal proof; a citation does not validate an entire proposed method. Do not invent experiences, measurements, quotations, feelings, or a completed recovery story to establish credibility. Ask targeted, walk-friendly questions for missing personal substance instead of manufacturing it.

This direction clarifies older “not a tutorial site” and “don't write generic tutorials” wording in the historical publication context below: **teach directly, but avoid interchangeable instruction detached from evidence and the author's work.** Practical utility and an author-present journal belong in the same article. The 50/50 goal is a substantive balance, not a word-count formula. `shape-article` still chooses the honest form, and deliberately exposed essays remain author-written under `personal-essays`; do not force every piece into a tutorial.

Before delivery, run the stranger test (useful without the byline), author test (specific work and judgment, not a replaceable biography), and connection test (the teaching and personal material strengthen each other). This is an editorial strategy for warranted confidence and reciprocal readership, not a guarantee of trust, subscriptions, search performance, or growth.

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

## Content Strategy

Build-in-public approach — document the journey with specifics over polish.

### Publication Roles: Reach and Identity

The publication needs useful external entry points and a recognizable mind behind them. Three article roles are first-class:

- **Reader-growth:** a cold reader can recognize a problem, mechanism, decision, or artifact that matters beyond the existing audience. Broad means a wider honest fit set, not generic subject matter.
- **Signature:** makes Goga's voice, thinking, identity, projects, bets, or vision legible. Its value is depth, recognition, and contact even when search fit is narrow.
- **Bridge:** a concrete problem carries the reader into Goga's judgment or vision, or a personal stake reveals a transferable engineering problem.

Roles are not quotas, quality rankings, or fixed forms. Shape the article first, then design the doorway. Internal links and series trails let reach and identity strengthen each other without asking every article to do both jobs. The older permission for a literary H1 rescued by description or `seoTitle` was superseded on 2026-09-01: every H1 names its subject in plain words first. Voice may follow that subject and remains in the body. See [Titles Name the Subject](../../article-discovery-positioning/references/metadata-and-discovery.md#titles-name-the-subject-owner-tenet-2026-09-01).

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
