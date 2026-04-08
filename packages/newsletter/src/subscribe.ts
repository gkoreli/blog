/**
 * subscribe.ts — POST /api/subscribe handler.
 *
 * Flow: validate input → verify Turnstile → check duplicate → insert/refresh → send confirmation.
 * Analytics-style fire-and-forget email send via ctx.waitUntil().
 */

import type { NewsletterEnv } from './db.js';
import {
  findByEmail,
  insertSubscriber,
  refreshPendingTokens,
} from './db.js';
import { verifyTurnstile } from './turnstile.js';
import { sendConfirmationEmail } from './email.js';
import { jsonOk, jsonError } from './responses.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeSource(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.split(/[?#]/)[0]!.slice(0, 200);
  return trimmed.startsWith('/') ? trimmed : null;
}

export async function handleSubscribe(
  request: Request,
  env: NewsletterEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  const body = await request.json().catch(() => null) as {
    email?: unknown;
    turnstile?: unknown;
    source?: unknown;
  } | null;

  if (!body) return jsonError('Invalid request body', 400);

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !EMAIL_RE.test(email)) return jsonError('Invalid email address', 400);
  if (email.length > 254) return jsonError('Email too long', 400);

  const turnstileToken = typeof body.turnstile === 'string' ? body.turnstile : '';
  const ip = request.headers.get('cf-connecting-ip') ?? '0.0.0.0';

  const turnstileOk = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!turnstileOk) return jsonError('Verification failed. Please try again.', 400);

  const source = sanitizeSource(body.source);
  const existing = await findByEmail(env.DB, email);

  // Already confirmed — return success without revealing account existence
  if (existing?.status === 'active') return jsonOk({ ok: true }, 202);

  const confirmToken = crypto.randomUUID();
  const unsubscribeToken = crypto.randomUUID();
  const origin = new URL(request.url).origin;
  const confirmUrl = `${origin}/api/confirm/${confirmToken}`;

  if (existing?.status === 'pending') {
    await refreshPendingTokens(env.DB, email, confirmToken, unsubscribeToken);
  } else {
    await insertSubscriber(env.DB, crypto.randomUUID(), email, confirmToken, unsubscribeToken, source);
  }

  ctx.waitUntil(
    sendConfirmationEmail(env.RESEND_API_KEY, email, confirmUrl).catch(err =>
      console.error('[newsletter] Confirmation email failed:', err),
    ),
  );

  return jsonOk({ ok: true }, 202);
}
