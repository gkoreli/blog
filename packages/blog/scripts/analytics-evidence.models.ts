import { z } from 'zod';

const count = z.number().int().nonnegative();
export const aggregateRow = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));
export const d1Schema = z.array(z.object({
  success: z.literal(true),
  results: z.array(aggregateRow),
  meta: z.object({ rows_written: z.literal(0) }).passthrough(),
}));
export const rumGroupSchema = z.object({
  count,
  avg: z.object({ sampleInterval: z.number().finite().min(1) }),
  sum: z.object({ visits: count }),
  dimensions: z.object({ date: z.string(), requestPath: z.string(), deliveryType: z.string(), navigationType: z.string() }),
});
export type RumGroup = z.infer<typeof rumGroupSchema>;
export const rumSchema = z.object({
  errors: z.array(z.unknown()).nullish(),
  data: z.object({ viewer: z.object({ accounts: z.array(z.object({
    rumPageloadEventsAdaptiveGroups: z.array(rumGroupSchema),
  })).length(1) }) }),
});

export function daysBetween(start: string, end: string, now = new Date()): string[] {
  for (const date of [start, end]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))
      || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Dates must be real YYYY-MM-DD UTC dates.');
  }
  if (end > now.toISOString().slice(0, 10)) throw new Error('End must exclude the current partial UTC day.');
  const length = (Date.parse(end) - Date.parse(start)) / 86_400_000;
  if (length < 1 || length > 31) throw new Error('Choose 1–31 complete UTC days; end is exclusive.');
  return Array.from({ length }, (_, i) => new Date(Date.parse(start) + i * 86_400_000).toISOString().slice(0, 10));
}

export function nextDay(day: string): string {
  return new Date(Date.parse(day) + 86_400_000).toISOString().slice(0, 10);
}

export function buildQueries(start: string, end: string) {
  // Validate before inserting into fixed, read-only SQL. No arbitrary SQL input.
  daysBetween(start, end);
  const window = `p.observed_at >= '${start}' AND p.observed_at < '${end}'`;
  const publicWindow = `${window} AND p.is_owner = 0 AND NOT EXISTS
    (SELECT 1 FROM owner_clients o WHERE o.daily_client_id = p.daily_client_id)`;
  const navigation = "sec_fetch_mode = 'navigate' AND sec_fetch_dest = 'document' AND accepts_html = 1 AND has_accept_language = 1";
  return [
    { name: 'clock', sql: "SELECT datetime('now') AS queried_at" },
    { name: 'migrations', sql: 'SELECT name, applied_at FROM d1_migrations ORDER BY id' },
    { name: 'revisions', sql: 'SELECT migration, from_kind, to_kind, COUNT(*) AS views, MIN(revised_at) AS first_revision, MAX(revised_at) AS last_revision FROM reader_kind_revisions GROUP BY 1,2,3' },
    { name: 'owner_marks', sql: `SELECT utc_date, COUNT(*) AS marked_clients FROM owner_clients WHERE utc_date >= '${start}' AND utc_date < '${end}' GROUP BY 1` },
    { name: 'daily', sql: `SELECT date(observed_at) AS day, reader_kind, representation, COUNT(*) AS views, COUNT(DISTINCT daily_client_id) AS daily_clients FROM page_observations p WHERE ${publicWindow} GROUP BY 1,2,3 ORDER BY 1,2,3` },
    { name: 'paths', sql: `SELECT date(observed_at) AS day, path, reader_kind, representation, COUNT(*) AS views FROM page_observations p WHERE ${publicWindow} GROUP BY 1,2,3,4 ORDER BY 1,2,3,4` },
    { name: 'provenance', sql: `SELECT observation_source, asn_source, reader_reason, COUNT(*) AS views, SUM(CASE WHEN asn IS NULL THEN 1 ELSE 0 END) AS missing_asn FROM page_observations p WHERE ${publicWindow} GROUP BY 1,2,3` },
    { name: 'signatures', sql: `SELECT signature_status, signature_agent, agent_name, reader_kind, reader_reason, COUNT(*) AS views FROM page_observations p WHERE ${publicWindow} AND signature_status IS NOT NULL GROUP BY 1,2,3,4,5` },
    { name: 'browser_clusters', sql: `SELECT date(observed_at) AS day, asn, referrer_host, sec_fetch_site, COUNT(*) AS views, COUNT(DISTINCT daily_client_id) AS daily_clients, COUNT(DISTINCT path) AS paths FROM page_observations p WHERE ${publicWindow} AND reader_kind = 'browser' GROUP BY 1,2,3,4 ORDER BY views DESC` },
    { name: 'predicate_ablation', sql: `SELECT reader_kind, CASE WHEN ${navigation} THEN 1 ELSE 0 END AS navigation_shaped, COUNT(*) AS views FROM page_observations p WHERE ${publicWindow} AND traffic_class = 'browser' GROUP BY 1,2` },
    // Aggregate same-day patterns inside D1; never export the daily identifier.
    { name: 'bursts', sql: `SELECT day, reader_kind, asn, COUNT(*) AS client_seconds, SUM(views) AS views, MAX(paths) AS max_paths_in_second FROM (SELECT date(observed_at) AS day, reader_kind, asn, daily_client_id, observed_at, COUNT(*) AS views, COUNT(DISTINCT path) AS paths FROM page_observations p WHERE ${publicWindow} GROUP BY 1,2,3,4,5 HAVING COUNT(*) >= 3) GROUP BY 1,2,3` },
  ];
}

export function rumQuery(accountId: string, day: string, botsExcluded: boolean): string {
  if (!/^[a-f0-9]{32}$/.test(accountId)) throw new Error('A 32-character Cloudflare account ID is required.');
  daysBetween(day, nextDay(day));
  return `{viewer{accounts(filter:{accountTag:${JSON.stringify(accountId)}}){rumPageloadEventsAdaptiveGroups(limit:10000,filter:{datetime_geq:${JSON.stringify(day + 'T00:00:00Z')},datetime_lt:${JSON.stringify(nextDay(day) + 'T00:00:00Z')},requestHost:"gkoreli.com"${botsExcluded ? ',bot:0' : ''}}){count avg{sampleInterval} sum{visits} dimensions{date requestPath deliveryType navigationType}}}}}`;
}

export function parseRum(value: unknown, day: string): RumGroup[] {
  const parsed = rumSchema.parse(value);
  if (parsed.errors && parsed.errors.length > 0) throw new Error('GraphQL returned errors; partial data is not accepted.');
  const groups = parsed.data.viewer.accounts[0]!.rumPageloadEventsAdaptiveGroups;
  if (groups.length >= 10_000) throw new Error('RUM group limit reached; narrow the query before comparing.');
  if (groups.some(g => g.dimensions.date !== day)) throw new Error('RUM returned a date outside the requested UTC day.');
  return groups;
}

export function excludedRumPath(path: string): boolean {
  return path === '/stats' || path.startsWith('/stats/') || path === '/api' || path.startsWith('/api/');
}

const dailySchema = z.array(z.object({ day: z.string(), reader_kind: z.string().nullable(), representation: z.string().nullable(), views: count }));
const pathsSchema = z.array(z.object({ day: z.string(), path: z.string(), reader_kind: z.string().nullable(), representation: z.string().nullable(), views: count }));

export function compareDay(day: string, dailyValue: unknown, pathsValue: unknown, groups: RumGroup[]) {
  const daily = dailySchema.parse(dailyValue).filter(r => r.day === day);
  const paths = pathsSchema.parse(pathsValue);
  const sum = (rows: Array<{ views: number }>) => rows.reduce((n, r) => n + r.views, 0);
  const d1Total = sum(daily);
  const reconciles = d1Total === sum(paths.filter(r => r.day === day));
  const d1BrowserHtml = sum(daily.filter(r => r.reader_kind === 'browser' && r.representation === 'html'));
  const eligible = groups.filter(g => !excludedRumPath(g.dimensions.requestPath));
  const knownHtmlPaths = new Set(paths.filter(p => p.representation === 'html').map(p => p.path));
  // Do not silently discard RUM-only paths; a human must check their eligibility.
  const unmatchedPaths = [...new Set(eligible.filter(g => !knownHtmlPaths.has(g.dimensions.requestPath)).map(g => g.dimensions.requestPath))];
  const rumLoads = eligible.reduce((n, g) => n + g.count, 0);
  const sampleIntervals = [...new Set(groups.map(g => g.avg.sampleInterval))].sort((a, b) => a - b);
  const warnings: string[] = [];
  if (!reconciles) warnings.push('D1 daily and path totals differ; queries are not a cross-source transaction.');
  if (unmatchedPaths.length) warnings.push('RUM-only paths need an eligibility review; ratio withheld.');
  if (sampleIntervals.some(n => n !== 1)) warnings.push('RUM is sampled; ratio withheld. Counts are not multiplied by sampleInterval.');
  if (!rumLoads) warnings.push('No eligible RUM loads returned; this does not establish zero readers.');
  return {
    day, d1Total, d1BrowserHtml, rumLoads,
    excludedRumLoads: groups.filter(g => excludedRumPath(g.dimensions.requestPath)).reduce((n, g) => n + g.count, 0),
    sampleIntervals, unmatchedPaths, reconciles,
    ratio: warnings.length === 0 ? d1BrowserHtml / rumLoads : null,
    warnings,
  };
}
