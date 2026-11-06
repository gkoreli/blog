import type { NewsletterEnv } from './db.js';
import { admitConfirmation, recordConfirmationOutcome } from './confirmation-store.js';
import { sendConfirmationEmail } from './email.js';
import { allowedOrigin, jsonError, jsonOk } from './responses.js';
import { generateToken, hashToken, truncateIp } from './tokens.js';
import { verifyTurnstile } from './turnstile.js';
import { readRequestBytes } from './request-body.js';
import { SubscriberAddress } from './confirmation.js';
import type { ConfirmationMode } from './confirmation.js';
import { requestConfirmation } from './request-confirmation.js';
import type { ConfirmationObservation } from './request-confirmation.js';

const MAX_BODY_BYTES = 4096;
type TransportObservation =
  | { stage: 'origin_rejected' | 'content_type_rejected' | 'configuration_unavailable'
    | 'request_limited' | 'email_invalid' | 'service_unavailable' }
  | { stage: 'body_rejected'; reason?: 'too-large' | 'timeout' | 'aborted' | 'unreadable' };

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
  request: Request, env: NewsletterEnv, mode: ConfirmationMode,
): Promise<Response> {
  const origin = allowedOrigin(request);
  const id = crypto.randomUUID();
  const startedAt = performance.now();
  const rawClientId = request.headers.get('x-subscription-attempt-id');
  const clientAttemptId = rawClientId?.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawClientId)
    ? rawClientId.toLowerCase() : null;
  const respond = (response: Response): Response => {
    response.headers.set('x-request-id', id);
    return response;
  };
  const log = (event: ConfirmationObservation | TransportObservation): void => {
    const details = event.stage === 'verification_failed'
      ? { ...event, verifierCodes: event.verifierCodes.join(',') } : event;
    console.log('[newsletter:confirmation]', { attemptId: id, clientAttemptId, mode,
      elapsedMs: Math.max(0, Math.floor(performance.now() - startedAt)), ...details });
  };
  if (request.headers.has('origin') && !origin) {
    log({ stage: 'origin_rejected' });
    return respond(jsonError('This signup request is not allowed.', 403));
  }
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    log({ stage: 'content_type_rejected' });
    return respond(jsonError('Expected a JSON request.', 415, origin));
  }
  const ip = request.headers.get('cf-connecting-ip') ?? '0.0.0.0';
  try {
    if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.SUBSCRIBE_RATE_LIMITER) {
      log({ stage: 'configuration_unavailable' });
      return respond(jsonError('Subscriptions are temporarily unavailable. Please try again later.', 503, origin));
    }
    if (!(await env.SUBSCRIBE_RATE_LIMITER.limit({ key: ip })).success) {
      log({ stage: 'request_limited' });
      const response = jsonError('Too many requests. Please wait a minute and try again.', 429, origin);
      response.headers.set('retry-after', '60');
      return respond(response);
    }
    const received = await readRequestBytes(request, { maxBytes: MAX_BODY_BYTES });
    if (!received.ok) {
      log({ stage: 'body_rejected', reason: received.reason });
      return respond(jsonError(received.status === 408
        ? 'The signup request did not finish. Please try again.'
        : 'Invalid or oversized signup request.', received.status, origin));
    }
    let body: unknown;
    try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(received.bytes)); }
    catch { body = null; }
    if (typeof body !== 'object' || body === null || !('email' in body)) {
      log({ stage: 'body_rejected' });
      return respond(jsonError('Invalid or oversized signup request.', 400, origin));
    }
    const email = SubscriberAddress.parse(body.email);
    if (!email) {
      log({ stage: 'email_invalid' });
      return respond(jsonError('Please enter a valid email address.', 400, origin));
    }
    const site = new URL(request.url);
    const decision = await requestConfirmation({
      id, email, challengeToken: 'turnstile' in body && typeof body.turnstile === 'string' ? body.turnstile : '',
      mode, source: sanitizeSource('source' in body ? body.source : null),
      consentIp: truncateIp(ip), userAgent: request.headers.get('user-agent')?.slice(0, 512) ?? null,
    }, {
      verify: token => verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip, site.hostname),
      async issue() {
        const confirmationToken = generateToken();
        return { confirmationToken, tokenHash: await hashToken(confirmationToken),
          subscriberId: generateToken(), unsubscribeToken: generateToken() };
      },
      admit: reservation => admitConfirmation(env.DB, reservation),
      deliver: (address, token, unsubscribeToken, operationId) => sendConfirmationEmail(env.RESEND_API_KEY,
        address, `${site.origin}/api/confirm/${token}`,
        `${site.origin}/api/unsubscribe/${unsubscribeToken}?confirmations=off`, operationId),
      record: (operationId, delivery) => recordConfirmationOutcome(env.DB, operationId,
        delivery.outcome, delivery.providerId, delivery.providerStatus),
      observe: log,
    });
    if (decision === 'verification-unavailable' || decision === 'verification-rejected') {
      return respond(jsonError(decision === 'verification-unavailable'
        ? 'Verification is temporarily unavailable. Please try again later.'
        : 'Verification could not be completed. Please try again.',
      decision === 'verification-unavailable' ? 503 : 400, origin));
    }
    if (decision === 'capacity') {
      const response = jsonError('Subscriptions are busy right now. Please try again later.', 429, origin);
      response.headers.set('retry-after', '3600');
      return respond(response);
    }
    if (decision === 'delivery-unconfirmed') {
      const response = jsonError('We could not confirm the email was sent. Check your inbox before trying again in ten minutes.', 503, origin);
      response.headers.set('retry-after', '600');
      return respond(response);
    }
    return respond(jsonOk({ ok: true }, 202, origin));
  } catch {
    log({ stage: 'service_unavailable' });
    return respond(jsonError('Subscriptions are temporarily unavailable. Please try again later.', 503, origin));
  }
}
