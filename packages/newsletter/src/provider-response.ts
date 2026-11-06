/** Closed transport facts; provider bodies never escape a bounded JSON reader. */
export type ProviderResponseFailure = 'timeout' | 'too-large' | 'unreadable' | 'invalid';
export type ProviderResponse = { ok: true; value: unknown }
  | { ok: false; reason: ProviderResponseFailure };

/** One budget starts before fetch and is shared with response consumption. */
export function providerAttempt(timeoutMs: number): { signal: AbortSignal; deadline: number } {
  return { signal: AbortSignal.timeout(timeoutMs), deadline: performance.now() + timeoutMs };
}

export async function readProviderJson(
  response: Response,
  budget: { signal: AbortSignal; deadline: number; maxBytes: number },
): Promise<ProviderResponse> {
  if (!response.body) return { ok: false, reason: 'invalid' };
  const declared = response.headers.get('content-length');
  if (declared !== null && /^\d+$/.test(declared) && Number(declared) > budget.maxBytes) {
    void response.body.cancel().catch(() => {});
    return { ok: false, reason: 'too-large' };
  }
  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try { reader = response.body.getReader(); }
  catch { return { ok: false, reason: 'unreadable' }; }
  let timedOut = false;
  const stop = (): void => {
    timedOut = true;
    void reader.cancel().catch(() => {});
  };
  budget.signal.addEventListener('abort', stop, { once: true });
  // This independent timer also bounds synthetic/custom response streams that do
  // not inherit fetch's signal. Headers do not start a second full timeout.
  const timer = setTimeout(stop, Math.max(0, budget.deadline - performance.now()));
  if (budget.signal.aborted || performance.now() >= budget.deadline) stop();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (timedOut || performance.now() >= budget.deadline) {
        stop();
        return { ok: false, reason: 'timeout' };
      }
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > budget.maxBytes) {
        void reader.cancel().catch(() => {});
        return { ok: false, reason: 'too-large' };
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let value: unknown;
    try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes)); }
    catch { return { ok: false, reason: 'invalid' }; }
    return performance.now() >= budget.deadline
      ? { ok: false, reason: 'timeout' } : { ok: true, value };
  } catch {
    return { ok: false, reason: timedOut ? 'timeout' : 'unreadable' };
  } finally {
    clearTimeout(timer);
    budget.signal.removeEventListener('abort', stop);
    reader.releaseLock();
  }
}

/** Structural ID validation, without pretending to validate provider existence. */
export function validProviderId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128
    && value.trim() === value && !/[\u0000-\u001f\u007f]/.test(value);
}
