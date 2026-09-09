/** Shared, transactional admission for every public confirmation-email send. */
export const CONFIRMATION_LIMITS = {
  addressCooldown: 10 * 60,
  addressPerDay: 3,
  globalPerHour: 25,
  globalPerDay: 100,
  tokenLifetime: 24 * 60 * 60,
  retention: 7 * 24 * 60 * 60,
} as const;

interface ConfirmationInput {
  id: string;
  email: string;
  tokenHash: string;
  subscriberId: string;
  unsubscribeToken: string;
  source: string | null;
  consentIp: string | null;
  userAgent: string | null;
  mode: 'subscribe' | 'resend';
}

interface AdmissionRow {
  decision: 'admitted' | 'capacity' | 'unchanged';
  unsubscribe_token: string | null;
}

export async function admitConfirmation(
  db: D1Database,
  input: ConfirmationInput,
): Promise<AdmissionRow> {
  const limits = CONFIRMATION_LIMITS;
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
    `).bind(input.id, input.email, input.tokenHash, limits.tokenLifetime,
      input.email, input.mode, input.email, input.email, limits.addressCooldown,
      input.email, limits.addressPerDay, limits.globalPerHour, limits.globalPerDay),

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
    `).bind(input.email, input.id),

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
    `).bind(input.id, limits.globalPerHour, limits.globalPerDay, input.email),
  ]);
  const row = result[3]?.results[0];
  if (!row || (row.decision === 'admitted' && !row.unsubscribe_token)) {
    throw new Error('Confirmation admission result missing');
  }
  return row;
}

export async function recordConfirmationOutcome(
  db: D1Database,
  id: string,
  outcome: 'accepted' | 'failed' | 'unknown',
  providerId: string | null,
  providerStatus: number | null,
): Promise<void> {
  await db.prepare(`
    UPDATE confirmation_attempts SET outcome = ?, provider_id = ?, provider_status = ? WHERE id = ?
  `).bind(outcome, providerId, providerStatus, id).run();
}

export async function purgeConfirmationAttempts(db: D1Database): Promise<number> {
  const result = await db.prepare(
    'DELETE FROM confirmation_attempts WHERE reserved_at < unixepoch() - ?',
  ).bind(CONFIRMATION_LIMITS.retention).run();
  return result.meta.changes;
}
