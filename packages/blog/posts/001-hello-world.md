---
title: "Hello World"
date: 2026-03-05
description: "After a decade of software engineering, I'm becoming something new — an agentic product engineer. This is what that means, and why I'm writing about it."
tags: [agentic-product-engineer, nisli, backlog-mcp, meta]
---

# Hello World

I've been a software engineer for a decade. I've shipped dashboards, design systems, micro-frontends, and infrastructure that serves millions of users. I know how to build things.

But over the past year, something shifted. I stopped writing most of my code by hand. Not because I got lazy — because I found a better way to work. I delegate to AI agents. I design systems, make decisions, and orchestrate execution across multiple specialized agents that research, implement, and iterate faster than I ever could alone.

I'm calling this role what it is: **agentic product engineer**.

## What is an agentic product engineer?

It's not "vibe coding." It's not prompting ChatGPT and hoping for the best. It's a disciplined engineering practice where you:

- **Design first** — every feature starts with problem articulation, divergent proposals, and an architecture decision record before a single line of code is written
- **Delegate with intent** — specialized agents handle research, implementation, and testing, each with clear context and constraints
- **Own the product** — you're not just writing code, you're making product decisions, designing UX, choosing trade-offs, and shipping end-to-end

The "product" part matters. An agentic product engineer isn't a prompt engineer or an AI researcher. You ship real products. The agents are your leverage, not your replacement.

## What I'm building

Two open source projects that I use every day:

**[@nisli/core](https://www.npmjs.com/package/@nisli/core)** — a zero-dependency reactive web component framework. Signals, templates, dependency injection — no build step, no virtual DOM, no dependencies. 660 lines of TypeScript that do what React needs 200KB for.

```typescript
import { component, html, signal, computed } from '@nisli/core';

const count = signal(0);
const doubled = computed(() => count.value * 2);

component('my-counter', () => {
  return html`
    <button @click=${() => count.value++}>
      ${count} × 2 = ${doubled}
    </button>
  `;
});
```

**[backlog-mcp](https://github.com/gkoreli/backlog-mcp)** — an MCP server that gives AI agents their own task management system. Agents can create tasks, track progress, attach artifacts, and search their own work history. It's the missing piece that makes multi-agent delegation actually work.

## This blog is the proof

You're reading a site built with `@nisli/core`. The build pipeline is a custom SSG — markdown goes in, static HTML comes out, and `@nisli/core` web components handle the interactive parts. The theme toggle in the sidebar? That's a `<nisli-theme-toggle>` component using signals and effects. The code blocks you see above? Shiki dual themes — both light and dark colors rendered at build time, switching with zero JavaScript.

No React. No Next.js. No Gatsby. Just my framework, some markdown, and esbuild.

## Why write about it?

Because the content landscape for this kind of work is thin. There's plenty of AI hype, plenty of prompt engineering tips, plenty of "I built an app with Claude" threads. But almost nobody writes about:

- How to design multi-agent delegation systems that actually work
- The real decisions, failures, and trade-offs of building with agents daily
- What it means to build your own tools and use them in production
- How the role of "software engineer" is evolving for people who embrace this shift

This blog is a builder's journal. I'll write about what I build, how I build it, and what I learn along the way. Specifics over polish. Decisions over tutorials.

Let's go.
