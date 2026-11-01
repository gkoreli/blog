import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { responseSchema } from './database.mjs';

const require = createRequire(import.meta.url);
const fastifyRequire = createRequire(require.resolve('fastify'));
const build = fastifyRequire('fast-json-stringify');
const generated = build(responseSchema);
const expected = JSON.parse(readFileSync('cases.json', 'utf8')).cases[0].expected_json;
const results = [];
for (const [name, change] of [
  ['fixture', () => {}],
  ['extra-fields', (v) => { v.internalNote = 'test-only'; v.user.internalFlag = true; }],
  ['numeric-string', (v) => { v.user.id = '42'; }],
]) {
  const value = structuredClone(expected);
  change(value);
  const fast = generated(value);
  const plain = JSON.stringify(value);
  results.push({ name, same_bytes: fast === plain,
    generated_bytes: Buffer.byteLength(fast), json_bytes: Buffer.byteLength(plain),
    generated_keys: Object.keys(JSON.parse(fast)), json_keys: Object.keys(JSON.parse(plain)),
    generated_user_keys: Object.keys(JSON.parse(fast).user),
    json_user_keys: Object.keys(JSON.parse(plain).user),
    generated_id_type: typeof JSON.parse(fast).user.id,
    json_id_type: typeof JSON.parse(plain).user.id,
  });
}
if (!results[0].same_bytes || results[1].same_bytes || results[2].same_bytes) {
  throw new Error('Serializer control does not match the declared semantic boundaries');
}
console.log(JSON.stringify(results, null, 2));
