import type { D1Database } from '@cloudflare/workers-types';
import { daysAgo, localToday, shiftToLocal } from './dates.js';

/** Visitor type filter for the stats API */
export type VisitorFilter = 'human' | 'bot' | 'ai' | 'all';

export interface StatsQuery {
  /** Number of days to look back. Default: 30 */
  days?: number;
  /** Filter by path prefix */
  path?: string | undefined;
  /** UTC offset in minutes (e.g. -480 for PST). Default: 0 (UTC) */
  tz?: number;
  /** Visitor type filter. Default: 'human' */
  visitor?: VisitorFilter;
}

export interface StatsResponse {
  period: { start: string; end: string };
  totals: { views: number; visitors: number; ai_fetches: number };
  by_path: Array<{ path: string; views: number; visitors: number }>;
  by_country: Array<{ country: string; views: number }>;
  by_day: Array<{ date: string; views: number; visitors: number }>;
  by_referrer: Array<{ referrer: string; views: number }>;
  by_device: Array<{ device_type: string; views: number }>;
}

/** SQLite time shift string from UTC offset minutes. e.g. -480 → '+08:00', 300 → '-05:00' */
function tzModifier(offsetMin: number): string {
  if (offsetMin === 0) return '+00:00';
  // JS getTimezoneOffset() returns minutes *behind* UTC: PST = +480, EST = +300
  // We negate to get the SQLite modifier: +480 → -08:00 (subtract 8h from UTC = PST)
  const sign = offsetMin > 0 ? '-' : '+';
  const abs = Math.abs(offsetMin);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `${sign}${h}:${m}`;
}

/** SQL WHERE clause fragment for visitor_type filtering */
function visitorWhere(v: VisitorFilter): string {
  switch (v) {
    case 'human': return 'AND visitor_type = 0 AND is_owner = 0';
    case 'bot': return 'AND visitor_type = 1';
    case 'ai': return 'AND visitor_type = 2';
    case 'all': return 'AND is_owner = 0';
  }
}

/** Threshold: days <= this use hourly grouping, above use daily */
const HOURLY_THRESHOLD = 7;

export async function queryStats(db: D1Database, q: StatsQuery = {}): Promise<StatsResponse> {
  const days = q.days ?? 30;
  const all = days === 0;
  const tz = q.tz ?? 0;
  const tzMod = tzModifier(tz);
  const vw = visitorWhere(q.visitor ?? 'human');
  const hourly = !all && days <= HOURLY_THRESHOLD;

  const nowLocalMs = shiftToLocal(Date.now(), tz);
  const since = all ? '1970-01-01' : daysAgo(nowLocalMs, days);
  const pathFilter = q.path ? `AND path LIKE ?` : '';
  const bind = (stmt: D1PreparedStatement) =>
    q.path ? stmt.bind(since, `${q.path}%`) : stmt.bind(since);

  const localDt = `datetime(created_at, '${tzMod}')`;
  const localDate = `DATE(${localDt})`;
  // Hourly: 'YYYY-MM-DDTHH:00:00' — JS parses as local time (no Z). Daily: 'YYYY-MM-DD'.
  const bucket = hourly ? `strftime('%Y-%m-%dT%H:00:00', ${localDt})` : localDate;

  const [totals, byPath, byCountry, byDay, byReferrer, aiFetches, byDevice] = await db.batch([
    bind(db.prepare(`SELECT COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors FROM page_views WHERE ${localDate} >= ? ${vw} ${pathFilter}`)),
    bind(db.prepare(`SELECT path, COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors FROM page_views WHERE ${localDate} >= ? ${vw} ${pathFilter} GROUP BY path ORDER BY views DESC LIMIT 50`)),
    bind(db.prepare(`SELECT country, COUNT(*) as views FROM page_views WHERE ${localDate} >= ? ${vw} AND country IS NOT NULL ${pathFilter} GROUP BY country ORDER BY views DESC LIMIT 30`)),
    bind(db.prepare(`SELECT ${bucket} as date, COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors FROM page_views WHERE ${localDate} >= ? ${vw} ${pathFilter} GROUP BY date ORDER BY date`)),
    bind(db.prepare(`SELECT referrer, COUNT(*) as views FROM page_views WHERE ${localDate} >= ? ${vw} AND referrer IS NOT NULL ${pathFilter} GROUP BY referrer ORDER BY views DESC LIMIT 20`)),
    bind(db.prepare(`SELECT COUNT(*) as count FROM page_views WHERE ${localDate} >= ? AND visitor_type = 2 ${pathFilter}`)),
    bind(db.prepare(`SELECT device_type, COUNT(*) as views FROM page_views WHERE ${localDate} >= ? ${vw} ${pathFilter} GROUP BY device_type ORDER BY views DESC`)),
  ]);

  const t = (totals.results?.[0] ?? { views: 0, visitors: 0 }) as Record<string, number>;
  const ai = (aiFetches.results?.[0] ?? { count: 0 }) as Record<string, number>;
  const dayRows = (byDay.results ?? []) as StatsResponse['by_day'];

  // For "all time", derive period start from actual data instead of arbitrary lookback
  const periodStart = all && dayRows.length > 0 ? dayRows[0].date : since;

  return {
    period: { start: periodStart, end: localToday(tz) },
    totals: { views: t.views ?? 0, visitors: t.visitors ?? 0, ai_fetches: ai.count ?? 0 },
    by_path: (byPath.results ?? []) as StatsResponse['by_path'],
    by_country: (byCountry.results ?? []) as StatsResponse['by_country'],
    by_day: (byDay.results ?? []) as StatsResponse['by_day'],
    by_referrer: (byReferrer.results ?? []) as StatsResponse['by_referrer'],
    by_device: (byDevice.results ?? []) as StatsResponse['by_device'],
  };
}
