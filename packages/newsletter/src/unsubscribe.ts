/**
 * unsubscribe.ts — GET /api/unsubscribe/:token handler.
 *
 * One-click unsubscribe — legally required (CAN-SPAM / GDPR).
 * Token is permanent per subscriber and included in every newsletter footer.
 */

import type { NewsletterEnv } from './db.js';
import { unsubscribeByToken } from './db.js';
import { htmlPage } from './responses.js';

export async function handleUnsubscribe(
  request: Request,
  env: NewsletterEnv,
  token: string,
): Promise<Response> {
  if (!token) return htmlPage('Error', '', notFoundBody());

  const changed = await unsubscribeByToken(env.DB, token);

  return changed
    ? htmlPage('Unsubscribed', '', successBody())
    : htmlPage('Unsubscribed', '', alreadyBody());
}

function successBody(): string {
  return `<div class="icon">👋</div>
    <h1>You're unsubscribed.</h1>
    <p>You won't receive any more emails from me. No hard feelings.</p>`;
}

function alreadyBody(): string {
  return `<div class="icon">✓</div>
    <h1>Already unsubscribed.</h1>
    <p>You're not receiving emails from me. Nothing to do.</p>`;
}

function notFoundBody(): string {
  return `<div class="icon">✗</div>
    <h1>Link not found.</h1>
    <p>This unsubscribe link is invalid. Reply to any email from me and I'll remove you manually.</p>`;
}
