import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

// Works beside the fixtures in this research directory, or under upstream's
// harness/ when the two fixtures are copied into its benches/ directory.
const fixtures = existsSync(join(import.meta.dirname, '60-validator-static.ts'))
  ? import.meta.dirname : join(import.meta.dirname, '..', 'benches');
const variants = ['60-validator-static.ts', '61-validator-generated.ts'];

function oracle(minimumAge) {
  const fixed = [17, 19, 60].filter(age => age >= minimumAge).length * 1_000_000;
  const changing = Array.from({length: 40}, (_, age) => age)
    .filter(age => age >= minimumAge).length * 25_000;
  return `RESULT ${fixed + changing}\n`;
}

test('static and generated implementations match an independent count for runtime inputs', () => {
  for (const minimumAge of [0, 18, 29, 61]) {
    for (const variant of variants) {
      const result = spawnSync(process.execPath, [join(fixtures, variant), String(minimumAge)], {
        encoding: 'utf8', timeout: 15_000,
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, oracle(minimumAge), `${variant}, minimumAge=${minimumAge}`);
    }
  }
});

test('both fixtures reject a noninteger runtime threshold', () => {
  for (const variant of variants) {
    const result = spawnSync(process.execPath, [join(fixtures, variant), '18.5'], {encoding:'utf8', timeout:15_000});
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /minimum age must be an integer/);
  }
});
