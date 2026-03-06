---
title: "The Agentic Product Engineer"
date: 2026-03-05
description: "Software engineering isn't going away — writing code without agents is. The role is expanding, not shrinking. Here's what that actually means."
tags: [agentic-engineering, context-engineering, nisli, backlog-mcp]
---

# The Agentic Product Engineer

There are three takes on AI and software engineering right now, and they're all wrong:

1. **"AI will replace engineers entirely"** — it won't. Engineering is expanding, not disappearing.
2. **"Who needs engineers? Anyone can build with AI"** — building something that looks cool in two days is not the same as building something useful.
3. **"AI code is garbage, real engineers write their own"** — technically LLMs hallucinate, yes. But there are ways to minimize hallucination rates by orders of magnitude. That's a skill, not a limitation.

Here's what's actually happening: writing code without agent assistance is going away. Software engineering is not.

## The real shift

The responsibility lines are blurring. Engineers can now own product, design, research, architecture, and execution — not just code. But this isn't exclusive to engineers. Product managers who learn to steer agents can build. Designers who understand the tools can ship.

The role that's emerging — the agentic product engineer — isn't defined by your job title. It's defined by whether you've internalized a new mental model.

**Who thrives:**
- People who learn how agents work in depth — the tools, techniques, best practices, and anti-patterns
- People who shift their mental model entirely, not just bolt AI onto existing workflows
- People who understand *why*, *how*, and *what* — and can steer agents through hard problems

**Who struggles:**
- Skeptics who dismiss agents because "all they do is hallucinate"
- People who misuse agents or don't understand how to work with them effectively
- People who have access to the tools but haven't changed how they think

Whoever masters the agentic mental model will outpace outdated engineering, product, and design processes. It can apply to anyone — but whoever is operating with this mental model correctly is not the one at risk.

## The depth problem

Now that engineering itself is no longer the bottleneck, what matters is *what you build* and *how you steer the agents*.

Everyone loves building shiny new toys. You get a dopamine hit from spinning up something that looks cool in two days. But building something actually useful requires dedication and a much deeper understanding of how things work.

Here's what I've learned from building with agents daily: they resist exploring unfamiliar territory. When you push an agent into a problem space it wasn't trained on, it pushes back. It suggests simpler alternatives. It defaults to naive, average solutions — because that's what general-knowledge LLMs are trained to produce.

When an agent hits a roadblock and decides to pivot to a simpler solution — that's the moment that matters. Do you let it? Or do you stop it, make it double down, come up with evidence for why one approach is better, and reason through the problem instead of jumping to conclusions?

Someone without depth will pivot with the agent. They'll end up with another average product in the graveyard of average products — because anyone else can rebuild the same thing with their $20 subscription in less than a week.

> The skill to master isn't prompting — prompting was 2025. In 2026, it's context engineering.

## Context engineering and backlog-mcp

Context engineering is the biggest pain point I face right now, and it's why I built [backlog-mcp](https://github.com/gkoreli/backlog-mcp).

When you work with agents at scale, you accumulate data at an unprecedented pace — tasks, decisions, architecture records, research artifacts. Without a system to organize and retrieve it, that data is useless. With the right system, it's gold.

[backlog-mcp](https://github.com/gkoreli/backlog-mcp) is an MCP server that gives AI agents their own task management system:

- **`backlog_search`** — semantic search across everything you've ever worked on, powered by vector embeddings
- **`backlog_context`** — engineer the right context before starting any task by finding related past work
- **Live activity panel** — every agent action logged and visible in real time
- **Disk-first storage** — every task mutation stored on your filesystem, not in a cloud you don't control

The mutation layer is agent-first: agents create, update, and organize. The reading layer is human-first — a readonly [backlog-viewer](https://github.com/gkoreli/backlog-mcp) where you can wrap your mind around everything. Global semantic search, live activity feed, full task history.

![backlog-mcp viewer UI](/images/backlog-viewer-ui.png)

My future goal: train my own model on the personal data I'm accumulating. All the work, all the distillation, all the decisions — this data is uniquely valuable because it captures not just code, but the reasoning behind it.

## @nisli/core — born from real pain

[@nisli/core](https://www.npmjs.com/package/@nisli/core) didn't start as a framework project. It started because the [backlog-viewer](https://github.com/gkoreli/backlog-mcp) was falling apart.

The viewer had grown into a proper web application — global search, live activity panel, full task management UI. But it was built with vanilla web components, and at some point polling would re-render entire pages. I'd lose track of what I was looking at. The code was becoming unmaintainable.

So I built a framework. Zero dependencies. ~2,600 lines of TypeScript. A mix of everything I've loved from a decade of working with UI frameworks:

- **Angular's** dependency injection
- **Signals** — the pattern trending across the ecosystem
- **Lit's** HTML templating engine
- **Vue's** reactivity model
- **React's** functional components

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

Built over a weekend. Full migration of the backlog-viewer with zero regressions. The entire journey — every architecture decision, every migration step — is captured in the [git history](https://github.com/gkoreli/backlog-mcp). nisli/core lives inside the backlog-mcp monorepo, and I'll continue building both.

## This blog is the proof

You're reading a site built with [@nisli/core](https://www.npmjs.com/package/@nisli/core). The build pipeline is a custom SSG — markdown in, static HTML out, [nisli web components](https://www.npmjs.com/package/@nisli/core) for interactivity. The theme toggle in the sidebar? Signals and effects. The code blocks? [Shiki](https://shiki.style/) dual themes rendered at build time, switching with zero JavaScript.

No React. No Next.js. No Gatsby. Just [my framework](https://www.npmjs.com/package/@nisli/core), some markdown, and [esbuild](https://esbuild.github.io/). See it in action at [gkoreli.com](https://gkoreli.com).

## How this blog is written

> I use AI agents heavily, including for writing these articles. But this is not AI slop. Far from it.

What I do is feed the agent with golden data — my perspective, my experience, the specific problems I've faced, the lessons I've learned from doubling down instead of pivoting. The agent helps me write. I provide the substance.

Every post on this blog will include:

- **The raw prompts** I wrote to generate it — my actual thinking, unpolished
- **The polished output** — what the agent produced from that input
- **The edits** — what I changed and why

So you can judge for yourself. You can see the human reasoning behind the AI-assisted writing and decide whether coming back here is worth your time.

I merged 100 PRs in a month building these tools. I have many more to build and lessons to share. This blog is a builder's journal — specifics over polish, decisions over tutorials.

Next up: how [@nisli/core](https://www.npmjs.com/package/@nisli/core)'s template engine works — and why zero dependencies is a design decision, not a constraint.
