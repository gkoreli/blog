/**
 * turnstile.ts — Cloudflare Turnstile server-side token verification.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

/**
 * Verify a Turnstile challenge token against the siteverify API.
 * Returns true if the token is valid, false on failure or network error.
 */
export async function verifyTurnstile(
  token: string,
  secret: string,
  ip: string,
): Promise<boolean> {
  // Empty token in dev (no site key configured) — skip verification
  if (!token || !secret) return true;

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  body.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    if (!res.ok) return false;
    const data = await res.json() as TurnstileResponse;
    return data.success === true;
  } catch {
    // Network error hitting Turnstile API — fail open to avoid blocking legit users
    console.warn('[newsletter] Turnstile verification failed with network error');
    return true;
  }
}
