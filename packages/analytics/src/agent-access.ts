import {
  AGENT_ACCESS_VERSION, AGENT_ACCESS_KINDS, AGENT_ACCESS_ROW_LIMIT, agentAccessCatalogueHash, agentAccessWindow,
  consistentAgentAccessReport, emptyAgentAccessMetrics, validAgentAccessCatalogue,
  type AgentAccessReport, type AgentAccessMetrics, type AgentAccessResource,
} from './agent-access-contract.js';
import { CLIENT_REGISTRY_PROFILE } from './client-registry.js';
import { buildAgentAccessQueryPlan } from './agent-access-query.js';
import { measuredReportBatch, type ReportCalculationObserver } from './report-cost.js';
import { ACTIVE_REFERRAL_POLICY } from './referral-policy.generated.js';
import type { ReferralPolicy } from './referral-policy.js';
import { createStatsHandler, type StatsCacheStore, type StatsCacheOptions } from './report-cache.js';
import type { ReportAdmission } from './report-budget.js';
import { REPORT_PROJECTION_RULE_SHA256 } from './report-projection.js';

export { buildAgentAccessQueryPlan } from './agent-access-query.js';

export interface AgentAccessQueryOptions {
  now?: Date;
  policy?: ReferralPolicy;
  onCalculation?: ReportCalculationObserver;
  /** Storage-adapter control for parity checks; never an HTTP query parameter. */
  readModel?: 'projected' | 'source';
}

function invalid(): never { throw new Error('Incomplete or inconsistent agent access report'); }
function count(row: Record<string, unknown>, field: string): number {
  const value = row[field];
  return Object.hasOwn(row, field) && typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : invalid();
}
function metrics(row: Record<string, unknown>): AgentAccessMetrics {
  return { views: count(row, 'views'), weeks: [count(row, 'w0'), count(row, 'w1'), count(row, 'w2'), count(row, 'w3')], dayMask: count(row, 'dayMask'), unrecognizedTimeViews: count(row, 'unrecognizedTimeViews') };
}

/** Application service: stored evidence -> one validated, independently reconciled
 * report. Both adapters are SELECT-only; stale projections trigger source reading.
 */
export async function queryAgentAccess(
  db: D1Database, resources: AgentAccessResource[], options: AgentAccessQueryOptions = {},
): Promise<AgentAccessReport> {
  const now = options.now ?? new Date(), policy = options.policy ?? ACTIVE_REFERRAL_POLICY;
  if (!validAgentAccessCatalogue(resources)) throw new Error('Invalid agent access resource catalogue');
  const catalogue = resources.map(resource => ({ ...resource }));
  const window = agentAccessWindow(now), catalogueHash = await agentAccessCatalogueHash(catalogue);
  async function read(source: boolean) {
    const queries = buildAgentAccessQueryPlan(catalogue, window.start, window.endExclusive, policy, source);
    const results = await measuredReportBatch(db, queries.map(query => db.prepare(query.sql).bind(...query.values)), event => options.onCalculation?.({ ...event, readModel: source ? 'source-fallback' : 'projection' }));
    const rows = results.flatMap(result => result.results ?? []);
    if (rows.length > AGENT_ACCESS_ROW_LIMIT) return invalid();
    return rows;
  }
  let rows = await read(options.readModel === 'source');
  function one(section: string) {
    const selected = rows.filter(row => row.section === section);
    return selected.length === 1 && selected[0] ? selected[0] : invalid();
  }
  let census = one('census');
  if (census.projectionComplete !== 0 && census.projectionComplete !== 1) return invalid();
  if (census.projectionComplete === 0) { rows = await read(true); census = one('census'); }
  if (census.projectionComplete !== 1) return invalid();
  if (rows.some(row => !['census', 'total', 'role', 'resource', 'cell', 'history', 'proof'].includes(String(row.section)))) return invalid();
  const resourceHeads = rows.filter(row => row.section === 'resource'), roleHeads = rows.filter(row => row.section === 'role');
  const resourceTotals = [...catalogue.map(resource => resource.id), null].map(resourceId => {
    const matches = resourceHeads.filter(row => row.resourceId === resourceId);
    return { resourceId, metrics: matches.length === 0 ? emptyAgentAccessMetrics() : matches.length === 1 && matches[0] ? metrics(matches[0]) : invalid() };
  });
  if (resourceHeads.some(row => !resourceTotals.some(total => total.resourceId === row.resourceId))) return invalid();
  const roleTotals = AGENT_ACCESS_KINDS.map(kind => {
    const matches = roleHeads.filter(row => row.kind === kind);
    return { kind, metrics: matches.length === 0 ? emptyAgentAccessMetrics() : matches.length === 1 && matches[0] ? metrics(matches[0]) : invalid() };
  });
  if (roleHeads.some(row => !roleTotals.some(total => total.kind === row.kind))) return invalid();
  const dimension = (row: Record<string, unknown>) => ({ resourceId: row.resourceId, kind: row.kind, client: row.client, format: row.format });
  const report = {
    version: AGENT_ACCESS_VERSION,
    scope: { ...window, timeZone: 'UTC', days: 28, cohort: 'stored-ai-roles-and-signed-fallback', catalogueHash, registryProfile: CLIENT_REGISTRY_PROFILE, referralPolicyHash: policy.sha256 },
    resources: catalogue, total: metrics(one('total')), resourceTotals, roleTotals,
    accounting: { windowViews: count(census, 'windowViews'), ownerExcludedViews: count(census, 'ownerExcludedViews'), referralExcludedViews: count(census, 'referralExcludedViews'), includedViews: count(census, 'includedViews'), otherViews: count(census, 'otherViews') },
    cells: rows.filter(row => row.section === 'cell').map(row => ({ ...dimension(row), metrics: metrics(row) })),
    history: rows.filter(row => row.section === 'history').map(row => ({ ...dimension(row), metrics: metrics(row), collection: row.collection, classifier: row.classifier, source: row.source })),
    proofs: rows.filter(row => row.section === 'proof').map(row => ({ ...dimension(row), basis: row.basis, profile: row.profile, publisher: row.publisher, network: row.network,
      networkListed: row.networkListed === 0 ? false : row.networkListed === 1 ? true : invalid(), views: count(row, 'views') })),
  };
  if (!consistentAgentAccessReport(report)) return invalid();
  return report;
}

export interface AgentAccessReportingOptions<Environment extends { DB: D1Database }> extends Pick<StatsCacheOptions, 'now' | 'onOutcome' | 'onOperation'> {
  catalogue(env: Environment): Promise<AgentAccessResource[]>;
  /** Explicitly choose durable admission or an externally controlled endpoint. */
  admission: ((env: Environment) => ReportAdmission) | null;
  onCalculation?: ReportCalculationObserver;
}

/** One canonical completed-window report per catalogue/version/policy. Resource,
 * client and role drill-downs consume its validated cube without new SQL fills.
 */
export function createAgentAccessReportHandler<Environment extends { DB: D1Database }>(
  cache: StatsCacheStore, options: AgentAccessReportingOptions<Environment>,
) {
  const clock = options.now ?? Date.now;
  function create(resources: AgentAccessResource[], hash: string) {
    return createStatsHandler(cache, async (_request, env: Environment) => {
      const now = new Date(clock());
      const reservation = options.admission === null ? undefined : await options.admission(env).reserve(now);
      if (reservation === null) return Response.json({ error: 'Agent access report budget unavailable.' }, {
        status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
      });
      let reads = 0, complete = true, calculations = 0;
      const observe: ReportCalculationObserver = event => {
        calculations++;
        if (event.outcome !== 'returned' || event.reportedRowsRead === null || !Number.isSafeInteger(reads + event.reportedRowsRead)) complete = false;
        else reads += event.reportedRowsRead;
        try { options.onCalculation?.(event); } catch { /* Observation cannot change the report. */ }
      };
      try { return Response.json(await queryAgentAccess(env.DB, resources, { now, onCalculation: observe })); }
      finally { await reservation?.complete({ reportedRowsRead: complete && calculations > 0 ? reads : null }); }
    }, { ...options, reportVersion: ['agent-access', AGENT_ACCESS_VERSION, CLIENT_REGISTRY_PROFILE, REPORT_PROJECTION_RULE_SHA256, hash].join('-') });
  }
  let previous: { hash: string; handler: ReturnType<typeof create> } | undefined;
  return async (request: Request, env: Environment, background?: { waitUntil(work: Promise<unknown>): void }): Promise<Response> => {
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    try {
      const resources = await options.catalogue(env), hash = await agentAccessCatalogueHash(resources);
      const handler = previous?.hash === hash ? previous.handler : create(resources.map(resource => ({ ...resource })), hash);
      previous = { hash, handler };
      return handler(new Request(new URL('/api/agent-access', request.url)), env, background);
    } catch {
      return Response.json({ error: 'Agent access report unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  };
}
