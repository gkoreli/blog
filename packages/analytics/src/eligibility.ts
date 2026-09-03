import type { Representation } from './contracts.js';

function isPrefetch(request: Request): boolean {
  for (const header of ['Purpose', 'Sec-Purpose', 'Sec-Fetch-Purpose']) {
    const value = request.headers.get(header);
    if (value !== null && /prefetch|prerender/i.test(value)) return true;
  }
  return false;
}

export function isEligiblePageResponse(
  request: Request,
  response: Response,
  representation: Representation,
): boolean {
  if (request.method !== 'GET' || !response.ok) return false;

  const path = new URL(request.url).pathname;
  if (path === '/stats' || path.startsWith('/stats/') || path === '/api' || path.startsWith('/api/')) {
    return false;
  }
  if (isPrefetch(request)) return false;

  const contentType = response.headers.get('Content-Type');
  if (contentType === null) return false;
  if (representation === 'html') return /^text\/html(?:\s*;|$)/i.test(contentType);

  return !path.endsWith('.md') && /^text\/markdown(?:\s*;|$)/i.test(contentType);
}
