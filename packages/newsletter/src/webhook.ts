/**
 * webhook.ts — POST /api/webhooks/resend
 *
 * Handles Resend delivery events for bounce and spam-complaint management.
 *
 * WHY THIS EXISTS
 * ───────────────
 * CAN-SPAM §5(a)(4): must honor opt-out requests within 10 business days.
 * A spam complaint (user clicks "Report Spam") IS an opt-out request.
 * Without this webhook, complaints go unprocessed → CAN-SPAM violation.
 *
 * Hard bounces (invalid address) must be suppressed immediately.
 * Continuing to send to hard-bounced addresses damages sender reputation
 * and can get gkoreli.com blacklisted by major email providers.
 *
 * WHY NO LIBRARY (no svix npm package)
 * ─────────────────────────────────────
 * Resend uses Svix for webhook signing. The @svix/api npm package adds
 * ~900 KB to the Worker bundle. Workers have a 1 MB uncompressed script
 * size limit on the free plan. The verification algorithm is simple
 * HMAC-SHA256 — implementable in ~30 lines using the Web Crypto API.
 *
 * This is the same approach used in Divkix/pickmyclass (GitHub) and
 * recommended by the Svix docs themselves for bundle-size-constrained
 * environments. See ADR-0010 §Dependencies for the full rationale.
 *
 * Source: https://docs.svix.com/receiving/verifying-payloads/how-manual
 *
 * SETUP
 * ─────
 * Resend → Webhooks → Add Endpoint → https://gkoreli.com/api/webhooks/resend
 * Select events: email.bounced, email.complained
 * Copy signing secret → wrangler secret put RESEND_WEBHOOK_SECRET
 */

import type { NewsletterEnv } from './db.js';
import { markBounced, markComplained } from './db.js';

/** Reject webhooks older than 5 minutes (replay attack prevention). */
const MAX_AGE_SECONDS = 300;

interface ResendWebhookPayload {
  type: string;
  data: {
    email?: { to?: string[]; from?: string };
    to?: string[];
  };
}

export async function handleResendWebhook(
  request: Request,
  env: NewsletterEnv,
): Promise<Response> {
  if (!env.RESEND_WEBHOOK_SECRET) {
    console.warn('[newsletter:webhook] RESEND_WEBHOOK_SECRET not configured.');
    return new Response('Not configured', { status: 501 });
  }

  const body = await request.text();
  const valid = await verifySvixSignature(request, body, env.RESEND_WEBHOOK_SECRET);
  if (!valid) return new Response('Unauthorized', { status: 401 });

  let payload: ResendWebhookPayload;
  try {
    payload = JSON.parse(body) as ResendWebhookPayload;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const email = extractEmail(payload);
  if (!email) return new Response('OK', { status: 200 }); // unknown shape — ack, don't retry

  switch (payload.type) {
    case 'email.bounced':
      // Hard bounce: address is undeliverable — suppress to protect deliverability
      await markBounced(env.DB, email);
      console.log(`[newsletter:webhook] Bounced: ${redact(email)}`);
      break;

    case 'email.complained':
      // Spam complaint: mandatory CAN-SPAM unsubscribe
      await markComplained(env.DB, email);
      console.log(`[newsletter:webhook] Complained/unsubscribed: ${redact(email)}`);
      break;

    default:
      // Unsubscribed event type — ack without action
      break;
  }

  return new Response('OK', { status: 200 });
}

// ── Svix HMAC-SHA256 verification — zero deps, Web Crypto API only ─────────────

async function verifySvixSignature(
  request: Request,
  body: string,
  secret: string,
): Promise<boolean> {
  const id = request.headers.get('svix-id');
  const ts = request.headers.get('svix-timestamp');
  const sig = request.headers.get('svix-signature');
  if (!id || !ts || !sig) return false;

  // Reject stale messages
  const tsNum = parseInt(ts, 10);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > MAX_AGE_SECONDS) {
    return false;
  }

  // Decode secret (base64 after optional "whsec_" prefix)
  const b64 = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let keyBytes: Uint8Array;
  try {
    keyBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  } catch {
    return false;
  }

  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );

  const signed = `${id}.${ts}.${body}`;
  const sigBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const computed = `v1,${btoa(String.fromCharCode(...new Uint8Array(sigBytes)))}`;

  // svix-signature may contain multiple space-separated sigs (key rotation)
  return sig.split(' ').some(s => timingSafeEqual(s, computed));
}

/** Constant-time string comparison — prevents timing-based signature extraction. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function extractEmail(payload: ResendWebhookPayload): string | null {
  const addr = payload.data?.email?.to?.[0] ?? payload.data?.to?.[0];
  return typeof addr === 'string' && addr.includes('@')
    ? addr.toLowerCase().trim()
    : null;
}

/** Redact email for safe logging: user@example.com → u***@example.com */
function redact(email: string): string {
  const [local, domain] = email.split('@');
  return local && domain ? `${local[0]}***@${domain}` : '[redacted]';
}
