import { html } from '@nisli/core';
import { CONTENT_LICENSE } from '../lib/license.js';

export const LICENSE_CITATION_SENTENCE = 'Quoting and citing with attribution and a link to the canonical URL is always welcome.';

export function licensePage() {
  return html`<article class="post-content policy-page">
  <p class="page-eyebrow">Reuse &amp; attribution</p>
  <h1>Content license</h1>
  <p>Published articles, essays and images on this site use
    <a href=${CONTENT_LICENSE.url}>Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International</a>.</p>
  <dl class="policy-summary">
    <div><dt>Sharing</dt><dd>Share unchanged material for noncommercial purposes, with attribution. Adaptations may not be distributed. The linked license contains the complete terms.</dd></div>
    <div><dt>Quoting &amp; citing</dt><dd>${LICENSE_CITATION_SENTENCE}</dd></div>
    <div><dt>Code</dt><dd>Source code and code snippets use the <a href="https://github.com/gkoreli/blog/blob/main/LICENSE-MIT">MIT License</a>.</dd></div>
  </dl>
  <p>© Goga Koreli — gkoreli.com</p>
</article>`;
}
