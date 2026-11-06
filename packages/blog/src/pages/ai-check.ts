import { html } from '@nisli/core';

export function aiCheckPage() {
  return html`<article class="ai-check post-content">
    <header class="ai-check-header">
      <p class="ai-check-eyebrow">Public engineering tools</p>
      <h1>Can AI agents access your page?</h1>
      <p class="ai-check-lead">Check crawler rules, delivered HTML, indexing controls and machine-readable links. Get the evidence and a list of fixes for one public URL.</p>
      <p class="ai-check-note">A successful fetch is one step toward discovery. It does not promise that an assistant will find, cite or use the page.</p>
    </header>

    <div id="ai-check-server-result"></div>
    <site-audit-check>
      <form class="ai-check-form" action="/ai-check" method="post">
        <label for="ai-check-url">Public HTTPS page</label>
        <div class="ai-check-input-row">
          <input id="ai-check-url" name="url" type="url" placeholder="https://example.com/article" required maxlength="2048" autocomplete="url" aria-describedby="ai-check-input-help">
          <button type="submit">Check access</button>
        </div>
        <p id="ai-check-input-help" class="ai-check-note">Ten checks per network address per UTC day, shared by this form and the free API. Use a public HTTPS URL without credentials, a query or a fragment.</p>
        <p class="ai-check-note">Checking sends requests from this service to the page and a bounded set of public files on its site. <a href="/privacy">Privacy and retention</a>.</p>
      </form>
      <p data-audit-status role="status" aria-live="polite" aria-atomic="true"></p>
      <div data-audit-results></div>
      <noscript><p>The form works without JavaScript and returns an HTML report. The same check is available as <a href="/api/ai-check/schema">a documented JSON API</a>.</p></noscript>
    </site-audit-check>

    <section class="ai-check-method" aria-labelledby="ai-check-method-heading">
      <h2 id="ai-check-method-heading">Follow the access chain</h2>
      <ol class="ai-check-chain">
        <li><strong>Permission</strong><span>Which robots rules apply to this exact path, separately for search, assistant and training controls?</span></li>
        <li><strong>Delivery</strong><span>What status, redirects, headers and HTML reach this checker? Do synthetic client declarations change the response?</span></li>
        <li><strong>Interpretation</strong><span>Is text already in the HTML? Are canonical, indexing, structured-data and alternate-format signals available?</span></li>
      </ol>
      <p class="ai-check-note">The checker does not run JavaScript or log into the site. A synthetic request with an AI bot’s name comes from this checker, not that provider’s network. Optional files such as llms.txt are reported as observed; their presence is no citation guarantee.</p>
    </section>

    <section class="ai-check-request" aria-labelledby="ai-check-request-heading">
      <h2 id="ai-check-request-heading">What does your request reveal?</h2>
      <p>Our analytics library keeps client declarations, browser-shaped headers, network evidence and verification separate. Inspect the request sent by this browser to see those distinctions. This uses one check from the same daily allowance.</p>
      <request-evidence-check>
        <button type="button" data-request-check hidden>Inspect this request</button>
        <p data-request-status role="status" aria-live="polite" aria-atomic="true"></p>
        <div data-request-results></div>
      </request-evidence-check>
      <p class="ai-check-note"><a href="/api/request-check">Inspect this request as JSON</a>. The JSON link examines a navigation request; the button examines its own fetch request. Their header shapes can differ. A declared name does not authenticate a provider or identify a person.</p>
    </section>

    <section class="ai-check-api" aria-labelledby="ai-check-api-heading">
      <h2 id="ai-check-api-heading">Use the free API</h2>
      <p>The same report is available to scripts and agents. No API key is required. The daily allowance is shared with the form above. Admitted checks count even when fetching fails.</p>
      <pre><code>curl https://gkoreli.com/api/ai-check \\
  -H 'Content-Type: application/json' \\
  -d '{"url":"https://example.com/article"}'</code></pre>
      <p><a href="/api/ai-check/schema">Request, response and quota contract</a> · <a href="https://github.com/gkoreli/blog/tree/main/packages/site-audit" target="_blank" rel="noopener">Source and tests</a></p>
      <p class="ai-check-note">Reports describe the bounded requests made at the recorded time. Firewall rules, location, authentication and provider-specific behavior can change what another client receives. Use the result to choose the next test.</p>
    </section>
  </article>`;
}
