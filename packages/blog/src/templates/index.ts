import { html } from 'nisli-static';
import type { PostMeta } from '../lib/frontmatter.js';

export function indexTemplate(posts: PostMeta[]) {
  const dateStr = (date: string) => date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return html`<div class="home">
  <section class="hero">
    <h1>Goga Koreli</h1>
    <h2>With agents actively engineering on:</h2>
    <div class="projects">
      <a href="https://github.com/gkoreli/backlog-mcp" class="project-card" target="_blank" rel="noopener">
        <div class="project-header"><img src="/icons/github.svg" width="16" height="16" alt=""><strong>backlog-mcp</strong></div>
        <p>Human-agent context engineering backlog</p>
      </a>
      <a href="https://www.npmjs.com/package/@nisli/core" class="project-card" target="_blank" rel="noopener">
        <div class="project-header"><img src="/icons/npm.svg" width="16" height="16" alt=""><strong>@nisli/core</strong></div>
        <p>Zero-dependency reactive web component framework</p>
      </a>
      <a href="https://github.com/gkoreli/blog" class="project-card" target="_blank" rel="noopener">
        <div class="project-header"><img src="/icons/pen.svg" width="16" height="16" alt=""><strong>gkoreli.com</strong></div>
        <p>Agentic product engineering blog</p>
      </a>
    </div>
    <p class="about-brief">There's a lot of hype and ambiguity out there about agentic engineering. This blog exists because we need honest, grounded writing about what it actually means to build with agents — the real principles, not the marketing.</p>
  </section>
  <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
  <section class="post-list">
    ${posts.map(p => html`<a href="/${p.slug}" class="post-preview">
      <article>
        <h3>${p.title}</h3>
        <time datetime="${p.date}">${dateStr(p.date)}${p.promptCount ? ` · ${p.promptCount} prompts` : ''}</time>
        <p>${p.description}</p>
      </article>
    </a>`)}
  </section>
</div>`;
}
