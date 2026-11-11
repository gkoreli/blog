import { html } from '@nisli/core';
import { navigationChoices } from '../templates/navigation-choice.js';
import { toolCatalogue } from './tool-catalogue.js';

export function toolsPage() {
  return html`<article class="tools-page tool-app tools-library">
    <header class="tools-library-intro">
      <p class="tools-library-kicker">The publication’s workbench</p>
      <h1>Small tools.<br>Useful answers.</h1>
      <p>Check a page. Test a policy. Follow the evidence.</p>
    </header>
    ${navigationChoices(toolCatalogue, { label: 'Tools', idPrefix: 'tools' })}
    <section class="tools-library-example">
      <span>A good place to start</span>
      <h2><a href="/ai-check/example#access-report">Explore a saved report</a></h2>
      <p>No page to check? See how the evidence fits together.</p>
    </section>
    <p class="tools-library-allowance">No account needed. Page checks and request inspection share 10 checks per network address per UTC day. The local tools use no allowance.</p>
    <footer class="tools-library-provenance"><span>From the field notes.</span><a href="/ai-site-check-evidence">Investigation</a><a href="/api/ai-check/schema">JSON API</a><a href="https://github.com/gkoreli/blog/tree/main/packages/site-audit" target="_blank" rel="noopener">Source</a></footer>
  </article>`;
}
