/**
 * Manual admin campaign sender. A durable campaign identity is admitted before
 * provider calls. Reserved/interrupted campaigns are not automatically replayed;
 * provider acceptance is distinct from mailbox delivery and receipt persistence.
 * Body: { subject: string, html: string, text: string, campaign_id?: string }.
 * Omitting campaign_id creates a new operation, so callers need a stable supplied
 * ID for retry protection. The bearer ADMIN_SECRET and RESEND_API_KEY are required.
 * 200 resolves processing; 503 is incomplete/unavailable; 409 is a charged ID.
 * The legacy sent response field counts provider acceptance, not inbox delivery.
 */
import type { NewsletterEnv, DeliveryLog } from './db.js';
import { getActiveSubscribers, insertDeliveryLogs } from './db.js';
import { sendNewsletterBatch, RESEND_BATCH_LIMIT } from './email.js';
import { generateToken } from './tokens.js';
import { readRequestBytes } from './request-body.js';
import { campaignPayloadHash, parseCampaignCommand, type CampaignObservation, type CampaignReceipt } from './campaign.js';
import { admitCampaign, completeCampaign } from './campaign-store.js';
import { dispatchCampaign } from './dispatch-campaign.js';

const MAX_CAMPAIGN_BODY_BYTES = 256 * 1024;

type RequestObservation = CampaignObservation
  | { stage: 'configuration_unavailable' | 'service_unavailable' }
  | { stage: 'request_rejected'; reason: 'too-large' | 'timeout' | 'aborted' | 'unreadable'
    | 'invalid-json' | 'invalid-body' | 'missing-content' | 'invalid-subject' | 'invalid-campaign-id' };

export async function handleSend(request: Request, env: NewsletterEnv): Promise<Response> {
  const requestId = crypto.randomUUID();
  const respond = (data: Record<string, unknown>, status: number): Response => json(data, status, requestId);
  if (!env.ADMIN_SECRET) return respond({ error: 'ADMIN_SECRET not configured' }, 501);
  if (!timingSafeCompare(request.headers.get('authorization') ?? '', `Bearer ${env.ADMIN_SECRET}`)) {
    return respond({ error: 'Unauthorized' }, 401);
  }
  const observe = (event: RequestObservation): void => {
    console.log('[newsletter:campaign]', { requestId, ...event });
  };
  if (!env.RESEND_API_KEY) {
    observe({ stage: 'configuration_unavailable' });
    return respond({ error: 'Campaign sending is temporarily unavailable.' }, 503);
  }
  const bytes = await readRequestBytes(request, { maxBytes: MAX_CAMPAIGN_BODY_BYTES });
  if (!bytes.ok) {
    observe({ stage: 'request_rejected', reason: bytes.reason });
    return respond({ error: 'Invalid, oversized or incomplete campaign request.' }, bytes.status);
  }
  let payload: unknown;
  try { payload = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes.bytes)); }
  catch {
    observe({ stage: 'request_rejected', reason: 'invalid-json' });
    return respond({ error: 'Invalid JSON campaign request.' }, 400);
  }
  const parsed = parseCampaignCommand(payload, generateToken());
  if (!parsed.ok) {
    observe({ stage: 'request_rejected', reason: parsed.reason });
    return respond({ error: parsed.reason === 'missing-content'
      ? 'subject, html, and text are required'
      : parsed.reason === 'invalid-subject'
        ? 'subject must be one line of at most 200 characters'
        : 'Invalid campaign request or campaign_id.' }, 400);
  }
  const command = parsed.command;
  try {
    const result = await dispatchCampaign(command, requestId, await campaignPayloadHash(command), RESEND_BATCH_LIMIT, {
      async loadAudience() {
        return (await getActiveSubscribers(env.DB)).map(subscriber => ({
          subscriberId: subscriber.id, email: subscriber.email, unsubscribeToken: subscriber.unsubscribe_token,
        }));
      },
      admit: input => admitCampaign(env.DB, input),
      async deliver(recipients, key) {
        const results = await sendNewsletterBatch(env.RESEND_API_KEY,
          recipients.map(recipient => ({ email: recipient.email, unsubscribeToken: recipient.unsubscribeToken })),
          command.subject, command.html, command.text, key);
        return results.map((result): CampaignReceipt => {
          if (result.outcome === 'accepted' && result.resend_id) return { outcome: 'accepted', providerId: result.resend_id };
          return { outcome: result.outcome === 'failed' ? 'failed' : 'unknown', providerId: null };
        });
      },
      async recordDeliveries(recipients, receipts) {
        const logs: DeliveryLog[] = [];
        for (let index = 0; index < receipts.length; index++) {
          const receipt = receipts[index];
          const recipient = recipients[index];
          if (!receipt || !recipient) throw new Error('Campaign receipt does not match its audience');
          // The older recipient log schema has no unknown state. Preserve that
          // uncertainty in the campaign aggregate instead of inventing failure.
          if (receipt.outcome === 'unknown') continue;
          logs.push({ id: generateToken(), campaign_id: command.campaignId,
            sub_id: recipient.subscriberId, email: recipient.email,
            status: receipt.outcome === 'accepted' ? 'sent' : 'failed',
            resend_id: receipt.providerId, error: receipt.outcome === 'failed' ? 'provider_rejected' : null,
            sent_at: new Date().toISOString() });
        }
        await insertDeliveryLogs(env.DB, logs);
      },
      complete: (input, counts, reason) => completeCampaign(env.DB, input, counts, reason),
      observe,
    });
    if (result.kind === 'unavailable') return respond({ error: 'Campaign admission is unavailable. Inspect its record before retrying.', campaign_id: command.campaignId }, 503);
    if (result.kind === 'duplicate') {
      return respond({ error: result.reason === 'conflict'
        ? 'Campaign ID is already assigned to different content.'
        : 'Campaign already admitted or recorded. Inspect its receipt before starting another campaign.',
      campaign_id: command.campaignId }, 409);
    }
    const counts = result.counts;
    return respond({ campaign_id: command.campaignId,
      // Retained API label: sent means accepted by the provider, not delivered.
      sent: counts.accepted, failed: counts.failed, unknown: counts.unknown,
      not_attempted: counts.notAttempted, total: counts.total,
      receipt_confirmed: result.receiptConfirmed,
      ...(result.kind === 'interrupted' && { error: 'Campaign outcome is incomplete. Inspect its receipt before starting another campaign.' }),
    }, result.kind === 'completed' ? 200 : 503);
  } catch {
    observe({ stage: 'service_unavailable' });
    return respond({ error: 'Campaign sending is unavailable. Inspect its record before retrying.', campaign_id: command.campaignId }, 503);
  }
}

function json(data: Record<string, unknown>, status: number, requestId: string): Response {
  return new Response(JSON.stringify(data), { status, headers: {
    'content-type': 'application/json', 'cache-control': 'no-store',
    'x-content-type-options': 'nosniff', 'x-request-id': requestId,
  } });
}

function timingSafeCompare(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let index = 0; index < aBytes.length; index++) diff |= aBytes[index]! ^ bBytes[index]!;
  return diff === 0;
}
