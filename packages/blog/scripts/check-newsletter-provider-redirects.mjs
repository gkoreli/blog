import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sendConfirmationEmail } from '../../newsletter/src/email.ts';
import { verifyTurnstile } from '../../newsletter/src/turnstile.ts';

// Local native Fetch control only. Actual adapter inputs/options are retained;
// the two known provider destinations are remapped onto an owned redirect server.
const nativeFetch = globalThis.fetch;
let targetCalls = 0;
let originCalls = 0;
const target = http.createServer(async (request, response) => {
  targetCalls++;
  for await (const _chunk of request) { /* Never retain or print request bodies. */ }
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ success: true, hostname: 'gkoreli.com', id: 'synthetic-provider-id' }));
});
const origin = http.createServer((_request, response) => {
  originCalls++;
  const address = target.address();
  if (!address || typeof address === 'string') throw new Error('Missing owned target address');
  response.writeHead(307, { location: `http://127.0.0.1:${address.port}/capture` });
  response.end();
});

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
}

try {
  await listen(target);
  await listen(origin);
  const address = origin.address();
  if (!address || typeof address === 'string') throw new Error('Missing owned origin address');
  globalThis.fetch = (url, init) => {
    assert.ok(['https://api.resend.com/emails', 'https://challenges.cloudflare.com/turnstile/v0/siteverify'].includes(String(url)),
      'Only provider calls from the adapters are allowed');
    return nativeFetch(`http://127.0.0.1:${address.port}/provider`, init);
  };
  const verification = await verifyTurnstile('synthetic-token', 'synthetic-secret', '192.0.2.1', 'gkoreli.com');
  const delivery = await sendConfirmationEmail('synthetic-key', 'reader@example.invalid',
    'https://example.invalid/confirm/synthetic', 'https://example.invalid/optout/synthetic',
    '12345678-1234-4234-8234-123456789abc');
  assert.equal(verification.ok, false);
  assert.equal(verification.kind, 'unavailable');
  assert.equal(verification.attempts, 1);
  assert.equal(verification.reason, 'verifier_redirect');
  assert.equal(delivery.outcome, 'unknown');
  assert.equal(delivery.diagnostics.attempts, 1);
  assert.equal(delivery.diagnostics.retryReason, 'none');
  assert.equal(delivery.diagnostics.stopReason, 'redirect-rejected');
  assert.equal(originCalls, 2);
  assert.equal(targetCalls, 0, 'Redirect targets must never receive secret or message bodies');
  console.log(JSON.stringify({ control: 'local native 307 redirect', originCalls, targetCalls,
    verification: verification.reason, delivery: delivery.outcome, deliveryStop: delivery.diagnostics.stopReason }));
} finally {
  globalThis.fetch = nativeFetch;
  origin.closeAllConnections();
  target.closeAllConnections();
  await Promise.all([new Promise(resolve => origin.close(resolve)), new Promise(resolve => target.close(resolve))]);
}

// Check the actual deployment runtime too: Node supports redirect:error, while
// this Workers compatibility contract requires manual plus a status guard.
const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const rootRequire = createRequire(`${repo}/package.json`);
const blogRequire = createRequire(`${repo}/packages/blog/package.json`);
const { Miniflare } = await import(pathToFileURL(rootRequire.resolve('miniflare', {
  paths: [dirname(rootRequire.resolve('wrangler/package.json'))],
})));
const { build } = await import(pathToFileURL(blogRequire.resolve('esbuild')));
const bundle = await build({
  stdin: {
    resolveDir: `${repo}/packages/blog`,
    contents: `
      import { verifyTurnstile } from '../newsletter/src/turnstile.ts';
      import { sendConfirmationEmail } from '../newsletter/src/email.ts';
      export default { async fetch(request) {
        if (new URL(request.url).pathname === '/follow-control') {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST', headers: { Authorization: 'Bearer synthetic-key', 'Idempotency-Key': 'synthetic-follow-control' },
            body: JSON.stringify({ to: 'reader@example.invalid', text: 'synthetic-forward-body' }),
          });
          return Response.json({ status: response.status });
        }
        if (new URL(request.url).pathname === '/capability') {
          let errorMode;
          try { new Request('https://example.invalid', { redirect: 'error' }); errorMode = 'constructed'; }
          catch (error) { errorMode = error instanceof TypeError ? 'throws-TypeError' : 'other-error'; }
          return Response.json({ errorMode });
        }
        return Response.json({
          verification: await verifyTurnstile('synthetic-token', 'synthetic-secret', '192.0.2.1', 'gkoreli.com'),
          delivery: await sendConfirmationEmail('synthetic-key', 'reader@example.invalid',
            'https://example.invalid/confirm/synthetic', 'https://example.invalid/optout/synthetic',
            '12345678-1234-4234-8234-123456789abc'),
        });
      } };
    `,
  },
  bundle: true, write: false, format: 'esm', platform: 'browser', target: 'es2024',
});
let mode = 'ok';
let workerdProviderCalls = 0;
let workerdTargetCalls = 0;
let workerdAuthorizationForwarded = false;
let workerdBodyForwarded = false;
const worker = new Miniflare({
  modules: true, script: bundle.outputFiles[0].text, compatibilityDate: '2026-03-06', cf: {},
  outboundService: async request => {
    const url = new URL(request.url);
    if (url.hostname === 'redirect-target.invalid') {
      workerdTargetCalls++;
      workerdAuthorizationForwarded = request.headers.get('authorization') === 'Bearer synthetic-key';
      workerdBodyForwarded = (await request.text()).includes('synthetic-forward-body');
      return Response.json({ success: true, hostname: 'gkoreli.com', id: 'synthetic-provider-id' });
    }
    assert.ok(['challenges.cloudflare.com', 'api.resend.com'].includes(url.hostname), 'Unexpected external destination');
    workerdProviderCalls++;
    const body = await request.json();
    if (url.hostname === 'challenges.cloudflare.com') {
      assert.equal(body.secret, 'synthetic-secret');
      assert.equal(body.response, 'synthetic-token');
    } else {
      assert.equal(body.to, 'reader@example.invalid');
      assert.ok(request.headers.get('Idempotency-Key'));
    }
    if (mode === 'redirect') return new Response(null, {
      status: 307, headers: { location: 'https://redirect-target.invalid/capture' },
    });
    return Response.json(url.hostname === 'challenges.cloudflare.com'
      ? { success: true, hostname: 'gkoreli.com', action: 'subscribe' }
      : { id: 'synthetic-provider-id' });
  },
});
try {
  const capability = await (await worker.dispatchFetch('https://fixture.invalid/capability')).json();
  const positive = await (await worker.dispatchFetch('https://fixture.invalid/providers')).json();
  assert.equal(positive.verification.ok, true, 'The real runtime must still send ordinary provider requests');
  assert.equal(positive.delivery.outcome, 'accepted');
  assert.equal(workerdProviderCalls, 2);
  mode = 'redirect';
  const refused = await (await worker.dispatchFetch('https://fixture.invalid/providers')).json();
  assert.equal(refused.verification.ok, false);
  assert.equal(refused.verification.reason, 'verifier_redirect');
  assert.equal(refused.verification.attempts, 1);
  assert.equal(refused.delivery.outcome, 'unknown');
  assert.equal(refused.delivery.diagnostics.stopReason, 'redirect-rejected');
  assert.equal(refused.delivery.diagnostics.attempts, 1);
  assert.equal(workerdProviderCalls, 4);
  assert.equal(workerdTargetCalls, 0);
  console.log(JSON.stringify({ control: 'workerd provider and redirect boundaries', compatibilityDate: '2026-03-06',
    errorMode: capability.errorMode, providerCalls: workerdProviderCalls, targetCalls: workerdTargetCalls,
    ordinaryVerification: positive.verification.ok, ordinaryConfirmation: positive.delivery.outcome,
    redirectedVerification: refused.verification.reason, redirectedDelivery: refused.delivery.diagnostics.stopReason }));
  const defaultFollow = await (await worker.dispatchFetch('https://fixture.invalid/follow-control')).json();
  assert.equal(defaultFollow.status, 200);
  assert.equal(workerdTargetCalls, 1);
  // Header stripping can differ by runtime/bridge. The body-forwarding control
  // is the invariant motivating confinement; do not infer safety from auth alone.
  assert.equal(workerdBodyForwarded, true);
  console.log(JSON.stringify({ control: 'workerd default-follow counterexample', targetCalls: workerdTargetCalls,
    authorizationForwarded: workerdAuthorizationForwarded, bodyForwarded: workerdBodyForwarded }));
} finally {
  await worker.dispose();
}
