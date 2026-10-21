import { html } from '@nisli/core';

export function TopoDiagram({ mode }: { mode: 'centralized' | 'decentralized' | 'distributed' }) {
  return html`<nisli-topo-diagram mode="${mode}"></nisli-topo-diagram>`;
}
