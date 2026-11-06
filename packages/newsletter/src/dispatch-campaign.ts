import type {
  CampaignAdmission, CampaignCommand, CampaignCounts, CampaignInterruption,
  CampaignObservation, CampaignReceipt, CampaignRecipient, CampaignReservation,
} from './campaign.js';

export interface CampaignPorts {
  loadAudience(): Promise<readonly CampaignRecipient[]>;
  admit(input: CampaignReservation): Promise<CampaignAdmission>;
  deliver(recipients: readonly CampaignRecipient[], key: string): Promise<readonly CampaignReceipt[]>;
  recordDeliveries(recipients: readonly CampaignRecipient[], receipts: readonly CampaignReceipt[]): Promise<void>;
  complete(input: CampaignReservation, counts: CampaignCounts, reason: CampaignInterruption | null): Promise<void>;
  observe(event: CampaignObservation): void;
}

export type CampaignDispatch =
  | { kind: 'unavailable' }
  | { kind: 'duplicate'; reason: 'duplicate' | 'conflict' | 'historical' }
  | { kind: 'completed' | 'interrupted'; counts: CampaignCounts; receiptConfirmed: boolean };

/** One admitted application execution; interruption never authorizes an automatic replay. */
export async function dispatchCampaign(
  command: CampaignCommand, requestId: string, payloadHash: string, batchSize: number, ports: CampaignPorts,
): Promise<CampaignDispatch> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) throw new Error('Campaign batch size out of bounds');
  let audience: readonly CampaignRecipient[];
  try { audience = await ports.loadAudience(); }
  catch { ports.observe({ stage: 'audience_unavailable' }); return { kind: 'unavailable' }; }
  const reservation = { campaignId: command.campaignId, requestId, payloadHash, recipientCount: audience.length };
  let admission: CampaignAdmission;
  try { admission = await ports.admit(reservation); }
  catch { ports.observe({ stage: 'admission_unavailable' }); return { kind: 'unavailable' }; }
  if (!admission.admitted) {
    ports.observe({ stage: 'admission_rejected', reason: admission.reason });
    return { kind: 'duplicate', reason: admission.reason };
  }
  ports.observe({ stage: 'reserved', recipients: audience.length });
  const counts: CampaignCounts = { accepted: 0, failed: 0, unknown: 0, notAttempted: audience.length, total: audience.length };
  let interruption: CampaignInterruption | null = null;
  for (let at = 0; at < audience.length; at += batchSize) {
    const recipients = audience.slice(at, at + batchSize);
    let receipts: readonly CampaignReceipt[];
    try { receipts = await ports.deliver(recipients, `newsletter-campaign/${requestId}/${at / batchSize}`); }
    catch { receipts = recipients.map(() => ({ outcome: 'unknown', providerId: null })); }
    if (receipts.length !== recipients.length) receipts = recipients.map(() => ({ outcome: 'unknown', providerId: null }));
    const batchCounts = { accepted: 0, failed: 0, unknown: 0 };
    for (const receipt of receipts) {
      if (receipt.outcome === 'accepted') batchCounts.accepted++;
      else if (receipt.outcome === 'failed') batchCounts.failed++;
      else batchCounts.unknown++;
    }
    counts.accepted += batchCounts.accepted;
    counts.failed += batchCounts.failed;
    counts.unknown += batchCounts.unknown;
    counts.notAttempted -= recipients.length;
    ports.observe({ stage: 'batch_result', batch: at / batchSize, ...batchCounts });
    try { await ports.recordDeliveries(recipients, receipts); }
    catch {
      ports.observe({ stage: 'delivery_log_unconfirmed', batch: at / batchSize });
      interruption = 'delivery-log-unconfirmed';
      break;
    }
    if (batchCounts.unknown > 0) { interruption = 'delivery-unconfirmed'; break; }
  }
  let receiptConfirmed = true;
  try { await ports.complete(reservation, counts, interruption); }
  catch { ports.observe({ stage: 'completion_write_unconfirmed' }); receiptConfirmed = false; }
  const kind = interruption || !receiptConfirmed ? 'interrupted' : 'completed';
  ports.observe({ stage: kind, counts, reason: interruption });
  return { kind, counts, receiptConfirmed };
}
