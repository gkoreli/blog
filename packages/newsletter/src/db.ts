/**
 * db.ts — D1 types and query helpers for newsletter subscribers.
 *
 * All queries go through this module. Callers receive typed results; SQL stays here.
 */

export interface NewsletterEnv {
  /** Shared D1 binding — same as analytics (blog-analytics database). */
  DB: D1Database;
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}

export interface Subscriber {
  id: string;
  email: string;
  status: 'pending' | 'active' | 'unsubscribed';
  confirm_token: string | null;
  unsubscribe_token: string;
  source: string | null;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
}

export async function findByEmail(db: D1Database, email: string): Promise<Subscriber | null> {
  return db
    .prepare('SELECT * FROM subscribers WHERE email = ?')
    .bind(email)
    .first<Subscriber>();
}

export async function findByConfirmToken(db: D1Database, token: string): Promise<Subscriber | null> {
  return db
    .prepare('SELECT * FROM subscribers WHERE confirm_token = ?')
    .bind(token)
    .first<Subscriber>();
}

export async function findByUnsubscribeToken(db: D1Database, token: string): Promise<Subscriber | null> {
  return db
    .prepare('SELECT * FROM subscribers WHERE unsubscribe_token = ?')
    .bind(token)
    .first<Subscriber>();
}

export async function insertSubscriber(
  db: D1Database,
  id: string,
  email: string,
  confirmToken: string,
  unsubscribeToken: string,
  source: string | null,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO subscribers (id, email, confirm_token, unsubscribe_token, source)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(id, email, confirmToken, unsubscribeToken, source)
    .run();
}

/** Refresh tokens for a pending subscriber (re-send confirmation). */
export async function refreshPendingTokens(
  db: D1Database,
  email: string,
  confirmToken: string,
  unsubscribeToken: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE subscribers
       SET confirm_token = ?, unsubscribe_token = ?, created_at = datetime('now')
       WHERE email = ? AND status = 'pending'`,
    )
    .bind(confirmToken, unsubscribeToken, email)
    .run();
}

/** Mark subscriber as active and clear the one-time confirm token. */
export async function confirmSubscriber(db: D1Database, token: string): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE subscribers
       SET status = 'active', confirmed_at = datetime('now'), confirm_token = NULL
       WHERE confirm_token = ? AND status = 'pending'`,
    )
    .bind(token)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function unsubscribeByToken(db: D1Database, token: string): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE subscribers
       SET status = 'unsubscribed', unsubscribed_at = datetime('now')
       WHERE unsubscribe_token = ? AND status != 'unsubscribed'`,
    )
    .bind(token)
    .run();
  return (result.meta.changes ?? 0) > 0;
}
