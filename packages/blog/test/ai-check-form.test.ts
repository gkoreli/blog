import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { readFileSync } from 'node:fs';
import { renderContent } from '../src/lib/ssg.js';
import { aiCheckPage } from '../src/pages/ai-check.js';
import { isSiteAuditReport } from '@gkoreli/site-audit/report-validation';

const saved: unknown = JSON.parse(readFileSync(new URL('../public/ai-check-example.json', import.meta.url), 'utf8'));
const report = typeof saved === 'object' && saved !== null && 'report' in saved ? saved.report : saved;
assert.ok(isSiteAuditReport(report));
const [snapshot] = await renderContent([aiCheckPage()]); assert.ok(snapshot);

async function setup(t: TestContext) {
  const view = document.defaultView; assert.ok(view);
  t.after(() => { document.body.replaceChildren(); });
  for (const name of ['Element', 'HTMLFormElement', 'HTMLInputElement', 'HTMLButtonElement'] as const) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value: view[name] });
    t.after(() => { if (previous) Object.defineProperty(globalThis, name, previous); else Reflect.deleteProperty(globalThis, name); });
  }
  await import('../src/client/ai-check.js');
  document.body.innerHTML = snapshot;
  const component = document.querySelector('site-audit-check'), form = document.querySelector('site-audit-check form'), input = document.querySelector('#ai-check-url'),
    button = document.querySelector('site-audit-check button'), error = document.querySelector('[data-audit-field-error]'),
    status = document.querySelector('[data-audit-status]'), results = document.querySelector('[data-audit-results]'), example = document.querySelector('[data-example-check]');
  assert.ok(component instanceof HTMLElement); assert.ok(form instanceof HTMLFormElement); assert.ok(input instanceof HTMLInputElement);
  assert.ok(button instanceof HTMLButtonElement); assert.ok(error instanceof HTMLElement); assert.ok(status instanceof HTMLElement); assert.ok(results instanceof HTMLElement); assert.ok(example instanceof HTMLElement);
  return { component, form, input, button, error, status, results, example, view };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
function deferred<T>() {
  let resolve: (value: T) => void = () => { throw new Error('Deferred promise not initialized'); };
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

test('form accepts bare domains and pasted whitespace, exposes HTTPS and submits once', async t => {
  const { form, input, error } = await setup(t);
  const calls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (_input: unknown, init?: RequestInit) => {
    calls.push(String(init?.body));
    return Response.json({ report, quota: { limit: 10, remaining: 9, resetAt: '2026-11-07T00:00:00Z' } });
  });
  for (const [typed, normalized] of [['reddit.com', 'https://reddit.com/'], ['  reddit.com/r/webdev  ', 'https://reddit.com/r/webdev'], ['https://reddit.com/', 'https://reddit.com/']] as const) {
    input.value = typed; form.requestSubmit(); await settle();
    assert.equal(input.value, normalized); assert.equal(input.hasAttribute('aria-invalid'), false); assert.equal(error.hidden, true);
    assert.equal(calls.at(-1), JSON.stringify({ url: normalized }));
  }
  assert.equal(calls.length, 3);
});

test('invalid input has a specific inline error and focus, preserves evidence and never fetches', async t => {
  const { form, input, error, results, view } = await setup(t);
  results.textContent = 'Previous report stays available';
  t.mock.method(globalThis, 'fetch', async () => { assert.fail('Validation must happen before network or admission'); });
  for (const [typed, message] of [
    ['', /Enter a public page/], ['   ', /Enter a public page/], ['http://reddit.com', /Use an HTTPS page/],
    ['reddit.com/r/web dev', /Remove spaces/], ['https://user:password@reddit.com', /username and password/],
    ['reddit.com/?secret=value', /query string/], ['reddit.com/#section', /page fragment/], ['reddit.com/?', /query string/],
    ['reddit.com:8443', /custom port/], ['localhost', /public domain name/], ['127.0.0.1', /public domain name/],
    ['javascript:alert(1)', /HTTPS page/], ['https://reddit.com/' + 'a'.repeat(2048), /2,048 characters/],
  ] as const) {
    input.value = typed; form.requestSubmit(); await settle();
    assert.equal(input.value, typed); assert.equal(input.getAttribute('aria-invalid'), 'true'); assert.equal(document.activeElement, input);
    assert.equal(error.hidden, false); assert.match(error.textContent ?? '', message); assert.equal(results.textContent, 'Previous report stays available');
    input.dispatchEvent(new view.Event('input', { bubbles: true }));
    assert.equal(input.hasAttribute('aria-invalid'), false); assert.equal(error.hidden, true); assert.equal(error.textContent, '');
  }
});

test('correcting an inline error submits normally and a quota response retains prior evidence', async t => {
  const { form, input, error, results, status, view } = await setup(t);
  results.textContent = 'Previous report';
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ error: 'Daily allowance used.', quota: { limit: 10, remaining: 0, resetAt: '2026-11-07T00:00:00Z' } }, { status: 429 }); });
  input.value = 'http://reddit.com'; form.requestSubmit(); assert.equal(error.hidden, false); assert.equal(calls, 0);
  input.value = 'reddit.com'; input.dispatchEvent(new view.Event('input', { bubbles: true })); form.requestSubmit(); await settle();
  assert.equal(calls, 1); assert.equal(error.hidden, true); assert.equal(input.hasAttribute('aria-invalid'), false);
  assert.equal(status.dataset['state'], 'limited'); assert.match(status.textContent ?? '', /0 of 10 checks remaining/); assert.equal(results.textContent, 'Previous report');
});

test('one pending operation prevents repeated checks and example requests from racing', async t => {
  const { form, input, button, example, status, results, view } = await setup(t);
  const live = deferred<Response>(), savedExample = deferred<Response>();
  const calls: unknown[] = [];
  t.mock.method(globalThis, 'fetch', (url: unknown) => { calls.push(url); return url === '/api/ai-check' ? live.promise : savedExample.promise; });
  input.value = 'reddit.com'; form.requestSubmit(); form.dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  example.dispatchEvent(new view.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.deepEqual(calls, ['/api/ai-check']); assert.equal(button.disabled, true); assert.equal(example.getAttribute('aria-disabled'), 'true');
  live.resolve(Response.json({ report })); await settle();
  assert.equal(button.disabled, false); assert.equal(status.dataset['state'], 'ready'); assert.equal(results.getAttribute('aria-busy'), 'false');
  example.dispatchEvent(new view.MouseEvent('click', { bubbles: true, cancelable: true }));
  form.dispatchEvent(new view.Event('submit', { bubbles: true, cancelable: true }));
  assert.deepEqual(calls, ['/api/ai-check', '/ai-check-example.json']); assert.equal(button.disabled, true);
  savedExample.resolve(Response.json(report)); await settle();
  assert.equal(button.disabled, false); assert.match(results.textContent ?? '', /Example report · saved observation/);
});

test('a detached operation cannot overwrite a new operation after reconnection', async t => {
  const { component, form, input, button, status, results } = await setup(t);
  const old = deferred<Response>(), current = deferred<Response>(); let calls = 0;
  t.mock.method(globalThis, 'fetch', () => { calls++; return calls === 1 ? old.promise : current.promise; });
  input.value = 'reddit.com'; form.requestSubmit(); component.remove(); document.body.append(component); form.requestSubmit();
  old.resolve(Response.json({ error: 'Old failure' }, { status: 503 })); await settle();
  assert.equal(button.disabled, true); assert.equal(status.dataset['state'], 'loading'); assert.equal(results.getAttribute('aria-busy'), 'true');
  current.resolve(Response.json({ report })); await settle();
  assert.equal(button.disabled, false); assert.equal(status.dataset['state'], 'ready'); assert.match(results.textContent ?? '', /Your access report/);
});
