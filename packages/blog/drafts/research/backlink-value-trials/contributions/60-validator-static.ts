// Hand-written validation, paired with 61-validator-generated.ts.
// Same data and checks; only the implementation of validate changes.
interface Row { name: string | null; age: number; enabled: boolean }
const minimumAge = Number(process.argv[2] ?? '18');
if (!Number.isInteger(minimumAge)) throw new Error('minimum age must be an integer');
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
function validate(value: Row): boolean {
  return typeof value.name === 'string' && value.name.length >= 3
    && Number.isInteger(value.age) && value.age >= minimumAge && value.enabled === true;
}
let accepted = 0;
for (let round = 0; round < 1_000_000; round++) {
  // Mutate an input on every round; prevent precomputing a constant result.
  changing.age = round % 40;
  for (const row of rows) if (validate(row)) accepted++;
}
console.log('RESULT ' + accepted);
