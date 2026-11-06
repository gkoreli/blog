/** Svix transport authentication; bytes are never normalized before HMAC. */
const MAX_AGE_SECONDS = 300;

interface SigningContext {
  id: string;
  timestamp: string;
  signatures: string[];
  key: CryptoKey;
}

export type PreparedWebhookSignature = { ok: true; context: SigningContext }
  | { ok: false; reason: 'headers' | 'timestamp' | 'configuration' };

export async function prepareWebhookSignature(request: Request, secret: string): Promise<PreparedWebhookSignature> {
  const id = request.headers.get('svix-id');
  const timestamp = request.headers.get('svix-timestamp');
  const signature = request.headers.get('svix-signature');
  if (!id || !timestamp || !signature) return { ok: false, reason: 'headers' };
  if (!timestampFresh(timestamp)) return { ok: false, reason: 'timestamp' };
  try {
    const bytes = Uint8Array.from(atob(secret.startsWith('whsec_') ? secret.slice(6) : secret), c => c.charCodeAt(0));
    if (bytes.byteLength === 0) return { ok: false, reason: 'configuration' };
    const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return { ok: true, context: { id, timestamp, signatures: signature.split(' '), key } };
  } catch { return { ok: false, reason: 'configuration' }; }
}

export async function verifyWebhookSignature(
  context: SigningContext, body: Uint8Array,
): Promise<{ ok: true } | { ok: false; reason: 'timestamp' | 'signature' }> {
  // Waiting for body bytes must not extend the signed request's freshness window.
  if (!timestampFresh(context.timestamp)) return { ok: false, reason: 'timestamp' };
  const prefix = new TextEncoder().encode(`${context.id}.${context.timestamp}.`);
  const signed = new Uint8Array(prefix.byteLength + body.byteLength);
  signed.set(prefix);
  signed.set(body, prefix.byteLength);
  const digest = await crypto.subtle.sign('HMAC', context.key, signed);
  const expected = `v1,${btoa(String.fromCharCode(...new Uint8Array(digest)))}`;
  return context.signatures.some(candidate => timingSafeEqual(candidate, expected))
    ? { ok: true } : { ok: false, reason: 'signature' };
}

function timestampFresh(timestamp: string): boolean {
  if (!/^\d+$/.test(timestamp)) return false;
  const value = Number(timestamp);
  return Number.isSafeInteger(value) && Math.abs(Date.now() / 1000 - value) <= MAX_AGE_SECONDS;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
