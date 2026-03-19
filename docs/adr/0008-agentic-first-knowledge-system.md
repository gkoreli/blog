# 0008. Agentic-First Knowledge System

**Date**: 2026-03-19
**Status**: Draft — vision document, not yet implementing

## Context

The blog currently operates as a traditional publishing pipeline: author writes prompts → agent distills → manual review → publish markdown → SSG builds HTML. Content and knowledge are separate systems — backlog-mcp holds the working knowledge (tasks, decisions, research, ADRs), the blog holds the polished output.

This separation means:
- Publishing is a manual, disconnected process
- The vast majority of accumulated knowledge never surfaces publicly
- The blog is a static artifact, not a queryable knowledge system
- AI agents can read published posts (llms.txt, .md endpoints) but can't query the thinking behind them

### What already exists

- **backlog-mcp**: semantic search across all work — tasks, decisions, research artifacts, ADRs. Disk-first storage, agent-native CRUD, live activity panel.
- **Blog SSG**: custom pipeline, markdown → HTML, @nisli/core components, Cloudflare Workers.
- **Prompt transparency**: raw prompts published as first-class routes (`/{slug}/prompts`).
- **AI-readable layer** (ADR-0006): llms.txt, llms-full.txt, posts.json, .md endpoints, JSON-LD, sitemap — all auto-generated at build time.
- **Custom analytics**: cookieless, D1-backed, public /stats dashboard.

The pieces exist. They're not connected.

## Vision

The blog is not a blog. It's the public interface of a personal AI knowledge system.

### Three projections of the same knowledge graph

```
backlog-mcp (source of truth)
├── Human-readable projection  → blog posts on gkoreli.com
├── Agent-readable projection  → MCP endpoints, llms.txt, .md, posts.json
└── Queryable projection       → semantic search over all published + unpublished knowledge
```

- **Blog posts** are one output format, not the product
- **The knowledge graph** is the product — accumulated decisions, research, dead ends, insights, prompts
- **Publishing** is a projection operation, not a creation operation

### Core ideas

#### 1. Backlog → Blog pipeline

The backlog already accumulates publishable material: clusters of related tasks, decisions that took multiple iterations, research deep dives with surprising findings, ADRs with rich context.

- Agent watches backlog for publishable patterns — not random content, but clusters of insight that cross a threshold of depth
- Agent drafts from accumulated context — the semantic graph of actual work, not from scratch
- Author reviews, steers, publishes — human substance layer stays
- The blog becomes a view into the knowledge base, not a separate artifact

#### 2. Public knowledge API

llms.txt and .md endpoints make the blog AI-readable. The next step: make the knowledge graph behind it queryable.

- MCP endpoint on gkoreli.com — agents can ask "what does Goga think about in-browser AI inference?" and get a grounded answer from actual work, not a blog post summary
- Scoped access: published content is public, unpublished research is private, author controls the boundary
- Not a chatbot — a structured knowledge API that returns grounded, cited responses

#### 3. Agent-native publishing framework

The SSG is already custom. Making it agent-native means:

- Build pipeline accepts agent-generated content natively (backlog artifact → post draft → review → publish)
- Semantic search over all published content exposed as an MCP tool
- The blog itself becomes a tool agents can use — query, cross-reference, cite
- Other agents building with @nisli/core or backlog-mcp can pull relevant blog content into their context

#### 4. Knowledge compounding

Every post, every prompt, every ADR, every research artifact feeds back into the knowledge graph. Over time:

- Train a personal model on accumulated data — not just code, but the reasoning behind it
- The knowledge system gets smarter with each publish cycle
- Cross-referencing between posts happens automatically (agent finds related past work via semantic search)
- The "glossary with sources" pattern in posts becomes machine-queryable — a citation graph

## What this is NOT

- Not a CMS — no admin panel, no WYSIWYG, no content management overhead
- Not a chatbot on the blog — the queryable layer is for agents, not a chat widget
- Not automated publishing — human review and steering is non-negotiable
- Not a generic framework — this is built for one person's knowledge system, not a product for others (yet)

## Phased approach

### Phase 1 — Connect (weeks)
- Explore: can backlog-mcp artifacts flow into blog post drafts with minimal friction?
- Explore: what does a "publishable cluster" detector look like?
- No new infrastructure — just workflow experiments

### Phase 2 — Expose (month)
- Public semantic search endpoint over published content
- MCP tool: `blog_search` — agents can query gkoreli.com content programmatically
- Builds on existing llms.txt / .md infrastructure from ADR-0006

### Phase 3 — Compound (quarter)
- Backlog → blog draft pipeline with agent assistance
- Cross-reference engine: new posts automatically link to related past work
- Knowledge graph visualization — the public face of how ideas connect
- Personal model training on accumulated knowledge (long-term)

## Why this matters

The content landscape for agentic engineering is:
- **Hype camp**: AI-generated slop, no substance
- **Tutorial camp**: step-by-step guides that age in weeks
- **Builder camp** (us): real decisions, real failures, real tools — but currently published as disconnected blog posts

An agentic-first knowledge system turns the builder camp into something structurally different: a compounding, queryable, agent-native knowledge base that happens to have a blog as its human-readable interface.

Nobody has this. The closest analogues are digital gardens (Maggie Appleton, Andy Matuschak) — but those are human-first, static, and not agent-queryable. This is both.

## Open questions

- What's the right boundary between public and private knowledge? Not everything in backlog-mcp should be queryable.
- How does the "publishable cluster" detector avoid surfacing half-baked ideas? The threshold matters.
- Does the public MCP endpoint need auth, or is open access the right default for a personal blog?
- How does this interact with the future newsletter? Is the newsletter another projection of the same graph?
