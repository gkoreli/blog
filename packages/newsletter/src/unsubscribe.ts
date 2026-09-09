import type { NewsletterEnv } from './db.js';
import { unsubscribeByToken } from './db.js';
import { htmlPage } from './responses.js';

/** Existing opt-out tokens remain stable. GET previews; POST changes state. */
export async function handleUnsubscribe(request: Request, env: NewsletterEnv, rawToken: string): Promise<Response> {
  const url = new URL(request.url);
  const block = url.searchParams.get('confirmations') === 'off';
  const browserResult = url.searchParams.get('view') === '1';
  if (!/^[a-f0-9]{64}$/.test(rawToken)) return htmlPage('Link unavailable', '<h1>Link unavailable.</h1><p>This unsubscribe link is invalid.</p>', '/', 400);
  if (request.method === 'GET') {
    const action = `/api/unsubscribe/${rawToken}?view=1${block ? '&amp;confirmations=off' : ''}`;
    return htmlPage(block ? 'Block confirmation requests' : 'Unsubscribe',
      `<h1>${block ? 'Block confirmation requests?' : 'Unsubscribe?'}</h1>
       <p>${block ? 'This will stop this subscription and block further confirmation requests for up to 90 days. An email already being sent may still arrive.' : 'Stop receiving emails from this blog.'}</p>
       <form method="post" action="${action}"><button type="submit">${block ? 'Block requests' : 'Unsubscribe'}</button></form>`);
  }
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'GET, POST' } });
  try {
    const changed = await unsubscribeByToken(env.DB, rawToken, block);
    // RFC 8058 mailbox-provider POSTs get a plain response; browser forms opt into HTML.
    if (!browserResult) return new Response(null, { status: 200, headers: { 'cache-control': 'no-store' } });
    if (!changed) return htmlPage('Link unavailable', '<h1>Link unavailable.</h1><p>This unsubscribe link is no longer available.</p>', '/', 400);
    return htmlPage('Unsubscribed', block
      ? '<h1>Requests blocked.</h1><p>You are unsubscribed and further confirmation requests are blocked for up to 90 days. An email already being sent may still arrive.</p>'
      : '<h1>Unsubscribed.</h1><p>You will no longer receive newsletter emails.</p>');
  } catch {
    console.error('[newsletter:unsubscribe] service_unavailable');
    return htmlPage('Please try again', '<h1>Please try again.</h1><p>We could not save your opt-out. Keep this link and try again later.</p>', '/', 503);
  }
}
