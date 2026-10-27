const DIRECTORY_PATH = '/.well-known/http-message-signatures-directory';
const LOCAL_SUFFIXES = ['localhost', 'local', 'internal', 'home.arpa'];

export type DirectoryLocation =
  | { agent: string; directoryUrl: string }
  | { reason: 'invalid-signature-agent' | 'discovery-policy-rejected' };

/**
 * Local URL-admission policy, not a DNS/egress safety guarantee. A permitted
 * DNS name may still resolve to an internal address or change its resolution.
 * Reject all IP literals, including public ones: directory discovery here is
 * limited to DNS origins on HTTPS's default port. WHATWG URL normalizes IPv4
 * integer/hex/octal spellings before the literal check.
 */
export function directoryLocation(uri: string): DirectoryLocation {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      return { reason: 'invalid-signature-agent' };
    }
    const hostname = url.hostname.replace(/\.$/, '');
    const labels = hostname.split('.');
    const literal = hostname.startsWith('[') || /^\d+\.\d+\.\d+\.\d+$/.test(hostname);
    const local = LOCAL_SUFFIXES.some(suffix => hostname === suffix || hostname.endsWith('.' + suffix));
    const dnsName = hostname.length <= 253 && labels.length >= 2 && labels.every(label => (
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
    ));
    if (url.port || literal || local || !dnsName) return { reason: 'discovery-policy-rejected' };
    return { agent: url.origin, directoryUrl: url.origin + DIRECTORY_PATH };
  } catch {
    return { reason: 'invalid-signature-agent' };
  }
}
