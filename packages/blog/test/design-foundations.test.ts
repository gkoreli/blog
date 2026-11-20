import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dropdown } from '@gkoreli/design/dropdown';
import { renderContent } from '../src/lib/ssg.js';

test('a shared dropdown keeps its form name, accessible labels and selected option in static HTML', async () => {
  const [markup] = await renderContent([dropdown({
    id: 'sample-scope', name: 'scope', label: 'Scope', describedBy: 'scope-note', value: 'all',
    options: [{ value: '', label: 'Choose' }, { value: 'all', label: 'All <events>', accessibleLabel: 'All recorded events' }],
  })]);
  assert.ok(markup);
  const form = document.createElement('form');
  form.innerHTML = markup;
  const select = form.querySelector('select');
  assert.ok(select);
  assert.equal(form.querySelector('label')?.htmlFor, select.id);
  assert.equal(select.name, 'scope');
  assert.equal(select.disabled, false);
  assert.equal(select.getAttribute('aria-describedby'), 'scope-note');
  const option = select.querySelector('option[selected]');
  assert.equal(option?.getAttribute('value'), 'all');
  assert.equal(option?.textContent?.trim(), 'All <events>');
  assert.equal(option?.getAttribute('aria-label'), 'All recorded events');
});

function luminance(color: string): number {
  assert.match(color, /^#[\da-f]{6}$/iu);
  const channel = (start: number) => { const value = Number.parseInt(color.slice(start, start + 2), 16) / 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; };
  return .2126 * channel(1) + .7152 * channel(3) + .0722 * channel(5);
}
function contrast(a: string, b: string): number { const left = luminance(a), right = luminance(b); return (Math.max(left, right) + .05) / (Math.min(left, right) + .05); }
function colors(source: string): Map<string, string> {
  const values = new Map<string, string>();
  for (const match of source.matchAll(/--([\w-]+):\s*(#[\da-f]{6})/giu)) {
    const [, name, value] = match;
    if (name && value) values.set(name, value);
  }
  return values;
}

test('text, action and control roles remain readable on each neutral surface in both themes', () => {
  const css = readFileSync(new URL('../../design/tokens.css', import.meta.url), 'utf8');
  const parts = css.split('[data-theme="dark"]');
  const first = parts[0]; assert.ok(first);
  const base = colors(first);
  for (const [theme, block] of parts.entries()) {
    const tokens = new Map([...base, ...colors(block)]);
    const token = (name: string) => { const value = tokens.get(name); assert.ok(value, name); return value; };
    for (const background of ['color-bg', 'color-surface', 'color-surface-2']) {
      for (const role of ['color-text', 'color-text-secondary', 'color-link', 'color-ink-warm', 'color-ink-rust', 'color-ink-blue']) assert.ok(contrast(token(role), token(background)) >= 4.5, `${theme}:${role} on ${background}`);
      assert.ok(contrast(token('color-control-border'), token(background)) >= 3, `${theme}:control on ${background}`);
    }
    assert.ok(contrast(token('color-on-action'), token('color-link')) >= 4.5);
    assert.ok(contrast(token('color-on-header'), token('color-header')) >= 4.5);
  }
});
