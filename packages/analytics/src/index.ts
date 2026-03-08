import { classifyVisitor } from './classify.js';
import { recordPageView, type Env, type PageView } from './db.js';
import { dailySalt, visitorHash } from './hash.js';
import { queryStats, type StatsQuery, type VisitorFilter } from './stats.js';

export { VisitorType } from './classify.js';
export type { Env } from './db.js';
export type { StatsResponse, StatsQuery, VisitorFilter } from './stats.js';

/** Clean referrer: strip query params, remove self-referrals */
function cleanReferrer(raw: string | null, selfHost: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.hostname === selfHost) return null;
    return url.hostname + url.pathname;
  } catch {
    return null;
  }
}

/** Extract CF geo from request.cf */
function geo(cf: IncomingRequestCfProperties | undefined) {
  return {
    country: (cf?.country as string) ?? null,
    city: (cf?.city as string) ?? null,
    continent: (cf?.continent as string) ?? null,
  };
}

/**
 * Handle POST /api/event — record a page view.
 * Called from client beacon script.
 *
 * ctx is optional: if provided, D1 write is fire-and-forget via waitUntil.
 * If omitted (testing, non-Worker envs), falls back to await.
 * Pattern: explicit dependency injection, same as Hono (see ADR-0004).
 */
export async function handleEvent(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
  const body = await request.json().catch(() => null) as { path?: string } | null;
  if (!body?.path || typeof body.path !== 'string') return new Response(null, { status: 400 });

  // Sanitize path: must start with /, strip query/hash, cap length
  const rawPath = body.path.split(/[?#]/)[0];
  if (!rawPath.startsWith('/') || rawPath.length > 500) return new Response(null, { status: 400 });

  const ua = request.headers.get('user-agent');
  const ip = request.headers.get('cf-connecting-ip') ?? '0.0.0.0';
  const cf = (request as { cf?: IncomingRequestCfProperties }).cf;
  const { country, city, continent } = geo(cf);

  const visitorType = classifyVisitor(ua);
  const hash = await visitorHash(ip, ua ?? '', dailySalt());
  const ownerIps = env.OWNER_IPS?.split(',').map(s => s.trim()) ?? [];
  const isOwner = ownerIps.includes(ip) ? 1 : 0;

  const pv: PageView = {
    path: rawPath,
    referrer: cleanReferrer(request.headers.get('referer'), new URL(request.url).hostname),
    country,
    city,
    continent,
    visitor_hash: hash,
    visitor_type: visitorType,
    is_owner: isOwner,
  };

  // Fire-and-forget with error logging. Analytics is best-effort —
  // losing events during D1 outages is acceptable, but we log failures
  // to Workers Logs for visibility (see ADR-0004 §Architecture Issues §3).
  const write = recordPageView(env.DB, pv).catch(err =>
    console.error('[analytics] D1 write failed:', err),
  );

  if (ctx) {
    ctx.waitUntil(write);
  } else {
    await write;
  }

  return new Response(null, { status: 204 });
}

/** Max days lookback — prevents integer overflow in Date math. 0 = all time. */
const MAX_DAYS = 365;

const VALID_VISITORS = new Set<VisitorFilter>(['human', 'bot', 'ai', 'all']);

/**
 * Handle GET /api/stats — public analytics JSON.
 */
export async function handleStats(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const raw = url.searchParams.get('days');
  const rawTz = url.searchParams.get('tz');
  const rawVisitor = url.searchParams.get('visitor');
  const q: StatsQuery = {
    days: raw !== null ? Math.max(0, Math.min(MAX_DAYS, Number(raw) || 0)) : 30,
    path: url.searchParams.get('path') ?? undefined,
    tz: rawTz !== null ? Math.max(-720, Math.min(840, Math.round(Number(rawTz) || 0))) : 0,
    visitor: rawVisitor !== null && VALID_VISITORS.has(rawVisitor as VisitorFilter) ? rawVisitor as VisitorFilter : 'human',
  };

  const stats = await queryStats(env.DB, q);

  return new Response(JSON.stringify(stats), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
}
