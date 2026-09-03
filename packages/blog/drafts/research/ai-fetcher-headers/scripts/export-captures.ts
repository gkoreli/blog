/**
 * Export the wrangler tail capture into committed data files.
 *
 * Input: the raw `wrangler tail --format json` stream (private, not committed)
 * plus the vendor IP-list JSON files fetched the same day.
 * Output (committed under ../data/):
 *   captures.jsonl   one record per probe request
 *   stray-probe-requests.jsonl probe-shaped URLs not assigned in the study (template URL, CSV-assembled URLs)
 *   side-requests.jsonl attributed non-probe requests: any request whose Referer is a probe URL
 *                    (subresources of a headless render), plus requests from a vendor-tokened
 *                    agent (ChatGPT-User, PerplexityBot, DuckAssistBot, GPTBot) inside
 *                    the capture windows, which the article uses as follow-up evidence
 *   captures.csv     the same, flattened
 *   asn-holders.json ASN -> registry holder (RIPEstat as-overview), fetched at export time
 *
 * Redaction rule: the client IP is kept only when it falls inside a
 * vendor-published IP list (it then identifies a vendor, not a person).
 * Requests from the site owner's own network (baselines, local tools) are kept
 * with owner_network=true and no address. Every other address is dropped and the ASN, its registry holder and the
 * Cloudflare country stand in for it. Cloudflare-added headers, TLS randoms and
 * exported authenticators are dropped; the TLS cipher/extension digests are kept
 * because they fingerprint a client stack, not a person.
 *
 * Run from a scratch folder holding tail-*.json and ip-*.json:
 *   npx tsx export-captures.ts <scratch-dir> <output-dir>
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [scratchDir, outDir] = process.argv.slice(2);
if (!scratchDir || !outDir) throw new Error('usage: tsx export-captures.ts <scratch-dir> <output-dir>');
mkdirSync(outDir, { recursive: true });

const DROP_HEADERS = new Set(['cf-connecting-ip', 'x-real-ip', 'cf-ray', 'cf-visitor', 'x-forwarded-proto', 'host', 'connection', 'cf-ipcountry']);
const OWNER_ASN = 62887;
// Probe names assigned to a specific assistant or baseline during the study. Any other
// probe-shaped URL (the article's literal <name> template, URLs assembled from the
// published CSV columns, unknown names) is a stray request and goes to its own file.
const ASSIGNED_PROBES = new Set(['hdr1', 'claudecode-webfetch', 'chatgpt', 'claude', 'gemini', 'grok', 'chrome-navigation', 'perplexity-path', 'duckai-path', 'copilot-path', 'mistral-path', 'grok-second-run', 'codex%2Dsearch', 'chatgpt-mobile', 'grok-mobile', 'grok-web-loggedin', 'perplexity-goga', 'copilot-goga', 'duckai-goga', 'deploy-check']);

interface TailEvent {
  eventTimestamp: number;
  event?: { request?: { url?: string; method?: string; headers?: Record<string, string>; cf?: Record<string, unknown> } };
}

function isTailEvent(value: unknown): value is TailEvent {
  return typeof value === 'object' && value !== null && 'eventTimestamp' in value;
}

function* readConcatenatedJson(text: string): Generator<unknown> {
  let index = 0;
  while (index < text.length) {
    while (index < text.length && /\s/.test(text[index] ?? '')) index += 1;
    if (index >= text.length) return;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = index;
    for (; end < text.length; end += 1) {
      const ch = text[end];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') inString = true;
      else if (ch === '{' || ch === '[') depth += 1;
      else if (ch === '}' || ch === ']') {
        depth -= 1;
        if (depth === 0) { end += 1; break; }
      }
    }
    yield JSON.parse(text.slice(index, end));
    index = end;
  }
}

function ipToBigInt(ip: string): { value: bigint; bits: number } | null {
  if (ip.includes('.') && !ip.includes(':')) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
    return { value: parts.reduce((acc, p) => (acc << 8n) + BigInt(p), 0n), bits: 32 };
  }
  const [head, tail] = ip.split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missing = 8 - headParts.length - tailParts.length;
  if (missing < 0 || (tail === undefined && headParts.length !== 8)) return null;
  const groups = [...headParts, ...Array<string>(tail === undefined ? 0 : missing).fill('0'), ...tailParts];
  if (groups.length !== 8) return null;
  return { value: groups.reduce((acc, g) => (acc << 16n) + BigInt(parseInt(g || '0', 16)), 0n), bits: 128 };
}

function inCidr(ip: string, cidr: string): boolean {
  const [net, lenText] = cidr.split('/');
  if (!net || !lenText) return false;
  const a = ipToBigInt(ip);
  const b = ipToBigInt(net);
  if (!a || !b || a.bits !== b.bits) return false;
  const len = Number(lenText);
  const shift = BigInt(a.bits - len);
  return a.value >> shift === b.value >> shift;
}

function collectPrefixes(value: unknown, out: string[]): void {
  if (Array.isArray(value)) { for (const v of value) collectPrefixes(v, out); return; }
  if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'ipv4Prefix' || k === 'ipv6Prefix') && typeof v === 'string') out.push(v);
      else collectPrefixes(v, out);
    }
  }
}

const vendorLists = new Map<string, string[]>();
for (const name of readdirSync(scratchDir).filter((n) => n.startsWith('ip-') && n.endsWith('.json'))) {
  const prefixes: string[] = [];
  collectPrefixes(JSON.parse(readFileSync(join(scratchDir, name), 'utf8')), prefixes);
  vendorLists.set(name.slice(3), prefixes);
}

const holders = new Map<number, string>();
async function holder(asn: number): Promise<string> {
  const cached = holders.get(asn);
  if (cached) return cached;
  const response = await fetch(`https://stat.ripe.net/data/as-overview/data.json?resource=AS${asn}`);
  const body: unknown = await response.json();
  let name = 'unknown';
  if (typeof body === 'object' && body !== null && 'data' in body) {
    const data = body.data;
    if (typeof data === 'object' && data !== null && 'holder' in data && typeof data.holder === 'string') name = data.holder;
  }
  holders.set(asn, name);
  return name;
}

interface Capture {
  observed_at: string;
  probe: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  asn: number | null;
  asn_registry_holder: string;
  cloudflare_as_organization: string | null;
  cloudflare_country: string | null;
  cloudflare_colo: string | null;
  http_protocol: string | null;
  tls_version: string | null;
  tls_client_hello_length: string | null;
  tls_ciphers_sha1: string | null;
  tls_extensions_sha1: string | null;
  client_ip_vendor_lists: string[];
  client_ip: string | null;
  owner_network: boolean;
}

function str(value: unknown): string | null { return typeof value === 'string' ? value : null; }

async function main(): Promise<void> {
  const rows: Capture[] = [];
  const sideRows: Capture[] = [];
  const strayRows: Capture[] = [];
  for (const file of readdirSync(scratchDir).filter((n) => n.startsWith('tail-') && n.endsWith('.json'))) {
    for (const value of readConcatenatedJson(readFileSync(join(scratchDir, file), 'utf8'))) {
      if (!isTailEvent(value)) continue;
      const request = value.event?.request;
      const url = request?.url ?? '';
      const isProbe = url.includes('probe=') || url.includes('/probe/');
      const referer = request?.headers?.referer ?? '';
      const ua = request?.headers?.['user-agent'] ?? '';
      const isSide = !isProbe && (referer.includes('probe') || /ChatGPT-User|PerplexityBot|DuckAssistBot|GPTBot/.test(ua));
      if (!isProbe && !isSide) continue;
      const headers = request?.headers ?? {};
      const cf = request?.cf ?? {};
      const asnValue = cf.asn;
      const asn = typeof asnValue === 'number' ? asnValue : null;
      const ip = headers['cf-connecting-ip'] ?? '';
      const lists = [...vendorLists.entries()].filter(([, prefixes]) => prefixes.some((p) => inCidr(ip, p))).map(([name]) => name);
      const kept: Record<string, string> = {};
      for (const key of Object.keys(headers).sort()) if (!DROP_HEADERS.has(key)) kept[key] = headers[key] ?? '';
      const probeName = isProbe ? (url.includes('probe=') ? url.split('probe=')[1] ?? '' : url.split('/probe/')[1] ?? '') : '';
      const target = !isProbe ? sideRows : ASSIGNED_PROBES.has(probeName) ? rows : strayRows;
      target.push({
        observed_at: new Date(value.eventTimestamp).toISOString(),
        probe: probeName,
        url,
        method: request?.method ?? 'GET',
        headers: kept,
        asn,
        asn_registry_holder: asn === null ? 'unknown' : await holder(asn),
        cloudflare_as_organization: str(cf.asOrganization),
        cloudflare_country: str(cf.country),
        cloudflare_colo: str(cf.colo),
        http_protocol: str(cf.httpProtocol),
        tls_version: str(cf.tlsVersion),
        tls_client_hello_length: str(cf.tlsClientHelloLength),
        tls_ciphers_sha1: str(cf.tlsClientCiphersSha1),
        tls_extensions_sha1: str(cf.tlsClientExtensionsSha1),
        client_ip_vendor_lists: lists,
        client_ip: lists.length ? ip : null,
        owner_network: asn === OWNER_ASN,
      });
    }
  }
  rows.sort((a, b) => a.observed_at.localeCompare(b.observed_at));
  sideRows.sort((a, b) => a.observed_at.localeCompare(b.observed_at));
  writeFileSync(join(outDir, 'captures.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(join(outDir, 'side-requests.jsonl'), sideRows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  strayRows.sort((a, b) => a.observed_at.localeCompare(b.observed_at));
  writeFileSync(join(outDir, 'stray-probe-requests.jsonl'), strayRows.map((r) => JSON.stringify(r)).join('\n') + '\n');

  const columns = ['observed_at', 'probe', 'url', 'asn', 'asn_registry_holder', 'cloudflare_as_organization', 'cloudflare_country', 'http_protocol', 'tls_version', 'user_agent', 'accept', 'accept_language', 'sec_fetch_mode', 'sec_fetch_dest', 'sec_fetch_site', 'sec_fetch_user', 'sec_ch_ua', 'signature_agent', 'client_ip_vendor_lists', 'client_ip', 'owner_network', 'header_names'];
  const csvCell = (v: unknown): string => {
    const text = v === null || v === undefined ? '' : Array.isArray(v) ? v.join(';') : String(v);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [columns.join(',')];
  for (const r of rows) {
    csv.push([
      r.observed_at, r.probe, r.url, r.asn, r.asn_registry_holder, r.cloudflare_as_organization, r.cloudflare_country, r.http_protocol, r.tls_version,
      r.headers['user-agent'], r.headers['accept'], r.headers['accept-language'], r.headers['sec-fetch-mode'], r.headers['sec-fetch-dest'], r.headers['sec-fetch-site'], r.headers['sec-fetch-user'], r.headers['sec-ch-ua'], r.headers['signature-agent'],
      r.client_ip_vendor_lists, r.client_ip, r.owner_network, Object.keys(r.headers),
    ].map(csvCell).join(','));
  }
  writeFileSync(join(outDir, 'captures.csv'), csv.join('\n') + '\n');
  writeFileSync(join(outDir, 'asn-holders.json'), JSON.stringify({ source: 'https://stat.ripe.net/data/as-overview/data.json', fetched_at: new Date().toISOString(), holders: Object.fromEntries([...holders.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => [String(k), v])) }, null, 2) + '\n');
  console.log(`${rows.length} probe requests, ${sideRows.length} side requests, ${strayRows.length} stray probe-shaped requests exported to ${outDir}`);
}

await main();
