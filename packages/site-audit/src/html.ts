import type { PageEvidence } from './contracts.js';

export function emptyPage(parseState: PageEvidence['parseState'] = 'unavailable'): PageEvidence {
  return { title: null, description: null, canonical: null, language: null, textCharacters: 0, headings: 0, links: 0, scriptElements: 0,
    metaRobots: [], structuredDataTypes: [], structuredDataBlocks: 0, invalidStructuredDataBlocks: 0, alternateLinks: [], parseState };
}
function decode(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d{1,7}|#x[0-9a-f]{1,6});/gi, entity => {
    const named: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' };
    const match = named[entity.toLowerCase()];
    if (match !== undefined) return match;
    const code = entity.toLowerCase().startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
    return Number.isInteger(code) && code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '\uFFFD';
  });
}
function attributes(tag: string): Map<string, string> {
  const result = new Map<string, string>();
  const content = tag.replace(/^<\/?[^\s>]+/, '').replace(/\/?\s*>$/, '');
  for (const match of content.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    const name = match[1]?.toLowerCase();
    if (name && !result.has(name)) result.set(name, decode(match[2] ?? match[3] ?? match[4] ?? ''));
  }
  return result;
}
function bounded(value: string | undefined, max = 500): string | null { return value === undefined ? null : value.trim().slice(0, max); }
function resolveLink(value: string | undefined, base: URL): string | null {
  if (!value || value.length > 2048) return null;
  try { const url = new URL(value, base); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
function types(value: unknown, output: Set<string>, depth = 0): void {
  if (depth > 6 || output.size >= 32) return;
  if (Array.isArray(value)) { for (const item of value.slice(0, 64)) types(item, output, depth + 1); return; }
  if (typeof value !== 'object' || value === null) return;
  for (const [key, item] of Object.entries(value)) {
    if (key === '@type') {
      for (const name of Array.isArray(item) ? item : [item]) if (typeof name === 'string' && name.length <= 200 && output.size < 32) output.add(name);
    } else if (key === '@graph') types(item, output, depth + 1);
  }
}

/** Bounded source-level HTML inspection. This does not run JavaScript, apply
 * CSS, inspect accessibility, or establish what any provider extracts. */
export function inspectHtml(source: string, base: URL): PageEvidence {
  const page = emptyPage('parsed');
  const lower = source.toLowerCase();
  const dataTypes = new Set<string>();
  let cursor = 0;
  let text = '';
  let inTitle = false;
  let title = '';
  let inHead = false;
  while (cursor < source.length) {
    const opening = source.indexOf('<', cursor);
    const until = opening === -1 ? source.length : opening;
    const chunk = source.slice(cursor, until);
    if (inTitle) title += chunk;
    if (!inHead) text += `${chunk} `;
    if (opening === -1) break;
    if (source.startsWith('<!--', opening)) {
      const end = source.indexOf('-->', opening + 4); cursor = end === -1 ? source.length : end + 3; continue;
    }
    let end = opening + 1;
    let quote: string | null = null;
    while (end < source.length) {
      const char = source[end];
      if (quote !== null) { if (char === quote) quote = null; }
      else if (char === '"' || char === "'") quote = char;
      else if (char === '>') break;
      end++;
    }
    if (end >= source.length) break;
    const tag = source.slice(opening, end + 1);
    const name = /^<\s*(\/?)\s*([a-z][a-z0-9-]*)/i.exec(tag);
    cursor = end + 1;
    if (!name) continue;
    const closing = name[1] === '/';
    const kind = name[2]?.toLowerCase();
    if (kind === 'head') { inHead = !closing; continue; }
    if (kind === 'title') { inTitle = !closing; continue; }
    if (closing) continue;
    const attrs = attributes(tag);
    if (kind === 'html') page.language = bounded(attrs.get('lang'), 64);
    if (kind === 'meta') {
      const agent = (attrs.get('name') ?? '').toLowerCase();
      if (agent === 'description' && page.description === null) page.description = bounded(attrs.get('content'));
      if ((agent === 'robots' || /bot$|-user$/.test(agent)) && page.metaRobots.length < 32) {
        const value = bounded(attrs.get('content'));
        if (value !== null) page.metaRobots.push({ agent: agent.slice(0, 100), value });
      }
    }
    if (kind === 'link') {
      const rel = (attrs.get('rel') ?? '').toLowerCase().split(/\s+/);
      const href = resolveLink(attrs.get('href'), base);
      if (rel.includes('canonical') && page.canonical === null) page.canonical = href;
      if (rel.includes('alternate') && href && page.alternateLinks.length < 32) page.alternateLinks.push({ type: (attrs.get('type') ?? '').slice(0, 100), href });
    }
    if (kind === 'a' && attrs.has('href')) page.links++;
    if (/^h[1-6]$/.test(kind ?? '')) page.headings++;
    if (kind === 'script' || kind === 'style' || kind === 'template' || kind === 'noscript' || kind === 'svg') {
      const endRaw = lower.indexOf(`</${kind}`, cursor);
      const raw = source.slice(cursor, endRaw === -1 ? source.length : endRaw);
      if (kind === 'script') {
        page.scriptElements++;
        if ((attrs.get('type') ?? '').toLowerCase().split(';')[0]?.trim() === 'application/ld+json') {
          page.structuredDataBlocks++;
          try { const value: unknown = JSON.parse(raw); types(value, dataTypes); } catch { page.invalidStructuredDataBlocks++; }
        }
      }
      cursor = endRaw === -1 ? source.length : endRaw;
    }
  }
  page.title = decode(title).replace(/\s+/g, ' ').trim().slice(0, 500) || null;
  page.textCharacters = decode(text).replace(/\s+/g, ' ').trim().length;
  page.structuredDataTypes = [...dataTypes].sort();
  return page;
}
