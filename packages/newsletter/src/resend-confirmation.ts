/**
 * resend-confirmation.ts — POST /api/resend-confirmation
 *
 * WHY THIS EXISTS
 * ───────────────
 * The confirmation email can fail silently (Resend outage, spam filter, user
 * mistyped address then resubscribed). A pending subscriber with no way to
 * re-trigger their confirmation email is a permanently lost conversion.
 *
 * This endpoint lets users resend the confirmation without re-submitting
 * the subscribe form — useful after a rate-limit hit, or if the email went
 * to spam and they deleted it.
 *
 * SECURITY
 * ────────
 * - Rate limited via SUBSCRIBE_RATE_LIMITER (same binding as /api/subscribe)
 * - No Turnstile required: this is not a subscription creation path, and
 *   the rate limiter (3/min per IP) makes email enumeration impractical.
 * - Response is always 200 — never reveals whether the email is in the DB
 *   to prevent subscriber enumeration.
 * - Only works for status='pending'. Active/unsubscribed/bounced → silent no-op.
 */

import type { NewsletterEnv } from './db.js';
import { findByEmail, refreshPendingTokens } from './db.js';
import { generateToken, hashToken, truncateIp } from './tokens.js';
import { sendConfirmationEmail } from './email.js';
import { jsonOk, jsonError, allowedOrigin, corsPreflightResponse } from './responses.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_UA_LENGTH = 512;

export async function handleResendConfirmationPreflight(request: Request): Promise<Response> {
  return corsPreflightResponse(allowedOrigin(request));
}

export async function handleResendConfirmation(
  request: Request,
  env: NewsletterEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  const origin = allowedOrigin(request);
  const ip = request.headers.get('cf-connecting-ip') ?? '0.0.0.0';

  // 1. Rate limit — shared with subscribe
  if (env.SUBSCRIBE_RATE_LIMITER) {
    const { success } = await env.SUBSCRIBE_RATE_LIMITER.limit({ key: ip });
    if (!success) {
      return jsonError('Too many requests. Try again in a few minutes.', 429, origin);
    }
  }

  // 2. Parse + validate
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  if (!body) return jsonError('Invalid request body', 400, origin);

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return jsonError('Invalid email address', 400, origin);
  }

  // 3. Look up — always return 200 to prevent enumeration
  const existing = await findByEmail(env.DB, email);
  if (existing?.status !== 'pending') {
    // active, unsubscribed, bounced, or not found — silent no-op
    return jsonOk({ ok: true }, 200, origin);
  }

  // 4. Refresh tokens + resend
  const rawConfirm = generateToken();
  const rawUnsub = generateToken();
  const confirmHash = await hashToken(rawConfirm);
  const consentIp = truncateIp(ip);
  const userAgent = (request.headers.get('user-agent') ?? '').slice(0, MAX_UA_LENGTH) || null;

  await refreshPendingTokens(env.DB, email, confirmHash, rawUnsub, consentIp, userAgent);

  const confirmUrl = `${new URL(request.url).origin}/api/confirm/${rawConfirm}`;

  ctx.waitUntil(
    sendConfirmationEmail(env.RESEND_API_KEY, email, confirmUrl).catch(err =>
      console.error('[newsletter:resend-confirmation] Email failed:', err),
    ),
  );

  return jsonOk({ ok: true }, 200, origin);
}
