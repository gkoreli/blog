#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Code: MIT. These hand-selected examples test an explicit extraction contract,
// not operator identity, human labels, a representative population or accuracy.
const [option, adapterPath, extra] = process.argv.slice(2);
try {
  if (extra || (option !== '--demo' && option !== '--adapter') || (option === '--demo' && adapterPath) || (option === '--adapter' && !adapterPath)) {
    throw Error('Usage: node check.mjs --demo | --adapter /absolute/path/to/adapter.mjs');
  }
  const bytes = await readFile(new URL('./cases.json', import.meta.url));
  const cases = JSON.parse(bytes.toString('utf8'));
  // This deliberately weak example searches the whole header. It is not the
  // complete historical blog classifier or any third-party implementation.
  const demo = userAgent => {
    const namedClients = ['GPTBot', 'ChatGPT-User', 'Googlebot'].filter(name => userAgent.includes(name));
    return { namedClients, automationClaim: namedClients.length > 0 || /bot\b|phantom/i.test(userAgent) };
  };
  const adapter = option === '--demo' ? demo : (await import(pathToFileURL(resolve(adapterPath)).href)).default;
  if (typeof adapter !== 'function') throw Error('Adapter must export a default function.');
  const rows = [];
  for (const fixture of cases) {
    try {
      const actual = await adapter(fixture.userAgent);
      if (actual === null || typeof actual !== 'object' || !Array.isArray(actual.namedClients)
        || !actual.namedClients.every(value => typeof value === 'string') || typeof actual.automationClaim !== 'boolean') {
        throw Error('Adapter must return { namedClients: string[], automationClaim: boolean }.');
      }
      const actualNames = [...actual.namedClients].sort();
      const expectedNames = [...fixture.namedClients].sort();
      rows.push({ id: fixture.id, passed: JSON.stringify(actualNames) === JSON.stringify(expectedNames)
        && actual.automationClaim === fixture.automationClaim,
      expected: { namedClients: expectedNames, automationClaim: fixture.automationClaim },
      actual: { namedClients: actualNames, automationClaim: actual.automationClaim }, lesson: fixture.lesson });
    } catch (error) {
      rows.push({ id: fixture.id, passed: false, error: error instanceof Error ? error.message : 'Adapter failed.' });
    }
  }
  const passed = rows.filter(row => row.passed).length;
  console.log(JSON.stringify({ schemaVersion: 1, mode: option === '--demo' ? 'deliberately-weak-demo' : 'supplied-adapter',
    fixtureSha256: createHash('sha256').update(bytes).digest('hex'), cases: rows.length, passed,
    failed: rows.length - passed, scope: 'Selected lexical extraction controls; no traffic population or operator labels.', rows }, null, 2));
  if (passed !== rows.length) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : 'User-Agent check failed.');
  process.exitCode = 2;
}
