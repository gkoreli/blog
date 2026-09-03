import type { Env } from './db.js';
import { createDailyClientId } from './hash.js';
import { extractRequestMetadata } from './metadata.js';

const INSERT_OWNER_CLIENT = `INSERT INTO owner_clients (
  daily_client_id,
  utc_date
) VALUES (?, ?)
ON CONFLICT(daily_client_id) DO NOTHING`;

function json(data: Record<string, unknown>, status: number, allow?: string): Response {
  const headers = new Headers({
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  if (allow !== undefined) headers.set('allow', allow);
  return new Response(JSON.stringify(data), { status, headers });
}

/**
 * Constant-time string comparison matching the newsletter admin endpoint.
 * A length mismatch fails before the byte comparison because the expected
 * Authorization header length is not secret.
 */
function timingSafeCompare(actual: string, expected: string): boolean {
  const actualBytes = new TextEncoder().encode(actual);
  const expectedBytes = new TextEncoder().encode(expected);
  if (actualBytes.length !== expectedBytes.length) return false;
  let difference = 0;
  for (let index = 0; index < actualBytes.length; index += 1) {
    difference |= actualBytes[index]! ^ expectedBytes[index]!;
  }
  return difference === 0;
}

export async function handleOwner(
  request: Request,
  env: Env,
  now = new Date(),
): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405, 'POST');
  }

  const adminSecret = env.ADMIN_SECRET;
  const hashKey = env.ANALYTICS_HASH_KEY;
  if (typeof adminSecret !== 'string' || adminSecret.length === 0
    || typeof hashKey !== 'string' || hashKey.length === 0) {
    return json({ error: 'Owner marking is not configured' }, 500);
  }

  const authorization = request.headers.get('authorization') ?? '';
  if (!timingSafeCompare(authorization, `Bearer ${adminSecret}`)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const metadata = extractRequestMetadata(request, env.OWNER_IPS);
  const utcDate = now.toISOString().slice(0, 10);
  const dailyClientId = await createDailyClientId({
    masterKey: hashKey,
    siteHost: metadata.siteHost,
    utcDate,
    ip: metadata.ip,
    userAgent: metadata.userAgent,
  });

  await env.DB.prepare(INSERT_OWNER_CLIENT).bind(dailyClientId, utcDate).run();
  return json({ marked: true, utcDate }, 200);
}
