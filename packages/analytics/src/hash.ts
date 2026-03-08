import { utcToday } from './dates.js';

/**
 * Daily-salted SHA-256 hash for cookieless unique visitor counting.
 * Pattern verified in: Plausible (SipHash + salt rotation), Umami (SHA-512 + monthly salt),
 * WP Statistics (SHA-256 + daily salt). See ADR-0004 for full analysis.
 *
 * - One-way hash: cannot recover IP or UA
 * - Daily rotation: cannot track across days
 * - Server-side only: nothing stored in browser
 */
export async function visitorHash(ip: string, ua: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}:${ua}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  const arr = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < 8; i++) hex += (arr[i] ?? 0).toString(16).padStart(2, '0');
  return hex;
}

/** Salt = YYYY-MM-DD in UTC. Rotates at midnight UTC automatically. */
export function dailySalt(): string {
  return utcToday();
}
