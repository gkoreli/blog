import { html } from '@nisli/core';
import { toolNavigation } from './tool-navigation.js';
import { siteCheckForm } from './site-check-form.js';

export function toolsPage() {
  return html`<article class="tools-page tool-app ai-check">
    ${toolNavigation('overview')}
    <header class="tools-hero"><p class="tool-kicker">The publication’s workbench</p><h1>Tools for a more<br>readable web.</h1><p class="tools-lead">Check what reaches a client. Understand a crawler policy. See what changed after a fix.</p></header>
    <section class="tools-start" aria-labelledby="tools-check-heading">
      <div class="tools-start-description"><span class="tool-number">01 / START WITH A PAGE</span><h2 id="tools-check-heading">AI access check</h2><p>A technical score, the evidence behind it, and your next steps.</p><a href="/ai-check/example#access-report">Explore a saved report <span aria-hidden="true">↗</span></a><span class="tool-caption">No check used</span></div>
      <div class="tools-start-form">${siteCheckForm()}<p class="tool-caption">Checking requests the public page and a bounded set of files on its site. <a href="/privacy">Privacy</a> · <a href="/ai-check#score-method">How it works</a></p></div>
    </section>
    <div class="tools-section-label"><h2>Work with the evidence</h2><span>Local tools · unlimited · nothing uploaded</span></div>
    <div class="tools-local-grid">
      <a href="/tools/robots" class="tool-workbench-link"><span class="tool-number">02 / CRAWLER POLICY</span><h2>Robots playground <span aria-hidden="true">↗</span></h2><p>Try a client and a path. See the exact rule that allows or disallows crawling.</p><div class="tool-code-preview" aria-hidden="true"><span>User-agent: OAI-SearchBot</span><span>Allow: /guides/</span><span class="tool-preview-result">/guides/article <b>→ Allowed</b></span></div><span class="tool-workbench-action">Test a policy <span aria-hidden="true">→</span></span></a>
      <a href="/tools/compare" class="tool-workbench-link"><span class="tool-number">03 / BEFORE & AFTER</span><h2>Report comparison <span aria-hidden="true">↗</span></h2><p>Open two saved reports. Find the improvements, regressions and changes behind the total.</p><div class="tool-compare-preview" aria-hidden="true"><span>Before report <b>→</b> After report</span><span>Scores <i>·</i> Checks <i>·</i> Response evidence</span></div><span class="tool-workbench-action">Compare reports <span aria-hidden="true">→</span></span></a>
    </div>
    <section class="tools-request-row"><span class="tool-number">04</span><div><h2>Request inspector</h2><p>See what your own request tells this service: client declarations, network context and signature evidence.</p><span class="tool-caption">Uses the shared daily allowance</span></div><a href="/ai-check#ai-check-request-heading">Inspect a request <span aria-hidden="true">↗</span></a></section>
    <div class="separator"><img src="/icons/sparkle.svg" class="separator-icon" width="14" height="14" alt=""></div>
    <section class="tools-provenance"><h2>Built from the field notes.</h2><div><p>These tools grew out of this publication’s investigations into AI clients and the web. The methods and code are open; the observations come with their limits.</p><a href="/ai-site-check-evidence">Read the investigation</a><a href="https://github.com/gkoreli/blog/tree/main/packages/site-audit" target="_blank" rel="noopener">Source & scoring rules</a><a href="/api/ai-check/schema">Free JSON API</a></div></section>
  </article>`;
}
