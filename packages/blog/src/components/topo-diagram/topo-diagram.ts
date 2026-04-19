import { staticHtml as html } from '@nisli/core/static';

export function TopoDiagram({ mode }: { mode: 'centralized' | 'decentralized' | 'distributed' }) {
  return html`<nisli-topo-diagram mode="${mode}"></nisli-topo-diagram>`;
}
