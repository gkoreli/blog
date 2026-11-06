import type { CampaignAdmission, CampaignCounts, CampaignInterruption, CampaignReservation } from './campaign.js';

/** A single unique insert is the durable ownership boundary before external effects. */
export async function admitCampaign(db: D1Database, input: CampaignReservation): Promise<CampaignAdmission> {
  const result = await db.prepare(`
    INSERT INTO newsletter_campaign_runs (campaign_id, request_id, payload_hash, recipient_count)
    SELECT ?, ?, ?, ?
    WHERE NOT EXISTS (SELECT 1 FROM delivery_logs WHERE campaign_id = ? LIMIT 1)
    ON CONFLICT(campaign_id) DO NOTHING
  `).bind(input.campaignId, input.requestId, input.payloadHash, input.recipientCount, input.campaignId).run();
  if (!result.success) throw new Error('Campaign admission unavailable');
  if (result.meta.changes === 1) return { admitted: true };
  if (result.meta.changes !== 0) throw new Error('Unexpected campaign admission result');
  const existing = await db.prepare(
    'SELECT payload_hash FROM newsletter_campaign_runs WHERE campaign_id = ?',
  ).bind(input.campaignId).first<{ payload_hash: string }>();
  if (existing) return { admitted: false, reason: existing.payload_hash === input.payloadHash ? 'duplicate' : 'conflict' };
  const historical = await db.prepare('SELECT 1 FROM delivery_logs WHERE campaign_id = ? LIMIT 1')
    .bind(input.campaignId).first();
  if (historical) return { admitted: false, reason: 'historical' };
  throw new Error('Campaign admission result missing');
}

export async function completeCampaign(
  db: D1Database, input: CampaignReservation, counts: CampaignCounts, reason: CampaignInterruption | null,
): Promise<void> {
  const result = await db.prepare(`
    UPDATE newsletter_campaign_runs
    SET state = ?, interruption_reason = ?, accepted_count = ?, failed_count = ?,
      unknown_count = ?, not_attempted_count = ?, completed_at = datetime('now')
    WHERE campaign_id = ? AND request_id = ? AND state = 'reserved'
  `).bind(reason ? 'interrupted' : 'completed', reason, counts.accepted, counts.failed,
    counts.unknown, counts.notAttempted, input.campaignId, input.requestId).run();
  if (!result.success || result.meta.changes !== 1) throw new Error('Campaign completion was not recorded');
}
