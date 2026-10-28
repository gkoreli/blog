import { directoryLocation } from './directory-discovery.js';
import { verificationTime } from './verification-clock.js';
import { knownTestKeyId, knownTestPublicKey, PUBLIC_KEY_POLICY_VERSION } from './known-test-keys.js';
const DIRECTORY_TTL_MS = 60 * 60 * 1_000;
const CLOCK_SKEW_SECONDS = 60;
const encoder = new TextEncoder();

/** Closed derived facts only: never header values, nonces or signature bytes. */
interface SignatureCoverageFacts {
  headerForm: 'dictionary' | 'legacy-string' | 'bare-uri';
  /** contentDigest records signed header coverage, not a body/digest comparison. */
  covered: { authority: boolean; targetUri: boolean; method: boolean; path: boolean; query: boolean; userAgent: boolean; contentDigest: boolean };
  otherComponentCount: number;
  validitySeconds: number;
  ageSeconds: number;
  replayPolicy: 'expiry-only';
}

/** Counts concern paired Signature/Signature-Input members, not all header members or signers. */
export interface SignatureSelection {
  policy: 'first-valid-in-input-order';
  matchedCandidates: number;
  taggedCandidates: number;
  attemptedCandidates: number;
  unassessedCandidates: number;
}
export type SignatureEvidence = SignatureCoverageFacts & (
  | { version: '2026-10-27.1' }
  | { version: '2026-10-28.1'; selection: SignatureSelection }
);

export type WebBotAuthResult =
  | { status: 'verified'; agent: string; evidence?: SignatureEvidence }
  | { status: 'unverified'; reason: string; reasons?: readonly string[] }
  | { status: 'absent' };

type BareItem =
  | { type: 'string'; value: string }
  | { type: 'integer'; value: number }
  | { type: 'token'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'bytes'; value: Uint8Array };

interface Parameter {
  name: string;
  value: BareItem;
}

interface Item {
  bare: BareItem;
  parameters: Parameter[];
}

interface InnerList {
  items: Item[];
  parameters: Parameter[];
}

type DictionaryMember =
  | { type: 'item'; value: Item }
  | { type: 'inner-list'; value: InnerList };

interface DictionaryEntry {
  key: string;
  member: DictionaryMember;
}

type SignatureAgentForm = 'dictionary' | 'legacy-string' | 'bare-uri';

interface ParsedSignatureAgent {
  form: SignatureAgentForm;
  entries: DictionaryEntry[];
}

interface SignatureCandidate {
  label: string;
  input: InnerList;
  signature: Uint8Array;
}

interface DirectoryEntry {
  expiresAt: number;
  keyPolicy: typeof PUBLIC_KEY_POLICY_VERSION;
  keys: Array<{ jwk: JsonWebKey; metadataRejected: boolean; notBefore: number | null; expires: number | null }>;
}

interface KeyEntry {
  expiresAt: number;
  key: CryptoKey;
  keyPolicy: typeof PUBLIC_KEY_POLICY_VERSION;
}

export interface WebBotAuthCache {
  directories: Map<string, DirectoryEntry>;
  keys: Map<string, KeyEntry>;
  pendingDirectories: Map<string, Promise<DirectoryEntry | null>>;
  forcedRefreshes: Map<string, number>;
}

export interface WebBotAuthOptions {
  now?: Date;
  fetcher?: typeof fetch;
  cache?: WebBotAuthCache;
  includeEvidence?: boolean;
  /** Application policy, distinct from the RFC's configurable validity rules. */
  maxAgeSeconds?: number;
}

export interface SignatureAgentMember {
  key: string | null;
  uri: string;
  legacy: boolean;
}

class StructuredFieldParser {
  private index = 0;

  constructor(private readonly source: string) {}

  atEnd(): boolean {
    return this.index === this.source.length;
  }

  skipOptionalWhitespace(): void {
    while (this.source[this.index] === ' ' || this.source[this.index] === '\t') this.index += 1;
  }

  parseDictionary(): DictionaryEntry[] | null {
    const entries: DictionaryEntry[] = [];
    const keys = new Set<string>();
    this.skipOptionalWhitespace();
    if (this.atEnd()) return null;

    while (!this.atEnd()) {
      const key = this.parseKey();
      if (key === null || keys.has(key)) return null;
      keys.add(key);
      let member: DictionaryMember;
      if (this.source[this.index] === '=') {
        this.index += 1;
        const parsed = this.source[this.index] === '(' ? this.parseInnerList() : this.parseItem();
        if (parsed === null) return null;
        member = this.isInnerList(parsed)
          ? { type: 'inner-list', value: parsed }
          : { type: 'item', value: parsed };
      } else {
        const parameters = this.parseParameters();
        if (parameters === null) return null;
        member = {
          type: 'item',
          value: { bare: { type: 'boolean', value: true }, parameters },
        };
      }
      entries.push({ key, member });
      this.skipOptionalWhitespace();
      if (this.atEnd()) break;
      if (this.source[this.index] !== ',') return null;
      this.index += 1;
      this.skipOptionalWhitespace();
      if (this.atEnd()) return null;
    }
    return entries;
  }

  parseSingleItem(): Item | null {
    this.skipOptionalWhitespace();
    const item = this.parseItem();
    if (item === null) return null;
    this.skipOptionalWhitespace();
    return this.atEnd() ? item : null;
  }

  private isInnerList(value: Item | InnerList): value is InnerList {
    return 'items' in value;
  }

  private parseInnerList(): InnerList | null {
    if (this.source[this.index] !== '(') return null;
    this.index += 1;
    const items: Item[] = [];
    while (true) {
      while (this.source[this.index] === ' ') this.index += 1;
      if (this.source[this.index] === ')') {
        this.index += 1;
        break;
      }
      const item = this.parseItem();
      if (item === null) return null;
      items.push(item);
      if (this.source[this.index] !== ' ' && this.source[this.index] !== ')') return null;
    }
    const parameters = this.parseParameters();
    return parameters === null ? null : { items, parameters };
  }

  private parseItem(): Item | null {
    const bare = this.parseBareItem();
    if (bare === null) return null;
    const parameters = this.parseParameters();
    return parameters === null ? null : { bare, parameters };
  }

  private parseBareItem(): BareItem | null {
    const first = this.source[this.index];
    if (first === '"') return this.parseString();
    if (first === ':') return this.parseBytes();
    if (first === '?') return this.parseBoolean();
    if (first === '-' || (first !== undefined && /[0-9]/.test(first))) return this.parseInteger();
    return this.parseToken();
  }

  private parseString(): BareItem | null {
    if (this.source[this.index] !== '"') return null;
    this.index += 1;
    let value = '';
    while (!this.atEnd()) {
      const character = this.source[this.index];
      this.index += 1;
      if (character === '"') return { type: 'string', value };
      if (character === '\\') {
        const escaped = this.source[this.index];
        if (escaped !== '"' && escaped !== '\\') return null;
        value += escaped;
        this.index += 1;
        continue;
      }
      if (character === undefined || character.charCodeAt(0) < 0x20 || character.charCodeAt(0) > 0x7e) {
        return null;
      }
      value += character;
    }
    return null;
  }

  private parseBytes(): BareItem | null {
    if (this.source[this.index] !== ':') return null;
    const end = this.source.indexOf(':', this.index + 1);
    if (end === -1) return null;
    const encoded = this.source.slice(this.index + 1, end);
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
      return null;
    }
    try {
      const binary = atob(encoded);
      const value = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) value[index] = binary.charCodeAt(index);
      this.index = end + 1;
      return { type: 'bytes', value };
    } catch {
      return null;
    }
  }

  private parseBoolean(): BareItem | null {
    const value = this.source.slice(this.index, this.index + 2);
    if (value !== '?0' && value !== '?1') return null;
    this.index += 2;
    return { type: 'boolean', value: value === '?1' };
  }

  private parseInteger(): BareItem | null {
    const start = this.index;
    if (this.source[this.index] === '-') this.index += 1;
    const digitsStart = this.index;
    while (this.source[this.index] !== undefined && /[0-9]/.test(this.source[this.index] ?? '')) {
      this.index += 1;
    }
    const digitCount = this.index - digitsStart;
    if (digitCount === 0 || digitCount > 15 || this.source[this.index] === '.') return null;
    const value = Number(this.source.slice(start, this.index));
    return Number.isSafeInteger(value) ? { type: 'integer', value } : null;
  }

  private parseToken(): BareItem | null {
    const start = this.index;
    const first = this.source[this.index];
    if (first === undefined || !/[A-Za-z*]/.test(first)) return null;
    this.index += 1;
    while (this.source[this.index] !== undefined && /[A-Za-z0-9!#$%&'*+.^_`|~:/-]/.test(this.source[this.index] ?? '')) {
      this.index += 1;
    }
    return { type: 'token', value: this.source.slice(start, this.index) };
  }

  private parseParameters(): Parameter[] | null {
    const parameters: Parameter[] = [];
    const names = new Set<string>();
    while (this.source[this.index] === ';') {
      this.index += 1;
      const name = this.parseKey();
      if (name === null || names.has(name)) return null;
      names.add(name);
      let value: BareItem = { type: 'boolean', value: true };
      if (this.source[this.index] === '=') {
        this.index += 1;
        const parsed = this.parseBareItem();
        if (parsed === null) return null;
        value = parsed;
      }
      parameters.push({ name, value });
    }
    return parameters;
  }

  private parseKey(): string | null {
    const start = this.index;
    const first = this.source[this.index];
    if (first === undefined || !/[a-z*]/.test(first)) return null;
    this.index += 1;
    while (this.source[this.index] !== undefined && /[a-z0-9_.*-]/.test(this.source[this.index] ?? '')) {
      this.index += 1;
    }
    return this.source.slice(start, this.index);
  }
}

function parseDictionary(value: string): DictionaryEntry[] | null {
  return new StructuredFieldParser(value).parseDictionary();
}

function stringValue(item: BareItem | undefined): string | null {
  return item?.type === 'string' ? item.value : null;
}

function integerValue(item: BareItem | undefined): number | null {
  return item?.type === 'integer' ? item.value : null;
}

function parameter(parameters: readonly Parameter[], name: string): BareItem | undefined {
  return parameters.find((entry) => entry.name === name)?.value;
}

function escapeString(value: string): string {
  return `"${value.replace(/(["\\])/g, '\\$1')}"`;
}

function serializeBareItem(item: BareItem): string {
  switch (item.type) {
    case 'string':
      return escapeString(item.value);
    case 'integer':
      return String(item.value);
    case 'token':
      return item.value;
    case 'boolean':
      return item.value ? '?1' : '?0';
    case 'bytes': {
      let binary = '';
      for (const byte of item.value) binary += String.fromCharCode(byte);
      return `:${btoa(binary)}:`;
    }
  }
}

function serializeParameters(parameters: readonly Parameter[]): string {
  return parameters.map((entry) => {
    if (entry.value.type === 'boolean' && entry.value.value) return `;${entry.name}`;
    return `;${entry.name}=${serializeBareItem(entry.value)}`;
  }).join('');
}

function serializeItem(item: Item): string {
  return `${serializeBareItem(item.bare)}${serializeParameters(item.parameters)}`;
}

function serializeInnerList(innerList: InnerList): string {
  return `(${innerList.items.map(serializeItem).join(' ')})${serializeParameters(innerList.parameters)}`;
}

/** HTTP OWS is SP/HTAB, not JavaScript's wider Unicode whitespace set. */
function trimHttpWhitespace(value: string): string {
  return value.replace(/^[ \t]+|[ \t]+$/g, '');
}

function parseSignatureAgentEntries(value: string): ParsedSignatureAgent | null {
  const trimmed = trimHttpWhitespace(value);
  if (trimmed.startsWith('"')) {
    const item = new StructuredFieldParser(trimmed).parseSingleItem();
    if (item === null || item.bare.type !== 'string' || item.parameters.length !== 0) return null;
    return {
      form: 'legacy-string',
      entries: [{ key: '', member: { type: 'item', value: item } }],
    };
  }
  if (/^https:\/\/[^\s,;="]+$/.test(trimmed)) {
    const item: Item = {
      bare: { type: 'string', value: trimmed },
      parameters: [],
    };
    return {
      form: 'bare-uri',
      entries: [{ key: '', member: { type: 'item', value: item } }],
    };
  }
  const entries = parseDictionary(trimmed);
  if (entries === null) return null;
  for (const entry of entries) {
    if (entry.member.type !== 'item' || entry.member.value.bare.type !== 'string') return null;
  }
  return { form: 'dictionary', entries };
}

export function parseSignatureAgentHeader(value: string): readonly SignatureAgentMember[] | null {
  const parsed = parseSignatureAgentEntries(value);
  if (parsed === null) return null;
  const result: SignatureAgentMember[] = [];
  for (const entry of parsed.entries) {
    if (entry.member.type !== 'item' || entry.member.value.bare.type !== 'string') return null;
    result.push({
      key: parsed.form === 'dictionary' ? entry.key : null,
      uri: entry.member.value.bare.value,
      legacy: parsed.form !== 'dictionary',
    });
  }
  return result;
}

function signatureCandidates(signatureInput: string, signature: string): SignatureCandidate[] | null {
  const inputs = parseDictionary(signatureInput);
  const signatures = parseDictionary(signature);
  if (inputs === null || signatures === null) return null;
  const signaturesByLabel = new Map<string, Uint8Array>();
  for (const entry of signatures) {
    if (entry.member.type !== 'item') return null;
    const item = entry.member.value;
    if (item.bare.type !== 'bytes' || item.parameters.length !== 0) return null;
    signaturesByLabel.set(entry.key, item.bare.value);
  }

  const candidates: SignatureCandidate[] = [];
  for (const entry of inputs) {
    if (entry.member.type !== 'inner-list') return null;
    const signatureValue = signaturesByLabel.get(entry.key);
    if (signatureValue !== undefined) {
      candidates.push({ label: entry.key, input: entry.member.value, signature: signatureValue });
    }
  }
  return candidates;
}

function normalizeFieldValue(value: string): string {
  return trimHttpWhitespace(value.replace(/[ \t]*\r?\n[ \t]+/g, ' '));
}

function signatureAgentComponentValue(
  component: Item,
  parsedAgent: ParsedSignatureAgent,
): { serialized: string; uri: string } | null {
  if (parsedAgent.form !== 'dictionary') {
    if (component.parameters.length !== 0) return null;
    const entry = parsedAgent.entries[0];
    if (entry?.member.type !== 'item' || entry.member.value.bare.type !== 'string') return null;
    const uri = entry.member.value.bare.value;
    // DuckDuckBot signs the non-conforming bare field value exactly as sent.
    const serialized = parsedAgent.form === 'bare-uri' ? uri : serializeItem(entry.member.value);
    return { serialized, uri };
  }

  if (component.parameters.length !== 1 || component.parameters[0]?.name !== 'key') return null;
  const memberKey = stringValue(component.parameters[0]?.value);
  if (memberKey === null) return null;
  // Resolve only the covered member. An unsigned member cannot rename the
  // signer; the outer Signature label can be relabelled (RFC 9421 section 7.2.5).
  const entry = parsedAgent.entries.find((candidate) => candidate.key === memberKey);
  if (entry?.member.type !== 'item' || entry.member.value.bare.type !== 'string') return null;
  const discoveryType = parameter(entry.member.value.parameters, 'type');
  if (discoveryType !== undefined && (discoveryType.type !== 'token' || discoveryType.value !== 'directory')) {
    return null;
  }
  return { serialized: serializeItem(entry.member.value), uri: entry.member.value.bare.value };
}

function componentValue(
  request: Request,
  component: Item,
  parsedAgent: ParsedSignatureAgent | null,
): { value: string; signatureAgentUri: string | null } | { reason: 'malformed-field-component' } | null {
  if (component.bare.type !== 'string') return null;
  const name = component.bare.value;
  if (name !== name.toLowerCase()) return null;
  const url = new URL(request.url);
  if (name.startsWith('@')) {
    if (component.parameters.length !== 0) return null;
    switch (name) {
      case '@authority':
        return { value: url.host, signatureAgentUri: null };
      case '@target-uri':
        return { value: url.href, signatureAgentUri: null };
      case '@method':
        return { value: request.method, signatureAgentUri: null };
      case '@path':
        return { value: url.pathname.length === 0 ? '/' : url.pathname, signatureAgentUri: null };
      case '@query':
        return { value: url.search.length === 0 ? '?' : url.search, signatureAgentUri: null };
      case '@scheme':
        return { value: url.protocol.slice(0, -1).toLowerCase(), signatureAgentUri: null };
      default:
        return null;
    }
  }

  if (name === 'signature-agent') {
    if (parsedAgent === null) return null;
    const selected = signatureAgentComponentValue(component, parsedAgent);
    return selected === null ? null : { value: selected.serialized, signatureAgentUri: selected.uri };
  }
  if (component.parameters.length !== 0) return null;
  const value = request.headers.get(name);
  if (value === null) return null;
  const normalized = normalizeFieldValue(value);
  // RFC 9110 section 5.5: ASCII controls other than HTAB are not field content.
  // Request constructors can admit them even when an HTTP client rejects them.
  if (/[\x00-\x08\x0a-\x1f\x7f]/.test(normalized)) return { reason: 'malformed-field-component' };
  return { value: normalized, signatureAgentUri: null };
}

interface SignatureBaseResult {
  base: string;
  signatureAgentUri: string | null;
  coveredAuthority: boolean;
  coveredTargetUri: boolean;
}

/** RFC 9421 section 2.5 step 2.1 includes parameters in component identity. */
function hasDuplicateComponent(input: InnerList): boolean {
  const identifiers = input.items.map(serializeItem);
  return new Set(identifiers).size !== identifiers.length;
}

function createSignatureBase(
  request: Request,
  input: InnerList,
  parsedAgent: ParsedSignatureAgent | null,
): SignatureBaseResult | { reason: 'non-ascii-signature-base' | 'malformed-field-component' | 'invalid-request-target' } | null {
  if (hasDuplicateComponent(input)) return null;
  const target = new URL(request.url);
  // RFC 9110 section 4.2.5: fragments cannot be part of the HTTP target URI.
  // Checking href also catches an empty trailing fragment marker.
  if (!['http:', 'https:'].includes(target.protocol) || target.href.includes('#')) return { reason: 'invalid-request-target' };
  const lines: string[] = [];
  let signatureAgentUri: string | null = null;
  let coveredAuthority = false;
  let coveredTargetUri = false;

  for (const component of input.items) {
    const resolved = componentValue(request, component, parsedAgent);
    if (resolved === null) return null;
    if ('reason' in resolved) return resolved;
    if (component.bare.type !== 'string') return null;
    if (component.bare.value === '@authority') coveredAuthority = true;
    if (component.bare.value === '@target-uri') coveredTargetUri = true;
    if (resolved.signatureAgentUri !== null) {
      if (signatureAgentUri !== null && signatureAgentUri !== resolved.signatureAgentUri) return null;
      signatureAgentUri = resolved.signatureAgentUri;
    }
    lines.push(`${serializeItem(component)}: ${resolved.value}`);
  }
  lines.push(`"@signature-params": ${serializeInnerList(input)}`);
  const base = lines.join('\n');
  // RFC 9421 section 2.5 step 4. Non-ASCII HTTP values need an ASCII
  // representation such as ;bs, which this verifier profile does not support.
  if (/[^\x00-\x7f]/.test(base)) return { reason: 'non-ascii-signature-base' };
  return { base, signatureAgentUri, coveredAuthority, coveredTargetUri };
}

export function buildSignatureBase(request: Request, label: string): string | null {
  const signatureAgent = request.headers.get('Signature-Agent');
  const signatureInput = request.headers.get('Signature-Input');
  if (signatureInput === null) return null;
  const parsedAgent = signatureAgent === null ? null : parseSignatureAgentEntries(signatureAgent);
  const inputs = parseDictionary(signatureInput);
  if (signatureAgent !== null && parsedAgent === null) return null;
  if (inputs === null) return null;
  const entry = inputs.find((candidate) => candidate.key === label);
  if (entry?.member.type !== 'inner-list') return null;
  const result = createSignatureBase(request, entry.member.value, parsedAgent);
  return result !== null && !('reason' in result) ? result.base : null;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function ed25519Material(value: unknown): JsonWebKey | null {
  if (!isRecord(value)) return null;
  if (value.kty !== 'OKP' || value.crv !== 'Ed25519' || typeof value.x !== 'string') return null;
  return { kty: value.kty, crv: value.crv, x: value.x };
}

/** Thumbprint identity excludes optional metadata. Admission must not discard
 * a matching key's constraints or confuse a forbidden key with a missing key.
 */
function directoryKey(value: unknown): { jwk: JsonWebKey; metadataRejected: boolean } | null {
  const jwk = ed25519Material(value);
  if (jwk === null || !isRecord(value)) return null;
  const rejected = { jwk, metadataRejected: true };
  if (Object.hasOwn(value, 'd')) return rejected;
  if (value.use !== undefined) {
    if (value.use !== 'sig') return rejected;
    jwk.use = value.use;
  }
  if (value.alg !== undefined) {
    if (value.alg !== 'EdDSA' && value.alg !== 'Ed25519') return rejected;
    // Both JOSE names denote this fixed curve. Older workerd imports accept
    // EdDSA only; validate the original constraint before adapting its alias.
    jwk.alg = 'EdDSA';
  }
  if (value.key_ops !== undefined) {
    if (!Array.isArray(value.key_ops) || !value.key_ops.every((operation): operation is string => typeof operation === 'string')) return rejected;
    if (!value.key_ops.includes('verify') || new Set(value.key_ops).size !== value.key_ops.length) return rejected;
    if (value.use === 'sig' && value.key_ops.some(operation => operation !== 'sign' && operation !== 'verify')) return rejected;
    jwk.key_ops = [...value.key_ops];
  }
  if (value.ext !== undefined) {
    if (typeof value.ext !== 'boolean') return rejected;
    jwk.ext = value.ext;
  }
  return { jwk, metadataRejected: false };
}

export async function ed25519JwkThumbprint(value: unknown): Promise<string | null> {
  try {
    const jwk = ed25519Material(value);
    if (jwk === null || jwk.crv !== 'Ed25519' || jwk.kty !== 'OKP' || typeof jwk.x !== 'string') return null;
    const canonical = `{"crv":"Ed25519","kty":"OKP","x":${JSON.stringify(jwk.x)}}`;
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonical)));
    return base64Url(digest);
  } catch {
    return null;
  }
}

export function createWebBotAuthCache(): WebBotAuthCache {
  return {
    directories: new Map(),
    keys: new Map(),
    pendingDirectories: new Map(),
    forcedRefreshes: new Map(),
  };
}

const sharedCache = createWebBotAuthCache();

async function fetchDirectory(
  directoryUrl: string,
  fetcher: typeof fetch,
  cache: WebBotAuthCache,
  nowMs: number,
): Promise<DirectoryEntry | null> {
  const cached = cache.directories.get(directoryUrl);
  if (cached !== undefined && cached.expiresAt > nowMs && cached.keyPolicy === PUBLIC_KEY_POLICY_VERSION) return cached;
  if (cached !== undefined) cache.directories.delete(directoryUrl);

  const pending = cache.pendingDirectories.get(directoryUrl);
  if (pending !== undefined) return pending;
  if (cache.pendingDirectories.size >= 64) return null;

  const load = async (): Promise<DirectoryEntry | null> => {
    try {
      const response = await fetcher(directoryUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: { Accept: 'application/http-message-signatures-directory+json' },
      });
      if (response.status !== 200) return null;
      if (response.headers.get('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== 'application/http-message-signatures-directory+json') return null;
      if (Number(response.headers.get('Content-Length') ?? 0) > 65536) return null;
      const reader = response.body?.getReader();
      if (reader === undefined) return null;
      let size = 0;
      const chunks: Uint8Array[] = [];
      try {
        for (;;) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > 65536) { await reader.cancel(); return null; }
          chunks.push(part.value);
        }
      } finally { reader.releaseLock(); }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (!isRecord(body) || !Array.isArray(body.keys)) return null;
      if (body.keys.length > 128) return null;
      const keys: DirectoryEntry['keys'] = [];
      for (const value of body.keys) {
        const key = directoryKey(value);
        if (key === null || !isRecord(value)) continue;
        if (value.nbf !== undefined && !Number.isSafeInteger(value.nbf)) continue;
        if (value.exp !== undefined && !Number.isSafeInteger(value.exp)) continue;
        const notBefore = typeof value.nbf === 'number' ? value.nbf : null;
        const expires = typeof value.exp === 'number' ? value.exp : null;
        if (notBefore !== null && expires !== null && expires <= notBefore) continue;
        keys.push({ ...key, notBefore, expires });
      }
      const control = response.headers.get('Cache-Control') ?? '';
      const maxAge = /(?:^|,)\s*max-age\s*=\s*"?(\d+)"?(?:\s*,|\s*$)/i.exec(control);
      const age = Number(response.headers.get('Age') ?? 0);
      const seconds = /(?:^|,)\s*(?:no-cache|no-store)\b/i.test(control) ? 0
        : Math.max(0, Math.min(DIRECTORY_TTL_MS / 1000, maxAge?.[1] === undefined ? 300 : Number(maxAge[1])) - (Number.isFinite(age) && age > 0 ? age : 0));
      const entry: DirectoryEntry = { keys, keyPolicy: PUBLIC_KEY_POLICY_VERSION, expiresAt: nowMs + seconds * 1000 };
      // A newly fetched directory also invalidates imported removed/revoked keys.
      for (const key of cache.keys.keys()) if (key.startsWith(`${directoryUrl}\n`)) cache.keys.delete(key);
      if (cache.directories.size >= 256) cache.directories.delete(cache.directories.keys().next().value ?? '');
      cache.directories.set(directoryUrl, entry);
      return entry;
    } catch {
      return null;
    } finally {
      cache.pendingDirectories.delete(directoryUrl);
    }
  };
  const promise = load();
  cache.pendingDirectories.set(directoryUrl, promise);
  return promise;
}

function pairKey(directoryUrl: string, keyid: string): string {
  return `${directoryUrl}\n${keyid}`;
}

async function resolveVerificationKey(
  directoryUrl: string,
  keyid: string,
  fetcher: typeof fetch,
  cache: WebBotAuthCache,
  nowMs: number,
): Promise<{ key: CryptoKey } | { reason: string }> {
  const cacheKey = pairKey(directoryUrl, keyid);
  const cached = cache.keys.get(cacheKey);
  if (cached !== undefined && cached.expiresAt > nowMs && cached.keyPolicy === PUBLIC_KEY_POLICY_VERSION) return { key: cached.key };
  if (cached !== undefined) cache.keys.delete(cacheKey);

  const previousDirectory = cache.directories.get(directoryUrl);
  const hadFreshDirectory = previousDirectory?.keyPolicy === PUBLIC_KEY_POLICY_VERSION && previousDirectory.expiresAt > nowMs;
  let directory = await fetchDirectory(directoryUrl, fetcher, cache, nowMs);
  if (directory === null) return { reason: 'directory-unavailable' };
  const find = async (entry: DirectoryEntry) => {
    for (const candidate of entry.keys) if (await ed25519JwkThumbprint(candidate.jwk) === keyid) {
      // Equal fixed kty/crv/x members have the same RFC 7638 identity. A second
      // publication of that identity must not hide a rejected constraint by order.
      return entry.keys.filter(key => key.jwk.x === candidate.jwk.x);
    }
    return [];
  };
  let matching = await find(directory);
  // One forced refresh per origin per 30 seconds handles overlapping key rotation
  // without turning every random keyid into an unbounded directory fetch loop.
  if (matching.length === 0 && hadFreshDirectory && nowMs - (cache.forcedRefreshes.get(directoryUrl) ?? -Infinity) >= 30000) {
    if (cache.forcedRefreshes.size >= 256) cache.forcedRefreshes.delete(cache.forcedRefreshes.keys().next().value ?? '');
    cache.forcedRefreshes.set(directoryUrl, nowMs);
    cache.directories.delete(directoryUrl);
    directory = await fetchDirectory(directoryUrl, fetcher, cache, nowMs);
    if (directory === null) return { reason: 'directory-unavailable' };
    matching = await find(directory);
  }
  const selected = matching[0];
  if (selected === undefined) return { reason: 'key-not-found' };
  if (matching.some(key => key.metadataRejected)) return { reason: matching.some(key => !key.metadataRejected) ? 'key-metadata-conflict' : 'key-metadata-rejected' };
  // The same bytes can have another thumbprint if their x encoding changes.
  if (knownTestPublicKey(selected.jwk)) return { reason: 'known-test-key' };
  if (selected.notBefore !== null && nowMs / 1000 < selected.notBefore) return { reason: 'key-not-yet-valid' };
  if (selected.expires !== null && nowMs / 1000 >= selected.expires) return { reason: 'key-expired' };
  {
    try {
      const key = await crypto.subtle.importKey('jwk', selected.jwk, 'Ed25519', false, ['verify']);
      if (cache.keys.size >= 256) cache.keys.delete(cache.keys.keys().next().value ?? '');
      cache.keys.set(cacheKey, { key, keyPolicy: PUBLIC_KEY_POLICY_VERSION, expiresAt: Math.min(directory.expiresAt, selected.expires === null ? Infinity : selected.expires * 1000) });
      return { key };
    } catch {
      return { reason: 'key-invalid' };
    }
  }
}

async function verifyCandidate(
  request: Request,
  candidate: SignatureCandidate,
  parsedAgent: ParsedSignatureAgent,
  fetcher: typeof fetch,
  cache: WebBotAuthCache,
  nowMs: number,
  options: WebBotAuthOptions,
): Promise<WebBotAuthResult> {
  const tag = stringValue(parameter(candidate.input.parameters, 'tag'));
  if (tag !== 'web-bot-auth') return { status: 'unverified', reason: 'not-web-bot-auth' };
  const created = integerValue(parameter(candidate.input.parameters, 'created'));
  const expires = integerValue(parameter(candidate.input.parameters, 'expires'));
  if (created === null || expires === null) return { status: 'unverified', reason: 'missing-validity' };
  if (expires < created) return { status: 'unverified', reason: 'invalid-validity-window' };
  const nowSeconds = Math.floor(nowMs / 1_000);
  if (created > nowSeconds + CLOCK_SKEW_SECONDS) return { status: 'unverified', reason: 'not-yet-valid' };
  if (expires < nowSeconds - CLOCK_SKEW_SECONDS) return { status: 'unverified', reason: 'expired' };
  if (options.maxAgeSeconds !== undefined && (!Number.isSafeInteger(options.maxAgeSeconds) || options.maxAgeSeconds < 0)) return { status: 'unverified', reason: 'invalid-max-age-policy' };
  if (options.maxAgeSeconds !== undefined && (expires - created > options.maxAgeSeconds || nowSeconds - created > options.maxAgeSeconds + CLOCK_SKEW_SECONDS)) return { status: 'unverified', reason: 'validity-policy-exceeded' };

  const algorithm = parameter(candidate.input.parameters, 'alg');
  if (algorithm !== undefined && stringValue(algorithm) !== 'ed25519') {
    return { status: 'unverified', reason: 'unsupported-alg' };
  }
  const keyid = stringValue(parameter(candidate.input.parameters, 'keyid'));
  if (keyid === null || keyid.length === 0) return { status: 'unverified', reason: 'missing-keyid' };

  if (hasDuplicateComponent(candidate.input)) return { status: 'unverified', reason: 'duplicate-component' };
  const signatureBase = createSignatureBase(request, candidate.input, parsedAgent);
  if (signatureBase === null) return { status: 'unverified', reason: 'unsupported-or-missing-component' };
  if ('reason' in signatureBase) return { status: 'unverified', reason: signatureBase.reason };
  if (!signatureBase.coveredAuthority && !signatureBase.coveredTargetUri) {
    return { status: 'unverified', reason: 'missing-target-component' };
  }
  if (signatureBase.signatureAgentUri === null) {
    return { status: 'unverified', reason: 'unsupported-or-missing-component' };
  }
  const location = directoryLocation(signatureBase.signatureAgentUri);
  if ('reason' in location) return { status: 'unverified', reason: location.reason };
  if (knownTestKeyId(keyid)) return { status: 'unverified', reason: 'known-test-key' };

  const resolvedKey = await resolveVerificationKey(location.directoryUrl, keyid, fetcher, cache, nowMs);
  if ('reason' in resolvedKey) return { status: 'unverified', reason: resolvedKey.reason };
  try {
    const verified = await crypto.subtle.verify(
      'Ed25519',
      resolvedKey.key,
      candidate.signature,
      encoder.encode(signatureBase.base),
    );
    if (!verified) return { status: 'unverified', reason: 'signature-invalid' };
    if (!options.includeEvidence) return { status: 'verified', agent: location.agent };
    const names = new Set(candidate.input.items.flatMap(item => item.bare.type === 'string' ? [item.bare.value] : []));
    const recorded = ['@authority', '@target-uri', '@method', '@path', '@query', 'user-agent', 'content-digest', 'signature-agent'];
    return { status: 'verified', agent: location.agent, evidence: {
      version: '2026-10-27.1', headerForm: parsedAgent.form,
      covered: { authority: names.has('@authority'), targetUri: names.has('@target-uri'), method: names.has('@method'), path: names.has('@path'), query: names.has('@query'), userAgent: names.has('user-agent'), contentDigest: names.has('content-digest') },
      otherComponentCount: [...names].filter(name => !recorded.includes(name)).length,
      validitySeconds: expires - created, ageSeconds: Math.max(0, nowSeconds - created), replayPolicy: 'expiry-only',
    } };
  } catch {
    // A crypto/runtime failure is not a negative cryptographic verdict.
    return { status: 'unverified', reason: 'verification-error' };
  }
}

/**
 * Ed25519/directory-discovery subset on RFC 9421 request components, with
 * dictionary and legacy wire compatibility. Not full RFC/draft conformance.
 * The independently written implementation is compared with the Apache-2.0
 * reference; unsupported discovery/algorithms/components remain explicit:
 * https://github.com/cloudflare/web-bot-auth
 */
export async function verifyWebBotAuth(
  request: Request,
  options: WebBotAuthOptions = {},
): Promise<WebBotAuthResult> {
  try {
    const signatureAgent = request.headers.get('Signature-Agent');
    const signatureInput = request.headers.get('Signature-Input');
    const signature = request.headers.get('Signature');
    if (signatureAgent === null && signatureInput === null && signature === null) return { status: 'absent' };
    if (signatureAgent === null) return { status: 'unverified', reason: 'missing-signature-agent' };
    if (signatureInput === null) return { status: 'unverified', reason: 'missing-signature-input' };
    if (signature === null) return { status: 'unverified', reason: 'missing-signature' };

    const parsedAgent = parseSignatureAgentEntries(signatureAgent);
    if (parsedAgent === null) return { status: 'unverified', reason: 'malformed-signature-agent' };
    const candidates = signatureCandidates(signatureInput, signature);
    if (candidates === null) {
      return {
        status: 'unverified',
        reason: parsedAgent.form === 'bare-uri' ? 'bare-uri-signature-agent' : 'malformed-signature-fields',
      };
    }
    const tagged = candidates.filter((candidate) => (
      stringValue(parameter(candidate.input.parameters, 'tag')) === 'web-bot-auth'
    ));
    if (tagged.length === 0) {
      return {
        status: 'unverified',
        reason: parsedAgent.form === 'bare-uri' ? 'bare-uri-signature-agent' : 'no-web-bot-auth-signature',
      };
    }

    const fetcher = options.fetcher ?? fetch;
    const cache = options.cache ?? sharedCache;
    const nowMs = verificationTime(options.now);
    if (nowMs === null) return { status: 'unverified', reason: 'invalid-verification-time' };
    let lastFailure: WebBotAuthResult = { status: 'unverified', reason: 'signature-invalid' };
    const reasons = new Set<string>();
    let attemptedCandidates = 0;
    for (const candidate of tagged) {
      attemptedCandidates++;
      const result = await verifyCandidate(request, candidate, parsedAgent, fetcher, cache, nowMs, options);
      if (result.status === 'verified') {
        if (!options.includeEvidence || result.evidence === undefined) return result;
        // This is one selected proof. Later candidates may also verify, fail, or
        // name another signer; short-circuiting does not assess them.
        return { ...result, evidence: { ...result.evidence, version: '2026-10-28.1', selection: {
          policy: 'first-valid-in-input-order', matchedCandidates: candidates.length,
          taggedCandidates: tagged.length, attemptedCandidates,
          unassessedCandidates: tagged.length - attemptedCandidates,
        } } };
      }
      lastFailure = result;
      if (result.status === 'unverified') reasons.add(result.reason);
    }
    return parsedAgent.form === 'bare-uri'
      ? { status: 'unverified', reason: 'bare-uri-signature-agent' }
      : lastFailure.status === 'unverified' && reasons.size > 1
        ? { ...lastFailure, reasons: [...reasons].sort() }
        : lastFailure;
  } catch {
    return { status: 'unverified', reason: 'verification-error' };
  }
}

type CandidateInspectionFailure = Extract<WebBotAuthResult, { status: 'absent' | 'unverified' }>;
type CandidateContext = CandidateInspectionFailure | {
  status: 'ready';
  parsedAgent: ParsedSignatureAgent;
  candidates: SignatureCandidate[];
  inputMembers: number;
  signatureMembers: number;
  tagged: SignatureCandidate[];
};

/** Diagnostic path only. The collector's existing first-valid path above is unchanged. */
function candidateContext(request: Request): CandidateContext {
  const agent = request.headers.get('Signature-Agent'), input = request.headers.get('Signature-Input'), signature = request.headers.get('Signature');
  if (agent === null && input === null && signature === null) return { status: 'absent' };
  if (agent === null) return { status: 'unverified', reason: 'missing-signature-agent' };
  if (input === null) return { status: 'unverified', reason: 'missing-signature-input' };
  if (signature === null) return { status: 'unverified', reason: 'missing-signature' };
  const parsedAgent = parseSignatureAgentEntries(agent);
  if (parsedAgent === null) return { status: 'unverified', reason: 'malformed-signature-agent' };
  const candidates = signatureCandidates(input, signature);
  if (candidates === null) return { status: 'unverified', reason: parsedAgent.form === 'bare-uri' ? 'bare-uri-signature-agent' : 'malformed-signature-fields' };
  const inputs = parseDictionary(input), signatures = parseDictionary(signature);
  if (inputs === null || signatures === null) return { status: 'unverified', reason: 'malformed-signature-fields' };
  return { status: 'ready', parsedAgent, candidates, inputMembers: inputs.length, signatureMembers: signatures.length, tagged: candidates.filter(candidate => stringValue(parameter(candidate.input.parameters, 'tag')) === 'web-bot-auth') };
}

/** Labels are private, untrusted selectors. Never put this inspection in public telemetry. */
export function inspectWebBotAuthCandidates(request: Request): CandidateInspectionFailure | {
  status: 'ready'; matchedCandidates: number; inputMembers: number; signatureMembers: number; labels: readonly string[];
} {
  try {
    const context = candidateContext(request);
    return context.status === 'ready'
      ? { status: 'ready', matchedCandidates: context.candidates.length, inputMembers: context.inputMembers, signatureMembers: context.signatureMembers, labels: context.tagged.map(candidate => candidate.label) }
      : context;
  } catch { return { status: 'unverified', reason: 'verification-error' }; }
}

/** Verify one eligible label against the original message, preserving other
 * signature fields and covered context. This is a selected proof, not a
 * first-valid or exhaustive assessment. Used by the separately bounded audit.
 */
export async function verifyWebBotAuthCandidate(request: Request, label: string, options: WebBotAuthOptions): Promise<WebBotAuthResult> {
  try {
    const context = candidateContext(request);
    if (context.status !== 'ready') return context;
    const candidate = context.tagged.find(candidate => candidate.label === label);
    if (candidate === undefined) return { status: 'unverified', reason: 'no-web-bot-auth-signature' };
    const nowMs = verificationTime(options.now);
    if (nowMs === null) return { status: 'unverified', reason: 'invalid-verification-time' };
    const result = await verifyCandidate(request, candidate, context.parsedAgent, options.fetcher ?? fetch, options.cache ?? createWebBotAuthCache(), nowMs, options);
    return context.parsedAgent.form === 'bare-uri' && result.status !== 'verified'
      ? { status: 'unverified', reason: 'bare-uri-signature-agent' } : result;
  } catch { return { status: 'unverified', reason: 'verification-error' }; }
}
