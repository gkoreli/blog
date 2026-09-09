import type { NewsletterEnv } from './db.js';
import { admitConfirmation, recordConfirmationOutcome } from './confirmation-store.js';
import { sendConfirmationEmail } from './email.js';
import { allowedOrigin, jsonError, jsonOk } from './responses.js';
import { generateToken, hashToken, truncateIp } from './tokens.js';
import { verifyTurnstile } from './turnstile.js';

const MAX_BODY_BYTES = 4096;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); return null; }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return body;
  } catch { return null; } finally { reader.releaseLock(); }
}

function sanitizeSource(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//')) return null;
  try {
    const parsed = new URL(raw, 'https://gkoreli.com');
    const params = new URLSearchParams();
    for (const key of ['utm_source', 'utm_campaign', 'ref']) {
      const value = parsed.searchParams.get(key)?.trim();
      if (value) params.set(key, value.slice(0, key === 'ref' ? 100 : 80));
    }
    return parsed.pathname.slice(0, 200) + (params.size ? `?${params}` : '');
  } catch { return null; }
}

/** Same validation, verifier, admission, and delivery policy on both public routes. */
export async function handleConfirmationRequest(
  request: Request, env: NewsletterEnv, mode: 'subscribe' | 'resend',
): Promise<Response> {
  const origin = allowedOrigin(request);
  const id = crypto.randomUUID();
  const respond = (response: Response): Response => {
    response.headers.set('x-request-id', id);
    return response;
  };
  const log = (stage: string, details: Record<string, string | number | null> = {}): void => {
    console.log('[newsletter:confirmation]', { attemptId: id, mode, stage, ...details });
  };
  if (request.headers.has('origin') && !origin) return respond(jsonError('This signup request is not allowed.', 403));
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    return respond(jsonError('Expected a JSON request.', 415, origin));
  }
  const ip = request.headers.get('cf-connecting-ip') ?? '0.0.0.0';
  try {
    if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.SUBSCRIBE_RATE_LIMITER) {
      log('configuration_unavailable');
      return respond(jsonError('Subscriptions are temporarily unavailable. Please try again later.', 503, origin));
    }
    if (!(await env.SUBSCRIBE_RATE_LIMITER.limit({ key: ip })).success) {
      log('request_limited');
      const response = jsonError('Too many requests. Please wait a minute and try again.', 429, origin);
      response.headers.set('retry-after', '60');
      return respond(response);
    }
    const body = await readBody(request);
    if (typeof body !== 'object' || body === null || !('email' in body)) {
      return respond(jsonError('Invalid or oversized signup request.', 400, origin));
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !EMAIL_RE.test(email)) return respond(jsonError('Please enter a valid email address.', 400, origin));
    const token = 'turnstile' in body && typeof body.turnstile === 'string' ? body.turnstile : '';
    const verification = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip, new URL(request.url).hostname);
    if (!verification.ok) {
      log('verification_failed', { reason: verification.reason });
      return respond(jsonError(verification.kind === 'unavailable'
        ? 'Verification is temporarily unavailable. Please try again later.'
        : 'Verification could not be completed. Please try again.',
      verification.kind === 'unavailable' ? 503 : 400, origin));
    }
    const confirmToken = generateToken();
    const admission = await admitConfirmation(env.DB, {
      id, email, tokenHash: await hashToken(confirmToken), subscriberId: generateToken(),
      unsubscribeToken: generateToken(), source: sanitizeSource('source' in body ? body.source : null),
      consentIp: truncateIp(ip), userAgent: request.headers.get('user-agent')?.slice(0, 512) ?? null, mode,
    });
    if (admission.decision === 'capacity') {
      log('capacity_limited');
      const response = jsonError('Subscriptions are busy right now. Please try again later.', 429, origin);
      response.headers.set('retry-after', '3600');
      return respond(response);
    }
    if (admission.decision === 'unchanged' || !admission.unsubscribe_token) {
      log('unchanged');
      return respond(jsonOk({ ok: true }, 202, origin));
    }
    log('reserved');
    const site = new URL(request.url).origin;
    const delivery = await sendConfirmationEmail(env.RESEND_API_KEY, email,
      `${site}/api/confirm/${confirmToken}`,
      `${site}/api/unsubscribe/${admission.unsubscribe_token}?confirmations=off`, id);
    try {
      await recordConfirmationOutcome(env.DB, id, delivery.outcome, delivery.providerId, delivery.providerStatus);
    } catch {
      // The reservation is already durable. Do not resend because this write failed.
      log('outcome_write_failed', { delivery: delivery.outcome });
    }
    log(delivery.outcome, { providerStatus: delivery.providerStatus });
    if (delivery.outcome !== 'accepted') {
      const response = jsonError('We could not confirm the email was sent. Check your inbox before trying again in ten minutes.', 503, origin);
      response.headers.set('retry-after', '600');
      return respond(response);
    }
    return respond(jsonOk({ ok: true }, 202, origin));
  } catch {
    log('service_unavailable');
    return respond(jsonError('Subscriptions are temporarily unavailable. Please try again later.', 503, origin));
  }
}
