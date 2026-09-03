const DIRECTORY_PATH = '/.well-known/http-message-signatures-directory';
const DIRECTORY_TTL_MS = 60 * 60 * 1_000;
const CLOCK_SKEW_SECONDS = 60;
const encoder = new TextEncoder();

export type WebBotAuthResult =
  | { status: 'verified'; agent: string }
  | { status: 'unverified'; reason: string }
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
  keys: JsonWebKey[];
}

interface KeyEntry {
  expiresAt: number;
  key: CryptoKey;
}

export interface WebBotAuthCache {
  directories: Map<string, DirectoryEntry>;
  keys: Map<string, KeyEntry>;
  pendingDirectories: Map<string, Promise<DirectoryEntry | null>>;
}

export interface WebBotAuthOptions {
  now?: Date;
  fetcher?: typeof fetch;
  cache?: WebBotAuthCache;
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

function parseSignatureAgentEntries(value: string): ParsedSignatureAgent | null {
  const trimmed = value.trim();
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
  return value.replace(/[ \t]*\r?\n[ \t]+/g, ' ').trim();
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
): { value: string; signatureAgentUri: string | null } | null {
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
  return value === null ? null : { value: normalizeFieldValue(value), signatureAgentUri: null };
}

interface SignatureBaseResult {
  base: string;
  signatureAgentUri: string | null;
  coveredAuthority: boolean;
  coveredTargetUri: boolean;
}

function createSignatureBase(
  request: Request,
  input: InnerList,
  parsedAgent: ParsedSignatureAgent | null,
): SignatureBaseResult | null {
  const lines: string[] = [];
  let signatureAgentUri: string | null = null;
  let coveredAuthority = false;
  let coveredTargetUri = false;

  for (const component of input.items) {
    const resolved = componentValue(request, component, parsedAgent);
    if (resolved === null) return null;
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
  return { base: lines.join('\n'), signatureAgentUri, coveredAuthority, coveredTargetUri };
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
  return createSignatureBase(request, entry.member.value, parsedAgent)?.base ?? null;
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function okpJwk(value: unknown): JsonWebKey | null {
  if (!isRecord(value)) return null;
  if (value.kty !== 'OKP' || value.crv !== 'Ed25519' || typeof value.x !== 'string') return null;
  if (value.use !== undefined && value.use !== 'sig') return null;
  if (value.key_ops !== undefined) {
    if (!Array.isArray(value.key_ops) || !value.key_ops.every((operation) => typeof operation === 'string')) return null;
    if (!value.key_ops.includes('verify')) return null;
  }
  const result: JsonWebKey = { kty: value.kty, crv: value.crv, x: value.x };
  return result;
}

export async function ed25519JwkThumbprint(value: unknown): Promise<string | null> {
  try {
    const jwk = okpJwk(value);
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
  if (cached !== undefined && cached.expiresAt > nowMs) return cached;
  if (cached !== undefined) cache.directories.delete(directoryUrl);

  const pending = cache.pendingDirectories.get(directoryUrl);
  if (pending !== undefined) return pending;

  const load = async (): Promise<DirectoryEntry | null> => {
    try {
      const response = await fetcher(directoryUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: { Accept: 'application/http-message-signatures-directory+json' },
      });
      if (response.status !== 200) return null;
      const body: unknown = await response.json();
      if (!isRecord(body) || !Array.isArray(body.keys)) return null;
      const keys: JsonWebKey[] = [];
      for (const value of body.keys) {
        const jwk = okpJwk(value);
        if (jwk !== null) keys.push(jwk);
      }
      const entry = { keys, expiresAt: nowMs + DIRECTORY_TTL_MS };
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
): Promise<CryptoKey | null> {
  const cacheKey = pairKey(directoryUrl, keyid);
  const cached = cache.keys.get(cacheKey);
  if (cached !== undefined && cached.expiresAt > nowMs) return cached.key;
  if (cached !== undefined) cache.keys.delete(cacheKey);

  const directory = await fetchDirectory(directoryUrl, fetcher, cache, nowMs);
  if (directory === null) return null;
  for (const jwk of directory.keys) {
    if (await ed25519JwkThumbprint(jwk) !== keyid) continue;
    try {
      const key = await crypto.subtle.importKey('jwk', jwk, 'Ed25519', false, ['verify']);
      cache.keys.set(cacheKey, { key, expiresAt: directory.expiresAt });
      return key;
    } catch {
      return null;
    }
  }
  return null;
}

function agentLocation(uri: string): { agent: string; directoryUrl: string } | null {
  try {
    const url = new URL(uri);
    if (url.protocol !== 'https:' || url.username.length > 0 || url.password.length > 0) return null;
    return { agent: url.origin, directoryUrl: `${url.origin}${DIRECTORY_PATH}` };
  } catch {
    return null;
  }
}

async function verifyCandidate(
  request: Request,
  candidate: SignatureCandidate,
  parsedAgent: ParsedSignatureAgent,
  fetcher: typeof fetch,
  cache: WebBotAuthCache,
  nowMs: number,
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

  const algorithm = parameter(candidate.input.parameters, 'alg');
  if (algorithm !== undefined && stringValue(algorithm) !== 'ed25519') {
    return { status: 'unverified', reason: 'unsupported-alg' };
  }
  const keyid = stringValue(parameter(candidate.input.parameters, 'keyid'));
  if (keyid === null || keyid.length === 0) return { status: 'unverified', reason: 'missing-keyid' };

  const signatureBase = createSignatureBase(request, candidate.input, parsedAgent);
  if (signatureBase === null) return { status: 'unverified', reason: 'unsupported-or-missing-component' };
  if (!signatureBase.coveredAuthority && !signatureBase.coveredTargetUri) {
    return { status: 'unverified', reason: 'missing-target-component' };
  }
  if (signatureBase.signatureAgentUri === null) {
    return { status: 'unverified', reason: 'unsupported-or-missing-component' };
  }
  const location = agentLocation(signatureBase.signatureAgentUri);
  if (location === null) return { status: 'unverified', reason: 'invalid-signature-agent' };

  const key = await resolveVerificationKey(location.directoryUrl, keyid, fetcher, cache, nowMs);
  if (key === null) return { status: 'unverified', reason: 'key-unavailable' };
  try {
    const verified = await crypto.subtle.verify(
      'Ed25519',
      key,
      candidate.signature,
      encoder.encode(signatureBase.base),
    );
    return verified
      ? { status: 'verified', agent: location.agent }
      : { status: 'unverified', reason: 'signature-invalid' };
  } catch {
    return { status: 'unverified', reason: 'signature-invalid' };
  }
}

/**
 * Implements draft-ietf-webbotauth-httpsig-protocol-00 on RFC 9421 request
 * components. The implementation was checked against Cloudflare's Apache-2.0
 * reference, but is dependency-free and independently written:
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
    const nowMs = (options.now ?? new Date()).getTime();
    let lastFailure: WebBotAuthResult = { status: 'unverified', reason: 'signature-invalid' };
    for (const candidate of tagged) {
      const result = await verifyCandidate(request, candidate, parsedAgent, fetcher, cache, nowMs);
      if (result.status === 'verified') return result;
      lastFailure = result;
    }
    return parsedAgent.form === 'bare-uri'
      ? { status: 'unverified', reason: 'bare-uri-signature-agent' }
      : lastFailure;
  } catch {
    return { status: 'unverified', reason: 'verification-error' };
  }
}
