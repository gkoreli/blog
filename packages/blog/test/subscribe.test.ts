import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import type { ClientErrorInput } from '@gkoreli/client-observability/client';
import { initSubscribeForm } from '../src/client/subscribe.ts';

type TurnstileApi = NonNullable<Window['turnstile']>;
type WidgetOptions = Parameters<TurnstileApi['render']>[1];

class ElementFixture extends EventTarget {
  textContent = '';
  attributes = new Map<string, string>();
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  removeAttribute(name: string) { this.attributes.delete(name); }
  replaceChildren() {}
}

class InputFixture extends ElementFixture {
  value = ' reader@example.invalid ';
  valid = true;
  validityReports = 0;
  checkValidity() { return this.valid; }
  reportValidity() { this.validityReports++; return this.valid; }
}

class ButtonFixture extends ElementFixture { disabled = false; }

class FormFixture extends ElementFixture {
  dataset: Record<string, string> = { turnstileSitekey: 'synthetic-site-key' };
  innerHTML = '';
  input = new InputFixture();
  button = new ButtonFixture();
  message = new ElementFixture();
  slot: ElementFixture | null = new ElementFixture();
  elements = { namedItem: (name: string) => name === 'email' ? this.input : null };
  querySelector(selector: string) {
    if (selector === '.subscribe-btn') return this.button;
    if (selector === '.subscribe-msg') return this.message;
    if (selector === '.turnstile-slot') return this.slot;
    return null;
  }
}

function harness(t: TestContext, withApi = true) {
  const form = new FormFixture();
  const reports: ClientErrorInput[] = [];
  const requests: { input: RequestInfo | URL; init?: RequestInit }[] = [];
  const renders: WidgetOptions[] = [];
  const executions: string[] = [];
  const removals: string[] = [];
  const timers = new Map<number, { at: number; callback: () => void }>();
  let clock = 0;
  let timerId = 0;
  let renderFails = false;
  let executeFails = false;
  let removeFails = false;
  let loggerFails = false;
  let fetchImpl: typeof fetch = async () => new Response(null, { status: 202 });
  let onRender: ((options: WidgetOptions) => void) | undefined;
  const api: TurnstileApi = {
    render(_slot, options) {
      renders.push(options);
      if (renderFails) throw new Error('synthetic token=private-render-detail');
      onRender?.(options);
      return `widget-${renders.length}`;
    },
    execute(id) {
      executions.push(id);
      if (executeFails) throw new Error('synthetic token=private-execute-detail');
    },
    remove(id) {
      removals.push(id);
      if (removeFails) throw new Error('synthetic cleanup error');
    },
  };
  const browser: { turnstile?: TurnstileApi; setTimeout: (callback: () => void, delay: number) => number; clearTimeout: (id: number) => void } = {
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { at: clock + delay, callback });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
  };
  if (withApi) browser.turnstile = api;
  const logger = {
    report(event: ClientErrorInput) {
      reports.push(event);
      if (loggerFails) throw new Error('synthetic logger failure');
    },
  };
  function install(name: string, value: unknown) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  install('HTMLElement', ElementFixture);
  install('HTMLFormElement', FormFixture);
  install('HTMLInputElement', InputFixture);
  install('HTMLButtonElement', ButtonFixture);
  install('document', { getElementById: () => form, referrer: 'https://www.example.org/private?email=secret@example.invalid' });
  install('location', {
    origin: 'https://gkoreli.com', pathname: '/article',
    search: '?utm_source=news&utm_campaign=launch&email=secret@example.invalid&token=private',
  });
  install('window', browser);
  install('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ input, init });
    return fetchImpl(input, init);
  });

  return {
    form, reports, requests, renders, executions, removals, timers, api, browser, logger,
    initialize() { initSubscribeForm({ logger }); },
    submit() { form.dispatchEvent(new Event('submit', { cancelable: true })); },
    options() {
      const options = renders.at(-1);
      assert.ok(options, 'actual initializer registered widget options');
      return options;
    },
    tick(ms: number) {
      clock += ms;
      for (const [id, timer] of timers) {
        if (timer.at <= clock) {
          timers.delete(id);
          timer.callback();
        }
      }
    },
    setFetch(implementation: typeof fetch) { fetchImpl = implementation; },
    failRender(value = true) { renderFails = value; },
    failExecute(value = true) { executeFails = value; },
    failRemove(value = true) { removeFails = value; },
    failLogger() { loggerFails = true; },
    onRender(callback: (options: WidgetOptions) => void) { onRender = callback; },
  };
}

async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

test('a late widget script can initialize on submit; repeated initialization adds no listener', async t => {
  const h = harness(t, false);
  h.initialize();
  h.initialize();
  assert.equal(h.reports.length, 0);
  h.browser.turnstile = h.api;
  h.submit();
  assert.equal(h.renders.length, 1);
  assert.equal(h.executions.length, 1);
  h.options().callback?.('synthetic-challenge-token');
  await settle();
  assert.equal(h.requests.length, 1);
  assert.match(h.form.message.textContent, /If confirmation is needed/);
  assert.doesNotMatch(h.form.message.textContent, /link on the way|email was sent/);
  assert.match(h.form.message.textContent, /try again in ten minutes/);
  assert.equal(h.form.innerHTML, '');
  assert.equal(h.form.button.disabled, false);
  assert.equal(h.form.input.value, ' reader@example.invalid ');
  assert.equal(h.timers.size, 0);
});

test('missing script reports the stage without posting an empty token; retry works after load', async t => {
  const h = harness(t, false);
  h.initialize();
  h.submit();
  assert.equal(h.requests.length, 0);
  assert.equal(h.reports[0]?.message, 'subscribe_widget_unavailable');
  assert.equal(h.form.button.disabled, false);
  h.browser.turnstile = h.api;
  h.submit();
  h.options().callback?.('synthetic-challenge-token');
  await settle();
  assert.equal(h.requests.length, 1);
});

for (const missing of ['sitekey', 'slot']) {
  test(`missing ${missing} blocks submission and reports configuration`, t => {
    const h = harness(t);
    if (missing === 'sitekey') delete h.form.dataset['turnstileSitekey'];
    else h.form.slot = null;
    h.initialize();
    h.submit();
    assert.equal(h.requests.length, 0);
    assert.equal(h.reports[0]?.message, 'subscribe_widget_configuration_missing');
    assert.equal(h.form.button.disabled, false);
  });
}

test('invalid email keeps native validation and does not execute a challenge', t => {
  const h = harness(t);
  h.initialize();
  h.form.input.valid = false;
  h.submit();
  assert.equal(h.form.input.validityReports, 1);
  assert.equal(h.executions.length, 0);
  assert.equal(h.requests.length, 0);
});

for (const stage of ['render', 'execute']) {
  test(`${stage} exceptions restore the form and allow a fresh attempt`, async t => {
    const h = harness(t);
    if (stage === 'render') h.failRender();
    else h.failExecute();
    h.initialize();
    if (stage === 'execute') h.submit();
    assert.equal(h.reports[0]?.message, `subscribe_widget_${stage}_exception`);
    assert.equal(h.form.button.disabled, false);
    assert.equal(h.requests.length, 0);
    h.failRender(false);
    h.failExecute(false);
    h.submit();
    h.options().callback?.('synthetic-challenge-token');
    await settle();
    assert.equal(h.requests.length, 1);
    assert.doesNotMatch(JSON.stringify(h.reports), /private-|token=/);
  });
}

for (const [callbackName, stage] of [
  ['error-callback', 'error'],
  ['timeout-callback', 'timeout'],
  ['unsupported-callback', 'unsupported'],
  ['expired-callback', 'expired'],
] as const) {
  test(`${callbackName} reports once, recovers, and ignores old widget callbacks`, async t => {
    const h = harness(t);
    h.initialize();
    h.submit();
    const oldOptions = h.options();
    const callback = oldOptions[callbackName];
    assert.ok(callback);
    callback('private-callback-payload');
    callback('private-callback-payload');
    assert.equal(h.reports.length, 1);
    assert.equal(h.reports[0]?.message, `subscribe_widget_${stage}`);
    assert.equal(h.form.button.disabled, false);
    assert.equal(h.timers.size, 0);
    h.submit();
    oldOptions.callback?.('old-challenge-token');
    assert.equal(h.requests.length, 0);
    h.options().callback?.('new-challenge-token');
    await settle();
    assert.equal(h.requests.length, 1);
    assert.doesNotMatch(JSON.stringify(h.reports), /private-callback-payload|challenge-token|example.invalid/);
  });
}

test('a synchronous render callback failure never starts execution or leaves a timer', t => {
  const h = harness(t, false);
  h.initialize();
  h.browser.turnstile = h.api;
  h.onRender(options => options['error-callback']?.('private-render-error'));
  h.submit();
  assert.equal(h.executions.length, 0);
  assert.equal(h.form.button.disabled, false);
  assert.equal(h.timers.size, 0);
  assert.equal(h.removals.length, 1);
});

test('a challenge that never calls back expires at the form deadline', t => {
  const h = harness(t);
  h.initialize();
  h.submit();
  h.tick(29_999);
  assert.equal(h.form.button.disabled, true);
  h.tick(1);
  assert.equal(h.form.button.disabled, false);
  assert.equal(h.reports[0]?.message, 'subscribe_widget_deadline');
  assert.equal(h.requests.length, 0);
  h.options().callback?.('late-challenge-token');
  assert.equal(h.requests.length, 0);
});

test('an empty token cannot reach the API', t => {
  const h = harness(t);
  h.initialize();
  h.submit();
  h.options().callback?.('   ');
  assert.equal(h.requests.length, 0);
  assert.equal(h.form.button.disabled, false);
  assert.equal(h.reports[0]?.message, 'subscribe_widget_empty_token');
});

test('one valid callback sends one captured email and only allowed attribution', async t => {
  const h = harness(t);
  const pending = Promise.withResolvers<Response>();
  h.setFetch(() => pending.promise);
  h.initialize();
  h.submit();
  h.form.input.value = 'changed@example.invalid';
  h.options().callback?.('synthetic-challenge-token');
  h.options().callback?.('synthetic-challenge-token');
  h.submit();
  assert.equal(h.requests.length, 1);
  const request = h.requests[0];
  assert.equal(request?.input, '/api/subscribe');
  assert.equal(request?.init?.method, 'POST');
  assert.equal(request?.init?.body, JSON.stringify({
    email: 'reader@example.invalid', turnstile: 'synthetic-challenge-token',
    source: '/article?utm_source=news&utm_campaign=launch&ref=example.org',
  }));
  pending.resolve(new Response(null, { status: 202 }));
  await settle();
  assert.equal(h.reports.length, 0);
  h.options().callback?.('late-challenge-token');
  h.submit();
  assert.equal(h.requests.length, 1);
});

test('request timeout aborts, restores retry, and ignores a late success', async t => {
  const h = harness(t);
  const pending = Promise.withResolvers<Response>();
  h.setFetch(() => pending.promise);
  h.initialize();
  h.submit();
  h.options().callback?.('synthetic-challenge-token');
  h.tick(34_999);
  assert.equal(h.form.button.disabled, true);
  h.tick(1);
  assert.equal(h.form.button.disabled, false);
  assert.equal(h.requests[0]?.init?.signal?.aborted, true);
  assert.equal(h.reports[0]?.message, 'subscribe_request_timeout');
  assert.match(h.form.message.textContent, /Check for a confirmation email/);
  pending.resolve(new Response(null, { status: 202 }));
  await settle();
  assert.equal(h.form.innerHTML, '');
  h.setFetch(async () => new Response(null, { status: 202 }));
  h.submit();
  h.options().callback?.('new-challenge-token');
  await settle();
  assert.match(h.form.message.textContent, /Request received/);
});

test('expiry during an API request reports and ignores its eventual response', async t => {
  const h = harness(t);
  const pending = Promise.withResolvers<Response>();
  h.setFetch(() => pending.promise);
  h.initialize();
  h.submit();
  h.options().callback?.('synthetic-challenge-token');
  h.options()['expired-callback']?.();
  assert.equal(h.requests[0]?.init?.signal?.aborted, true);
  assert.equal(h.reports[0]?.message, 'subscribe_widget_expired');
  assert.equal(h.form.button.disabled, false);
  pending.resolve(new Response(null, { status: 202 }));
  await settle();
  assert.equal(h.form.innerHTML, '');
});

for (const status of [400, 429, 503, 500, 200]) {
  test(`HTTP ${status} keeps the form usable and logs status without response details`, async t => {
    const h = harness(t);
    h.setFetch(async () => new Response('private-response reader@example.invalid token=secret', { status }));
    h.initialize();
    h.submit();
    h.options().callback?.('synthetic-challenge-token');
    await settle();
    assert.equal(h.form.innerHTML, '');
    assert.equal(h.form.button.disabled, false);
    assert.equal(h.reports[0]?.message, 'subscribe_api_rejected');
    assert.equal(h.reports[0]?.status, status);
    assert.equal(h.timers.size, 0);
    assert.doesNotMatch(JSON.stringify(h.reports) + h.form.message.textContent, /private-response|example.invalid|token=secret/);
    if (status === 503) assert.match(h.form.message.textContent, /temporarily unavailable/);
    if (status === 429) assert.match(h.form.message.textContent, /wait a few minutes/);
  });
}

test('a network failure still restores retry if logging and widget cleanup throw', async t => {
  const h = harness(t);
  h.setFetch(async () => { throw new Error('private network details'); });
  h.failLogger();
  h.failRemove();
  h.initialize();
  h.submit();
  h.options().callback?.('synthetic-challenge-token');
  await settle();
  assert.equal(h.form.button.disabled, false);
  assert.equal(h.form.attributes.has('aria-busy'), false);
  assert.deepEqual(h.reports.map(report => report.message), [
    'subscribe_widget_remove_exception', 'subscribe_network_error',
  ]);
  assert.equal(h.timers.size, 0);
});

test('503 with a ten-minute retry interval gives static check-inbox guidance', async t => {
  const h = harness(t);
  h.setFetch(async () => new Response('private provider detail', {
    status: 503, headers: { 'Retry-After': '600' },
  }));
  h.initialize();
  h.submit();
  h.options().callback?.('synthetic-challenge-token');
  await settle();
  assert.match(h.form.message.textContent, /Check your inbox before retrying in ten minutes/);
  assert.equal(h.form.button.disabled, false);
  assert.equal(h.reports[0]?.message, 'subscribe_api_rejected');
  assert.equal(h.reports[0]?.status, 503);
  assert.doesNotMatch(JSON.stringify(h.reports), /600|private provider detail/);
});

test('generic acceptance leaves the email and form available for another verified request', async t => {
  const h = harness(t);
  h.initialize();
  h.submit();
  h.options().callback?.('first-challenge-token');
  await settle();
  assert.equal(h.requests.length, 1);
  h.submit();
  h.options().callback?.('second-challenge-token');
  await settle();
  assert.equal(h.requests.length, 2);
  assert.equal(h.form.innerHTML, '');
  assert.equal(h.form.input.value, ' reader@example.invalid ');
  assert.equal(h.form.button.disabled, false);
});
