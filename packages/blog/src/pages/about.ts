import { html } from '@nisli/core';
import { navigationChoices } from '../templates/navigation-choice.js';
import { projectCatalogue } from './project-catalogue.js';

export function aboutPage() {
  return html`<article class="post-content">
  <h1>Goga Koreli</h1>

  <blockquote>"I'd rather be stuck on a hard problem than coast on easy ones."</blockquote>

  <p>After a decade of software engineering, I'm going through a mental shapeshift. The boundaries between engineer, product thinker, and architect are dissolving — and AI agents are the catalyst. I'm calling this new way of working <em>agentic product engineering</em>.</p>

  <p>There's a lot of hype, misinformation, and ambiguity out there. This blog exists because we need honest, grounded writing about what it actually means to build with agents — the real principles, not the marketing. This isn't only software engineering anymore. We're crossing boundaries.</p>

  <p>I'm documenting the shift as I live it: the concepts, the mental models, the open source tools I'm building along the way, and the things I get wrong. If you're going through the same transition, I hope this helps.</p>

  <p>This site is that record — a personal publication. One author, many forms, one sensibility.</p>

  <h2>Projects</h2>

  ${navigationChoices(projectCatalogue(), { label: 'Projects', idPrefix: 'about-project', layout: 'rows', headingLevel: 3 })}

  <h2>Tools</h2>

  <p>The <a href="/tools">engineering tools</a> include page access checks, a local robots playground and saved-report comparison. <a href="/ai-check">AI Access Check</a> inspects crawler rules, delivered HTML, indexing controls and machine-readable links for a public page. Inspect the evidence in the browser or use the free daily API allowance.</p>

  <h2>Explore the site</h2>

  <p>The <a href="/design-language">Design Language</a> collects the site's typography, colors, and visual ideas. The <a href="/animations-lab">Animations Lab</a> is a collection of motion experiments behind the articles.</p>

  <h2>Connect</h2>

  <p>Find me on <a href="https://github.com/gkoreli" target="_blank" rel="noopener">GitHub</a>, <a href="https://x.com/GogaKoreli" target="_blank" rel="noopener">X</a> and <a href="https://www.linkedin.com/in/goga-koreli/" target="_blank" rel="noopener">LinkedIn</a>.</p>
</article>`;
}
