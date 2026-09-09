/**
 * POST /api/webhooks/resend — suppress recipients after a signed bounce or complaint.
 * Configure both event types in Resend and supply RESEND_WEBHOOK_SECRET.
 * Verification uses Web Crypto following Svix's signed-payload format:
 * https://docs.svix.com/receiving/verifying-payloads/how-manual
 */

import type { NewsletterEnv } from './db.js';
import { markBounced, markComplained } from './db.js';

/** Reject timestamps more than five minutes from the current time. */
const MAX_AGE_SECONDS = 300;
const MAX_BODY_BYTES = 64 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleResendWebhook(
  request: Request,
  env: NewsletterEnv,
): Promise<Response> {
  if (!env.RESEND_WEBHOOK_SECRET) {
    console.warn('[newsletter:webhook] RESEND_WEBHOOK_SECRET not configured.');
    return new Response('Not configured', { status: 501 });
  }

  const bodyResult = await readBody(request);
  if (!bodyResult.ok) return new Response('Invalid webhook body', { status: bodyResult.status });
  const body = bodyResult.body;
  const valid = await verifySvixSignature(request, body, env.RESEND_WEBHOOK_SECRET);
  if (!valid) return new Response('Unauthorized', { status: 401 });

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!isRecord(payload) || (payload.type !== 'email.bounced' && payload.type !== 'email.complained')) {
    return new Response('OK', { status: 200 });
  }
  const recipients = extractRecipients(payload.data);
  const suppress = payload.type === 'email.bounced' ? markBounced : markComplained;
  for (const email of recipients) {
    await suppress(env.DB, email);
  }
  console.log('[newsletter:webhook]', { event: payload.type, recipients: recipients.length });

  return new Response('OK', { status: 200 });
}

async function readBody(request: Request): Promise<
  { ok: true; body: string } | { ok: false; status: 400 | 413 }
> {
  const reader = request.body?.getReader();
  if (!reader) return { ok: true, body: '' };
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return { ok: true, body: new TextDecoder().decode(bytes) };
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
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

  // Accept whole Unix seconds, not partially numeric strings such as "123abc".
  if (!/^\d+$/.test(ts)) return false;
  const tsNum = Number(ts);
  if (!Number.isSafeInteger(tsNum) || Math.abs(Date.now() / 1000 - tsNum) > MAX_AGE_SECONDS) {
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

/** Compare all equal-length characters without returning on the first mismatch. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Current Resend recipients plus the older nested shape; normalize and deduplicate. */
function extractRecipients(data: unknown): string[] {
  if (!isRecord(data)) return [];
  const recipients = new Set<string>();
  const collect = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    for (const candidate of value) {
      if (typeof candidate !== 'string') continue;
      const email = candidate.trim().toLowerCase();
      if (email.length <= 254 && EMAIL_RE.test(email)) recipients.add(email);
    }
  };
  collect(data.to);
  if (isRecord(data.email)) collect(data.email.to);
  return [...recipients];
}
