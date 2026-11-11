import { ACTIVE_REFERRAL_POLICY, parseStatsQuery } from '@gkoreli/analytics';

/** Bump when report semantics, storage binding, or public selection rules change. */
export const STATS_REPORT_VERSION = '2026-11-11.6';
export const STATS_EDGE_TTL_SECONDS = 3600;
const MAX_PENDING_REPORTS = 8;
const LOOKUP_BUDGET_MS = 250;
const PUBLICATION_BUDGET_MS = 1000;

export interface StatsBackgroundWork { waitUntil(work: Promise<unknown>): void }
export interface StatsCacheOperation {
  version: '2026-11-11.1';
  event: 'stats-cache-operation';
  operation: 'lookup' | 'publication';
  outcome: 'returned' | 'unavailable' | 'deadline';
  elapsedMs: number;
}

type CacheResult<T> = { outcome: 'returned'; value: T } | { outcome: 'unavailable' | 'deadline' };

/** Optional cache I/O has a finite budget; the source report keeps its own
 * failure semantics. Late lookup bodies are released instead of being retained.
 */
async function cacheOperation<T>(operation: StatsCacheOperation['operation'], run: () => Promise<T>, budgetMs: number,
  observe: ((event: StatsCacheOperation) => void) | undefined): Promise<CacheResult<T>> {
  const started = performance.now();
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const work: Promise<CacheResult<T>> = Promise.resolve().then(run).then(value => {
    if (expired && value instanceof Response) void value.body?.cancel().catch(() => {});
    return { outcome: 'returned', value };
  }, () => ({ outcome: 'unavailable' }));
  const deadline = new Promise<CacheResult<T>>(resolve => {
    timer = setTimeout(() => { expired = true; resolve({ outcome: 'deadline' }); }, budgetMs);
  });
  const result = await Promise.race([work, deadline]);
  if (timer !== undefined) clearTimeout(timer);
  try { observe?.({ version: '2026-11-11.1', event: 'stats-cache-operation', operation, outcome: result.outcome, elapsedMs: performance.now() - started }); }
  catch { /* Cache telemetry cannot affect a report. */ }
  return result;
}

export interface StatsCacheStore {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

interface StatsCacheOptions {
  now?: () => number;
  policyHash?: string;
  reportVersion?: string;
  onOutcome?: (event: StatsCacheOutcome) => void;
  onOperation?: (event: StatsCacheOperation) => void;
  lookupBudgetMs?: number;
  publicationBudgetMs?: number;
}

export interface StatsCacheOutcome {
  version: '2026-10-28.1';
  event: 'stats-report-cache';
  state: 'HIT' | 'MISS' | 'COALESCED' | 'CAPACITY' | 'INVALID';
  status: number;
}

function unavailable(): Response {
  return Response.json({ error: 'Statistics are temporarily unavailable. Please try again later.' }, {
    status: 503,
    headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
  });
}

function publicResponse(response: Response, state: 'HIT' | 'MISS' | 'COALESCED', now: number): Response {
  const headers = new Headers(response.headers);
  if (response.status === 200 && !headers.has('Set-Cookie')) {
    const expiresAt = Date.parse(headers.get('Expires') ?? '');
    const remaining = Number.isFinite(expiresAt) ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
    headers.set('Cache-Control', `public, max-age=${Math.min(60, remaining)}`);
    headers.set('X-Stats-Cache', state);
  } else {
    headers.set('Cache-Control', 'no-store');
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** Cache only validated public report states; no incoming cookies or cache-bypass headers form the key. */
export function createStatsHandler<Environment>(
  cache: StatsCacheStore,
  load: (request: Request, env: Environment) => Promise<Response>,
  options: StatsCacheOptions = {},
): (request: Request, env: Environment, background?: StatsBackgroundWork) => Promise<Response> {
  const now = options.now ?? Date.now;
  const policyHash = options.policyHash ?? ACTIVE_REFERRAL_POLICY.sha256;
  const reportVersion = options.reportVersion ?? STATS_REPORT_VERSION;
  const lookupBudget = options.lookupBudgetMs ?? LOOKUP_BUDGET_MS;
  const publicationBudget = options.publicationBudgetMs ?? PUBLICATION_BUDGET_MS;
  if (![lookupBudget, publicationBudget].every(n => Number.isFinite(n) && n >= 1 && n <= 5000)) throw new Error('Invalid cache operation budget');
  // Coalesces cold fills only within this isolate. Cache storage is local to the Cloudflare data center.
  const pending = new Map<string, Promise<Response>>();
  const observed = (response: Response, state: StatsCacheOutcome['state']): Response => {
    try { options.onOutcome?.({ version: '2026-10-28.1', event: 'stats-report-cache', state, status: response.status }); }
    catch { /* Logging failure must not affect report delivery. */ }
    return response;
  };

  return async (request, env, background) => {
    if (request.method !== 'GET') return observed(new Response(null, { status: 405, headers: { Allow: 'GET' } }), 'INVALID');
    const url = new URL(request.url);
    const query = parseStatsQuery(url.searchParams);
    if (typeof query === 'string') {
      return observed(Response.json({ error: query }, { status: 400, headers: { 'Cache-Control': 'no-store' } }), 'INVALID');
    }
    const startedAt = now();
    const day = new Date(startedAt).toISOString().slice(0, 10);
    const midnight = Date.parse(`${day}T00:00:00Z`) + 86_400_000;
    const expiresAt = Math.min(startedAt + STATS_EDGE_TTL_SECONDS * 1000, midnight);
    const keyUrl = new URL(`/__stats-cache/${reportVersion}/${policyHash}/${day}`, url.origin);
    keyUrl.searchParams.set('range', query.range);
    keyUrl.searchParams.set('traffic', query.traffic);
    if (query.path !== undefined) keyUrl.searchParams.set('path', query.path);
    if (query.agent !== undefined) keyUrl.searchParams.set('agent', query.agent);
    if (query.kind !== undefined) keyUrl.searchParams.set('kind', query.kind);
    const key = new Request(keyUrl);

    const lookup = await cacheOperation('lookup', () => cache.match(key), lookupBudget, options.onOperation);
    const cached = lookup.outcome === 'returned' ? lookup.value : undefined;
    if (cached !== undefined && cached.status === 200
        && Date.parse(cached.headers.get('Expires') ?? '') > now()
        && !cached.headers.has('Set-Cookie')) {
      return observed(publicResponse(cached, 'HIT', now()), 'HIT');
    }

    const existing = pending.get(key.url);
    if (existing !== undefined) return observed(publicResponse((await existing).clone(), 'COALESCED', now()), 'COALESCED');
    if (pending.size >= MAX_PENDING_REPORTS) return observed(unavailable(), 'CAPACITY');

    let publication: Promise<void> | undefined;
    const fill = (async () => {
      let response: Response;
      try {
        response = await load(request, env);
      } catch {
        console.error('stats-report: generation failed');
        return unavailable();
      }
      if (response.status !== 200 || response.headers.has('Set-Cookie')) return response;
      const headers = new Headers(response.headers);
      const ttl = Math.max(0, Math.floor((expiresAt - now()) / 1000));
      headers.set('Cache-Control', `public, max-age=${ttl}`);
      headers.set('Expires', new Date(expiresAt).toUTCString());
      headers.set('Date', new Date(startedAt).toUTCString());
      const report = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
      if (ttl > 0) {
        publication = cacheOperation('publication', () => cache.put(key, report.clone()), publicationBudget, options.onOperation).then(() => {});
        // Embedders without an execution context retain bounded synchronous
        // publication. The composed Worker publishes after sending its report.
        if (background === undefined) await publication;
      }
      return report;
    })();
    pending.set(key.url, fill);
    try {
      return observed(publicResponse((await fill).clone(), 'MISS', now()), 'MISS');
    } finally {
      if (publication !== undefined && background !== undefined) {
        // Keep the completed report coalescible until publication settles or its
        // budget expires, without retaining capacity indefinitely on cache failure.
        const release = publication.then(() => { pending.delete(key.url); });
        try { background.waitUntil(release); } catch { void release; }
      } else pending.delete(key.url);
    }
  };
}
