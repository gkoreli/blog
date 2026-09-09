import type { NewsletterEnv } from './db.js';
import { confirmSubscriber, findByConfirmTokenHash } from './db.js';
import { hashToken } from './tokens.js';
import { htmlPage } from './responses.js';

/** GET is a preview so mail-scanner prefetch cannot activate a subscription. */
export async function handleConfirm(request: Request, env: NewsletterEnv, rawToken: string): Promise<Response> {
  if (!/^[a-f0-9]{64}$/.test(rawToken)) return invalidLink();
  const tokenHash = await hashToken(rawToken);
  try {
    const row = await findByConfirmTokenHash(env.DB, tokenHash);
    if (!row || row.suppression_reason || (row.status !== 'pending' && row.status !== 'active')) return invalidLink();
    if (row.status === 'active') {
      return htmlPage('Already confirmed', '<h1>Already confirmed.</h1><p>Your subscription is active.</p>');
    }
    if (!row.token_valid) return invalidLink();
    if (request.method === 'GET') {
      return htmlPage('Confirm subscription', `<h1>Confirm your subscription.</h1>
        <p>Receive an email when I publish something new.</p>
        <form method="post" action="/api/confirm/${rawToken}"><button type="submit">Confirm subscription</button></form>`);
    }
    if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'GET, POST' } });
    if (await confirmSubscriber(env.DB, tokenHash, row.email)) {
      return htmlPage('Subscribed', "<h1>You're in.</h1><p>You'll hear from me next time I write something worth your inbox.</p>");
    }
    return invalidLink();
  } catch {
    console.error('[newsletter:confirm] service_unavailable');
    return htmlPage('Please try again', '<h1>Please try again.</h1><p>We could not confirm your subscription. Keep this link and try again later.</p>', '/', 503);
  }
}

function invalidLink(): Response {
  return htmlPage('Link unavailable', '<h1>Link unavailable.</h1><p>This link is invalid, expired, or has been used. You can request a new confirmation from the blog.</p>', '/', 400);
}
