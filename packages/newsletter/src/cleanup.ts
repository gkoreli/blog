/**
 * cleanup.ts — Cloudflare Workers Cron Trigger handler (nightly 03:00 UTC).
 *
 * Tasks:
 *   1. Purge expired pending subscriptions (never confirmed within 24 h).
 *      Prevents stale PII from accumulating. Confirm tokens expire per
 *      CONFIRM_TOKEN_TTL_HOURS; rows are deleted by this cron.
 *
 *   2. GDPR Art. 5(1)(e) — storage limitation: delete unsubscribed/bounced rows
 *      older than UNSUBSCRIBED_RETENTION_DAYS (90 days). After unsubscribing,
 *      the email address no longer serves any purpose — retaining it indefinitely
 *      violates the principle of data minimisation.
 *
 * See wrangler.jsonc triggers.crons for the schedule.
 */

import type { NewsletterEnv } from './db.js';
import { purgeExpiredPending, purgeOldInactive } from './db.js';

export async function handleScheduled(
  _event: ScheduledEvent,
  env: NewsletterEnv,
): Promise<void> {
  try {
    const [expired, old] = await Promise.all([
      purgeExpiredPending(env.DB),
      purgeOldInactive(env.DB),
    ]);
    console.log(`[newsletter:cron] Purged ${expired} expired pending, ${old} old inactive.`);
  } catch (err) {
    console.error('[newsletter:cron] Cleanup failed:', err);
  }
}
