import { staticHtml as html, raw } from '@nisli/core/static';

const ext = (url: string) => raw(`href="${url}" target="_blank" rel="noopener"`);

export function aboutPage() {
  return html`<article class="post-content">
  <h1>Goga Koreli</h1>

  <blockquote>"I'd rather be stuck on a hard problem than coast on easy ones."</blockquote>

  <p>After a decade of software engineering, I'm going through a mental shapeshift. The boundaries between engineer, product thinker, and architect are dissolving — and AI agents are the catalyst. I'm calling this new way of working <em>agentic product engineering</em>.</p>

  <p>There's a lot of hype, misinformation, and ambiguity out there. This blog exists because we need honest, grounded writing about what it actually means to build with agents — the real principles, not the marketing. This isn't only software engineering anymore. We're crossing boundaries.</p>

  <p>I'm documenting the shift as I live it: the concepts, the mental models, the open source tools I'm building along the way, and the things I get wrong. If you're going through the same transition, I hope this helps.</p>

  <p>This site is that record — a personal publication. One author, many forms, one sensibility.</p>

  <h2>Projects</h2>

  <p><a ${ext('https://github.com/gkoreli/ghx')}>ghx</a> — Auditable code reconnaissance for AI agents. A specialized sidecar explores GitHub and returns schema-validated claims, evidence, commands, and uncertainty instead of a transcript.</p>

  <p><a ${ext('https://github.com/gkoreli/backlog-mcp')}>backlog-mcp</a> — Local-first context, memory, and work history for AI agents. Agents orient, recall decisions, attach artifacts, and search their own history while humans retain plain markdown they can read and diff.</p>

  <p><a ${ext('https://www.npmjs.com/package/@nisli/core')}>@nisli/core</a> — A zero-dependency reactive web component framework. Born from building backlog-mcp's web viewer, with fine-grained signals, light-DOM templates, dependency injection, routing, and static generation.</p>

  <p><a ${ext('https://github.com/gkoreli/blog')}>gkoreli.com</a> — This publication. Built with @nisli/core and deployed on Cloudflare Workers. The source is public.</p>

  <h2>Connect</h2>

  <p>Find me on <a ${ext('https://github.com/gkoreli')}>GitHub</a>, <a ${ext('https://x.com/GogaKoreli')}>X</a> and <a ${ext('https://www.linkedin.com/in/goga-koreli/')}>LinkedIn</a>.</p>
</article>`;
}
