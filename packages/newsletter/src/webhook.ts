/**
 * POST /api/webhooks/resend — suppress recipients after a signed bounce or complaint.
 * Configure both event types in Resend and supply RESEND_WEBHOOK_SECRET.
 * Verification uses Web Crypto following Svix's signed-payload format:
 * https://docs.svix.com/receiving/verifying-payloads/how-manual
 */

import type { NewsletterEnv } from './db.js';
import { markBounced, markComplained } from './db.js';
import { readRequestBytes, type RequestBodyFailure } from './request-body.js';
import { prepareWebhookSignature, verifyWebhookSignature } from './webhook-authentication.js';

const MAX_BODY_BYTES = 64 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type SuppressionEvent = 'email.bounced' | 'email.complained';
type WebhookObservation =
  | { stage: 'configuration_unavailable'; reason: 'missing-secret' | 'invalid-secret' }
  | { stage: 'authentication_rejected'; reason: 'headers' | 'timestamp' | 'signature' }
  | { stage: 'body_rejected'; reason: RequestBodyFailure }
  | { stage: 'payload_rejected'; reason: 'invalid-json-or-encoding' }
  | { stage: 'ignored'; reason: 'event-type' | 'no-recipients' }
  | { stage: 'suppression_applied' | 'suppression_failed'; event: SuppressionEvent; recipients: number };

export async function handleResendWebhook(
  request: Request,
  env: NewsletterEnv,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  const respond = (body: string, status: number, observation: WebhookObservation): Response => {
    const entry = { requestId, ...observation };
    if (observation.stage === 'configuration_unavailable' || observation.stage === 'suppression_failed') {
      console.warn('[newsletter:webhook]', entry);
    } else {
      console.log('[newsletter:webhook]', entry);
    }
    return new Response(body, { status, headers: {
      'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-request-id': requestId,
    } });
  };
  if (!env.RESEND_WEBHOOK_SECRET) {
    return respond('Not configured', 501, { stage: 'configuration_unavailable', reason: 'missing-secret' });
  }
  // Reject absent or expired authentication before waiting for any body bytes.
  const signing = await prepareWebhookSignature(request, env.RESEND_WEBHOOK_SECRET);
  if (!signing.ok) {
    if (signing.reason === 'configuration') {
      return respond('Temporarily unavailable', 503, { stage: 'configuration_unavailable', reason: 'invalid-secret' });
    }
    return respond('Unauthorized', 401, { stage: 'authentication_rejected', reason: signing.reason });
  }
  const received = await readRequestBytes(request, { maxBytes: MAX_BODY_BYTES });
  if (!received.ok) return respond('Invalid webhook body', received.status, { stage: 'body_rejected', reason: received.reason });
  const verified = await verifyWebhookSignature(signing.context, received.bytes);
  if (!verified.ok) return respond('Unauthorized', 401, { stage: 'authentication_rejected', reason: verified.reason });
  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(received.bytes));
  } catch {
    return respond('Invalid JSON', 400, { stage: 'payload_rejected', reason: 'invalid-json-or-encoding' });
  }
  if (!isRecord(payload) || (payload.type !== 'email.bounced' && payload.type !== 'email.complained')) {
    return respond('OK', 200, { stage: 'ignored', reason: 'event-type' });
  }
  const event = payload.type;
  const recipients = extractRecipients(payload.data);
  if (recipients.length === 0) return respond('OK', 200, { stage: 'ignored', reason: 'no-recipients' });
  const suppress = event === 'email.bounced' ? markBounced : markComplained;
  try {
    for (const email of recipients) await suppress(env.DB, email);
  } catch {
    return respond('Temporarily unavailable', 503, { stage: 'suppression_failed', event, recipients: recipients.length });
  }
  return respond('OK', 200, { stage: 'suppression_applied', event, recipients: recipients.length });
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
