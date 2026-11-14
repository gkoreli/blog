import assert from 'node:assert/strict';
import test from 'node:test';
import { html } from '@nisli/core';
import { localizeTimeElements, localTimeElement } from '../src/client/local-time.js';
import { localTimeHtml } from '../src/lib/local-time.js';
import { renderContent } from '../src/lib/ssg.js';
import { parseClientErrorPayload } from '../../client-observability/src/schema.js';

await renderContent([html`<p>Time fixture</p>`]);

test('SSR instants progressively localize without shifting publication dates or raw evidence', () => {
  const root = document.createElement('section');
  root.innerHTML = localTimeHtml('2026-11-07T00:00:00Z')
    + '<time datetime="2026-11-07">November 7, 2026</time>'
    + '<pre>2026-11-07T00:00:00Z</pre>'
    + '<time datetime="bad" data-local-time>Unavailable</time>';
  const instant = root.querySelector('time'); assert.ok(instant);
  assert.match(instant.textContent ?? '', /Nov 7, 2026, 12:00 AM UTC/);
  const options = { timeZone: 'America/Los_Angeles', locale: 'en-US' };
  assert.equal(localizeTimeElements(root, options), 1);
  assert.equal(instant.textContent, 'Nov 6, 2026, 4:00 PM PST');
  assert.equal(instant.getAttribute('datetime'), '2026-11-07T00:00:00.000Z');
  assert.equal(root.querySelectorAll('time')[1]?.textContent, 'November 7, 2026');
  assert.equal(root.querySelectorAll('time')[2]?.textContent, 'Unavailable');
  assert.equal(root.querySelector('pre')?.textContent, '2026-11-07T00:00:00Z');
  assert.equal(localizeTimeElements(root, options), 1);
  assert.equal(instant.textContent, 'Nov 6, 2026, 4:00 PM PST');
  assert.throws(() => localTimeHtml('2026-11-07T00:00:00'), RangeError);
});

test('dynamic and SSR time elements share repeated-hour labels and exact UTC instants', () => {
  const options = { timeZone: 'America/Los_Angeles', locale: 'en-US' };
  const root = document.createElement('section');
  root.innerHTML = localTimeHtml('2026-11-01T08:30:00Z') + localTimeHtml('2026-11-01T09:30:00Z');
  localizeTimeElements(root, options);
  for (const [index, value] of ['2026-11-01T08:30:00Z', '2026-11-01T09:30:00Z'].entries()) {
    const dynamic = localTimeElement(value, options), rendered = root.querySelectorAll('time')[index];
    assert.equal(dynamic.textContent, rendered?.textContent);
    assert.equal(dynamic.getAttribute('datetime'), rendered?.getAttribute('datetime'));
  }
  assert.match(root.querySelectorAll('time')[0]?.textContent ?? '', /1:30 AM PDT/);
  assert.match(root.querySelectorAll('time')[1]?.textContent ?? '', /1:30 AM PST/);
});

test('client-error ingestion normalizes offsets and rejects ambiguous or impossible event times', () => {
  const event = { type: 'interaction_error', component: 'fixture', message: 'Fixture', path: '/', occurredAt: '2026-11-06T16:00:00-08:00' };
  assert.equal(parseClientErrorPayload(event)?.occurredAt, '2026-11-07T00:00:00.000Z');
  for (const occurredAt of ['2026-11-07', '2026-11-07T00:00:00', '2026-02-30T00:00:00Z']) {
    assert.equal(parseClientErrorPayload({ ...event, occurredAt }), null);
  }
});

test('the real research-footprint template renders native time elements before localization', async () => {
  const { parsePost } = await import('../src/lib/frontmatter.js');
  const { researchFootprint } = await import('../src/pages/research-footprint.js');
  const { fileURLToPath } = await import('node:url');
  const { utcInstant, timePresentation } = await import('@gkoreli/time');
  const { meta } = parsePost(fileURLToPath(new URL('../posts/023-which-ai-fetchers-send-which-headers.md', import.meta.url)));
  assert.ok(meta.researchFootprint);
  const template = researchFootprint(meta);
  if (typeof template === 'string') assert.fail('Research footprint must render');
  const [snapshot] = await renderContent([template]); assert.ok(snapshot);
  assert.doesNotMatch(snapshot, /\[object Object\]/);
  const root = document.createElement('section'); root.innerHTML = snapshot;
  const times = root.querySelectorAll('time[data-local-time]'); assert.equal(times.length, 2);
  assert.equal(times[0]?.getAttribute('datetime'), utcInstant(meta.researchFootprint.startedAt));
  assert.equal(times[1]?.getAttribute('datetime'), utcInstant(meta.researchFootprint.measuredAt));
  assert.equal(localizeTimeElements(root, { timeZone: 'Asia/Kathmandu', locale: 'en-US' }), 2);
  const view = timePresentation({ timeZone: 'Asia/Kathmandu', locale: 'en-US' });
  assert.equal(times[0]?.textContent, view.instant(meta.researchFootprint.startedAt));
  assert.equal(times[1]?.textContent, view.instant(meta.researchFootprint.measuredAt));
});
