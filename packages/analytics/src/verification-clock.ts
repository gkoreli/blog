/** Read the caller's clock once. An unusable assessment time cannot support a
 * freshness or key-validity decision; never let NaN silently skip comparisons.
 */
export function verificationTime(now: Date | undefined): number | null {
  try {
    const value = (now ?? new Date()).getTime();
    const snapshot = Number.isFinite(value) ? new Date(value).getTime() : NaN;
    return Number.isFinite(snapshot) ? snapshot : null;
  } catch {
    return null;
  }
}
