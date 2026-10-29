/** Fetch Metadata Item semantics: W3C WD 2026-09-21 / RFC 9651 §4.2.
 * Bounded field-specific parser, not a general Structured Fields API. Parameters
 * are validated completely then discarded; their arbitrary text is never retained.
 * See research 90 for source comparisons, native controls and policy limits. */
export const FETCH_METADATA_STATES = ['not-assessed', 'absent', 'valid', 'unrecognized', 'invalid', 'policy-limit'] as const;
export type FetchMetadataState = typeof FETCH_METADATA_STATES[number];
export const FETCH_METADATA_MAX_LENGTH = 32768;
export const FETCH_METADATA_TOKENS = {
  mode: ['cors', 'navigate', 'no-cors', 'same-origin', 'websocket'],
  dest: ['empty', 'audio', 'audioworklet', 'document', 'embed', 'font', 'frame', 'iframe', 'image', 'json', 'manifest', 'object', 'paintworklet', 'report', 'script', 'serviceworker', 'sharedworker', 'style', 'text', 'track', 'video', 'webidentity', 'worker', 'xslt'],
  site: ['cross-site', 'same-origin', 'same-site', 'none'],
} as const;
const modes: ReadonlySet<string> = new Set(FETCH_METADATA_TOKENS.mode);
const destinations: ReadonlySet<string> = new Set(FETCH_METADATA_TOKENS.dest);
const sites: ReadonlySet<string> = new Set(FETCH_METADATA_TOKENS.site);
type BareItem = { type: 'token'; value: string } | { type: 'boolean'; value: boolean } | { type: 'other' };

class ItemParser {
  private position = 0;
  constructor(private readonly input: string) {}
  private fail(): never { throw new Error('invalid-structured-item'); }
  private spaces(): void { while (this.input[this.position] === ' ') this.position++; }
  private number(decimal: boolean): void {
    const match = /^-?[0-9]+(?:\.[0-9]+)?/.exec(this.input.slice(this.position));
    if (!match) this.fail();
    const value = match[0], parts = value.replace(/^-/, '').split('.');
    if (parts.length === 2) {
      if (!decimal || parts[0].length > 12 || parts[1].length > 3) this.fail();
    } else if (parts[0].length > 15) this.fail();
    this.position += value.length;
  }
  private string(display: boolean): void {
    this.position += display ? 2 : 1;
    const bytes: number[] = [];
    while (this.position < this.input.length) {
      const char = this.input[this.position++];
      if (char === '"') {
        if (display) new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(new Uint8Array(bytes));
        return;
      }
      if (display && char === '%') {
        const hex = this.input.slice(this.position, this.position + 2);
        if (!/^[0-9a-f]{2}$/.test(hex)) this.fail();
        bytes.push(Number.parseInt(hex, 16)); this.position += 2;
      } else if (!display && char === '\\') {
        if (!['"', '\\'].includes(this.input[this.position++] ?? '')) this.fail();
      } else {
        if (char.charCodeAt(0) < 0x20 || char.charCodeAt(0) > 0x7e) this.fail();
        if (display) bytes.push(char.charCodeAt(0));
      }
    }
    this.fail();
  }
  private bare(): BareItem {
    const char = this.input[this.position];
    if (char === undefined) this.fail();
    if (/[A-Za-z*]/.test(char)) {
      const start = this.position++;
      while (this.position < this.input.length && /[!#$%&'*+\-.^_`|~A-Za-z0-9:\/]/.test(this.input[this.position])) this.position++;
      return { type: 'token', value: this.input.slice(start, this.position) };
    }
    if (char === '?') {
      const value = this.input[++this.position];
      if (value !== '0' && value !== '1') this.fail();
      this.position++; return { type: 'boolean', value: value === '1' };
    }
    if (char === '"' || this.input.slice(this.position, this.position + 2) === '%"') this.string(char === '%');
    else if (char === ':') {
      const end = this.input.indexOf(':', this.position + 1);
      if (end < 0) this.fail();
      const encoded = this.input.slice(this.position + 1, end);
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) this.fail();
      atob(encoded); this.position = end + 1;
    } else if (char === '@') { this.position++; this.number(false); }
    else if (/[-0-9]/.test(char)) this.number(true);
    else this.fail();
    return { type: 'other' };
  }
  parse(): { item: BareItem; parameters: boolean } {
    this.spaces();
    const item = this.bare(); let parameters = false;
    while (this.input[this.position] === ';') {
      parameters = true; this.position++; this.spaces();
      const key = /^[a-z*][a-z0-9_.*-]*/.exec(this.input.slice(this.position));
      if (!key) this.fail();
      this.position += key[0].length;
      if (this.input[this.position] === '=') { this.position++; this.bare(); }
      // Duplicate parameter names are legal (last wins); values have no local
      // semantics, but every occurrence must parse, including overwritten ones.
    }
    this.spaces();
    if (this.position !== this.input.length) this.fail();
    return { item, parameters };
  }
}

/** Internal parser boundary exposed for independent corpus/native checks. */
export function parseMetadataItem(value: string): { item: BareItem; parameters: boolean } {
  if (value.length > FETCH_METADATA_MAX_LENGTH || /[^\x20-\x7e]/.test(value)) throw new Error('unsupported-metadata-item');
  return new ItemParser(value).parse();
}

export interface FetchMetadataField {
  state: FetchMetadataState;
  value: string | boolean | null;
  parameters: boolean;
}
export function parseFetchMetadataField(value: string | null, field: 'mode' | 'dest' | 'site' | 'user'): FetchMetadataField {
  if (value === null) return { state: 'absent', value: null, parameters: false };
  if (value.length > FETCH_METADATA_MAX_LENGTH) return { state: 'policy-limit', value: null, parameters: false };
  try {
    // HTTP Structured Fields are ASCII; JS trim() would erase extra characters.
    const { item, parameters } = parseMetadataItem(value);
    if (field === 'user') return item.type === 'boolean'
      ? { state: 'valid', value: item.value, parameters }
      : { state: 'invalid', value: null, parameters };
    if (item.type !== 'token') return { state: 'invalid', value: null, parameters };
    const known = (field === 'mode' ? modes : field === 'dest' ? destinations : sites).has(item.value);
    return { state: known ? 'valid' : 'unrecognized', value: known ? item.value : null, parameters };
  } catch { return { state: 'invalid', value: null, parameters: false }; }
}

/** Encoding v1: mode/dest/site/user states at 3-bit offsets 0/3/6/9;
 * parameter-presence flags at bits 12/13/14/15. Zero is unassessed history.
 * Fixed assignments: 0 unassessed, 1 absent, 2 valid, 3 unrecognized,
 * 4 invalid, 5 policy limit. Unknown encodings never become assessed facts. */
export function fetchMetadataFields(bits: unknown): { states: FetchMetadataState[]; parameters: boolean[] } | null {
  if (typeof bits !== 'number' || !Number.isInteger(bits) || bits < 0 || bits > 65535) return null;
  const codes = [0, 3, 6, 9].map(shift => (bits >> shift) & 7);
  if (codes.some(code => code > 5)) return null;
  const parameters = [12, 13, 14, 15].map(shift => (bits & (1 << shift)) !== 0);
  if (codes.some((code, index) => parameters[index] && ![2, 3, 4].includes(code))) return null;
  return { states: codes.map(code => FETCH_METADATA_STATES[code]), parameters };
}
export function extractFetchMetadata(headers: Headers) {
  const fields = (['mode', 'dest', 'site', 'user'] as const).map(field => parseFetchMetadataField(headers.get('Sec-Fetch-' + field), field));
  const token = (index: number): string | null => typeof fields[index].value === 'string' ? fields[index].value : null;
  return {
    secFetchMode: token(0), secFetchDest: token(1), secFetchSite: token(2),
    secFetchUser: typeof fields[3].value === 'boolean' ? Number(fields[3].value) : null,
    fetchMetadataBits: fields.reduce((bits, field, index) => bits | (FETCH_METADATA_STATES.indexOf(field.state) << (index * 3)) | (field.parameters ? 1 << (12 + index) : 0), 0),
  };
}
