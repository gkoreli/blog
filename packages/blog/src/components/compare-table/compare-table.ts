import { html } from '@nisli/core';

export function CompareTable({ headers, rows, highlightRows }: { headers: string[]; rows: string[][]; highlightRows?: number[] }) {
  const hl = new Set(highlightRows ?? []);
  return html`<div class="compare-table-scroll">
    <table class="compare-table">
      <thead><tr>${headers.map(h => html`<th>${h}</th>`)}</tr></thead>
      <tbody>${rows.map((r, i) => html`<tr class=${hl.has(i) ? 'ct-hl' : undefined}>
        ${r.map(c => html`<td>${c}</td>`)}
      </tr>`)}</tbody>
    </table>
  </div>`;
}
