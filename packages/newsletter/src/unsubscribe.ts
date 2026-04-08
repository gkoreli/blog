/**
 * unsubscribe.ts — GET /api/unsubscribe/:rawToken
 *
 * One-click unsubscribe — required by CAN-SPAM (honor within 10 business days)
 * and GDPR (right to withdraw consent at any time, Art. 7(3)).
 *
 * Token flow: same hash-before-storage pattern as confirm.ts.
 *   Email footer URL: /api/unsubscribe/{rawToken}
 *   DB lookup:        WHERE unsubscribe_token = SHA256(rawToken)
 *
 * Unsubscribe tokens NEVER expire. Old archived emails must still work.
 * Expiring unsubscribe links creates CAN-SPAM / GDPR compliance risk.
 * See ADR-0010 §Token Security for the full rationale.
 */

import type { NewsletterEnv } from './db.js';
import { unsubscribeByTokenHash } from './db.js';
import { hashToken } from './tokens.js';
import { htmlPage } from './responses.js';

export async function handleUnsubscribe(
  _request: Request,
  env: NewsletterEnv,
  rawToken: string,
): Promise<Response> {
  if (!rawToken) return htmlPage('Error', notFoundBody());

  const tokenHash = await hashToken(rawToken);
  const changed = await unsubscribeByTokenHash(env.DB, tokenHash);

  return changed
    ? htmlPage('Unsubscribed', successBody())
    : htmlPage('Unsubscribed', alreadyBody());
}

function successBody(): string {
  return `<div class="icon">👋</div>
    <h1>You're unsubscribed.</h1>
    <p>You won't receive any more emails from me. No hard feelings.</p>`;
}

function alreadyBody(): string {
  return `<div class="icon">✓</div>
    <h1>Already unsubscribed.</h1>
    <p>You're not on the list. Nothing to do.</p>`;
}

function notFoundBody(): string {
  return `<div class="icon">✗</div>
    <h1>Link not found.</h1>
    <p>This unsubscribe link is invalid. Reply to any email from me and I'll remove you manually.</p>`;
}
