/** Campaign language and decisions, independent of HTTP, SQL and provider wire formats. */
export interface CampaignCommand {
  campaignId: string;
  subject: string;
  html: string;
  text: string;
}

export interface CampaignRecipient {
  subscriberId: string;
  email: string;
  unsubscribeToken: string;
}

export type CampaignReceipt =
  | { outcome: 'accepted'; providerId: string }
  // Failed means a definite provider rejection, not a measured mailbox failure.
  | { outcome: 'failed' | 'unknown'; providerId: null };

export interface CampaignReservation {
  campaignId: string;
  requestId: string;
  payloadHash: string;
  recipientCount: number;
}

export type CampaignAdmission =
  | { admitted: true }
  | { admitted: false; reason: 'duplicate' | 'conflict' | 'historical' };

export interface CampaignCounts {
  accepted: number;
  failed: number;
  unknown: number;
  notAttempted: number;
  total: number;
}

export type CampaignInterruption = 'delivery-unconfirmed' | 'delivery-log-unconfirmed';

export type CampaignObservation =
  | { stage: 'audience_unavailable' | 'admission_unavailable' | 'completion_write_unconfirmed' }
  | { stage: 'admission_rejected'; reason: 'duplicate' | 'conflict' | 'historical' }
  | { stage: 'reserved'; recipients: number }
  | { stage: 'batch_result'; batch: number; accepted: number; failed: number; unknown: number }
  | { stage: 'delivery_log_unconfirmed'; batch: number }
  | { stage: 'completed' | 'interrupted'; counts: CampaignCounts; reason: CampaignInterruption | null };

export function parseCampaignCommand(payload: unknown, generatedId: string):
  { ok: true; command: CampaignCommand } | { ok: false; reason: 'invalid-body' | 'missing-content' | 'invalid-subject' | 'invalid-campaign-id' } {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return { ok: false, reason: 'invalid-body' };
  if (!('subject' in payload) || !('html' in payload) || !('text' in payload)) return { ok: false, reason: 'missing-content' };
  const subject = typeof payload.subject === 'string' ? payload.subject.trim() : '';
  const html = typeof payload.html === 'string' ? payload.html.trim() : '';
  const text = typeof payload.text === 'string' ? payload.text.trim() : '';
  if (!subject || !html || !text) return { ok: false, reason: 'missing-content' };
  if (subject.length > 200 || /[\r\n]/.test(subject)) return { ok: false, reason: 'invalid-subject' };
  if ('campaign_id' in payload && typeof payload.campaign_id !== 'string') return { ok: false, reason: 'invalid-campaign-id' };
  const campaignId = 'campaign_id' in payload && typeof payload.campaign_id === 'string'
    ? payload.campaign_id.trim() || generatedId : generatedId;
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(campaignId)) return { ok: false, reason: 'invalid-campaign-id' };
  return { ok: true, command: { campaignId, subject, html, text } };
}

export async function campaignPayloadHash(command: CampaignCommand): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify({ subject: command.subject, html: command.html, text: command.text }));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
