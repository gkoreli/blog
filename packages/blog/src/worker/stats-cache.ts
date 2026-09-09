import { ACTIVE_REFERRAL_POLICY, parseStatsQuery } from '@gkoreli/analytics';

/** Bump when report semantics, storage binding, or public selection rules change. */
export const STATS_REPORT_VERSION = '2026-09-09.1';
export const STATS_EDGE_TTL_SECONDS = 3600;
const MAX_PENDING_REPORTS = 8;

export interface StatsCacheStore {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

interface StatsCacheOptions {
  now?: () => number;
  policyHash?: string;
  reportVersion?: string;
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
): (request: Request, env: Environment) => Promise<Response> {
  const now = options.now ?? Date.now;
  const policyHash = options.policyHash ?? ACTIVE_REFERRAL_POLICY.sha256;
  const reportVersion = options.reportVersion ?? STATS_REPORT_VERSION;
  // Coalesces cold fills only within this isolate. Cache storage is local to the Cloudflare data center.
  const pending = new Map<string, Promise<Response>>();

  return async (request, env) => {
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    const url = new URL(request.url);
    const query = parseStatsQuery(url.searchParams);
    if (typeof query === 'string') {
      return Response.json({ error: query }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
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

    try {
      const cached = await cache.match(key);
      if (cached !== undefined && cached.status === 200
          && Date.parse(cached.headers.get('Expires') ?? '') > now()
          && !cached.headers.has('Set-Cookie')) {
        return publicResponse(cached, 'HIT', now());
      }
    } catch {
      console.warn('stats-cache: lookup unavailable');
    }

    const existing = pending.get(key.url);
    if (existing !== undefined) return publicResponse((await existing).clone(), 'COALESCED', now());
    if (pending.size >= MAX_PENDING_REPORTS) return unavailable();

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
        try {
          // Await publication so simultaneous callers can reuse the completed entry immediately.
          await cache.put(key, report.clone());
        } catch {
          console.warn('stats-cache: storage unavailable');
        }
      }
      return report;
    })();
    pending.set(key.url, fill);
    try {
      return publicResponse((await fill).clone(), 'MISS', now());
    } finally {
      pending.delete(key.url);
    }
  };
}
