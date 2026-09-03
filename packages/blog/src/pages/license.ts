import { staticHtml as html, raw } from '@nisli/core/static';

export const LICENSE_CITATION_SENTENCE = 'Quoting and citing with attribution and a link to the canonical URL is always welcome.';

export function licensePage(contentLicenseHtml: string) {
  return html`<article class="post-content">
  ${raw(contentLicenseHtml)}
  <p>${LICENSE_CITATION_SENTENCE}</p>
</article>`;
}
