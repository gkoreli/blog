import { classifyTraffic } from './classify.js';
import { claimsFetchMetadataBrowser } from './readerkind.js';

/** This is an extraction contract, not an anonymity or verified-client claim. */
export const REQUEST_EVIDENCE_VERSION = '2026-10-26.1';
export const MAX_UA_EVIDENCE_BYTES = 1024;
export const MAX_ACCEPT_EVIDENCE_BYTES = 512;
const encoder = new TextEncoder();

export type BrowserFamily = 'chromium' | 'edge' | 'opera' | 'firefox' | 'safari' | 'unknown';
export type OsFamily = 'windows-nt' | 'android' | 'ios' | 'macos' | 'chromeos' | 'linux' | 'unknown';
export type DeclaredClientForm = 'browser' | 'webview' | 'headless' | 'http-client' | 'bot' | 'unknown';

export interface RequestEvidence {
  version: typeof REQUEST_EVIDENCE_VERSION;
  browserFamily: BrowserFamily;
  browserMajor: number | null;
  osFamily: OsFamily;
  osMajor: number | null;
  declaredClientForm: DeclaredClientForm;
  claimsFetchMetadataSupport: boolean;
  primaryLanguage: string | null;
  responseStatus: number;
}

export interface HeaderEvidence {
  value: string | null;
  truncated: boolean;
  redacted: boolean;
}

export interface TransportEvidence {
  httpProtocol: string | null;
  tlsVersion: string | null;
  tlsCipher: string | null;
  colo: string | null;
}

/** Bounded source evidence stays private even after best-effort redaction. */
export interface RequestDiagnosticInputs {
  version: typeof REQUEST_EVIDENCE_VERSION;
  userAgent: HeaderEvidence;
  accept: HeaderEvidence;
  transport: TransportEvidence;
}

function major(value: string | undefined): number | null {
  if (value === undefined || !/^\d{1,5}$/.test(value)) return null;
  const parsed = Number(value);
  return parsed <= 65535 ? parsed : null;
}

function browser(userAgent: string): { family: BrowserFamily; major: number | null } {
  for (const [family, pattern] of [
    ['edge', /\bEdg(?:A|iOS)?\/(\d+)/],
    ['opera', /\bOPR\/(\d+)/],
    ['firefox', /\b(?:Firefox|FxiOS)\/(\d+)/],
    ['chromium', /\b(?:Chrome|Chromium|CriOS)\/(\d+)/],
    ['safari', /\bVersion\/(\d+)[^ ]* (?:Mobile\/\S+ )?Safari\//],
  ] as const) {
    const match = pattern.exec(userAgent);
    if (match) return { family, major: major(match[1]) };
  }
  return { family: 'unknown', major: null };
}

function os(userAgent: string): { family: OsFamily; major: number | null } {
  for (const [family, pattern] of [
    ['ios', /\b(?:CPU (?:iPhone )?OS|iPhone OS) (\d+)[_.]/],
    ['android', /\bAndroid (\d+)/],
    ['windows-nt', /\bWindows NT (\d+)/],
    ['macos', /\bMac OS X (\d+)[_.]/],
    ['chromeos', /\bCrOS\b/],
    ['linux', /\bLinux\b/],
  ] as const) {
    const match = pattern.exec(userAgent);
    if (match) return { family, major: major(match[1]) };
  }
  return { family: 'unknown', major: null };
}

function clientForm(userAgent: string, family: BrowserFamily): DeclaredClientForm {
  if (/\bHeadlessChrome\/|\bCypress\/|\bLightpanda\//i.test(userAgent)) return 'headless';
  if (/\b(?:curl\/|Wget\/|python-requests\/|Go-http-client\/|okhttp\/)/i.test(userAgent)) return 'http-client';
  if (classifyTraffic(userAgent).trafficClass !== 'browser') return 'bot';
  if (/;\s*wv\)|\b(?:WebView|Redroid)\b/i.test(userAgent)) return 'webview';
  return family === 'unknown' ? 'unknown' : 'browser';
}

/** Only a coarse language tag; never retain the full ordered preference list. */
function primaryLanguage(value: string | null): string | null {
  if (value === null) return null;
  let selected: string | null = null;
  let bestQuality = 0;
  for (const range of value.split(',')) {
    const match = /^([a-z]{2,3})(?:-[a-z0-9]{2,8})*(?:\s*;\s*q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?))?$/i.exec(range.trim());
    if (!match?.[1]) continue;
    const quality = match[2] === undefined ? 1 : Number(match[2]);
    if (quality <= bestQuality) continue;
    bestQuality = quality;
    selected = match[1].toLowerCase();
  }
  return selected;
}

export function extractRequestEvidence(request: Request, response: Response): RequestEvidence {
  const userAgent = request.headers.get('User-Agent') ?? '';
  const browserClaim = browser(userAgent);
  const osClaim = os(userAgent);
  return {
    version: REQUEST_EVIDENCE_VERSION,
    browserFamily: browserClaim.family,
    browserMajor: browserClaim.major,
    osFamily: osClaim.family,
    osMajor: osClaim.major,
    declaredClientForm: clientForm(userAgent, browserClaim.family),
    claimsFetchMetadataSupport: claimsFetchMetadataBrowser(userAgent),
    primaryLanguage: primaryLanguage(request.headers.get('Accept-Language')),
    responseStatus: response.status,
  };
}

function boundedUtf8(value: string, maxBytes: number): { value: string; truncated: boolean } {
  let result = '';
  let bytes = 0;
  for (const character of value) {
    const width = encoder.encode(character).byteLength;
    if (bytes + width > maxBytes) return { value: result, truncated: true };
    result += character;
    bytes += width;
  }
  return { value: result, truncated: false };
}

/**
 * Removes familiar identifier/credential patterns, not every possible identity.
 * Unknown names or identifiers can still occur: this output is NOT PII-free.
 * Version-like product tokens are preserved so Chrome/152.0.0.0 remains usable.
 */
export function privateHeaderEvidence(value: string | null, maxBytes: number): HeaderEvidence {
  if (value === null) return { value: null, truncated: false, redacted: false };
  const scan = boundedUtf8(value, maxBytes * 4);
  let redacted = false;
  const replace = (_match: string): string => { redacted = true; return '[redacted]'; };
  let cleaned = scan.value.replace(/[\u0000-\u001f\u007f]/g, replace)
    .replace(/\b(?:Bearer|Basic)\s+[a-z0-9+/_=.:-]+/gi, replace)
    .replace(/\b(?:token|api[_-]?key|password|secret|authorization)\s*[:=]\s*[^\s;,)]+/gi, replace)
    .replace(/[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?/gi, replace)
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, replace);
  cleaned = cleaned.replace(/https?:\/\/[^\s<>()]+/gi, source => {
    try {
      const url = new URL(source);
      // A publisher hostname remains evidence; account/path/query details do not.
      const origin = `${url.protocol}//${url.hostname}`;
      if (source !== origin) redacted = true;
      return origin;
    } catch { return replace(source); }
  });
  cleaned = cleaned.replace(/(?<![a-z0-9/.])(?:\d{1,3}\.){3}\d{1,3}(?![a-z0-9.])/gi, source => {
    return source.split('.').every(part => Number(part) <= 255) ? replace(source) : source;
  }).replace(/\[[0-9a-f:]*:[0-9a-f:.]+\]|(?<![a-z0-9])(?:[0-9a-f]{0,4}:){2,}[0-9a-f:.]+/gi, replace);
  const bounded = boundedUtf8(cleaned, maxBytes);
  return { value: bounded.value, truncated: scan.truncated || bounded.truncated, redacted };
}

function member(value: unknown, allowed: readonly string[]): string | null {
  return typeof value === 'string' && allowed.includes(value) ? value : null;
}

export function extractDiagnosticInputs(request: Request): RequestDiagnosticInputs {
  const cf = request.cf;
  const cipher = cf?.tlsCipher;
  const colo = cf?.colo;
  return {
    version: REQUEST_EVIDENCE_VERSION,
    userAgent: privateHeaderEvidence(request.headers.get('User-Agent'), MAX_UA_EVIDENCE_BYTES),
    accept: privateHeaderEvidence(request.headers.get('Accept'), MAX_ACCEPT_EVIDENCE_BYTES),
    transport: {
      httpProtocol: member(cf?.httpProtocol, ['HTTP/1.0', 'HTTP/1.1', 'HTTP/2', 'HTTP/3']),
      tlsVersion: member(cf?.tlsVersion, ['TLSv1', 'TLSv1.0', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3']),
      tlsCipher: typeof cipher === 'string' && /^[A-Z0-9_-]{1,96}$/.test(cipher) ? cipher : null,
      colo: typeof colo === 'string' && /^[A-Z]{3}$/.test(colo) ? colo : null,
    },
  };
}
