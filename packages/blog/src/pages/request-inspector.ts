import { html } from '@nisli/core';
import { toolNavigation } from './tool-navigation.js';

export function requestInspectorPage() {
  return html`<article class="ai-check request-inspector tool-app">
    ${toolNavigation('request')}
    <header class="ai-check-header"><p class="tool-kicker">Request evidence · free inspection</p><h1>Request inspector</h1><p class="ai-check-lead">See what your request reveals. Inspect its reported referrer, navigation context, client declarations and verification evidence.</p></header>
    <request-evidence-check>
      <button type="button" data-request-check hidden>Inspect this request</button>
      <p class="tool-caption">10 checks per network address per UTC day, shared with <a href="/ai-check">Page check</a>. Each inspection uses one check.</p>
      <div data-request-status role="status" aria-live="polite" aria-atomic="true"></div>
      <div data-request-results></div>
    </request-evidence-check>
    <p class="ai-check-note"><a href="/api/request-check">Open as JSON (uses a check)</a>. This link also works without JavaScript.</p>
    <section class="ai-check-method"><h2>What the inspector shows</h2><ol class="ai-check-chain"><li><strong>Reported context</strong><span>Referrer state, navigation signals and whether the source and site-relationship claims agree.</span></li><li><strong>Client declarations</strong><span>Client names, browser-family and form claims, kept separate from verified evidence.</span></li><li><strong>Verification</strong><span>Network-list results, available signatures and their coverage. Missing evidence stays unknown.</span></li></ol><p>The button inspects a fetch sent from this page. Opening the JSON link sends a navigation request, so its evidence can differ. Neither reconstructs how you first arrived here or inspects traffic arriving at another site.</p><p class="ai-check-note">A reported referrer does not authenticate its source or establish a new search click. Referrer URLs, raw user agents and network addresses are not returned by this assessment.</p></section>
    <section class="ai-check-api"><p class="tool-kicker">For scripts and agents</p><h2>Inspect a request as JSON</h2><p>Call the endpoint from the client you want to inspect. It assesses the request that reaches this service and uses the same shared allowance.</p><details><summary>API request example</summary><pre><code>curl https://gkoreli.com/api/request-check</code></pre></details><p><a href="/api/ai-check/schema">API reference</a> · <a href="/privacy">Privacy and retention</a> · <a href="https://github.com/gkoreli/blog/blob/main/packages/analytics/src/request-assessment.ts" target="_blank" rel="noopener">Assessment source</a></p></section>
  </article>`;
}
