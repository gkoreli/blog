/** Cloudflare verifies requests; it does not establish control of an email address. */
export type TurnstileVerification =
  | { ok: true }
  | { ok: false; kind: 'rejected' | 'unavailable'; reason: string };

export async function verifyTurnstile(
  token: string, secret: string, ip: string, hostname: string,
): Promise<TurnstileVerification> {
  if (!secret) return { ok: false, kind: 'unavailable', reason: 'missing_secret' };
  if (!token || token.length > 2048) return { ok: false, kind: 'rejected', reason: 'invalid_token' };
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5_000),
    });
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null || !('success' in data)
      || typeof data.success !== 'boolean') {
      return { ok: false, kind: 'unavailable', reason: 'invalid_verifier_response' };
    }
    const codes = 'error-codes' in data && Array.isArray(data['error-codes']) ? data['error-codes'] : [];
    if (codes.includes('missing-input-secret') || codes.includes('invalid-input-secret')) {
      return { ok: false, kind: 'unavailable', reason: 'invalid_secret' };
    }
    if (!res.ok || codes.includes('internal-error')) {
      return { ok: false, kind: 'unavailable', reason: 'verifier_unavailable' };
    }
    if (!data.success) return { ok: false, kind: 'rejected', reason: 'invalid_token' };
    if (!('hostname' in data) || data.hostname !== hostname) {
      return { ok: false, kind: 'rejected', reason: 'hostname_mismatch' };
    }
    // Existing cached clients did not set an action. A different action is rejected.
    if ('action' in data && data.action !== '' && data.action !== 'subscribe') {
      return { ok: false, kind: 'rejected', reason: 'action_mismatch' };
    }
    return { ok: true };
  } catch {
    return { ok: false, kind: 'unavailable', reason: 'verifier_unavailable' };
  }
}
