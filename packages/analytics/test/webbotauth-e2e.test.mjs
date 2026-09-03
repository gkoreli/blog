import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import {
  buildSignatureBase,
  createWebBotAuthCache,
  ed25519JwkThumbprint,
  verifyWebBotAuth,
} from '../.test-dist/webbotauth.js';

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
}

test('local Ed25519 signer verifies and a changed covered component fails', async () => {
  const keyPair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const keyid = await ed25519JwkThumbprint(publicJwk);
  assert.notEqual(keyid, null);

  let directoryRequests = 0;
  const server = createServer((request, response) => {
    assert.equal(request.url, '/.well-known/http-message-signatures-directory');
    assert.equal(request.headers.accept, 'application/http-message-signatures-directory+json');
    directoryRequests += 1;
    response.writeHead(200, { 'Content-Type': 'application/http-message-signatures-directory+json' });
    response.end(JSON.stringify({ keys: [publicJwk] }));
  });
  let listenerUnavailable = false;
  try {
    await listen(server);
  } catch (error) {
    if (error?.code !== 'EPERM' && error?.code !== 'EACCES') throw error;
    listenerUnavailable = true;
  }

  try {
    const address = listenerUnavailable ? null : server.address();
    if (!listenerUnavailable) {
      assert.notEqual(address, null);
      assert.equal(typeof address, 'object');
    }
    const localDirectory = typeof address === 'object' && address !== null
      ? `http://127.0.0.1:${address.port}/.well-known/http-message-signatures-directory`
      : null;
    const agent = 'https://local-agent.test';
    const now = new Date();
    const created = Math.floor(now.getTime() / 1_000);
    const signatureAgent = `sig1="${agent}"`;
    const signatureInput = `sig1=("@method" "@authority" "@path" "signature-agent";key="sig1");created=${created};expires=${created + 300};keyid="${keyid}";alg="ed25519";tag="web-bot-auth"`;
    const unsigned = new Request('https://gkoreli.com/article', { headers: {
      'Signature-Agent': signatureAgent,
      'Signature-Input': signatureInput,
    } });
    const base = buildSignatureBase(unsigned, 'sig1');
    assert.notEqual(base, null);
    const signature = await crypto.subtle.sign(
      'Ed25519',
      keyPair.privateKey,
      new TextEncoder().encode(base),
    );
    const headers = {
      'Signature-Agent': signatureAgent,
      'Signature-Input': signatureInput,
      Signature: `sig1=:${Buffer.from(signature).toString('base64')}:`,
    };
    const fetcher = async (url, init) => {
      assert.equal(String(url), `${agent}/.well-known/http-message-signatures-directory`);
      if (localDirectory !== null) return fetch(localDirectory, init);
      directoryRequests += 1;
      return new Response(JSON.stringify({ keys: [publicJwk] }), {
        status: 200,
        headers: { 'Content-Type': 'application/http-message-signatures-directory+json' },
      });
    };
    const cache = createWebBotAuthCache();

    const verified = await verifyWebBotAuth(new Request('https://gkoreli.com/article', { headers }), {
      now,
      cache,
      fetcher,
    });
    assert.deepEqual(verified, { status: 'verified', agent });
    console.log(`web-bot-auth e2e: verified ${agent} (directory=${localDirectory === null ? 'in-process fallback' : localDirectory})`);

    const tampered = await verifyWebBotAuth(new Request('https://gkoreli.com/tampered', { headers }), {
      now,
      cache,
      fetcher,
    });
    assert.deepEqual(tampered, { status: 'unverified', reason: 'signature-invalid' });
    assert.equal(directoryRequests, 1);
    console.log('web-bot-auth e2e: changed @path -> unverified (signature-invalid)');
  } finally {
    if (server.listening) await close(server);
  }
});
