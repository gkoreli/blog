import { html, raw } from '@nisli/core';

export const LICENSE_CITATION_SENTENCE = 'Quoting and citing with attribution and a link to the canonical URL is always welcome.';

export function licensePage(contentLicenseHtml: string) {
  return html`<article class="post-content">
  <div html:inner=${raw(contentLicenseHtml)}></div>
  <p>${LICENSE_CITATION_SENTENCE}</p>
</article>`;
}
