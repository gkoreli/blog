import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { buildSignatureBase } from '../../../../analytics/.test-dist/webbotauth.js';
import { VERIFIER_PROFILE_VERSION } from '../../../../analytics/.test-dist/versions.js';

const output = process.argv[2], referencePath = process.argv[3];
if (!output || !referencePath) throw Error('Provide a new closed result path and a local compiled reference module');
const referenceModule = resolve(referencePath);
const { createSignature } = await import(pathToFileURL(referenceModule).href);
if (typeof createSignature !== 'function') throw Error('Reference createSignature API unavailable');
const parameters = { created: 1793145000, expires: 1793145300, keyid: 'fixture-key', alg: 'ed25519', tag: 'web-bot-auth' };
const usual = ['@authority', '@method', '@path', '@query', '@scheme', { name: 'signature-agent', parameters: { key: 'sig' } }];
const cases = [
  ['ordinary', 'https://publication.example/a?x=1', 'GET', {}, usual],
  ['empty-query', 'https://publication.example/a?', 'GET', {}, usual],
  ['no-query', 'https://publication.example/a', 'GET', {}, usual],
  ['encoded-target', 'https://publication.example/a%2Fb/%7e?q=%2F&z=two+words', 'GET', {}, ['@target-uri', ...usual]],
  ['default-port', 'https://PUBLICATION.example:443/a', 'GET', {}, usual],
  ['ipv6', 'https://[2001:db8::1]:8443/a?x=y', 'GET', {}, usual],
  ['mixed-method', 'https://publication.example/a', 'CuStOm', {}, usual],
  ['interior-whitespace', 'https://publication.example/a', 'GET', { 'x-fixture': 'a \t b' }, [...usual, 'x-fixture']],
  ['non-ascii-covered', 'https://publication.example/a', 'GET', { 'x-fixture': 'a\u00a0b' }, [...usual, 'x-fixture']],
  ['non-ascii-uncovered', 'https://publication.example/a', 'GET', { 'x-fixture': 'a\u00a0b' }, usual],
  ['ascii-control-covered', 'https://publication.example/a', 'GET', { 'x-fixture': 'a\u0001b' }, [...usual, 'x-fixture']],
  ['del-covered', 'https://publication.example/a', 'GET', { 'x-fixture': 'a\u007fb' }, [...usual, 'x-fixture']],
  ['fragment', 'https://publication.example/a?x=1#fragment', 'GET', {}, usual],
];
const knownErrors = new Set(['MissingField', 'MalformedField', 'InvalidComponent', 'UnsupportedFeature', 'DuplicateComponent']);
function errorCode(error) {
  return typeof error === 'object' && error !== null && knownErrors.has(error.code) ? error.code : 'unrecognized-reference-error';
}
async function referenceInput(message, components) {
  let base = null;
  try {
    const fields = await createSignature(message, { label: 'sig', components, parameters, signer: {
      algorithm: 'ed25519', sign: async bytes => { base = Buffer.from(bytes); return new Uint8Array(64); },
    } });
    return { base, fields, error: null };
  } catch (error) { return { base: null, fields: null, error: errorCode(error) }; }
}
function fallbackInput(components) {
  const identifiers = components.map(value => typeof value === 'string' ? JSON.stringify(value)
    : JSON.stringify(value.name) + ';key=' + JSON.stringify(value.parameters.key)).join(' ');
  return 'sig=(' + identifiers + ');created=1793145000;expires=1793145300;keyid="fixture-key";alg="ed25519";tag="web-bot-auth"';
}
const hash = bytes => bytes === null ? null : createHash('sha256').update(bytes).digest('hex');
const rows = [];
for (const [name, url, method, extra, components] of cases) {
  const request = new Request(url, { method, headers: { 'Signature-Agent': 'sig="https://fixture.example";type=directory', ...extra } });
  const native = await referenceInput(request, components);
  const descriptor = await referenceInput({ kind: 'request', method: request.method, targetUri: request.url,
    fields: [...request.headers].map(([name, value]) => ({ name, value })),
  }, components);
  // A rejected reference request may produce no Signature-Input; the fixture's
  // known ordered components/params supply the independent local input then.
  const headers = new Headers(request.headers);
  headers.set('Signature-Input', native.fields?.signatureInput ?? fallbackInput(components));
  const local = buildSignatureBase(new Request(request, { headers }), 'sig');
  const localBytes = local === null ? null : Buffer.from(local, 'utf8');
  rows.push({ name, nativeReferenceProducedBase: native.base !== null, descriptorReferenceProducedBase: descriptor.base !== null,
    nativeReferenceError: native.error, descriptorReferenceError: descriptor.error, localProducedBase: local !== null,
    localEqualsNative: localBytes !== null && native.base !== null ? localBytes.equals(native.base) : null,
    localEqualsDescriptor: localBytes !== null && descriptor.base !== null ? localBytes.equals(descriptor.base) : null,
    nativeBaseSha256: hash(native.base), descriptorBaseSha256: hash(descriptor.base), localBaseSha256: hash(localBytes),
    nativeBaseContainsNonAscii: native.base !== null ? native.base.some(byte => byte > 127) : null,
    nativeBaseContainsInvalidFieldControl: native.base !== null ? native.base.some(byte => byte < 32 && byte !== 9 && byte !== 10 || byte === 127) : null,
  });
}
await writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), runtime: process.version, verifierProfile: VERIFIER_PROFILE_VERSION,
  method: 'Execute pinned reference public createSignature with a base-capturing fixture signer and compare actual bytes. Static signature parameters test construction, not verification or time policy.',
  nativeReferenceMeaning: 'JavaScript Request input path in Node; not a Cloudflare edge/native bot verdict.',
  referenceModuleSha256: hash(await readFile(referenceModule)), rows, networkCalls: 0, productionCalls: 0,
}, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ controls: rows.length, byteEqualProducedBases: rows.filter(row => row.localEqualsNative === true).length, networkCalls: 0 }));
