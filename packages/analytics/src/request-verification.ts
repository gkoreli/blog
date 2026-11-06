import { verifyWebBotAuth, type WebBotAuthResult } from './webbotauth.js';

export const SIGNATURE_DEADLINE_MS = 2000;

export async function verifyRequestSignature(request: Request, headersPresent: boolean, verifier?: (request: Request) => Promise<WebBotAuthResult>): Promise<WebBotAuthResult> {
  if (!headersPresent) return { status: 'absent' };
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<WebBotAuthResult>(resolve => {
    timer = setTimeout(() => {
      resolve({ status: 'unverified', reason: 'verification-timeout' });
      controller.abort();
    }, SIGNATURE_DEADLINE_MS);
  });
  const verification = Promise.resolve().then(() => verifier
    ? verifier(request)
    : verifyWebBotAuth(request, { includeEvidence: true, maxAgeSeconds: 86400, signal: controller.signal,
      fetcher: (input, init) => fetch(input, { ...init, signal: controller.signal }) }))
    .catch((): WebBotAuthResult => ({ status: 'unverified', reason: 'verification-error' }));
  try { return await Promise.race([verification, deadline]); }
  finally {
    if (timer !== undefined) clearTimeout(timer);
    controller.abort();
  }
}

