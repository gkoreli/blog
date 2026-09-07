import {
  READER_GROUPS,
  isReaderKind,
  readerGroupOf,
  type ReaderKind,
  type StatsRange,
  type StatsResponse,
  type TimeSeriesPoint,
  type TrafficFilter,
} from './contracts.js';
import type { Env } from './db.js';
import { KNOWN_AGENT_NAMES } from './classify.js';
import { agentReaderKind } from './readerkind.js';
import {
  completeTimeSeries,
  createStatsWindow,
  parseStatsRange,
  type StatsWindow,
} from './dates.js';
import { partitionPredicate } from './partition.js';
import { publicReferrers } from './referrals.js';
import { referralAssessmentCtes, referralRulesJson } from './referral-sql.js';
import { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';
import type { ReferralPolicy } from './referral-policy.js';

export type { StatsResponse, TrafficFilter } from './contracts.js';

export interface StatsQuery {
  range: StatsRange;
  traffic: TrafficFilter;
  path?: string;
  agent?: string;
  kind?: ReaderKind;
}

interface QueryPredicate {
  sql: string;
  values: unknown[];
}

const PUBLIC_OBSERVATION_PREDICATE = `is_owner = 0 AND NOT EXISTS (
  SELECT 1 FROM owner_clients
  WHERE owner_clients.daily_client_id = page_observations.daily_client_id
)`;

function parseTrafficFilter(value: string | null): TrafficFilter | null {
  switch (value) {
    case 'browser':
    case 'agents':
    case 'crawlers':
    case 'automation':
    case 'all':
      return value;
    default:
      return null;
  }
}

function predicateFor(window: StatsWindow, query: StatsQuery): QueryPredicate {
  let sql = `observed_at >= ? AND observed_at < ? AND ${PUBLIC_OBSERVATION_PREDICATE}`;
  const values: unknown[] = [window.startInclusive, window.endExclusive];
  const partition = partitionPredicate(query.traffic);
  if (partition.sql.length > 0) {
    sql += ` AND (${partition.sql})`;
    values.push(...partition.values);
  }
  if (query.path !== undefined) {
    sql += ' AND path = ?';
    values.push(query.path);
  }
  if (query.agent !== undefined) {
    sql += ' AND agent_name = ?';
    values.push(query.agent);
  }
  if (query.kind !== undefined) {
    sql += ' AND reader_kind = ?';
    values.push(query.kind);
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

function pathRows(rows: Record<string, unknown>[]): StatsResponse['byPath'] {
  const result: StatsResponse['byPath'] = [];
  for (const row of rows) {
    const path = stringField(row, 'key1');
    if (path !== null) result.push({ path, views: numberField(row, 'views'), dailyClients: numberField(row, 'dailyClients') });
  }
  return result;
}

function countryRows(rows: Record<string, unknown>[]): StatsResponse['byCountry'] {
  const result: StatsResponse['byCountry'] = [];
  for (const row of rows) {
    const country = stringField(row, 'key1');
    if (country !== null) result.push({ country, views: numberField(row, 'views') });
  }
  return result;
}

function seriesRows(rows: Record<string, unknown>[]): TimeSeriesPoint[] {
  const result: TimeSeriesPoint[] = [];
  for (const row of rows) {
    const bucket = stringField(row, 'key1');
    if (bucket !== null) result.push({ bucket, views: numberField(row, 'views'), dailyClients: numberField(row, 'dailyClients') });
  }
  return result;
}

function referrerRows(rows: Record<string, unknown>[]): StatsResponse['byReferrer'] {
  const result: StatsResponse['byReferrer'] = [];
  for (const row of rows) {
    const referrerHost = stringField(row, 'key1');
    if (referrerHost !== null) result.push({ referrerHost, views: numberField(row, 'views') });
  }
  return result;
}

function deviceRows(rows: Record<string, unknown>[]): StatsResponse['byDevice'] {
  const result: StatsResponse['byDevice'] = [];
  for (const row of rows) {
    const deviceType = stringField(row, 'key1');
    if (deviceType === 'desktop' || deviceType === 'mobile' || deviceType === 'tablet') {
      result.push({ deviceType, views: numberField(row, 'views') });
    }
  }
  return result;
}

function agentRows(rows: Record<string, unknown>[]): StatsResponse['byAgent'] {
  const result: StatsResponse['byAgent'] = [];
  for (const row of rows) {
    const agentName = stringField(row, 'key1');
    const trafficClass = stringField(row, 'key2');
    if (agentName !== null && (trafficClass === 'bot' || trafficClass === 'ai')) {
      result.push({ agentName, trafficClass, views: numberField(row, 'views') });
    }
  }
  return result;
}

function kindRows(rows: Record<string, unknown>[]): StatsResponse['byKind'] {
  const result: StatsResponse['byKind'] = [];
  for (const row of rows) {
    const kind = stringField(row, 'key1');
    const reason = stringField(row, 'key2');
    if (kind !== null && isReaderKind(kind) && reason !== null) {
      result.push({ kind, reason, views: numberField(row, 'views'), dailyClients: numberField(row, 'dailyClients') });
    }
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function malformedReport(): never {
  throw new Error('Malformed statistics report');
}

function payloadRows(row: Record<string, unknown>): Record<string, unknown>[] {
  const payload = stringField(row, 'payload');
  if (payload === null) return malformedReport();
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return malformedReport();
  }
  if (!Array.isArray(parsed) || !parsed.every(isRecord)) return malformedReport();
  return parsed;
}

function reportSections(rows: Record<string, unknown>[], includeBoundary: boolean): Map<string, Record<string, unknown>[]> {
  const expected = new Set([
    'totals', 'path', 'country', 'series', 'referrer', 'device', 'agent', 'kind', 'excluded',
  ]);
  if (includeBoundary) expected.add('boundary');
  const sections = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const section = stringField(row, 'section');
    if (section === null || !expected.has(section) || sections.has(section)) return malformedReport();
    const payload = payloadRows(row);
    if ((section === 'totals' || section === 'excluded' || section === 'boundary') && payload.length !== 1) {
      return malformedReport();
    }
    sections.set(section, payload);
  }
  if (sections.size !== expected.size) return malformedReport();
  return sections;
}

function requiredSection(sections: Map<string, Record<string, unknown>[]>, section: string): Record<string, unknown>[] {
  return sections.get(section) ?? malformedReport();
}

function reportSql(selected: QueryPredicate, bucketSql: string, includeBoundary: boolean): QueryPredicate {
  const boundaryCte = includeBoundary
    ? `, boundary AS MATERIALIZED (
        SELECT MIN(observed_at) AS first_observed_at
        FROM page_observations WHERE ${PUBLIC_OBSERVATION_PREDICATE}
      )`
    : '';
  const boundaryProjection = includeBoundary
    ? `WHEN 'boundary' THEN (
        SELECT json_array(json_object('firstObservedAt', first_observed_at)) FROM boundary
      )`
    : '';
  const sectionValues = [
    "('totals', 0)", "('path', 1)", "('country', 2)", "('series', 3)", "('referrer', 4)",
    "('device', 5)", "('agent', 6)", "('kind', 7)", "('excluded', 8)",
  ];
  if (includeBoundary) sectionValues.push("('boundary', 9)");

  return {
    sql: `WITH RECURSIVE
      selected AS MATERIALIZED (
        SELECT path, country, daily_client_id, traffic_class, agent_name, device_type,
               reader_kind, reader_reason, referrer_host, observed_at
        FROM page_observations WHERE ${selected.sql}
      ),
      ${referralAssessmentCtes(`
        SELECT DISTINCT referrer_host AS original, lower(rtrim(referrer_host, '.')) AS normalized
        FROM selected
        WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host, '.')) <= 253
      `)},
      assessed AS MATERIALIZED (
        SELECT selected.*,
          COALESCE(referrer_host IN (SELECT original FROM abusive_hosts), 0) AS referral_excluded
        FROM selected
      ),
      included AS MATERIALIZED (
        SELECT * FROM assessed WHERE referral_excluded = 0
      )
      ${boundaryCte},
      sections(section, section_order) AS MATERIALIZED (
        VALUES ${sectionValues.join(', ')}
      )
    SELECT section,
      CASE section
        WHEN 'totals' THEN (
          SELECT json_array(json_object(
            'views', COUNT(*), 'dailyClients', COUNT(DISTINCT daily_client_id),
            'unattributedViews', SUM(CASE WHEN referrer_host IS NULL THEN 1 ELSE 0 END)
          )) FROM included
        )
        WHEN 'path' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', path, 'views', COUNT(*),
              'dailyClients', COUNT(DISTINCT daily_client_id)) AS row_json
            FROM included GROUP BY path ORDER BY COUNT(*) DESC, path
          )
        )
        WHEN 'country' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', country, 'views', COUNT(*)) AS row_json
            FROM included WHERE country IS NOT NULL GROUP BY country ORDER BY COUNT(*) DESC, country
          )
        )
        WHEN 'series' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', ${bucketSql}, 'views', COUNT(*),
              'dailyClients', COUNT(DISTINCT daily_client_id)) AS row_json
            FROM included GROUP BY ${bucketSql} ORDER BY ${bucketSql}
          )
        )
        WHEN 'referrer' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', referrer_host, 'views', COUNT(*)) AS row_json
            FROM included WHERE referrer_host IS NOT NULL
            GROUP BY referrer_host ORDER BY COUNT(*) DESC, referrer_host
          )
        )
        WHEN 'device' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', device_type, 'views', COUNT(*)) AS row_json
            FROM included GROUP BY device_type ORDER BY COUNT(*) DESC, device_type
          )
        )
        WHEN 'agent' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', agent_name, 'key2', traffic_class, 'views', COUNT(*)) AS row_json
            FROM included WHERE agent_name IS NOT NULL
            GROUP BY agent_name, traffic_class ORDER BY COUNT(*) DESC, agent_name
          )
        )
        WHEN 'kind' THEN (
          SELECT COALESCE(json_group_array(json(row_json)), json('[]')) FROM (
            SELECT json_object('key1', reader_kind, 'key2', reader_reason, 'views', COUNT(*),
              'dailyClients', COUNT(DISTINCT daily_client_id)) AS row_json
            FROM included WHERE reader_kind IS NOT NULL
            GROUP BY reader_kind, reader_reason ORDER BY COUNT(*) DESC, reader_kind, reader_reason
          )
        )
        WHEN 'excluded' THEN (
          SELECT json_array(json_object('views', COUNT(*)))
          FROM assessed WHERE referral_excluded = 1
        )
        ${boundaryProjection}
        ELSE json('[]')
      END AS payload
    FROM sections ORDER BY section_order`,
    values: selected.values,
  };
}

export async function queryStats(db: D1Database, query: StatsQuery, now = new Date(), policy: ReferralPolicy = ACTIVE_REFERRAL_POLICY): Promise<StatsResponse> {
  const initialWindow = createStatsWindow(query.range, now);
  const selected = predicateFor(initialWindow, query);
  const bucketSql = initialWindow.granularity === 'hour'
    ? "strftime('%Y-%m-%dT%H:00:00Z', observed_at)"
    : "strftime('%Y-%m-%d', observed_at)";
  const report = reportSql(selected, bucketSql, query.range === 'all');
  const statement = db.prepare(report.sql).bind(...report.values, referralRulesJson(policy));
  const results = await db.batch<Record<string, unknown>>([statement]);
  const rows = results[0]?.results ?? [];
  const sections = reportSections(rows, query.range === 'all');
  const firstObservedRow = query.range === 'all' ? requiredSection(sections, 'boundary')[0] : undefined;
  const firstObservedAt = firstObservedRow ? stringField(firstObservedRow, 'firstObservedAt') : null;
  const window = createStatsWindow(query.range, now, firstObservedAt ?? undefined);
  const totalsRow = requiredSection(sections, 'totals')[0];
  const populatedSeries = seriesRows(requiredSection(sections, 'series'));
  const referrals = publicReferrers(referrerRows(requiredSection(sections, 'referrer')), policy);

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
      unattributedViews: numberField(totalsRow, 'unattributedViews'),
    },
    filters: {
      traffic: query.traffic,
      range: query.range,
      path: query.path ?? null,
      agent: query.agent ?? null,
      kind: query.kind ?? null,
    },
    byPath: pathRows(requiredSection(sections, 'path')),
    byCountry: countryRows(requiredSection(sections, 'country')),
    timeSeries: completeTimeSeries(window, populatedSeries, now),
    byReferrer: referrals.byReferrer,
    otherReferrerViews: referrals.otherReferrerViews,
    referralPolicy: {
      version: policy.version,
      sha256: policy.sha256,
      evaluator: policy.evaluator,
      source: { provider: policy.source.provider, revision: policy.source.revision, sha256: policy.source.sha256 },
      excludedViews: numberField(requiredSection(sections, 'excluded')[0], 'views'),
    },
    byDevice: deviceRows(requiredSection(sections, 'device')),
    byAgent: agentRows(requiredSection(sections, 'agent')),
    byKind: kindRows(requiredSection(sections, 'kind')),
  };
}

function jsonError(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function parseStatsQuery(params: URLSearchParams): StatsQuery | string {
  const rangeValue = params.get('range');
  const trafficValue = params.get('traffic');
  const rawAgent = params.get('agent');
  const rawKind = params.get('kind');
  const agent = rawAgent === null ? undefined : rawAgent;
  const range = rangeValue === null ? '30d' : parseStatsRange(rangeValue);
  if (range === null) return 'range must be 7d, 30d, 90d, or all';
  if (agent !== undefined && !KNOWN_AGENT_NAMES.has(agent)) {
    return 'agent must be a known matched User-Agent rule name';
  }
  if (rawKind !== null && !isReaderKind(rawKind)) {
    return 'kind must be one of the reader kinds';
  }
  const kind = rawKind === null ? undefined : rawKind;
  const scoped = agent !== undefined || kind !== undefined;
  const traffic = trafficValue === null
    ? scoped ? 'all' : 'browser'
    : parseTrafficFilter(trafficValue);
  if (traffic === null) return 'traffic must be browser, agents, crawlers, automation, or all';
  if (agent !== undefined && kind !== undefined && agentReaderKind(agent) !== kind) {
    return `agent ${agent} cannot be combined with kind=${kind}`;
  }
  if (kind !== undefined && traffic !== 'all' && !READER_GROUPS[traffic].includes(kind)) {
    return `kind ${kind} cannot be combined with traffic=${traffic}`;
  }
  if (agent !== undefined && traffic !== 'all' && readerGroupOf(agentReaderKind(agent)) !== traffic) {
    return `agent ${agent} cannot be combined with traffic=${traffic}`;
  }

  const rawPath = params.get('path');
  const path = rawPath === null || rawPath.length === 0 ? undefined : rawPath;
  const query: StatsQuery = { range, traffic };
  if (path !== undefined) query.path = path;
  if (agent !== undefined) query.agent = agent;
  if (kind !== undefined) query.kind = kind;
  return query;
}

export async function handleStats(request: Request, env: Pick<Env, 'DB'>): Promise<Response> {
  const query = parseStatsQuery(new URL(request.url).searchParams);
  if (typeof query === 'string') return jsonError(query);
  const response = await queryStats(env.DB, query);
  return Response.json(response, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
