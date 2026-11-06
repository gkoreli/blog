import ipaddr from 'ipaddr.js';

export class TargetValidationError extends Error {
  constructor() { super('Enter a public HTTPS page URL without credentials, a query, a fragment or a custom port.'); this.name = 'TargetValidationError'; }
}

const privateSuffixes = ['localhost', 'local', 'internal', 'test', 'invalid', 'example', 'onion', 'home.arpa', 'arpa'];
/** A hostname is not a network authorization; DNS addresses are checked separately. */
export function normalizeTarget(input: string): URL {
  if (input.length > 2048 || input !== input.trim() || /[\u0000-\u0020\u007f\\]/.test(input)) throw new TargetValidationError();
  let target: URL;
  try { target = new URL(input.includes('://') ? input : `https://${input}`); } catch { throw new TargetValidationError(); }
  if (target.protocol !== 'https:' || target.username || target.password || target.port || target.search || target.hash) throw new TargetValidationError();
  const host = target.hostname.toLowerCase();
  if (host.endsWith('.') || host.length > 253 || !host.includes('.') || ipaddr.isValid(host.replace(/^\[|\]$/g, ''))
    || !host.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
    || privateSuffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) throw new TargetValidationError();
  return target;
}

export function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.parse(address);
    if (parsed.kind() === 'ipv6' && parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) return false;
    return parsed.range() === 'unicast';
  } catch { return false; }
}
