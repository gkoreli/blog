/** Same-origin only; never put the credential in the URL, body or persistent storage. */
export async function markOwner(credential: string, send: typeof fetch = fetch): Promise<string> {
  const response = await send('/api/owner', {
    method: 'POST',
    headers: { Authorization: `Bearer ${credential}` },
    cache: 'no-store', credentials: 'omit', redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 401) throw new Error('The owner credential was not accepted.');
  if (!response.ok) throw new Error('Owner marking could not be confirmed. Please try again.');
  const result: unknown = await response.json();
  if (typeof result !== 'object' || result === null || !('marked' in result) || result.marked !== true
    || !('utcDate' in result) || typeof result.utcDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(result.utcDate)) {
    throw new Error('Owner marking returned an unexpected response.');
  }
  return result.utcDate;
}
