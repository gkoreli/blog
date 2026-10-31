// Build with --define USE_STANDALONE=true or false; both imports are then
// selected at build time, so the runtime package cannot mark standalone tests.
import { deepCases } from './deep-cases.mjs';
const { makeValidator } = USE_STANDALONE
  ? await import('./standalone.mjs')
  : await import('./runtime.mjs');
const rows = [];
for (const kind of ['simple', 'nested', 'defaults']) {
  const validator = makeValidator(kind);
  for (const test of deepCases(kind)) {
    const input = structuredClone(test.value);
    const result = validator.validate(input);
    rows.push({ kind, name: test.name, engine: validator.engine, expected: test.expected,
      actual: result.valid, input, result: JSON.parse(JSON.stringify(result)) });
  }
}
console.log(JSON.stringify(rows));
if (rows.some(row => row.expected !== row.actual)) process.exit(1);
