export const STATS_VIEWS = [
  { id: 'requests', label: 'Page requests', href: '/stats', description: 'Recorded page requests and their daily trend.' },
  { id: 'pages', label: 'Pages & sources', href: '/stats/pages', description: 'Top pages, reported referrers and transitions.' },
  { id: 'traffic', label: 'Traffic mix', href: '/stats/traffic', description: 'Request categories, client declarations and network countries.' },
  { id: 'agents', label: 'Agent access', href: '/stats/agent-access', description: 'Agent requests by article, declared client and served format.' },
  { id: 'reach', label: 'Article reach', href: '/stats/readership', description: 'Browser-signal article requests across four completed weeks.' },
  { id: 'evidence', label: 'Evidence', href: '/stats/evidence', description: 'Stored classification, network and signature evidence.' },
  { id: 'method', label: 'Method', href: '/stats/method', description: 'How this publication measures page requests.' },
] as const;

export type StatsView = typeof STATS_VIEWS[number]['id'];
export type RequestView = Exclude<StatsView, 'agents' | 'reach' | 'method'>;

/** Keep external bookmarks into the original combined report usable. */
export function legacyStatsPath(hash: string): string | undefined {
  if (hash === '#stats-agent-access' || hash.startsWith('#agent-access-')) return '/stats/agent-access';
  if (hash.startsWith('#stats-method')) return '/stats/method';
  if (/^#stats-(content|pages|referrers|transitions?|previous-pages|next-pages)(-|$)/.test(hash)) return '/stats/pages';
  if (/^#stats-(audience|traffic-mix|distribution|client-form|client-name|claims|countries|declarations)(-|$)/.test(hash)) return '/stats/traffic';
  if (/^#stats-(evidence|composition|fetch-metadata|kind-signature|client-evidence|signers|verification|vendor|directory|native)(-|$)/.test(hash)) return '/stats/evidence';
  return undefined;
}
