import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSignatureBase, createWebBotAuthCache, ed25519JwkThumbprint, verifyWebBotAuth } from '../.test-dist/webbotauth.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';

test('independently signed repeated component identifiers fail before discovery; distinct dictionary members remain valid', async () => {
  const now = new Date('2026-10-27T18:00:00Z'), epoch = now.getTime() / 1000;
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const kid = await ed25519JwkThumbprint(jwk);
  const agent = '"signature-agent";key="sig"', other = '"signature-agent";key="other"';
  const values = { '"@authority"': 'publication.example', '"user-agent"': 'SyntheticClient/1.0', [agent]: '"https://fixture.example"', [other]: '"https://fixture.example"' };
  const cases = [
    ['"@authority"', '"@authority"', agent],
    ['"@authority"', '"user-agent"', '"user-agent"', agent],
    ['"@authority"', agent, agent],
    ['"@authority"', agent, other],
  ];
  for (const components of cases) {
    const duplicate = new Set(components).size !== components.length;
    const params = `(${components.join(' ')});created=${epoch};expires=${epoch + 300};keyid="${kid}";alg="ed25519";tag="web-bot-auth"`;
    // Deliberately do not use buildSignatureBase to sign: it must reject the
    // malformed structure even when the cryptographic bytes are correct.
    const base = [...components.map(component => `${component}: ${values[component]}`), `"@signature-params": ${params}`].join('\n');
    const signature = Buffer.from(await crypto.subtle.sign('Ed25519', pair.privateKey, new TextEncoder().encode(base))).toString('base64');
    const request = new Request('https://publication.example/article', { headers: {
      'User-Agent': 'SyntheticClient/1.0', 'Signature-Agent': 'sig="https://fixture.example", other="https://fixture.example"',
      'Signature-Input': `sig=${params}`, Signature: `sig=:${signature}:`,
    } });
    let fetches = 0;
    const result = await verifyWebBotAuth(request, { now, includeEvidence: true, cache: createWebBotAuthCache(), fetcher: async () => {
      fetches++;
      return Response.json({ keys: [jwk] }, { headers: { 'Content-Type': 'application/http-message-signatures-directory+json' } });
    } });
    if (duplicate) {
      assert.deepEqual(result, { status: 'unverified', reason: 'duplicate-component' });
      assert.equal(buildSignatureBase(request, 'sig'), null);
      assert.equal(fetches, 0);
      const evidence = verificationEvidence(request, result);
      assert.equal(evidence.localOutcome, 'invalid');
      assert.deepEqual(evidence.localReasons, ['duplicate-component']);
      assert.equal(evidence.coverage, null);
    } else {
      assert.equal(result.status, 'verified');
      assert.equal(fetches, 1);
      assert.equal(buildSignatureBase(request, 'sig'), base);
    }
  }
});
