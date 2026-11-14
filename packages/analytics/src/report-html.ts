import type { ReaderKind, StatsResponse } from './contracts.js';

function escape(value: string): string {
  return value.replace(/[&<>"']/g, character => character === '&' ? '&amp;' : character === '<' ? '&lt;'
    : character === '>' ? '&gt;' : character === '"' ? '&quot;' : '&#39;');
}
const labels: Record<ReaderKind, string> = {
  browser: 'Browser signals', 'ai-assistant': 'Declared assistant', 'ai-search': 'AI search crawler',
  'ai-crawler': 'AI crawler', 'search-crawler': 'Search crawler', 'seo-crawler': 'SEO crawler',
  'preview-or-feed': 'Preview or feed', 'headless-browser': 'Headless browser', 'http-client': 'HTTP client',
  'cloud-browser': 'Hosting-network browser signals', 'signed-agent': 'Signed client',
  'other-bot': 'Other bot', 'legacy-browser': 'Historical browser label', unresolved: 'Unresolved',
};

/** Presentation adapter for an already validated report. No SQL, classification
 * or browser script. Host applications own routing and access to the report.
 */
export function renderAnalyticsReport(report: StatsResponse, options: { title?: string } = {}): string {
  const title = escape(options.title ?? 'Website analytics');
  const link = (range: string) => {
    const params = new URLSearchParams({ range, traffic: report.filters.traffic });
    for (const key of ['path', 'agent', 'kind'] as const) {
      const value = report.filters[key];
      if (value !== null) params.set(key, value);
    }
    return escape('?' + params.toString());
  };
  const number = (n: number) => n.toLocaleString('en-US');
  const rows = (items: readonly { label: string; views: number }[]) => items.map(row => `<tr><th scope="row">${escape(row.label)}</th><td>${number(row.views)}</td></tr>`).join('');
  const kinds = new Map<string, number>();
  for (const row of report.byKind) kinds.set(labels[row.kind] ?? 'Unresolved', (kinds.get(labels[row.kind] ?? 'Unresolved') ?? 0) + row.views);
  const table = (caption: string, content: string) => `<table><caption>${caption}</caption><thead><tr><th scope="col">Group</th><th scope="col">Events</th></tr></thead><tbody>${content || '<tr><td colspan="2">No recorded events in this selection.</td></tr>'}</tbody></table>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>html{color-scheme:light dark;font-family:Georgia,serif;line-height:1.6}body{max-width:64rem;margin:auto;padding:2rem 1rem}h1,h2{line-height:1.2}a{color:inherit}nav{display:flex;gap:1rem;flex-wrap:wrap}table{border-collapse:collapse;width:100%;margin:2rem 0}caption{text-align:left;font-weight:bold;font-size:1.2rem}th,td{padding:.5rem;text-align:left;border-bottom:1px solid #888;overflow-wrap:anywhere}th:last-child,td:last-child{text-align:right;font-variant-numeric:tabular-nums}.metrics{font-size:1.3rem}small{display:block;max-width:75ch}p{max-width:75ch}</style></head><body><main><h1>${title}</h1>
<nav aria-label="Report period"><a href="${link('7d')}">7 days</a><a href="${link('30d')}">30 days</a><a href="/api/stats${link(report.filters.range)}">JSON report</a></nav>
<p>${escape(report.period.start)}–${escape(report.period.end)} UTC; includes the partial current day. Calculated <time>${escape(report.period.updatedAt)}</time>.</p>
<p>Selection: ${escape([report.filters.traffic, report.filters.path, report.filters.agent, report.filters.kind].filter(value => value !== null).join(' · '))}.</p>
<p class="metrics"><strong>${number(report.totals.views)}</strong> included page events · <strong>${number(report.totals.dailyClients)}</strong> rotating daily identifiers</p>
<small>Events are served requests. Daily identifiers are not people or sessions and cannot identify returning readers across days. Browser signals do not authenticate a human. People and agents both contribute to the observed audience.</small>
${table('Audience composition', rows([...kinds].map(([label, views]) => ({ label, views }))))}
${table('Pages', rows(report.byPath.slice(0, 20).map(row => ({ label: row.path, views: row.views }))))}
${table('Declared clients', rows(report.byAgent.slice(0, 20).map(row => ({ label: row.agentName, views: row.views }))))}
<p>Client names are declarations. A verified signature authenticates only its covered components; it does not establish reading, a human trigger or an unsigned client name. Detailed verification and missing-evidence counts are available in the JSON report.</p>
${table('Recorded referral hosts', rows(report.byReferrer.slice(0, 20).map(row => ({ label: row.referrerHost, views: row.views }))))}
<p>Owner marks and the current referral policy are excluded. Missing referrers remain unknown; referral events do not measure new search clicks. Use composition and source concentration alongside totals before choosing an action.</p>
</main></body></html>`;
}
