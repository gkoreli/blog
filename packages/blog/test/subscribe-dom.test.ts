import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import { renderContent } from '../src/lib/ssg.js';
import { ReplySlip } from '../src/templates/artifacts.js';
import { initSubscribeForm } from '../src/client/subscribe.js';
import type { TurnstileOptions } from '../src/client/turnstile-adapter.js';
import type { ClientErrorInput } from '@gkoreli/client-observability/client';

async function harness(t: TestContext) {
  const snapshots = await renderContent(['first', 'second'].map(formId => ReplySlip({ turnstileSiteKey: 'fixture-public-key', formId })));
  const view = document.defaultView;
  assert.ok(view);
  function install(name: string, value: unknown) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    t.after(() => { if (previous) Object.defineProperty(globalThis, name, previous); else Reflect.deleteProperty(globalThis, name); });
  }
  for (const name of ['HTMLFormElement', 'HTMLInputElement', 'HTMLButtonElement'] as const) install(name, view[name]);
  install('location', new URL('https://fixture.invalid/article'));
  const previousBody = document.body.innerHTML;
  const previousApi = window.turnstile;
  document.body.innerHTML = snapshots.join('');
  t.after(() => { document.body.innerHTML = previousBody; window.turnstile = previousApi; });
  const reports: ClientErrorInput[] = [];
  const requests: RequestInit[] = [];
  const widgets: { id: string; container: HTMLElement; options: TurnstileOptions }[] = [];
  let fetchImpl: typeof fetch = async () => Response.json({ ok: true }, { status: 202 });
  install('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(input, '/api/subscribe'); assert.ok(init); requests.push(init); return fetchImpl(input, init);
  });
  window.turnstile = {
    render(container, options) {
      assert.equal(options.sitekey, 'fixture-public-key');
      const id = `fixture-${widgets.length}`;
      const marker = document.createElement('div'); marker.dataset['providerFixture'] = id; container.append(marker);
      widgets.push({ id, container, options }); return id;
    },
    execute(id) { assert.ok(widgets.some(widget => widget.id === id)); },
    remove(id) { widgets.find(widget => widget.id === id)?.container.replaceChildren(); },
  };
  function form(id: string) {
    const node = document.getElementById(id); assert.ok(node instanceof HTMLFormElement); return node;
  }
  function input(node: HTMLFormElement) {
    const element = node.elements.namedItem('email'); assert.ok(element instanceof HTMLInputElement); return element;
  }
  function button(node: HTMLFormElement) {
    const element = node.querySelector('button'); assert.ok(element instanceof HTMLButtonElement); return element;
  }
  const submit = (node: HTMLFormElement) => { node.dispatchEvent(new view.Event('submit', { cancelable: true, bubbles: true })); };
  return { reports, requests, widgets, form, input, button, submit,
    initialize() { initSubscribeForm({ logger: { report(event) { reports.push(event); } } }); },
    setFetch(implementation: typeof fetch) { fetchImpl = implementation; },
  };
}

async function settle() { await new Promise<void>(resolve => setImmediate(resolve)); }

test('native SSG forms keep unique label/status targets and isolate overlapping signup attempts', async t => {
  const h = await harness(t);
  const first = h.form('first'), second = h.form('second');
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const form of [first, second]) {
    assert.equal(h.button(form).disabled, true);
    assert.equal(form.querySelector('label')?.htmlFor, h.input(form).id);
    assert.equal(h.input(form).getAttribute('aria-describedby'), form.querySelector('[role=status]')?.id);
    assert.equal(form.method, 'post');
  }
  h.initialize(); h.initialize();
  assert.equal(h.widgets.length, 0);
  h.input(first).value = 'invalid-email'; h.submit(first);
  assert.equal(h.widgets.length, 0, 'native email validation prevents provider work');
  h.input(first).value = 'first@example.invalid'; h.input(second).value = 'second@example.invalid';
  h.submit(first); h.submit(second);
  assert.equal(h.widgets.length, 2, 'each valid form gets exactly one provider session');
  assert.equal(h.widgets[0]?.container.closest('form'), first);
  assert.equal(h.widgets[1]?.container.closest('form'), second);
  const pending = Promise.withResolvers<Response>(); h.setFetch(() => pending.promise);
  h.widgets[0]?.options.callback('first-token');
  h.widgets[1]?.options['error-callback']('110200');
  window.dispatchEvent(viewEvent('gk-turnstile-ready'));
  assert.equal(h.widgets.length, 2);
  assert.equal(h.requests.length, 1);
  assert.equal(h.button(first).disabled, true);
  assert.equal(first.dataset['subscribeStatus'], 'pending');
  assert.equal(second.dataset['subscribeStatus'], 'error');
  assert.equal(h.button(second).disabled, false);
  pending.resolve(Response.json({ ok: true }, { status: 202 })); await settle();
  assert.equal(first.dataset['subscribeStatus'], 'success');
  assert.equal(second.dataset['subscribeStatus'], 'error');
  assert.equal(h.reports.length, 1);
  assert.equal(document.querySelectorAll('[data-provider-fixture]').length, 0);
});

function viewEvent(name: string): Event {
  const view = document.defaultView; assert.ok(view); return new view.Event(name);
}

test('a cloned SSG form with a copied init marker still receives its own listener', async t => {
  const h = await harness(t); h.initialize();
  const clone = h.form('first').cloneNode(true); assert.ok(clone instanceof HTMLFormElement);
  clone.id = 'cloned'; document.body.append(clone);
  assert.equal(clone.dataset['subscribeInit'], 'true');
  h.initialize();
  h.input(clone).value = 'clone@example.invalid'; h.submit(clone);
  assert.equal(h.widgets.length, 1);
  h.widgets[0]?.options.callback('clone-token'); await settle();
  assert.equal(h.requests.length, 1);
  assert.equal(clone.dataset['subscribeStatus'], 'success');
  assert.equal(h.form('first').dataset['subscribeStatus'], undefined);
});
