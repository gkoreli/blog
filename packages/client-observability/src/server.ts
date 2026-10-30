import { recordClientError, type ClientObservabilityEnv } from './db.js';
import { parseClientErrorPayload } from './schema.js';
import type { ServerClientErrorEvent } from './types.js';

export { purgeOldClientErrors } from './db.js';
export type { ClientObservabilityEnv } from './db.js';

const MAX_BODY_BYTES = 8 * 1024;

type BodyResult = { status: 'ok'; payload: unknown } | { status: 'too-large' } | { status: 'invalid' };

/** Bound consumed bytes before parsing; Content-Length is only an early hint. */
async function boundedJson(request: Request): Promise<BodyResult> {
  if (request.body === null) return { status: 'invalid' };
  try {
    const reader = request.body.getReader();
    const decoder = new TextDecoder();
    const parts: string[] = [];
    let bytes = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        if (chunk.value.byteLength === 0) continue;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_BODY_BYTES) {
          // Cancellation can itself remain pending; rejection must not wait for it.
          void reader.cancel().catch(() => {});
          return { status: 'too-large' };
        }
        parts.push(decoder.decode(chunk.value, { stream: true }));
      }
      parts.push(decoder.decode());
      const payload: unknown = JSON.parse(parts.join(''));
      return { status: 'ok', payload };
    } finally {
      reader.releaseLock();
    }
  } catch {
    return { status: 'invalid' };
  }
}

function emptyResponse(status: number): Response {
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
  // Browser-origin isolation is not sender authentication: non-browser callers
  // can forge Origin. Do not use an accepted report as a human/bot verdict.
  const origin = new URL(request.url).origin;
  if (origin === 'null' || request.headers.get('origin') !== origin) return emptyResponse(403);
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.split(';')[0]?.trim().toLowerCase() !== 'application/json') return emptyResponse(415);

  const rawLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(rawLength) && rawLength > MAX_BODY_BYTES) return emptyResponse(413);

  // A fixed route key protects the shared store without inventing a reader ID.
  // Cloudflare's native count is approximate and local, not a global cost cap.
  if (!env.CLIENT_ERROR_RATE_LIMITER) return emptyResponse(503);
  try {
    const result = await env.CLIENT_ERROR_RATE_LIMITER.limit({ key: 'client-error:v1' });
    if (result.success === false) return emptyResponse(429);
    if (result.success !== true) return emptyResponse(503);
  } catch {
    return emptyResponse(503);
  }

  const body = await boundedJson(request);
  if (body.status === 'too-large') return emptyResponse(413);
  if (body.status === 'invalid') return emptyResponse(400);
  const event = enrich(request, parseClientErrorPayload(body.payload));
  if (!event) return emptyResponse(400);

  console.warn('[client:error]', {
    type: event.type,
    component: event.component ?? '',
    message: event.message,
    path: event.path,
    status: event.status ?? 0,
    ray: event.ray ?? '',
    country: event.country ?? '',
    colo: event.colo ?? '',
    stage: 'received',
    storage: 'pending',
  });

  const confirmation = recordClientError(env.DB, event).then(
    () => {
      console.info('[client:error:storage]', { outcome: 'confirmed' });
      return true;
    },
    err => {
      // A failure to confirm the write does not prove that no commit occurred.
      console.error('[client:error:storage]', { outcome: 'unconfirmed' }, err);
      return false;
    },
  );
  // Keep completion alive on disconnect, while awaiting it for the HTTP acknowledgment.
  ctx?.waitUntil(confirmation);
  return emptyResponse(await confirmation ? 204 : 503);
}
