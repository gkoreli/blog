import { staticHtml as html } from '@nisli/core/static';

export function CompareTable({ headers, rows, highlightRows }: { headers: string[]; rows: string[][]; highlightRows?: number[] }) {
  const hl = new Set(highlightRows ?? []);
  return html`<table class="compare-table">
    <thead><tr>${headers.map(h => html`<th>${h}</th>`)}</tr></thead>
    <tbody>${rows.map((r, i) => html`<tr${hl.has(i) ? ' class="ct-hl"' : ''}>
      ${r.map(c => html`<td>${c}</td>`)}
    </tr>`)}</tbody>
  </table>`;
}
