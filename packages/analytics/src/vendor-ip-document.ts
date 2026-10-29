import type { VendorIpSource } from './vendor-ip-sources.js';

export const VENDOR_IP_MAX_PREFIXES = 4096;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Fixed Amazon documentation formats only. The shared CIDR parser still
 * validates every normalized entry; one malformed entry rejects the feed.
 */
export function normalizeAmazonIpDocument(value: unknown, format: 'amazon-hosts-html' | 'amazon-prefixes-html'): unknown {
  if (!record(value) || !Array.isArray(value.prefixes) || value.prefixes.length === 0 || value.prefixes.length > VENDOR_IP_MAX_PREFIXES) return null;
  const prefixes: Array<{ ipv4Prefix: string } | { ipv6Prefix: string }> = [];
  for (const entry of value.prefixes) {
    const key = format === 'amazon-hosts-html' ? 'ipv4Prefix' : 'ip_prefix';
    if (!record(entry) || Object.keys(entry).length !== 1 || typeof entry[key] !== 'string') return null;
    const raw = entry[key];
    if (format === 'amazon-hosts-html') {
      if (raw.includes('/')) return null;
      prefixes.push({ ipv4Prefix: `${raw}/32` });
    } else {
      if (!raw.includes('/')) return null;
      prefixes.push(raw.includes(':') ? { ipv6Prefix: raw } : { ipv4Prefix: raw });
    }
  }
  // The publisher advertises UTC with +00:00. Keep its precision while using
  // the equivalent Z form accepted by the shared publisher-version parser.
  const creationTime = typeof value.creationTime === 'string' ? value.creationTime.replace(/\+00:00$/, 'Z') : value.creationTime;
  return { creationTime, prefixes };
}

/** Input is already bounded by the collector's 262,144-byte transport limit.
 * HTMLRewriter parses markup without loading scripts or page subresources.
 * Require one complete pre/code block; never scrape IP-looking page text.
 */
export async function decodeVendorIpDocument(source: VendorIpSource, bytes: Uint8Array): Promise<unknown> {
  try {
    let text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes);
    if (!('format' in source)) return JSON.parse(text);
    let blocks = 0;
    let closed = 0;
    let extracted = '';
    const rewritten = new HTMLRewriter().on('pre > code', {
      element(element) { blocks++; element.onEndTag(() => { closed++; }); },
      text(chunk) { extracted += chunk.text; },
    }).transform(new Response(text, { headers: { 'Content-Type': 'text/html' } }));
    await rewritten.arrayBuffer();
    if (blocks !== 1 || closed !== 1) return null;
    text = extracted;
    return normalizeAmazonIpDocument(JSON.parse(text), source.format);
  } catch { return null; }
}
