import { html } from '@nisli/core';
import { STATS_VIEWS, type StatsView } from '../lib/stats-views.js';

export function statsHeader(current: StatsView) {
  const endpoint = current === 'agents' ? '/api/agent-access' : current === 'reach' ? '/api/readership' : '/api/stats?range=30d&traffic=all';
  return html`<header class="stats-masthead">
    <h1>Stats</h1>
    ${current !== 'method' ? html`<a class="stats-export" id=${current === 'reach' ? 'reach-json-link' : 'stats-json-link'} href=${endpoint}>Report JSON</a>` : ''}
  </header>
  <nav class="stats-views" aria-label="Stats views">${STATS_VIEWS.map(view => html`<a
    href=${view.href} aria-current=${view.id === current ? 'page' : undefined}
    data-request-link=${view.id !== 'agents' && view.id !== 'reach' ? '' : undefined}>${view.label}</a>`)}</nav>`;
}
