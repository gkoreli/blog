import assert from 'node:assert/strict';
import test from 'node:test';
import { renderContent } from '../src/lib/ssg.js';
import { ReplySlip, DispatchSlip } from '../src/templates/artifacts.js';
import * as variants from '../src/templates/experiments/dispatch-variants.js';
import { initSubscribeForm } from '../src/client/subscribe.js';

const forms = [ReplySlip, DispatchSlip, variants.DispatchReceipt, variants.DispatchSignal, variants.DispatchCard,
  variants.DispatchSchlieren, variants.DispatchSchlierenBloom, variants.DispatchSchlierenFilament,
  variants.DispatchSchlierenBrand, variants.DispatchCaustic, variants.DispatchInterference] as const;

test('actual newsletter snapshots deliver the sitekey attribute required by the client', async () => {
  const sitekey = 'fixture-public-site-key';
  const snapshots = await renderContent(forms.map(render => render({ turnstileSiteKey: sitekey })));
  for (const [index, snapshot] of snapshots.entries()) {
    assert.match(snapshot, /data-turnstile-sitekey="fixture-public-site-key"/, forms[index]?.name);
    assert.match(snapshot, /\snovalidate(?:=""|(?=\s|>))/);
    assert.match(snapshot, /class="turnstile-slot"/);
    assert.doesNotMatch(snapshot, /--bk-\d+--|novalidate</);
  }
});

test('missing public configuration keeps the form unconfigured without a widget slot', async () => {
  const snapshots = await renderContent(forms.map(render => render({ turnstileSiteKey: '' })));
  for (const snapshot of snapshots) {
    assert.match(snapshot, /data-turnstile-sitekey=""/);
    assert.doesNotMatch(snapshot, /class="turnstile-slot"|--bk-\d+--|novalidate</);
  }
});

test('sitekey values stay in their attribute through the native snapshot renderer', async () => {
  const snapshots = await renderContent(forms.map(render => render({ turnstileSiteKey: 'fixture"&<key' })));
  for (const snapshot of snapshots) {
    const container = document.createElement('div');
    container.innerHTML = snapshot;
    assert.equal(container.querySelector('form')?.dataset['turnstileSitekey'], 'fixture"&<key');
    assert.doesNotMatch(snapshot, /--bk-\d+--|novalidate</);
  }
});

test('the actual client initializes verification from an actual SSG form', async t => {
  const [snapshot] = await renderContent([ReplySlip({ turnstileSiteKey: 'fixture-client-key' })]);
  assert.ok(snapshot);
  const view = document.defaultView;
  assert.ok(view);
  for (const name of ['HTMLFormElement', 'HTMLInputElement', 'HTMLButtonElement'] as const) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value: view[name] });
    t.after(() => { if (original) Object.defineProperty(globalThis, name, original); else Reflect.deleteProperty(globalThis, name); });
  }
  const before = document.body.innerHTML, api = window.turnstile;
  t.after(() => { document.body.innerHTML = before; window.turnstile = api; });
  document.body.innerHTML = snapshot;
  let renders = 0;
  window.turnstile = {
    render(_slot, options) { renders++; assert.equal(options.sitekey, 'fixture-client-key'); return 'fixture-widget'; },
    execute() { assert.fail('Initialization must not execute a challenge'); },
    remove() {},
  };
  initSubscribeForm({ logger: { report() { assert.fail('Rendered configuration must not report missing verification'); } } });
  assert.equal(renders, 1);
  assert.equal(document.getElementById('sub-form')?.dataset['subscribeInit'], 'true');
});
