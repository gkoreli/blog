import { html } from '@nisli/core';
import { navigationChoices, type NavigationChoice } from '../templates/navigation-choice.js';
import { toolCatalogue } from './tool-catalogue.js';

const exampleReport: readonly NavigationChoice[] = [{
  id: 'report', href: '/ai-check/example#access-report', label: 'View an example report',
  summary: 'A completed page check of gkoreli.com.', meta: 'Uses no daily checks', drawing: 'page',
}];

export function toolsPage() {
  return html`<article class="tools-page tool-app tools-library">
    <header class="tools-library-intro">
      <p class="tools-library-kicker">The publication’s workbench</p>
      <h1>Small tools.<br>Useful answers.</h1>
      <p>Check a page. Test a policy. Follow the evidence.</p>
    </header>
    ${navigationChoices(toolCatalogue, { label: 'Tools', idPrefix: 'tools' })}
    <div class="tools-library-example">
      ${navigationChoices(exampleReport, { label: 'Example report', idPrefix: 'tools-example', layout: 'rows' })}
    </div>
    <details class="tools-library-usage">
      <summary>Free usage &amp; limits</summary>
      <div class="tools-library-usage-body">
        <p>All four tools are free. No account or API key needed.</p>
        <dl>
          <dt>Page check &amp; Request inspector</dt>
          <dd>10 checks per day, shared by both tools. The limit applies to your public IP address and resets at 00:00 UTC.</dd>
          <dt>Robots playground &amp; Report comparison</dt>
          <dd>Unlimited use in your browser. Your inputs aren’t uploaded.</dd>
        </dl>
      </div>
    </details>
    <nav class="tools-library-resources" aria-label="Documentation and source"><a href="/ai-site-check-evidence">How the checks work</a><a href="/api/ai-check/schema">API schema (JSON)</a><a href="https://github.com/gkoreli/blog/tree/main/packages/site-audit" target="_blank" rel="noopener">Source code</a></nav>
  </article>`;
}
