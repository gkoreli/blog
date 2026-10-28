/** Bounded conditional-validation policy for one public feed per fixed URL.
 * This is deliberately narrower than a general HTTP cache implementation.
 */
export function feedEntityTag(response: Response): string | null {
  const value = response.headers.get('ETag');
  return value !== null && value.length <= 512 && /^(?:W\/)?"[\x21\x23-\x7e]*"$/.test(value) ? value : null;
}

/** Use canonical IMF-fixdate validators; other forms cause a full GET instead. */
export function feedLastModified(response: Response): string | null {
  const value = response.headers.get('Last-Modified');
  if (value === null || value.length !== 29) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toUTCString() === value ? value : null;
}

export function matchingFeedValidation(
  response: Response,
  conditional: Headers,
  stored: { etag: string | null; modified: string | null },
): boolean {
  if (!conditional.has('If-None-Match') && !conditional.has('If-Modified-Since')) return false;
  if (response.headers.has('ETag')) {
    const returned = feedEntityTag(response);
    if (returned === null || stored.etag === null || !conditional.has('If-None-Match')) return false;
    // A newly strong tag cannot upgrade a weak stored validator into byte equality.
    if (!returned.startsWith('W/')) return stored.etag === returned;
    const opaque = stored.etag.startsWith('W/') ? stored.etag.slice(2) : stored.etag;
    return opaque === returned.slice(2);
  }
  const returned = feedLastModified(response);
  return returned !== null && stored.modified === returned && conditional.has('If-Modified-Since');
}
