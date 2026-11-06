import { html } from '@nisli/core';
import { toolNavigation } from './tool-navigation.js';

export function toolsPage() {
  return html`<article class="tools-page tool-app">
    ${toolNavigation('overview')}
    <header class="tools-hero">
      <p class="tool-kicker">From this publication</p>
      <h1>Tools</h1>
      <p class="tools-lead">Free utilities for page access and crawler policies. Each result comes with the evidence behind it and a practical next step.</p>
      <p class="tool-caption">No account needed · Open source · Free JSON API</p>
    </header>
    <section class="tools-collection" aria-labelledby="tools-collection-heading">
      <h2 id="tools-collection-heading" class="sr-only">Available tools</h2>
      <a href="/ai-check" class="tool-feature">
        <div><span class="tool-number">01 / CHECK A PAGE</span><h2>AI access check</h2><p>Start with a URL. Check delivery, source content and indexing, then see what needs attention.</p><span class="tool-caption">10 checks per network address / day</span><span class="tool-feature-action">Check a URL <span aria-hidden="true">→</span></span></div>
        <div class="tool-blueprint"><span class="blueprint-label">THE 100-POINT RUBRIC</span><div class="blueprint-row"><span>Page delivery</span><b>40</b><i style="--bar:100%"></i></div><div class="blueprint-row"><span>HTML content</span><b>40</b><i style="--bar:100%"></i></div><div class="blueprint-row"><span>Indexing</span><b>20</b><i style="--bar:50%"></i></div><span class="blueprint-foot">Unknown evidence stays visible.</span></div>
      </a>
      <p class="tools-example-link"><a href="/ai-check/example#access-report">Explore a saved example report →</a><span>No check used</span></p>
      <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
      <div class="tool-list">
        <a href="/tools/robots" class="tool-row"><span class="tool-number">02</span><div><h2>Robots playground</h2><p>Try a client and path against your robots.txt. See which rule wins and why.</p><span class="tool-caption">Local · unlimited · nothing uploaded</span></div><span class="tool-row-arrow" aria-hidden="true">↗</span></a>
        <a href="/tools/compare" class="tool-row"><span class="tool-number">03</span><div><h2>Report comparison</h2><p>Compare two saved reports to find improvements, regressions and changes the total score can hide.</p><span class="tool-caption">Local · unlimited · nothing uploaded</span></div><span class="tool-row-arrow" aria-hidden="true">↗</span></a>
        <a href="/ai-check#ai-check-request-heading" class="tool-row"><span class="tool-number">04</span><div><h2>Request inspector</h2><p>Inspect your client declarations, network context and signature evidence as separate facts.</p><span class="tool-caption">Uses the shared daily allowance</span></div><span class="tool-row-arrow" aria-hidden="true">↗</span></a>
      </div>
    </section>
    <section class="tools-principle"><div><span class="tool-kicker">The method is open</span><h2>Follow the evidence.</h2></div><div><p>Every deduction points to an observed check. Optional formats stay optional. A technical score helps you improve access; it cannot promise rankings or AI citations.</p><p><a href="https://github.com/gkoreli/blog/tree/main/packages/site-audit" target="_blank" rel="noopener">Read the source and scoring rules →</a></p></div></section>
    <div class="tool-resource-links"><a href="/api/ai-check/schema">JSON API reference <span aria-hidden="true">↗</span></a><a href="/stats">Publication analytics <span aria-hidden="true">↗</span></a></div>
  </article>`;
}
