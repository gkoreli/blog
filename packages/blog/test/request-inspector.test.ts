import assert from 'node:assert/strict';
import test from 'node:test';
import { renderContent } from '../src/lib/ssg.js';
import { requestInspectorPage } from '../src/pages/request-inspector.js';

const hostile = '<img src=x onerror="globalThis.compromised=true">';
const [snapshot] = await renderContent([requestInspectorPage()]);

test('request inspector owns its page, selected navigation, shared allowance and script-free API path', async () => {
  assert.ok(snapshot);
  assert.match(snapshot, /<h1>Request inspector<\/h1>/);
  assert.match(snapshot, /href="\/tools\/request-inspector" aria-current="page"/);
  assert.match(snapshot, /data-request-check/);
  assert.match(snapshot, /href="\/api\/request-check"/);
  assert.match(snapshot, /works without JavaScript/);
  assert.match(snapshot, /shared with/);
  assert.match(snapshot, /10 checks per network address per UTC day/);
  assert.doesNotMatch(snapshot, /site-audit-check|data-audit-status|name="url"|score-method/);
});

test('request inspector separates a reported referrer from a verified arrival and explains conflicting context', async () => {
  const { renderRequestEvidence } = await import('../src/client/request-inspector.js');
  const base = { context: { referrerState: 'external', fetchSite: 'cross-site' }, evidence: { navigationShaped: true, activation: 'true-claim', referrerContext: 'no-conflict-observed' }, limits: [] };
  const compatible = renderRequestEvidence(base);
  assert.match(compatible.textContent ?? '', /External source reported/);
  assert.match(compatible.textContent ?? '', /Reloads and history can retain it/);
  assert.match(compatible.textContent ?? '', /source unverified/);
  const uiContext = renderRequestEvidence({ ...base, context: { referrerState: 'external', fetchSite: 'none' } });
  assert.match(uiContext.textContent ?? '', /No site initiator reported/);
  assert.doesNotMatch(uiContext.textContent ?? '', /Needs review: conflicting context/);
  const conflict = renderRequestEvidence({ ...base, context: { referrerState: 'external', fetchSite: 'same-origin' }, evidence: { ...base.evidence, referrerContext: 'external-with-same-origin' } });
  assert.match(conflict.textContent ?? '', /Needs review: conflicting context/);
  assert.match(conflict.textContent ?? '', /does not prove automation/);
});

test('request inspector treats earlier or malformed context as unrecorded rather than a source verdict', async () => {
  const { renderRequestEvidence } = await import('../src/client/request-inspector.js');
  for (const context of [undefined, { referrerState: hostile, fetchSite: hostile }]) {
    const result = renderRequestEvidence({ context, evidence: { referrerContext: 'no-conflict-observed' } });
    assert.match(result.textContent ?? '', /Not recorded/);
    assert.match(result.textContent ?? '', /Not assessed/);
    assert.equal(result.querySelectorAll('img,script').length, 0);
  }
  const absent = renderRequestEvidence({ context: { referrerState: 'absent', fetchSite: 'none' } });
  assert.match(absent.textContent ?? '', /source is unknown/i);
  assert.match(absent.textContent ?? '', /privacy settings or automation/);
});

test('the standalone inspector sends its own request and renders the shared allowance', async t => {
  const view = document.defaultView; assert.ok(view);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'HTMLButtonElement');
  Object.defineProperty(globalThis, 'HTMLButtonElement', { configurable: true, value: view.HTMLButtonElement });
  const previousBody = document.body.innerHTML;
  t.after(() => {
    document.body.innerHTML = previousBody;
    if (previous) Object.defineProperty(globalThis, 'HTMLButtonElement', previous);
    else Reflect.deleteProperty(globalThis, 'HTMLButtonElement');
  });
  assert.ok(snapshot);
  await import('../src/client/request-inspector.js');
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (input: unknown, init?: RequestInit) => {
    calls++; assert.equal(input, '/api/request-check'); assert.equal(init?.method, undefined);
    return Response.json({ request: { context: { referrerState: 'internal', fetchSite: 'same-origin' },
      evidence: { referrerContext: 'no-conflict-observed', navigationShaped: false }, limits: [] },
      quota: { limit: 10, remaining: 9, resetAt: '2026-11-14T00:00:00.000Z' } });
  });
  // Complete the deferred-script page markup before connecting its component.
  const detached = document.createElement('div'); detached.innerHTML = snapshot;
  document.body.replaceChildren(...detached.childNodes);
  const button = document.querySelector('[data-request-check]'); assert.ok(button instanceof HTMLButtonElement);
  assert.equal(button.hidden, false); assert.equal(calls, 0);
  button.click(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1); assert.equal(button.disabled, false);
  assert.match(document.querySelector('[data-request-status]')?.textContent ?? '', /9 of 10 checks remaining/);
  assert.match(document.querySelector('[data-request-results]')?.textContent ?? '', /This site reported/);
  assert.equal(document.querySelector('site-audit-check'), null);
});
