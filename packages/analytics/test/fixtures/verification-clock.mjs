/** Date is a caller option, not an incoming HTTP field. Wrong JS runtime
 * shapes deliberately test admission beyond the TypeScript call contract.
 */
export function verificationClockCases(now) {
  const ms = now.getTime();
  return [
    { name: 'valid', now: new Date(ms) },
    { name: 'expired-signature', now: new Date(ms + 400000) },
    { name: 'future-signature', now: new Date(ms - 120000) },
    { name: 'invalid-date', now: new Date(NaN), unusable: true },
    { name: 'nan-clock', now: { getTime: () => NaN }, unusable: true },
    { name: 'infinite-clock', now: { getTime: () => Infinity }, unusable: true },
    { name: 'negative-infinite-clock', now: { getTime: () => -Infinity }, unusable: true },
    { name: 'string-clock', now: 'private-clock-canary', unusable: true },
    { name: 'throwing-clock', now: { getTime() { throw Error('private-clock-canary'); } }, unusable: true },
    { name: 'invalid-clock-expired-key', now: new Date(NaN), unusable: true, expiredKey: true },
    { name: 'valid-clock-expired-key', now: new Date(ms), expiredKey: true },
    { name: 'unsigned-invalid-clock', now: new Date(NaN), unusable: true, unsigned: true },
  ];
}
