import { html } from '@nisli/core';

export function toolsPage() {
  return html`<article class="tools-page">
    <header class="tools-hero">
      <p class="tool-kicker">The engineering workbench</p>
      <h1>A clearer view of<br>your site’s access.</h1>
      <p class="tools-lead">Find what stands between your page and an AI agent. Check a URL, test crawler rules, or compare the evidence after a change.</p>
      <div class="tools-hero-actions"><a class="tool-button" href="/ai-check">Check a page <span aria-hidden="true">↗</span></a><a class="tool-text-link" href="/ai-check/example">Explore an example report</a></div>
      <p class="tool-caption">Free tools. Open methods. Evidence you can inspect.</p>
      <div class="tools-instrument" aria-hidden="true"><span class="instrument-label">THE ACCESS CHAIN</span><div class="instrument-track"><span><b>01</b>Delivery</span><i></i><span><b>02</b>Content</span><i></i><span><b>03</b>Indexing</span></div><p>Observe → understand → improve</p></div>
    </header>
    <section class="tools-collection" aria-labelledby="tools-collection-heading">
      <div class="tool-section-heading"><h2 id="tools-collection-heading">Choose your next question</h2><span>Four practical tools</span></div>
      <div class="tools-grid">
        <a href="/ai-check" class="tool-card tool-card-featured"><span class="tool-card-top"><span class="tool-number">01 / SITE CHECK</span><span class="tool-badge">10 free checks / day</span></span><h3>Can agents access<br>this page?</h3><p>Get a technical access score, the fixes that matter, and the exact evidence behind them.</p><span class="tool-card-detail">HTTP delivery · source content · crawler policy · indexing</span><span class="tool-card-action">Check a public URL <span aria-hidden="true">↗</span></span></a>
        <a href="/tools/robots" class="tool-card"><span class="tool-card-top"><span class="tool-number">02 / POLICY PLAYGROUND</span><span class="tool-badge">Local · unlimited</span></span><h3>What do these<br>crawler rules allow?</h3><p>Paste a robots.txt, choose a client and path, and see which rule wins before you publish.</p><span class="tool-card-detail">Merged groups · longest match · Allow tie-break</span><span class="tool-card-action">Test your robots rules <span aria-hidden="true">↗</span></span></a>
        <a href="/tools/compare" class="tool-card"><span class="tool-card-top"><span class="tool-number">03 / REPORT COMPARISON</span><span class="tool-badge">Local · unlimited</span></span><h3>What changed<br>after the fix?</h3><p>Open two saved reports to compare scores, check states, policies and response evidence.</p><span class="tool-card-detail">Your files stay in your browser. No upload.</span><span class="tool-card-action">Compare saved reports <span aria-hidden="true">↗</span></span></a>
        <a href="/ai-check#ai-check-request-heading" class="tool-card"><span class="tool-card-top"><span class="tool-number">04 / REQUEST INSPECTOR</span><span class="tool-badge">Shared daily allowance</span></span><h3>What does your<br>request reveal?</h3><p>Inspect client declarations, network context and signature evidence as separate facts.</p><span class="tool-card-detail">The request reaching this service, not another site’s traffic.</span><span class="tool-card-action">Inspect an incoming request <span aria-hidden="true">↗</span></span></a>
      </div>
    </section>
    <section class="tools-principle"><span class="tool-kicker">Built for decisions</span><h2>A score gives you the overview.<br>The evidence tells you what to do.</h2><p>Every deduction points to an observed check and a next step. Optional formats stay optional. Unknown evidence stays visible.</p><p><a href="/api/ai-check/schema">Use the free JSON API</a> · <a href="/stats">Explore this publication’s analytics</a> · <a href="https://github.com/gkoreli/blog/tree/main/packages/site-audit" target="_blank" rel="noopener">Inspect the source</a></p></section>
  </article>`;
}
