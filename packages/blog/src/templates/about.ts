import { html } from 'nisli-static';

export function aboutTemplate() {
  return html`<article class="post-content">
  <h1>About</h1>

  <p>After a decade of software engineering, I'm going through a mental shapeshift. The boundaries between engineer, product thinker, and architect are dissolving — and AI agents are the catalyst. I'm calling this new way of working <em>agentic product engineering</em>.</p>

  <p>There's a lot of hype, misinformation, and ambiguity out there. This blog exists because we need honest, grounded writing about what it actually means to build with agents — the real principles, not the marketing. This isn't only software engineering anymore. We're crossing boundaries.</p>

  <p>I'm documenting the shift as I live it: the concepts, the mental models, the open source tools I'm building along the way, and the things I get wrong. If you're going through the same transition, I hope this helps.</p>

  <h2>Projects</h2>

  <p><a href="https://github.com/gkoreli/backlog-mcp">backlog-mcp</a> — A human-agent context engineering backlog. Task management designed for AI agent workflows — agents create tasks, track progress, attach artifacts, and search their own work history.</p>

  <p><a href="https://www.npmjs.com/package/@nisli/core">@nisli/core</a> — A zero-dependency reactive web component framework. Born from building backlog-mcp's web viewer — signals, templates, and dependency injection in ~2,600 lines of TypeScript.</p>

  <p><a href="https://github.com/gkoreli/blog">gkoreli.com</a> — This blog. Built with @nisli/core, deployed on GitHub Pages via Cloudflare. The source is public.</p>

  <h2>Connect</h2>

  <p>Find me on <a href="https://github.com/gkoreli">GitHub</a>, <a href="https://www.npmjs.com/~gkoreli">npm</a>, and <a href="https://www.linkedin.com/in/goga-koreli/">LinkedIn</a>.</p>
</article>`;
}
