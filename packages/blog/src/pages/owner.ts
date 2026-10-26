import { html } from '@nisli/core';

export function ownerPage() {
  return html`<article class="owner-page">
    <h1>Exclude my browser</h1>
    <p>Mark this browser’s current daily identity as yours so its recorded requests are excluded from public analytics.</p>
    <p>This applies to this browser, its current network address and User-Agent, and the current UTC day. Repeat after midnight UTC or when those inputs change. Existing cached reports can take up to one hour to reflect the mark.</p>
    <form id="owner-form" method="post" action="/api/owner">
      <label for="owner-credential">Owner credential</label>
      <input id="owner-credential" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" required>
      <p>The credential is sent only to this site’s owner endpoint. This page clears the field after submission and does not save it in browser storage.</p>
      <button type="submit" id="owner-submit" disabled>Exclude this browser for today</button>
    </form>
    <noscript><p>Enable JavaScript to submit the credential securely through the owner endpoint.</p></noscript>
    <div id="owner-status" role="status" aria-live="polite"></div>
    <p id="owner-next" hidden>Next, <a href="/privacy" target="_blank" rel="noopener">open the verification page</a> in this browser. Its stored event and exclusion from public reports can then be checked.</p>
    <p>This setup page is excluded from page-view collection even before marking. It does not identify you as a person or prove that every browser you use is covered.</p>
  </article>`;
}
