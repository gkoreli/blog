export type AcceptedResponseBody = { readonly confirmed: true } | {
  readonly confirmed: false;
  readonly reason: 'media-type' | 'empty' | 'too-large' | 'invalid' | 'unreadable' | 'aborted';
};

const MAX_RESPONSE_BYTES = 4096;

/** Confirm only the small public acceptance envelope; never retain arbitrary API text. */
export async function readAcceptedResponse(response: Response, signal: AbortSignal): Promise<AcceptedResponseBody> {
  if (signal.aborted) { discard(response); return { confirmed: false, reason: 'aborted' }; }
  if (response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    discard(response);
    return { confirmed: false, reason: 'media-type' };
  }
  const length = response.headers.get('content-length');
  if (length !== null && /^\d+$/.test(length) && Number(length) > MAX_RESPONSE_BYTES) {
    discard(response);
    return { confirmed: false, reason: 'too-large' };
  }
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try { reader = response.body?.getReader(); }
  catch { return { confirmed: false, reason: 'unreadable' }; }
  if (!reader) return { confirmed: false, reason: 'empty' };
  const bodyReader = reader;
  let abortRead: (() => void) | undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    abortRead = () => {
      void bodyReader.cancel().catch(() => undefined);
      reject(new Error('Subscription response read aborted'));
    };
    signal.addEventListener('abort', abortRead, { once: true });
  });
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const next = await Promise.race([bodyReader.read(), aborted]);
      if (signal.aborted) return { confirmed: false, reason: 'aborted' };
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        void bodyReader.cancel().catch(() => undefined);
        return { confirmed: false, reason: 'too-large' };
      }
      chunks.push(next.value);
    }
    if (size === 0) return { confirmed: false, reason: 'empty' };
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let value: unknown;
    try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { return { confirmed: false, reason: 'invalid' }; }
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      && 'ok' in value && value.ok === true && Object.keys(value).length === 1
      ? { confirmed: true } : { confirmed: false, reason: 'invalid' };
  } catch {
    return { confirmed: false, reason: signal.aborted ? 'aborted' : 'unreadable' };
  } finally {
    if (abortRead) signal.removeEventListener('abort', abortRead);
    try { bodyReader.releaseLock(); } catch { /* A cancelled reader may already be released. */ }
  }
}

export function discard(response: Response): void {
  try { void response.body?.cancel().catch(() => undefined); } catch { /* Best-effort release. */ }
}

/** Static application guidance; response bodies and arbitrary headers never become UI text. */
export function rejectedRequestMessage(status: number, retryAfter: string | null): string {
  if (status === 408) return 'The request could not be received in time. Please try again.';
  if (status === 429) {
    if (retryAfter === '3600') return 'Subscriptions are busy right now. Please try again in an hour.';
    if (retryAfter === '60') return 'Too many requests. Please wait a minute and try again.';
    return 'Too many requests. Please wait before trying again.';
  }
  if (status === 503) return retryAfter === '600'
    ? 'Subscriptions are temporarily unavailable. Check your inbox before retrying in ten minutes.'
    : 'Subscriptions are temporarily unavailable. Check your inbox before trying again in ten minutes.';
  if (status >= 500) return 'We could not confirm the request. Check your inbox before trying again in ten minutes.';
  if (status === 400) return 'We could not verify this request. Please try again.';
  return 'We could not complete the request. Please try again.';
}
