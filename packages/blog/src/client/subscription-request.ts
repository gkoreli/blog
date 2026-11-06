const MAX_REQUEST_BYTES = 4096;

/** The public HTTP envelope has a 4096-byte intake budget, independent of string lengths. */
export function serializeSubscriptionRequest(email: string, token: string, source: string): string | undefined {
  const encoder = new TextEncoder();
  const withSource = JSON.stringify({ email, turnstile: token, source });
  if (encoder.encode(withSource).byteLength <= MAX_REQUEST_BYTES) return withSource;
  // Optional attribution must yield to the signup intent, including JSON escaping/UTF-8 costs.
  const withoutSource = JSON.stringify({ email, turnstile: token, source: '' });
  return encoder.encode(withoutSource).byteLength <= MAX_REQUEST_BYTES ? withoutSource : undefined;
}
