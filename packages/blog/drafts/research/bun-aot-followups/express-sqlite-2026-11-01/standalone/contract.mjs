import build from 'fast-json-stringify';
import { readFileSync } from 'node:fs';
import { responseSchema } from './database.mjs';
import standalone from './serializer.cjs';

const generated = build(responseSchema);
const expected = JSON.parse(readFileSync('cases.json', 'utf8')).cases[0].expected_json;
const rows = [];
for (const [name, change] of [
  ['fixture', () => {}],
  ['extra-fields', (v) => { v.internalNote = 'test-only'; v.user.internalFlag = true; }],
  ['numeric-string', (v) => { v.user.id = '42'; }],
  ['missing-required', (v) => { delete v.user.name; }],
]) {
  const value = structuredClone(expected);
  change(value);
  const outcomes = [];
  for (const serialize of [generated, standalone]) {
    try { outcomes.push({ output: serialize(value) }); }
    catch (error) { outcomes.push({ error: String(error) }); }
  }
  const same = JSON.stringify(outcomes[0]) === JSON.stringify(outcomes[1]);
  if (!same) throw new Error(`Serializer contract differs for ${name}`);
  rows.push({ name, same, throws: 'error' in outcomes[0],
    bytes: 'output' in outcomes[0] ? Buffer.byteLength(outcomes[0].output) : null });
}
console.log(JSON.stringify(rows, null, 2));
