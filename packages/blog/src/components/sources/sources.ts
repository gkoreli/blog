import { staticHtml as html } from '@nisli/core/static';

export function Sources({ items }: { items: { claim: string; why?: string; ref: string; url?: string }[] }) {
  return html`<div class="radar-sources">
    <div class="radar-sources-title">Sources & Evidence</div>
    <div class="radar-sources-grid">
      ${items.map(s => html`<div class="src-item">
        <div class="src-content">
          <span class="src-claim">${s.claim}</span>
          ${s.why ? html`<span class="src-why"><span aria-hidden="true">•</span> ${s.why}</span>` : ''}
        </div>
        <span class="src-ref">${s.url ? html`<a href="${s.url}" target="_blank" rel="noopener">${s.ref}</a>` : s.ref}</span>
      </div>`)}
    </div>
  </div>`;
}
