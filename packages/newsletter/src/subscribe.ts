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

const MAX_UA_LENGTH = 512;
import { verifyTurnstile } from './turnstile.js';
import { sendConfirmationEmail } from './email.js';
import { jsonOk, jsonError, allowedOrigin } from './responses.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function logRejection(request: Request, reason: string, details: Record<string, unknown> = {}): void {
  console.warn('[newsletter:subscribe] rejected', {
    reason,
    ray: request.headers.get('cf-ray') ?? '',
    country: request.headers.get('cf-ipcountry') ?? '',
    origin: request.headers.get('origin') ?? '',
    ...details,
  });
}

function sanitizeSource(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;

  try {
    const parsed = new URL(raw, 'https://gkoreli.com');
    const path = parsed.pathname.slice(0, 200);
    const safeParams = new URLSearchParams();

    for (const key of ['utm_source', 'utm_campaign', 'ref']) {
      const value = parsed.searchParams.get(key)?.trim();
      if (value) safeParams.set(key, value.slice(0, key === 'ref' ? 100 : 80));
    }

    const query = safeParams.toString();
    return query ? `${path}?${query}` : path;
  } catch {
    return null;
  }
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

  if (!body) {
    logRejection(request, 'invalid_body');
    return jsonError('Invalid request body', 400, origin);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email)) {
    logRejection(request, 'invalid_email');
    return jsonError('Invalid email address', 400, origin);
  }
  if (email.length > 254) {
    logRejection(request, 'email_too_long');
    return jsonError('Email too long', 400, origin);
  }

  // 3. Turnstile
  const turnstileToken = typeof body.turnstile === 'string' ? body.turnstile : '';
  const turnstile = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!turnstile.ok) {
    logRejection(request, 'turnstile_failed', {
      turnstileReason: turnstile.reason ?? '',
      turnstileErrorCodes: turnstile.errorCodes ?? [],
    });
    return jsonError('Verification failed. Retry once, or allow bot protection for this site.', 400, origin);
  }

  const source = sanitizeSource(body.source);
  const consentIp = truncateIp(ip);
  const userAgent = (request.headers.get('user-agent') ?? '').slice(0, MAX_UA_LENGTH) || null;
  const existing = await findByEmail(env.DB, email);

  // Already confirmed — 202 without revealing account existence
  if (existing?.status === 'active') return jsonOk({ ok: true }, 202, origin);

  // 4. Generate 256-bit tokens.
  //    Confirm token: hashed before storage (one-time credential granting account activation).
  //    Unsubscribe token: stored raw (permanent opt-out token; must be included verbatim in email URLs).
  const rawConfirm = generateToken();
  const rawUnsub = generateToken();
  const confirmHash = await hashToken(rawConfirm);

  const confirmUrl = `${new URL(request.url).origin}/api/confirm/${rawConfirm}`;

  // 5. Insert or refresh
  if (existing?.status === 'pending') {
    await refreshPendingTokens(env.DB, email, confirmHash, rawUnsub, consentIp, userAgent);
  } else {
    await insertSubscriber(
      env.DB,
      generateToken(), // row ID — separate random value
      email,
      confirmHash,
      rawUnsub,
      source,
      consentIp,
      userAgent,
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
