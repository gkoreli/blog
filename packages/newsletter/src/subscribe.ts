/**
 * subscribe.ts — POST /api/subscribe
 *
 * Flow:
 *   1. Rate limit per IP (native Workers binding — free, <1ms, zero KV writes)
 *   2. Validate email format + length
 *   3. Verify Turnstile token server-side
 *   4. Generate 256-bit confirm + unsubscribe tokens; SHA-256 hash before storage
 *   5. Insert or refresh pending subscription with consent IP (truncated for GDPR)
 *   6. Fire-and-forget confirmation email via Resend (ctx.waitUntil)
 *
 * Security:
 *   - CORS scoped to gkoreli.com — see responses.ts
 *   - Raw tokens live only in email URLs; hashes stored in D1 (DB breach ≠ usable tokens)
 *   - Active addresses return 202 without revealing account existence (no enumeration)
 *   - Turnstile is the primary bot gate; rate limiter is defense-in-depth
 *   - Consent IP stored truncated (last octet masked) for GDPR Art. 5(1)(c) compliance
 */

import type { NewsletterEnv } from './db.js';
import { findByEmail, insertSubscriber, refreshPendingTokens } from './db.js';
import { generateToken, hashToken, truncateIp } from './tokens.js';
import { verifyTurnstile } from './turnstile.js';
import { sendConfirmationEmail } from './email.js';
import { jsonOk, jsonError, allowedOrigin } from './responses.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeSource(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const stripped = raw.split(/[?#]/)[0]!.slice(0, 200);
  return stripped.startsWith('/') ? stripped : null;
}

export async function handleSubscribe(
  request: Request,
  env: NewsletterEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  const origin = allowedOrigin(request);
  const ip = request.headers.get('cf-connecting-ip') ?? '0.0.0.0';

  // 1. Rate limit — optional binding; skipped gracefully if not configured (local dev)
  if (env.SUBSCRIBE_RATE_LIMITER) {
    const { success } = await env.SUBSCRIBE_RATE_LIMITER.limit({ key: ip });
    if (!success) {
      return jsonError('Too many requests. Try again in a few minutes.', 429, origin);
    }
  }

  // 2. Parse + validate
  const body = await request.json().catch(() => null) as {
    email?: unknown;
    turnstile?: unknown;
    source?: unknown;
  } | null;

  if (!body) return jsonError('Invalid request body', 400, origin);

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email)) return jsonError('Invalid email address', 400, origin);
  if (email.length > 254) return jsonError('Email too long', 400, origin);

  // 3. Turnstile
  const turnstileToken = typeof body.turnstile === 'string' ? body.turnstile : '';
  const ok = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!ok) return jsonError('Verification failed. Please try again.', 400, origin);

  const source = sanitizeSource(body.source);
  const consentIp = truncateIp(ip);
  const existing = await findByEmail(env.DB, email);

  // Already confirmed — 202 without revealing account existence
  if (existing?.status === 'active') return jsonOk({ ok: true }, 202, origin);

  // 4. Generate 256-bit tokens; hash both before storage
  const rawConfirm = generateToken();
  const rawUnsub = generateToken();
  const [confirmHash, unsubHash] = await Promise.all([
    hashToken(rawConfirm),
    hashToken(rawUnsub),
  ]);

  const confirmUrl = `${new URL(request.url).origin}/api/confirm/${rawConfirm}`;

  // 5. Insert or refresh
  if (existing?.status === 'pending') {
    await refreshPendingTokens(env.DB, email, confirmHash, unsubHash, consentIp);
  } else {
    await insertSubscriber(
      env.DB,
      generateToken(), // row ID — separate random value
      email,
      confirmHash,
      unsubHash,
      source,
      consentIp,
    );
  }

  // 6. Fire-and-forget
  ctx.waitUntil(
    sendConfirmationEmail(env.RESEND_API_KEY, email, confirmUrl).catch(err =>
      console.error('[newsletter] Confirmation email failed:', err),
    ),
  );

  return jsonOk({ ok: true }, 202, origin);
}
