import type {
  DeviceType,
  StatsRange,
  StatsResponse,
  TimeSeriesPoint,
  TrafficClass,
  TrafficFilter,
} from './contracts.js';
import type { Env } from './db.js';
import {
  completeTimeSeries,
  createStatsWindow,
  parseStatsRange,
  type StatsWindow,
} from './dates.js';

export type { StatsResponse, TrafficFilter } from './contracts.js';

export interface StatsQuery {
  range: StatsRange;
  traffic: TrafficFilter;
  path?: string;
}

interface QueryPredicate {
  sql: string;
  values: unknown[];
}

function parseTrafficFilter(value: string | null): TrafficFilter | null {
  switch (value) {
    case 'browser':
    case 'bot':
    case 'ai':
    case 'all':
      return value;
    default:
      return null;
  }
}

function predicateFor(window: StatsWindow, query: StatsQuery): QueryPredicate {
  let sql = 'observed_at >= ? AND observed_at < ? AND is_owner = 0';
  const values: unknown[] = [window.startInclusive, window.endExclusive];
  if (query.traffic !== 'all') {
    sql += ' AND traffic_class = ?';
    values.push(query.traffic);
  }
  if (query.path !== undefined) {
    sql += ' AND path = ?';
    values.push(query.path);
  }
  return { sql, values };
}

function numberField(row: Record<string, unknown> | undefined, field: string): number {
  const value = row?.[field];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function stringField(row: Record<string, unknown>, field: string): string | null {
  const value = row[field];
  return typeof value === 'string' ? value : null;
}

function bindQuery(db: D1Database, sql: string, predicate: QueryPredicate): D1PreparedStatement {
  return db.prepare(sql).bind(...predicate.values);
}

function pathRows(rows: Record<string, unknown>[]): StatsResponse['byPath'] {
  const result: StatsResponse['byPath'] = [];
  for (const row of rows) {
    const path = stringField(row, 'path');
    if (path !== null) result.push({ path, views: numberField(row, 'views'), dailyClients: numberField(row, 'dailyClients') });
  }
  return result;
}

function countryRows(rows: Record<string, unknown>[]): StatsResponse['byCountry'] {
  const result: StatsResponse['byCountry'] = [];
  for (const row of rows) {
    const country = stringField(row, 'country');
    if (country !== null) result.push({ country, views: numberField(row, 'views') });
  }
  return result;
}

function seriesRows(rows: Record<string, unknown>[]): TimeSeriesPoint[] {
  const result: TimeSeriesPoint[] = [];
  for (const row of rows) {
    const bucket = stringField(row, 'bucket');
    if (bucket !== null) result.push({ bucket, views: numberField(row, 'views'), dailyClients: numberField(row, 'dailyClients') });
  }
  return result;
}

function referrerRows(rows: Record<string, unknown>[]): StatsResponse['byReferrer'] {
  const result: StatsResponse['byReferrer'] = [];
  for (const row of rows) {
    const referrerHost = stringField(row, 'referrerHost');
    if (referrerHost !== null) result.push({ referrerHost, views: numberField(row, 'views') });
  }
  return result;
}

function deviceRows(rows: Record<string, unknown>[]): StatsResponse['byDevice'] {
  const result: StatsResponse['byDevice'] = [];
  for (const row of rows) {
    const deviceType = stringField(row, 'deviceType');
    if (deviceType === 'desktop' || deviceType === 'mobile' || deviceType === 'tablet') {
      result.push({ deviceType, views: numberField(row, 'views') });
    }
  }
  return result;
}

function agentRows(rows: Record<string, unknown>[]): StatsResponse['byAgent'] {
  const result: StatsResponse['byAgent'] = [];
  for (const row of rows) {
    const agentName = stringField(row, 'agentName');
    const trafficClass = stringField(row, 'trafficClass');
    if (agentName !== null && (trafficClass === 'bot' || trafficClass === 'ai')) {
      result.push({ agentName, trafficClass, views: numberField(row, 'views') });
    }
  }
  return result;
}

export async function queryStats(db: D1Database, query: StatsQuery, now = new Date()): Promise<StatsResponse> {
  const initialWindow = createStatsWindow(query.range, now);
  const predicate = predicateFor(initialWindow, query);
  const bucketSql = initialWindow.granularity === 'hour'
    ? "strftime('%Y-%m-%dT%H:00:00Z', observed_at)"
    : "strftime('%Y-%m-%d', observed_at)";

  const aggregateStatements = [
    bindQuery(db, `SELECT COUNT(*) AS views, COUNT(DISTINCT daily_client_id) AS dailyClients FROM page_observations WHERE ${predicate.sql}`, predicate),
    bindQuery(db, `SELECT path, COUNT(*) AS views, COUNT(DISTINCT daily_client_id) AS dailyClients FROM page_observations WHERE ${predicate.sql} GROUP BY path ORDER BY views DESC, path`, predicate),
    bindQuery(db, `SELECT country, COUNT(*) AS views FROM page_observations WHERE ${predicate.sql} AND country IS NOT NULL GROUP BY country ORDER BY views DESC, country`, predicate),
    bindQuery(db, `SELECT ${bucketSql} AS bucket, COUNT(*) AS views, COUNT(DISTINCT daily_client_id) AS dailyClients FROM page_observations WHERE ${predicate.sql} GROUP BY bucket ORDER BY bucket`, predicate),
    bindQuery(db, `SELECT referrer_host AS referrerHost, COUNT(*) AS views FROM page_observations WHERE ${predicate.sql} AND referrer_host IS NOT NULL GROUP BY referrer_host ORDER BY views DESC, referrerHost`, predicate),
    bindQuery(db, `SELECT device_type AS deviceType, COUNT(*) AS views FROM page_observations WHERE ${predicate.sql} GROUP BY device_type ORDER BY views DESC, deviceType`, predicate),
    bindQuery(db, `SELECT agent_name AS agentName, traffic_class AS trafficClass, COUNT(*) AS views FROM page_observations WHERE ${predicate.sql} AND agent_name IS NOT NULL GROUP BY agent_name, traffic_class ORDER BY views DESC, agentName`, predicate),
  ];
  const statements = query.range === 'all'
    ? [db.prepare('SELECT MIN(observed_at) AS firstObservedAt FROM page_observations WHERE is_owner = 0'), ...aggregateStatements]
    : aggregateStatements;
  const results = await db.batch<Record<string, unknown>>(statements);
  const aggregateOffset = query.range === 'all' ? 1 : 0;
  const firstObservedRow = query.range === 'all' ? results[0]?.results[0] : undefined;
  const firstObservedAt = firstObservedRow ? stringField(firstObservedRow, 'firstObservedAt') : null;
  const window = createStatsWindow(query.range, now, firstObservedAt ?? undefined);
  const totalsRow = results[aggregateOffset]?.results[0];
  const populatedSeries = seriesRows(results[aggregateOffset + 3]?.results ?? []);

  return {
    period: {
      start: window.start,
      end: window.end,
      timeZone: 'UTC',
      granularity: window.granularity,
      updatedAt: window.updatedAt,
    },
    totals: {
      views: numberField(totalsRow, 'views'),
      dailyClients: numberField(totalsRow, 'dailyClients'),
    },
    byPath: pathRows(results[aggregateOffset + 1]?.results ?? []),
    byCountry: countryRows(results[aggregateOffset + 2]?.results ?? []),
    timeSeries: completeTimeSeries(window, populatedSeries, now),
    byReferrer: referrerRows(results[aggregateOffset + 4]?.results ?? []),
    byDevice: deviceRows(results[aggregateOffset + 5]?.results ?? []),
    byAgent: agentRows(results[aggregateOffset + 6]?.results ?? []),
  };
}

function jsonError(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export async function handleStats(request: Request, env: Pick<Env, 'DB'>): Promise<Response> {
  const url = new URL(request.url);
  const rangeValue = url.searchParams.get('range');
  const trafficValue = url.searchParams.get('traffic');
  const range = rangeValue === null ? '30d' : parseStatsRange(rangeValue);
  const traffic = trafficValue === null ? 'browser' : parseTrafficFilter(trafficValue);
  if (range === null) return jsonError('range must be 7d, 30d, 90d, or all');
  if (traffic === null) return jsonError('traffic must be browser, bot, ai, or all');

  const rawPath = url.searchParams.get('path');
  const path = rawPath === null || rawPath.length === 0 ? undefined : rawPath;
  const query: StatsQuery = path === undefined ? { range, traffic } : { range, traffic, path };
  const response = await queryStats(env.DB, query);
  return Response.json(response, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
