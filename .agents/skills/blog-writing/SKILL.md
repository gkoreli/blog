---
name: blog-writing
description: Blog post writing guidelines for gkoreli.com. Use when writing, editing, or reviewing blog posts. Covers voice, structure, content format, sourcing rules, formatting balance, transparency, and technical writing standards for an engineering audience.
license: MIT
metadata:
  author: gkoreli
  version: "2.0.0"
---

# Blog Writing — Agent Skill

Guidelines for writing blog posts on gkoreli.com — a builder's journal about agentic engineering, open source tools, and the craft of software.

## When to Apply

Reference these guidelines when:
- Writing a new blog post in `packages/blog/posts/`
- Editing or reviewing existing posts
- Drafting post outlines or structures
- Cross-posting to dev.to or other platforms

## Voice & Identity

- **Author**: Goga Koreli — builder, not thought leader
- **Tone**: Direct, technical, conversational. Write like explaining to a sharp colleague, not lecturing a classroom.
- **Perspective**: First person. "I built this because..." not "One might consider..."
- **Honesty**: Show failures and wrong turns, not just wins. "This didn't work because..." is more valuable than "Here's how to do it right."
- **No fluff**: Skip intros like "In today's fast-paced world..." — lead with the thing.
- **Transparency**: This blog is AI-assisted. Every post includes the raw prompts that generated it. The author provides the substance — experience, perspective, lessons. The agent helps write. This is not AI slop.

## What Makes a Great Article

A great engineering blog post does several of these:

- **States a problem clearly** — the reader should feel the pain before seeing the solution
- **Introduces novel ideas or perspectives** — not rehashing what everyone already knows
- **Debunks myths** — challenges popular but wrong assumptions with evidence
- **Showcases best practices AND anti-patterns** — what to do and what to avoid, from experience
- **Highlights gotchas** — the things nobody warns you about until you hit them
- **Shares personal growth** — what changed in your thinking and why
- **Is transparent** — about process, tools, trade-offs, and limitations

The goal: a reader finishes the post knowing something they didn't before, or seeing something familiar from a new angle.

## Formatting Balance

### Prose vs Structure

Not everything should be a paragraph. Not everything should be a bullet list. The rule:

- **Prose** — for narrative, arguments that build, origin stories, personal reflections. When the reader needs to follow a thread of reasoning.
- **Bullet points** — for enumerating distinct items, features, comparisons, lists of things. When each point is independent and the reader benefits from scanning.
- **Numbered lists** — for sequences, ranked items, or when order matters.
- **Blockquotes** — for strong opinion statements that deserve visual emphasis. The "quotable" lines. Always wrap the text in literal `"` quote characters inside the blockquote: `> "The actual quote here."`
- **Bold lead-ins** — `**Label:**` followed by the point. Lets readers scan sections quickly.

### Anti-pattern: Wall of Prose

If a section has 3+ paragraphs of continuous prose making distinct points, it probably needs restructuring. Break it up with:
- A bullet list for the enumerable parts
- A blockquote for the strongest claim
- Shorter paragraphs (2-3 sentences max per paragraph)

### Anti-pattern: Everything is Bullets

If the whole post reads like a slide deck, it loses voice and narrative. The personal sections — origin stories, reflections, arguments — need prose to land.

### Hyperlinks

Use inline contextual links. Don't make readers go find things.

- Link to repos, READMEs, npm packages, the blog itself
- Link to specific pages when referencing tools or concepts
- External links open in new tabs (handled by the markdown renderer)
- Internal links (other posts, homepage) stay in same tab

## Post Format

```markdown
---
title: "Exact title — specific, not clickbait"
date: 2026-03-05
description: "One sentence that makes someone want to read it"
tags: [nisli, web-components, framework]
---

Content starts immediately. No preamble.
```

### Frontmatter Rules

- `title` — specific and descriptive. "A Reactive Web Component Framework in 660 Lines" not "My New Framework"
- `date` — ISO format, publish date
- `description` — one sentence, used for SEO meta and social cards
- `tags` — lowercase, kebab-case, 2-5 tags

### File Naming

`NNN-slug-title.md` — numbered prefix for ordering, slug for URL.
- `001-the-agentic-product-engineer.md`
- `002-why-i-built-nisli-core.md`
- `003-backlog-mcp-how-agents-manage-tasks.md`

## Content Principles

### Build in Public

Every post should feel like a chapter in an ongoing journey, not a standalone tutorial.

- **Show real decisions**: "I chose X over Y because Z" with actual trade-offs
- **Show real numbers**: bundle sizes, line counts, npm downloads, build times
- **Show real failures**: "This approach failed because..." with what you learned
- **Open loops**: end posts with what's coming next — pulls readers back

### Specificity Over Polish

Weak: "I've been working on my framework, things are going well."

Strong: "Week 3: Rewrote the component lifecycle. Old approach created 47 orphaned event listeners in a 10-component page. New approach: zero. Here's the diff."

### Structure That Works

1. **Lead with the thing** — what you built, what you found, what broke. No preamble.
2. **Context** — why this matters, what problem it solves. Keep it short.
3. **The meat** — code, decisions, trade-offs, results. This is 70% of the post.
4. **What I learned** — honest reflection, not a summary.
5. **What's next** — open the loop for the next post.

### Code Blocks

- Always specify language for syntax highlighting: ` ```typescript ` not ` ``` `
- Keep code blocks focused — show the relevant 10 lines, not the whole file
- Add brief comments in code only when the code isn't self-explanatory
- For before/after comparisons, use two separate blocks with a sentence between

### Interactive Elements

When a concept benefits from interactivity, embed a web component:

```markdown
Here's the reactive counter in action:

<nisli-counter initial="0"></nisli-counter>
```

Use sparingly — only when interactivity genuinely helps understanding. Most posts are fine with just text and code blocks.

## Sourcing Rules

### When to Use External Sources

This is a builder's blog, not a news outlet. External sources serve as **evidence for claims**, not as content filler. Use them when:

- Backing a specific claim that readers might question
- Attributing a concept or term to its originator
- Pointing readers to deeper exploration on a topic

Don't overuse them. A post with 10+ external links feels like a research paper, not a blog.

### Source Selection (strict priority order)

1. **Original author's own post/tweet/repo** — if someone coined a term or published a finding, link to THEIR source, not a summary of it
2. **Authoritative builder blogs** — engineers and builders who ship real things (e.g. Andrej Karpathy, Steve Yegge, Guillermo Rauch, Dan Abramov, Evan You)
3. **Authoritative company engineering blogs** — established companies sharing real engineering work (e.g. Vercel, Anthropic, GitHub, LangChain)
4. **Academic/research institutions** — for research-backed claims (e.g. Columbia, Stanford, MIT)
5. **Reputable tech publications** — MIT Technology Review, Pragmatic Engineer, etc.

### Source Anti-Patterns

- **Never use subscription-gated articles** — if the reader can't access it freely, don't link it
- **Avoid Wikipedia as a source** — find the original. Wikipedia is a starting point for research, not a citation. Exception: only if the original source is genuinely unfindable.
- **Avoid generic SEO content farms** — sites that exist to rank for keywords, not to inform
- **Avoid outdated sources without context** — agentic engineering moves fast. A 2-year-old article about AI agents is likely outdated. If you must use it, note the date and acknowledge what may have changed.
- **Avoid news aggregators** — link to the original, not the outlet that summarized it

### Glossary Section

Posts that make claims backed by external evidence should end with a `## Glossary` section. This is NOT part of the article narrative — it's a reference appendix.

Format:
```markdown
---

## Glossary

| Term / Claim | Source | Date |
|---|---|---|
| Context engineering | [Andrej Karpathy](https://link) — "the delicate art and science of filling the context window..." | Jun 2025 |
| Vibe coding | [Andrej Karpathy on X](https://link) — coined the term | Feb 2025 |
```

Rules:
- **Always include dates** — the industry evolves fast, readers need to know how fresh the source is
- **Use a table format** — visually distinct from the article body, scannable
- **Link to the original source** — not a summary or aggregator
- **Keep descriptions brief** — one line per entry
- **Separate from article with a horizontal rule** (`---`) — the glossary is a reference section, not a continuation of the narrative

## Content Topics

### Core Topics (what the blog is about)

- `@nisli/core` — framework internals, design decisions, zero-dep philosophy
- `backlog-mcp` — MCP server design, how agents use it, task management for LLMs
- Agentic engineering — multi-agent delegation, context engineering, design-first workflows
- Monorepo architecture, TypeScript tooling, open source maintenance

### Post Types

- **Deep dive** — technical exploration of one system/decision (e.g. "How nisli/core's template engine works")
- **Build log** — what happened this week/month, real progress and setbacks
- **Decision record** — why we chose X over Y, with full trade-off analysis
- **Lessons learned** — retrospective on a completed project or milestone

## Anti-Patterns

- Don't write generic tutorials that could be about anyone's code — write from YOUR experience
- Don't use "we" when you mean "I" — this is a personal blog
- Don't pad posts with background the reader already knows — link to it instead
- Don't bury the lede — if the interesting thing is in paragraph 5, move it to paragraph 1
- Don't write posts without code — this is an engineering blog
- Don't use AI-generated filler text — every sentence should carry information
- Don't write walls of prose when bullets would be clearer — match format to content
- Don't make every section bullets either — narrative sections need prose to land
- Don't make unsubstantiated claims — if it's an opinion, own it. If it's a fact, source it.
- Don't link to paywalled or subscription-gated sources
- Don't use Wikipedia when the original source exists

## Cross-Posting

- Always publish on `gkoreli.com` first
- Cross-post to dev.to with `canonical_url` pointing back to `gkoreli.com`
- Share on X with a specific hook (not just the title) + `#BuildInPublic`
- LinkedIn for milestone posts (launched, hit N downloads, etc.)

## Quality Checklist

Before publishing:
- [ ] Title is specific and descriptive
- [ ] Description works as a standalone sentence
- [ ] Post leads with the interesting thing, not preamble
- [ ] Code blocks have language specified
- [ ] At least one concrete number, metric, or specific detail
- [ ] Formatting balance — prose for narrative, bullets for lists, blockquotes for strong claims
- [ ] No walls of prose — sections with 3+ paragraphs of distinct points are restructured
- [ ] External sources follow sourcing rules (original author, no paywalls, no Wikipedia)
- [ ] Glossary has dates on all sources
- [ ] Hyperlinks are contextual and useful (repos, READMEs, npm, blog pages)
- [ ] Ends with what's next (open loop)
- [ ] Read it out loud — does it sound like you talking?
