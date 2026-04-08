/**
 * db.ts — D1 types and query helpers for newsletter subscribers.
 *
 * All queries use parameterised bindings — no string interpolation into SQL.
 * Token values stored here are SHA-256 hashes; raw tokens live only in email URLs.
 * See tokens.ts for generateToken() / hashToken() / truncateIp().
 */

export interface NewsletterEnv {
  /** Shared D1 binding — same as analytics (blog-analytics database). */
  DB: D1Database;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  /** Native Workers Rate Limiting binding (free tier). Optional — skipped in local dev. */
  SUBSCRIBE_RATE_LIMITER?: RateLimit;
  /** Svix signing secret from Resend dashboard (for webhook verification). */
  RESEND_WEBHOOK_SECRET?: string;
}

export type SubscriberStatus = 'pending' | 'active' | 'unsubscribed' | 'bounced';

export interface Subscriber {
  id: string;
  email: string;
  status: SubscriberStatus;
  /** SHA-256 hash of the raw confirm token. NULL after confirmation. */
  confirm_token: string | null;
  /** ISO datetime; NULL after confirmation. */
  confirm_token_expires_at: string | null;
  /** SHA-256 hash of the permanent unsubscribe token. */
  unsubscribe_token: string;
  source: string | null;
  /** Truncated IP for GDPR consent proof, e.g. "1.2.3.x". */
  consent_ip: string | null;
  created_at: string; // = consent timestamp
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

/** Confirm-token lifetime: 24 hours — industry standard for double opt-in. */
export const CONFIRM_TOKEN_TTL_HOURS = 24;

/** GDPR data-minimisation: delete unsubscribed/bounced rows after this many days. */
export const UNSUBSCRIBED_RETENTION_DAYS = 90;

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function findByEmail(db: D1Database, email: string): Promise<Subscriber | null> {
  return db.prepare('SELECT * FROM subscribers WHERE email = ?').bind(email).first<Subscriber>();
}

/**
 * Look up a subscriber by their hashed confirm token, regardless of expiry.
 * Used to distinguish "token expired" from "token not found / already confirmed".
 * Parameter: SHA-256 hash of the raw token (not the raw token itself).
 */
export async function findByConfirmTokenHash(
  db: D1Database,
  tokenHash: string,
): Promise<Subscriber | null> {
  return db
    .prepare('SELECT * FROM subscribers WHERE confirm_token = ?')
    .bind(tokenHash)
    .first<Subscriber>();
}

// ── Writes ────────────────────────────────────────────────────────────────────

export async function insertSubscriber(
  db: D1Database,
  id: string,
  email: string,
  confirmTokenHash: string,
  unsubscribeTokenHash: string,
  source: string | null,
  consentIp: string | null,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO subscribers
         (id, email, confirm_token, confirm_token_expires_at, unsubscribe_token, source, consent_ip)
       VALUES
         (?, ?, ?, datetime('now', '+${CONFIRM_TOKEN_TTL_HOURS} hours'), ?, ?, ?)`,
    )
    .bind(id, email, confirmTokenHash, unsubscribeTokenHash, source, consentIp)
    .run();
}

/**
 * Refresh tokens for a pending subscriber re-submitting the form.
 * Resets the 24-hour expiry window and updates the consent IP.
 */
export async function refreshPendingTokens(
  db: D1Database,
  email: string,
  confirmTokenHash: string,
  unsubscribeTokenHash: string,
  consentIp: string | null,
): Promise<void> {
  await db
    .prepare(
      `UPDATE subscribers
       SET confirm_token            = ?,
           confirm_token_expires_at = datetime('now', '+${CONFIRM_TOKEN_TTL_HOURS} hours'),
           unsubscribe_token        = ?,
           consent_ip               = ?,
           created_at               = datetime('now')
       WHERE email = ? AND status = 'pending'`,
    )
    .bind(confirmTokenHash, unsubscribeTokenHash, consentIp, email)
    .run();
}

/**
 * Atomically mark subscriber active and clear the one-time confirm token.
 * WHERE clause enforces: token match + pending status + within 24-hour window.
 * Parameter: SHA-256 hash of the raw token from the URL.
 * Returns true if a row was updated (successful first confirmation).
 */
export async function confirmSubscriber(db: D1Database, tokenHash: string): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE subscribers
       SET status                   = 'active',
           confirmed_at             = datetime('now'),
           confirm_token            = NULL,
           confirm_token_expires_at = NULL
       WHERE confirm_token            = ?
         AND status                   = 'pending'
         AND confirm_token_expires_at > datetime('now')`,
    )
    .bind(tokenHash)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

/**
 * Unsubscribe via the permanent unsubscribe token.
 * Parameter: SHA-256 hash of the raw token from the email footer URL.
 */
export async function unsubscribeByTokenHash(
  db: D1Database,
  tokenHash: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE subscribers
       SET status          = 'unsubscribed',
           unsubscribed_at = datetime('now')
       WHERE unsubscribe_token = ? AND status NOT IN ('unsubscribed', 'bounced')`,
    )
    .bind(tokenHash)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

/** Hard bounce: address is undeliverable. Called from Resend webhook. */
export async function markBounced(db: D1Database, email: string): Promise<void> {
  await db
    .prepare(`UPDATE subscribers SET status = 'bounced' WHERE email = ? AND status = 'active'`)
    .bind(email)
    .run();
}

/**
 * Spam complaint: CAN-SPAM mandates immediate unsubscribe.
 * Called from Resend webhook on email.complained event.
 */
export async function markComplained(db: D1Database, email: string): Promise<void> {
  await db
    .prepare(
      `UPDATE subscribers
       SET status = 'unsubscribed', unsubscribed_at = datetime('now')
       WHERE email = ? AND status NOT IN ('unsubscribed', 'bounced')`,
    )
    .bind(email)
    .run();
}

// ── Maintenance (cron) ────────────────────────────────────────────────────────

/** Delete pending subscribers whose confirm token has expired. Returns rows deleted. */
export async function purgeExpiredPending(db: D1Database): Promise<number> {
  const result = await db
    .prepare(
      `DELETE FROM subscribers
       WHERE status = 'pending' AND confirm_token_expires_at < datetime('now')`,
    )
    .run();
  return result.meta.changes ?? 0;
}

/**
 * GDPR Art. 5(1)(e) — data minimisation: delete rows where personal data
 * (email) is no longer needed. Applies to unsubscribed + bounced rows older
 * than UNSUBSCRIBED_RETENTION_DAYS. Returns rows deleted.
 */
export async function purgeOldInactive(db: D1Database): Promise<number> {
  const result = await db
    .prepare(
      `DELETE FROM subscribers
       WHERE status IN ('unsubscribed', 'bounced')
         AND unsubscribed_at < datetime('now', '-${UNSUBSCRIBED_RETENTION_DAYS} days')`,
    )
    .run();
  return result.meta.changes ?? 0;
}
