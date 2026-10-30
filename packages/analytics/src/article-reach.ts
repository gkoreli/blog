import { ARTICLE_REACH_VERSION, REACH_METRIC_KEYS, consistentArticleReach, emptyReachMetrics, validReachCatalogue, type ArticleReachReport, type ReachArticle, type ReachMetrics } from './article-reach-contract.js';
import { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';
import { referralAssessmentCtes, referralRulesJson } from './referral-sql.js';
import type { ReferralPolicy } from './referral-policy.js';
import { measuredReportBatch, type ReportCalculationObserver } from './report-cost.js';

const DAY = 86_400_000;
const NORMALIZED_HOST = `CASE WHEN substr(lower(rtrim(referrer_host, '.')),1,4)='www.' THEN substr(lower(rtrim(referrer_host,'.')),5) ELSE lower(rtrim(referrer_host,'.')) END`;

/** One fixed public selection avoids per-article report fills and arbitrary host probes. */
export const ARTICLE_REACH_SQL = `WITH RECURSIVE
  catalogue AS MATERIALIZED (SELECT value AS path FROM json_each(?)),
  window_rows AS MATERIALIZED (
    SELECT path,observed_at,referrer_host,referrer_state,classifier_version,is_owner,daily_client_id
    FROM page_observations WHERE reader_kind='browser' AND observed_at>=? AND observed_at<?
  ),
  selected AS MATERIALIZED (
    SELECT path,observed_at,referrer_host,referrer_state,classifier_version
    FROM window_rows WHERE is_owner=0
      AND NOT EXISTS(SELECT 1 FROM owner_clients WHERE owner_clients.daily_client_id=window_rows.daily_client_id)
  ),
  ${referralAssessmentCtes(`SELECT DISTINCT referrer_host AS original,lower(rtrim(referrer_host,'.')) AS normalized FROM selected WHERE referrer_host IS NOT NULL AND length(rtrim(referrer_host,'.'))<=253`)},
  assessed AS MATERIALIZED (
    SELECT *,COALESCE(referrer_host IN (SELECT original FROM abusive_hosts),0) AS referral_excluded FROM selected
  ),
  normalized AS MATERIALIZED (
    SELECT *,${NORMALIZED_HOST} AS host FROM assessed WHERE referral_excluded=0
  ),
  facts AS MATERIALIZED (
    SELECT CASE WHEN path IN (SELECT path FROM catalogue) THEN path ELSE NULL END AS article_path,
      CASE WHEN strftime('%Y-%m-%d %H:%M:%S',observed_at) IS observed_at AND substr(observed_at,12,2) BETWEEN '00' AND '23'
        THEN CAST((julianday(substr(observed_at,1,10))-julianday(?))/7 AS INTEGER) ELSE -1 END AS week,
      host,
      CASE WHEN referrer_state='internal' OR (referrer_state IS NULL AND host='gkoreli.com') THEN 'internal'
        WHEN referrer_state='absent' AND referrer_host IS NULL THEN 'unattributed'
        WHEN (referrer_state='external' OR referrer_state IS NULL) AND length(host) BETWEEN 1 AND 253 THEN 'external'
        ELSE 'unknown' END AS source,
      classifier_version
    FROM normalized
  ),
  public_hosts AS MATERIALIZED (SELECT value AS host FROM json_each(?)),
  largest AS MATERIALIZED (
    SELECT host,COUNT(*) AS views FROM facts WHERE source='external' GROUP BY host ORDER BY COUNT(*) DESC,host LIMIT 1
  ),
  article_source_counts AS MATERIALIZED (
    SELECT article_path,host,COUNT(*) AS views FROM facts WHERE source='external' AND article_path IS NOT NULL GROUP BY article_path,host
  ),
  article_ranked_sources AS MATERIALIZED (
    SELECT article_path,host,views,row_number() OVER (PARTITION BY article_path ORDER BY views DESC,host) AS ordinal FROM article_source_counts
  ),
  article_largest AS MATERIALIZED (SELECT article_path,host,views FROM article_ranked_sources WHERE ordinal=1),
  article_concentration AS (
    SELECT facts.article_path,facts.week,article_largest.host,COUNT(*) AS views FROM facts
    JOIN article_largest ON article_largest.article_path=facts.article_path AND article_largest.host=facts.host
    WHERE facts.source='external' GROUP BY facts.article_path,facts.week,article_largest.host
  ),
  grouped AS (
    SELECT article_path,week,source,CASE WHEN source='external' AND host IS (SELECT host FROM largest) THEN 1 ELSE 0 END AS is_largest,COUNT(*) AS views
    FROM facts GROUP BY article_path,week,source,is_largest
  )
SELECT 'counts' AS row_type,article_path,week,source,is_largest AS largest,views,
  NULL AS public_name,NULL AS excluded_views,NULL AS recorded_profiles,NULL AS unversioned_views FROM grouped
UNION ALL
SELECT 'summary',NULL,NULL,NULL,COALESCE((SELECT views FROM largest),0),COUNT(*),
  CASE WHEN (SELECT host FROM largest) IN (SELECT host FROM public_hosts) THEN (SELECT host FROM largest) ELSE NULL END,
  (SELECT COUNT(*) FROM assessed WHERE referral_excluded=1),COUNT(DISTINCT classifier_version),
  COALESCE(SUM(classifier_version IS NULL),0) FROM facts
UNION ALL
SELECT 'article-source-total',article_path,NULL,NULL,NULL,views,
  CASE WHEN host IN (SELECT host FROM public_hosts) THEN host ELSE NULL END,NULL,NULL,NULL FROM article_largest
UNION ALL
SELECT 'article-source',article_path,week,NULL,NULL,views,
  CASE WHEN host IN (SELECT host FROM public_hosts) THEN host ELSE NULL END,NULL,NULL,NULL FROM article_concentration`;

function invalid(): never { throw new Error('Incomplete or inconsistent article reach report'); }
function count(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }
function add(target: ReachMetrics, row: ReachMetrics): void { for (const key of REACH_METRIC_KEYS) target[key] += row[key]; }

export async function queryArticleReach(db: D1Database, catalogue: ReachArticle[], now = new Date(), policy: ReferralPolicy = ACTIVE_REFERRAL_POLICY, observe?: ReportCalculationObserver): Promise<ArticleReachReport> {
  if (!validReachCatalogue(catalogue) || !Number.isFinite(now.getTime())) return invalid();
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()), start = end - 28 * DAY;
  const day = (at: number) => new Date(at).toISOString().slice(0, 10);
  const startDay = day(start), endDay = day(end);
  const statement = db.prepare(ARTICLE_REACH_SQL).bind(JSON.stringify(catalogue.map(post => post.path)), startDay + ' 00:00:00', endDay + ' 00:00:00', referralRulesJson(policy), startDay, JSON.stringify(policy.publicHosts));
  const results = await measuredReportBatch(db, statement, observe);
  const rows = results[0]?.results;
  if (!Array.isArray(rows)) return invalid();
  const report: ArticleReachReport = {
    version: ARTICLE_REACH_VERSION,
    period: { startInclusive: startDay, endExclusive: endDay, updatedAt: now.toISOString(), timeZone: 'UTC' },
    selection: 'stored-browser-signals', catalogueSize: catalogue.length, site: emptyReachMetrics(), articleTotals: emptyReachMetrics(),
    weeks: Array.from({ length: 4 }, (_, index) => ({ startInclusive: day(start + index * 7 * DAY), endExclusive: day(start + (index + 1) * 7 * DAY), site: emptyReachMetrics(), articles: emptyReachMetrics() })),
    articles: catalogue.map(post => ({ ...post, totals: emptyReachMetrics(), weeks: Array.from({ length: 4 }, emptyReachMetrics), largestExternalSource: { selection: 'largest-for-article-in-whole-window', name: null, views: 0, weeks: [0, 0, 0, 0], unrecognizedTimeViews: 0 } })),
    largestExternalSource: { selection: 'largest-in-whole-window', name: null, views: 0 },
    classification: { recordedProfiles: 0, unversionedViews: 0 },
    referralPolicy: { version: policy.version, sha256: policy.sha256, excludedViews: 0 },
  };
  const articles = new Map(report.articles.map(post => [post.path, post])), groups = new Set<string>();
  const concentrationGroups = new Set<string>();
  const concentrationNames = new Map<string, string | null>();
  let summary: Record<string, unknown> | null = null;
  for (const row of rows) {
    const expected = ['row_type', 'article_path', 'week', 'source', 'largest', 'views', 'public_name', 'excluded_views', 'recorded_profiles', 'unversioned_views'];
    if (Object.keys(row).length !== expected.length || !expected.every(key => Object.hasOwn(row, key))) return invalid();
    if (row.row_type === 'summary') { if (summary !== null) return invalid(); summary = row; continue; }
    if (row.row_type === 'article-source' || row.row_type === 'article-source-total') {
      const { article_path: path, week, views, public_name: name } = row;
      const article = typeof path === 'string' ? articles.get(path) : undefined;
      if (!article || typeof path !== 'string' || !count(views) || views === 0
        || !(name === null || (typeof name === 'string' && policy.publicHosts.includes(name)))
        || ['source', 'largest', 'excluded_views', 'recorded_profiles', 'unversioned_views'].some(key => row[key] !== null)) return invalid();
      const key = JSON.stringify([row.row_type, path, week]); if (concentrationGroups.has(key)) return invalid(); concentrationGroups.add(key);
      const source = article.largestExternalSource;
      if (concentrationNames.has(path) && concentrationNames.get(path) !== name) return invalid();
      concentrationNames.set(path, name); source.name = name;
      if (row.row_type === 'article-source-total') { if (week !== null) return invalid(); source.views = views; continue; }
      if (typeof week !== 'number' || !Number.isInteger(week) || week < -1 || week > 3) return invalid();
      if (week === -1) source.unrecognizedTimeViews += views;
      else { const current = source.weeks[week]; if (current === undefined) return invalid(); source.weeks[week] = current + views; }
      continue;
    }
    const { article_path: path, week, source, largest, views } = row;
    if (row.row_type !== 'counts' || !(path === null || (typeof path === 'string' && articles.has(path)))
      || typeof week !== 'number' || !Number.isInteger(week) || week < -1 || week > 3
      || !['external', 'internal', 'unattributed', 'unknown'].includes(typeof source === 'string' ? source : '')
      || !(largest === 0 || largest === 1) || (largest === 1 && source !== 'external') || !count(views) || views === 0
      || ['public_name', 'excluded_views', 'recorded_profiles', 'unversioned_views'].some(key => row[key] !== null)) return invalid();
    const key = JSON.stringify([path, week, source, largest]); if (groups.has(key)) return invalid(); groups.add(key);
    const metric = emptyReachMetrics(); metric.views = views;
    if (source === 'external') metric.externalViews = views;
    else if (source === 'internal') metric.internalViews = views;
    else if (source === 'unattributed') metric.unattributedViews = views;
    else metric.unknownSourceViews = views;
    metric.largestSourceViews = largest === 1 ? views : 0;
    metric.unrecognizedTimeViews = week === -1 ? views : 0;
    add(report.site, metric);
    const siteWeek = report.weeks[week]; if (siteWeek) add(siteWeek.site, metric);
    const article = typeof path === 'string' ? articles.get(path) : undefined;
    if (article) {
      add(article.totals, metric); add(report.articleTotals, metric);
      const articleWeek = article.weeks[week]; if (articleWeek) add(articleWeek, metric);
      if (siteWeek) add(siteWeek.articles, metric);
    }
  }
  if (!summary || summary.article_path !== null || summary.week !== null || summary.source !== null || summary.views !== report.site.views
    || !count(summary.excluded_views) || !count(summary.recorded_profiles) || !count(summary.unversioned_views)
    || summary.largest !== report.site.largestSourceViews || !(summary.public_name === null || (typeof summary.public_name === 'string' && policy.publicHosts.includes(summary.public_name)))) return invalid();
  report.largestExternalSource = { selection: 'largest-in-whole-window', name: summary.public_name, views: report.site.largestSourceViews };
  report.classification = { recordedProfiles: summary.recorded_profiles, unversionedViews: summary.unversioned_views };
  report.referralPolicy.excludedViews = summary.excluded_views;
  report.articles.sort((a, b) => b.totals.views - a.totals.views || a.path.localeCompare(b.path));
  if (!consistentArticleReach(report)) return invalid();
  return report;
}
