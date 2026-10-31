/** Private offline analysis. No transport, account access, storage or reader tracking. */
export const SEARCH_EVIDENCE_VERSION = '2026-10-31.1';
export const SEARCH_EVIDENCE_INPUT_VERSION = 'search-console-query-page-v1';
export const SEARCH_EVIDENCE_MAX_BYTES = 8 * 1024 * 1024;
export interface SearchArticle { path: string; title: string }
interface SearchFilter { dimension: string; operator: string; expression: string }
interface SearchFilterGroup { groupType: 'and'; filters: SearchFilter[] }
interface SearchRow {
  page: string; query: string; clicks: number; impressions: number; ctr: number; position: number;
  articlePath: string | null;
  mapping: 'article' | 'url-variant' | 'other-page' | 'other-origin';
}
export interface SearchEvidenceReport {
  version: typeof SEARCH_EVIDENCE_VERSION;
  provenance: 'synthetic' | 'provided-api-response';
  sourceAuthenticity: 'not-established';
  capturedAt: string;
  scope: {
    siteOrigin: string; property: string; startDate: string; endDate: string;
    timeZone: 'America/Los_Angeles'; endpoints: 'both-inclusive';
    searchType: string; dataState: 'final' | 'all'; freshness: 'final-requested' | 'may-include-preliminary';
    dimensions: string[]; filters: SearchFilterGroup[]; requestedAggregation: 'auto' | 'byPage'; aggregation: 'byPage';
    startRow: number; rowLimit: number; returnedRows: number; atRowLimit: boolean;
    populationCompleteness: 'not-established'; defaultsApplied: string[];
    nativeMetadata: { firstIncompleteDate: string | null };
  };
  totals: { selectedRowClicks: number; selectedRowImpressions: number; selectedRowCtr: number | null };
  urlMapping: Array<{ mapping: SearchRow['mapping']; rows: number; clicks: number; impressions: number }>;
  rows: SearchRow[];
  articles: Array<SearchArticle & { rowIndices: number[]; clicks: number; impressions: number; ctr: number | null }>;
  articlesWithoutReturnedRows: SearchArticle[];
  unmappedRowIndices: number[];
  followUps: { observedClickQueries: number[]; impressionsWithoutClicks: number[]; interpretation: 'inspection-candidates-only' };
  limits: string[];
}

function fail(code: string): never { throw new Error(`Search evidence rejected: ${code}`); }
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function fields(value: Record<string, unknown>, required: string[], optional: string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
function count(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }
function text(value: unknown, maximum: number): value is string { return typeof value === 'string' && value.length <= maximum; }
function day(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
}
function instant(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z');
}
function sum(left: number, right: number): number { const result = left + right; if (!Number.isSafeInteger(result)) fail('count-overflow'); return result; }
function ratio(clicks: number, impressions: number): number | null { return impressions === 0 ? null : clicks / impressions; }
function url(value: string): URL { try { return new URL(value); } catch { return fail('url'); } }
function cleanUrl(value: URL): boolean { return ['http:', 'https:'].includes(value.protocol) && !value.username && !value.password; }
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }

function filters(value: unknown): SearchFilterGroup[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 16) return fail('filters');
  return value.map(group => {
    if (!record(group) || !fields(group, ['groupType', 'filters']) || group.groupType !== 'and'
      || !Array.isArray(group.filters) || group.filters.length > 16) return fail('filters');
    return { groupType: 'and', filters: group.filters.map(filter => {
      if (!record(filter) || !fields(filter, ['dimension', 'operator', 'expression'])
        || typeof filter.dimension !== 'string' || !['page', 'query', 'country', 'device', 'searchAppearance'].includes(filter.dimension)
        || typeof filter.operator !== 'string' || !['equals', 'notEquals', 'contains', 'notContains', 'includingRegex', 'excludingRegex'].includes(filter.operator)
        || !text(filter.expression, 4096)) return fail('filters');
      return { dimension: filter.dimension, operator: filter.operator, expression: filter.expression };
    }) };
  });
}

/** Accepts one saved API slice, with its request and an explicit local catalogue.
 * Does not combine periods/pages, authenticate an export or infer query intent.
 */
export function analyzeSearchEvidence(input: unknown): SearchEvidenceReport {
  let serialized: string | undefined;
  try { serialized = JSON.stringify(input); } catch { return fail('json'); }
  if (serialized === undefined || new TextEncoder().encode(serialized).length > SEARCH_EVIDENCE_MAX_BYTES) return fail('input-budget');
  if (!record(input) || !fields(input, ['version', 'provenance', 'capturedAt', 'siteOrigin', 'property', 'request', 'response', 'articles'])
    || input.version !== SEARCH_EVIDENCE_INPUT_VERSION || !['synthetic', 'provided-api-response'].includes(String(input.provenance))
    || !instant(input.capturedAt)
    || !text(input.siteOrigin, 2048) || !text(input.property, 2048)) return fail('envelope');
  const provenance = input.provenance;
  if (provenance !== 'synthetic' && provenance !== 'provided-api-response') return fail('provenance');
  const origin = url(input.siteOrigin);
  if (!cleanUrl(origin) || origin.origin !== input.siteOrigin) return fail('site-origin');
  const property = input.property;
  let contains: (page: URL) => boolean;
  if (property.startsWith('sc-domain:')) {
    const host = property.slice(10);
    if (!/^(?:[a-z0-9-]+\.)+[a-z0-9-]+$/.test(host) || origin.hostname !== host && !origin.hostname.endsWith('.' + host)) return fail('property');
    contains = page => page.hostname === host || page.hostname.endsWith('.' + host);
  } else {
    const prefix = url(property);
    if (!cleanUrl(prefix) || prefix.search || prefix.hash || prefix.origin !== origin.origin || prefix.href !== property) return fail('property');
    contains = page => page.origin === prefix.origin && page.pathname.startsWith(prefix.pathname);
  }
  const request = input.request, response = input.response;
  if (!record(request) || !fields(request, ['startDate', 'endDate', 'dimensions'], ['type', 'dataState', 'aggregationType', 'rowLimit', 'startRow', 'dimensionFilterGroups'])
    || !day(request.startDate) || !day(request.endDate) || request.startDate > request.endDate
    || !Array.isArray(request.dimensions) || request.dimensions.length !== 2
    || !request.dimensions.every(value => value === 'page' || value === 'query') || new Set(request.dimensions).size !== 2) return fail('request');
  const searchType = request.type === undefined ? 'web' : request.type, state = request.dataState === undefined ? 'final' : request.dataState;
  const requestedAggregation = request.aggregationType === undefined ? 'auto' : request.aggregationType;
  if (typeof searchType !== 'string' || !['web', 'image', 'video', 'news'].includes(searchType)
    || typeof state !== 'string' || !['all', 'final'].includes(state.toLowerCase())
    || requestedAggregation !== 'auto' && requestedAggregation !== 'byPage') return fail('request-profile');
  const dataState = state.toLowerCase(); if (dataState !== 'all' && dataState !== 'final') return fail('data-state');
  const rowLimit = request.rowLimit === undefined ? 1000 : request.rowLimit, startRow = request.startRow === undefined ? 0 : request.startRow;
  if (!count(rowLimit) || rowLimit < 1 || rowLimit > 25000 || !count(startRow)) return fail('pagination');
  const groups = filters(request.dimensionFilterGroups);
  if (!record(response) || !fields(response, ['responseAggregationType'], ['rows', 'metadata']) || response.responseAggregationType !== 'byPage'
    || response.rows !== undefined && !Array.isArray(response.rows)) return fail('response-aggregation');
  let firstIncompleteDate: string | null = null;
  if (response.metadata !== undefined) {
    if (!record(response.metadata) || !fields(response.metadata, [], ['first_incomplete_date'])) return fail('metadata');
    if (response.metadata.first_incomplete_date !== undefined) {
      if (dataState !== 'all' || !day(response.metadata.first_incomplete_date)) return fail('metadata');
      firstIncompleteDate = response.metadata.first_incomplete_date;
    }
  }
  if (!Array.isArray(input.articles) || input.articles.length === 0 || input.articles.length > 1024) return fail('catalogue');
  const catalogue = new Map<string, SearchArticle>();
  for (const article of input.articles) {
    if (!record(article) || !fields(article, ['path', 'title']) || !text(article.path, 2048) || !article.path.startsWith('/') || article.path.startsWith('//')
      || !text(article.title, 240) || !article.title.trim() || catalogue.has(article.path)) return fail('catalogue');
    const page = url(origin.origin + article.path);
    if (page.origin !== origin.origin || page.search || page.hash || page.pathname !== article.path || !contains(page)) return fail('catalogue');
    catalogue.set(article.path, { path: article.path, title: article.title });
  }
  const rawRows = response.rows ?? [];
  if (!Array.isArray(rawRows) || rawRows.length > rowLimit) return fail('row-budget');
  const seen = new Set<string>(), rows: SearchRow[] = [];
  let selectedRowClicks = 0, selectedRowImpressions = 0;
  const pageIndex = request.dimensions.indexOf('page'), queryIndex = request.dimensions.indexOf('query');
  for (const row of rawRows) {
    if (!record(row) || !fields(row, ['keys', 'clicks', 'impressions', 'ctr', 'position']) || !Array.isArray(row.keys) || row.keys.length !== 2
      || !text(row.keys[pageIndex], 4096) || !text(row.keys[queryIndex], 4096) || !count(row.clicks) || !count(row.impressions)
      || typeof row.ctr !== 'number' || !Number.isFinite(row.ctr) || row.ctr < 0 || row.ctr > 1
      || typeof row.position !== 'number' || !Number.isFinite(row.position) || row.position < 0) return fail('row');
    const pageValue: unknown = row.keys[pageIndex], queryValue: unknown = row.keys[queryIndex];
    if (typeof pageValue !== 'string' || typeof queryValue !== 'string') return fail('keys');
    if (row.clicks > row.impressions || Math.abs(row.ctr - (ratio(row.clicks, row.impressions) ?? 0)) > 1e-9) return fail('row-metrics');
    const identity = JSON.stringify([pageValue, queryValue]); if (seen.has(identity)) return fail('duplicate-key'); seen.add(identity);
    const page = url(pageValue); if (!cleanUrl(page) || !contains(page)) return fail('page-outside-property');
    const exact = page.origin === origin.origin && !page.search && !page.hash && pageValue === origin.origin + page.pathname && catalogue.has(page.pathname);
    const variantPath = page.pathname.endsWith('/') ? page.pathname.slice(0, -1) : page.pathname;
    const mapping = exact ? 'article' : page.origin !== origin.origin ? 'other-origin'
      : catalogue.has(page.pathname) || catalogue.has(variantPath) ? 'url-variant' : 'other-page';
    rows.push({ page: pageValue, query: queryValue, clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position,
      articlePath: exact ? page.pathname : null, mapping });
    selectedRowClicks = sum(selectedRowClicks, row.clicks); selectedRowImpressions = sum(selectedRowImpressions, row.impressions);
  }
  const articles: SearchEvidenceReport['articles'] = [], articlesWithoutReturnedRows: SearchArticle[] = [];
  for (const article of catalogue.values()) {
    const rowIndices = rows.flatMap((row, i) => row.articlePath === article.path ? [i] : []);
    if (!rowIndices.length) { articlesWithoutReturnedRows.push(article); continue; }
    let clicks = 0, impressions = 0;
    for (const i of rowIndices) { clicks = sum(clicks, rows[i].clicks); impressions = sum(impressions, rows[i].impressions); }
    articles.push({ ...article, rowIndices, clicks, impressions, ctr: ratio(clicks, impressions) });
  }
  articles.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions || compare(a.path, b.path));
  const order = (a: number, b: number) => compare(rows[a].query, rows[b].query) || compare(rows[a].page, rows[b].page);
  const indices = rows.map((_, i) => i).filter(i => rows[i].articlePath !== null && rows[i].query.trim());
  const mappingKinds: SearchRow['mapping'][] = ['article', 'url-variant', 'other-page', 'other-origin'];
  const urlMapping = mappingKinds.map(mapping => {
    const selected = rows.filter(row => row.mapping === mapping);
    return { mapping, rows: selected.length, clicks: selected.reduce((n, row) => sum(n, row.clicks), 0), impressions: selected.reduce((n, row) => sum(n, row.impressions), 0) };
  });
  return {
    version: SEARCH_EVIDENCE_VERSION, provenance, sourceAuthenticity: 'not-established', capturedAt: input.capturedAt,
    scope: { siteOrigin: origin.origin, property, startDate: request.startDate, endDate: request.endDate,
      timeZone: 'America/Los_Angeles', endpoints: 'both-inclusive', searchType, dataState,
      freshness: dataState === 'final' ? 'final-requested' : 'may-include-preliminary', dimensions: [...request.dimensions],
      filters: groups, requestedAggregation, aggregation: 'byPage', startRow, rowLimit, returnedRows: rows.length, atRowLimit: rows.length === rowLimit,
      populationCompleteness: 'not-established', defaultsApplied: ['type', 'dataState', 'aggregationType', 'rowLimit', 'startRow', 'dimensionFilterGroups'].filter(key => request[key] === undefined),
      nativeMetadata: { firstIncompleteDate } },
    totals: { selectedRowClicks, selectedRowImpressions, selectedRowCtr: ratio(selectedRowClicks, selectedRowImpressions) }, urlMapping, rows, articles, articlesWithoutReturnedRows,
    unmappedRowIndices: rows.flatMap((row, i) => row.articlePath === null ? [i] : []),
    followUps: {
      observedClickQueries: indices.filter(i => rows[i].clicks > 0).sort((a, b) => rows[b].clicks - rows[a].clicks || order(a, b)).slice(0, 20),
      impressionsWithoutClicks: indices.filter(i => rows[i].impressions > 0 && rows[i].clicks === 0).sort((a, b) => rows[b].impressions - rows[a].impressions || order(a, b)).slice(0, 20),
      interpretation: 'inspection-candidates-only',
    },
    limits: [
      'Supplied API-shaped evidence is not an authenticated Google account capture. Synthetic inputs are demonstrations.',
      'Only this saved query/page slice is analyzed. Missing, anonymized or truncated rows are not zero demand; even pagination cannot prove all search data.',
      'Totals and CTR describe selected page/query rows, not property totals, unique readers or article usefulness. Average positions are retained per row and never reaggregated.',
      'PT dates have inclusive endpoints. No fixed-offset UTC conversion or comparison with D1 counts is performed.',
      'Filters are preserved as declared; they are not re-executed with JavaScript or treated as native validation.',
      'Only exact article URLs map to articles; variants and other pages retain their own rows. No-row articles have unavailable demand.',
      'Follow-ups are inspection candidates. They do not diagnose poor titles, unmet total demand or promise rankings or growth.',
    ],
  };
}

function cell(value: string): string { return value.replace(/[\r\n\t]/g, ' ').replace(/[\\`*_{}\[\]()#+.!|<>]/g, '\\$&'); }
/** Human-readable private brief; escape supplied strings instead of rendering links/HTML. */
export function renderSearchEvidence(report: SearchEvidenceReport): string {
  const lines = [report.provenance === 'synthetic' ? '# Synthetic search-evidence demonstration' : '# Saved search-evidence brief', '',
    `Property: ${cell(report.scope.property)}. Catalogue origin: ${cell(report.scope.siteOrigin)}. Captured: ${report.capturedAt}.`,
    `Period: ${report.scope.startDate} through ${report.scope.endDate}, inclusive, America/Los_Angeles.`,
    `Source: ${report.provenance}; authenticity not established. Search: ${report.scope.searchType}; data: ${report.scope.freshness}.`,
    `Saved rows: ${report.scope.returnedRows}; offset: ${report.scope.startRow}; limit: ${report.scope.rowLimit}. Filters: ${cell(JSON.stringify(report.scope.filters))}.`, '',
    `Selected rows contain ${report.totals.selectedRowClicks} reported clicks and ${report.totals.selectedRowImpressions} impressions. These are not property totals or people.`, '',
    '| Returned URL group | Rows | Selected clicks | Selected impressions |', '| --- | ---: | ---: | ---: |'];
  for (const group of report.urlMapping) lines.push(`| ${group.mapping} | ${group.rows} | ${group.clicks} | ${group.impressions} |`);
  lines.push('', '## Articles in this saved slice', '');
  if (report.articles.length) {
    lines.push('| Article | Selected clicks | Selected impressions | Selected CTR | Returned query rows |', '| --- | ---: | ---: | ---: | ---: |');
    for (const article of report.articles) lines.push(`| ${cell(article.title)} (${cell(article.path)}) | ${article.clicks} | ${article.impressions} | ${article.ctr === null ? 'unavailable' : (article.ctr * 100).toFixed(2) + '%'} | ${article.rowIndices.length} |`);
    lines.push('');
  } else lines.push('No exact article URL has returned rows in this slice; demand remains unknown.', '');
  lines.push('Query tables show up to 20 nonempty queries per category, restricted to exact article URLs. Article totals also include rows with empty query keys.', '', '## Queries with reported clicks', '');
  const table = (indices: number[]) => {
    if (!indices.length) { lines.push('No matching rows were returned in this slice; total demand is unknown.', ''); return; }
    lines.push('| Query | Article | Clicks | Impressions | CTR | Position |', '| --- | --- | ---: | ---: | ---: | ---: |');
    for (const index of indices) { const row = report.rows[index]; lines.push(`| ${cell(row.query)} | ${cell(row.articlePath ?? '')} | ${row.clicks} | ${row.impressions} | ${(row.ctr * 100).toFixed(2)}% | ${row.position} |`); }
    lines.push('');
  };
  table(report.followUps.observedClickQueries);
  lines.push('## Impressions without clicks: inspect query fit and search presentation', ''); table(report.followUps.impressionsWithoutClicks);
  if (report.scope.atRowLimit) lines.push('The response reached its requested row limit; additional rows may exist.', '');
  lines.push(`Unmapped or variant URL rows: ${report.unmappedRowIndices.length}. Articles with no returned rows: ${report.articlesWithoutReturnedRows.length}; their demand is unknown.`, '', '## Limits', '');
  lines.push(...report.limits.map(limit => '- ' + limit), ''); return lines.join('\n');
}
