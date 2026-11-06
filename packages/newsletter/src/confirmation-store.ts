import { CONFIRMATION_LIMITS } from './confirmation.js';
import type { ConfirmationAdmission, ConfirmationOutcome, ConfirmationReservation } from './confirmation.js';
export { CONFIRMATION_LIMITS } from './confirmation.js';

interface AdmissionRow {
  decision: unknown;
  unsubscribe_token: unknown;
}

export async function admitConfirmation(
  db: D1Database,
  input: ConfirmationReservation,
): Promise<ConfirmationAdmission> {
  const limits = CONFIRMATION_LIMITS;
  const email = input.email.value;
  const result = await db.batch<AdmissionRow>([
    db.prepare(`
      INSERT INTO confirmation_attempts (id, email, token_hash, reserved_at, expires_at)
      SELECT ?, ?, ?, unixepoch(), unixepoch() + ?
      WHERE NOT EXISTS (
        SELECT 1 FROM subscribers WHERE email = ?
          AND (status IN ('active', 'bounced') OR suppression_reason IS NOT NULL)
      )
      AND (? = 'subscribe' OR EXISTS (
        SELECT 1 FROM subscribers WHERE email = ? AND status = 'pending'
      ))
      AND NOT EXISTS (
        SELECT 1 FROM confirmation_attempts
        WHERE email = ? AND outcome != 'legacy' AND reserved_at > unixepoch() - ?
      )
      AND (SELECT COUNT(*) FROM confirmation_attempts
        WHERE email = ? AND outcome != 'legacy' AND reserved_at > unixepoch() - 86400) < ?
      AND (SELECT COUNT(*) FROM confirmation_attempts
        WHERE outcome != 'legacy' AND reserved_at > unixepoch() - 3600) < ?
      AND (SELECT COUNT(*) FROM confirmation_attempts
        WHERE outcome != 'legacy' AND reserved_at > unixepoch() - 86400) < ?
    `).bind(input.id, email, input.tokenHash, limits.tokenLifetime,
      email, input.mode, email, email, limits.addressCooldown,
      email, limits.addressPerDay, limits.globalPerHour, limits.globalPerDay),

    // Preserve a token issued by the previous deployment during schema rollout.
    // This statement runs only after admission and never extends that token's TTL.
    db.prepare(`
      INSERT INTO confirmation_attempts (id, email, token_hash, reserved_at, expires_at, outcome)
      SELECT 'legacy:' || confirm_token, email, confirm_token,
        unixepoch(confirm_token_expires_at) - 86400, unixepoch(confirm_token_expires_at), 'legacy'
      FROM subscribers
      WHERE email = ? AND status = 'pending' AND confirm_token IS NOT NULL
        AND unixepoch(confirm_token_expires_at) IS NOT NULL
        AND EXISTS (SELECT 1 FROM confirmation_attempts WHERE id = ?)
        AND NOT EXISTS (SELECT 1 FROM confirmation_attempts WHERE token_hash = subscribers.confirm_token)
    `).bind(email, input.id),

    db.prepare(`
      INSERT INTO subscribers
        (id, email, status, confirm_token, confirm_token_expires_at,
         unsubscribe_token, source, consent_ip, user_agent)
      SELECT ?, email, 'pending', token_hash, datetime(expires_at, 'unixepoch'), ?, ?, ?, ?
      FROM confirmation_attempts WHERE id = ?
      ON CONFLICT(email) DO UPDATE SET
        status = 'pending', confirm_token = excluded.confirm_token,
        confirm_token_expires_at = excluded.confirm_token_expires_at,
        consent_ip = excluded.consent_ip, user_agent = excluded.user_agent,
        confirmed_at = NULL
      WHERE subscribers.status IN ('pending', 'unsubscribed')
        AND subscribers.suppression_reason IS NULL
    `).bind(input.subscriberId, input.unsubscribeToken, input.source,
      input.consentIp, input.userAgent, input.id),

    db.prepare(`
      SELECT CASE
        WHEN EXISTS (SELECT 1 FROM confirmation_attempts WHERE id = ?) THEN 'admitted'
        WHEN (SELECT COUNT(*) FROM confirmation_attempts
          WHERE outcome != 'legacy' AND reserved_at > unixepoch() - 3600) >= ? THEN 'capacity'
        WHEN (SELECT COUNT(*) FROM confirmation_attempts
          WHERE outcome != 'legacy' AND reserved_at > unixepoch() - 86400) >= ? THEN 'capacity'
        ELSE 'unchanged' END AS decision,
        (SELECT unsubscribe_token FROM subscribers WHERE email = ?) AS unsubscribe_token
    `).bind(input.id, limits.globalPerHour, limits.globalPerDay, email),
  ]);
  const row = result[3]?.results[0];
  if (row?.decision === 'admitted' && typeof row.unsubscribe_token === 'string' && row.unsubscribe_token.length > 0) {
    return { decision: 'admitted', unsubscribeToken: row.unsubscribe_token };
  }
  if (row?.decision === 'capacity' || row?.decision === 'unchanged') return { decision: row.decision };
  throw new Error('Confirmation admission result missing');
}

export async function recordConfirmationOutcome(
  db: D1Database,
  id: string,
  outcome: ConfirmationOutcome,
  providerId: string | null,
  providerStatus: number | null,
): Promise<void> {
  const result = await db.prepare(`
    UPDATE confirmation_attempts SET outcome = ?, provider_id = ?, provider_status = ? WHERE id = ?
  `).bind(outcome, providerId, providerStatus, id).run();
  if (!result.success || result.meta.changes !== 1) throw new Error('Confirmation receipt write unconfirmed');
}

export async function purgeConfirmationAttempts(db: D1Database): Promise<number> {
  const result = await db.prepare(
    'DELETE FROM confirmation_attempts WHERE reserved_at < unixepoch() - ?',
  ).bind(CONFIRMATION_LIMITS.retention).run();
  return result.meta.changes;
}
