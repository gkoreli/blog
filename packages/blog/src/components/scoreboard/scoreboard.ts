import { staticHtml as html } from '@nisli/core/static';

export function Scoreboard({ title, rows }: { title: string; rows: { company: string; items: { label: string; isNew?: boolean }[] }[] }) {
  return html`<div class="scoreboard">
    <div class="scoreboard-header">${title}</div>
    ${rows.map(r => html`<div class="sb-row">
      <div class="sb-co">${r.company}</div>
      <div class="sb-items">
        ${r.items.map(i => html`<span class="sb-item${i.isNew ? ' sb-new' : ''}">${i.label}</span>`)}
      </div>
    </div>`)}
  </div>`;
}
