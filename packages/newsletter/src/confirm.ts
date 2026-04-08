/**
 * confirm.ts — GET /api/confirm/:rawToken
 *
 * Token flow (hash-before-storage pattern):
 *   Email URL:  /api/confirm/{rawToken}          ← 256-bit hex from generateToken()
 *   DB lookup:  WHERE confirm_token = SHA256(rawToken)
 *
 * Why: a D1 breach cannot yield usable confirm URLs because only hashes are stored.
 * The raw token is ephemeral — it exists only in the email and briefly in this request.
 *
 * Three distinct outcomes:
 *   1. success  (UPDATE changes > 0)         → "You're in."
 *   2. expired  (hash found, status=pending) → "Link expired — subscribe again."
 *   3. not found / already confirmed         → "Already confirmed."
 *
 * Distinguishing 2 from 3 requires a second DB read on the failure path only.
 * Happy path = single atomic UPDATE.
 */

import type { NewsletterEnv } from './db.js';
import { confirmSubscriber, findByConfirmTokenHash } from './db.js';
import { hashToken } from './tokens.js';
import { htmlPage } from './responses.js';

export async function handleConfirm(
  _request: Request,
  env: NewsletterEnv,
  rawToken: string,
): Promise<Response> {
  if (!rawToken) return htmlPage('Error', notFoundBody());

  const tokenHash = await hashToken(rawToken);

  // Atomic UPDATE: marks active, clears token, checks 24-hour expiry
  const confirmed = await confirmSubscriber(env.DB, tokenHash);
  if (confirmed) return htmlPage('Subscribed', successBody());

  // Failure path: hash still in DB with status=pending → expired
  const row = await findByConfirmTokenHash(env.DB, tokenHash);
  if (row?.status === 'pending') return htmlPage('Link expired', expiredBody());

  // Hash not found: already confirmed (token cleared) or invalid link
  return htmlPage('Already confirmed', alreadyBody());
}

function successBody(): string {
  return `<div class="icon">✓</div>
    <h1>You're in.</h1>
    <p>You'll hear from me next time I write something worth your inbox.</p>`;
}

function expiredBody(): string {
  return `<div class="icon">⏱</div>
    <h1>Link expired.</h1>
    <p>Confirmation links are valid for 24 hours. Subscribe again and a fresh link will be sent.</p>`;
}

function alreadyBody(): string {
  return `<div class="icon">✓</div>
    <h1>Already confirmed.</h1>
    <p>Your subscription is active — nothing else to do.</p>`;
}

function notFoundBody(): string {
  return `<div class="icon">✗</div>
    <h1>Link not found.</h1>
    <p>This confirmation link is invalid. Try subscribing again from the blog.</p>`;
}
