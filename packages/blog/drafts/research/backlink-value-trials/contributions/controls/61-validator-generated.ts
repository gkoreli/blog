// Runtime-generated validation, paired with 60-validator-static.ts.
// Models the execution mechanism, not the performance of a named library.
interface Row { name: string | null; age: number; enabled: boolean }
const changing: Row = { name: 'Ada', age: 37, enabled: true };
const rows: Row[] = [
  changing,
  { name: 'Bo', age: 40, enabled: true },
  { name: null, age: 24, enabled: true },
  { name: 'Lin', age: 17, enabled: true },
  { name: 'Pat', age: 22.5, enabled: true },
  { name: 'Sam', age: 28, enabled: false },
  { name: 'Ren', age: 19, enabled: true },
  { name: '', age: 21, enabled: true },
  { name: 'Max', age: NaN, enabled: true },
  { name: 'Kai', age: 60, enabled: true },
];
const generated = new Function('value',
  'return typeof value.name === "string" && value.name.length >= 3'
  + ' && Number.isInteger(value.age) && value.age >= 18 && value.enabled === true;');
function validate(value: Row): boolean { return Boolean(generated(value)); }
let accepted = 0;
for (let round = 0; round < 1_000_000; round++) {
  changing.age = round % 40;
  for (const row of rows) if (validate(row)) accepted++;
}
console.log('RESULT ' + accepted);
