export type RequestBodyFailure = 'too-large' | 'timeout' | 'aborted' | 'unreadable';
export type RequestBodyResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; reason: RequestBodyFailure; status: 400 | 408 | 413 };

interface RequestBodyBudget {
  maxBytes: number;
  timeoutMs?: number;
}

function rejectBody(request: Request, reason: RequestBodyFailure, status: 400 | 408 | 413): RequestBodyResult {
  // An underlying source can leave cancellation pending. Rejection must not.
  if (request.body && !request.body.locked) void request.body.cancel().catch(() => {});
  return { ok: false, reason, status };
}

/** Bound actual bytes and elapsed reading; preserve bytes for signature adapters. */
export async function readRequestBytes(request: Request, budget: RequestBodyBudget): Promise<RequestBodyResult> {
  const timeoutMs = budget.timeoutMs ?? 5_000;
  if (!Number.isSafeInteger(budget.maxBytes) || budget.maxBytes <= 0
    || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('Request body budget must be positive integers');
  }
  if (request.signal.aborted) return rejectBody(request, 'aborted', 408);
  const declared = request.headers.get('content-length');
  if (declared !== null && /^\d+$/.test(declared) && Number(declared) > budget.maxBytes) {
    return rejectBody(request, 'too-large', 413);
  }
  if (request.body === null) return { ok: true, bytes: new Uint8Array() };

  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try { reader = request.body.getReader(); }
  catch { return { ok: false, reason: 'unreadable', status: 400 }; }
  let terminal: 'timeout' | 'aborted' | undefined;
  const stop = (reason: 'timeout' | 'aborted'): void => {
    terminal ??= reason;
    void reader.cancel().catch(() => {});
  };
  const onAbort = () => { stop('aborted'); };
  request.signal.addEventListener('abort', onAbort, { once: true });
  const timer = setTimeout(() => { stop('timeout'); }, timeoutMs);
  if (request.signal.aborted) stop('aborted');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (terminal) return { ok: false, reason: terminal, status: 408 };
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > budget.maxBytes) {
        void reader.cancel().catch(() => {});
        return { ok: false, reason: 'too-large', status: 413 };
      }
      chunks.push(chunk.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { ok: true, bytes };
  } catch {
    return terminal
      ? { ok: false, reason: terminal, status: 408 }
      : { ok: false, reason: 'unreadable', status: 400 };
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
}
