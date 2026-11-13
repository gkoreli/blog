import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(process.env.STUDY_PLAYWRIGHT_PACKAGE);
const playwright = require('playwright');
const pause = page => page.waitForTimeout(90);
function assert(value, message) { if (!value) throw new Error(message); }
async function shown(page, selector) { return page.locator(selector).isVisible(); }
async function active(page) { return page.evaluate(() => document.activeElement?.id); }
async function readable(page, selector) {
  if (!(await page.locator(selector).isVisible())) return false;
  return page.locator(selector).evaluate(el => {
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > .98 && s.transform === 'none';
  });
}
const analyticsProbe = () => {
  const p = window.__probe = { attempts: [], listeners: [], visibility: 'visible', beaconMode: true, fetchMode: true };
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => p.visibility });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => p.visibility === 'hidden' });
  Object.defineProperty(window, 'fetchLater', { configurable: true, value: undefined });
  const listen = window.addEventListener.bind(window);
  window.addEventListener = (type, listener, options) => { p.listeners.push(type); return listen(type, listener, options); };
  const bodyText = async body => typeof body === 'string' ? body : body?.text ? body.text() : String(body);
  Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: (url, body) => {
    const item = { method: 'beacon', url: String(url), text: null };
    p.attempts.push(item); void bodyText(body).then(text => { item.text = text; }); return p.beaconMode;
  } });
  window.fetch = async (url, options = {}) => {
    p.attempts.push({ method: 'fetch', url: String(url), keepalive: options.keepalive, verb: options.method, text: await bodyText(options.body) });
    if (!p.fetchMode) throw new Error('Synthetic transport failure');
    return new Response(null, { status: 204 });
  };
  window.__lifecycle = (type, persisted = false) => {
    if (type === 'hidden' || type === 'visible') {
      p.visibility = type; document.dispatchEvent(new Event('visibilitychange'));
    } else window.dispatchEvent(new PageTransitionEvent(type, { persisted }));
  };
};
async function queue(page, name) { await page.evaluate(name => window.recordEvent({ name }), name); }
async function lifecycle(page, state, persisted = false) { await page.evaluate(([state, persisted]) => window.__lifecycle(state, persisted), [state, persisted]); await pause(page); }
async function attempts(page) { await pause(page); return page.evaluate(() => window.__probe.attempts); }
function names(attempt) {
  const body = JSON.parse(attempt.text);
  const list = Array.isArray(body) ? body : body.events;
  assert(Array.isArray(list), 'JSON body must contain the queued events');
  return list.map(item => item.name);
}
const suites = {
  T01: [
    ['named-modal', async p => { await p.locator('#delete-report').click(); assert(await p.getByRole('dialog', { name: 'Delete saved report?' }).isVisible(), 'Missing named dialog'); }],
    ['initial-cancel-focus', async p => { await p.locator('#delete-report').click(); assert(await active(p) === 'confirm-cancel', 'Initial focus should be Cancel'); }],
    ['keyboard-focus-contained', async p => { await p.locator('#delete-report').click(); for (let i = 0; i < 5; i++) { await p.keyboard.press('Tab'); assert(await p.locator('#confirm-modal').evaluate(el => el.contains(document.activeElement) || document.activeElement === document.body), 'Tab reached a page control outside the modal'); } }],
    ['background-focus-blocked', async p => { await p.locator('#delete-report').click(); await p.locator('#outside-action').evaluate(el => el.focus()); assert(await active(p) !== 'outside-action', 'Background control can take focus'); }],
    ['cancel-preserves-and-restores', async p => { await p.locator('#delete-report').click(); await p.locator('#confirm-cancel').click(); await p.locator('#confirm-modal').waitFor({ state: 'hidden' }); await p.waitForFunction(() => document.activeElement?.id === 'delete-report', null, { timeout: 1600 }); assert(!(await shown(p, '#confirm-modal')) && await shown(p, '#saved-report'), 'Cancel changed report or did not close'); assert(await active(p) === 'delete-report', 'Focus not restored'); assert(await p.evaluate(() => window.fixtureState.deletions) === 0, 'Deletion callback called on cancel'); }],
    ['escape-cancels', async p => { await p.locator('#delete-report').click(); await p.keyboard.press('Escape'); await p.locator('#confirm-modal').waitFor({ state: 'hidden' }); await p.waitForFunction(() => document.activeElement?.id === 'delete-report', null, { timeout: 1600 }); assert(!(await shown(p, '#confirm-modal')) && await shown(p, '#saved-report') && await active(p) === 'delete-report', 'Escape cancellation incomplete'); }],
    ['backdrop-cancels', async p => { await p.locator('#delete-report').click(); await p.mouse.click(8, 8); await p.locator('#confirm-modal').waitFor({ state: 'hidden' }); assert(!(await shown(p, '#confirm-modal')) && await shown(p, '#saved-report'), 'Backdrop did not cancel safely'); }],
    ['legacy-light-dismiss-fallback', async p => { await p.locator('#delete-report').click(); await p.mouse.click(8, 8); await p.locator('#confirm-modal').waitFor({ state: 'hidden' }); assert(!(await shown(p, '#confirm-modal')) && await shown(p, '#saved-report'), 'Backdrop fallback absent when native light-dismiss is unavailable'); }, { removeNativeLightDismiss: true }],
    ['confirm-deletes-once', async p => { await p.locator('#delete-report').click(); await p.locator('#confirm-delete').click(); await p.waitForFunction(() => window.fixtureState.deletions === 1, null, { timeout: 1600 }); await p.locator('#confirm-modal').waitFor({ state: 'hidden' }); assert(!(await shown(p, '#saved-report')) && !(await shown(p, '#confirm-modal')), 'Confirm incomplete'); assert(await p.evaluate(() => window.fixtureState.deletions) === 1, 'Wrong deletion callback count'); }],
  ],
  T02: [
    ['mouse-toggle', async p => { await p.locator('#evidence-one-toggle').click(); assert(await shown(p, '#evidence-one-content'), 'Content did not open'); await p.locator('#evidence-one-toggle').click(); assert(!(await shown(p, '#evidence-one-content')), 'Content did not close'); }],
    ['keyboard-toggle', async p => { await p.locator('#evidence-one-toggle').focus(); await p.keyboard.press('Enter'); assert(await shown(p, '#evidence-one-content'), 'Enter did not open'); await p.keyboard.press('Space'); assert(!(await shown(p, '#evidence-one-content')), 'Space did not close'); }],
    ['independent-panels', async p => { await p.locator('#evidence-one-toggle').click(); await p.locator('#evidence-two-toggle').click(); assert(await shown(p, '#evidence-one-content') && await shown(p, '#evidence-two-content'), 'Panels became exclusive'); }],
    ['dynamic-content-readable', async p => { await p.locator('#evidence-one-toggle').click(); await p.locator('#evidence-one-content').evaluate(el => { const p = document.createElement('p'); p.id = 'appended-evidence'; p.textContent = 'Additional evidence. '.repeat(80); el.append(p); }); assert(await shown(p, '#appended-evidence'), 'Added content hidden'); assert(await p.locator('#appended-evidence').evaluate(el => { const r = el.getBoundingClientRect(); for (let a = el.parentElement; a; a = a.parentElement) { const s = getComputedStyle(a); if (['hidden', 'clip'].includes(s.overflowY) && a.getBoundingClientRect().bottom < r.bottom - 2) return false; } return true; }), 'Added content clipped'); }],
    ['small-screen-layout', async p => { await p.setViewportSize({ width: 360, height: 740 }); await p.locator('#evidence-one-toggle').click(); assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal overflow'); }],
    ['no-javascript-disclosures', async p => { await p.locator('#evidence-one-toggle').click(); await p.locator('#evidence-two-toggle').click(); assert(await shown(p, '#evidence-one-content') && await shown(p, '#evidence-two-content'), 'No-JS disclosures unavailable'); }, { javaScriptEnabled: false }],
    ['no-unrequested-animation', async p => { await p.locator('#evidence-one-toggle').click(); assert(await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length) === 0, 'Animation was added despite task constraint'); }],
  ],
  T03: [
    ['mobile-initial-state', async p => { assert(await shown(p, '#menu-toggle') && !(await shown(p, '#site-nav')), 'Initial mobile state incorrect'); assert(await p.locator('#menu-toggle').getAttribute('aria-expanded') === 'false', 'Initial expanded state incorrect'); }],
    ['mobile-toggle-state', async p => { await p.locator('#menu-toggle').click(); assert(await shown(p, '#site-nav') && await p.locator('#menu-toggle').getAttribute('aria-expanded') === 'true', 'Open state not exposed'); await p.locator('#menu-toggle').click(); assert(!(await shown(p, '#site-nav')) && await p.locator('#menu-toggle').getAttribute('aria-expanded') === 'false', 'Close state incorrect'); }],
    ['escape-restores-trigger', async p => { await p.locator('#menu-toggle').click(); await p.locator('#nav-engineering').focus(); await p.keyboard.press('Escape'); assert(!(await shown(p, '#site-nav')) && await active(p) === 'menu-toggle', 'Escape did not close and restore focus'); }],
    ['outside-action-survives', async p => { await p.locator('#menu-toggle').click(); await p.locator('#outside-action').click(); assert(!(await shown(p, '#site-nav')), 'Outside click left navigation open'); assert((await p.locator('#outside-status').innerText()).includes('completed'), 'Outside action was swallowed'); }],
    ['navigation-closes-panel', async p => { await p.locator('#menu-toggle').click(); await p.locator('#nav-engineering').click(); assert(!(await shown(p, '#site-nav')) && (await p.url()).endsWith('#engineering'), 'Link did not navigate and close'); }],
    ['desktop-navigation', async p => { await p.setViewportSize({ width: 1100, height: 760 }); await pause(p); assert(await shown(p, '#site-nav') && !(await shown(p, '#menu-toggle')), 'Desktop navigation incorrect'); }],
    ['no-javascript-navigation', async p => { assert(await shown(p, '#nav-engineering') && await shown(p, '#nav-essays'), 'Navigation hidden without JavaScript'); }, { javaScriptEnabled: false }],
    ['ordinary-navigation-semantics', async p => { await p.locator('#menu-toggle').click(); assert(await p.getByRole('navigation').count() >= 1, 'Missing navigation landmark'); assert(await p.getByRole('menu').count() === 0 && await p.getByRole('menuitem').count() === 0, 'Application-menu semantics used for website links'); }],
  ],
  T04: [
    ['no-premature-error', async p => { assert(!(await shown(p, '#email-error')) || !(await p.locator('#email-error').innerText()).trim(), 'Error shown before interaction'); assert(await p.locator('#email').getAttribute('aria-invalid') !== 'true', 'Premature invalid state'); }],
    ['empty-submit-feedback', async p => { await p.locator('#subscribe-submit').click(); assert(await shown(p, '#email-error') && (await p.locator('#email-error').innerText()).trim().length > 0, 'Missing inline error'); assert(await p.evaluate(() => window.fixtureState.subscriptions.length) === 0, 'Empty submission accepted'); }],
    ['malformed-submit-feedback', async p => { await p.locator('#email').fill('invalid-address'); await p.locator('#subscribe-submit').click(); assert(await shown(p, '#email-error') && (await p.locator('#email-error').innerText()).trim().length > 0, 'Malformed address lacks inline error'); assert(await p.evaluate(() => window.fixtureState.subscriptions.length) === 0, 'Malformed address accepted'); }],
    ['invalid-state-and-association', async p => { await p.locator('#subscribe-submit').click(); assert((await p.locator('#email').getAttribute('aria-describedby') ?? '').split(/\s+/).includes('email-error'), 'Error not associated with email'); assert(await p.locator('#email').evaluate(el => el.getAttribute('aria-invalid') === 'true' || el.matches(':user-invalid')), 'Invalid state not exposed'); }],
    ['correction-clears-stale-feedback', async p => { await p.locator('#subscribe-submit').click(); await p.locator('#email').fill('reader@example.test'); await p.locator('#email').blur(); await pause(p); assert(await p.locator('#email').getAttribute('aria-invalid') !== 'true', 'Stale invalid state'); assert(!(await shown(p, '#email-error')) || !(await p.locator('#email-error').innerText()).trim(), 'Stale error remains'); }],
    ['valid-submission-accepted-once', async p => { await p.locator('#email').fill('reader@example.test'); await p.locator('#subscribe-submit').click(); await pause(p); const submissions = await p.evaluate(() => window.fixtureState.subscriptions); assert(submissions.length === 1 && submissions[0] === 'reader@example.test', 'Wrong callback payload/count'); assert((await p.locator('#subscribe-status').innerText()).toLowerCase().includes('accepted'), 'Accepted result missing'); }],
    ['native-form-contract', async p => { const result = await p.locator('#email').evaluate(el => ({ type: el.type, required: el.required, label: el.labels?.length })); assert(result.type === 'email' && result.required && result.label > 0, 'Native field contract lost'); assert(await p.locator('#newsletter-form').getAttribute('method') === 'post' && await p.locator('#newsletter-form').getAttribute('action') === '/subscribe', 'Native action/method changed'); }],
    ['no-javascript-native-submit', async p => { assert(!(await p.locator('#email').evaluate(el => el.checkValidity())), 'Empty address passes native constraints'); await p.route('**/subscribe', route => route.fulfill({ status: 200, contentType: 'text/html', body: 'Fixture subscription received' })); await p.locator('#email').fill('reader@example.test'); const sent = p.waitForRequest(r => r.url().endsWith('/subscribe') && r.method() === 'POST', { timeout: 1500 }); await p.locator('#subscribe-submit').click(); await sent; }, { javaScriptEnabled: false }],
  ],
  T05: [
    ['buffer-while-visible', async p => { await queue(p, 'a'); assert((await attempts(p)).length === 0, 'Sent while visible'); }],
    ['hidden-flush-preserves-payload', async p => { await queue(p, 'a'); await queue(p, 'b'); await lifecycle(p, 'hidden'); const calls = await attempts(p); assert(calls.length === 1 && calls[0].method === 'beacon' && calls[0].url === '/events', 'Wrong hidden transport'); assert(JSON.stringify(names(calls[0])) === '["a","b"]', 'Queued events lost or changed'); }],
    ['hidden-pagehide-deduplicated', async p => { await queue(p, 'a'); await lifecycle(p, 'hidden'); await lifecycle(p, 'pagehide'); assert((await attempts(p)).length === 1, 'Duplicate batch across lifecycle events'); }],
    ['beacon-false-fetch-fallback', async p => { await p.evaluate(() => { window.__probe.beaconMode = false; }); await queue(p, 'a'); await lifecycle(p, 'hidden'); const calls = await attempts(p); assert(calls.length === 2 && calls[0].method === 'beacon' && calls[1].method === 'fetch', 'Missing fallback'); assert(calls[1].keepalive === true && calls[1].verb?.toUpperCase() === 'POST' && calls[1].url === '/events', 'Fallback transport contract wrong'); assert(names(calls[1])[0] === 'a', 'Fallback payload lost'); }],
    ['beacon-unavailable-fetch-fallback', async p => { await p.evaluate(() => Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true })); await queue(p, 'a'); await lifecycle(p, 'hidden'); const calls = await attempts(p); assert(calls.length === 1 && calls[0].method === 'fetch' && calls[0].keepalive === true && calls[0].verb?.toUpperCase() === 'POST', 'Absent beacon not handled'); }],
    ['failed-transport-retains-for-retry', async p => { await p.evaluate(() => { window.__probe.beaconMode = false; window.__probe.fetchMode = false; }); await queue(p, 'retry-me'); await lifecycle(p, 'hidden'); await p.evaluate(() => { window.__probe.beaconMode = true; window.__probe.fetchMode = true; }); await lifecycle(p, 'visible'); await lifecycle(p, 'hidden'); const calls = await attempts(p); assert(calls.length === 3 && names(calls[2])[0] === 'retry-me', 'Failed batch not retained'); }],
    ['persisted-pageshow-new-events-only', async p => { await queue(p, 'first'); await lifecycle(p, 'hidden'); await lifecycle(p, 'pagehide', true); await lifecycle(p, 'pageshow', true); await lifecycle(p, 'visible'); await queue(p, 'second'); await lifecycle(p, 'hidden'); const calls = await attempts(p); assert(calls.length === 2 && JSON.stringify(names(calls[1])) === '["second"]', 'Restoration duplicated or lost events'); }],
    ['no-bfcache-blocking-handlers', async p => { const result = await p.evaluate(() => ({ listeners: window.__probe.listeners, unload: !!window.onunload, beforeunload: !!window.onbeforeunload })); assert(!result.listeners.some(t => ['unload', 'beforeunload'].includes(t)) && !result.unload && !result.beforeunload, 'Blocking lifecycle handler registered'); }],
  ],
  T06: [
    ['no-javascript-readable', async p => { assert(await readable(p, '#reveal-one') && await readable(p, '#reveal-two'), 'Content hidden without JavaScript'); }, { javaScriptEnabled: false }],
    ['reduced-motion-immediate', async p => { assert(await readable(p, '#reveal-one') && await readable(p, '#reveal-two'), 'Reduced motion still hides/displaces content'); assert(await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length) === 0, 'Reduced-motion animation active'); }, { reducedMotion: 'reduce' }],
    ['missing-observer-readable', async p => { assert(await readable(p, '#reveal-one') && await readable(p, '#reveal-two'), 'Missing observer hides content'); }, { removeObserver: true }],
    ['offscreen-entry-reveals', async p => { await p.locator('#reveal-two').scrollIntoViewIfNeeded(); await p.waitForFunction(() => { const el = document.querySelector('#reveal-two'); const s = getComputedStyle(el); return Number(s.opacity) > .98 && s.transform === 'none'; }, null, { timeout: 4000 }); assert(await readable(p, '#reveal-two'), 'Entering card did not become readable'); }],
    ['initial-visible-card-reveals', async p => { await p.waitForFunction(() => { const el = document.querySelector('#reveal-one'); const s = getComputedStyle(el); return Number(s.opacity) > .98 && s.transform === 'none'; }, null, { timeout: 4000 }); assert(await readable(p, '#reveal-one'), 'Visible card remains hidden'); }],
    ['live-motion-preference-change', async p => { await p.emulateMedia({ reducedMotion: 'reduce' }); await pause(p); assert(await readable(p, '#reveal-one') && await readable(p, '#reveal-two'), 'Preference change did not reveal'); await p.emulateMedia({ reducedMotion: 'no-preference' }); await pause(p); assert(await readable(p, '#reveal-two'), 'Content disappeared when preference changed back'); }],
    ['removed-element-observation-cleaned', async p => { await p.locator('#reveal-two').evaluate(el => el.remove()); await pause(p); const active = await p.evaluate(() => window.__observerInstances.some(observer => [...observer.__observed].some(el => el.id === 'reveal-two'))); assert(!active, 'A removed element is still observed'); }, { monitorObserver: true }],
    ['content-and-links-preserved', async p => { assert(await p.locator('blog-reveal').count() === 2 && await p.locator('blog-reveal a[href]').count() === 2, 'Content instances or links removed'); assert((await p.locator('#reveal-two').textContent()).includes('Understand the limits'), 'Content replaced'); }],
  ],
};

export async function grade(task, folder, engines = ['chromium', 'webkit']) {
  if (!suites[task]) throw new Error(`Unknown task ${task}`);
  const server = createServer((request, response) => {
    const requested = new URL(request.url, 'http://localhost').pathname;
    const name = requested === '/' ? 'index.html' : requested.slice(1);
    if (name.includes('..')) { response.writeHead(403).end(); return; }
    try {
      const body = readFileSync(join(folder, name));
      response.setHeader('content-type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[extname(name)] ?? 'application/octet-stream');
      response.end(body);
    } catch { response.writeHead(404).end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const results = [];
  try {
    for (const engine of engines) {
      const browser = await playwright[engine].launch({ headless: true });
      try {
        for (const [id, test, options = {}] of suites[task]) {
          const { removeObserver, monitorObserver, removeNativeLightDismiss, ...contextOptions } = options;
          const context = await browser.newContext({ viewport: { width: 375, height: 760 }, reducedMotion: 'no-preference', ...contextOptions });
          const page = await context.newPage(); page.setDefaultTimeout(1600);
          const errors = []; page.on('pageerror', e => errors.push(e.message));
          try {
            if (task === 'T05') await context.addInitScript(analyticsProbe);
            if (removeObserver) await context.addInitScript(() => { delete window.IntersectionObserver; });
            if (removeNativeLightDismiss) await context.addInitScript(() => {
              delete HTMLDialogElement.prototype.closedBy;
              const set = Element.prototype.setAttribute;
              Element.prototype.setAttribute = function(name, value) {
                if (this.localName === 'dialog' && name.toLowerCase() === 'closedby') return;
                return set.call(this, name, value);
              };
              new MutationObserver(() => {
                for (const dialog of document.querySelectorAll('dialog[closedby]')) dialog.removeAttribute('closedby');
              }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['closedby'] });
            });
            if (monitorObserver) await context.addInitScript(() => {
              window.__observationCleanup = 0;
              window.__observerInstances = [];
              const Native = window.IntersectionObserver;
              window.IntersectionObserver = class extends Native {
                constructor(...args) { super(...args); this.__observed = new Set(); window.__observerInstances.push(this); }
                observe(el) { this.__observed.add(el); super.observe(el); }
                disconnect() { this.__observed.clear(); window.__observationCleanup++; super.disconnect(); }
                unobserve(el) { this.__observed.delete(el); if (el.id === 'reveal-two') window.__observationCleanup++; super.unobserve(el); }
              };
            });
            await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' }); await pause(page);
            await test(page);
            assert(errors.length === 0, `Runtime errors: ${errors.join('; ')}`);
            results.push({ engine, browserVersion: browser.version(), id, passed: true });
          } catch (error) {
            results.push({ engine, browserVersion: browser.version(), id, passed: false, error: String(error.message).slice(0,700), runtimeErrors: errors });
          } finally { await context.close(); }
        }
      } finally { await browser.close(); }
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
  return { task, checkCount: results.length, passed: results.filter(row => row.passed).length, results };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [task, folder, out] = process.argv.slice(2);
  const result = await grade(task, resolve(folder));
  writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ task, passed: result.passed, checks: result.checkCount, output: out }));
}
