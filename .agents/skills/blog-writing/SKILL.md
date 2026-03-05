---
name: blog-writing
description: Blog post writing guidelines for gkoreli.com. Use when writing, editing, or reviewing blog posts. Covers voice, structure, content format, build-in-public approach, and technical writing standards for an engineering audience.
license: MIT
metadata:
  author: gkoreli
  version: "1.0.0"
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
- `001-hello-world.md`
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
- [ ] Ends with what's next (open loop)
- [ ] Read it out loud — does it sound like you talking?
