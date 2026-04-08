/**
 * send.ts — POST /api/send
 *
 * Admin-only endpoint: sends a newsletter to all active subscribers.
 *
 * AUTHENTICATION
 * ──────────────
 * Authorization: Bearer {ADMIN_SECRET}
 * ADMIN_SECRET must be set as a Worker secret: wrangler secret put ADMIN_SECRET
 * If unset, the endpoint returns 501 (not configured).
 *
 * REQUEST BODY
 * ────────────
 * {
 *   subject:     string           — email subject line
 *   html:        string           — HTML body (unsubscribe footer appended automatically)
 *   text:        string           — plain-text body (unsubscribe footer appended automatically)
 *   campaign_id?: string          — optional; use for idempotency (retry protection)
 * }
 *
 * IDEMPOTENCY
 * ───────────
 * Provide the same campaign_id on retry — endpoint returns 409 if delivery_logs
 * already exist for that campaign_id. Prevents double-sends on network retries.
 * If campaign_id is omitted, a new one is generated (no idempotency protection).
 *
 * BATCH SENDING
 * ─────────────
 * Sends in chunks of RESEND_BATCH_LIMIT (100) via Resend's batch API.
 * Each email gets personalised List-Unsubscribe + List-Unsubscribe-Post headers (RFC 8058).
 * Delivery is logged to delivery_logs per recipient for audit and retry.
 *
 * RESPONSE
 * ────────
 * 200: { campaign_id, sent: N, failed: N, total: N }
 * 400: invalid body
 * 401: missing/wrong ADMIN_SECRET
 * 409: campaign already sent (idempotency)
 * 501: ADMIN_SECRET not configured
 *
 * PHASE 2 LIMITATIONS (acceptable at <500 subscribers)
 * ─────────────────────────────────────────────────────
 * - Synchronous within Worker request — no Queues.
 *   At 100 subscribers, one Resend batch call takes ~1s. Fine for Phase 2.
 *   Move to Cloudflare Queues when send time approaches Worker CPU limits.
 * - Resend free tier: 100 emails/day. Upgrade plan before first real send.
 * - No retry on failed individual emails — delivery_logs records failures;
 *   re-run with same campaign_id is blocked (409). Fix failed rows manually
 *   or implement per-recipient retry in Phase 3.
 */

import type { NewsletterEnv } from './db.js';
import {
  getActiveSubscribers,
  campaignExists,
  insertDeliveryLogs,
  type DeliveryLog,
} from './db.js';
import {
  sendNewsletterBatch,
  type NewsletterRecipient,
  RESEND_BATCH_LIMIT,
} from './email.js';
import { generateToken } from './tokens.js';

export async function handleSend(
  request: Request,
  env: NewsletterEnv,
): Promise<Response> {
  // 1. Check ADMIN_SECRET is configured
  if (!env.ADMIN_SECRET) {
    return json({ error: 'ADMIN_SECRET not configured' }, 501);
  }

  // 2. Authenticate
  const auth = request.headers.get('authorization') ?? '';
  if (!timingSafeCompare(auth, `Bearer ${env.ADMIN_SECRET}`)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // 3. Parse body
  const body = await request.json().catch(() => null) as {
    subject?: unknown;
    html?: unknown;
    text?: unknown;
    campaign_id?: unknown;
  } | null;

  if (!body) return json({ error: 'Invalid request body' }, 400);

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const html    = typeof body.html    === 'string' ? body.html.trim()    : '';
  const text    = typeof body.text    === 'string' ? body.text.trim()    : '';

  if (!subject || !html || !text) {
    return json({ error: 'subject, html, and text are required' }, 400);
  }

  // 4. Campaign ID — caller-provided for idempotency, or auto-generated
  const campaignId = typeof body.campaign_id === 'string' && body.campaign_id.trim()
    ? body.campaign_id.trim()
    : generateToken();

  // 5. Idempotency: reject if already sent
  if (typeof body.campaign_id === 'string' && body.campaign_id.trim()) {
    const exists = await campaignExists(env.DB, campaignId);
    if (exists) {
      return json({ error: 'Campaign already sent', campaign_id: campaignId }, 409);
    }
  }

  // 6. Fetch active subscribers
  const subscribers = await getActiveSubscribers(env.DB);
  if (subscribers.length === 0) {
    return json({ campaign_id: campaignId, sent: 0, failed: 0, total: 0 }, 200);
  }

  // 7. Send in chunks + log results
  let sent = 0;
  let failed = 0;

  const chunks = chunk(subscribers, RESEND_BATCH_LIMIT);

  for (const batch of chunks) {
    const recipients: NewsletterRecipient[] = batch.map(s => ({
      email: s.email,
      unsubscribeToken: s.unsubscribe_token,
    }));

    const results = await sendNewsletterBatch(
      env.RESEND_API_KEY,
      recipients,
      subject,
      html,
      text,
    );

    const logs: DeliveryLog[] = results.map((r, i) => ({
      id: generateToken(),
      campaign_id: campaignId,
      sub_id: batch[i]!.id,
      email: r.email,
      status: r.error ? 'failed' : 'sent',
      resend_id: r.resend_id,
      error: r.error,
      sent_at: new Date().toISOString(),
    }));

    await insertDeliveryLogs(env.DB, logs);

    for (const r of results) {
      r.error ? failed++ : sent++;
    }
  }

  console.log(`[newsletter:send] campaign=${campaignId} sent=${sent} failed=${failed} total=${subscribers.length}`);

  return json({ campaign_id: campaignId, sent, failed, total: subscribers.length }, 200);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Constant-time string comparison to prevent timing oracle on ADMIN_SECRET.
 * Falls back to false if lengths differ (timing safe enough for this use case
 * since length of the expected value is not secret).
 */
function timingSafeCompare(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i]! ^ bBytes[i]!;
  return diff === 0;
}
