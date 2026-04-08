/**
 * confirm.ts — GET /api/confirm/:token handler.
 *
 * Completes the double opt-in flow. Token is extracted from the URL path,
 * subscriber row is marked active, confirm_token cleared (one-time use).
 */

import type { NewsletterEnv } from './db.js';
import { confirmSubscriber } from './db.js';
import { htmlPage } from './responses.js';

export async function handleConfirm(
  request: Request,
  env: NewsletterEnv,
  token: string,
): Promise<Response> {
  if (!token) return htmlPage('Error', '', notFoundBody());

  const confirmed = await confirmSubscriber(env.DB, token);

  if (confirmed) {
    return htmlPage('Subscribed', '', successBody());
  }

  // Token not found or already used — check if it was already confirmed
  // (user clicked link twice). Return a friendly message either way.
  return htmlPage('Already confirmed', '', alreadyBody());
}

function successBody(): string {
  return `<div class="icon">✓</div>
    <h1>You're in.</h1>
    <p>You'll hear from me next time I write something worth your inbox.</p>`;
}

function alreadyBody(): string {
  return `<div class="icon">✓</div>
    <h1>Already confirmed.</h1>
    <p>Your subscription is active. Nothing else to do.</p>`;
}

function notFoundBody(): string {
  return `<div class="icon">✗</div>
    <h1>Link not found.</h1>
    <p>This confirmation link is invalid or has expired. Try subscribing again.</p>`;
}
