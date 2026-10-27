import assert from 'node:assert/strict';
import test from 'node:test';
import { directoryLocation } from '../.test-dist/directory-discovery.js';
import { createWebBotAuthCache, verifyWebBotAuth } from '../.test-dist/webbotauth.js';
import { verificationEvidence } from '../.test-dist/signature-evidence.js';

test('directory URL policy preserves documented vendor origins and default HTTPS ports', () => {
  for (const origin of ['https://crawler.exa.ai', 'https://ahrefs.com', 'https://bot.duckduckgo.com', 'https://xn--bcher-kva.example']) {
    assert.deepEqual(directoryLocation(origin), { agent: origin, directoryUrl: origin + '/.well-known/http-message-signatures-directory' });
  }
  assert.equal(directoryLocation('https://crawler.exa.ai:443/').agent, 'https://crawler.exa.ai');
  // Do not silently collapse a signed DNS spelling into a different identity.
  assert.equal(directoryLocation('https://crawler.exa.ai./').agent, 'https://crawler.exa.ai.');
  // Syntax admission cannot tell where a DNS name resolves.
  assert.equal(directoryLocation('https://127.0.0.1.nip.io').agent, 'https://127.0.0.1.nip.io');
});

test('directory URL policy rejects literals, normalized IPv4 aliases and local names', () => {
  for (const target of ['127.0.0.1', '127.1', '2130706433', '0x7f000001', '0177.0.0.1', '10.0.0.1', '169.254.169.254', '[::1]', '[::ffff:127.0.0.1]', '[fe80::1]', '1.1.1.1', '[2606:4700:4700::1111]', 'localhost', 'service.localhost.', 'intranet', 'service.local', 'service.internal', 'service.home.arpa', 'fixture.example:8443', 'bad_label.example']) {
    assert.deepEqual(directoryLocation('https://' + target), { reason: 'discovery-policy-rejected' }, target);
  }
});

test('unsupported discovery locations remain distinct from URL admission policy', () => {
  for (const target of ['not a URL', 'http://crawler.exa.ai', 'https://user:password@crawler.exa.ai', 'https://crawler.exa.ai/keys', 'https://crawler.exa.ai/?key=1', 'https://crawler.exa.ai/#keys']) {
    assert.deepEqual(directoryLocation(target), { reason: 'invalid-signature-agent' });
  }
});

test('both supported wire forms reject discovery before cached keys or a fetch and preserve a closed outcome', async () => {
  const now = new Date('2026-10-27T19:00:00Z'), epoch = now.getTime() / 1000;
  const pair = await crypto.subtle.generateKey('Ed25519', false, ['sign', 'verify']);
  for (const dictionary of [true, false]) {
    let fetches = 0;
    const request = new Request('https://publication.example/article', { headers: {
      'Signature-Agent': dictionary ? 'sig="https://127.1";type=directory' : '"https://127.1"',
      'Signature-Input': `sig=("@authority" "signature-agent"${dictionary ? ';key="sig"' : ''});created=${epoch};expires=${epoch + 60};keyid="fixture";tag="web-bot-auth"`,
      Signature: `sig=:${Buffer.alloc(64).toString('base64')}:`,
    } });
    const cache = createWebBotAuthCache();
    cache.keys.set('https://127.0.0.1/.well-known/http-message-signatures-directory\nfixture', { key: pair.publicKey, keyPolicy: '2026-10-27.1', expiresAt: now.getTime() + 60000 });
    const result = await verifyWebBotAuth(request, { now, includeEvidence: true, cache, fetcher: async () => { fetches++; throw Error('must not fetch'); } });
    assert.deepEqual(result, { status: 'unverified', reason: 'discovery-policy-rejected' });
    assert.equal(fetches, 0);
    const evidence = verificationEvidence(request, result);
    assert.equal(evidence.localOutcome, 'policy-rejected');
    assert.equal(evidence.coverage, null);
    assert.equal(JSON.stringify(evidence).includes('127.'), false);
  }
});
