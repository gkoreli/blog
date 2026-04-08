/**
 * unsubscribe.ts — GET + POST /api/unsubscribe/:rawToken
 *
 * Two methods for the same action:
 *
 * GET  — manual click from email footer link (browser redirect)
 *         Returns an HTML confirmation page.
 *
 * POST — RFC 8058 one-click unsubscribe, triggered by Gmail's "Unsubscribe" button.
 *         Requires List-Unsubscribe + List-Unsubscribe-Post headers in outbound emails.
 *         Gmail sends: POST /api/unsubscribe/{token}
 *                      Content-Type: application/x-www-form-urlencoded
 *                      Body: List-Unsubscribe=One-Click
 *         Returns: 200 OK (no body) — Gmail expects a plain success response.
 *
 * Token model: unsubscribe tokens are stored RAW (not hashed) in D1.
 *   Confirm tokens are hashed because they grant account activation (higher stakes).
 *   Unsubscribe tokens grant opt-out only — low stakes — and must be included verbatim
 *   in every newsletter footer URL. Direct DB lookup; no re-hashing needed.
 *
 * Tokens NEVER expire. Old archived emails must still work.
 * Expiring unsubscribe links creates CAN-SPAM / GDPR compliance risk.
 * See ADR-0010 §Token Security for the full rationale.
 */

import type { NewsletterEnv } from './db.js';
import { unsubscribeByToken } from './db.js';
import { htmlPage } from './responses.js';

export async function handleUnsubscribe(
  request: Request,
  env: NewsletterEnv,
  rawToken: string,
): Promise<Response> {
  if (!rawToken) return htmlPage('Error', notFoundBody());

  const isOneClick = request.method === 'POST';

  const changed = await unsubscribeByToken(env.DB, rawToken);

  if (isOneClick) {
    // RFC 8058: Gmail expects a plain 200, not HTML
    return new Response(null, { status: 200 });
  }

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
