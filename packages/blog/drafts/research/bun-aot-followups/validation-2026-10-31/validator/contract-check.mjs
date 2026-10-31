import { deepCases } from './deep-cases.mjs';
const { makeValidator } = USE_ADAPTED ? await import('./adapted.mjs') : await import('./runtime.mjs');
const rows = [];
for (const kind of ['simple', 'nested', 'defaults']) {
  const validator = makeValidator(kind);
  for (const test of deepCases(kind)) {
    const input = structuredClone(test.value);
    const result = validator.validate(input);
    rows.push({ kind, name: test.name, expected: test.expected, actual: result.valid,
      data_is_input: result.valid ? result.data === input : null,
      input, result: JSON.parse(JSON.stringify(result)) });
  }
}
console.log(JSON.stringify(rows));
if (rows.some(row => row.actual !== row.expected || (row.actual && !row.data_is_input))) process.exit(1);
