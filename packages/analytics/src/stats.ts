import type { D1Database } from '@cloudflare/workers-types';

export interface StatsQuery {
  /** Number of days to look back. Default: 30 */
  days?: number;
  /** Filter by path prefix */
  path?: string | undefined;
}

export interface StatsResponse {
  period: { start: string; end: string };
  totals: { views: number; visitors: number; ai_fetches: number };
  by_path: Array<{ path: string; views: number; visitors: number }>;
  by_country: Array<{ country: string; views: number }>;
  by_day: Array<{ date: string; views: number; visitors: number }>;
  by_referrer: Array<{ referrer: string; views: number }>;
}

export async function queryStats(db: D1Database, q: StatsQuery = {}): Promise<StatsResponse> {
  const days = q.days ?? 30;
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const pathFilter = q.path ? `AND path LIKE ?` : '';
  const bind = (stmt: D1PreparedStatement) =>
    q.path ? stmt.bind(since, `${q.path}%`) : stmt.bind(since);

  const [totals, byPath, byCountry, byDay, byReferrer, aiFetches] = await db.batch([
    bind(db.prepare(`SELECT COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors FROM page_views WHERE created_at >= ? AND visitor_type = 0 AND is_owner = 0 ${pathFilter}`)),
    bind(db.prepare(`SELECT path, COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors FROM page_views WHERE created_at >= ? AND visitor_type = 0 AND is_owner = 0 ${pathFilter} GROUP BY path ORDER BY views DESC LIMIT 50`)),
    bind(db.prepare(`SELECT country, COUNT(*) as views FROM page_views WHERE created_at >= ? AND visitor_type = 0 AND is_owner = 0 AND country IS NOT NULL ${pathFilter} GROUP BY country ORDER BY views DESC LIMIT 30`)),
    bind(db.prepare(`SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors FROM page_views WHERE created_at >= ? AND visitor_type = 0 AND is_owner = 0 ${pathFilter} GROUP BY date ORDER BY date`)),
    bind(db.prepare(`SELECT referrer, COUNT(*) as views FROM page_views WHERE created_at >= ? AND visitor_type = 0 AND is_owner = 0 AND referrer IS NOT NULL ${pathFilter} GROUP BY referrer ORDER BY views DESC LIMIT 20`)),
    bind(db.prepare(`SELECT COUNT(*) as count FROM page_views WHERE created_at >= ? AND visitor_type = 2 ${pathFilter}`)),
  ]);

  const t = (totals.results?.[0] ?? { views: 0, visitors: 0 }) as Record<string, number>;
  const ai = (aiFetches.results?.[0] ?? { count: 0 }) as Record<string, number>;

  return {
    period: { start: since, end: new Date().toISOString().slice(0, 10) },
    totals: { views: t.views ?? 0, visitors: t.visitors ?? 0, ai_fetches: ai.count ?? 0 },
    by_path: (byPath.results ?? []) as StatsResponse['by_path'],
    by_country: (byCountry.results ?? []) as StatsResponse['by_country'],
    by_day: (byDay.results ?? []) as StatsResponse['by_day'],
    by_referrer: (byReferrer.results ?? []) as StatsResponse['by_referrer'],
  };
}
