import { signatureAsciiFixture } from '../../../../analytics/test/fixtures/signature-ascii.mjs';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const output = process.argv[2];
if (!output) throw Error('Provide a new closed result path and optional verifier module');
const modulePath = process.argv[3] ? resolve(process.argv[3]) : new URL('../../../../analytics/.test-dist/webbotauth.js', import.meta.url);
const { verifyWebBotAuth, createWebBotAuthCache } = await import(typeof modulePath === 'string' ? pathToFileURL(modulePath).href : modulePath.href);
const fixture = await signatureAsciiFixture(), ascii = 'SyntheticClient/1.0';
const controls = [
  ['ascii', ascii, ascii, false], ['http-ows', ascii, ' \t' + ascii + '\t ', false],
  ['nbsp-mutation', ascii, '\u00a0' + ascii + '\u00a0', false],
  ['raw-utf8-interior', 'Synthetic\u00a0Client/1.0', 'Synthetic\u00a0Client/1.0', false],
  ['raw-utf8-boundary', '\u00a0' + ascii + '\u00a0', '\u00a0' + ascii + '\u00a0', false],
  ['signer-whitespace', ascii, ascii, true],
];
const rows = [];
for (const [label, signed, received, malformedSigner] of controls) {
  const headers = await fixture.headers(signed, received);
  if (malformedSigner) headers['Signature-Agent'] = '\u00a0' + headers['Signature-Agent'];
  const request = new Request('https://publication.example/article', { headers });
  let lookups = 0;
  const result = await verifyWebBotAuth(request, { includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async () => {
    lookups++; return Response.json({ keys: [fixture.jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
  } });
  rows.push({ label, localStatus: result.status, reason: result.reason ?? null, directoryLookups: lookups, coverageRecorded: result.evidence !== undefined });
}
await writeFile(output, JSON.stringify({ checkedAt: new Date().toISOString(), method: 'Independent fixed-layout ephemeral signer; directory intercepted in process. Raw UTF-8 crypto controls are not RFC-valid ASCII bases.',
  moduleSha256: createHash('sha256').update(await readFile(modulePath)).digest('hex'), rows, networkCalls: 0, productionCalls: 0 }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ controls: rows.length, verified: rows.filter(row => row.localStatus === 'verified').length, networkCalls: 0 }));
