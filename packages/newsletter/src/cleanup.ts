/**
 * cleanup.ts — Cloudflare Workers Cron Trigger handler (nightly 03:00 UTC).
 *
 * Tasks:
 *   1. Purge expired pending subscriptions (never confirmed within 24 h).
 *      Prevents stale PII from accumulating. Confirm tokens expire per
 *      CONFIRM_TOKEN_TTL_HOURS; rows are deleted by this cron.
 *
 *   2. Apply the blog's 90-day inactive-row retention policy. This also removes
 *      suppression state; it is not a permanent block list.
 *   3. Delete confirmation admission records older than seven days.
 *
 * See wrangler.jsonc triggers.crons for the schedule.
 */

import type { NewsletterEnv } from './db.js';
import { purgeExpiredPending, purgeOldInactive } from './db.js';
import { purgeConfirmationAttempts } from './confirmation-store.js';

export async function handleScheduled(
  _controller: ScheduledController,
  env: NewsletterEnv,
): Promise<void> {
  try {
    const [expired, old, attempts] = await Promise.all([
      purgeExpiredPending(env.DB),
      purgeOldInactive(env.DB),
      purgeConfirmationAttempts(env.DB),
    ]);
    console.log(`[newsletter:cron] Purged ${expired} expired pending, ${old} old inactive, ${attempts} old confirmation attempts.`);
  } catch {
    console.error('[newsletter:cron] Cleanup failed');
  }
}
