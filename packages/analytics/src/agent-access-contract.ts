import { AGENT_ACCESS_KINDS, isAgentAccessKind, type AgentAccessKind } from './agent-roles.js';
import { clientDefinition, CLIENT_REGISTRY_PROFILE, type KnownClientName } from './client-registry.js';
import { isSignatureBasis, type SignatureBasis } from './signature-basis.js';
import { isReportedVerifierProfile, type ReportedVerifierProfile } from './verifier-profile.js';
import { reachDay, reachMeasurementStamp } from './article-reach-contract.js';
import { isPublicSignerName, type PublicSignerName } from './signers.js';
import { addCalendarDays, calendarDaysBetween, isCanonicalUtcInstant, utcDateKey, utcInstant } from '@gkoreli/time';

export { AGENT_ACCESS_KINDS, AGENT_ROLE_LABELS, isAgentAccessKind } from './agent-roles.js';
export type { AgentAccessKind } from './agent-roles.js';
export const AGENT_ACCESS_VERSION = '2026-11-14.1';
export const AGENT_RESOURCE_LIMIT = 512;
export const AGENT_ACCESS_ROW_LIMIT = 50_000;
const DAY_MASK = 2 ** 28 - 1;

export interface AgentAccessResource {
  id: string;
  path: string;
  title: string;
  role: 'article' | 'evidence' | 'site';
  articleId: string | null;
  /** Current collector coverage, not a reconstructed availability interval. */
  collection: 'page' | 'not-collected';
}
export type AgentAccessClient = KnownClientName | 'not-recorded' | 'unrecognized';
export const AGENT_FORMATS = ['html', 'markdown', 'not-recorded', 'unrecognized'] as const;
export type AgentAccessFormat = typeof AGENT_FORMATS[number];
export type AccessWeeks = [number, number, number, number];
export interface AgentAccessMetrics {
  views: number;
  weeks: AccessWeeks;
  /** Union of observed UTC days, never a sum of per-client day counts. */
  dayMask: number;
  unrecognizedTimeViews: number;
}
export interface AgentAccessDimension {
  resourceId: string | null;
  kind: AgentAccessKind;
  client: AgentAccessClient;
  format: AgentAccessFormat;
}
export interface AgentAccessCell extends AgentAccessDimension { metrics: AgentAccessMetrics }
export interface AgentAccessHistory extends AgentAccessCell {
  collection: string | null;
  classifier: string | null;
  source: 'edge' | 'beacon' | 'not-recorded' | 'unrecognized';
}
export interface AgentAccessProof extends AgentAccessDimension {
  basis: SignatureBasis;
  profile: ReportedVerifierProfile;
  publisher: PublicSignerName | 'not-recorded';
  network: 'recognized' | 'not-recorded' | 'unrecognized';
  networkListed: boolean;
  views: number;
}
export interface AgentAccessReport {
  version: typeof AGENT_ACCESS_VERSION;
  scope: {
    start: string;
    endExclusive: string;
    calculatedAt: string;
    timeZone: 'UTC';
    days: 28;
    cohort: 'stored-ai-roles-and-signed-fallback';
    catalogueHash: string;
    registryProfile: string;
    referralPolicyHash: string;
  };
  resources: AgentAccessResource[];
  accounting: {
    windowViews: number;
    ownerExcludedViews: number;
    referralExcludedViews: number;
    includedViews: number;
    otherViews: number;
  };
  total: AgentAccessMetrics;
  resourceTotals: Array<{ resourceId: string | null; metrics: AgentAccessMetrics }>;
  roleTotals: Array<{ kind: AgentAccessKind; metrics: AgentAccessMetrics }>;
  cells: AgentAccessCell[];
  history: AgentAccessHistory[];
  proofs: AgentAccessProof[];
}
export interface AgentAccessSelection {
  articleId: string | null;
  client: AgentAccessClient | null;
  kind: AgentAccessKind | null;
}

function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function keys(value: Record<string, unknown>, names: readonly string[]): boolean { return Object.keys(value).length === names.length && names.every(name => Object.hasOwn(value, name)); }
function count(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }
function text(value: unknown, maximum: number): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum; }
function hash(value: unknown): value is string { return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value); }
export function isAgentAccessClient(value: unknown): value is AgentAccessClient {
  return value === 'not-recorded' || value === 'unrecognized' || typeof value === 'string' && clientDefinition(value) !== null;
}
export function isAgentAccessFormat(value: unknown): value is AgentAccessFormat { return AGENT_FORMATS.some(format => value === format); }
export function accessDayCount(mask: number): number {
  let count = 0;
  for (let bits = mask; bits > 0; bits >>>= 1) count += bits & 1;
  return count;
}
export function emptyAgentAccessMetrics(): AgentAccessMetrics { return { views: 0, weeks: [0, 0, 0, 0], dayMask: 0, unrecognizedTimeViews: 0 }; }
export function addAgentAccessMetrics(target: AgentAccessMetrics, part: AgentAccessMetrics): void {
  if (!Number.isSafeInteger(target.views + part.views)) throw new Error('Agent access count exceeds exact arithmetic');
  target.views += part.views;
  target.weeks = [target.weeks[0] + part.weeks[0], target.weeks[1] + part.weeks[1], target.weeks[2] + part.weeks[2], target.weeks[3] + part.weeks[3]];
  target.dayMask |= part.dayMask;
  target.unrecognizedTimeViews += part.unrecognizedTimeViews;
}
function sameMetrics(left: AgentAccessMetrics, right: AgentAccessMetrics): boolean {
  return left.views === right.views && left.dayMask === right.dayMask && left.unrecognizedTimeViews === right.unrecognizedTimeViews && left.weeks.every((value, index) => value === right.weeks[index]);
}
export function validAgentAccessMetrics(value: unknown): value is AgentAccessMetrics {
  if (!record(value) || !keys(value, ['views', 'weeks', 'dayMask', 'unrecognizedTimeViews']) || !count(value.views)
    || !Array.isArray(value.weeks) || value.weeks.length !== 4 || !value.weeks.every(count)
    || !count(value.dayMask) || value.dayMask > DAY_MASK || !count(value.unrecognizedTimeViews)) return false;
  if (value.weeks.reduce((sum, item) => sum + item, value.unrecognizedTimeViews) !== value.views) return false;
  const mask = value.dayMask;
  return value.weeks.every((views, index) => {
    const days = accessDayCount((mask >>> (index * 7)) & 127);
    return days <= views && (views === 0 ? days === 0 : days > 0);
  });
}
export function validAgentAccessCatalogue(value: unknown): value is AgentAccessResource[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > AGENT_RESOURCE_LIMIT) return false;
  const ids = new Set<string>(), paths = new Set<string>(), articles = new Set<string>();
  const parents: string[] = [];
  for (const resource of value) {
    if (!record(resource) || !keys(resource, ['id', 'path', 'title', 'role', 'articleId', 'collection'])
      || typeof resource.id !== 'string' || !/^[a-z0-9][a-z0-9:-]{0,127}$/.test(resource.id) || ids.has(resource.id)
      || !text(resource.title, 256) || !text(resource.path, 512) || !/^\/(?:[a-z0-9][a-z0-9/._-]*)?$/.test(resource.path)
      || resource.path.includes('//') || new URL(resource.path, 'https://catalogue.invalid').pathname !== resource.path || paths.has(resource.path)
      || !['article', 'evidence', 'site'].includes(String(resource.role)) || !['page', 'not-collected'].includes(String(resource.collection))
      || (resource.articleId !== null && typeof resource.articleId !== 'string')) return false;
    if (resource.role === 'article') articles.add(resource.id);
    if (resource.role !== 'evidence' && resource.articleId !== null || resource.role === 'evidence' && resource.articleId === null) return false;
    if (resource.role === 'evidence' && typeof resource.articleId === 'string') parents.push(resource.articleId);
    ids.add(resource.id); paths.add(resource.path);
  }
  return parents.every(parent => articles.has(parent));
}
export function agentAccessWindow(now: Date): { start: string; endExclusive: string; calculatedAt: string } {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid agent access clock');
  const endExclusive = utcDateKey(now);
  return { start: addCalendarDays(endExclusive, -28), endExclusive, calculatedAt: utcInstant(now) };
}
export async function agentAccessCatalogueHash(resources: AgentAccessResource[]): Promise<string> {
  if (!validAgentAccessCatalogue(resources)) throw new Error('Invalid agent access resource catalogue');
  const bytes = new TextEncoder().encode(JSON.stringify([...resources].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(resource => [resource.id, resource.path, resource.title, resource.role, resource.articleId, resource.collection])));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
}

function dimension(value: Record<string, unknown>, resources: ReadonlySet<string>): value is Record<string, unknown> & AgentAccessDimension {
  return (value.resourceId === null || typeof value.resourceId === 'string' && resources.has(value.resourceId))
    && isAgentAccessKind(value.kind) && isAgentAccessClient(value.client) && isAgentAccessFormat(value.format);
}
function dimensionKey(value: AgentAccessDimension): string { return JSON.stringify([value.resourceId, value.kind, value.client, value.format]); }
function sum(rows: readonly { metrics: AgentAccessMetrics }[]): AgentAccessMetrics {
  const total = emptyAgentAccessMetrics();
  for (const row of rows) addAgentAccessMetrics(total, row.metrics);
  return total;
}

/** Validate independent database totals against the joint cells, history and proof
 * partitions. A missing section or dropped cell must not become a plausible zero.
 */
function checkedAgentAccessReport(value: unknown): value is AgentAccessReport {
  if (!record(value) || !keys(value, ['version', 'scope', 'resources', 'accounting', 'total', 'resourceTotals', 'roleTotals', 'cells', 'history', 'proofs'])
    || value.version !== AGENT_ACCESS_VERSION || !validAgentAccessCatalogue(value.resources) || !record(value.scope) || !record(value.accounting)) return false;
  const scope = value.scope, accounting = value.accounting;
  if (!keys(scope, ['start', 'endExclusive', 'calculatedAt', 'timeZone', 'days', 'cohort', 'catalogueHash', 'registryProfile', 'referralPolicyHash'])
    || !reachDay(scope.start) || !reachDay(scope.endExclusive) || calendarDaysBetween(scope.start, scope.endExclusive) !== 28
    || !isCanonicalUtcInstant(scope.calculatedAt) || utcDateKey(scope.calculatedAt) !== scope.endExclusive
    || scope.timeZone !== 'UTC' || scope.days !== 28 || scope.cohort !== 'stored-ai-roles-and-signed-fallback'
    || !hash(scope.catalogueHash) || scope.registryProfile !== CLIENT_REGISTRY_PROFILE || !hash(scope.referralPolicyHash)
    || !keys(accounting, ['windowViews', 'ownerExcludedViews', 'referralExcludedViews', 'includedViews', 'otherViews'])
    || !Object.values(accounting).every(count) || !validAgentAccessMetrics(value.total)) return false;
  // Explicit narrowing keeps untrusted count arithmetic outside coercion.
  if (!count(accounting.windowViews) || !count(accounting.ownerExcludedViews) || !count(accounting.referralExcludedViews) || !count(accounting.includedViews) || !count(accounting.otherViews)
    || accounting.windowViews !== accounting.ownerExcludedViews + accounting.referralExcludedViews + accounting.includedViews
    || accounting.includedViews !== value.total.views + accounting.otherViews) return false;
  if (!Array.isArray(value.cells) || !Array.isArray(value.history) || !Array.isArray(value.proofs) || !Array.isArray(value.resourceTotals) || !Array.isArray(value.roleTotals)
    || value.cells.length + value.history.length + value.proofs.length > AGENT_ACCESS_ROW_LIMIT) return false;
  const resourceIds = new Set(value.resources.map(resource => resource.id));
  const cells: AgentAccessCell[] = [], history: AgentAccessHistory[] = [], proofs: AgentAccessProof[] = [];
  const cellKeys = new Set<string>(), historyKeys = new Set<string>(), proofKeys = new Set<string>();
  for (const row of value.cells) {
    if (!record(row) || !keys(row, ['resourceId', 'kind', 'client', 'format', 'metrics']) || !dimension(row, resourceIds) || !validAgentAccessMetrics(row.metrics) || row.metrics.views === 0) return false;
    const key = dimensionKey(row); if (cellKeys.has(key)) return false; cellKeys.add(key);
    cells.push({ resourceId: row.resourceId, kind: row.kind, client: row.client, format: row.format, metrics: row.metrics });
  }
  for (const row of value.history) {
    if (!record(row) || !keys(row, ['resourceId', 'kind', 'client', 'format', 'metrics', 'collection', 'classifier', 'source'])
      || !dimension(row, resourceIds) || !validAgentAccessMetrics(row.metrics) || row.metrics.views === 0
      || !reachMeasurementStamp(row.collection) || !reachMeasurementStamp(row.classifier)
      || (row.source !== 'edge' && row.source !== 'beacon' && row.source !== 'not-recorded' && row.source !== 'unrecognized')) return false;
    const key = JSON.stringify([dimensionKey(row), row.collection, row.classifier, row.source]);
    if (historyKeys.has(key)) return false; historyKeys.add(key);
    history.push({ resourceId: row.resourceId, kind: row.kind, client: row.client, format: row.format, metrics: row.metrics, collection: row.collection, classifier: row.classifier, source: row.source });
  }
  for (const row of value.proofs) {
    if (!record(row) || !keys(row, ['resourceId', 'kind', 'client', 'format', 'basis', 'profile', 'publisher', 'network', 'networkListed', 'views'])
      || !dimension(row, resourceIds) || typeof row.basis !== 'string' || !isSignatureBasis(row.basis) || !isReportedVerifierProfile(row.profile)
      || (row.publisher !== 'not-recorded' && !isPublicSignerName(row.publisher))
      || (row.network !== 'recognized' && row.network !== 'not-recorded' && row.network !== 'unrecognized')
      || typeof row.networkListed !== 'boolean' || row.networkListed && row.network !== 'recognized' || !count(row.views) || row.views === 0) return false;
    const key = JSON.stringify([dimensionKey(row), row.basis, row.profile, row.publisher, row.network, row.networkListed]);
    if (proofKeys.has(key)) return false; proofKeys.add(key);
    proofs.push({ resourceId: row.resourceId, kind: row.kind, client: row.client, format: row.format, basis: row.basis, profile: row.profile, publisher: row.publisher, network: row.network, networkListed: row.networkListed, views: row.views });
  }
  if (!sameMetrics(sum(cells), value.total) || !sameMetrics(sum(history), value.total)) return false;
  const seenResources = new Set<string | null>(), seenRoles = new Set<AgentAccessKind>();
  for (const row of value.resourceTotals) {
    if (!record(row) || !keys(row, ['resourceId', 'metrics']) || !(row.resourceId === null || typeof row.resourceId === 'string' && resourceIds.has(row.resourceId))
      || seenResources.has(row.resourceId) || !validAgentAccessMetrics(row.metrics) || !sameMetrics(sum(cells.filter(cell => cell.resourceId === row.resourceId)), row.metrics)) return false;
    seenResources.add(row.resourceId);
  }
  for (const row of value.roleTotals) {
    if (!record(row) || !keys(row, ['kind', 'metrics']) || !isAgentAccessKind(row.kind) || seenRoles.has(row.kind)
      || !validAgentAccessMetrics(row.metrics) || !sameMetrics(sum(cells.filter(cell => cell.kind === row.kind)), row.metrics)) return false;
    seenRoles.add(row.kind);
  }
  if (seenResources.size !== resourceIds.size + 1 || !seenResources.has(null) || seenRoles.size !== AGENT_ACCESS_KINDS.length) return false;
  const historyByCell = new Map<string, AgentAccessMetrics>(), proofsByCell = new Map<string, number>();
  for (const row of history) {
    const key = dimensionKey(row); if (!cellKeys.has(key)) return false;
    const total = historyByCell.get(key) ?? emptyAgentAccessMetrics(); addAgentAccessMetrics(total, row.metrics); historyByCell.set(key, total);
  }
  for (const row of proofs) {
    const key = dimensionKey(row); if (!cellKeys.has(key)) return false;
    const total = (proofsByCell.get(key) ?? 0) + row.views;
    if (!Number.isSafeInteger(total)) return false; proofsByCell.set(key, total);
  }
  return cells.every(cell => sameMetrics(historyByCell.get(dimensionKey(cell)) ?? emptyAgentAccessMetrics(), cell.metrics) && proofsByCell.get(dimensionKey(cell)) === cell.metrics.views);
}

export function consistentAgentAccessReport(value: unknown): value is AgentAccessReport {
  try { return checkedAgentAccessReport(value); }
  catch { return false; } // Untrusted overflow is a rejected report, never a partial sum.
}

export function selectAgentAccess(report: AgentAccessReport, selection: AgentAccessSelection) {
  const article = selection.articleId === null ? null : report.resources.find(resource => resource.id === selection.articleId && resource.role === 'article');
  if (selection.articleId !== null && !article || selection.client !== null && !isAgentAccessClient(selection.client) || selection.kind !== null && !isAgentAccessKind(selection.kind)) throw new Error('Invalid agent access selection');
  const resources = new Set(report.resources.filter(resource => article === null || resource.id === article?.id || resource.articleId === article?.id).map(resource => resource.id));
  const matches = (row: AgentAccessDimension) => (selection.articleId === null || row.resourceId !== null && resources.has(row.resourceId)) && (selection.client === null || row.client === selection.client) && (selection.kind === null || row.kind === selection.kind);
  const cells = report.cells.filter(matches), history = report.history.filter(matches), proofs = report.proofs.filter(matches);
  const clients = new Map<AgentAccessClient, AgentAccessMetrics>(), resourceMetrics = new Map<string | null, AgentAccessMetrics>();
  const roles = new Map<AgentAccessKind, AgentAccessMetrics>(), formats = new Map<AgentAccessFormat, AgentAccessMetrics>();
  function add<Key>(groups: Map<Key, AgentAccessMetrics>, key: Key, metrics: AgentAccessMetrics): void {
    const total = groups.get(key) ?? emptyAgentAccessMetrics();
    addAgentAccessMetrics(total, metrics); groups.set(key, total);
  }
  for (const cell of cells) {
    add(clients, cell.client, cell.metrics); add(resourceMetrics, cell.resourceId, cell.metrics);
    add(roles, cell.kind, cell.metrics); add(formats, cell.format, cell.metrics);
  }
  const byClient = [...clients].map(([client, metrics]) => ({ client, metrics })).sort((a, b) => b.metrics.views - a.metrics.views || a.client.localeCompare(b.client));
  const byResource = report.resources.filter(resource => resources.has(resource.id)).map(resource => ({ resource, metrics: resourceMetrics.get(resource.id) ?? emptyAgentAccessMetrics() })).sort((a, b) => b.metrics.views - a.metrics.views || a.resource.path.localeCompare(b.resource.path));
  return {
    total: sum(cells), byClient, byResource, history, proofs,
    unregistered: resourceMetrics.get(null) ?? emptyAgentAccessMetrics(),
    byRole: AGENT_ACCESS_KINDS.map(kind => ({ kind, metrics: roles.get(kind) ?? emptyAgentAccessMetrics() })),
    byFormat: AGENT_FORMATS.map(format => ({ format, metrics: formats.get(format) ?? emptyAgentAccessMetrics() })),
  };
}
