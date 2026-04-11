/**
 * turnstile.ts — Cloudflare Turnstile server-side token verification.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

export interface TurnstileVerification {
  ok: boolean;
  reason?: string;
  errorCodes?: string[];
}

/**
 * Verify a Turnstile challenge token against the siteverify API.
 * Network errors fail open to avoid blocking legitimate signups when Cloudflare's
 * verifier is temporarily unavailable.
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string,
): Promise<TurnstileVerification> {
  // Local/dev builds may omit the secret entirely. Production must supply a token.
  if (!secret) return { ok: true, reason: 'skipped_no_secret' };
  if (!token) return { ok: false, reason: 'missing_token' };

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  body.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    if (!res.ok) return { ok: false, reason: `siteverify_http_${res.status}` };
    const data = await res.json() as TurnstileResponse;
    if (data.success === true) return { ok: true };
    return {
      ok: false,
      reason: 'siteverify_rejected',
      errorCodes: data['error-codes'] ?? [],
    };
  } catch {
    // Network error hitting Turnstile API — fail open to avoid blocking legit users
    console.warn('[newsletter] Turnstile verification failed with network error');
    return { ok: true, reason: 'siteverify_network_error' };
  }
}
