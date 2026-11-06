import { handleResendWebhook } from '../../../newsletter/src/webhook.ts';
import { handleConfirmationRequest } from '../../../newsletter/src/confirmation-request.ts';

const encoded = new TextEncoder();
const keyBytes = encoded.encode('synthetic native raw-body key');
const key = `whsec_${btoa(String.fromCharCode(...keyBytes))}`;
const ordinary = encoded.encode(JSON.stringify({ type: 'email.bounced', data: { to: ['native-boundary@example.invalid'] } }));

async function signedHeaders(body) {
  const id = 'synthetic-native-event';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const prefix = encoded.encode(`${id}.${timestamp}.`);
  const message = new Uint8Array(prefix.length + body.length);
  message.set(prefix); message.set(body, prefix.length);
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return { 'content-type': 'application/json', 'svix-id': id, 'svix-timestamp': timestamp,
    'svix-signature': `v1,${btoa(String.fromCharCode(...new Uint8Array(signature)))}` };
}

export default { async fetch(request, env) {
  const mode = new URL(request.url).pathname.slice(1);
  const after = new URL(request.url).searchParams.get('after') === '1';
  let body = ordinary;
  let signatureBody = ordinary;
  let pulls = 0; let cancels = 0;
  let secret = key;
  if (mode === 'unsigned-bom' || mode === 'signed-bom') {
    body = new Uint8Array(ordinary.length + 3);
    body.set([239, 187, 191]); body.set(ordinary, 3);
    if (mode === 'signed-bom') signatureBody = body;
  }
  if (mode === 'invalid-utf8') {
    const begin = encoded.encode('{"type":"email.bounced","data":{"to":["native-boundary@example.invalid"],"note":"');
    const end = encoded.encode('"}}');
    body = new Uint8Array(begin.length + 1 + end.length);
    body.set(begin); body[begin.length] = 128; body.set(end, begin.length + 1); signatureBody = body;
  }
  const headers = mode === 'missing-headers' ? { 'content-type': 'application/json' } : await signedHeaders(signatureBody);
  const abort = new AbortController();
  if (mode === 'aborted') abort.abort();
  if (['missing-headers', 'aborted', 'slow-confirmation'].includes(mode)) {
    body = new ReadableStream({ pull() { pulls++; }, cancel() { cancels++; } }, { highWaterMark: 0 });
  }
  if (mode === 'overflow' || mode === 'confirmation-overflow') {
    const size = mode === 'overflow' ? 65537 : 4097;
    body = new ReadableStream({
      pull(controller) { pulls++; controller.enqueue(new Uint8Array(size)); },
      cancel() { cancels++; return new Promise(() => {}); },
    }, { highWaterMark: 0 });
  }
  if (mode === 'bad-secret') secret = 'whsec_';
  const input = new Request('https://fixture.invalid/api/webhooks/resend', {
    method: 'POST', headers, body, signal: abort.signal,
  });
  const confirmation = mode === 'confirmation-overflow' || mode === 'slow-confirmation';
  const operation = confirmation
    ? handleConfirmationRequest(input, { ...env, RESEND_API_KEY: 'synthetic', TURNSTILE_SECRET_KEY: 'synthetic',
      SUBSCRIBE_RATE_LIMITER: { async limit() { return { success: true }; } } }, 'subscribe')
    : handleResendWebhook(input, { ...env, RESEND_WEBHOOK_SECRET: secret });
  let guard;
  let status; let exception = null;
  try {
    const response = await Promise.race([operation, new Promise(resolve => {
      guard = setTimeout(() => resolve(null), after && mode === 'slow-confirmation' ? 6000 : 200);
    })]);
    status = response?.status ?? 'pending';
  } catch (error) { status = 'exception'; exception = error instanceof Error ? error.name : 'unknown'; }
  finally { clearTimeout(guard); }
  const row = await env.DB.prepare('SELECT status FROM subscribers WHERE id = ?').bind('native-boundary').first();
  return Response.json({ mode, status, exception, pulls, cancels, subscriberStatus: row.status });
} };
