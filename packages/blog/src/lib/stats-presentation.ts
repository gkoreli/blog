import { readerGroupOf, type StatsResponse, type TrafficFilter } from '@gkoreli/analytics/contracts';

export const TRAFFIC_LABELS: Record<TrafficFilter, string> = {
  all: 'All request categories', browser: 'Browser signals', agents: 'Assistants & signed clients',
  crawlers: 'Crawlers', automation: 'Automation & legacy rules', unresolved: 'Unresolved',
};
export const TRAFFIC_GROUPS = ['browser', 'agents', 'crawlers', 'automation', 'unresolved'] as const;

/** Existing disjoint request groups, derived from the same included rows as the headline. */
export function trafficMix(rows: StatsResponse['byKind']): Array<{ group: Exclude<TrafficFilter, 'all'>; label: string; views: number }> {
  return TRAFFIC_GROUPS.map(group => ({ group, label: TRAFFIC_LABELS[group],
    views: rows.filter(row => readerGroupOf(row.kind) === group).reduce((sum, row) => sum + row.views, 0),
  }));
}
