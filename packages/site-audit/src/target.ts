import ipaddr from 'ipaddr.js';

const targetMessages = {
  empty: 'Enter a public page, such as reddit.com or https://your-site.com/article.',
  'too-long': 'Use a shorter page URL. The limit is 2,048 characters, including URL encoding.',
  'invalid-characters': 'Remove spaces, line breaks or backslashes from the URL. Encode spaces in a page path as %20.',
  'invalid-url': 'Enter a public domain or a complete HTTPS URL, such as reddit.com or https://your-site.com/article.',
  protocol: 'Use an HTTPS page. You can enter a domain without https:// and we will add it.',
  credentials: 'Remove the username and password from the URL. Only public pages can be checked.',
  query: 'Remove the query string (the ? and everything after it) to check this page.',
  fragment: 'Remove the page fragment (the # and everything after it) to check this page.',
  port: 'Remove the custom port. This checker uses the standard HTTPS port.',
  'public-host': 'Use a public domain name, such as reddit.com. Local addresses and IP addresses are not supported.',
} as const;

export type TargetValidationReason = keyof typeof targetMessages;
export class TargetValidationError extends Error {
  constructor(readonly reason: TargetValidationReason = 'invalid-url') {
    super(targetMessages[reason]);
    this.name = 'TargetValidationError';
  }
}

const privateSuffixes = ['localhost', 'local', 'internal', 'test', 'invalid', 'example', 'onion', 'home.arpa', 'arpa'];
/** A hostname is not a network authorization; DNS addresses are checked separately. */
export function normalizeTarget(input: string): URL {
  if (!input.trim()) throw new TargetValidationError('empty');
  if (input.length > 2048) throw new TargetValidationError('too-long');
  if (input !== input.trim() || /[\u0000-\u0020\u007f\\]/.test(input)) throw new TargetValidationError('invalid-characters');
  // A bare host may include an explicit port. Other leading schemes must not be
  // hidden by adding https:// (for example, javascript: or mailto:).
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(input) && !/^[^/?#:]+:\d+(?:[/?#]|$)/.test(input);
  if (hasScheme && !/^https:/i.test(input)) throw new TargetValidationError('protocol');
  if (hasScheme && !/^https:\/\//i.test(input)) throw new TargetValidationError();
  let target: URL;
  try { target = new URL(hasScheme ? input : `https://${input}`); } catch { throw new TargetValidationError(); }
  if (target.protocol !== 'https:') throw new TargetValidationError('protocol');
  if (target.username || target.password) throw new TargetValidationError('credentials');
  if (target.port) throw new TargetValidationError('port');
  // URL.search/hash hide empty delimiters. Reject those too rather than silently
  // normalizing a submitted /? or /# into a different checked destination.
  const queryAt = input.indexOf('?'), fragmentAt = input.indexOf('#');
  if (queryAt !== -1 && (fragmentAt === -1 || queryAt < fragmentAt)) throw new TargetValidationError('query');
  if (fragmentAt !== -1) throw new TargetValidationError('fragment');
  const host = target.hostname.toLowerCase();
  if (host.endsWith('.') || host.length > 253 || !host.includes('.') || ipaddr.isValid(host.replace(/^\[|\]$/g, ''))
    || !host.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
    || privateSuffixes.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) throw new TargetValidationError('public-host');
  // Adding HTTPS, IDN conversion and percent-encoding can expand an input. The
  // canonical URL is submitted again by adapters and must pass this same bound.
  if (target.href.length > 2048) throw new TargetValidationError('too-long');
  return target;
}

export function isPublicAddress(address: string): boolean {
  try {
    const parsed = ipaddr.parse(address);
    if (parsed.kind() === 'ipv6' && parsed instanceof ipaddr.IPv6 && parsed.isIPv4MappedAddress()) return false;
    return parsed.range() === 'unicast';
  } catch { return false; }
}
