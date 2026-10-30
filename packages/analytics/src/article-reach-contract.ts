/** Request evidence for editorial decisions; no reader, session or identity claims. */
export const ARTICLE_REACH_VERSION = '2026-10-30.2';
export const REACH_METRIC_KEYS = ['views', 'externalViews', 'internalViews', 'unattributedViews', 'unknownSourceViews', 'largestSourceViews', 'unrecognizedTimeViews'] as const;
export interface ReachMetrics {
  views: number;
  externalViews: number;
  internalViews: number;
  unattributedViews: number;
  unknownSourceViews: number;
  largestSourceViews: number;
  unrecognizedTimeViews: number;
}
export interface ReachArticle {
  path: string;
  title: string;
  publishedOn: string;
}
export interface ArticleSourceConcentration {
  selection: 'largest-for-article-in-whole-window';
  name: string | null;
  views: number;
  weeks: number[];
  unrecognizedTimeViews: number;
}
/** Syntactically recognized stamps are retained provenance, not reviewed semantics. */
export interface ReachMeasurementHistory {
  path: string | null;
  collection: string | null;
  classifier: string | null;
  observationSource: 'edge' | 'beacon' | 'not-recorded' | 'unrecognized';
  representation: 'html' | 'markdown' | 'not-recorded' | 'unrecognized';
  views: number;
  weeks: number[];
  unrecognizedTimeViews: number;
}
export interface ArticleReachReport {
  version: typeof ARTICLE_REACH_VERSION;
  period: { startInclusive: string; endExclusive: string; updatedAt: string; timeZone: 'UTC' };
  selection: 'stored-browser-signals';
  catalogueSize: number;
  site: ReachMetrics;
  articleTotals: ReachMetrics;
  weeks: Array<{ startInclusive: string; endExclusive: string; site: ReachMetrics; articles: ReachMetrics }>;
  articles: Array<ReachArticle & { totals: ReachMetrics; weeks: ReachMetrics[]; largestExternalSource: ArticleSourceConcentration }>;
  largestExternalSource: { selection: 'largest-in-whole-window'; name: string | null; views: number };
  classification: { recordedProfiles: number; unversionedViews: number };
  measurementHistory: ReachMeasurementHistory[];
  referralPolicy: { version: string; sha256: string; excludedViews: number };
}

export function emptyReachMetrics(): ReachMetrics {
  return { views: 0, externalViews: 0, internalViews: 0, unattributedViews: 0, unknownSourceViews: 0, largestSourceViews: 0, unrecognizedTimeViews: 0 };
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function keys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  return Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
}
function count(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }
function sourceName(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= 253 && /^(?:[a-z0-9-]+\.)+[a-z0-9-]+$/.test(value));
}
export function reachDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}
export function reachMeasurementStamp(value: unknown): value is string | null {
  return value === null || value === 'unrecognized' || (typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}\.(?:0|[1-9]\d{0,5})$/.test(value) && reachDay(value.slice(0, 10)));
}
export function reachMeasurementHistoryRow(value: unknown): value is ReachMeasurementHistory {
  return record(value) && keys(value, ['path', 'collection', 'classifier', 'observationSource', 'representation', 'views', 'weeks', 'unrecognizedTimeViews'])
    && (value.path === null || typeof value.path === 'string')
    && reachMeasurementStamp(value.collection) && reachMeasurementStamp(value.classifier)
    && ['edge', 'beacon', 'not-recorded', 'unrecognized'].some(v => v === value.observationSource)
    && ['html', 'markdown', 'not-recorded', 'unrecognized'].some(v => v === value.representation)
    && count(value.views) && value.views > 0 && count(value.unrecognizedTimeViews)
    && Array.isArray(value.weeks) && value.weeks.length === 4 && value.weeks.every(count)
    && value.weeks.reduce((sum, n) => sum + BigInt(n), BigInt(value.unrecognizedTimeViews)) === BigInt(value.views);
}

interface MeasurementScope { path: string | null; views: number; weeks: number[]; unknown: number }
function measurementHistory(value: unknown, expected: readonly MeasurementScope[], unversionedViews: number): boolean {
  if (!Array.isArray(value) || !value.every(reachMeasurementHistoryRow)) return false;
  const seen = new Set<string>();
  const scopes = new Map<string | null, { views: bigint; weeks: bigint[]; unknown: bigint }>();
  let unversioned = 0n;
  for (const row of value) {
    if (!expected.some(e => e.path === row.path)) return false;
    const key = JSON.stringify([row.path, row.collection, row.classifier, row.observationSource, row.representation]);
    if (seen.has(key)) return false;
    seen.add(key);
    if (row.classifier === null) unversioned += BigInt(row.views);
    const totals = scopes.get(row.path) ?? { views: 0n, weeks: [0n, 0n, 0n, 0n], unknown: 0n };
    totals.views += BigInt(row.views); totals.unknown += BigInt(row.unrecognizedTimeViews);
    for (const [i, count] of row.weeks.entries()) totals.weeks[i] = (totals.weeks[i] ?? 0n) + BigInt(count);
    scopes.set(row.path, totals);
  }
  return unversioned === BigInt(unversionedViews) && expected.every(e => {
    const actual = scopes.get(e.path) ?? { views: 0n, weeks: [0n, 0n, 0n, 0n], unknown: 0n };
    return actual.views === BigInt(e.views) && actual.unknown === BigInt(e.unknown)
      && e.weeks.every((n, i) => actual.weeks[i] === BigInt(n));
  });
}
export function validReachCatalogue(value: unknown): value is ReachArticle[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 256) return false;
  const paths = new Set<string>();
  return value.every(post => {
    if (!record(post) || !keys(post, ['path', 'title', 'publishedOn'])
      || typeof post.path !== 'string' || post.path.length > 256 || !/^\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.path)
      || typeof post.title !== 'string' || post.title.trim().length === 0 || post.title.length > 240
      || !reachDay(post.publishedOn) || paths.has(post.path)) return false;
    paths.add(post.path); return true;
  });
}
function metrics(value: unknown): value is ReachMetrics {
  if (!record(value) || !keys(value, REACH_METRIC_KEYS) || !REACH_METRIC_KEYS.every(key => count(value[key]))) return false;
  // Narrow individually rather than trusting a cast after generic key iteration.
  const { views, externalViews, internalViews, unattributedViews, unknownSourceViews, largestSourceViews, unrecognizedTimeViews } = value;
  return count(views) && count(externalViews) && count(internalViews) && count(unattributedViews) && count(unknownSourceViews)
    && count(largestSourceViews) && count(unrecognizedTimeViews)
    && externalViews + internalViews + unattributedViews + unknownSourceViews === views
    && largestSourceViews <= externalViews && unrecognizedTimeViews <= views;
}
function sum(rows: ReachMetrics[]): ReachMetrics {
  const total = emptyReachMetrics();
  for (const row of rows) for (const key of REACH_METRIC_KEYS) total[key] += row[key];
  return total;
}
function contained(part: ReachMetrics, whole: ReachMetrics): boolean { return REACH_METRIC_KEYS.every(key => part[key] <= whole[key]); }
function equal(left: ReachMetrics, right: ReachMetrics): boolean { return REACH_METRIC_KEYS.every(key => left[key] === right[key]); }
function completedWeeks(weeks: ReachMetrics[], total: ReachMetrics): boolean {
  const combined = sum(weeks);
  return weeks.length === 4 && weeks.every(week => week.unrecognizedTimeViews === 0)
    && contained(combined, total) && combined.views + total.unrecognizedTimeViews === total.views;
}

/** Reject stale, incomplete or contradictory responses at both server and browser boundaries. */
export function consistentArticleReach(value: unknown): value is ArticleReachReport {
  if (!record(value) || !keys(value, ['version', 'period', 'selection', 'catalogueSize', 'site', 'articleTotals', 'weeks', 'articles', 'largestExternalSource', 'classification', 'measurementHistory', 'referralPolicy'])
    || value.version !== ARTICLE_REACH_VERSION || value.selection !== 'stored-browser-signals'
    || !metrics(value.site) || !metrics(value.articleTotals) || !contained(value.articleTotals, value.site)) return false;
  const { period, classification, referralPolicy, largestExternalSource } = value;
  if (!record(period) || !keys(period, ['startInclusive', 'endExclusive', 'updatedAt', 'timeZone'])
    || !reachDay(period.startInclusive) || !reachDay(period.endExclusive) || period.timeZone !== 'UTC'
    || typeof period.updatedAt !== 'string' || !Number.isFinite(Date.parse(period.updatedAt))) return false;
  const start = Date.parse(period.startInclusive + 'T00:00:00Z'), end = Date.parse(period.endExclusive + 'T00:00:00Z');
  const updated = new Date(period.updatedAt);
  if (end - start !== 28 * 86_400_000 || updated.toISOString() !== period.updatedAt || period.updatedAt.slice(0, 10) !== period.endExclusive) return false;
  if (!record(classification) || !keys(classification, ['recordedProfiles', 'unversionedViews']) || !count(classification.recordedProfiles)
    || !count(classification.unversionedViews) || classification.unversionedViews > value.site.views
    || classification.recordedProfiles > value.site.views - classification.unversionedViews
    || (classification.recordedProfiles === 0) !== (classification.unversionedViews === value.site.views)) return false;
  if (!record(referralPolicy) || !keys(referralPolicy, ['version', 'sha256', 'excludedViews']) || typeof referralPolicy.version !== 'string'
    || !/^\d{4}-\d{2}-\d{2}\.\d+$/.test(referralPolicy.version) || typeof referralPolicy.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(referralPolicy.sha256) || !count(referralPolicy.excludedViews)) return false;
  if (!record(largestExternalSource) || !keys(largestExternalSource, ['selection', 'name', 'views']) || largestExternalSource.selection !== 'largest-in-whole-window'
    || !sourceName(largestExternalSource.name)
    || largestExternalSource.views !== value.site.largestSourceViews || (largestExternalSource.views === 0 && largestExternalSource.name !== null)
    || (value.site.largestSourceViews === 0) !== (value.site.externalViews === 0)) return false;
  if (!Array.isArray(value.weeks) || value.weeks.length !== 4 || !Array.isArray(value.articles) || value.articles.length === 0 || value.articles.length > 256 || value.catalogueSize !== value.articles.length) return false;
  const siteWeeks: ReachMetrics[] = [], articleWeeks: ReachMetrics[] = [];
  for (let index = 0; index < 4; index++) {
    const week: unknown = value.weeks[index];
    if (!record(week) || !keys(week, ['startInclusive', 'endExclusive', 'site', 'articles']) || !metrics(week.site) || !metrics(week.articles)
      || !contained(week.articles, week.site) || week.startInclusive !== new Date(start + index * 7 * 86_400_000).toISOString().slice(0, 10)
      || week.endExclusive !== new Date(start + (index + 1) * 7 * 86_400_000).toISOString().slice(0, 10)) return false;
    siteWeeks.push(week.site); articleWeeks.push(week.articles);
  }
  if (!completedWeeks(siteWeeks, value.site) || !completedWeeks(articleWeeks, value.articleTotals)) return false;
  const catalogue: ReachArticle[] = [], totals: ReachMetrics[] = [], perWeek: ReachMetrics[][] = [[], [], [], []];
  for (const article of value.articles) {
    if (!record(article) || !keys(article, ['path', 'title', 'publishedOn', 'totals', 'weeks', 'largestExternalSource']) || typeof article.path !== 'string'
      || typeof article.title !== 'string' || typeof article.publishedOn !== 'string' || !metrics(article.totals)
      || !Array.isArray(article.weeks) || !article.weeks.every(metrics) || !completedWeeks(article.weeks, article.totals)) return false;
    const source = article.largestExternalSource;
    if (!record(source) || !keys(source, ['selection', 'name', 'views', 'weeks', 'unrecognizedTimeViews'])
      || source.selection !== 'largest-for-article-in-whole-window' || !sourceName(source.name)
      || !count(source.views) || !count(source.unrecognizedTimeViews) || !Array.isArray(source.weeks) || source.weeks.length !== 4 || !source.weeks.every(count)
      || source.views > article.totals.externalViews || source.views < article.totals.largestSourceViews
      || source.unrecognizedTimeViews > article.totals.unrecognizedTimeViews
      || source.weeks.reduce((total, value) => total + value, 0) + source.unrecognizedTimeViews !== source.views
      || (source.views === 0) !== (article.totals.externalViews === 0) || (source.views === 0 && source.name !== null)
      || (source.name !== null && source.name === largestExternalSource.name && source.views !== article.totals.largestSourceViews)) return false;
    catalogue.push({ path: article.path, title: article.title, publishedOn: article.publishedOn }); totals.push(article.totals);
    for (let i = 0; i < 4; i++) {
      const week = article.weeks[i], peers = perWeek[i];
      const sourceViews = source.weeks[i];
      if (!week || !peers || sourceViews === undefined || sourceViews > week.externalViews) return false;
      peers.push(week);
    }
  }
  const measurementScopes: MeasurementScope[] = [{ path: null, views: value.site.views - value.articleTotals.views,
    unknown: value.site.unrecognizedTimeViews - value.articleTotals.unrecognizedTimeViews,
    weeks: siteWeeks.map((w, i) => w.views - (articleWeeks[i]?.views ?? 0)) },
    ...catalogue.map((a, i) => ({ path: a.path, views: totals[i]?.views ?? 0, unknown: totals[i]?.unrecognizedTimeViews ?? 0,
      weeks: perWeek.map(w => w[i]?.views ?? 0) }))];
  return validReachCatalogue(catalogue) && equal(sum(totals), value.articleTotals) && perWeek.every((week, i) => equal(sum(week), articleWeeks[i] ?? emptyReachMetrics()))
    && measurementHistory(value.measurementHistory, measurementScopes, classification.unversionedViews);
}
