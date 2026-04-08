/**
 * tokens.ts — Cryptographic primitives for newsletter token security.
 *
 * Design decisions captured in ADR-0010 §Token Security:
 *
 * 1. generateToken() uses crypto.getRandomValues for 256-bit entropy.
 *    crypto.randomUUID() is only 122 bits (OWASP minimum is 128 bits).
 *    Password-reset-style confirm tokens warrant 256 bits.
 *
 * 2. hashToken() stores SHA-256(raw) in D1, raw token sent in email URLs.
 *    A D1 breach cannot yield usable confirm links — same principle as
 *    hashing password-reset tokens before persistence.
 *    SHA-256 is appropriate because the pre-image (raw token) is already
 *    high-entropy (256 bits) — a slow KDF like bcrypt is unnecessary.
 *
 * 3. truncateIp() masks the last octet (IPv4) / last 80 bits (IPv6).
 *    Storing a full IP is PII under GDPR. Truncated form gives geographic
 *    proof-of-consent without storing an individually identifiable address.
 *    Recommended by EU data protection authorities for web analytics/logging.
 */

/**
 * Generate a cryptographically secure 256-bit token, hex-encoded.
 * Returns a 64-character lowercase hex string.
 */
export function generateToken(): string {
  const bytes = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 hash of a raw token string. Returns a 64-character hex string.
 *
 * Store the hash in D1; send the raw token in the email URL.
 * On verify: re-derive hashToken(rawFromUrl), query WHERE token_hash = ?
 */
export async function hashToken(raw: string): Promise<string> {
  const encoded = new TextEncoder().encode(raw);
  const buf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Truncate an IP address for GDPR-compliant consent logging.
 *
 * IPv4 → mask last octet:      "1.2.3.4"           → "1.2.3.x"
 * IPv6 → keep first 48 bits:   "2001:db8:85a3::1"  → "2001:db8:85a3::x"
 * Unknown / local:                                  → "unknown"
 */
export function truncateIp(ip: string): string {
  const v4 = ip.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/);
  if (v4) return `${v4[1]}.x`;

  if (ip.includes(':')) {
    const expanded = expandIPv6(ip);
    if (expanded) {
      const groups = expanded.split(':');
      return groups.slice(0, 3).join(':') + '::x';
    }
  }

  return 'unknown';
}

function expandIPv6(ip: string): string | null {
  try {
    const halves = ip.split('::');
    if (halves.length > 2) return null;
    const left = halves[0] ? halves[0].split(':') : [];
    const right = halves[1] ? halves[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    if (missing < 0) return null;
    return [...left, ...Array<string>(missing).fill('0000'), ...right]
      .map(g => g.padStart(4, '0'))
      .join(':');
  } catch {
    return null;
  }
}
