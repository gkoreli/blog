// Local diagnostic probes, not production requests or a replacement test suite.
// Run from the repository root:
// pnpm -C packages/blog exec tsx drafts/research/newsletter-reliability/repro/audit.mjs
import assert from 'node:assert/strict';
import { initSubscribeForm } from '../../../../src/client/subscribe.ts';
import { handleSubscribe } from '../../../../../newsletter/src/subscribe.ts';
import { verifyTurnstile } from '../../../../../newsletter/src/turnstile.ts';
import { FetchTransport, BeaconTransport } from '../../../../../client-observability/src/transport.ts';
import { handleClientError } from '../../../../../client-observability/src/server.ts';
import { defaultRedact } from '../../../../../client-observability/src/redact.ts';

const result = { node: process.version, probes: {} };
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
const originalError = console.error;
const restoredGlobals = [];
function install(name, value) {
  restoredGlobals.push([name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

const event = {
  type: 'interaction_error', component: 'subscribe_form', message: 'Synthetic probe',
  path: '/', occurredAt: '2026-09-07T00:00:00.000Z',
};

function dbFixture({ fail = false } = {}) {
  const writes = [];
  return {
    writes,
    DB: { prepare(sql) { return { bind(...values) { return { async run() {
      if (fail) throw new Error('Synthetic D1 failure');
      writes.push({ sql, values });
      return { success: true };
    } }; } }; } },
  };
}

try {
  // No original fetch is reachable during a probe.
  globalThis.fetch = async () => { throw new Error('Unexpected external request in local probe'); };
  console.warn = () => {};
  console.error = () => {};
  install('location', { origin: 'https://gkoreli.com', pathname: '/', search: '' });

  const reports = [];
  const message = { textContent: '' };
  const button = { disabled: false };
  class SyntheticInput {
    value = 'synthetic@example.invalid';
    checkValidity() { return true; }
    reportValidity() { return true; }
  }
  install('HTMLInputElement', SyntheticInput);
  const input = new SyntheticInput();
  let widgetOptions;
  const listeners = new Map();
  const form = {
    dataset: { turnstileSitekey: 'synthetic-site-key' },
    elements: { namedItem: () => input },
    querySelector(selector) {
      if (selector === '.subscribe-btn') return button;
      if (selector === '.subscribe-msg') return message;
      if (selector === '.turnstile-slot') return {};
      return null;
    },
    addEventListener(name, handler) { listeners.set(name, handler); },
  };
  install('document', { getElementById: () => form, referrer: '' });
  install('window', { turnstile: {
    render(_container, options) { widgetOptions = options; return 'synthetic-widget'; },
    execute() {}, reset() {},
  } });
  initSubscribeForm({ logger: { report(value) { reports.push(value); } } });
  assert.ok(widgetOptions, 'Production initializer registered widget callbacks');
  const callbackResult = widgetOptions['error-callback']('110200');
  result.probes.widgetError = {
    messageShown: message.textContent,
    reportsSent: reports.length,
    callbackReturnsHandled: callbackResult === true,
    timeoutCallbackPresent: typeof widgetOptions['timeout-callback'] === 'function',
    unsupportedCallbackPresent: typeof widgetOptions['unsupported-callback'] === 'function',
  };

  let emailOrDbAttempted = false;
  let verificationCalls = 0;
  globalThis.fetch = async input => {
    assert.equal(String(input), 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    verificationCalls++;
    return Response.json({ success: false, 'error-codes': ['invalid-input-secret'] }, { status: 400 });
  };
  const response = await handleSubscribe(new Request('https://gkoreli.com/api/subscribe', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://gkoreli.com' },
    body: JSON.stringify({ email: 'synthetic@example.invalid', turnstile: 'synthetic-token' }),
  }), {
    TURNSTILE_SECRET_KEY: 'synthetic-invalid-secret', RESEND_API_KEY: 'unused',
    DB: { prepare() { emailOrDbAttempted = true; throw new Error('Unexpected DB access'); } },
  }, { waitUntil() { emailOrDbAttempted = true; throw new Error('Unexpected email send'); } });
  result.probes.invalidSecret = {
    responseStatus: response.status, responseBody: await response.json(),
    verificationCalls, emailOrDbAttempted,
  };
  assert.equal(emailOrDbAttempted, false);

  globalThis.fetch = async () => { throw new Error('Synthetic network failure'); };
  result.probes.verifierNetworkFailure = await verifyTurnstile('synthetic-token', 'synthetic-secret', '192.0.2.1');
  result.probes.missingSecret = await verifyTurnstile('synthetic-token', '', '192.0.2.1');

  let fallbackFetches = 0;
  globalThis.fetch = async () => { fallbackFetches++; return new Response(null, { status: 500 }); };
  install('navigator', { sendBeacon: () => true });
  await new BeaconTransport().send(event);
  result.probes.beaconQueued = { fallbackFetches, promiseResolved: true };
  await new FetchTransport().send(event);
  result.probes.fetchHttp500 = { promiseResolved: true };

  const largeFixture = dbFixture();
  const raw = {
    ...event,
    source: 'https://gkoreli.com/main.js?synthetic-secret=example',
    referrer: 'https://elsewhere.invalid/private/path?synthetic-secret=example',
    message: 'Synthetic address synthetic@example.invalid',
    extra: 'x'.repeat(9 * 1024),
  };
  const body = JSON.stringify(raw);
  const ingested = await handleClientError(new Request('https://gkoreli.com/api/client-error', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://elsewhere.invalid' }, body,
  }), largeFixture);
  const written = largeFixture.writes[0];
  result.probes.ingestion = {
    bodyBytes: Buffer.byteLength(body), contentLengthPresent: false,
    crossOriginRequestStatus: ingested.status, storedRows: largeFixture.writes.length,
    sourceQueryStored: written?.values.includes(raw.source) ?? false,
    externalReferrerPathAndQueryStored: written?.values.includes(raw.referrer) ?? false,
    messageAddressStored: written?.values.includes(raw.message) ?? false,
    occurredAtStored: written?.values.includes(event.occurredAt) ?? false,
  };

  const failingDb = dbFixture({ fail: true });
  const pending = [];
  const lost = await handleClientError(new Request('https://gkoreli.com/api/client-error', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(event),
  }), failingDb, { waitUntil(promise) { pending.push(promise); } });
  await Promise.all(pending);
  result.probes.failedPersistence = { responseStatus: lost.status, storedRows: failingDb.writes.length };

  const redacted = defaultRedact({ type: 'window_error', message: raw.message }, {
    path: '/api/confirm/synthetic-token?synthetic-secret=example', occurredAt: event.occurredAt,
  });
  result.probes.clientRedaction = {
    messageAddressRetained: redacted?.message === raw.message,
    sensitivePathSegmentRetained: redacted?.path === '/api/confirm/synthetic-token',
  };
} finally {
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
  console.error = originalError;
  for (const [name, descriptor] of restoredGlobals.reverse()) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
}
console.log(JSON.stringify(result, null, 2));
