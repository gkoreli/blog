import { isReaderKind, type ReaderKind } from './contracts.js';

export const RESOURCE_REACH_VERSION = 'resource-reach-v1';
export const RESOURCE_REACH_PROFILE = '2026-10-31.1';
export const RESOURCE_REACH_MAX_BYTES = 8 * 1024 * 1024;
export const RESOURCE_ROLES = ['article', 'evidence', 'site', 'unmapped'] as const;
type Role = typeof RESOURCE_ROLES[number];
type Assessment = 'included' | 'owner-excluded' | 'referral-excluded' | 'unassessed';
type Matching = 'canonical' | 'declared-alias' | 'unregistered-path' | 'noncanonical-path';
type StoredKind = ReaderKind | 'not-recorded' | 'unrecognized';
interface Definition { id: string; path: string; title: string; aliases: string[] }
interface History {
  /** Syntactic stamps, not reviewed semantics or deployed-source authentication. */
  collection: string | null; classifier: string | null;
  observationSource: 'edge' | 'beacon' | 'not-recorded' | 'unrecognized';
  representation: 'html' | 'markdown' | 'not-recorded' | 'unrecognized';
}
export interface ResourceMetrics {
  events: number; aliasEvents: number; timeNotRecordedEvents: number; timeUnrecognizedEvents: number;
  byStoredKind: Array<{ kind: StoredKind; events: number }>;
  measurementHistory: Array<History & { events: number }>;
}
interface Accounting {
  selectedEvents: number; includedEvents: number; ownerExcludedEvents: number;
  referralExcludedEvents: number; unassessedEvents: number;
}
interface EvidenceResource extends Definition { metrics: ResourceMetrics }
interface ArticleResource extends Definition {
  article: ResourceMetrics; evidence: EvidenceResource[]; evidenceTotals: ResourceMetrics;
  /** Sum of distinct related event records, never unique audience or article views. */
  relatedResourceEvents: number;
}
export interface ResourceReachReport {
  version: typeof RESOURCE_REACH_VERSION; profile: typeof RESOURCE_REACH_PROFILE;
  provenance: 'saved-events' | 'synthetic'; sourceAuthenticity: 'not-established';
  scope: {
    selectionId: string; registryVersion: string; inclusionContext: string;
    capturedAt: string; startInclusive: string; endExclusive: string; timeZone: 'UTC';
    windowExtendsAfterCapture: boolean; populationCompleteness: 'not-established';
  };
  registry: { articles: number; evidenceResources: number; siteResources: number; registeredPaths: number };
  accounting: Accounting; selected: ResourceMetrics; included: ResourceMetrics;
  roles: Array<{ role: Role; accounting: Accounting; selected: ResourceMetrics; included: ResourceMetrics }>;
  matching: Array<{ basis: Matching; selectedEvents: number; includedEvents: number }>;
  articles: ArticleResource[];
  siteResources: EvidenceResource[];
  limits: string[];
}
type Registration = { role: 'article' | 'evidence'; metrics: ResourceMetrics; parent: ArticleResource }
  | { role: 'site'; metrics: ResourceMetrics };

function fail(code: string): never { throw Error(`Resource reach rejected: ${code}`); }
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function fields(value: Record<string, unknown>, required: string[], optional: string[] = []): boolean {
  return required.every(key => Object.hasOwn(value, key)) && Object.keys(value).every(key => required.includes(key) || optional.includes(key));
}
function text(value: unknown, maximum: number): value is string { return typeof value === 'string' && value.length <= maximum && value.trim().length > 0; }
function identifier(value: unknown): value is string { return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value); }
function array(value: unknown, maximum: number): unknown[] { return Array.isArray(value) && value.length <= maximum ? value : fail('array-budget'); }
function instant(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return null;
  const at = Date.parse(value);
  return Number.isFinite(at) && new Date(at).toISOString().replace('.000Z', 'Z') === value.replace('.000Z', 'Z') ? at : null;
}
function canonicalPath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//') || /[?#\\\u0000-\u0020\u007f]/.test(value) || /%(?![0-9a-fA-F]{2})/.test(value)) return false;
  try { return new URL(value, 'https://registry.invalid').pathname === value; } catch { return false; }
}
function definition(value: unknown, article: boolean): Definition {
  if (!record(value) || !fields(value, ['id', 'path', 'title', ...(article ? ['evidence'] : [])], ['aliases'])
    || !identifier(value.id) || !text(value.path, 2048) || !canonicalPath(value.path) || !text(value.title, 512)) return fail('resource');
  const aliases = value.aliases === undefined ? [] : array(value.aliases, 16).map(alias =>
    text(alias, 2048) && canonicalPath(alias) ? alias : fail('alias'));
  return { id: value.id, path: value.path, title: value.title, aliases };
}
function accounting(): Accounting { return { selectedEvents: 0, includedEvents: 0, ownerExcludedEvents: 0, referralExcludedEvents: 0, unassessedEvents: 0 }; }
function account(target: Accounting, assessment: Assessment): void {
  target.selectedEvents++;
  if (assessment === 'included') target.includedEvents++;
  else if (assessment === 'owner-excluded') target.ownerExcludedEvents++;
  else if (assessment === 'referral-excluded') target.referralExcludedEvents++;
  else target.unassessedEvents++;
}
function metrics(): ResourceMetrics { return { events: 0, aliasEvents: 0, timeNotRecordedEvents: 0, timeUnrecognizedEvents: 0, byStoredKind: [], measurementHistory: [] }; }
function stamp(value: string | null): string | null {
  if (value === null) return null;
  if (!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(value) || instant(value.slice(0, 10) + 'T00:00:00Z') === null) return 'unrecognized';
  return value;
}
function increment(target: ResourceMetrics, kind: StoredKind, history: History, alias: boolean, time: 'recorded' | 'not-recorded' | 'unrecognized'): void {
  target.events++;
  if (alias) target.aliasEvents++;
  if (time === 'not-recorded') target.timeNotRecordedEvents++;
  if (time === 'unrecognized') target.timeUnrecognizedEvents++;
  const byKind = target.byStoredKind.find(row => row.kind === kind);
  if (byKind) byKind.events++; else target.byStoredKind.push({ kind, events: 1 });
  const existing = target.measurementHistory.find(row => row.collection === history.collection && row.classifier === history.classifier
    && row.observationSource === history.observationSource && row.representation === history.representation);
  if (existing) existing.events++; else target.measurementHistory.push({ ...history, events: 1 });
}
function compare(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
function finish(value: ResourceMetrics): void {
  value.byStoredKind.sort((a, b) => compare(a.kind, b.kind));
  value.measurementHistory.sort((a, b) => compare(JSON.stringify(a), JSON.stringify(b)));
}
const LIMITS = [
  'Counts describe supplied event records and supplied inclusion decisions. The parser authenticates neither captures nor policy assessments, and does not establish population completeness.',
  'One event has one resource role. Evidence-page events remain separate from article events; related-resource totals are event sums, not unique audience, reading, comprehension or use.',
  'The registry supplies IDs, paths, aliases and parent relationships. Titles are labels. IDs are scoped to the registry version; historical presentation and cross-version identity are not reconstructed.',
  'Matching uses exact serialized path identity. No suffix inference, percent-decoding, redirect lookup, query stripping or undeclared variant merging occurs. Unmapped paths and event references are not returned.',
  'Stored kinds and method stamps are retained classifications/provenance, not verified operator identity, physical devices, a human trigger or per-action purpose.',
  'Missing or malformed timestamps remain visible; their membership in the supplied window cannot be independently confirmed. Zero means no included event in this slice, not zero demand.',
];

/** Offline accounting over one explicit selection. No collection, transport or storage. */
export function analyzeResourceReach(input: unknown): ResourceReachReport {
  let serialized: string | undefined;
  try { serialized = JSON.stringify(input); } catch { return fail('json'); }
  if (!serialized || new TextEncoder().encode(serialized).length > RESOURCE_REACH_MAX_BYTES) return fail('input-budget');
  if (!record(input) || !fields(input, ['version', 'provenance', 'scope', 'registry', 'events']) || input.version !== RESOURCE_REACH_VERSION
    || input.provenance !== 'saved-events' && input.provenance !== 'synthetic') return fail('envelope');
  const scope = input.scope;
  if (!record(scope) || !fields(scope, ['selectionId', 'registryVersion', 'inclusionContext', 'capturedAt', 'startInclusive', 'endExclusive'])
    || !text(scope.selectionId, 256) || !text(scope.registryVersion, 256) || !text(scope.inclusionContext, 1024)
    || !text(scope.capturedAt, 32) || !text(scope.startInclusive, 32) || !text(scope.endExclusive, 32)) return fail('scope');
  const captured = instant(scope.capturedAt), start = instant(scope.startInclusive), end = instant(scope.endExclusive);
  if (captured === null || start === null || end === null || start >= end) return fail('window');
  if (!record(input.registry) || !fields(input.registry, ['articles', 'siteResources'])) return fail('registry');
  const index = new Map<string, Registration & { alias: boolean }>(), ids = new Set<string>();
  let registeredResources = 0;
  function register(resource: Definition, registration: Registration): void {
    if (ids.has(resource.id)) fail('duplicate-resource-id'); ids.add(resource.id);
    if (++registeredResources > 4096) fail('registry-budget');
    for (const path of [resource.path, ...resource.aliases]) {
      if (index.has(path)) fail('ambiguous-path');
      if (index.size >= 8192) fail('path-budget');
      index.set(path, { ...registration, alias: path !== resource.path });
    }
  }
  const articles: ArticleResource[] = array(input.registry.articles, 1024).map(raw => {
    const item = definition(raw, true);
    if (!record(raw)) return fail('resource');
    const parent: ArticleResource = { ...item, article: metrics(), evidence: [], evidenceTotals: metrics(), relatedResourceEvents: 0 };
    register(parent, { role: 'article', metrics: parent.article, parent });
    parent.evidence = array(raw.evidence, 64).map(value => {
      const resource = { ...definition(value, false), metrics: metrics() };
      register(resource, { role: 'evidence', metrics: resource.metrics, parent }); return resource;
    });
    return parent;
  });
  const siteResources = array(input.registry.siteResources, 1024).map(value => {
    const resource = { ...definition(value, false), metrics: metrics() };
    register(resource, { role: 'site', metrics: resource.metrics }); return resource;
  });
  const totals = accounting(), selected = metrics(), included = metrics();
  const roles = RESOURCE_ROLES.map(role => ({ role, accounting: accounting(), selected: metrics(), included: metrics() }));
  const bases: Matching[] = ['canonical', 'declared-alias', 'unregistered-path', 'noncanonical-path'];
  const matching = bases.map(basis => ({ basis, selectedEvents: 0, includedEvents: 0 }));
  const eventReferences = new Set<string>(), histories = new Set<string>();
  for (const event of array(input.events, 4096)) {
    if (!record(event) || !fields(event, ['reference', 'path', 'observedAt', 'assessment', 'storedKind', 'collection', 'classifier', 'observationSource', 'representation'])
      || !text(event.reference, 128) || !text(event.path, 2048)
      || event.observedAt !== null && !text(event.observedAt, 64)
      || event.storedKind !== null && (typeof event.storedKind !== 'string' || event.storedKind.length > 128)
      || ![event.collection, event.classifier, event.observationSource, event.representation].every(value => value === null || typeof value === 'string' && value.length <= 32)) return fail('event');
    const assessment = event.assessment;
    if (assessment !== 'included' && assessment !== 'owner-excluded' && assessment !== 'referral-excluded' && assessment !== 'unassessed') return fail('assessment');
    if (eventReferences.has(event.reference)) fail('duplicate-event'); eventReferences.add(event.reference);
    // Narrow each nullable field explicitly; arbitrary source values never become output labels.
    const { collection, classifier, observationSource, representation } = event;
    if (collection !== null && typeof collection !== 'string' || classifier !== null && typeof classifier !== 'string'
      || observationSource !== null && typeof observationSource !== 'string' || representation !== null && typeof representation !== 'string') return fail('event');
    const history: History = { collection: stamp(collection), classifier: stamp(classifier),
      observationSource: observationSource === null ? 'not-recorded' : observationSource === 'edge' || observationSource === 'beacon' ? observationSource : 'unrecognized',
      representation: representation === null ? 'not-recorded' : representation === 'html' || representation === 'markdown' ? representation : 'unrecognized' };
    histories.add(JSON.stringify(history)); if (histories.size > 128) fail('measurement-history-budget');
    const at = event.observedAt === null ? null : instant(event.observedAt);
    if (at !== null && (at < start || at >= end)) fail('event-outside-window');
    const time = event.observedAt === null ? 'not-recorded' : at === null ? 'unrecognized' : 'recorded';
    const kind = event.storedKind === null ? 'not-recorded' : isReaderKind(event.storedKind) ? event.storedKind : 'unrecognized';
    const validPath = canonicalPath(event.path), owner = validPath ? index.get(event.path) : undefined;
    const role = roles.find(row => row.role === (owner?.role ?? 'unmapped'));
    const basis = matching.find(row => row.basis === (!validPath ? 'noncanonical-path' : !owner ? 'unregistered-path' : owner.alias ? 'declared-alias' : 'canonical'));
    if (!role || !basis) return fail('internal-role');
    account(totals, assessment); account(role.accounting, assessment); basis.selectedEvents++;
    increment(selected, kind, history, owner?.alias ?? false, time); increment(role.selected, kind, history, owner?.alias ?? false, time);
    if (assessment !== 'included') continue;
    basis.includedEvents++;
    increment(included, kind, history, owner?.alias ?? false, time); increment(role.included, kind, history, owner?.alias ?? false, time);
    if (owner) {
      increment(owner.metrics, kind, history, owner.alias, time);
      if (owner.role !== 'site') {
        owner.parent.relatedResourceEvents++;
        if (owner.role === 'evidence') increment(owner.parent.evidenceTotals, kind, history, owner.alias, time);
      }
    }
  }
  const allMetrics = [selected, included, ...roles.flatMap(row => [row.selected, row.included]), ...siteResources.map(row => row.metrics),
    ...articles.flatMap(row => [row.article, row.evidenceTotals, ...row.evidence.map(resource => resource.metrics)])];
  allMetrics.forEach(finish);
  return { version: RESOURCE_REACH_VERSION, profile: RESOURCE_REACH_PROFILE, provenance: input.provenance, sourceAuthenticity: 'not-established',
    scope: { selectionId: scope.selectionId, registryVersion: scope.registryVersion, inclusionContext: scope.inclusionContext, capturedAt: scope.capturedAt,
      startInclusive: scope.startInclusive, endExclusive: scope.endExclusive, timeZone: 'UTC', windowExtendsAfterCapture: end > captured, populationCompleteness: 'not-established' },
    registry: { articles: articles.length, evidenceResources: articles.reduce((n, row) => n + row.evidence.length, 0), siteResources: siteResources.length, registeredPaths: index.size },
    accounting: totals, selected, included, roles, matching, articles, siteResources, limits: [...LIMITS] };
}
function escape(value: string): string { return value.replace(/[&<>|`*_[\]\\]/g, character => `&#${character.charCodeAt(0)};`).replace(/[\r\n]/g, ' '); }
export function renderResourceReach(report: ResourceReachReport): string {
  const a = report.accounting;
  const lines = [report.provenance === 'synthetic' ? '# Synthetic resource-reach demonstration' : '# Article and evidence-resource reach', '',
    `${escape(report.scope.selectionId)}. UTC [${escape(report.scope.startInclusive)}, ${escape(report.scope.endExclusive)}). Captured ${escape(report.scope.capturedAt)}.`, '',
    `Registry: ${escape(report.scope.registryVersion)}. Inclusion: ${escape(report.scope.inclusionContext)}.`, '',
    `${a.selectedEvents} supplied events: ${a.includedEvents} included, ${a.ownerExcludedEvents} owner-excluded, ${a.referralExcludedEvents} referral-excluded, ${a.unassessedEvents} unassessed.`, '',
    '| Resource role | Supplied | Included | Owner-excluded | Referral-excluded | Unassessed |', '| --- | ---: | ---: | ---: | ---: | ---: |'];
  for (const row of report.roles) { const c = row.accounting; lines.push(`| ${row.role} | ${c.selectedEvents} | ${c.includedEvents} | ${c.ownerExcludedEvents} | ${c.referralExcludedEvents} | ${c.unassessedEvents} |`); }
  lines.push('', '## Related resources', '', 'Evidence-page events stay separate from article events. Related totals are sums of distinct event records. Zero describes this supplied slice; demand is unknown.', '',
    '| Article | Article events | Evidence-page events | Related resource events |', '| --- | ---: | ---: | ---: |');
  for (const row of report.articles) lines.push(`| ${escape(row.title)} (${escape(row.id)}) | ${row.article.events} | ${row.evidenceTotals.events} | ${row.relatedResourceEvents} |`);
  lines.push('', '## Evidence quality', '', `All supplied events: ${report.selected.timeNotRecordedEvents} missing timestamps; ${report.selected.timeUnrecognizedEvents} unrecognized timestamps.`, '', `Included events using declared aliases: ${report.included.aliasEvents}. Missing timestamps: ${report.included.timeNotRecordedEvents}; unrecognized timestamps: ${report.included.timeUnrecognizedEvents}.`, '',
    `Window extends after capture: ${report.scope.windowExtendsAfterCapture}. Population completeness and source authenticity are not established.`, '',
    '| Stored kind | Included events |', '| --- | ---: |');
  for (const row of report.included.byStoredKind) lines.push(`| ${row.kind} | ${row.events} |`);
  lines.push('', 'Measurement history and quality are retained for all supplied events and separately for included events by role in report.json. Registered-resource metrics describe included events. No people, physical devices or purpose are inferred.', '', '## Boundaries', '', ...report.limits.map(value => `- ${value}`), '');
  return lines.join('\n');
}
