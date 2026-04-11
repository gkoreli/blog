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

function stringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string') ? value : [];
}

function parseTurnstileResponse(raw: unknown): TurnstileResponse {
  if (typeof raw !== 'object' || raw === null || !('success' in raw)) {
    return { success: false, 'error-codes': ['bad-response'] };
  }

  const codes = 'error-codes' in raw ? raw['error-codes'] : [];
  return {
    success: raw.success === true,
    'error-codes': stringArray(codes),
  };
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
  if (token.length > 2048) return { ok: false, reason: 'token_too_long' };

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const data = parseTurnstileResponse(await res.json().catch(() => null));
    if (data.success === true) return { ok: true };
    return {
      ok: false,
      reason: res.ok ? 'siteverify_rejected' : `siteverify_http_${res.status}`,
      errorCodes: data['error-codes'] ?? [],
    };
  } catch {
    // Network error hitting Turnstile API — fail open to avoid blocking legit users
    console.warn('[newsletter] Turnstile verification failed with network error');
    return { ok: true, reason: 'siteverify_network_error' };
  }
}
