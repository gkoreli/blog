/** Closed provider facts only: never retain secrets, challenge tokens or response bodies. */
const PROVIDER_CODES = ['missing-input-secret', 'invalid-input-secret', 'missing-input-response',
  'invalid-input-response', 'bad-request', 'timeout-or-duplicate', 'internal-error'] as const;
type ProviderCode = typeof PROVIDER_CODES[number];
interface VerificationDiagnostics {
  httpStatus: number | null;
  errorCodes: ProviderCode[];
  attempts: number;
  elapsedMs: number;
  retryReason: 'none' | 'http' | 'internal-error' | 'invalid-response' | 'network' | 'timeout';
}

/** Verification does not establish control of an email address or human identity. */
export type TurnstileVerification = VerificationDiagnostics & (
  | { ok: true }
  | { ok: false; kind: 'rejected' | 'unavailable'; reason: string }
);

export async function verifyTurnstile(
  token: string, secret: string, ip: string, hostname: string,
): Promise<TurnstileVerification> {
  const started = performance.now();
  const diagnostics: VerificationDiagnostics = { httpStatus: null, errorCodes: [], attempts: 0, elapsedMs: 0, retryReason: 'none' };
  const failed = (reason: string, kind: 'rejected' | 'unavailable' = 'unavailable'): TurnstileVerification => ({
    ...diagnostics, elapsedMs: Math.max(0, Math.floor(performance.now() - started)), ok: false, kind, reason,
  });
  if (!secret) return failed('missing_secret');
  if (!token || token.length > 2048) return failed('invalid_token', 'rejected');
  // One retry shares Cloudflare's idempotency key, including ambiguous network loss.
  const body = JSON.stringify({ secret, response: token, remoteip: ip, idempotency_key: crypto.randomUUID() });
  for (let attempt = 1; attempt <= 2; attempt++) {
    diagnostics.attempts = attempt;
    diagnostics.httpStatus = null;
    diagnostics.errorCodes = [];
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body,
        signal: AbortSignal.timeout(5_000),
      });
      diagnostics.httpStatus = res.status;
      let data: unknown;
      try { data = await res.json(); } catch {
        if (attempt < 2 && (res.ok || res.status >= 500)) {
          diagnostics.retryReason = res.ok ? 'invalid-response' : 'http';
          continue;
        }
        return failed(res.ok ? 'invalid_verifier_response' : 'verifier_http_error');
      }
      if (typeof data !== 'object' || data === null || !('success' in data) || typeof data.success !== 'boolean') {
        if (attempt < 2) { diagnostics.retryReason = 'invalid-response'; continue; }
        return failed('invalid_verifier_response');
      }
      const rawCodes: unknown[] = 'error-codes' in data && Array.isArray(data['error-codes']) ? data['error-codes'] : [];
      diagnostics.errorCodes = PROVIDER_CODES.filter(code => rawCodes.includes(code));
      if (diagnostics.errorCodes.includes('missing-input-secret') || diagnostics.errorCodes.includes('invalid-input-secret')) return failed('invalid_secret');
      if (!res.ok || diagnostics.errorCodes.includes('internal-error')) {
        if (attempt < 2 && (res.status >= 500 || diagnostics.errorCodes.includes('internal-error'))) {
          diagnostics.retryReason = res.status >= 500 ? 'http' : 'internal-error';
          continue;
        }
        return failed(res.ok ? 'verifier_internal_error' : 'verifier_http_error');
      }
      if (diagnostics.errorCodes.includes('bad-request')) return failed('verifier_bad_request');
      if (!data.success) return failed(diagnostics.errorCodes.includes('timeout-or-duplicate') ? 'timeout_or_duplicate' : 'invalid_token', 'rejected');
      if (!('hostname' in data) || data.hostname !== hostname) return failed('hostname_mismatch', 'rejected');
      // Keep cached clients without action compatible; reject another action.
      if ('action' in data && data.action !== '' && data.action !== 'subscribe') return failed('action_mismatch', 'rejected');
      return { ...diagnostics, elapsedMs: Math.max(0, Math.floor(performance.now() - started)), ok: true };
    } catch (error) {
      const timeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
      if (attempt < 2) { diagnostics.retryReason = timeout ? 'timeout' : 'network'; continue; }
      return failed(timeout
        ? 'verifier_timeout' : 'verifier_network_error');
    }
  }
  return failed('verifier_unavailable');
}
