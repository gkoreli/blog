import { html } from 'nisli-static';
import type { PostMeta } from '../lib/frontmatter.js';

export function indexTemplate(posts: PostMeta[]) {
  const dateStr = (date: string) => date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return html`<div class="home">
  <section class="hero">
    <h1>Goga Koreli</h1>
    <h2>Me and my agents are actively engineering:</h2>
    <div class="projects">
      <a href="https://github.com/gkoreli/backlog-mcp" class="project-card" target="_blank" rel="noopener">
        <img src="/icons/github.svg" width="18" height="18" alt="">
        <strong>backlog-mcp</strong>
        <p>Human-agent context engineering backlog</p>
      </a>
      <a href="https://www.npmjs.com/package/@nisli/core" class="project-card" target="_blank" rel="noopener">
        <img src="/icons/npm.svg" width="18" height="18" alt="">
        <strong>@nisli/core</strong>
        <p>Zero-dependency reactive web component framework</p>
      </a>
      <a href="https://github.com/gkoreli/blog" class="project-card" target="_blank" rel="noopener">
        <img src="/icons/pen.svg" width="18" height="18" alt="">
        <strong>gkoreli.com</strong>
        <p>Agentic product engineering blog</p>
      </a>
    </div>
    <div class="about">
      <p>After a decade of software engineering, I'm going through a mental shapeshift. The boundaries between engineer, product thinker, and architect are dissolving — and AI agents are the catalyst. I'm calling this new way of working <em>agentic product engineering</em>.</p>
      <p>There's a lot of hype, misinformation, and ambiguity out there. This blog exists because we need honest, grounded writing about what it actually means to build with agents — the real principles, not the marketing. This isn't only software engineering anymore. We're crossing boundaries.</p>
      <p>I'm documenting the shift as I live it: the concepts, the mental models, the open source tools I'm building along the way, and the things I get wrong. If you're going through the same transition, I hope this helps.</p>
    </div>
  </section>
  <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
  <section class="post-list">
    <h2>Posts</h2>
    ${posts.map(p => html`<a href="/${p.slug}" class="post-preview">
      <article>
        <h3>${p.title}</h3>
        <time datetime="${p.date}">${dateStr(p.date)}</time>
        <p>${p.description}</p>
      </article>
    </a>`)}
  </section>
</div>`;
}
