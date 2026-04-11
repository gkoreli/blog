import { recordClientError, type ClientObservabilityEnv } from './db.js';
import { parseClientErrorPayload } from './schema.js';
import type { ServerClientErrorEvent } from './types.js';

export { purgeOldClientErrors } from './db.js';

const MAX_BODY_BYTES = 8 * 1024;

function json(status: number): Response {
  return new Response(null, {
    status,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function randomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function enrich(request: Request, event: ReturnType<typeof parseClientErrorPayload>): ServerClientErrorEvent | null {
  if (!event) return null;
  const cf = request.cf;
  return {
    ...event,
    id: randomId(),
    ray: request.headers.get('cf-ray'),
    country: typeof cf?.country === 'string' ? cf.country : null,
    colo: typeof cf?.colo === 'string' ? cf.colo : null,
    asOrganization: typeof cf?.asOrganization === 'string' ? cf.asOrganization : null,
  };
}

export async function handleClientError(
  request: Request,
  env: ClientObservabilityEnv,
  ctx?: ExecutionContext,
): Promise<Response> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) return json(415);

  const rawLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(rawLength) && rawLength > MAX_BODY_BYTES) return json(413);

  const payload = await request.json().catch(() => null);
  const event = enrich(request, parseClientErrorPayload(payload));
  if (!event) return json(400);

  console.warn('[client:error]', {
    type: event.type,
    component: event.component ?? '',
    message: event.message,
    path: event.path,
    status: event.status ?? 0,
    ray: event.ray ?? '',
    country: event.country ?? '',
    colo: event.colo ?? '',
  });

  const write = recordClientError(env.DB, event).catch(err =>
    console.error('[client:error] D1 write failed:', err),
  );

  if (ctx) {
    ctx.waitUntil(write);
  } else {
    await write;
  }

  return json(204);
}
